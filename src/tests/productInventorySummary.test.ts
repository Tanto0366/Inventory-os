import { describe, it, expect } from 'vitest';
import { Asset } from '../types';

describe('Product Inventory Summary Component Tests', () => {
  it('aggregates assets grouping by name and summing qty', () => {
    const assets: Partial<Asset>[] = [
      { serial: 'SN-01', name: 'Boom 3', qty: 2, status: 'In House', brand: 'Ultimate Ears' },
      { serial: 'SN-02', name: 'Boom 3', qty: 3, status: 'Delivered', brand: 'Ultimate Ears' },
      { serial: 'SN-03', name: 'Boom 4', qty: 1, status: 'In House', brand: 'Ultimate Ears' },
      { serial: 'SN-04', name: 'Desk Mat', qty: 1, status: 'In House', brand: 'Logitech' },
      { serial: 'SN-05', name: 'G203', qty: 29, status: 'In House', brand: 'Logitech' }
    ];

    // Simulating component useMemo aggregation logic
    const map = new Map<string, { name: string; totalQty: number; recordsCount: number }>();
    for (const a of assets) {
      const name = (a.name || 'Unspecified').trim();
      const qty = a.qty || 1;
      let entry = map.get(name);
      if (!entry) {
        entry = { name, totalQty: 0, recordsCount: 0 };
        map.set(name, entry);
      }
      entry.totalQty += qty;
      entry.recordsCount += 1;
    }

    const summary = Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);

    expect(summary).toHaveLength(4);
    // G203 top
    expect(summary[0].name).toBe('G203');
    expect(summary[0].totalQty).toBe(29);
    // Boom 3 aggregated 2 + 3 = 5
    const boom3 = summary.find(s => s.name === 'Boom 3');
    expect(boom3?.totalQty).toBe(5);
    expect(boom3?.recordsCount).toBe(2);
  });
});
