import { CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherOverviewProps {
  weatherData: Array<{
    precipitation: number;
    evaporation: number;
  }>;
}

export default function WeatherOverview({ weatherData }: WeatherOverviewProps) {
  const totalPrecipitation = weatherData.reduce((sum, day) => sum + day.precipitation, 0);
  const avgEvaporation = weatherData.reduce((sum, day) => sum + day.evaporation, 0) / weatherData.length;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CloudRain className="h-5 w-5 text-water-600 mr-2" />
          Weather Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-700">Expected Precipitation</span>
            <p className="text-xs text-gray-500">Next {weatherData.length} days</p>
          </div>
          <span className="text-lg font-bold text-blue-700">
            {totalPrecipitation.toFixed(1)}mm
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-700">Evaporation Rate</span>
            <p className="text-xs text-gray-500">Daily average</p>
          </div>
          <span className="text-lg font-bold text-orange-700">
            {avgEvaporation.toFixed(1)}mm/day
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
