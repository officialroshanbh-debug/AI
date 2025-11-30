/**
 * React Hook for Location Tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLocation,
  getSavedLocation,
  saveLocationToStorage,
  requestLocationPermission,
  type LocationData,
  type LocationError,
} from '@/lib/location/geolocation';

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: LocationError | null;
  requestLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LocationError | null>(null);

  const loadLocation = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get saved location first (unless forcing refresh)
      if (!forceRefresh) {
        const saved = getSavedLocation();
        if (saved) {
          setLocation(saved);
          setIsLoading(false);
          return;
        }
      }

      // Request permission and get current location
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError({
          code: 1,
          message: 'Location permission denied',
        });
        setIsLoading(false);
        return;
      }

      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      saveLocationToStorage(currentLocation);
    } catch (err) {
      const locationError = err as LocationError;
      setError(locationError);
      
      // Try to use saved location as fallback
      const saved = getSavedLocation();
      if (saved) {
        setLocation(saved);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    await loadLocation(true);
  }, [loadLocation]);

  const refreshLocation = useCallback(async () => {
    await loadLocation(true);
  }, [loadLocation]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    refreshLocation,
  };
}

