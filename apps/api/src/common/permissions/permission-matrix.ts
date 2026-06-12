import { WorkspaceRoleType } from '@scientia/database';

/**
 * Canonical list of permissions in the system. Format: "<resource>:<action>".
 */
export const PERMISSIONS = {
  WORKSPACE_MANAGE: 'workspace:manage',
  MEMBERS_MANAGE: 'members:manage',
  PAPERS_READ: 'papers:read',
  PAPERS_WRITE: 'papers:write',
  SEARCH_RUN: 'search:run',
  REVIEWS_MANAGE: 'reviews:manage',
  EVIDENCE_RUN: 'evidence:run',
  ASSISTANT_USE: 'assistant:use',
  BIBLIOGRAPHY_MANAGE: 'bibliography:manage',
  BIBLIOMETRICS_READ: 'bibliometrics:read',
  EXPORTS_CREATE: 'exports:create',
  BILLING_MANAGE: 'billing:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const EDITOR_PERMISSIONS: Permission[] = [
  PERMISSIONS.PAPERS_READ,
  PERMISSIONS.PAPERS_WRITE,
  PERMISSIONS.SEARCH_RUN,
  PERMISSIONS.REVIEWS_MANAGE,
  PERMISSIONS.EVIDENCE_RUN,
  PERMISSIONS.ASSISTANT_USE,
  PERMISSIONS.BIBLIOGRAPHY_MANAGE,
  PERMISSIONS.BIBLIOMETRICS_READ,
  PERMISSIONS.EXPORTS_CREATE,
];

const VIEWER_PERMISSIONS: Permission[] = [
  PERMISSIONS.PAPERS_READ,
  PERMISSIONS.BIBLIOMETRICS_READ,
];

/**
 * Base permission set per role. CUSTOM roles start from a base role
 * (`baseCode`) and may only *restrict* — never expand — this set.
 */
export const PERMISSION_MATRIX: Record<Exclude<WorkspaceRoleType, 'CUSTOM'>, Permission[]> = {
  OWNER: ALL_PERMISSIONS as Permission[],
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.BILLING_MANAGE) as Permission[],
  EDITOR: EDITOR_PERMISSIONS,
  VIEWER: VIEWER_PERMISSIONS,
};

/**
 * Resolves the effective permission set for a workspace role.
 * For CUSTOM roles, intersects the configured permissions with the
 * base role's permission set so custom roles can never exceed their base.
 */
export function resolvePermissions(
  baseCode: WorkspaceRoleType,
  customPermissions?: string[] | null,
): Permission[] {
  if (baseCode === 'CUSTOM') {
    const basePermissions = PERMISSION_MATRIX.VIEWER;
    const requested = new Set(customPermissions ?? []);
    return basePermissions.filter((p) => requested.has(p));
  }

  if (!customPermissions) {
    return PERMISSION_MATRIX[baseCode];
  }

  const basePermissions = new Set(PERMISSION_MATRIX[baseCode]);
  return customPermissions.filter((p): p is Permission => basePermissions.has(p as Permission));
}
