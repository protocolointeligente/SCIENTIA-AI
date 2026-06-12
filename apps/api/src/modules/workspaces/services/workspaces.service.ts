import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PERMISSION_MATRIX } from '../../../common/permissions/permission-matrix';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';

const DEFAULT_ROLES: { name: string; baseCode: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }[] = [
  { name: 'Owner', baseCode: 'OWNER' },
  { name: 'Admin', baseCode: 'ADMIN' },
  { name: 'Editor', baseCode: 'EDITOR' },
  { name: 'Viewer', baseCode: 'VIEWER' },
];

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a workspace under an organization, seeds the default
   * (OWNER/ADMIN/EDITOR/VIEWER) roles, and adds `ownerUserId` as OWNER.
   */
  async createWorkspace(organizationId: string, ownerUserId: string, dto: CreateWorkspaceDto) {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          organizationId,
          name: dto.name,
          slug: dto.slug,
        },
      });

      const roles = await Promise.all(
        DEFAULT_ROLES.map((role) =>
          tx.workspaceRole.create({
            data: {
              workspaceId: workspace.id,
              name: role.name,
              baseCode: role.baseCode,
              permissions: PERMISSION_MATRIX[role.baseCode],
            },
          }),
        ),
      );

      const ownerRole = roles.find((r) => r.baseCode === 'OWNER')!;

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: ownerUserId,
          roleId: ownerRole.id,
        },
      });

      await tx.creditWallet.create({
        data: { workspaceId: workspace.id, balance: 0 },
      });

      return workspace;
    });
  }

  async listForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    return workspace;
  }

  async listMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true, role: true },
    });
  }
}
