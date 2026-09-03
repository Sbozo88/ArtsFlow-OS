import type {
  AuthUser,
  AuthRole,
  Permission,
  PlatformPermission,
  Organisation,
  OrganisationMembership,
  PlatformRole
} from '../types';

export const PLATFORM_PERMISSIONS: PlatformPermission[] = [
  'platform.dashboard.read',
  'platform.organisations.read',
  'platform.organisations.create',
  'platform.organisations.manage_status',
  'platform.users.read',
  'platform.health.read',
  'platform.audit.read',
  'platform.settings.manage',
  'platform.plans.read',
  'platform.plans.manage',
  'platform.features.read',
  'platform.features.manage',
  'platform.entitlements.manage'
];

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
  super_admin: [...ALL_PERMISSIONS, ...PLATFORM_PERMISSIONS],
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

export interface PermissionEvaluationContext {
  user?: AuthUser | { role?: AuthRole; platformRole?: PlatformRole } | null;
  activeOrganisation?: Organisation | null;
  membership?: OrganisationMembership | null;
  permission: Permission;
}

export const permissionService = {
  /**
   * Evaluates whether a given actor has a specific permission.
   * Supports both context evaluation ({ user, activeOrganisation, membership, permission })
   * and legacy direct signature (user, permission).
   */
  can(
    contextOrUser: PermissionEvaluationContext | AuthUser | { role?: AuthRole; platformRole?: PlatformRole } | null,
    legacyPermission?: Permission
  ): boolean {
    // 1. Context-based invocation
    if (contextOrUser && typeof contextOrUser === 'object' && 'permission' in contextOrUser) {
      const ctx = contextOrUser as PermissionEvaluationContext;
      const targetPermission = ctx.permission;

      // Platform permissions require platformRole === 'super_admin' or user.role === 'super_admin'
      const isPlatformPerm = PLATFORM_PERMISSIONS.includes(targetPermission as PlatformPermission);
      if (isPlatformPerm) {
        return (
          ctx.user?.platformRole === 'super_admin' ||
          ctx.user?.role === 'super_admin'
        );
      }

      // If evaluating membership in organisation context:
      if (ctx.membership) {
        if (ctx.membership.membershipStatus !== 'active') {
          return false;
        }
        const permissions = ROLE_PERMISSIONS[ctx.membership.role as AuthRole] || [];
        return permissions.includes(targetPermission);
      }

      // If evaluating platform super_admin user without specific organisation membership
      if (ctx.user && ctx.user.platformRole === 'super_admin') {
        if (['platform.read', 'platform.manage', 'users.manage'].includes(targetPermission)) {
          return true;
        }
      }

      // Fallback to direct user role evaluation
      const role = ctx.user?.role;
      if (!role) return false;
      const permissions = ROLE_PERMISSIONS[role] || [];
      return permissions.includes(targetPermission);
    }

    // 2. Legacy direct invocation can(user, permission)
    const user = contextOrUser as (AuthUser | { role?: AuthRole; platformRole?: PlatformRole } | null);
    if (!user || !legacyPermission) return false;

    // Platform permissions require super_admin
    const isPlatformPerm = PLATFORM_PERMISSIONS.includes(legacyPermission as PlatformPermission);
    if (isPlatformPerm) {
      return (
        user.platformRole === 'super_admin' ||
        user.role === 'super_admin'
      );
    }

    if (!user.role) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(legacyPermission);
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
  },

  /**
   * Evaluates if a platformRole has a specific PlatformPermission.
   */
  hasPlatformPermission(platformRole: PlatformRole | undefined, permission: PlatformPermission): boolean {
    if (platformRole === 'super_admin') {
      return PLATFORM_PERMISSIONS.includes(permission);
    }
    return false;
  }
};
