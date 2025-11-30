/**
 * Weather API Route
 * Fetches weather data based on location
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

interface WeatherResponse {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  daily?: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const city = searchParams.get('city');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Use OpenWeatherMap API (free tier available)
    // Fallback to mock data if API key is not set
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      // Return mock weather data
      return NextResponse.json({
        location: {
          name: city || 'Unknown',
          country: 'Unknown',
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        },
        current: {
          temp: 22,
          feels_like: 21,
          humidity: 65,
          pressure: 1013,
          wind_speed: 8,
          weather: [
            {
              main: 'Clear',
              description: 'clear sky',
              icon: '01d',
            },
          ],
        },
        daily: [
          {
            dt: Date.now() / 1000,
            temp: { min: 12, max: 24 },
            weather: [
              {
                main: 'Clear',
                description: 'clear sky',
                icon: '01d',
              },
            ],
          },
        ],
      });
    }

    // Fetch real weather data from OpenWeatherMap
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=5`;

    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl),
    ]);

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    const response: WeatherResponse = {
      location: {
        name: weatherData.name || city || 'Unknown',
        country: weatherData.sys?.country || 'Unknown',
        lat: weatherData.coord.lat,
        lon: weatherData.coord.lon,
      },
      current: {
        temp: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        wind_speed: Math.round(weatherData.wind?.speed * 3.6) || 0, // Convert m/s to km/h
        weather: weatherData.weather || [],
      },
      daily: forecastData.list?.slice(0, 5).map((item: any) => ({
        dt: item.dt,
        temp: {
          min: Math.round(item.main.temp_min),
          max: Math.round(item.main.temp_max),
        },
        weather: item.weather || [],
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Weather API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

