import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Calculator, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertIrrigationForecastSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IrrigationFormProps {
  onForecastComplete: (data: any) => void;
  onLoadingChange: (loading: boolean) => void;
}

const cropOptions = [
  { value: "wheat", label: "Wheat" },
  { value: "corn", label: "Corn" },
  { value: "soybeans", label: "Soybeans" },
  { value: "tomatoes", label: "Tomatoes" },
  { value: "potatoes", label: "Potatoes" },
  { value: "rice", label: "Rice" },
];

const forecastPeriodOptions = [
  { value: 1, label: "Next 1 day" },
  { value: 2, label: "Next 2 days" },
  { value: 3, label: "Next 3 days" },
  { value: 5, label: "Next 5 days" },
  { value: 7, label: "Next 7 days" },
];

export default function IrrigationForm({ onForecastComplete, onLoadingChange }: IrrigationFormProps) {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const easternDate = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );
  const yyyyMMddET = easternDate.toISOString().split("T")[0];
  
  const form = useForm({
    resolver: zodResolver(insertIrrigationForecastSchema),
    defaultValues: {
      latitude: 40.7128,
      longitude: -74.0060,
      cropType: "wheat",
      plantingDate: yyyyMMddET,
      forecastPeriod: 3,
    },
  });

  const createForecastMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/irrigation-forecast", data);
      return response.json();
    },
    onSuccess: (data) => {
      onForecastComplete(data);
      onLoadingChange(false);
      toast({
        title: "Forecast Generated Successfully",
        description: "Your irrigation schedule is ready for review.",
      });
    },
    onError: (error: any) => {
      onLoadingChange(false);
      toast({
        title: "Forecast Generation Failed",
        description: error.message || "Failed to generate irrigation forecast. Please check your inputs and try again.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    setIsLocating(true);
  
    if (!navigator.geolocation) {
      form.setValue("latitude", 40.7128);
      form.setValue("longitude", -74.0060);
      toast({
        title: "Geolocation Unsupported",
        description: "Using default location: New York City (40.7128, -74.0060).",
      });
      setIsLocating(false);
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("latitude", parseFloat(latitude.toFixed(6)));
        form.setValue("longitude", parseFloat(longitude.toFixed(6)));
        toast({
          title: "Location Acquired",
          description: `Your current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
        setIsLocating(false);
      },
      () => {
        form.setValue("latitude", 40.7128);
        form.setValue("longitude", -74.0060);
        toast({
          title: "Location Failed",
          description: "Unable to retrieve location. Defaulting to New York City (40.7128, -74.0060).",
          variant: "default", // 可选：用 "destructive" 会变红色提示
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const onSubmit = (data: any) => {
    onLoadingChange(true);
    createForecastMutation.mutate(data);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 text-crop-600 mr-2" />
          Step 1: Input Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Geographic Coordinates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Geographic Coordinates</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="text-xs"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {isLocating ? "Locating..." : "Get Current Location"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Latitude"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                          <span className="text-xs text-gray-500 mt-1 block">e.g., 40.7128</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Longitude"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                          <span className="text-xs text-gray-500 mt-1 block">e.g., -74.0060</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Crop Type */}
            <FormField
              control={form.control}
              name="cropType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Crop Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cropOptions.map((crop) => (
                        <SelectItem key={crop.value} value={crop.value}>
                          {crop.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Planting Date */}
            <FormField
              control={form.control}
              name="plantingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Planting Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled readOnly/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forecast Period */}
            <FormField
              control={form.control}
              name="forecastPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Forecast Period</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select forecast period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {forecastPeriodOptions.map((period) => (
                        <SelectItem key={period.value} value={period.value.toString()}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-crop-600 hover:bg-crop-700 text-white"
              disabled={createForecastMutation.isPending}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Generate Irrigation Forecast
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
