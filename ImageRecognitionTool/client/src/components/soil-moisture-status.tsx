import { Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SoilMoistureStatusProps {
  currentMoisture: number;
  cropInfo: {
    critical: number;
    optimal: number;
  };
}

export default function SoilMoistureStatus({ currentMoisture, cropInfo }: SoilMoistureStatusProps) {
  const getStatusColor = (moisture: number) => {
    if (moisture < cropInfo.critical) return "text-red-700";
    if (moisture < cropInfo.optimal) return "text-yellow-700";
    return "text-green-700";
  };

  const getStatusBg = (moisture: number) => {
    if (moisture < cropInfo.critical) return "bg-red-100";
    if (moisture < cropInfo.optimal) return "bg-yellow-100";
    return "bg-green-100";
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Droplets className="h-5 w-5 text-soil-600 mr-2" />
          Step 3: Soil Moisture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 ${getStatusBg(currentMoisture)} rounded-full mb-3`}>
            <span className={`text-2xl font-bold ${getStatusColor(currentMoisture)}`}>
              {currentMoisture.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Current Soil Moisture</p>
        </div>
        
        <div className="space-y-2">
          <Progress value={currentMoisture} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Critical ({cropInfo.critical}%)</span>
            <span>Optimal ({cropInfo.optimal}%)</span>
            <span>Saturated (100%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
