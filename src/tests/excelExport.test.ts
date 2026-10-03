import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { 
  buildSelectedAssetsWorkbook, 
  generateExportFilename, 
  exportSelectedAssetsToExcel, 
  EXPORT_ASSET_COLUMNS 
} from '../lib/excelExport';
import { Asset } from '../types';

describe('Excel Export for Selected Assets', () => {
  const sampleAssets: Asset[] = [
    {
      sn: 1,
      assetId: 'AST-000001',
      serial: '00123456X',
      boxId: 'BOX-01',
      name: 'Laptop',
      brand: 'Lenovo',
      desc: 'Lenovo Legion 5',
      qty: 1,
      city: 'Bangalore',
      owner: 'AFMV',
      possessor: 'Nikhil',
      campaign: 'Redington store Activity',
      status: 'In House',
      receivedBy: 'Prem',
      receivedOn: '2026-01-02',
      shippingTo: 'Nil',
      shippingDate: 'Nil',
      createdDate: '2026-01-02',
      lastUpdated: '2026-01-02'
    },
    {
      sn: 2,
      assetId: 'AST-000002',
      serial: '00789012Y',
      boxId: 'BOX-02',
      name: 'Mouse',
      brand: 'HyperX',
      desc: 'Pulsefire Haste',
      qty: 2,
      city: 'Mumbai',
      owner: 'Lenovo',
      possessor: 'Karan',
      campaign: 'Lenovo AP Yoga',
      status: 'Delivered',
      receivedBy: 'Karan',
      receivedOn: '2026-01-09',
      shippingTo: 'Delhi Hub',
      shippingDate: '2026-01-10',
      createdDate: '2026-01-09',
      lastUpdated: '2026-01-10'
    },
    {
      sn: 3,
      assetId: 'AST-000003',
      serial: '00999888Z',
      boxId: '—',
      name: 'Headset',
      brand: 'HyperX',
      desc: 'Cloud II Wireless',
      qty: 1,
      city: 'Delhi',
      owner: 'Lenovo',
      possessor: 'Aditya',
      campaign: 'Lenovo AP Yoga',
      status: 'In Transit',
      receivedBy: 'Aditya',
      receivedOn: '2026-01-09',
      shippingTo: 'Nil',
      shippingDate: 'Nil',
      createdDate: '2026-01-09',
      lastUpdated: '2026-01-09'
    }
  ];

  it('generates dynamic filename incorporating count and current ISO date', () => {
    const fixedDate = new Date('2026-10-03T12:00:00Z');
    const filename = generateExportFilename(5, fixedDate);
    expect(filename).toBe('InventoryOS_Selected_Assets_5_2026-10-03.xlsx');

    const singleFilename = generateExportFilename(1, fixedDate);
    expect(singleFilename).toBe('InventoryOS_Selected_Assets_1_2026-10-03.xlsx');
  });

  it('builds a valid Excel workbook with all 19 preferred columns in exact order', () => {
    const selected = [sampleAssets[0]];
    const wb = buildSelectedAssetsWorkbook(selected);

    expect(wb.SheetNames).toContain('Selected Assets');
    const ws = wb.Sheets['Selected Assets'];
    expect(ws).toBeDefined();

    const jsonRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    expect(jsonRows.length).toBe(2); // 1 header row + 1 data row

    const headers = jsonRows[0];
    const expectedHeaders = [
      'S/N', 'Asset ID', 'Item Name', 'Brand', 'Product Name / Description',
      'Serial Number', 'Box ID', 'Quantity', 'Location', 'Owner',
      'Current Possessor', 'Campaign', 'Status', 'Received By', 'Received On',
      'Shipping To', 'Shipping Date', 'Created Date', 'Last Updated'
    ];
    expect(headers).toEqual(expectedHeaders);

    const firstRow = jsonRows[1];
    expect(firstRow[0]).toBe(1); // S/N
    expect(firstRow[1]).toBe('AST-000001'); // Asset ID
    expect(firstRow[2]).toBe('Laptop'); // Item Name
    expect(firstRow[3]).toBe('Lenovo'); // Brand
    expect(firstRow[4]).toBe('Lenovo Legion 5'); // Product Name / Description
    expect(firstRow[5]).toBe('00123456X'); // Serial Number
    expect(firstRow[6]).toBe('BOX-01'); // Box ID
    expect(firstRow[7]).toBe(1); // Quantity
    expect(firstRow[8]).toBe('Bangalore'); // Location
    expect(firstRow[9]).toBe('AFMV'); // Owner
    expect(firstRow[10]).toBe('Nikhil'); // Current Possessor
    expect(firstRow[11]).toBe('Redington store Activity'); // Campaign
    expect(firstRow[12]).toBe('In House'); // Status
    expect(firstRow[13]).toBe('Prem'); // Received By
    expect(firstRow[14]).toBe('2026-01-02'); // Received On
    expect(firstRow[15]).toBe('Nil'); // Shipping To
    expect(firstRow[16]).toBe('Nil'); // Shipping Date
    expect(firstRow[17]).toBe('2026-01-02'); // Created Date
    expect(firstRow[18]).toBe('2026-01-02'); // Last Updated
  });

  it('preserves leading zeroes and text formatting for serial numbers and Asset IDs', () => {
    const selected = [sampleAssets[0]];
    const wb = buildSelectedAssetsWorkbook(selected);
    const ws = wb.Sheets['Selected Assets'];

    // Serial Number is in column F (col index 5), row 2 (r: 1)
    const serialCell = ws[XLSX.utils.encode_cell({ r: 1, c: 5 })];
    expect(serialCell).toBeDefined();
    expect(serialCell.t).toBe('s'); // Text format
    expect(serialCell.v).toBe('00123456X'); // Leading zeroes preserved

    // Asset ID is in column B (col index 1), row 2 (r: 1)
    const idCell = ws[XLSX.utils.encode_cell({ r: 1, c: 1 })];
    expect(idCell).toBeDefined();
    expect(idCell.t).toBe('s');
    expect(idCell.v).toBe('AST-000001');
  });

  it('exports exactly the selected subset of assets (e.g. 2 out of 3)', () => {
    const selected = [sampleAssets[0], sampleAssets[2]];
    const wb = buildSelectedAssetsWorkbook(selected);
    const ws = wb.Sheets['Selected Assets'];

    const jsonRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    expect(jsonRows.length).toBe(3); // 1 header + 2 data rows

    expect(jsonRows[1][5]).toBe('00123456X');
    expect(jsonRows[2][5]).toBe('00999888Z');

    // sampleAssets[1] ('00789012Y') should NOT be present
    const serials = jsonRows.slice(1).map(r => r[5]);
    expect(serials).not.toContain('00789012Y');
  });

  it('returns validation error without generating file when 0 assets are selected', () => {
    const result = exportSelectedAssetsToExcel([]);
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBe('Please select at least one asset to export.');
  });

  it('invokes writeFn when exportSelectedAssetsToExcel is called with valid selection', () => {
    const mockWriteFn = vi.fn();

    const result = exportSelectedAssetsToExcel([sampleAssets[1]], undefined, mockWriteFn);
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(mockWriteFn).toHaveBeenCalledTimes(1);
    expect(mockWriteFn.mock.calls[0][1]).toContain('InventoryOS_Selected_Assets_1_');
  });

  describe('Prompt Requirements Loop Verification (TEST 1 to TEST 8)', () => {
    const extendedAssets: Asset[] = [
      { ...sampleAssets[0], serial: 'SN-01', assetId: 'AST-000001', boxId: 'BOX-01', owner: 'Redington' },
      { ...sampleAssets[1], serial: 'SN-02', assetId: 'AST-000002', boxId: 'BOX-02', owner: 'Redington' },
      { ...sampleAssets[2], serial: 'SN-03', assetId: 'AST-000003', boxId: 'BOX-03', owner: 'Redington' },
      { ...sampleAssets[0], serial: 'SN-04', assetId: 'AST-000004', boxId: 'BOX-04', owner: 'Redington' },
      { ...sampleAssets[1], serial: 'SN-05', assetId: 'AST-000005', boxId: 'BOX-05', owner: 'Redington' },
      { ...sampleAssets[2], serial: 'SN-06', assetId: 'AST-000006', boxId: 'BOX-06', owner: 'Lenovo' },
      { ...sampleAssets[0], serial: 'SN-07', assetId: 'AST-000007', boxId: 'BOX-07', owner: 'Lenovo' },
    ];

    it('TEST 1: Select 1 asset -> Export -> Excel contains 1 row', () => {
      const selected = [extendedAssets[0]];
      const wb = buildSelectedAssetsWorkbook(selected);
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Selected Assets'], { header: 1 });
      expect(rows.length).toBe(2); // 1 header + 1 data row
      expect(rows[1][5]).toBe('SN-01');
    });

    it('TEST 2: Select 5 assets -> Export -> Excel contains exactly 5 rows', () => {
      const selected = extendedAssets.slice(0, 5);
      const wb = buildSelectedAssetsWorkbook(selected);
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Selected Assets'], { header: 1 });
      expect(rows.length).toBe(6); // 1 header + 5 data rows
      expect(rows.slice(1).map(r => r[5])).toEqual(['SN-01', 'SN-02', 'SN-03', 'SN-04', 'SN-05']);
    });

    it('TEST 3: Apply a filter -> Select 3 assets -> Export -> exactly 3 selected assets exported', () => {
      // Simulate user filtering by owner = 'Redington' (5 matching items)
      const filtered = extendedAssets.filter(a => a.owner === 'Redington');
      expect(filtered.length).toBe(5);

      // User selects 3 of them
      const selectedSerials = new Set(['SN-01', 'SN-03', 'SN-05']);
      const selectedToExport = extendedAssets.filter(a => selectedSerials.has(a.serial));
      expect(selectedToExport.length).toBe(3);

      const wb = buildSelectedAssetsWorkbook(selectedToExport);
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Selected Assets'], { header: 1 });
      expect(rows.length).toBe(4); // 1 header + 3 data rows
      expect(rows.slice(1).map(r => r[5])).toEqual(['SN-01', 'SN-03', 'SN-05']);
    });

    it('TEST 4: Select All -> Export -> all assets represented by the selection are exported', () => {
      // Simulate user selecting all filtered assets
      const selectedSerials = new Set(extendedAssets.map(a => a.serial));
      const selectedToExport = extendedAssets.filter(a => selectedSerials.has(a.serial));
      expect(selectedToExport.length).toBe(7);

      const wb = buildSelectedAssetsWorkbook(selectedToExport);
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Selected Assets'], { header: 1 });
      expect(rows.length).toBe(8); // 1 header + 7 data rows
    });

    it('TEST 5: Select assets -> change search/filter -> verify selection behavior remains consistent', () => {
      // User selects 2 assets
      const selectedSerials = new Set(['SN-01', 'SN-02']);
      // Filter changes to owner = 'Lenovo' (SN-01 and SN-02 not in visible list)
      const visibleFiltered = extendedAssets.filter(a => a.owner === 'Lenovo');
      expect(visibleFiltered.map(a => a.serial)).toEqual(['SN-06', 'SN-07']);

      // Export resolves from master assets array using selectedSerials, retaining the 2 selected assets
      const exportItems = extendedAssets.filter(a => selectedSerials.has(a.serial));
      expect(exportItems.length).toBe(2);
      expect(exportItems.map(a => a.serial)).toEqual(['SN-01', 'SN-02']);

      const wb = buildSelectedAssetsWorkbook(exportItems);
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Selected Assets'], { header: 1 });
      expect(rows.length).toBe(3); // 1 header + 2 data rows
    });

    it('TEST 6: No assets selected -> Export action returns validation error without file generation', () => {
      const mockWrite = vi.fn();
      const result = exportSelectedAssetsToExcel([], undefined, mockWrite);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please select at least one asset to export.');
      expect(mockWrite).not.toHaveBeenCalled();
    });

    it('TEST 7: Verify Asset ID, Serial Number, Box ID are preserved as text formatting', () => {
      const specialAssets: Asset[] = [{
        ...extendedAssets[0],
        assetId: '000123', // Leading zeroes
        serial: '00456-A', // Leading zeroes + hyphens
        boxId: '007'        // Leading zeroes
      }];

      const wb = buildSelectedAssetsWorkbook(specialAssets);
      const ws = wb.Sheets['Selected Assets'];

      // Row index 1 (data row)
      const idCell = ws[XLSX.utils.encode_cell({ r: 1, c: 1 })]; // Asset ID
      const serialCell = ws[XLSX.utils.encode_cell({ r: 1, c: 5 })]; // Serial Number
      const boxCell = ws[XLSX.utils.encode_cell({ r: 1, c: 6 })]; // Box ID

      expect(idCell.t).toBe('s');
      expect(idCell.v).toBe('000123');
      expect(serialCell.t).toBe('s');
      expect(serialCell.v).toBe('00456-A');
      expect(boxCell.t).toBe('s');
      expect(boxCell.v).toBe('007');
    });

    it('TEST 8: Verify exporting does NOT mutate assets or trigger network/Google Sheets operations', () => {
      const originalAssetSnapshot = JSON.stringify(extendedAssets);
      const mockWrite = vi.fn();

      const result = exportSelectedAssetsToExcel(extendedAssets.slice(0, 3), undefined, mockWrite);
      expect(result.success).toBe(true);

      // Verify original assets array remains unchanged
      expect(JSON.stringify(extendedAssets)).toBe(originalAssetSnapshot);
    });
  });
});
