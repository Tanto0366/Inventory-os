/**
 * InventoryOS Central Configuration Service
 * Single source of truth for runtime, environment, and organizational constants.
 */

// Primary Super Admin: Permanent root authority. Can be overridden via VITE_PRIMARY_SUPER_ADMIN_EMAIL
export const DEFAULT_PRIMARY_SUPER_ADMIN_EMAIL = 'aditya@aftermathventures.in';

// Master Canonical Database Spreadsheet ID
export const DEFAULT_MASTER_SPREADSHEET_ID = '1PTrgDLYa0aoNPjsNf0YgFEYw0ofd_pe7hr_K5hPKe7I';

export const DATABASE_NAME = 'InventoryOS_Database';

/**
 * Returns normalized Primary Super Admin email
 */
export function getPrimarySuperAdminEmail(): string {
  const envEmail = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PRIMARY_SUPER_ADMIN_EMAIL) || '';
  const email = envEmail.trim() || DEFAULT_PRIMARY_SUPER_ADMIN_EMAIL;
  return email.trim().toLowerCase();
}

/**
 * Returns canonical Master Google Spreadsheet ID from config/env
 */
export function getCanonicalSpreadsheetId(): string {
  const envId = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_INVENTORYOS_SPREADSHEET_ID) || '';
  const cleanEnv = typeof envId === 'string' ? envId.trim() : '';
  // Ensure valid spreadsheet ID (e.g. not a placeholder or sheet name)
  if (cleanEnv && cleanEnv !== 'Admin' && cleanEnv.length >= 20) {
    return cleanEnv;
  }
  return DEFAULT_MASTER_SPREADSHEET_ID;
}

export const APP_CONFIG = {
  appName: 'InventoryOS',
  version: '1.0.0',
  databaseName: DATABASE_NAME,
  defaultCurrency: 'INR',
  timeZone: 'Asia/Kolkata',
  maxSyncRetries: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 10000,
};
