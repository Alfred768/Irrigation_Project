import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIrrigationForecastSchema, cropThresholds, soilTypes } from "@shared/schema";
import { z } from "zod";

interface WeatherApiResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{ main: string; description: string }>;
    wind: { speed: number };
    rain?: { "3h"?: number };
    pop?: number;
  }>;
}

async function fetchWeatherData(latitude: number, longitude: number, days: number) {
  const apiKey = "8df5093cf8154b18cf2cda27f8e16193";
  // const apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || "demo_key";
  
  // if (apiKey === "demo_key") {
  //   throw new Error("Weather API key not configured. Please set OPENWEATHER_API_KEY environment variable.");
  // }

  const url = `https://api.openweathermap.org/data/2.0/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(`Invalid API key. Please check your OpenWeatherMap API key and ensure your account is activated. Status: ${response.status}`);
    }
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data: WeatherApiResponse = await response.json();
  
  // Group by day and calculate daily averages
  const dailyData: { [date: string]: any } = {};
  
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        humidity: [],
        windSpeed: [],
        precipitation: 0,
        weather: item.weather[0]?.main || "Clear"
      };
    }
    
    dailyData[date].temps.push(item.main.temp);
    dailyData[date].humidity.push(item.main.humidity);
    dailyData[date].windSpeed.push(item.wind.speed);
    dailyData[date].precipitation += (item.rain?.["3h"] || 0);
  });
  
  return Object.entries(dailyData).slice(0, days).map(([date, data]) => ({
    date,
    precipitation: data.precipitation,
    evaporation: calculateEvaporation(
      data.temps.reduce((a: number, b: number) => a + b, 0) / data.temps.length,
      data.humidity.reduce((a: number, b: number) => a + b, 0) / data.humidity.length,
      data.windSpeed.reduce((a: number, b: number) => a + b, 0) / data.windSpeed.length
    ),
    temperature: data.temps.reduce((a: number, b: number) => a + b, 0) / data.temps.length,
    humidity: data.humidity.reduce((a: number, b: number) => a + b, 0) / data.humidity.length,
    windSpeed: data.windSpeed.reduce((a: number, b: number) => a + b, 0) / data.windSpeed.length,
    weather: data.weather
  }));
}

function calculateEvaporation(temp: number, humidity: number, windSpeed: number): number {
  // Simplified Penman equation for reference evapotranspiration
  const delta = 4098 * (0.6108 * Math.exp(17.27 * temp / (temp + 237.3))) / Math.pow(temp + 237.3, 2);
  const gamma = 0.665; // psychrometric constant
  const u2 = windSpeed * 4.87 / Math.log(67.8 * 10 - 5.42); // wind speed at 2m height
  
  // Simplified calculation (mm/day)
  const et0 = (0.0023 * (temp + 17.8) * Math.sqrt(Math.abs(temp - humidity)) * (100 - humidity) / 100) + (0.0001 * u2);
  return Math.max(0, Math.min(15, et0)); // Cap between 0-15 mm/day
}

function determineSoilType(latitude: number, longitude: number): string {
  // Simplified soil type determination based on geographic regions
  // In reality, this would use soil databases or APIs
  const absLat = Math.abs(latitude);
  const absLon = Math.abs(longitude);
  
  if (absLat > 60) return "sandy"; // Arctic regions
  if (absLat < 30 && absLon < 50) return "clay"; // Tropical regions
  if (absLat >= 30 && absLat <= 50) return "clayLoam"; // Temperate regions
  return "loam"; // Default
}

function calculateSoilMoisture(
  initialMoisture: number,
  precipitation: number,
  evaporation: number,
  cropWaterUse: number,
  soilType: keyof typeof soilTypes
): number {
  const soil = soilTypes[soilType];
  const waterInput = precipitation;
  const waterOutput = evaporation + cropWaterUse;
  const drainage = Math.max(0, (initialMoisture + waterInput - waterOutput) * soil.drainageRate);
  
  let newMoisture = initialMoisture + waterInput - waterOutput - drainage;
  return Math.max(0, Math.min(100, newMoisture));
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, forecastData } = req.body;
  
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
  
      const apiKey = "AIzaSyBaOQMQbeP-ACNwGlZ_XxTrbkhn1AZ2300";
  
      // 构建上下文
      let context = "你是一个专业的农业种植AI助手。请用中文回答用户的问题，提供实用的种植建议。";
  
      if (forecastData) {
        context += `\n\n当前用户的农场信息：
  - 作物类型: ${forecastData.cropType || '未知'}
  - 土壤类型: ${forecastData.soilType || '未知'}
  - 当前土壤湿度: ${forecastData.currentMoisture || '未知'}%
  - 位置: 纬度 ${forecastData.location?.latitude || '未知'}, 经度 ${forecastData.location?.longitude || '未知'}`;
  
        if (forecastData.weatherSummary) {
          context += "\n- 未来几天天气预测: " +
            forecastData.weatherSummary.map((day: any) =>
              `${day.date}: 温度${day.temperature?.toFixed(1)}°C, 降水${day.precipitation?.toFixed(1)}mm`
            ).join("; ");
        }
      }
  
      // 请求体
      const geminiRequestBody = {
        prompt: {
          messages: [
            { author: "system", content: context },
            { author: "user", content: message }
          ]
        },
        temperature: 0.7,
        candidateCount: 1,
        topP: 0.8,
        topK: 40
      };
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(geminiRequestBody)
        }
      );
  
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      const aiResponse = data?.candidates?.[0]?.content || "抱歉，我无法理解您的问题。请重新表述一下。";
  
      res.json({ response: aiResponse });
  
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to get AI response"
      });
    }
  });
  
  app.post("/api/irrigation-forecast", async (req, res) => {
    try {
      const validatedData = insertIrrigationForecastSchema.parse(req.body);
      
      // Create initial forecast record
      const forecast = await storage.createIrrigationForecast(validatedData);
      
      // Determine soil type based on coordinates
      const soilType = determineSoilType(validatedData.latitude, validatedData.longitude);
      
      // Fetch weather data
      const weatherData = await fetchWeatherData(
        validatedData.latitude,
        validatedData.longitude,
        validatedData.forecastPeriod
      );
      
      // Store weather data
      const storedWeatherData = await storage.createWeatherData(
        weatherData.map(w => ({ 
          date: w.date,
          forecastId: forecast.id,
          precipitation: w.precipitation,
          evaporation: w.evaporation,
          temperature: w.temperature,
          humidity: w.humidity,
          windSpeed: w.windSpeed
        }))
      );
      
      // Calculate irrigation schedule
      const cropInfo = cropThresholds[validatedData.cropType as keyof typeof cropThresholds];
      let currentMoisture = 65; // Starting soil moisture percentage
      
      const schedule = weatherData.map((day, index) => {
        currentMoisture = calculateSoilMoisture(
          currentMoisture,
          day.precipitation,
          day.evaporation,
          cropInfo.waterUse,
          soilType as keyof typeof soilTypes
        );
        
        const irrigationNeeded = currentMoisture < cropInfo.critical;
        const irrigationVolume = irrigationNeeded ? 
          Math.ceil((cropInfo.optimal - currentMoisture) * 0.5) : 0;
        
        // Apply irrigation if needed
        if (irrigationNeeded) {
          currentMoisture += irrigationVolume;
        }
        
        return {
          forecastId: forecast.id,
          date: day.date,
          soilMoisture: Math.round(currentMoisture * 10) / 10,
          irrigationNeeded,
          irrigationVolume: irrigationNeeded ? irrigationVolume : null,
          weather: day.weather.toString()
        };
      });
      
      // Store irrigation schedule
      const storedSchedule = await storage.createIrrigationSchedule(schedule);
      
      // Update forecast with soil type and current moisture
      const updatedForecast = await storage.updateIrrigationForecast(forecast.id, {
        soilType,
        currentSoilMoisture: currentMoisture
      });
      
      res.json({
        forecast: updatedForecast,
        weatherData: storedWeatherData,
        schedule: storedSchedule,
        soilType,
        cropInfo
      });
      
    } catch (error) {
      console.error("Error creating irrigation forecast:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create irrigation forecast"
      });
    }
  });

  app.get("/api/irrigation-forecast/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const forecast = await storage.getIrrigationForecast(id);
      
      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      
      const weatherData = await storage.getWeatherDataByForecastId(id);
      const schedule = await storage.getIrrigationScheduleByForecastId(id);
      
      res.json({
        forecast,
        weatherData,
        schedule
      });
      
    } catch (error) {
      console.error("Error fetching irrigation forecast:", error);
      res.status(500).json({ message: "Failed to fetch irrigation forecast" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
