import { 
  irrigationForecasts, 
  weatherData, 
  irrigationSchedule,
  type IrrigationForecast, 
  type InsertIrrigationForecast,
  type WeatherData,
  type IrrigationSchedule
} from "@shared/schema";

export interface IStorage {
  createIrrigationForecast(forecast: InsertIrrigationForecast): Promise<IrrigationForecast>;
  getIrrigationForecast(id: number): Promise<IrrigationForecast | undefined>;
  updateIrrigationForecast(id: number, updates: Partial<IrrigationForecast>): Promise<IrrigationForecast | undefined>;
  
  createWeatherData(data: Omit<WeatherData, 'id'>[]): Promise<WeatherData[]>;
  getWeatherDataByForecastId(forecastId: number): Promise<WeatherData[]>;
  
  createIrrigationSchedule(schedule: Omit<IrrigationSchedule, 'id'>[]): Promise<IrrigationSchedule[]>;
  getIrrigationScheduleByForecastId(forecastId: number): Promise<IrrigationSchedule[]>;
}

export class MemStorage implements IStorage {
  private forecasts: Map<number, IrrigationForecast>;
  private weather: Map<number, WeatherData>;
  private schedules: Map<number, IrrigationSchedule>;
  private currentForecastId: number;
  private currentWeatherId: number;
  private currentScheduleId: number;

  constructor() {
    this.forecasts = new Map();
    this.weather = new Map();
    this.schedules = new Map();
    this.currentForecastId = 1;
    this.currentWeatherId = 1;
    this.currentScheduleId = 1;
  }

  async createIrrigationForecast(insertForecast: InsertIrrigationForecast): Promise<IrrigationForecast> {
    const id = this.currentForecastId++;
    const forecast: IrrigationForecast = {
      ...insertForecast,
      id,
      soilType: null,
      currentSoilMoisture: null,
      createdAt: new Date(),
    };
    this.forecasts.set(id, forecast);
    return forecast;
  }

  async getIrrigationForecast(id: number): Promise<IrrigationForecast | undefined> {
    return this.forecasts.get(id);
  }

  async updateIrrigationForecast(id: number, updates: Partial<IrrigationForecast>): Promise<IrrigationForecast | undefined> {
    const existing = this.forecasts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.forecasts.set(id, updated);
    return updated;
  }

  async createWeatherData(data: Omit<WeatherData, 'id'>[]): Promise<WeatherData[]> {
    const results: WeatherData[] = [];
    for (const item of data) {
      const id = this.currentWeatherId++;
      const weatherItem: WeatherData = { ...item, id };
      this.weather.set(id, weatherItem);
      results.push(weatherItem);
    }
    return results;
  }

  async getWeatherDataByForecastId(forecastId: number): Promise<WeatherData[]> {
    return Array.from(this.weather.values()).filter(w => w.forecastId === forecastId);
  }

  async createIrrigationSchedule(schedule: Omit<IrrigationSchedule, 'id'>[]): Promise<IrrigationSchedule[]> {
    const results: IrrigationSchedule[] = [];
    for (const item of schedule) {
      const id = this.currentScheduleId++;
      const scheduleItem: IrrigationSchedule = { ...item, id };
      this.schedules.set(id, scheduleItem);
      results.push(scheduleItem);
    }
    return results;
  }

  async getIrrigationScheduleByForecastId(forecastId: number): Promise<IrrigationSchedule[]> {
    return Array.from(this.schedules.values()).filter(s => s.forecastId === forecastId);
  }
}

export const storage = new MemStorage();
