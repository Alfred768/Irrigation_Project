import { Brain, CheckCircle, Calculator, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IrrigationDecisionProps {
  forecast: any;
  schedule: Array<{
    irrigationNeeded: boolean;
    irrigationVolume: number | null;
    date: string;
  }>;
  cropInfo: {
    waterUse: number;
    critical: number;
  };
}

export default function IrrigationDecision({ forecast, schedule, cropInfo }: IrrigationDecisionProps) {
  const nextIrrigationDay = schedule.find(day => day.irrigationNeeded);
  const nextIrrigationIndex = schedule.findIndex(day => day.irrigationNeeded);
  const daysUntilIrrigation = nextIrrigationIndex >= 0 ? nextIrrigationIndex : null;
  
  const thresholdStatus = forecast.currentSoilMoisture > cropInfo.critical ? "Above Critical" : "Below Critical";
  const dailyWaterNeed = cropInfo.waterUse;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 text-yellow-600 mr-2" />
          Step 4: Irrigation Decision Engine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Threshold Status</p>
            <p className={`text-xs ${thresholdStatus === "Above Critical" ? "text-green-700" : "text-red-700"}`}>
              {thresholdStatus}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Calculator className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Daily Water Need</p>
            <p className="text-lg font-bold text-blue-700">{dailyWaterNeed}mm</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Irrigation Needed</p>
            <p className="text-xs text-orange-700">
              {daysUntilIrrigation !== null 
                ? daysUntilIrrigation === 0 
                  ? "Today"
                  : `In ${daysUntilIrrigation} day${daysUntilIrrigation > 1 ? 's' : ''}`
                : "Not needed"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
