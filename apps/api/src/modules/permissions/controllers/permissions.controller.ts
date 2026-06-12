import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace, WorkspaceContext } from '../../../common/decorators/current-workspace.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../../common/permissions/permission-matrix';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/roles')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_MANAGE)
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.permissionsService.listRoles(workspace.workspaceId);
  }
}
