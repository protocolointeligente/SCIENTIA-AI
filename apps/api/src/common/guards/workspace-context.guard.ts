import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { resolvePermissions } from '../permissions/permission-matrix';

/**
 * Resolves the workspace referenced by the `x-workspace-id` header,
 * verifies the current user is a member, and attaches the resulting
 * `WorkspaceContext` (workspaceId, role, effective permissions) to the
 * request for use by PermissionsGuard and downstream handlers.
 */
@Injectable()
export class WorkspaceContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const workspaceId = request.headers['x-workspace-id'] as string | undefined;

    if (!workspaceId) {
      throw new ForbiddenException('Missing x-workspace-id header');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: request.user.id } },
      include: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    const permissions = resolvePermissions(
      member.role.baseCode,
      Array.isArray(member.role.permissions) ? (member.role.permissions as string[]) : null,
    );

    request.workspaceContext = {
      workspaceId,
      roleCode: member.role.baseCode,
      permissions,
    };

    return true;
  }
}
