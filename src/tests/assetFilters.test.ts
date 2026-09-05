import { describe, it, expect } from 'vitest';
import { getUniqueItemNames, filterAssets } from '../lib/assetFilters';
import { Asset } from '../types';

const mockAssets: Asset[] = [
  {
    sn: 1,
    assetId: 'AST-000001',
    serial: 'SN-001',
    name: 'Laptop',
    brand: 'Lenovo',
    desc: 'Legion 5',
    qty: 1,
    city: 'Delhi',
    status: 'In House',
    owner: 'Lenovo',
    possessor: 'Harshil',
    campaign: 'Lenovo X EWC',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 2,
    assetId: 'AST-000002',
    serial: 'SN-002',
    name: 'Mouse',
    brand: 'Logitech',
    desc: 'G Pro Wireless',
    qty: 1,
    city: 'Bangalore',
    status: 'In Transit',
    owner: 'AFMV',
    possessor: 'Warehouse',
    campaign: 'Nil',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 3,
    assetId: 'AST-000003',
    serial: 'SN-003',
    name: 'Headset',
    brand: 'HyperX',
    desc: 'Cloud II',
    qty: 1,
    city: 'Delhi',
    status: 'In House',
    owner: 'AFMV',
    possessor: 'Aditya',
    campaign: 'Gaming Expo',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 4,
    assetId: 'AST-000004',
    serial: 'SN-004',
    name: 'Laptop', // Duplicate item name
    brand: 'Apple',
    desc: 'MacBook Pro 16',
    qty: 1,
    city: 'Mumbai',
    status: 'Delivered',
    owner: 'AFMV',
    possessor: 'Karan',
    campaign: 'Nil',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 5,
    assetId: 'AST-000005',
    serial: 'SN-005',
    name: 'Controller',
    brand: 'Sony',
    desc: 'DualSense',
    qty: 1,
    city: 'Delhi',
    status: 'In House',
    owner: 'Sony',
    possessor: 'Warehouse',
    campaign: 'PlayStation Event',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 6,
    assetId: 'AST-000006',
    serial: 'SN-006',
    name: 'Keyboard',
    brand: 'Logitech',
    desc: 'G915',
    qty: 1,
    city: 'Bangalore',
    status: 'In House',
    owner: 'AFMV',
    possessor: 'Warehouse',
    campaign: 'Nil',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 7,
    assetId: 'AST-000007',
    serial: 'SN-007',
    name: 'Laptop Stand',
    brand: 'Tukzer',
    desc: 'Aluminum Stand',
    qty: 1,
    city: 'Bangalore',
    status: 'In House',
    owner: 'AFMV',
    possessor: 'Warehouse',
    campaign: 'Nil',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 8,
    assetId: 'AST-000008',
    serial: 'SN-008',
    name: 'Tablet',
    brand: 'Apple',
    desc: 'iPad Pro',
    qty: 1,
    city: 'Mumbai',
    status: 'In Transit',
    owner: 'AFMV',
    possessor: 'Blue Dart',
    campaign: 'Nil',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  },
  {
    sn: 9,
    assetId: 'AST-000009',
    serial: 'SN-009',
    name: 'Mouse Pad',
    brand: 'SteelSeries',
    desc: 'QcK Heavy',
    qty: 1,
    city: 'Delhi',
    status: 'In House',
    owner: 'AFMV',
    possessor: 'Harshil',
    campaign: 'Lenovo X EWC',
    receivedBy: 'System',
    receivedOn: '2026-01-01',
    shippingTo: 'Nil',
    shippingDate: 'Nil'
  }
];

describe('Assets Ledger Item Name Filter', () => {
  it('automatically extracts unique item names, deduplicates them, and sorts alphabetically', () => {
    const itemNames = getUniqueItemNames(mockAssets);

    // Should not have duplicates ('Laptop' appears twice in mockAssets, once here)
    expect(itemNames).toEqual([
      'Controller',
      'Headset',
      'Keyboard',
      'Laptop',
      'Laptop Stand',
      'Mouse',
      'Mouse Pad',
      'Tablet'
    ]);
  });

  it('filters dataset accurately by selected Item Name', () => {
    const laptops = filterAssets(mockAssets, { itemName: 'Laptop' });
    expect(laptops).toHaveLength(2);
    expect(laptops.every(a => a.name === 'Laptop')).toBe(true);

    const controllers = filterAssets(mockAssets, { itemName: 'Controller' });
    expect(controllers).toHaveLength(1);
    expect(controllers[0].serial).toBe('SN-005');
  });

  it('returns all assets when itemName filter is empty string ("All Item Names")', () => {
    const all = filterAssets(mockAssets, { itemName: '' });
    expect(all).toHaveLength(mockAssets.length);
  });

  it('combines Item Name filter with existing Status and Brand filters seamlessly', () => {
    // Only Laptops that are 'In House'
    const inHouseLaptops = filterAssets(mockAssets, { itemName: 'Laptop', status: 'In House' });
    expect(inHouseLaptops).toHaveLength(1);
    expect(inHouseLaptops[0].brand).toBe('Lenovo');

    // Only Laptops by 'Apple'
    const appleLaptops = filterAssets(mockAssets, { itemName: 'Laptop', brand: 'Apple' });
    expect(appleLaptops).toHaveLength(1);
    expect(appleLaptops[0].desc).toBe('MacBook Pro 16');

    // Mismatched combinations return empty list
    const sonyLaptops = filterAssets(mockAssets, { itemName: 'Laptop', brand: 'Sony' });
    expect(sonyLaptops).toHaveLength(0);
  });

  it('combines Item Name filter with City, Campaign, and Owner filters', () => {
    const lenovoCampItems = filterAssets(mockAssets, { 
      itemName: 'Mouse Pad', 
      campaign: 'Lenovo X EWC',
      city: 'Delhi'
    });
    expect(lenovoCampItems).toHaveLength(1);
    expect(lenovoCampItems[0].name).toBe('Mouse Pad');
  });
});
