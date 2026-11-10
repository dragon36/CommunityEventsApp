import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform, Linking } from 'react-native';
import type { MapRegion, LocationData } from '@/types';

// ============================================
// Location Hook Types
// ============================================

interface UseLocationReturn {
  // Current location
  location: LocationData | null;
  region: MapRegion | null;
  accuracy: number | null;

  // Permissions
  permissionStatus: Location.PermissionStatus | null;
  hasPermission: boolean;
  canAskAgain: boolean;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: (options?: Location.LocationOptions) => Promise<LocationData | null>;
  watchLocation: (callback: (location: LocationData) => void) => Promise<Location.LocationSubscription | null>;
  stopWatching: () => void;
  reverseGeocode: (latitude: number, longitude: number) => Promise<LocationData | null>;
  openSettings: () => void;
  clearError: () => void;
}

// ============================================
// Default Region (San Francisco as fallback)
const DEFAULT_REGION: MapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// ============================================
// Location Hook
// ============================================

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [region, setRegion] = useState<MapRegion | null>(DEFAULT_REGION);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Computed values
  const hasPermission = permissionStatus === 'granted';
  const canAskAgain = permissionStatus === 'undetermined' || permissionStatus === 'denied';

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    } catch (err) {
      console.error('Failed to check location permission:', err);
    }
  }, []);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { status, canAskAgain: canAsk } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        // Also request background permission for iOS
        if (Platform.OS === 'ios') {
          await Location.requestBackgroundPermissionsAsync();
        }
        return true;
      } else if (status === 'denied') {
        setError('Location permission denied. Please enable in settings.');
        return false;
      } else {
        setError('Location permission not granted');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (options?: Location.LocationOptions): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      // Check permission first
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000,
        ...options,
      });

      const coords = locationData.coords;
      const locationResult: LocationData = {
        name: 'Current Location',
        address: '',
        coordinates: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      };

      // Try to reverse geocode for address
      try {
        const address = await reverseGeocode(coords.latitude, coords.longitude);
        if (address) {
          locationResult.name = address.name;
          locationResult.address = address.address;
          locationResult.placeId = address.placeId;
          locationResult.city = address.city;
          locationResult.state = address.state;
          locationResult.zipCode = address.zipCode;
          locationResult.country = address.country;
        }
      } catch {
        // Ignore reverse geocode errors
      }

      setLocation(locationResult);
      setAccuracy(coords.accuracy ?? null);
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      return locationResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, requestPermission]);

  // Watch location changes
  const watchLocation = useCallback(
    async (callback: (location: LocationData) => void): Promise<Location.LocationSubscription | null> => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (locationData) => {
            const coords = locationData.coords;
            const locationResult: LocationData = {
              name: 'Current Location',
              address: '',
              coordinates: {
                latitude: coords.latitude,
                longitude: coords.longitude,
              },
            };
            callback(locationResult);
          }
        );

        watchSubscriptionRef.current = subscription;
        return subscription;
      } catch (err) {
        console.error('Failed to watch location:', err);
        return null;
      }
    },
    [hasPermission, requestPermission]
  );

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current.remove();
      watchSubscriptionRef.current = null;
    }
  }, []);

  // Reverse geocode coordinates
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<LocationData | null> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const place = result[0];
        const address = [
          place.streetNumber,
          place.street,
          place.city,
          place.region,
          place.postalCode,
          place.country,
        ]
          .filter(Boolean)
          .join(', ');

        return {
          name: place.name || address,
          address,
          coordinates: { latitude, longitude },
          city: place.city || '',
          state: place.region || '',
          zipCode: place.postalCode || '',
          country: place.country || '',
        };
      }
      return null;
    } catch (err) {
      console.error('Reverse geocode failed:', err);
      return null;
    }
  }, []);

  // Open app settings
  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    region,
    accuracy,
    permissionStatus,
    hasPermission,
    canAskAgain,
    loading,
    error,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    reverseGeocode,
    openSettings,
    clearError,
  };
}

// ============================================
// Simplified hook for components that just need user's region
// ============================================

export function useUserRegion(): { region: MapRegion | null; loading: boolean; error: string | null } {
  const { region, loading, error } = useLocation();
  return { region, loading, error };
}

// ============================================
// Hook for location search with autocomplete
// ============================================

import { getPlaceAutocomplete, getPlaceDetails, type LocationSuggestion } from '@/services/maps/googlePlaces';

export function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, userLocation?: { latitude: number; longitude: number }) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await getPlaceAutocomplete(query, {
        location: userLocation,
        radius: 50000,
        types: '(regions)',
      });
      setSuggestions(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDetails = useCallback(async (placeId: string): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      const details = await getPlaceDetails(placeId);
      return details;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get place details';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    search,
    getDetails,
    clear,
  };
}

export default useLocation;