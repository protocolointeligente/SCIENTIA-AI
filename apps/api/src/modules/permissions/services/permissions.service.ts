import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PERMISSION_MATRIX, Permission, resolvePermissions } from '../../../common/permissions/permission-matrix';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(workspaceId: string) {
    return this.prisma.workspaceRole.findMany({ where: { workspaceId } });
  }

  /**
   * Creates a CUSTOM role. `permissions` is intersected with the
   * VIEWER base set — custom roles can only restrict, never expand.
   */
  async createCustomRole(workspaceId: string, name: string, permissions: Permission[]) {
    const invalid = permissions.filter((p) => !PERMISSION_MATRIX.VIEWER.includes(p));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Custom roles cannot grant permissions beyond the VIEWER base set: ${invalid.join(', ')}`,
      );
    }

    return this.prisma.workspaceRole.create({
      data: {
        workspaceId,
        name,
        baseCode: 'CUSTOM',
        permissions: resolvePermissions('CUSTOM', permissions),
      },
    });
  }
}
