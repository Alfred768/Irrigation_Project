import { pgTable, text, serial, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const irrigationForecasts = pgTable("irrigation_forecasts", {
  id: serial("id").primaryKey(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  cropType: text("crop_type").notNull(),
  plantingDate: text("planting_date").notNull(),
  forecastPeriod: integer("forecast_period").notNull(),
  soilType: text("soil_type"),
  currentSoilMoisture: real("current_soil_moisture"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  forecastId: integer("forecast_id").references(() => irrigationForecasts.id),
  date: text("date").notNull(),
  precipitation: real("precipitation").notNull(),
  evaporation: real("evaporation").notNull(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
  windSpeed: real("wind_speed").notNull(),
});

export const irrigationSchedule = pgTable("irrigation_schedule", {
  id: serial("id").primaryKey(),
  forecastId: integer("forecast_id").references(() => irrigationForecasts.id),
  date: text("date").notNull(),
  soilMoisture: real("soil_moisture").notNull(),
  irrigationNeeded: boolean("irrigation_needed").notNull(),
  irrigationVolume: real("irrigation_volume"),
  weather: text("weather").notNull(),
});

export const insertIrrigationForecastSchema = createInsertSchema(irrigationForecasts).omit({
  id: true,
  soilType: true,
  currentSoilMoisture: true,
  createdAt: true,
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({
  id: true,
});

export const insertIrrigationScheduleSchema = createInsertSchema(irrigationSchedule).omit({
  id: true,
});

export type InsertIrrigationForecast = z.infer<typeof insertIrrigationForecastSchema>;
export type IrrigationForecast = typeof irrigationForecasts.$inferSelect;
export type WeatherData = typeof weatherData.$inferSelect;
export type IrrigationSchedule = typeof irrigationSchedule.$inferSelect;

// Crop thresholds for irrigation decision making
export const cropThresholds = {
  wheat: { critical: 40, optimal: 70, waterUse: 5 },
  corn: { critical: 45, optimal: 75, waterUse: 6 },
  soybeans: { critical: 35, optimal: 65, waterUse: 4.5 },
  tomatoes: { critical: 50, optimal: 80, waterUse: 7 },
  potatoes: { critical: 45, optimal: 75, waterUse: 5.5 },
  rice: { critical: 60, optimal: 90, waterUse: 8 }
};

// Soil type characteristics
export const soilTypes = {
  sandy: { waterHoldingCapacity: 0.1, drainageRate: 0.8 },
  loam: { waterHoldingCapacity: 0.2, drainageRate: 0.5 },
  clayLoam: { waterHoldingCapacity: 0.3, drainageRate: 0.3 },
  clay: { waterHoldingCapacity: 0.4, drainageRate: 0.2 }
};
