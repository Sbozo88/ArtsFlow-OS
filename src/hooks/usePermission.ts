import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { permissionService } from '../services/permissionService';
import type { Permission, AuthRole } from '../types';

export function usePermission(permission: Permission): boolean {
  const { authUser } = useAuth();
  return useMemo(() => {
    return permissionService.can(authUser, permission);
  }, [authUser, permission]);
}

export function usePermissions() {
  const { authUser } = useAuth();

  const permissions = useMemo(() => {
    return permissionService.getPermissionsForRole(authUser?.role);
  }, [authUser?.role]);

  const can = (permission: Permission) => {
    return permissionService.can(authUser, permission);
  };

  const hasAll = (reqPermissions: Permission[]) => {
    return permissionService.hasAll(authUser, reqPermissions);
  };

  const hasAny = (reqPermissions: Permission[]) => {
    return permissionService.hasAny(authUser, reqPermissions);
  };

  return {
    can,
    hasAll,
    hasAny,
    permissions,
    role: authUser?.role as AuthRole | undefined
  };
}
