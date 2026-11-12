// Location Utility Functions
import type { LocationData, MapRegion } from '@/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate bounding box for a region
 */
export function getBoundingBox(region: MapRegion): {
  northEast: { latitude: number; longitude: number };
  southWest: { latitude: number; longitude: number };
} {
  const latDelta = region.latitudeDelta / 2;
  const lonDelta = region.longitudeDelta / 2;

  return {
    northEast: {
      latitude: region.latitude + latDelta,
      longitude: region.longitude + lonDelta,
    },
    southWest: {
      latitude: region.latitude - latDelta,
      longitude: region.longitude - lonDelta,
    },
  };
}

/**
 * Check if a coordinate is within a region
 */
export function isCoordinateInRegion(
  coordinate: { latitude: number; longitude: number },
  region: MapRegion
): boolean {
  const bounds = getBoundingBox(region);
  return (
    coordinate.latitude >= bounds.southWest.latitude &&
    coordinate.latitude <= bounds.northEast.latitude &&
    coordinate.longitude >= bounds.southWest.longitude &&
    coordinate.longitude <= bounds.northEast.longitude
  );
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationData): string {
  if (location.name && location.address) {
    return `${location.name}, ${location.address}`;
  }
  return location.name || location.address || 'Unknown location';
}

/**
 * Get short location name (just the venue/city)
 */
export function getShortLocationName(location: LocationData): string {
  return location.name || location.city || 'Unknown';
}

/**
 * Create location data from coordinates (reverse geocode placeholder)
 */
export async function createLocationFromCoords(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  // In a real app, this would call the geocoding API
  // For now, return basic location data
  return {
    name: 'Current Location',
    address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    coordinates: { latitude, longitude },
    placeId: '',
  };
}

/**
 * Get region that encompasses multiple locations
 */
export function getRegionForLocations(locations: LocationData[]): MapRegion | null {
  if (locations.length === 0) return null;
  const first = locations[0];
  if (!first) return null;

  if (locations.length === 1) {
    return {
      latitude: first.coordinates.latitude,
      longitude: first.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  let minLat = first.coordinates.latitude;
  let maxLat = first.coordinates.latitude;
  let minLon = first.coordinates.longitude;
  let maxLon = first.coordinates.longitude;

  for (const loc of locations) {
    minLat = Math.min(minLat, loc.coordinates.latitude);
    maxLat = Math.max(maxLat, loc.coordinates.latitude);
    minLon = Math.min(minLon, loc.coordinates.longitude);
    maxLon = Math.max(maxLon, loc.coordinates.longitude);
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const latDelta = (maxLat - minLat) * 1.5;
  const lonDelta = (maxLon - minLon) * 1.5;

  return {
    latitude: centerLat,
    longitude: centerLon,
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lonDelta, 0.01),
  };
}

/**
 * Convert region to latitude/longitude bounds for querying
 */
export function regionToBounds(region: MapRegion): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const halfLatDelta = region.latitudeDelta / 2;
  const halfLonDelta = region.longitudeDelta / 2;

  return {
    minLat: region.latitude - halfLatDelta,
    maxLat: region.latitude + halfLatDelta,
    minLon: region.longitude - halfLonDelta,
    maxLon: region.longitude + halfLonDelta,
  };
}

/**
 * Check if two locations are close to each other
 */
export function areLocationsClose(
  loc1: LocationData,
  loc2: LocationData,
  thresholdKm: number = 1
): boolean {
  const distance = calculateDistance(
    loc1.coordinates.latitude,
    loc1.coordinates.longitude,
    loc2.coordinates.latitude,
    loc2.coordinates.longitude
  );
  return distance <= thresholdKm;
}

/**
 * Get map zoom level for a given radius
 */
export function getZoomLevelForRadius(radiusKm: number): number {
  // Rough conversion: 1 degree ≈ 111 km at equator
  // This is very approximate
  if (radiusKm <= 1) return 15;
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  if (radiusKm <= 50) return 10;
  return 9;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lonDir}`;
}