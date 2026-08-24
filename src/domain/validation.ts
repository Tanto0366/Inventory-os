import { Asset, GatePass, Shipment } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Sanitizes arbitrary text inputs, removing dangerous control characters and trimming.
 */
export function sanitizeString(val?: any, defaultVal: string = ''): string {
  if (val === null || val === undefined) return defaultVal;
  return String(val).replace(/[\r\n\t]+/g, ' ').trim();
}

/**
 * Normalizes email address
 */
export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Validates email format
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}

/**
 * Validates new asset creation payload
 */
export function validateAssetInput(
  input: Partial<Asset>,
  existingAssets: Asset[] = [],
  excludeSerial?: string
): ValidationResult {
  const errors: string[] = [];

  const name = sanitizeString(input.name);
  const serial = sanitizeString(input.serial);
  const qty = parseInt(String(input.qty || 1), 10);

  if (!name) {
    errors.push('Item Name is required.');
  }

  if (!serial) {
    errors.push('Serial Number is required.');
  }

  if (isNaN(qty) || qty < 1) {
    errors.push('Quantity must be at least 1.');
  }

  // Serial uniqueness check
  if (serial && qty === 1) {
    const isDuplicate = existingAssets.some(
      a => a.serial.toLowerCase() === serial.toLowerCase() && (!excludeSerial || a.serial.toLowerCase() !== excludeSerial.toLowerCase())
    );
    if (isDuplicate) {
      errors.push(`Serial Number "${serial}" already exists in the asset registry.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Gate Pass creation input
 */
export function validateGatePassInput(
  input: Partial<GatePass>,
  availableAssets: Asset[] = []
): ValidationResult {
  const errors: string[] = [];

  const origin = sanitizeString(input.origin);
  const dest = sanitizeString(input.dest);
  const serials = input.serials || [];

  if (!origin) {
    errors.push('Origin location is required.');
  }

  if (!dest) {
    errors.push('Destination location is required.');
  }

  if (origin && dest && origin.toLowerCase() === dest.toLowerCase()) {
    errors.push('Origin and Destination locations cannot be identical.');
  }

  if (!serials || serials.length === 0) {
    errors.push('At least one asset serial must be selected.');
  } else {
    // Check if selected serials exist in the registry
    const existingSerialSet = new Set(availableAssets.map(a => a.serial.toLowerCase()));
    for (const sn of serials) {
      if (!existingSerialSet.has(sn.toLowerCase())) {
        errors.push(`Asset with serial "${sn}" not found in asset registry.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
