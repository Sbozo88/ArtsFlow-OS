import type { AuthUser, AuthRole, Permission } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  'learners.read',
  'learners.write',
  'learners.archive',
  'attendance.read',
  'attendance.write',
  'finance.read',
  'finance.write',
  'finance.reverse',
  'events.read',
  'events.manage',
  'staff.read',
  'staff.verify_timesheets',
  'staff.approve_timesheets',
  'settings.read',
  'settings.manage',
  'automation.read',
  'automation.manage',
  'platform.read',
  'platform.manage',
  'users.manage'
];

export const ROLE_PERMISSIONS: Record<AuthRole, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  organisation_admin: [...ALL_PERMISSIONS],
  programme_director: [
    'learners.read',
    'learners.write',
    'attendance.read',
    'attendance.write',
    'events.read',
    'events.manage',
    'staff.read',
    'staff.verify_timesheets',
    'settings.read',
    'automation.read'
  ],
  finance: [
    'finance.read',
    'finance.write',
    'finance.reverse',
    'learners.read',
    'settings.read'
  ],
  teacher: [
    'learners.read',
    'attendance.read',
    'attendance.write',
    'events.read'
  ],
  viewer: [
    'learners.read',
    'attendance.read',
    'finance.read',
    'events.read',
    'staff.read',
    'settings.read'
  ],
  guardian: [],
  learner: []
};

export const permissionService = {
  /**
   * Evaluates whether a given user has a specific permission.
   */
  can(user: AuthUser | { role?: AuthRole } | null, permission: Permission): boolean {
    if (!user || !user.role) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  },

  /**
   * Retrieves all permissions granted to a given role.
   */
  getPermissionsForRole(role?: AuthRole): Permission[] {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
  },

  /**
   * Checks if user has all of the requested permissions.
   */
  hasAll(user: AuthUser | { role?: AuthRole } | null, permissions: Permission[]): boolean {
    return permissions.every(p => this.can(user, p));
  },

  /**
   * Checks if user has at least one of the requested permissions.
   */
  hasAny(user: AuthUser | { role?: AuthRole } | null, permissions: Permission[]): boolean {
    return permissions.some(p => this.can(user, p));
  }
};
