// Utility functions for irrigation calculations

export interface SoilCharacteristics {
  waterHoldingCapacity: number;
  drainageRate: number;
}

export interface CropThresholds {
  critical: number;
  optimal: number;
  waterUse: number;
}

export const soilTypes: Record<string, SoilCharacteristics> = {
  sandy: { waterHoldingCapacity: 0.1, drainageRate: 0.8 },
  loam: { waterHoldingCapacity: 0.2, drainageRate: 0.5 },
  clayLoam: { waterHoldingCapacity: 0.3, drainageRate: 0.3 },
  clay: { waterHoldingCapacity: 0.4, drainageRate: 0.2 }
};

export const cropThresholds: Record<string, CropThresholds> = {
  wheat: { critical: 40, optimal: 70, waterUse: 5 },
  corn: { critical: 45, optimal: 75, waterUse: 6 },
  soybeans: { critical: 35, optimal: 65, waterUse: 4.5 },
  tomatoes: { critical: 50, optimal: 80, waterUse: 7 },
  potatoes: { critical: 45, optimal: 75, waterUse: 5.5 },
  rice: { critical: 60, optimal: 90, waterUse: 8 }
};

/**
 * Calculate soil moisture using water balance equation:
 * Soil Moisture(t+1) = Soil Moisture(t) + Precipitation - Evaporation - Crop Water Use - Drainage
 */
export function calculateSoilMoisture(
  initialMoisture: number,
  precipitation: number,
  evaporation: number,
  cropWaterUse: number,
  soilType: string
): number {
  const soil = soilTypes[soilType];
  if (!soil) {
    throw new Error(`Unknown soil type: ${soilType}`);
  }

  const waterInput = precipitation;
  const waterOutput = evaporation + cropWaterUse;
  const newMoisture = initialMoisture + waterInput - waterOutput;
  
  // Calculate drainage only if soil is above field capacity
  const fieldCapacity = 80; // Typical field capacity percentage
  const drainage = newMoisture > fieldCapacity 
    ? (newMoisture - fieldCapacity) * soil.drainageRate
    : 0;

  const finalMoisture = newMoisture - drainage;
  
  // Ensure moisture stays within realistic bounds (0-100%)
  return Math.max(0, Math.min(100, finalMoisture));
}

/**
 * Calculate reference evapotranspiration using simplified Penman equation
 */
export function calculateEvapotranspiration(
  temperature: number,
  humidity: number,
  windSpeed: number
): number {
  // Simplified Penman equation for reference evapotranspiration (mm/day)
  const delta = 4098 * (0.6108 * Math.exp(17.27 * temperature / (temperature + 237.3))) / Math.pow(temperature + 237.3, 2);
  const gamma = 0.665; // psychrometric constant
  const u2 = windSpeed * 4.87 / Math.log(67.8 * 10 - 5.42); // wind speed at 2m height
  
  // Simplified calculation
  const et0 = (0.0023 * (temperature + 17.8) * Math.sqrt(Math.abs(temperature - humidity)) * (100 - humidity) / 100) + (0.0001 * u2);
  
  // Cap between reasonable values (0-15 mm/day)
  return Math.max(0, Math.min(15, et0));
}

/**
 * Determine irrigation requirement based on soil moisture and crop thresholds
 */
export function calculateIrrigationRequirement(
  currentMoisture: number,
  cropType: string
): { needed: boolean; volume: number } {
  const crop = cropThresholds[cropType];
  if (!crop) {
    throw new Error(`Unknown crop type: ${cropType}`);
  }

  const needed = currentMoisture < crop.critical;
  const volume = needed ? Math.ceil((crop.optimal - currentMoisture) * 0.5) : 0;

  return { needed, volume };
}

/**
 * Determine soil type based on geographic coordinates (simplified)
 */
export function determineSoilType(latitude: number, longitude: number): string {
  const absLat = Math.abs(latitude);
  const absLon = Math.abs(longitude);
  
  // Simplified geographic soil distribution
  if (absLat > 60) return "sandy"; // Arctic regions tend to have sandy soils
  if (absLat < 30 && absLon < 50) return "clay"; // Tropical regions often have clay soils
  if (absLat >= 30 && absLat <= 50) return "clayLoam"; // Temperate regions typically have clay loam
  return "loam"; // Default for other regions
}

/**
 * Generate weather condition description from weather code
 */
export function getWeatherDescription(weatherMain: string): string {
  switch (weatherMain.toLowerCase()) {
    case 'clear':
      return 'Sunny';
    case 'clouds':
      return 'Cloudy';
    case 'rain':
      return 'Rain';
    case 'drizzle':
      return 'Light Rain';
    case 'thunderstorm':
      return 'Thunderstorm';
    case 'snow':
      return 'Snow';
    case 'mist':
    case 'fog':
      return 'Foggy';
    default:
      return weatherMain;
  }
}
