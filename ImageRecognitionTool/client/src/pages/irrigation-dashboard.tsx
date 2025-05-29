import { useState } from "react";
import { Sprout, User } from "lucide-react";
import IrrigationForm from "@/components/irrigation-form";
import WorkflowProgress from "@/components/workflow-progress";
import WeatherOverview from "@/components/weather-overview";
import SoilMoistureStatus from "@/components/soil-moisture-status";
import IrrigationDecision from "@/components/irrigation-decision";
import IrrigationSchedule from "@/components/irrigation-schedule";
import DataMatchingStatus from "@/components/data-matching-status";
import AIChatbot from "@/components/ai-chatbot";

interface ForecastData {
  forecast: any;
  weatherData: any[];
  schedule: any[];
  soilType: string;
  cropInfo: any;
}

export default function IrrigationDashboard() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleForecastComplete = (data: ForecastData) => {
    setForecastData(data);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Sprout className="h-6 w-6 text-crop-600" />
              <h1 className="text-xl font-semibold text-gray-900">Smart Irrigation System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Farmer</span>
              <div className="w-8 h-8 bg-crop-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-crop-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Workflow Progress */}
        <WorkflowProgress currentStep={forecastData ? 5 : 1} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1 space-y-6">
            <IrrigationForm 
              onForecastComplete={handleForecastComplete}
              onLoadingChange={handleLoadingChange}
            />
            
            {forecastData && (
              <DataMatchingStatus 
                soilType={forecastData.soilType}
                climateStatus="Retrieved"
              />
            )}
          </div>

          {/* Right Column - Results Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            
            {forecastData ? (
              <>
                {/* Weather & Soil Moisture Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WeatherOverview weatherData={forecastData.weatherData} />
                  <SoilMoistureStatus 
                    currentMoisture={forecastData.forecast.currentSoilMoisture}
                    cropInfo={forecastData.cropInfo}
                  />
                </div>

                {/* Irrigation Decision */}
                <IrrigationDecision 
                  forecast={forecastData.forecast}
                  schedule={forecastData.schedule}
                  cropInfo={forecastData.cropInfo}
                />

                {/* Irrigation Schedule */}
                <IrrigationSchedule 
                  schedule={forecastData.schedule}
                  soilType={forecastData.soilType}
                />
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Sprout className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Generate Your Irrigation Forecast
                </h3>
                <p className="text-gray-600">
                  Fill in your farm details in the form to get started with intelligent irrigation planning.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center max-w-sm mx-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crop-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Calculating Irrigation Forecast
              </h3>
              <p className="text-sm text-gray-600">
                Processing soil moisture and weather data...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Chatbot */}
      <AIChatbot forecastData={forecastData} />
    </div>
  );
}
