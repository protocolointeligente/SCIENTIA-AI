import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { CurrentWorkspace, WorkspaceContext } from '../../../common/decorators/current-workspace.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../../common/permissions/permission-matrix';
import { WorkspacesService } from '../services/workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.listForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findById(id, user.id);
  }

  @Get(':id/members')
  @RequirePermission(PERMISSIONS.MEMBERS_MANAGE)
  members(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.workspacesService.listMembers(workspace.workspaceId);
  }
}
