import { describe, it, expect } from 'vitest';
import { 
  normalizeEmail, 
  isPrimarySuperAdmin, 
  getUserRole, 
  evaluateUserAuth, 
  assertSuperAdmin,
  PRIMARY_SUPER_ADMIN_EMAIL 
} from '../lib/auth';
import { AdminUser } from '../types';

describe('Auth & RBAC Service Hardening Tests', () => {
  const sampleAdmins: AdminUser[] = [
    {
      email: 'aditya@aftermathventures.in',
      role: 'SUPER_ADMIN',
      status: 'Active',
      grantedBy: 'System',
      grantedOn: '2026-01-01',
      lastLogin: '2026-08-24',
      lastUpdated: '2026-08-24'
    },
    {
      email: 'ops.super@afmv.in',
      role: 'SUPER_ADMIN',
      status: 'Active',
      grantedBy: 'aditya@aftermathventures.in',
      grantedOn: '2026-01-01',
      lastLogin: '2026-08-24',
      lastUpdated: '2026-08-24'
    },
    {
      email: 'logistics.viewer@afmv.in',
      role: 'ADMIN',
      status: 'Active',
      grantedBy: 'aditya@aftermathventures.in',
      grantedOn: '2026-01-01',
      lastLogin: '2026-08-24',
      lastUpdated: '2026-08-24'
    },
    {
      email: 'former.employee@afmv.in',
      role: 'ADMIN',
      status: 'Revoked',
      grantedBy: 'aditya@aftermathventures.in',
      grantedOn: '2026-01-01',
      lastLogin: '2026-08-20',
      lastUpdated: '2026-08-24'
    }
  ];

  it('correctly normalizes emails with leading/trailing whitespace and mixed case', () => {
    expect(normalizeEmail('  Aditya@AftermathVentures.IN  ')).toBe('aditya@aftermathventures.in');
    expect(normalizeEmail('')).toBe('');
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });

  it('identifies primary protected super admin regardless of case and spacing', () => {
    expect(isPrimarySuperAdmin('  aditya@aftermathventures.in ')).toBe(true);
    expect(isPrimarySuperAdmin('ADITYA@AFTERMATHVENTURES.IN')).toBe(true);
    expect(isPrimarySuperAdmin('other@afmv.in')).toBe(false);
  });

  it('resolves SUPER_ADMIN role for Primary Super Admin even if not in admin list', () => {
    const role = getUserRole('Aditya@AftermathVentures.IN', []);
    expect(role).toBe('SUPER_ADMIN');

    const auth = evaluateUserAuth('Aditya@AftermathVentures.IN', []);
    expect(auth.isAuthorized).toBe(true);
    expect(auth.isSuperAdmin).toBe(true);
    expect(auth.isAdminReadOnly).toBe(false);
    expect(auth.isProtectedSuperAdmin).toBe(true);
  });

  it('resolves SUPER_ADMIN role for delegated super admins', () => {
    const role = getUserRole('Ops.Super@AFMV.in', sampleAdmins);
    expect(role).toBe('SUPER_ADMIN');

    const auth = evaluateUserAuth('Ops.Super@AFMV.in', sampleAdmins);
    expect(auth.isAuthorized).toBe(true);
    expect(auth.isSuperAdmin).toBe(true);
    expect(auth.isAdminReadOnly).toBe(false);
    expect(auth.isProtectedSuperAdmin).toBe(false);
  });

  it('resolves ADMIN (read-only) role correctly', () => {
    const role = getUserRole('logistics.viewer@afmv.in', sampleAdmins);
    expect(role).toBe('ADMIN');

    const auth = evaluateUserAuth('logistics.viewer@afmv.in', sampleAdmins);
    expect(auth.isAuthorized).toBe(true);
    expect(auth.isSuperAdmin).toBe(false);
    expect(auth.isAdminReadOnly).toBe(true);
  });

  it('resolves REVOKED status and denies access', () => {
    const role = getUserRole('former.employee@afmv.in', sampleAdmins);
    expect(role).toBe('REVOKED');

    const auth = evaluateUserAuth('former.employee@afmv.in', sampleAdmins);
    expect(auth.isAuthorized).toBe(false);
    expect(auth.isRevoked).toBe(true);
  });

  it('resolves UNAUTHORIZED for unregistered emails', () => {
    const role = getUserRole('stranger@external.com', sampleAdmins);
    expect(role).toBe('UNAUTHORIZED');

    const auth = evaluateUserAuth('stranger@external.com', sampleAdmins);
    expect(auth.isAuthorized).toBe(false);
    expect(auth.role).toBe('Unauthorized');
  });

  it('assertSuperAdmin succeeds for Super Admins and throws for Read-Only or Unauthorized users', () => {
    expect(() => {
      assertSuperAdmin('aditya@aftermathventures.in', sampleAdmins, 'test mutation');
    }).not.toThrow();

    expect(() => {
      assertSuperAdmin('ops.super@afmv.in', sampleAdmins, 'test mutation');
    }).not.toThrow();

    expect(() => {
      assertSuperAdmin('logistics.viewer@afmv.in', sampleAdmins, 'test mutation');
    }).toThrow(/Permission Denied.*Super Admin authorization is required/);

    expect(() => {
      assertSuperAdmin('stranger@external.com', sampleAdmins, 'test mutation');
    }).toThrow(/Permission Denied/);
  });
});
