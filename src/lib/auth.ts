import { AdminUser, AppRole } from '../types';

export const PRIMARY_SUPER_ADMIN_EMAIL = 'aditya@aftermathventures.in';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'REVOKED' | 'UNAUTHORIZED';

export interface AuthStatus {
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  isAdminReadOnly: boolean;
  isProtectedSuperAdmin: boolean;
  isRevoked: boolean;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'Unauthorized';
  roleDisplay: 'SUPER ADMIN' | 'ADMIN • READ ONLY' | 'Unauthorized';
  userRole: UserRole;
  matchedAdminRecord?: AdminUser;
}

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Checks if the email is the permanent protected Primary Super Admin.
 */
export function isPrimarySuperAdmin(email?: string | null): boolean {
  return normalizeEmail(email) === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL);
}

/**
 * Normalizes raw role string into canonical AppRole ('SUPER_ADMIN' | 'ADMIN').
 */
export function normalizeAppRole(rawRole?: string | null): AppRole {
  const r = (rawRole || '').trim().toUpperCase().replace(/[\s\-_]+/g, '_');
  if (r.includes('SUPER')) {
    return 'SUPER_ADMIN';
  }
  return 'ADMIN';
}

/**
 * Single source of truth for resolving user authorization roles.
 * Resolves: SUPER_ADMIN | ADMIN | REVOKED | UNAUTHORIZED
 * 
 * Expected behavior:
 * - Primary Super Admin -> SUPER_ADMIN
 * - Active Admin record (role SUPER_ADMIN) -> SUPER_ADMIN
 * - Active Admin record (role ADMIN) -> ADMIN
 * - Revoked Admin record -> REVOKED
 * - No matching record -> UNAUTHORIZED
 */
export function getUserRole(
  email: string | undefined | null,
  adminsList: AdminUser[] = []
): UserRole {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return 'UNAUTHORIZED';
  }

  // 1. Check Primary Protected Super Admin (Permanent Root)
  if (isPrimarySuperAdmin(normalized)) {
    return 'SUPER_ADMIN';
  }

  // 2. Check Admin Table with normalized email matching
  const record = adminsList.find(
    admin => normalizeEmail(admin.email) === normalized
  );

  if (!record) {
    return 'UNAUTHORIZED';
  }

  // 3. Check explicit revoked status
  const statusStr = (record.status || '').trim().toLowerCase();
  if (statusStr === 'revoked') {
    return 'REVOKED';
  }

  // 4. Resolve normalized role
  const rawRole = (record.role || '').trim().toLowerCase();
  if (rawRole.includes('super')) {
    return 'SUPER_ADMIN';
  }

  return 'ADMIN';
}

/**
 * Centrally evaluates user authorization and role based on the master Admin records.
 */
export function evaluateUserAuth(
  userEmail: string | undefined | null,
  adminsList: AdminUser[] = []
): AuthStatus {
  const normEmail = normalizeEmail(userEmail);
  const userRole = getUserRole(userEmail, adminsList);

  const isSuper = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isRevoked = userRole === 'REVOKED';
  const isAuthorized = isSuper || isAdmin;
  const isProtected = isPrimarySuperAdmin(normEmail);

  const matched = adminsList.find(a => normalizeEmail(a.email) === normEmail);

  return {
    isAuthorized,
    isSuperAdmin: isSuper,
    isAdminReadOnly: isAdmin,
    isProtectedSuperAdmin: isProtected,
    isRevoked,
    role: isSuper ? 'SUPER_ADMIN' : (isAdmin ? 'ADMIN' : 'Unauthorized'),
    roleDisplay: isSuper ? 'SUPER ADMIN' : (isAdmin ? 'ADMIN • READ ONLY' : 'Unauthorized'),
    userRole,
    matchedAdminRecord: matched || (isProtected ? {
      email: PRIMARY_SUPER_ADMIN_EMAIL,
      role: 'SUPER_ADMIN',
      status: 'Protected',
      grantedBy: 'System',
      grantedOn: '2026-08-14',
      lastLogin: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    } : undefined)
  };
}

/**
 * Backend-style authorization assertion for state mutations and API calls.
 */
export function assertSuperAdmin(
  userEmail: string | undefined | null,
  adminsList: AdminUser[],
  actionName: string = 'perform this operation'
): void {
  const auth = evaluateUserAuth(userEmail, adminsList);
  if (!auth.isSuperAdmin) {
    const errorMsg = `Permission Denied: Insufficient permissions. Admin accounts are read-only. Super Admin authorization is required to ${actionName}.`;
    console.error(`[InventoryOS Security 403] ${errorMsg} (User: ${userEmail || 'Unknown'})`);
    throw new Error(errorMsg);
  }
}

export const requireSuperAdmin = assertSuperAdmin;

