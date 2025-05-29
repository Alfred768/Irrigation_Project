import { MapPin, Database, Droplets, Brain, Calendar } from "lucide-react";

interface WorkflowProgressProps {
  currentStep: number;
}

const steps = [
  {
    number: 1,
    title: "User Input",
    subtitle: "Location & Crop Data",
    icon: MapPin,
    color: "crop"
  },
  {
    number: 2,
    title: "Data Matching",
    subtitle: "Soil & Climate",
    icon: Database,
    color: "soil"
  },
  {
    number: 3,
    title: "Water Balance",
    subtitle: "Soil Moisture",
    icon: Droplets,
    color: "water"
  },
  {
    number: 4,
    title: "Decision",
    subtitle: "Irrigation Need",
    icon: Brain,
    color: "yellow"
  },
  {
    number: 5,
    title: "Results",
    subtitle: "Schedule & Insights",
    icon: Calendar,
    color: "green"
  }
];

export default function WorkflowProgress({ currentStep }: WorkflowProgressProps) {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MapPin className="h-5 w-5 text-crop-600 mr-2" />
        Irrigation Forecasting Workflow
      </h2>
      
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.number <= currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                isActive 
                  ? step.color === 'crop' ? 'bg-crop-600 text-white' 
                    : step.color === 'soil' ? 'bg-soil-600 text-white'
                    : step.color === 'water' ? 'bg-water-600 text-white'
                    : step.color === 'yellow' ? 'bg-yellow-600 text-white'
                    : 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <span className="font-semibold text-sm">{step.number}</span>
                )}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.title}
              </span>
              <span className={`text-xs ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                {step.subtitle}
              </span>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-1/2 w-full h-0.5 bg-gray-300 transform -translate-y-1/2 -z-10" 
                     style={{ 
                       left: `${(100 / (steps.length - 1)) * index + (50 / (steps.length - 1))}%`,
                       width: `${100 / (steps.length - 1)}%`
                     }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
