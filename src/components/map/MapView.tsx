import React, { useRef, useEffect, useState, useCallback } from 'react';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { View, StyleSheet, Text, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MapRegion, Event, EventType, LocationData } from '@/types';

// ============================================
// Types
// ============================================

interface MapViewProps {
  region: MapRegion;
  onRegionChange: (region: MapRegion) => void;
  events: Event[];
  selectedEvent?: Event | null;
  onSelectEvent: (event: Event | null) => void;
  onPressMap?: (location: LocationData) => void;
  userLocation?: LocationData | null;
  followUserLocation?: boolean;
  showUserLocation?: boolean;
  style?: ViewStyle;
}

// Event type colors
const EVENT_TYPE_COLORS: Record<EventType, string> = {
  parade: '#FF6B35',
  trick_or_treat: '#FF9F1C',
  special_event: '#2EC4B6',
};

const EVENT_TYPE_ICONS: Record<EventType, string> = {
  parade: 'musical-notes-outline',
  trick_or_treat: 'leaf-outline',
  special_event: 'sparkles-outline',
};

// ============================================
// Custom Marker Component
// ============================================

interface EventMarkerProps {
  event: Event;
  selected: boolean;
  onPress: () => void;
}

function EventMarkerComponent({ event, selected, onPress }: EventMarkerProps) {
  const color = EVENT_TYPE_COLORS[event.type];
  const iconName = EVENT_TYPE_ICONS[event.type];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.markerContainer,
          { backgroundColor: color, transform: [{ scale: selected ? 1.3 : 1 }] },
        ]}
      >
        <Ionicons name={iconName} size={20} color="#FFFFFF" />
        {selected && (
          <View style={styles.markerPulse} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// User Location Marker
// ============================================

interface UserLocationMarkerProps {
  location: LocationData;
  accuracy?: number;
}

function UserLocationMarker({ location, accuracy }: UserLocationMarkerProps) {
  return (
    <View style={styles.userLocationContainer}>
      <View style={styles.userLocationDot} />
      {accuracy && accuracy > 0 && (
        <View
          style={[
            styles.accuracyCircle,
            {
              width: accuracy * 2,
              height: accuracy * 2,
            },
          ]}
        />
      )}
    </View>
  );
}

// ============================================
// Callout Component
// ============================================

interface EventCalloutProps {
  event: Event;
  onPress: () => void;
  onClose: () => void;
}

function EventCallout({ event, onPress, onClose }: EventCalloutProps) {
  const color = EVENT_TYPE_COLORS[event.type];

  return (
    <View style={styles.calloutContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.calloutContent}>
        <View style={[styles.calloutColorBar, { backgroundColor: color }]} />
        <View style={styles.calloutInfo}>
          <Text style={styles.calloutTitle}>{event.title}</Text>
          <Text style={styles.calloutType}>{event.type.replace('_', ' ')}</Text>
          <Text style={styles.calloutLocation}>{event.location.name}</Text>
          <Text style={styles.calloutDate}>
            {new Date(event.startDate.toDate()).toLocaleDateString()} -{' '}
            {new Date(event.endDate.toDate()).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.calloutClose}>
          <Ionicons name="close-outline" size={20} color="#999999" />
        </TouchableOpacity>
      </TouchableOpacity>
      <View style={[styles.calloutArrow, { borderBottomColor: '#FFFFFF' }]} />
    </View>
  );
}

// ============================================
// Main MapView Component
// ============================================

export function MapViewComponent({
  region,
  onRegionChange,
  events,
  selectedEvent,
  onSelectEvent,
  onPressMap,
  userLocation,
  followUserLocation = false,
  showUserLocation = true,
  style,
}: MapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Animate to user location when it changes
  useEffect(() => {
    if (followUserLocation && userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...region,
          latitude: userLocation.coordinates.latitude,
          longitude: userLocation.coordinates.longitude,
        },
        500
      );
    }
  }, [userLocation, followUserLocation, region]);

  const handleRegionChange = useCallback(
    (newRegion: MapRegion) => {
      onRegionChange(newRegion);
    },
    [onRegionChange]
  );

  const handleMapPress = useCallback(
    (event: any) => {
      if (onPressMap) {
        onPressMap({
          name: 'Selected Location',
          address: '',
          coordinates: {
            latitude: event.nativeEvent.coordinate.latitude,
            longitude: event.nativeEvent.coordinate.longitude,
          },
        });
      }
      onSelectEvent(null);
    },
    [onPressMap, onSelectEvent]
  );

  const handleMarkerPress = useCallback((event: Event) => {
    onSelectEvent(event);
  }, [onSelectEvent]);

  // Render events as markers
  const eventMarkers = events
    .filter((e) => e.status === 'approved')
    .map((event) => (
      <Marker
        key={event.id}
        coordinate={event.location.coordinates}
        onPress={() => handleMarkerPress(event)}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <EventMarkerComponent
          event={event}
          selected={selectedEvent?.id === event.id}
          onPress={() => handleMarkerPress(event)}
        />
      </Marker>
    ));

  // Render user location
  const userLocationMarker = userLocation && showUserLocation ? (
    <Marker
      coordinate={userLocation.coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <UserLocationMarker location={userLocation} />
    </Marker>
  ) : null;

  // Render selected event callout
  const callout = selectedEvent ? (
    <Marker
      coordinate={selectedEvent.location.coordinates}
      anchor={{ x: 0.5, y: 1 }}
    >
      <EventCallout
        event={selectedEvent}
        onPress={() => handleMarkerPress(selectedEvent)}
        onClose={() => onSelectEvent(null)}
      />
    </Marker>
  ) : null;

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={[styles.map, style]}
      initialRegion={region}
      region={region}
      onRegionChange={handleRegionChange}
      onRegionChangeComplete={handleRegionChange}
      onPress={handleMapPress}
      onMapReady={() => setMapReady(true)}
      showsUserLocation={false} // We use custom marker
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={true}
      zoomEnabled={true}
      scrollEnabled={true}
      rotateEnabled={false}
      pitchEnabled={false}
      minZoomLevel={5}
      maxZoomLevel={18}
      mapType="standard"
    >
      {userLocationMarker}
      {eventMarkers}
      {callout}
    </MapView>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    opacity: 0.6,
  },
  userLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2EC4B6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  accuracyCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2EC4B6',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
  },
  calloutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 240,
    maxWidth: 280,
  },
  calloutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  calloutColorBar: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: 12,
  },
  calloutInfo: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  calloutType: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
    marginBottom: 1,
  },
  calloutLocation: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 1,
  },
  calloutDate: {
    fontSize: 11,
    color: '#999999',
  },
  calloutClose: {
    padding: 4,
  },
  calloutArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default MapViewComponent;