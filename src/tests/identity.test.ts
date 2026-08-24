import { describe, it, expect } from 'vitest';
import { 
  generateAssetId, 
  generateGatePassId, 
  generateShipmentId, 
  generateAuditEventId, 
  generateTrackingNumber,
  generateUUID,
  getMaxIdIndex 
} from '../domain/identity';

describe('Identity & Collision Resistance Tests', () => {
  it('correctly calculates maximum numerical index from formatted strings', () => {
    const assetIds = ['AST-000001', 'AST-000042', 'AST-000010'];
    expect(getMaxIdIndex(assetIds, /AST-(\d+)/i)).toBe(42);

    const gatePassIds = ['GP-001', 'GP-005', 'GP-002'];
    expect(getMaxIdIndex(gatePassIds, /GP-(\d+)/i)).toBe(5);

    expect(getMaxIdIndex([], /AST-(\d+)/i)).toBe(0);
  });

  it('generates non-colliding monotonic Asset IDs', () => {
    const existing = ['AST-000001', 'AST-000002', 'AST-000005'];
    const nextId = generateAssetId(existing);
    expect(nextId).toBe('AST-000006');
    expect(existing).not.toContain(nextId);
  });

  it('handles empty existing asset lists gracefully', () => {
    const id = generateAssetId([]);
    expect(id).toBe('AST-000001');
  });

  it('generates non-colliding Gate Pass IDs', () => {
    const existing = ['GP-001', 'GP-002'];
    const nextId = generateGatePassId(existing);
    expect(nextId).toBe('GP-003');
  });

  it('generates non-colliding Shipment IDs', () => {
    const existing = ['SHIP-001', 'SHIP-008'];
    const nextId = generateShipmentId(existing);
    expect(nextId).toBe('SHIP-009');
  });

  it('generates well-formed tracking numbers', () => {
    const trk = generateTrackingNumber('AFMV');
    expect(trk).toMatch(/^TRK-AFMV-\d{4}-\d{4}$/);
  });

  it('generates valid UUID v4 strings', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates immutable audit event IDs', () => {
    const eventId = generateAuditEventId();
    expect(eventId).toMatch(/^EVT-\d+-\d{4}$/);
  });
});
