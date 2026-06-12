import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface WorkspaceContext {
  workspaceId: string;
  roleCode: string;
  permissions: string[];
}

export const CurrentWorkspace = createParamDecorator((_data: unknown, ctx: ExecutionContext): WorkspaceContext => {
  const request = ctx.switchToHttp().getRequest();
  return request.workspaceContext;
});
