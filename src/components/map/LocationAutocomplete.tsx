import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet, TouchableOpacity, Text, ViewStyle, TextStyle, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceAutocomplete, getPlaceDetails, createDebouncedAutocomplete } from '@/services/maps/googlePlaces';
import type { LocationSuggestion, LocationData } from '@/types';

// ============================================
// Types
// ============================================

interface LocationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (location: LocationData) => void;
  placeholder?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  autoFocus?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  listStyle?: ViewStyle;
  itemStyle?: ViewStyle;
  itemTextStyle?: TextStyle;
  error?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

// ============================================
// Location Autocomplete Component
// ============================================

export function LocationAutocomplete({
  value,
  onChangeText,
  onSelectLocation,
  placeholder = 'Search for a location...',
  userLocation,
  autoFocus = false,
  style,
  inputStyle,
  containerStyle,
  listStyle,
  itemStyle,
  itemTextStyle,
  error,
  disabled = false,
  label,
  helperText,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<LocationSuggestion>>(null);

  // Debounced search function
  const debouncedSearch = useRef(
    createDebouncedAutocomplete(async (query: string) => {
      const results = await getPlaceAutocomplete(query, {
        location: userLocation || undefined,
        radius: 50000,
        types: '(regions)',
      });
      return results;
    }, 300)
  ).current;

  // Handle text change
  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      setSelectedIndex(-1);

      if (text.length >= 2) {
        debouncedSearch(text).then((results) => {
          setSuggestions(results);
          setLoading(false);
        });
      } else {
        setSuggestions([]);
      }
    },
    [onChangeText, debouncedSearch]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    async (suggestion: LocationSuggestion) => {
      setLoading(true);
      Keyboard.dismiss();

      try {
        const details = await getPlaceDetails(suggestion.placeId);
        if (details) {
          onSelectLocation(details);
          onChangeText(details.name);
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Failed to get place details:', err);
      } finally {
        setLoading(false);
        setFocused(false);
      }
    },
    [onSelectLocation, onChangeText]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setFocused(true);
    if (value.length >= 2) {
      debouncedSearch(value).then((results) => setSuggestions(results));
    }
  }, [value, debouncedSearch]);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Delay to allow selection
    setTimeout(() => setFocused(false), 200);
  }, []);

  // Render suggestion item
  const renderItem = useCallback(
    ({ item, index }: { item: LocationSuggestion; index: number }) => (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          index === selectedIndex && styles.suggestionItemSelected,
          itemStyle,
        ]}
        onPress={() => handleSelectSuggestion(item)}
        onPressIn={() => setSelectedIndex(index)}
        onPressOut={() => setSelectedIndex(-1)}
      >
        <Ionicons name="location-outline" size={20} color="#999999" style={styles.suggestionIcon} />
        <View style={styles.suggestionTextContainer}>
          <Text style={[styles.suggestionMainText, itemTextStyle]}>{item.structuredFormatting.mainText}</Text>
          {item.structuredFormatting.secondaryText && (
            <Text style={[styles.suggestionSecondaryText, itemTextStyle]}>{item.structuredFormatting.secondaryText}</Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [handleSelectSuggestion, selectedIndex, itemStyle, itemTextStyle]
  );

  // Keyboard navigation
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (suggestions.length > 0) setSelectedIndex(0);
    });
    return () => subscription.remove();
  }, [suggestions.length]);

  const showSuggestions = focused && suggestions.length > 0 && !disabled;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <Ionicons name="search-outline" size={22} color={focused ? '#2EC4B6' : '#999999'} style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          style={[styles.input, inputStyle]}
          autoFocus={autoFocus}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="search"
        />
        {loading && <Ionicons name="refresh" size={22} color="#2EC4B6" style={styles.loadingIcon} />}
      </View>

      {error && focused && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && !focused && <Text style={styles.helperText}>{helperText}</Text>}

      {showSuggestions && (
        <View style={[styles.suggestionsContainer, listStyle]}>
          <View style={{ maxHeight: 300 }}>
            <FlatList
              ref={listRef}
              data={suggestions}
              renderItem={renderItem}
              keyExtractor={(item) => item.placeId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: '#2EC4B6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 14,
  },
  loadingIcon: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#E71D36',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
    overflow: 'hidden',
  },
  suggestionsContent: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionItemSelected: {
    backgroundColor: '#F5F5F5',
  },
  suggestionIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    color: '#333333',
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
});

export default LocationAutocomplete;