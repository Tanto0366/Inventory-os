import { describe, it, expect } from 'vitest';
import { 
  sanitizeString, 
  normalizeEmail, 
  isValidEmail, 
  validateAssetInput, 
  validateGatePassInput 
} from '../domain/validation';
import { Asset } from '../types';

describe('Runtime Validation Service Tests', () => {
  it('sanitizes strings properly', () => {
    expect(sanitizeString('  hello \n world \t ')).toBe('hello   world');
    expect(sanitizeString(null, 'default')).toBe('default');
    expect(sanitizeString(undefined)).toBe('');
  });

  it('validates email formats accurately', () => {
    expect(isValidEmail('aditya@aftermathventures.in')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it('validates asset inputs and detects duplicate serials', () => {
    const existingAssets: Asset[] = [
      {
        sn: 1,
        assetId: 'AST-000001',
        serial: 'SN-100',
        name: 'Laptop',
        brand: 'Dell',
        desc: 'Latitude 7420',
        qty: 1,
        city: 'Bangalore',
        status: 'In House',
        owner: 'AFMV',
        possessor: 'Warehouse',
        campaign: 'Nil',
        receivedBy: 'Admin',
        receivedOn: '2026-01-01',
        shippingTo: 'Nil',
        shippingDate: 'Nil'
      }
    ];

    const validNew = validateAssetInput({
      name: 'Monitor',
      serial: 'SN-200',
      qty: 1
    }, existingAssets);
    expect(validNew.valid).toBe(true);
    expect(validNew.errors).toHaveLength(0);

    const duplicate = validateAssetInput({
      name: 'Laptop Duplicate',
      serial: 'sn-100',
      qty: 1
    }, existingAssets);
    expect(duplicate.valid).toBe(false);
    expect(duplicate.errors[0]).toContain('already exists');

    const missingName = validateAssetInput({
      serial: 'SN-300',
      qty: 1
    }, existingAssets);
    expect(missingName.valid).toBe(false);
    expect(missingName.errors).toContain('Item Name is required.');
  });

  it('validates gate pass inputs', () => {
    const availableAssets: Asset[] = [
      {
        sn: 1,
        assetId: 'AST-000001',
        serial: 'SN-100',
        name: 'Laptop',
        brand: 'Dell',
        desc: 'Latitude 7420',
        qty: 1,
        city: 'Bangalore',
        status: 'In House',
        owner: 'AFMV',
        possessor: 'Warehouse',
        campaign: 'Nil',
        receivedBy: 'Admin',
        receivedOn: '2026-01-01',
        shippingTo: 'Nil',
        shippingDate: 'Nil'
      }
    ];

    const valid = validateGatePassInput({
      origin: 'Bangalore',
      dest: 'Mumbai',
      serials: ['SN-100']
    }, availableAssets);
    expect(valid.valid).toBe(true);

    const sameOriginDest = validateGatePassInput({
      origin: 'Bangalore',
      dest: 'bangalore',
      serials: ['SN-100']
    }, availableAssets);
    expect(sameOriginDest.valid).toBe(false);
    expect(sameOriginDest.errors[0]).toContain('cannot be identical');

    const nonExistentSerial = validateGatePassInput({
      origin: 'Bangalore',
      dest: 'Mumbai',
      serials: ['SN-999']
    }, availableAssets);
    expect(nonExistentSerial.valid).toBe(false);
    expect(nonExistentSerial.errors[0]).toContain('not found in asset registry');
  });
});
