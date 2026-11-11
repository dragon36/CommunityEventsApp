import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { AdminEvent, EventType } from '@/types';

interface EventApprovalCardProps {
  event: AdminEvent;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
  approving?: boolean;
  rejecting?: boolean;
}

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

export function EventApprovalCard({
  event,
  onApprove,
  onReject,
  onViewDetails,
  approving,
  rejecting,
}: EventApprovalCardProps) {
  const color = EVENT_TYPE_COLORS[event.type];
  const iconName = EVENT_TYPE_ICONS[event.type];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card style={styles.card} elevation={2}>
      <View style={styles.header}>
        <View style={[{ backgroundColor: color }, styles.typeBadge]}>
          <Ionicons name={iconName as any} size={18} color="#FFFFFF" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>
            By {event.creatorName} • {new Date(event.createdAt.toDate()).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={onViewDetails} style={styles.detailsButton}>
          <Ionicons name="eye-outline" as any size={22} color="#666666" />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" as any size={16} color="#999999" />
          <Text style={styles.infoText}>{event.location.venueName || event.location.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" as any size={16} color="#999999" />
          <Text style={styles.infoText}>
            {formatDate(event.startDate.toDate())} - {formatDate(event.endDate.toDate())}
          </Text>
        </View>

        {event.images && event.images.length > 0 && (
          <View style={styles.images}>
            {event.images.slice(0, 3).map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="Reject"
          variant="outline"
          size="small"
          onPress={onReject}
          loading={rejecting}
          style={styles.rejectButton}
        />
        <Button
          title="Approve"
          variant="primary"
          size="small"
          onPress={onApprove}
          loading={approving}
          style={styles.approveButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  meta: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  detailsButton: {
    padding: 8,
  },
  details: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
  },
  images: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  rejectButton: {
    flex: 1,
  },
  approveButton: {
    flex: 1,
  },
});

export default EventApprovalCard;