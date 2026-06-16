import { Body, Controller, Get, Param, Post, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { FichamentoService } from '../services/fichamento.service';
import { CreateFichamentoDto } from '../dto/create-fichamento.dto';
import { PrismaService } from '../../../common/prisma/prisma.service';

@ApiTags('papers')
@Controller('papers')
export class PapersController {
  constructor(
    private readonly fichamentoService: FichamentoService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get paper details with authors' })
  getPaper(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.paper.findUniqueOrThrow({
      where: { id },
      include: {
        authors: { include: { author: true }, orderBy: { position: 'asc' } },
      },
    });
  }

  @Get(':id/fichamento')
  @ApiOperation({ summary: 'Get existing fichamento for a paper in this workspace' })
  async getFichamento(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentWorkspace() workspace: { workspaceId: string },
  ) {
    const sheet = await this.prisma.scientificSheet.findUnique({
      where: { paperId_workspaceId: { paperId: id, workspaceId: workspace.workspaceId } },
      include: { fields: true },
    });
    return sheet;
  }

  @Post('fichamento')
  @ApiOperation({ summary: 'Generate AI fichamento for a paper (GPT-4o-mini or Claude Haiku)' })
  generateFichamento(
    @Body() dto: CreateFichamentoDto,
    @CurrentWorkspace() workspace: { workspaceId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fichamentoService.generate(dto, workspace.workspaceId, user.id);
  }
}
