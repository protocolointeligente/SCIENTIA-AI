import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Creates an organization, makes `userId` an ADMIN org member, and
   * provisions a default workspace ("Main") owned by that user.
   */
  async create(userId: string, dto: CreateOrganizationDto) {
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
    });

    const workspace = await this.workspacesService.createWorkspace(organization.id, userId, {
      name: 'Main',
      slug: 'main',
    });

    return { organization, workspace };
  }

  async findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: { workspaces: true, plan: true },
    });
  }
}
