import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import type { AdminUser } from '@/types';

interface UserManagementTableProps {
  users: AdminUser[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onToggleActive: (uid: string, isActive: boolean) => void;
  onChangeRole: (uid: string, role: 'user' | 'admin') => void;
  onResetPassword: (email: string) => void;
  onViewDetails: (user: AdminUser) => void;
}

export function UserManagementTable({
  users,
  loading,
  hasMore,
  onLoadMore,
  onToggleActive,
  onChangeRole,
  onResetPassword,
  onViewDetails,
}: UserManagementTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'toggle' | 'role' | 'reset'>('toggle');

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? user.isActive : !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRowPress = (user: AdminUser) => {
    setSelectedUser(user);
    setShowActionModal(true);
  };

  const renderItem = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handleRowPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.userMeta}>
        <View style={[{ backgroundColor: item.role === 'admin' ? '#FF6B35' : '#2EC4B6' }, styles.roleBadge]}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
        <View style={[{ backgroundColor: item.isActive ? '#2EC4B6' : '#E71D36' }, styles.statusBadge]}>
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
    </TouchableOpacity>
  );

  const renderActionModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={`User Actions: ${selectedUser.displayName}`}
        size="small"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
          <Text style={styles.modalUserRole}>Role: {selectedUser.role}</Text>
          <Text style={styles.modalUserStatus}>Status: {selectedUser.isActive ? 'Active' : 'Inactive'}</Text>

          <View style={styles.modalButtons}>
            <Button
              title={selectedUser.isActive ? 'Disable User' : 'Enable User'}
              variant={selectedUser.isActive ? 'danger' : 'primary'}
              size="medium"
              fullWidth
              onPress={() => {
                onToggleActive(selectedUser.uid, !selectedUser.isActive);
                setShowActionModal(false);
              }}
            />
            <Button
              title={selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              variant="outline"
              size="medium"
              fullWidth
              onPress={() => {
                onChangeRole(selectedUser.uid, selectedUser.role === 'admin' ? 'user' : 'admin');
                setShowActionModal(false);
              }}
            />
            <Button
              title="Reset Password"
              variant="secondary"
              size="medium"
              fullWidth
              onPress={() => {
                onResetPassword(selectedUser.email);
                setShowActionModal(false);
              }}
            />
            <Button
              title="Cancel"
              variant="ghost"
              size="medium"
              fullWidth
              onPress={() => setShowActionModal(false)}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filters */}
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999999"
        />

        <View style={styles.filterGroup}>
          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Role</Text>
            <View style={styles.filterOptions}>
              {['all', 'user', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterOption,
                    filterRole === role && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterRole(role as 'all' | 'user' | 'admin')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterRole === role && styles.filterOptionTextActive,
                  ]}>
                    {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'active', 'inactive'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    filterStatus === status && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterStatus(status as 'all' | 'active' | 'inactive')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterStatus === status && styles.filterOptionTextActive,
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.uid}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#999999" />
            <Text style={styles.emptyText}>
              {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                ? 'No users match your filters'
                : 'No users found'}
            </Text>
          </View>
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && hasMore ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>Loading more users...</Text>
            </View>
          ) : undefined
        }
        contentContainerStyle={styles.listContent}
      />

      {renderActionModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  filter: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 6,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterOptionActive: {
    backgroundColor: '#2EC4B6',
    borderColor: '#2EC4B6',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#666666',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2EC4B6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
  },
  userEmail: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
    marginTop: 12,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999999',
  },
  modalContent: {
    gap: 16,
  },
  modalUserEmail: {
    fontSize: 15,
    color: '#666666',
  },
  modalUserRole: {
    fontSize: 14,
    color: '#333333',
  },
  modalUserStatus: {
    fontSize: 14,
    color: '#333333',
  },
  modalButtons: {
    gap: 10,
    marginTop: 8,
  },
});

export default UserManagementTable;