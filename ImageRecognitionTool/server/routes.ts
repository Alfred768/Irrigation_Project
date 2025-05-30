import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIrrigationForecastSchema, cropThresholds, soilTypes } from "@shared/schema";
import { z } from "zod";
const AGRO_API_KEY = "ca01c833004206b018aa226e8cc72131"; // 请用你自己的key

// 自动生成一个小方形多边形坐标（示范）
// 生成正方形多边形，坐标顺序经度、纬度，闭合点相同
function generateSquarePolygon(lat: number, lon: number, sizeInMeters = 150) { // 150米边长更保险
  const delta = sizeInMeters / 111000;
  const coordinates = [
    [lon - delta, lat - delta],
    [lon - delta, lat + delta],
    [lon + delta, lat + delta],
    [lon + delta, lat - delta],
  ];
  coordinates.push(coordinates[0]);
  return coordinates;
}

async function createPolygon(lat: number, lon: number): Promise<string> {
  const polygonCoordinates = generateSquarePolygon(lat, lon);
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [polygonCoordinates],
    },
  };

  const response = await fetch(
    `http://api.agromonitoring.com/agro/1.0/polygons?appid=${AGRO_API_KEY}&duplicated=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Field_${lat.toFixed(4)}_${lon.toFixed(4)}`,
        geo_json: geojson,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create polygon: ${response.statusText} ${errorData.message || ''}`);
  }

  const data = await response.json();
  return data.id;
}

async function fetchSoilMoistureByPolyId(polyid: string): Promise<number | null> {
  const response = await fetch(
    `http://api.agromonitoring.com/agro/1.0/soil?polyid=${polyid}&appid=${AGRO_API_KEY}`
  );

  if (!response.ok) {
    console.warn("Failed to fetch soil data", response.statusText);
    return null;
  }

  const data = await response.json();
  // moisture 返回单位是 m3/m3，转为百分比乘以100
  return data.moisture ? data.moisture * 100 : null;
}

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
  const url = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${latitude}&lon=${longitude}&cnt=${days}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.daily && !data.list) {
    throw new Error("Weather API returned empty or invalid data.");
  }

  return data.list.map((day: any) => ({
    rawDate: new Date(day.dt * 1000).toISOString().split("T")[0],
    temperature: day.temp.day,
    humidity: day.humidity,
    windSpeed: day.speed,
    precipitation: day.rain || 0,
    evaporation: calculateEvaporation(day.temp.day, day.humidity, day.speed),
    weather: day.weather?.[0]?.main || "Clear"
  }));
}

function calculateEvaporation(temp: number, humidity: number, windSpeed: number): number {
  const delta = 4098 * (0.6108 * Math.exp(17.27 * temp / (temp + 237.3))) / Math.pow(temp + 237.3, 2);
  const gamma = 0.665;
  const u2 = windSpeed * 4.87 / Math.log(67.8 * 10 - 5.42);
  const et0 = (0.0023 * (temp + 17.8) * Math.sqrt(Math.abs(temp - humidity)) * (100 - humidity) / 100) + (0.0001 * u2);
  return Math.max(0, Math.min(15, et0));
}

function determineSoilType(latitude: number, longitude: number): string {
  const absLat = Math.abs(latitude);
  const absLon = Math.abs(longitude);
  if (absLat > 60) return "sandy";
  if (absLat < 30 && absLon < 50) return "clay";
  if (absLat >= 30 && absLat <= 50) return "clayLoam";
  return "loam";
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
  
      const apiKey = process.env.DEEPSEEK_API_KEY || "sk-64e3249d0dcd43268038f0946c2a7bce";
  
      let context = "You are a professional AI assistant helping with agriculture.";
  
      if (forecastData) {
        context += `\n\nCrop: ${forecastData.cropType}, Soil: ${forecastData.soilType}, Moisture: ${forecastData.currentMoisture}%.`;
      }
  
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: context },
            { role: "user", content: message }
          ]
        })
      });
  
      const data = await response.json();
      console.log("🔍 DeepSeek response:", JSON.stringify(data, null, 2));
  
      if (!response.ok) {
        return res.status(response.status).json({
          message: data?.error?.message || "Failed to get DeepSeek response"
        });
      }
  
      const aiResponse = data?.choices?.[0]?.message?.content;
  
      if (!aiResponse) {
        return res.status(500).json({ message: "DeepSeek returned no content" });
      }
  
      res.json({ response: aiResponse });
  
    } catch (err) {
      console.error("❌ Error in DeepSeek chat:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  app.post("/api/irrigation-forecast", async (req, res) => {
    try {
      const validatedData = insertIrrigationForecastSchema.parse(req.body);
      const forecast = await storage.createIrrigationForecast(validatedData);
      const soilType = determineSoilType(validatedData.latitude, validatedData.longitude);
  
      const weatherData = await fetchWeatherData(
        validatedData.latitude,
        validatedData.longitude,
        validatedData.forecastPeriod
      );
  
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
  
      // === 新增：先创建多边形获取 polyid ===
      const polyid = await createPolygon(validatedData.latitude, validatedData.longitude);
  
      // === 新增：调用土壤湿度接口获取初始湿度 ===
      let currentMoisture = await fetchSoilMoistureByPolyId(polyid);
  
      // 若获取失败，退回默认值
      if (currentMoisture === null) {
        currentMoisture = 40 + Math.random() * 20;
      }
  
      const cropInfo = cropThresholds[validatedData.cropType as keyof typeof cropThresholds];
  
      // 计算种植日期
      const [year, month, day] = validatedData.plantingDate.split("-").map(Number);
      const plantingStartDate = new Date(year, month - 1, day);
  
      const schedule = weatherData.map((day, index) => {
        const forecastDate = new Date(plantingStartDate);
        forecastDate.setDate(plantingStartDate.getDate() + index);
  
        const formattedDate = forecastDate.toLocaleDateString('en-CA'); // yyyy-MM-dd
  
        currentMoisture = calculateSoilMoisture(
          currentMoisture!,
          day.precipitation,
          day.evaporation,
          cropInfo.waterUse,
          soilType as keyof typeof soilTypes
        );
  
        const enoughRain = day.precipitation >= cropInfo.waterUse;
        const irrigationNeeded = !enoughRain && currentMoisture < cropInfo.critical;
        const irrigationVolume = irrigationNeeded
          ? Math.ceil((cropInfo.optimal - currentMoisture) * 0.5)
          : 0;
  
        if (irrigationNeeded) {
          currentMoisture += irrigationVolume;
        }
  
        return {
          forecastId: forecast.id,
          date: formattedDate,
          soilMoisture: Math.round(currentMoisture * 10) / 10,
          irrigationNeeded,
          irrigationVolume: irrigationNeeded ? irrigationVolume : null,
          weather: day.weather.toString()
        };
      });
  
      const storedSchedule = await storage.createIrrigationSchedule(schedule);
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