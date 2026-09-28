import { describe, it, expect } from 'vitest';
import { 
  getCanonicalProductName, 
  computeProductSummary, 
  getProductInventoryOverview 
} from '../lib/productSummary';
import { Asset } from '../types';

describe('Product Inventory Aggregation Tests', () => {
  it('correctly identifies canonical product name from desc or falls back to name', () => {
    expect(getCanonicalProductName({ desc: 'Lenovo Legion 5', name: 'Laptop' })).toBe('Lenovo Legion 5');
    expect(getCanonicalProductName({ desc: '', name: 'Desk Mat' })).toBe('Desk Mat');
    expect(getCanonicalProductName({ desc: '—', name: 'G PRO Headset' })).toBe('G PRO Headset');
    expect(getCanonicalProductName({ desc: 'Nil', name: 'Boom 3' })).toBe('Boom 3');
    expect(getCanonicalProductName({ desc: '   ', name: 'Mouse Pad' })).toBe('Mouse Pad');
    expect(getCanonicalProductName({ desc: '', name: '', brand: 'HyperX' })).toBe('HyperX (General)');
  });

  it('aggregates multiple rows for the same product as specified in prompt example', () => {
    // Exact sample products from the user prompt:
    // Boom 3 (Qty 2), Boom 4 (Qty 1), Desk Mat (Qty 1), G PRO Headset (Qty 1),
    // G PRO Keyboard (Qty 3), G PRO X Superlight 2 (Qty 3), G203 (Qty 29), etc.
    const sampleAssets: Partial<Asset>[] = [
      { serial: 'SN-001', name: 'Speaker', desc: 'Boom 3', qty: 2, status: 'In House', city: 'Bangalore' },
      { serial: 'SN-002', name: 'Speaker', desc: 'Boom 3', qty: 3, status: 'Delivered', city: 'Mumbai' }, // Another row for Boom 3!
      { serial: 'SN-003', name: 'Speaker', desc: 'Boom 4', qty: 1, status: 'In House', city: 'Bangalore' },
      { serial: 'SN-004', name: 'Desk Mat', desc: '', qty: 1, status: 'In House', city: 'Delhi' },
      { serial: 'SN-005', name: 'Headset', desc: 'G PRO Headset', qty: 1, status: 'In Transit', city: 'Delhi' },
      { serial: 'SN-006', name: 'Keyboard', desc: 'G PRO Keyboard', qty: 3, status: 'In House', city: 'Bangalore' },
      { serial: 'SN-007', name: 'Mouse', desc: 'G PRO X Superlight 2', qty: 3, status: 'Ready for Pickup', city: 'Bangalore' },
      { serial: 'SN-008', name: 'Mouse', desc: 'G203', qty: 29, status: 'In House', city: 'Bangalore' },
    ];

    const summary = computeProductSummary(sampleAssets as Asset[]);

    // 7 unique products
    expect(summary).toHaveLength(7);

    // G203 should be first because it has the highest quantity (29)
    expect(summary[0].productName).toBe('G203');
    expect(summary[0].totalQty).toBe(29);
    expect(summary[0].inHouseQty).toBe(29);

    // Boom 3 should have 2 + 3 = 5 total units aggregated across 2 rows
    const boom3 = summary.find(p => p.productName === 'Boom 3');
    expect(boom3).toBeDefined();
    expect(boom3?.totalQty).toBe(5);
    expect(boom3?.inHouseQty).toBe(2);
    expect(boom3?.deliveredQty).toBe(3);
    expect(boom3?.serialsCount).toBe(2);
    expect(boom3?.locations).toContain('Bangalore');
    expect(boom3?.locations).toContain('Mumbai');

    // Desk Mat fallback
    const deskMat = summary.find(p => p.productName === 'Desk Mat');
    expect(deskMat).toBeDefined();
    expect(deskMat?.totalQty).toBe(1);
    expect(deskMat?.category).toBe('Desk Mat');
  });

  it('aggregates individual serialized units with qty = 1 each for the same product', () => {
    const serializedUnits: Partial<Asset>[] = [
      { serial: 'SN-A1', name: 'Laptop', desc: 'Yoga 9i', qty: 1, status: 'In House', city: 'Mumbai' },
      { serial: 'SN-A2', name: 'Laptop', desc: 'Yoga 9i', qty: 1, status: 'Delivered', city: 'Delhi' },
      { serial: 'SN-A3', name: 'Laptop', desc: 'Yoga 9i', qty: 1, status: 'Delivered', city: 'Delhi' },
      { serial: 'SN-B1', name: 'Mouse', desc: 'G502 Hero', qty: 1, status: 'In House', city: 'Bangalore' },
      { serial: 'SN-B2', name: 'Mouse', desc: 'G502 Hero', qty: 1, status: 'In Transit', city: 'Bangalore' },
    ];

    const summary = computeProductSummary(serializedUnits as Asset[]);
    expect(summary).toHaveLength(2);

    const yoga = summary.find(p => p.productName === 'Yoga 9i');
    expect(yoga?.totalQty).toBe(3);
    expect(yoga?.inHouseQty).toBe(1);
    expect(yoga?.deliveredQty).toBe(2);
    expect(yoga?.serialsCount).toBe(3);

    const g502 = summary.find(p => p.productName === 'G502 Hero');
    expect(g502?.totalQty).toBe(2);
    expect(g502?.inHouseQty).toBe(1);
    expect(g502?.inTransitQty).toBe(1);
    expect(g502?.serialsCount).toBe(2);
  });

  it('computes complete inventory overview with accurate cumulative totals', () => {
    const assets: Partial<Asset>[] = [
      { serial: 'S1', name: 'Laptop', desc: 'Model X', qty: 5, status: 'In House' },
      { serial: 'S2', name: 'Laptop', desc: 'Model X', qty: 3, status: 'Delivered' },
      { serial: 'S3', name: 'Mouse', desc: 'Model M', qty: 2, status: 'In Transit' },
      { serial: 'S4', name: 'Keyboard', desc: 'Model K', qty: 4, status: 'Ready for Pickup' },
    ];

    const overview = getProductInventoryOverview(assets as Asset[]);
    expect(overview.totalUniqueProducts).toBe(3);
    expect(overview.totalQuantity).toBe(14); // 5+3 + 2 + 4 = 14
    expect(overview.totalInHouse).toBe(5);
    expect(overview.totalDelivered).toBe(3);
    expect(overview.totalInTransit).toBe(2);
    expect(overview.totalReadyPickup).toBe(4);
  });

  it('handles empty or null assets gracefully', () => {
    expect(computeProductSummary([])).toEqual([]);
    expect(getProductInventoryOverview([])).toEqual({
      productSummary: [],
      totalUniqueProducts: 0,
      totalQuantity: 0,
      totalInHouse: 0,
      totalDelivered: 0,
      totalInTransit: 0,
      totalReadyPickup: 0
    });
  });
});
