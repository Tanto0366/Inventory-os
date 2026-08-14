import { AdminUser } from '../types';

export const PRIMARY_SUPER_ADMIN_EMAIL = 'aditya@aftermathventures.in';

export type UserRole = 'Super Admin' | 'Admin' | 'Unauthorized';

export interface AuthStatus {
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  isAdminReadOnly: boolean;
  isProtectedSuperAdmin: boolean;
  isRevoked: boolean;
  role: UserRole;
  matchedAdminRecord?: AdminUser;
}

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Centrally evaluates user authorization and role based on the master Admin records.
 */
export function evaluateUserAuth(userEmail: string | undefined | null, adminsList: AdminUser[]): AuthStatus {
  const normEmail = normalizeEmail(userEmail);
  if (!normEmail) {
    return {
      isAuthorized: false,
      isSuperAdmin: false,
      isAdminReadOnly: false,
      isProtectedSuperAdmin: false,
      isRevoked: false,
      role: 'Unauthorized'
    };
  }

  // Primary Super Admin is permanently protected and authorized
  if (normEmail === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL)) {
    return {
      isAuthorized: true,
      isSuperAdmin: true,
      isAdminReadOnly: false,
      isProtectedSuperAdmin: true,
      isRevoked: false,
      role: 'Super Admin',
      matchedAdminRecord: {
        email: PRIMARY_SUPER_ADMIN_EMAIL,
        role: 'Super Admin',
        status: 'Protected',
        grantedBy: 'System',
        grantedOn: '2026-08-14',
        lastLogin: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };
  }

  // Lookup in authorized admins database
  const matched = adminsList.find(a => normalizeEmail(a.email) === normEmail);
  if (!matched) {
    return {
      isAuthorized: false,
      isSuperAdmin: false,
      isAdminReadOnly: false,
      isProtectedSuperAdmin: false,
      isRevoked: false,
      role: 'Unauthorized'
    };
  }

  // Check if access was explicitly revoked
  if (matched.status === 'Revoked') {
    return {
      isAuthorized: false,
      isSuperAdmin: false,
      isAdminReadOnly: false,
      isProtectedSuperAdmin: false,
      isRevoked: true,
      role: 'Unauthorized',
      matchedAdminRecord: matched
    };
  }

  const isSuper = matched.role === 'Super Admin';
  return {
    isAuthorized: true,
    isSuperAdmin: isSuper,
    isAdminReadOnly: !isSuper,
    isProtectedSuperAdmin: false,
    isRevoked: false,
    role: isSuper ? 'Super Admin' : 'Admin',
    matchedAdminRecord: matched
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
