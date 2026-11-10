import Constants from 'expo-constants';
import type { LocationSuggestion, LocationData } from '@/types';

// ============================================
// Google Places API Service
// ============================================

const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const PLACE_DETAILS_FIELDS = 'place_id,name,formatted_address,geometry,types,address_components';

// Get API key from Expo Constants
const getApiKey = (): string => {
  return Constants.expoConfig?.extra?.googlePlaces?.iosApiKey ||
         Constants.expoConfig?.extra?.googlePlaces?.androidApiKey ||
         process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
         '';
};

/**
 * Get place autocomplete suggestions
 */
export async function getPlaceAutocomplete(
  input: string,
  options: {
    location?: { latitude: number; longitude: number };
    radius?: number; // meters
    types?: string; // 'geocode', 'establishment', '(regions)', '(cities)'
    language?: string;
  } = {}
): Promise<LocationSuggestion[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Google Places API key not configured');
    return [];
  }

  const { location, radius = 50000, types = '(regions)', language = 'en' } = options;

  const params = new URLSearchParams({
    input,
    key: apiKey,
    types,
    language,
  });

  if (location) {
    params.append('location', `${location.latitude},${location.longitude}`);
    params.append('radius', radius.toString());
  }

  try {
    const response = await fetch(
      `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API request denied:', data.error_message);
      return [];
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Places API quota exceeded');
      return [];
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn('Google Places API response:', data.status, data.error_message);
      return [];
    }

    return (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      structuredFormatting: {
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
      },
    }));
  } catch (error) {
    console.error('Place autocomplete error:', error);
    return [];
  }
}

/**
 * Get place details by place ID
 */
export async function getPlaceDetails(placeId: string): Promise<LocationData | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Google Places API key not configured');
    return null;
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: PLACE_DETAILS_FIELDS,
  });

  try {
    const response = await fetch(
      `${GOOGLE_PLACES_BASE_URL}/details/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('Place details error:', data.status, data.error_message);
      return null;
    }

    const place = data.result;
    const location = place.geometry?.location;

    if (!location) {
      console.warn('No location in place details');
      return null;
    }

    // Extract address components
    const addressComponents = place.address_components || [];
    const getComponent = (type: string) =>
      addressComponents.find((c: any) => c.types.includes(type))?.long_name || '';

    return {
      name: place.name,
      address: place.formatted_address,
      placeId: place.place_id,
      coordinates: {
        latitude: location.lat,
        longitude: location.lng,
      },
      city: getComponent('locality') || getComponent('administrative_area_level_3') || '',
      state: getComponent('administrative_area_level_1') || '',
      zipCode: getComponent('postal_code') || '',
      country: getComponent('country') || '',
    };
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
}

/**
 * Geocode an address string to coordinates
 */
export async function geocodeAddress(address: string): Promise<LocationData | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    address,
    key: apiKey,
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry?.location;

    return {
      name: result.formatted_address,
      address: result.formatted_address,
      placeId: result.place_id,
      coordinates: {
        latitude: location.lat,
        longitude: location.lng,
      },
    };
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationData | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: apiKey,
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry?.location;

    return {
      name: result.formatted_address,
      address: result.formatted_address,
      placeId: result.place_id,
      coordinates: {
        latitude: location.lat,
        longitude: location.lng,
      },
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

/**
 * Debounced autocomplete search hook helper
 */
export function createDebouncedAutocomplete(
  searchFn: (input: string) => Promise<LocationSuggestion[]>,
  delay: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestRequestId = 0;

  return (input: string): Promise<LocationSuggestion[]> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const requestId = ++latestRequestId;

      timeoutId = setTimeout(async () => {
        if (requestId !== latestRequestId) {
          resolve([]);
          return;
        }

        if (!input || input.length < 2) {
          resolve([]);
          return;
        }

        try {
          const results = await searchFn(input);
          resolve(results);
        } catch {
          resolve([]);
        }
      }, delay);
    });
  };
}

export default {
  getPlaceAutocomplete,
  getPlaceDetails,
  geocodeAddress,
  reverseGeocode,
  createDebouncedAutocomplete,
};