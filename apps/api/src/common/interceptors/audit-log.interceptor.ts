import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditMetadata, AUDIT_KEY } from '../decorators/audit.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Persists an AuditLog entry for handlers decorated with `@Audit()`,
 * after the response has been produced successfully.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<AuditMetadata | undefined>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((result: unknown) => {
        const entityId =
          (result as { id?: string } | undefined)?.id ?? request.params?.id ?? 'unknown';

        void this.prisma.auditLog.create({
          data: {
            workspaceId: request.workspaceContext?.workspaceId,
            userId: request.user?.id,
            action: metadata.action,
            entityType: metadata.entityType,
            entityId,
          },
        });
      }),
    );
  }
}
