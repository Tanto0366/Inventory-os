import { AdminUser } from '../types';

export const PRIMARY_SUPER_ADMIN_EMAIL = 'aditya@aftermathventures.in';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'REVOKED' | 'UNAUTHORIZED';

export interface AuthStatus {
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  isAdminReadOnly: boolean;
  isProtectedSuperAdmin: boolean;
  isRevoked: boolean;
  role: 'Super Admin' | 'Admin' | 'Unauthorized';
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
 * Single source of truth for resolving user authorization roles.
 * Resolves: SUPER_ADMIN | ADMIN | REVOKED | UNAUTHORIZED
 */
export function getUserRole(
  email: string | undefined | null,
  adminsList: AdminUser[] = []
): UserRole {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return 'UNAUTHORIZED';
  }

  // 1. Check Primary Protected Super Admin
  if (normalized === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL)) {
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

  // 4. Resolve role
  const roleStr = (record.role || '').trim().toLowerCase();
  if (roleStr === 'super admin' || roleStr.includes('super')) {
    return 'SUPER_ADMIN';
  }

  if (
    roleStr === 'admin' ||
    roleStr === 'read-only admin' ||
    roleStr === 'read only' ||
    roleStr === 'readonly' ||
    roleStr === 'staff' ||
    roleStr === 'user' ||
    roleStr.includes('admin')
  ) {
    return 'ADMIN';
  }

  // Any verified, non-revoked record in the Admin ledger is granted Admin access
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

  const matched = adminsList.find(a => normalizeEmail(a.email) === normEmail);

  return {
    isAuthorized,
    isSuperAdmin: isSuper,
    isAdminReadOnly: isAdmin,
    isProtectedSuperAdmin: normEmail === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL),
    isRevoked,
    role: isSuper ? 'Super Admin' : (isAdmin ? 'Admin' : 'Unauthorized'),
    userRole,
    matchedAdminRecord: matched || (normEmail === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL) ? {
      email: PRIMARY_SUPER_ADMIN_EMAIL,
      role: 'Super Admin',
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
    const errorMsg = `Permission Denied: Super Admin authority is required to ${actionName}. Admin accounts have read-only access.`;
    console.error(`[InventoryOS Security] ${errorMsg} (User: ${userEmail || 'Unknown'})`);
    throw new Error(errorMsg);
  }
}

