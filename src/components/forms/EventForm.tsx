import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, ViewStyle, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ImagePicker } from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EventTypeSelector } from './EventTypeSelector';
import { DateTimePicker } from './DateTimePicker';
import { LocationAutocomplete } from '@/components/map/LocationAutocomplete';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLocation } from '@/hooks/useLocation';
import { useCalendar } from '@/hooks/useCalendar';
import { eventService } from '@/services/firebase/firestore';
import { storageService } from '@/services/firebase/storage';
import { authService } from '@/services/firebase/auth';
import type { EventFormData, EventType, LocationData, Event } from '@/types';

// ============================================
// Validation Schema
// ============================================

const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  type: z.enum(['parade', 'trick_or_treat', 'special_event']),
  location: z.object({
    name: z.string().min(1, 'Location name is required'),
    address: z.string().min(1, 'Address is required'),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    placeId: z.string().optional(),
  }),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  images: z.array(z.any()).max(5, 'Maximum 5 images allowed').optional(),
  maxAttendees: z.number().int().positive().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type EventFormInputs = z.infer<typeof eventFormSchema>;

// ============================================
// Event Form Props
// ============================================

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  editingEvent?: Event | null;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// ============================================
// Event Form Component
// ============================================

export function EventForm({
  initialData,
  editingEvent,
  onSubmit,
  onCancel,
  loading = false,
}: EventFormProps) {
  const { getCurrentLocation, location: userLocation } = useLocation();
  const { createEventInCalendar } = useCalendar();

  const [images, setImages] = useState<{ uri: string; width?: number; height?: number }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  // Initialize form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInputs>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || editingEvent?.title || '',
      description: initialData?.description || editingEvent?.description || '',
      type: initialData?.type || editingEvent?.type || 'special_event',
      location: initialData?.location || editingEvent?.location || {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
      },
      startDate: initialData?.startDate ? new Date(initialData.startDate) : editingEvent?.startDate.toDate() || new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : editingEvent?.endDate.toDate() || new Date(Date.now() + 25 * 60 * 60 * 1000),
      maxAttendees: initialData?.maxAttendees || editingEvent?.maxAttendees,
      isPublic: initialData?.isPublic ?? editingEvent?.isPublic ?? true,
      tags: initialData?.tags || editingEvent?.tags || [],
    },
    mode: 'onChange',
  });

  // Watch form values
  const watchedValues = watch();

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationData) => {
    setSelectedLocation(location);
    setValue('location', location, { shouldValidate: true });
  }, [setValue]);

  // Handle image picker
  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 images allowed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.slice(0, 5 - images.length);
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload images
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploadingImages(true);
    const uploadPromises = images.map((image, index) =>
      storageService.uploadFile(image.uri, {
        folder: `events/temp`,
        onProgress: (progress) => {
          setUploadProgress((prev) => ({ ...prev, [index]: progress.progress }));
        },
      })
    );

    const results = await Promise.all(uploadPromises);
    setUploadingImages(false);
    return results.map((r) => r.url);
  };

  // Handle form submit
  const onSubmitForm = async (data: EventFormInputs) => {
    Keyboard.dismiss();

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      const formData: EventFormData = {
        ...data,
        images: images.map((img, i) => ({ uri: imageUrls[i] || img.uri })),
      };

      await onSubmit(formData);
    } catch (err) {
      console.error('Form submit error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit event');
    }
  };

  // Load initial data for editing
  useEffect(() => {
    if (editingEvent) {
      reset({
        title: editingEvent.title,
        description: editingEvent.description,
        type: editingEvent.type,
        location: editingEvent.location,
        startDate: editingEvent.startDate.toDate(),
        endDate: editingEvent.endDate.toDate(),
        maxAttendees: editingEvent.maxAttendees,
        isPublic: editingEvent.isPublic,
        tags: editingEvent.tags,
      });
      setSelectedLocation(editingEvent.location);
    }
  }, [editingEvent, reset]);

  const currentType = watchedValues.type;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{editingEvent ? 'Edit Event' : 'Create New Event'}</Text>
        <Text style={styles.subtitle}>
          {editingEvent ? 'Update event details' : 'Share a community event with your neighbors'}
        </Text>
      </View>

      {/* Event Type Selector */}
      <Controller
        name="type"
        control={control}
        rules: { required: true }
        render={({ field }) => (
          <EventTypeSelector
            value={field.value}
            onChange={field.onChange}
            label="Event Type"
            error={errors.type?.message}
            helperText="Select the type of event you're creating"
          />
        )}
      />

      {/* Title Input */}
      <Controller
        name="title"
        control={control}
        rules: { required: true, minLength: 3, maxLength: 100 }
        render={({ field }) => (
          <Input
            label="Event Title"
            placeholder="e.g., Main Street Halloween Parade"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.title?.message}
            helperText="A clear, descriptive title for your event"
            leftIcon={<Ionicons name="text-outline" size={22} color="#999999" />}
          />
        )}
      />

      {/* Description Input */}
      <Controller
        name="description"
        control={control}
        rules: { required: true, minLength: 10, maxLength: 2000 }
        render={({ field }) => (
          <Input
            label="Description"
            placeholder="Describe your event, what to expect, any special details..."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.description?.message}
            helperText="Include details like route, activities, age groups, etc."
            multiline
            numberOfLines={5}
            leftIcon={<Ionicons name="document-text-outline" size={22} color="#999999" />}
          />
        )}
      />

      {/* Location Autocomplete */}
      <Controller
        name="location"
        control={control}
        rules: { required: true }
        render={({ field }) => (
          <LocationAutocomplete
            label="Location"
            value={field.value?.name || ''}
            onChangeText={(text) => {
              // We handle location selection via onSelectLocation
            }}
            onSelectLocation={handleLocationSelect}
            placeholder="Search for a venue or address"
            userLocation={userLocation?.coordinates}
            error={errors.location?.message}
            helperText="Search or use your current location"
          />
        )}
      />

      {/* Use Current Location Button */}
      {userLocation && !selectedLocation && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={() => handleLocationSelect(userLocation)}
        >
          <Ionicons name="location-outline" size={18} color="#2EC4B6" />
          <Text style={styles.currentLocationText}>
            Use Current Location: {userLocation.name}
          </Text>
        </TouchableOpacity>
      )}

      {/* Date/Time Pickers */}
      <View style={styles.dateRow}>
        <Controller
          name="startDate"
          control={control}
          rules: { required: true }
          render={({ field }) => (
            <DateTimePicker
              label="Start Date & Time"
              value={field.value}
              onChange={field.onChange}
              mode="datetime"
              minDate={new Date()}
              error={errors.startDate?.message}
              style={styles.datePicker}
            />
          )}
        />
        <Controller
          name="endDate"
          control={control}
          rules: { required: true }
          render={({ field }) => (
            <DateTimePicker
              label="End Date & Time"
              value={field.value}
              onChange={field.onChange}
              mode="datetime"
              minDate={watchedValues.startDate || new Date()}
              error={errors.endDate?.message}
              style={styles.datePicker}
            />
          )}
        />
      </View>

      {/* Max Attendees */}
      <Controller
        name="maxAttendees"
        control={control}
        rules: { min: 1 }
        render={({ field }) => (
          <Input
            label="Max Attendees (Optional)"
            placeholder="Leave blank for unlimited"
            value={field.value?.toString() || ''}
            onChangeText={(text) => field.onChange(text ? parseInt(text) : undefined)}
            onBlur={field.onBlur}
            error={errors.maxAttendees?.message}
            helperText="Optional: limit the number of attendees"
            keyboardType="numeric"
            leftIcon={<Ionicons name="people-outline" size={22} color="#999999" />}
          />
        )}
      />

      {/* Public Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Ionicons name="globe-outline" size={22} color="#2EC4B6" />
          <View>
            <Text style={styles.toggleLabel}>Public Event</Text>
            <Text style={styles.toggleDescription}>
              Visible to everyone on the map
            </Text>
          </View>
        </View>
        <Controller
          name="isPublic"
          control={control}
          rules: { required: true }
          render={({ field }) => (
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ false: '#E0E0E0', true: '#2EC4B6' }}
              thumbColor={field.value ? '#FFFFFF' : '#FFFFFF'}
            />
          )}
        />
      </View>

      {/* Image Picker */}
      <View style={styles.imageSection}>
        <Text style={styles.sectionLabel}>Photos (Optional)</Text>
        <Text style={styles.sectionHint}>Up to 5 photos, max 5MB each</Text>

        {/* Image Grid */}
        <View style={styles.imageGrid}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              {uploadProgress[index] !== undefined && (
                <View style={styles.uploadProgress}>
                  <View
                    style={[
                      styles.uploadProgressBar,
                      { width: `${uploadProgress[index]}%` },
                    ]}
                  />
                </View>
              )}
            </View>
          ))}

          {/* Add Image Button */}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
              <Ionicons name="add-outline" size={32} color="#2EC4B6" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tags Input */}
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <TagsInput
            value={field.value}
            onChange={field.onChange}
            label="Tags (Optional)"
            placeholder="Add tags like: family, free, outdoor, halloween"
            helperText="Help people find your event"
          />
        )}
      />

      {/* Submit Buttons */}
      <View style={styles.buttonGroup}>
        <Button
          title={editingEvent ? 'Update Event' : 'Create Event'}
          variant="primary"
          size="large"
          fullWidth
          loading={loading || isSubmitting || uploadingImages}
          onPress={handleSubmit(onSubmitForm)}
        />
        <Button
          title="Cancel"
          variant="ghost"
          size="large"
          fullWidth
          onPress={onCancel}
        />
      </View>

      {loading && <LoadingOverlay visible={loading} text="Saving event..." />}
    </ScrollView>
  );
}

// ============================================
// Helper Components
// ============================================

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  placeholder: string;
  helperText: string;
}

function TagsInput({ value, onChange, label, placeholder, helperText }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !value.includes(tag) && value.length < 10) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  };

  return (
    <View style={styles.tagsContainer}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.tagsInputWrapper}>
        <View style={styles.tagsList}>
          {value.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)} style={styles.tagRemove}>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            style={styles.tagInput}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={addTag}
            placeholder={placeholder}
            placeholderTextColor="#999999"
          />
        </View>
      </View>
      <Text style={styles.helperText}>{helperText}</Text>
    </View>
  );
}

import { Image, Switch, TextInput } from 'react-native';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  datePicker: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#999999',
  },
  imageSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: '#2EC4B6',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2EC4B6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2EC4B6',
    textAlign: 'center',
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 56,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2EC4B6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tagRemove: {
    padding: 2,
  },
  tagInput: {
    flex: 1,
    minWidth: 100,
    fontSize: 15,
    color: '#333333',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#2EC4B6',
    fontWeight: '500',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
});

export default EventForm;