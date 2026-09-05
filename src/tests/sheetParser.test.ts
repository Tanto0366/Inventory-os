import { describe, it, expect } from 'vitest';
import { 
  parseRowsToAssets, 
  parseRowsToGatePasses, 
  parseRowsToShipments, 
  createColumnResolver,
  normalizeHeaderKey 
} from '../lib/googleSheets';

describe('Google Sheets Parser Robustness & Column Mapping Tests', () => {
  it('correctly normalizes header keys', () => {
    expect(normalizeHeaderKey('Item Name')).toBe('itemname');
    expect(normalizeHeaderKey('Serial Number')).toBe('serialnumber');
    expect(normalizeHeaderKey('Box ID')).toBe('boxid');
    expect(normalizeHeaderKey('Current Possessor')).toBe('currentpossessor');
    expect(normalizeHeaderKey('  Shipping-Date_  ')).toBe('shippingdate');
  });

  it('correctly parses canonical 18-column assets database with Box ID (Fixing deterministic column offset)', () => {
    const rows = [
      [
        'Asset ID', 'Serial Number', 'Box ID', 'Item Name', 'Brand', 'Product Name', 
        'Quantity', 'Location', 'Owner', 'Current Possessor', 'Campaign', 
        'Status', 'Received By', 'Received On', 'Shipping To', 'Shipping Date', 
        'Created Date', 'Last Updated'
      ],
      [
        'AST-000001', 'PF5Q8HC7', '—', 'Laptop', 'Lenovo', 'Lenovo Legion 5', 
        '1', 'Absolute IT Solutions Bangalore', 'Lenovo', 'Harshil', 'Lenovo X EWC', 
        'Delivered', 'Aditya Tiwari', '2026-08-24', 'Nil', 'Nil', 
        '2026-08-24', '2026-08-24'
      ]
    ];

    const assets = parseRowsToAssets(rows);
    expect(assets).toHaveLength(1);
    const asset = assets[0];

    expect(asset.assetId).toBe('AST-000001');
    expect(asset.serial).toBe('PF5Q8HC7');
    expect(asset.boxId).toBe('—');
    expect(asset.name).toBe('Laptop');
    expect(asset.brand).toBe('Lenovo');
    expect(asset.desc).toBe('Lenovo Legion 5');
    expect(asset.qty).toBe(1);
    expect(asset.city).toBe('Absolute IT Solutions Bangalore');
    expect(asset.owner).toBe('Lenovo');
    expect(asset.possessor).toBe('Harshil');
    expect(asset.campaign).toBe('Lenovo X EWC');
    expect(asset.status).toBe('Delivered');
    expect(asset.receivedBy).toBe('Aditya Tiwari');
    expect(asset.receivedOn).toBe('2026-08-24');
    expect(asset.shippingTo).toBe('Nil');
    expect(asset.shippingDate).toBe('Nil');
    expect(asset.createdDate).toBe('2026-08-24');
    expect(asset.lastUpdated).toBe('2026-08-24');
  });

  it('works correctly even if columns are permuted / reordered by the user in Google Sheets', () => {
    // Permuted columns: Item Name first, then Serial Number, Location, Status, etc.
    const permutedRows = [
      [
        'Item Name', 'Description', 'Serial Number', 'Brand', 'Status', 
        'Location', 'Quantity', 'Owner', 'Current Possessor', 'Box ID', 'Asset ID'
      ],
      [
        'MacBook Pro 16', 'M3 Max 36GB', 'C02G12345678', 'Apple', 'In House', 
        'Bangalore Central Hub', '1', 'AFMV Inc', 'Aditya', 'BOX-42', 'AST-000099'
      ]
    ];

    const assets = parseRowsToAssets(permutedRows);
    expect(assets).toHaveLength(1);
    const asset = assets[0];

    expect(asset.assetId).toBe('AST-000099');
    expect(asset.serial).toBe('C02G12345678');
    expect(asset.boxId).toBe('BOX-42');
    expect(asset.name).toBe('MacBook Pro 16');
    expect(asset.desc).toBe('M3 Max 36GB');
    expect(asset.brand).toBe('Apple');
    expect(asset.status).toBe('In House');
    expect(asset.city).toBe('Bangalore Central Hub');
    expect(asset.owner).toBe('AFMV Inc');
    expect(asset.possessor).toBe('Aditya');
    expect(asset.qty).toBe(1);
  });

  it('handles legacy 17-column sheets without Box ID header gracefully', () => {
    const legacyRows = [
      [
        'Asset ID', 'Serial Number', 'Item Name', 'Brand', 'Description', 
        'Quantity', 'Location', 'Owner', 'Current Possessor', 'Campaign', 
        'Status', 'Received By', 'Received On', 'Shipping To', 'Shipping Date', 
        'Created Date', 'Last Updated'
      ],
      [
        'AST-000002', 'SN-LEGACY-01', 'Smart Monitor', 'Samsung', '32-inch 4K', 
        '2', 'Mumbai HQ', 'Samsung India', 'Operations', 'Display Demo', 
        'In Transit', 'Ravi', '2026-08-20', 'Delhi', '2026-08-24', 
        '2026-08-20', '2026-08-24'
      ]
    ];

    const assets = parseRowsToAssets(legacyRows);
    expect(assets).toHaveLength(2); // Quantity was 2, so expanded
    expect(assets[0].name).toBe('Smart Monitor');
    expect(assets[0].brand).toBe('Samsung');
    expect(assets[0].desc).toBe('32-inch 4K');
    expect(assets[0].city).toBe('Mumbai HQ');
    expect(assets[0].boxId).toBe('—');
  });

  it('parses gate passes with header aliasing', () => {
    const gpRows = [
      [
        'Gate Pass ID', 'Type', 'Organization', 'Serials', 'Origin', 'Destination', 'Shipping Date', 'ETA', 'Receiver'
      ],
      [
        'GP-100', 'outbound', 'AFMV Logistics', '["PF5Q8HC7"]', 'Bangalore', 'Mumbai', '2026-08-24', '2026-08-26', 'Harshil'
      ]
    ];

    const passes = parseRowsToGatePasses(gpRows);
    expect(passes).toHaveLength(1);
    expect(passes[0].id).toBe('GP-100');
    expect(passes[0].company).toBe('AFMV Logistics');
    expect(passes[0].serials).toEqual(['PF5Q8HC7']);
    expect(passes[0].origin).toBe('Bangalore');
    expect(passes[0].dest).toBe('Mumbai');
    expect(passes[0].receiver).toBe('Harshil');
  });

  it('parses shipments tracker with header aliasing', () => {
    const shipRows = [
      [
        'Shipment ID', 'Gate Pass ID', 'Status', 'Shipment Type', 'Origin', 'Destination', 'Tracking Number', 'Total Assets'
      ],
      [
        'SHIP-100', 'GP-100', 'In Transit', 'Campaign Dispatch', 'Bangalore', 'Mumbai', 'TRK-AFMV-1234-5678', '1'
      ]
    ];

    const shipments = parseRowsToShipments(shipRows);
    expect(shipments).toHaveLength(1);
    expect(shipments[0].id).toBe('SHIP-100');
    expect(shipments[0].gatePassId).toBe('GP-100');
    expect(shipments[0].status).toBe('In Transit');
    expect(shipments[0].trackingNumber).toBe('TRK-AFMV-1234-5678');
    expect(shipments[0].totalAssets).toBe(1);
  });
});
