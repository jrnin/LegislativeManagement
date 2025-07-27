import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSun, 
  Snowflake, 
  Zap,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timestamp: string;
}

interface WeatherWidgetProps {
  variant?: 'compact' | 'detailed';
  className?: string;
}

export default function WeatherWidget({ variant = 'compact', className = '' }: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['/api/weather/current'],
    refetchInterval: 10 * 60 * 1000, // Atualizar a cada 10 minutos
    staleTime: 5 * 60 * 1000, // Considerar stale após 5 minutos
  });

  // Mapear ícones do clima para componentes Lucide
  const getWeatherIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'sun': Sun,
      'cloud-sun': CloudSun,
      'cloud': Cloud,
      'cloud-drizzle': CloudRain,
      'cloud-rain': CloudRain,
      'snowflake': Snowflake,
      'zap': Zap
    };
    return iconMap[iconName] || Cloud;
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Cloud className="h-6 w-6 animate-pulse text-blue-500" />
            <div>
              <p className="font-semibold text-blue-600">Jaíba/MG</p>
              <p className="text-sm text-gray-500">Carregando clima...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Cloud className="h-6 w-6 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-600">Jaíba/MG</p>
              <p className="text-sm text-gray-500">Clima indisponível</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.icon);

  if (variant === 'compact') {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WeatherIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-blue-600">Jaíba/MG</p>
                <p className="text-2xl font-bold">{weather.temperature}°C</p>
                <p className="text-sm text-gray-600">{weather.weatherDescription}</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Sensação: {weather.feelsLike}°C</p>
              <p>Umidade: {weather.humidity}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <WeatherIcon className="h-6 w-6 text-blue-500" />
          <span>Clima em Jaíba/MG</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{weather.temperature}°C</p>
            <p className="text-sm text-gray-600">{weather.weatherDescription}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span>Sensação: {weather.feelsLike}°C</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>Umidade: {weather.humidity}%</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Wind className="h-4 w-4 text-gray-500" />
              <span>Vento: {Math.round(weather.windSpeed * 3.6)} km/h</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-4 border-t text-sm">
          <div className="text-center">
            <Gauge className="h-4 w-4 mx-auto mb-1 text-gray-600" />
            <p className="font-medium">{Math.round(weather.pressure)} hPa</p>
            <p className="text-xs text-gray-500">Pressão</p>
          </div>
          <div className="text-center">
            <Eye className="h-4 w-4 mx-auto mb-1 text-gray-600" />
            <p className="font-medium">{Math.round(weather.visibility / 1000)} km</p>
            <p className="text-xs text-gray-500">Visibilidade</p>
          </div>
          <div className="text-center">
            <Sun className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="font-medium">{weather.uvIndex}</p>
            <p className="text-xs text-gray-500">UV</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center pt-2 border-t">
          Atualizado: {formatLastUpdate(weather.timestamp)}
        </p>
      </CardContent>
    </Card>
  );
}