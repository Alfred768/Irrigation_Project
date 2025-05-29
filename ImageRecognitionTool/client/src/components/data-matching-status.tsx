import { Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataMatchingStatusProps {
  soilType: string;
  climateStatus: string;
}

export default function DataMatchingStatus({ soilType, climateStatus }: DataMatchingStatusProps) {
  const formatSoilType = (type: string) => {
    switch (type) {
      case 'clayLoam': return 'Clay Loam';
      case 'sandy': return 'Sandy';
      case 'loam': return 'Loam';
      case 'clay': return 'Clay';
      default: return type;
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 text-soil-600 mr-2" />
          Step 2: Data Matching Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Soil Type</span>
          <span className="text-sm text-green-700 font-medium">
            {formatSoilType(soilType)}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Climate Data</span>
          <span className="text-sm text-blue-700 font-medium">{climateStatus}</span>
        </div>
      </CardContent>
    </Card>
  );
}
