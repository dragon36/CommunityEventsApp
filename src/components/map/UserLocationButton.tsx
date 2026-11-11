import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/useLocation';

interface UserLocationButtonProps {
  style?: ViewStyle;
  onPress?: () => void;
}

export function UserLocationButton({ style, onPress }: UserLocationButtonProps) {
  const { getCurrentLocation, hasPermission, loading } = useLocation();

  const handlePress = async () => {
    onPress?.();
    await getCurrentLocation();
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityLabel="Center map on my location"
    >
      <Ionicons
        name={(hasPermission ? 'location-outline' : 'location-off-outline') as any}
        size={24}
        color={hasPermission ? '#2EC4B6' : '#999999'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default UserLocationButton;