'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplets, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
}

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sunny: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get user's location from localStorage or use default
    const savedLocation = localStorage.getItem('userLocation') || 'Kathmandu';
    
    // Mock weather data - in production, integrate with a weather API
    const mockWeather: WeatherData = {
      location: savedLocation,
      temperature: 22,
      condition: 'sunny',
      high: 24,
      low: 12,
      humidity: 65,
      windSpeed: 8,
    };

    // Simulate API call
    setTimeout(() => {
      setWeather(mockWeather);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading || !weather) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const WeatherIcon = WEATHER_ICONS[weather.condition] || Sun;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WeatherIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          <span className="font-medium">{weather.location}</span>
        </div>
        <span className="text-sm text-muted-foreground capitalize">{weather.condition}</span>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold mb-1">{weather.temperature}°C</div>
        <div className="text-xs text-muted-foreground">
          H: {weather.high}° L: {weather.low}°
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3" />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

