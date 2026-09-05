import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { 
  IMPORT_TEMPLATE_HEADERS, 
  IMPORT_TEMPLATE_SAMPLE_ROW, 
  INSTRUCTIONS_ENTRIES,
  createImportTemplateWorkbook, 
  parseUploadedWorksheet 
} from '../services/importTemplateService';

describe('Bulk Import Excel Template & Parser Consistency', () => {
  it('has the canonical 11 headers matching the Assets Database schema exactly', () => {
    expect(IMPORT_TEMPLATE_HEADERS).toEqual([
      'Serial Number',
      'Box ID',
      'Item Name',
      'Brand',
      'Product Name',
      'Quantity',
      'Location',
      'Owner',
      'Current Possessor',
      'Status',
      'Campaign'
    ]);

    // Check specific header naming requirement: Current Possessor
    expect(IMPORT_TEMPLATE_HEADERS[8]).toBe('Current Possessor');
    expect(IMPORT_TEMPLATE_HEADERS).not.toContain('Current Possession');
    expect(IMPORT_TEMPLATE_HEADERS[1]).toBe('Box ID');
    expect(IMPORT_TEMPLATE_HEADERS[0]).toBe('Serial Number');
  });

  it('contains the recommended sample row matching the specification', () => {
    expect(IMPORT_TEMPLATE_SAMPLE_ROW).toEqual([
      'PF5Q8HC7',
      'BOX-001',
      'Laptop',
      'Lenovo',
      'Lenovo Legion 5',
      1,
      'Delhi',
      'Lenovo',
      'Harshil',
      'In House',
      'Lenovo X EWC'
    ]);
  });

  it('generates a workbook with two sheets: Template and Instructions', () => {
    const wb = createImportTemplateWorkbook();
    expect(wb.SheetNames).toEqual(['Template', 'Instructions']);

    const templateSheet = wb.Sheets['Template'];
    const templateRows = XLSX.utils.sheet_to_json(templateSheet, { header: 1 }) as any[][];

    expect(templateRows[0]).toEqual([...IMPORT_TEMPLATE_HEADERS]);
    expect(templateRows[1]).toEqual([...IMPORT_TEMPLATE_SAMPLE_ROW]);
  });

  it('includes an Instructions sheet explaining all columns and marking required fields', () => {
    const wb = createImportTemplateWorkbook();
    const instructionsSheet = wb.Sheets['Instructions'];
    const instructionRows = XLSX.utils.sheet_to_json(instructionsSheet, { header: 1 }) as any[][];

    // First row should be headers
    expect(instructionRows[0]).toEqual(['Field / Column Name', 'Requirement', 'Description & Constraints', 'Example Value']);

    // Serial Number and Item Name MUST be REQUIRED
    const serialRow = instructionRows.find(r => r[0] === 'Serial Number');
    expect(serialRow).toBeDefined();
    expect(serialRow![1]).toBe('REQUIRED');

    const nameRow = instructionRows.find(r => r[0] === 'Item Name');
    expect(nameRow).toBeDefined();
    expect(nameRow![1]).toBe('REQUIRED');

    // Current Possessor, Box ID, Location, etc. must be documented
    const possessorRow = instructionRows.find(r => r[0] === 'Current Possessor');
    expect(possessorRow).toBeDefined();
    expect(possessorRow![1]).toBe('OPTIONAL');

    const boxRow = instructionRows.find(r => r[0] === 'Box ID');
    expect(boxRow).toBeDefined();
    expect(boxRow![1]).toBe('OPTIONAL');

    // Check that all 11 entries are present in instructions
    expect(INSTRUCTIONS_ENTRIES).toHaveLength(11);
  });

  it('seamlessly parses the generated template into valid Asset domain entities', () => {
    const wb = createImportTemplateWorkbook();
    const templateSheet = wb.Sheets['Template'];

    const assets = parseUploadedWorksheet(templateSheet, [], 'Aditya Tiwari');
    expect(assets).toHaveLength(1);

    const asset = assets[0];
    expect(asset.serial).toBe('PF5Q8HC7');
    expect(asset.boxId).toBe('BOX-001');
    expect(asset.name).toBe('Laptop');
    expect(asset.brand).toBe('Lenovo');
    expect(asset.desc).toBe('Lenovo Legion 5');
    expect(asset.qty).toBe(1);
    expect(asset.city).toBe('Delhi');
    expect(asset.owner).toBe('Lenovo');
    expect(asset.possessor).toBe('Harshil');
    expect(asset.status).toBe('In House');
    expect(asset.campaign).toBe('Lenovo X EWC');
    expect(asset.receivedBy).toBe('Aditya Tiwari');
  });

  it('handles multi-quantity asset rows by expanding them into distinct serialized records', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [...IMPORT_TEMPLATE_HEADERS],
      ['SN-MONITOR-BATCH', 'BOX-DISPLAY', 'LED Monitor', 'Dell', '27-inch 4K', 3, 'Bangalore', 'AFMV', 'Harshil', 'In House', 'Nil']
    ]);

    const assets = parseUploadedWorksheet(ws, [], 'Aditya');
    expect(assets).toHaveLength(3);
    expect(assets[0].name).toBe('LED Monitor');
    expect(assets[0].serial).toBe('SN-MONITOR-BATCH-1');
    expect(assets[1].serial).toBe('SN-MONITOR-BATCH-2');
    expect(assets[2].serial).toBe('SN-MONITOR-BATCH-3');
    expect(assets.every(a => a.boxId === 'BOX-DISPLAY')).toBe(true);
    expect(assets.every(a => a.possessor === 'Harshil')).toBe(true);
  });

  it('rejects worksheets missing required columns with a descriptive error', () => {
    // Missing "Item Name"
    const ws = XLSX.utils.aoa_to_sheet([
      ['Serial Number', 'Brand', 'Status'],
      ['SN-12345', 'Dell', 'In House']
    ]);

    expect(() => parseUploadedWorksheet(ws, [])).toThrow(/Required columns "Serial Number" and "Item Name" could not be detected/);
  });
});
