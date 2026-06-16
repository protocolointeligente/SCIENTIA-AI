import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace, WorkspaceContext } from '../../../common/decorators/current-workspace.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../../common/permissions/permission-matrix';
import { SearchService } from '../services/search.service';
import { SearchPapersDto } from '../dto/search-papers.dto';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('papers')
  @RequirePermission(PERMISSIONS.SEARCH_RUN)
  papers(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: SearchPapersDto,
  ) {
    return this.searchService.search(workspace.workspaceId, {
      query: dto.query,
      sources: dto.sources,
      filters: dto.filters,
      page: dto.page,
      pageSize: dto.pageSize,
    });
  }
}
