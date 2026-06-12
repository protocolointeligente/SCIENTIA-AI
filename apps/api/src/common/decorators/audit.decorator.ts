import { SetMetadata } from '@nestjs/common';
import { AuditLogAction } from '@scientia/database';

export const AUDIT_KEY = 'auditAction';

export interface AuditMetadata {
  action: AuditLogAction;
  entityType: string;
}

/**
 * Marks a route handler as auditable. Read by AuditLogInterceptor, which
 * persists an AuditLog entry after a successful response.
 */
export const Audit = (action: AuditLogAction, entityType: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType } satisfies AuditMetadata);
