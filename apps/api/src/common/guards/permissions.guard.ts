import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../permissions/permission-matrix';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

/**
 * Enforces permissions declared via `@RequirePermission()` against the
 * `WorkspaceContext` attached by WorkspaceContextGuard.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const granted: string[] = request.workspaceContext?.permissions ?? [];

    const missing = required.filter((permission) => !granted.includes(permission));

    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permissions: ${missing.join(', ')}`);
    }

    return true;
  }
}
