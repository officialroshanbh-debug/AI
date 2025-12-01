/**
 * Browser Geolocation Service
 * Handles location tracking and storage
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

/**
 * Get user's current location from browser
 */
export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };

        // Try to reverse geocode to get city/country
        try {
          const reverseGeocode = await reverseGeocodeLocation(
            location.latitude,
            location.longitude
          );
          location.city = reverseGeocode.city;
          location.country = reverseGeocode.country;
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
          // Continue without city/country
        }

        // Save to localStorage
        saveLocationToStorage(location);

        resolve(location);
      },
      (error) => {
        reject({
          code: error.code,
          message: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get city and country
 */
async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string }> {
  // Using OpenStreetMap Nominatim API (free, no API key required)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'AI-Platform/1.0', // Required by Nominatim
      },
    }
  );

  if (!response.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await response.json();
  const address = data.address || {};

  return {
    city: address.city || address.town || address.village || address.municipality || 'Unknown',
    country: address.country || 'Unknown',
  };
}

/**
 * Save location to localStorage
 */
export function saveLocationToStorage(location: LocationData): void {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('Failed to save location to localStorage:', error);
  }
}

/**
 * Get saved location from localStorage
 */
export function getSavedLocation(): LocationData | null {
  try {
    const saved = localStorage.getItem('userLocation');
    if (!saved) return null;

    const location = JSON.parse(saved) as LocationData;
    
    // Check if location is still fresh (less than 1 hour old)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - location.timestamp > oneHour) {
      return null; // Location is stale
    }

    return location;
  } catch (error) {
    console.warn('Failed to get saved location:', error);
    return null;
  }
}

/**
 * Request location permission and get location
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }

  try {
    // Check if permission is already granted
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state === 'granted') {
      return true;
    }

    // Try to get location (this will prompt for permission)
    await getCurrentLocation();
    return true;
  } catch {
    return false;
  }
}

