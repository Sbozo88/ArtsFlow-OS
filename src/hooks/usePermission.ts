import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useActiveOrganisation } from '../contexts/ActiveOrganisationContext';
import { permissionService } from '../services/permissionService';
import type { Permission, AuthRole } from '../types';

export function usePermission(permission: Permission): boolean {
  const { authUser } = useAuth();
  const { activeMembership, activeOrganisation } = useActiveOrganisation();
  return useMemo(() => {
    return permissionService.can({ user: authUser, membership: activeMembership, activeOrganisation, permission });
  }, [authUser, activeMembership, activeOrganisation, permission]);
}

export function usePermissions() {
  const { authUser } = useAuth();
  const { activeMembership, activeOrganisation } = useActiveOrganisation();

  const permissions = useMemo(() => {
    return permissionService.getPermissionsForRole(activeMembership?.role as AuthRole | undefined);
  }, [activeMembership?.role]);

  const can = (permission: Permission) => {
    return permissionService.can({ user: authUser, membership: activeMembership, activeOrganisation, permission });
  };

  const hasAll = (reqPermissions: Permission[]) => {
    return reqPermissions.every((permission) => can(permission));
  };

  const hasAny = (reqPermissions: Permission[]) => {
    return reqPermissions.some((permission) => can(permission));
  };

  return {
    can,
    hasAll,
    hasAny,
    permissions,
    role: activeMembership?.role as AuthRole | undefined
  };
}
