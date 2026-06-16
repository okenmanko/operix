import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export function RequirePermission(module: string, action: PermissionAction = 'view') {
  return SetMetadata(REQUIRED_PERMISSION_KEY, { module, action });
}
