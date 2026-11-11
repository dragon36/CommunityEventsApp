// =============================================================================
// COMMUNITY EVENTS APP - FIREBASE DATABASE ADAPTER
// =============================================================================
// This file wraps the existing Firebase firestore service to conform to the DatabaseService interface.

import { userService, eventService, adminService, calculateDistance } from './firestore';
import type { DatabaseService } from '../interfaces';

export const firebaseDatabaseAdapter: DatabaseService = {
  // User Profile Operations
  createUserProfile: userService.createUserProfile,
  getUserProfile: userService.getUserProfile,
  updateUserProfile: userService.updateUserProfile,
  updateLastLogin: userService.updateLastLogin,
  getUserByEmail: userService.getUserByEmail,

  // User Management (Admin)
  getUsersPaginated: userService.getUsersPaginated,
  updateUserRole: userService.updateUserRole,
  toggleUserActive: userService.toggleUserActive,
  requestPasswordReset: userService.requestPasswordReset,

  // Event Operations
  createEvent: eventService.createEvent,
  getEvent: eventService.getEvent,
  updateEvent: eventService.updateEvent,
  deleteEvent: eventService.deleteEvent,

  // Event Queries
  getApprovedEvents: eventService.getApprovedEvents,
  getUserEvents: eventService.getUserEvents,

  // Admin Event Operations
  getPendingEvents: eventService.getPendingEvents,
  approveEvent: eventService.approveEvent,
  rejectEvent: eventService.rejectEvent,
  getAllEventsPaginated: eventService.getAllEventsPaginated,

  // Admin Stats & Health
  getStats: adminService.getStats,
  updateStats: adminService.updateStats,
  getHealth: adminService.getHealth,
  updateHealth: adminService.updateHealth,
  getActionLog: adminService.getActionLog,

  // Utility
  calculateDistance,
};

export default firebaseDatabaseAdapter;