'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplets, RefreshCw } from 'lucide-react';
import { useLocation } from '@/hooks/use-location';
import { Button } from '@/components/ui/button';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  feelsLike?: number;
  description?: string;
}

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudRain,
  Snow: Cloud,
  Mist: Cloud,
  Fog: Cloud,
  'partly-cloudy': CloudSun,
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location, requestLocation, isLoading: locationLoading } = useLocation();

  const fetchWeather = async () => {
    if (!location) {
      setError('Location not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather?lat=${location.latitude}&lon=${location.longitude}&city=${location.city || ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather');
      }

      const data = await response.json();
      
      setWeather({
        location: `${data.location.name}, ${data.location.country}`,
        temperature: data.current.temp,
        condition: data.current.weather[0]?.main || 'Clear',
        high: data.daily?.[0]?.temp?.max || data.current.temp + 2,
        low: data.daily?.[0]?.temp?.min || data.current.temp - 2,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        feelsLike: data.current.feels_like,
        description: data.current.weather[0]?.description,
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchWeather();
    } else if (!locationLoading) {
      // Location not available and not loading
      setError('Location permission required');
      setIsLoading(false);
    }
  }, [location, locationLoading]);

  if (isLoading || locationLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{error || 'Weather unavailable'}</p>
          {!location && (
            <Button
              size="sm"
              variant="outline"
              onClick={requestLocation}
              className="w-full"
            >
              Enable Location
            </Button>
          )}
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
          <span className="font-medium text-sm">{weather.location}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchWeather}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold mb-1">{weather.temperature}°C</div>
        {weather.feelsLike && (
          <div className="text-xs text-muted-foreground mb-1">
            Feels like {weather.feelsLike}°C
          </div>
        )}
        <div className="text-xs text-muted-foreground capitalize mb-1">
          {weather.description || weather.condition}
        </div>
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

