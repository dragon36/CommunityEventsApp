// =============================================================================
// COMMUNITY EVENTS APP - EVENTS LIST SCREEN
// =============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/hooks';
import { Event } from '@/types';
import { format, isToday, isTomorrow } from 'date-fns';
import { COLORS } from '@/constants';

// Event Card Component
const EventCard: React.FC<{ event: Event; onPress: () => void }> = ({ event, onPress }) => {
  const { colors, spacing, typography, shadows } = useTheme();

  const startDate = new Date(event.startDate);
  const isTodayEvent = isToday(startDate);
  const isTomorrowEvent = isTomorrow(startDate);

  const getDateLabel = () => {
    if (isTodayEvent) return 'Today';
    if (isTomorrowEvent) return 'Tomorrow';
    return format(startDate, 'EEEE, MMM d');
  };

  const getTimeLabel = () => {
    return format(startDate, 'h:mm a');
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.md, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Event Image */}
      {event.coverImageUrls?.[0] && (
        <Image
          source={{ uri: event.coverImageUrls[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        {/* Category & Date */}
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>{event.category}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{getDateLabel()}</Text>
            <Text style={[styles.dateTime, { color: colors.textPrimary }]}>{getTimeLabel()}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <Text style={[styles.locationIcon, { color: colors.textSecondary }]}>📍</Text>
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {event.location.venueName || `${event.location.city}, ${event.location.state}`}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.attendeeCount}>
            <Text style={[styles.attendeeIcon, { color: colors.textTertiary }]}>👥</Text>
            <Text style={[styles.attendeeText, { color: colors.textSecondary }]}>
              {event.attendeeIds.length} going
            </Text>
          </View>
          {event.maxAttendees && (
            <View style={styles.capacity}>
              <Text style={[styles.capacityText, { color: colors.textTertiary }]}>
                {event.attendeeIds.length}/{event.maxAttendees}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Screen
export const EventsListScreen = () => {
  const { events, loading, error, hasMore, loadMore, refetch } = useEvents();
  const { colors, spacing, shadows } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: Event }) => (
    <EventCard event={item} onPress={() => {}} />
  ), []);

  const keyExtractor = useCallback((item: Event) => item.id, []);

  if (loading && events.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && events.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Failed to load events</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{error.message}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          hasMore && (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  attendeeCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeIcon: {
    marginRight: 4,
  },
  attendeeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  capacity: {},
  capacityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default EventsListScreen;