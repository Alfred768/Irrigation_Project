import { Calendar, AlertTriangle, Info, Sun, Cloud, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IrrigationScheduleProps {
  schedule: Array<{
    date: string;
    weather: string;
    soilMoisture: number;
    irrigationNeeded: boolean;
    irrigationVolume: number | null;
  }>;
  soilType: string;
}

export default function IrrigationSchedule({ schedule, soilType }: IrrigationScheduleProps) {
  const getWeatherIcon = (weather: string) => {
    switch (weather.toLowerCase()) {
      case 'rain':
      case 'thunderstorm':
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="h-4 w-4 text-gray-500" />;
      default:
        return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMoistureColor = (moisture: number) => {
    if (moisture < 45) return "bg-red-100 text-red-800";
    if (moisture < 65) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getIrrigationStatus = (needed: boolean) => {
    if (needed) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSoilType = (type: string) => {
    switch (type) {
      case 'clayLoam': return 'clay loam';
      case 'sandy': return 'sandy';
      case 'loam': return 'loam';
      case 'clay': return 'clay';
      default: return type;
    }
  };

  // Generate insights based on schedule
  const upcomingDryDays = schedule.filter(day => 
    day.weather.toLowerCase() === 'clear' || day.weather.toLowerCase() === 'sunny'
  ).length;

  const hasDrySpell = upcomingDryDays >= 3;
  const irrigationDays = schedule.filter(day => day.irrigationNeeded).length;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 text-green-600 mr-2" />
          Step 5: Irrigation Schedule & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* Schedule Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Weather</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Soil Moisture</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Irrigation</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedule.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">
                    {formatDate(day.date)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2">
                      {getWeatherIcon(day.weather)}
                      <span className="capitalize">{day.weather}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={`${getMoistureColor(day.soilMoisture)} text-xs`}>
                      {day.soilMoisture.toFixed(0)}%
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={`${getIrrigationStatus(day.irrigationNeeded)} text-xs`}>
                      {day.irrigationNeeded ? "Recommended" : "Not Needed"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    {day.irrigationVolume ? (
                      <span className="font-medium text-blue-700">
                        {day.irrigationVolume}mm
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insights & Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasDrySpell && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h5 className="font-medium text-yellow-800 mb-1">Dry Spell Warning</h5>
                  <p className="text-sm text-yellow-700">
                    Extended dry period expected with {upcomingDryDays} sunny days. Monitor soil moisture closely.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Soil Retention Insight</h5>
                <p className="text-sm text-blue-700">
                  {formatSoilType(soilType)} soil has {
                    soilType === 'clayLoam' || soilType === 'clay' 
                      ? 'good water retention. Consider deep watering less frequently.'
                      : soilType === 'sandy'
                        ? 'low water retention. More frequent, lighter watering recommended.'
                        : 'moderate water retention. Standard watering schedule suitable.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{irrigationDays}</p>
              <p className="text-sm text-gray-600">Irrigation Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {schedule.reduce((sum, day) => sum + (day.irrigationVolume || 0), 0).toFixed(0)}mm
              </p>
              <p className="text-sm text-gray-600">Total Water Needed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {schedule.length - irrigationDays}
              </p>
              <p className="text-sm text-gray-600">No Irrigation Days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
