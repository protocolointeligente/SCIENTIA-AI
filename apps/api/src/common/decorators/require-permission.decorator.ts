import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions/permission-matrix';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Requires the current workspace member to hold all listed permissions.
 * Enforced by PermissionsGuard.
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
