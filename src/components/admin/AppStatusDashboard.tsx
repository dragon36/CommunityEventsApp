import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { AppHealth, AdminStats } from '@/types';
import { getDatabaseService } from '@/services/factory';

interface AppStatusDashboardProps {
  health?: AppHealth | null;
  stats?: AdminStats | null;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
}

const SERVICE_COLORS: Record<string, string> = {
  operational: '#2EC4B6',
  degraded: '#FF9F1C',
  outage: '#E71D36',
};

const SERVICE_ICONS: Record<string, string> = {
  operational: 'checkmark-circle-outline',
  degraded: 'warning-outline',
  outage: 'close-circle-outline',
};

export function AppStatusDashboard({
  health,
  stats,
  onRefresh,
  refreshing = false,
}: AppStatusDashboardProps) {
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    if (health?.lastChecked) {
      setLastChecked(health.lastChecked.toDate());
    }
  }, [health]);

  const getStatusColor = (status: string) => SERVICE_COLORS[status] || '#999999';
  const getStatusIcon = (status: string) => SERVICE_ICONS[status] || 'help-outline';

  const formatUptime = (status: string) => {
    if (status === 'operational') return '99.9%';
    if (status === 'degraded') return '99.5%';
    return '95.0%';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Overall Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[{ backgroundColor: getStatusColor(health?.status || 'operational') }, styles.statusIndicator]}>
            <Ionicons name={getStatusIcon(health?.status || 'operational') as any} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[
              styles.statusTitle,
              { color: getStatusColor(health?.status || 'operational') },
            ]}>
              System {health?.status ? health.status.charAt(0).toUpperCase() + health.status.slice(1) : 'Healthy'}
            </Text>
            <Text style={styles.statusSubtitle}>
              Last checked: {lastChecked ? lastChecked.toLocaleString() : 'Unknown'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Services Grid */}
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.servicesGrid}>
        {health && [
          { key: 'firestore', label: 'Firestore', status: health.firestore },
          { key: 'auth', label: 'Authentication', status: health.auth },
          { key: 'storage', label: 'Storage', status: health.storage },
          { key: 'functions', label: 'Cloud Functions', status: health.functions },
        ].map((service) => (
          <Card key={service.key} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={[{ backgroundColor: getStatusColor(service.status) }, styles.serviceIndicator]}>
                <Ionicons name={getStatusIcon(service.status) as any} size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.serviceTitle}>{service.label}</Text>
            </View>
            <View style={styles.serviceDetails}>
              <Text style={[
                styles.serviceStatus,
                { color: getStatusColor(service.status) },
              ]}>
                {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              </Text>
              <Text style={styles.serviceUptime}>Uptime: {formatUptime(service.status)}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.statsGrid}>
        {stats && [
          { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: 'people-outline', color: '#2EC4B6' },
          { label: 'Active Users', value: stats.activeUsers.toLocaleString(), icon: 'person-outline', color: '#2EC4B6' },
          { label: 'Pending Events', value: stats.pendingEvents.toLocaleString(), icon: 'time-outline', color: '#FF9F1C' },
          { label: 'Approved Events', value: stats.approvedEvents.toLocaleString(), icon: 'checkmark-circle-outline', color: '#2EC4B6' },
          { label: 'Rejected Events', value: stats.rejectedEvents.toLocaleString(), icon: 'close-circle-outline', color: '#E71D36' },
          { label: 'This Week', value: stats.eventsThisWeek.toLocaleString(), icon: 'calendar-outline', color: '#FF6B35' },
        ].map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="refresh-outline" as any size={24} color="#2EC4B6" />
          <Text style={styles.actionLabel}>Refresh Health</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="analytics-outline" as any size={24} color="#FF6B35" />
          <Text style={styles.actionLabel}>View Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="settings-outline" as any size={24} color="#FF9F1C" />
          <Text style={styles.actionLabel}>App Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="shield-outline" as any size={24} color="#2EC4B6" />
          <Text style={styles.actionLabel}>Security Audit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  serviceIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  serviceDetails: {
    gap: 4,
  },
  serviceStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  serviceUptime: {
    fontSize: 11,
    color: '#999999',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
});

export default AppStatusDashboard;