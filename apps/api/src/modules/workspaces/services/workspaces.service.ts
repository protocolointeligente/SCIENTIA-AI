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

  /**
   * Returns the user's first workspace, or creates a personal org + workspace
   * if they don't have one yet. Safe to call on every login.
   */
  async getOrProvision(userId: string): Promise<{ id: string; name: string; slug: string }> {
    const existing = await this.prisma.workspace.findFirst({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    const base = (user.email.split('@')[0] ?? 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const suffix = Date.now().toString(36);

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: `${user.fullName ?? user.email}`,
          slug: `${base}-${suffix}`,
          members: { create: { userId, role: 'ADMIN' } },
        },
      });

      const workspace = await tx.workspace.create({
        data: { organizationId: org.id, name: 'Meu Workspace', slug: 'meu-workspace' },
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
        data: { workspaceId: workspace.id, userId, roleId: ownerRole.id },
      });
      await tx.creditWallet.create({ data: { workspaceId: workspace.id, balance: 0 } });

      return { id: workspace.id, name: workspace.name, slug: workspace.slug };
    });
  }
}
