import * as XLSX from 'xlsx';
import { Asset } from '../types';
import { expandAssetsWithQuantities } from '../lib/assetUtils';
import { getMaxIdIndex } from '../domain/identity';

/**
 * Canonical column headers for the Bulk Import Excel Template
 * Matching the Assets Database schema:
 * Serial Number, Box ID, Item Name, Brand, Description, Quantity, Location, Owner, Current Possessor, Status, Campaign
 */
export const IMPORT_TEMPLATE_HEADERS: readonly string[] = [
  'Serial Number',
  'Box ID',
  'Item Name',
  'Brand',
  'Description',
  'Quantity',
  'Location',
  'Owner',
  'Current Possessor',
  'Status',
  'Campaign'
] as const;

/**
 * Standard sample record demonstrating valid inventory data
 */
export const IMPORT_TEMPLATE_SAMPLE_ROW: readonly (string | number)[] = [
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
] as const;

/**
 * Column specifications and requirements for the Instructions sheet
 */
export interface ColumnInstruction {
  field: string;
  requirement: 'REQUIRED' | 'OPTIONAL';
  description: string;
  example: string;
}

export const INSTRUCTIONS_ENTRIES: readonly ColumnInstruction[] = [
  {
    field: 'Serial Number',
    requirement: 'REQUIRED',
    description: 'Unique hardware serial number or device tag. Must not be blank. Duplicate serials already existing in the database are automatically skipped during import.',
    example: 'PF5Q8HC7'
  },
  {
    field: 'Box ID',
    requirement: 'OPTIONAL',
    description: 'Outer packaging box, carton, or crate identifier. Leave blank or use "—" if the asset is loose or unboxed.',
    example: 'BOX-001'
  },
  {
    field: 'Item Name',
    requirement: 'REQUIRED',
    description: 'Category or product classification (e.g. Laptop, Monitor, Smartphone, Keyboard, Headset). Must not be blank.',
    example: 'Laptop'
  },
  {
    field: 'Brand',
    requirement: 'OPTIONAL',
    description: 'Hardware OEM or Manufacturer (e.g. Lenovo, Apple, Dell, HP, Samsung, Logitech).',
    example: 'Lenovo'
  },
  {
    field: 'Description',
    requirement: 'OPTIONAL',
    description: 'Detailed specifications, model name, RAM/storage, CPU, or hardware details.',
    example: 'Lenovo Legion 5'
  },
  {
    field: 'Quantity',
    requirement: 'OPTIONAL',
    description: 'Number of units (defaults to 1). If greater than 1, InventoryOS will automatically expand into unique serialized records.',
    example: '1'
  },
  {
    field: 'Location',
    requirement: 'OPTIONAL',
    description: 'Current physical warehouse, hub, office, or city (e.g. Delhi, Bangalore, Mumbai). Defaults to Bangalore.',
    example: 'Delhi'
  },
  {
    field: 'Owner',
    requirement: 'OPTIONAL',
    description: 'Entity, client, or company owning the asset (e.g. Lenovo, AFMV). Defaults to AFMV.',
    example: 'Lenovo'
  },
  {
    field: 'Current Possessor',
    requirement: 'OPTIONAL',
    description: 'Employee, custodian, or team currently in custody of the item. Defaults to Warehouse.',
    example: 'Harshil'
  },
  {
    field: 'Status',
    requirement: 'OPTIONAL',
    description: 'Current lifecycle status (e.g. In House, Dispatched, In Transit, Delivered, Under Repair). Defaults to In House.',
    example: 'In House'
  },
  {
    field: 'Campaign',
    requirement: 'OPTIONAL',
    description: 'Associated marketing campaign, deployment project, or event name. Defaults to Nil.',
    example: 'Lenovo X EWC'
  }
];

/**
 * Creates a formatted Excel Workbook containing:
 * 1. "Template" sheet: Canonical headers and sample row matching the Assets Database schema
 * 2. "Instructions" sheet: Detailed guidance explaining each column and marking required fields
 */
export function createImportTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Template Sheet
  const templateData = [
    [...IMPORT_TEMPLATE_HEADERS],
    [...IMPORT_TEMPLATE_SAMPLE_ROW]
  ];
  const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);

  // Set explicit column widths for clean readability
  wsTemplate['!cols'] = [
    { wch: 18 }, // Serial Number
    { wch: 12 }, // Box ID
    { wch: 18 }, // Item Name
    { wch: 16 }, // Brand
    { wch: 24 }, // Description
    { wch: 10 }, // Quantity
    { wch: 16 }, // Location
    { wch: 16 }, // Owner
    { wch: 20 }, // Current Possessor
    { wch: 14 }, // Status
    { wch: 22 }  // Campaign
  ];
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');

  // 2. Instructions Sheet
  const instructionsHeader = ['Field / Column Name', 'Requirement', 'Description & Constraints', 'Example Value'];
  const instructionsBody = INSTRUCTIONS_ENTRIES.map(e => [
    e.field,
    e.requirement,
    e.description,
    e.example
  ]);

  const instructionsData = [
    instructionsHeader,
    ...instructionsBody,
    ['', '', '', ''],
    ['BEST PRACTICES & GUIDELINES', '', '', ''],
    ['1. Keep Headers Intact', 'NOTE', 'Do not rename or delete any column headers in row 1 of the "Template" sheet.', ''],
    ['2. Mandatory Columns', 'NOTE', '"Serial Number" and "Item Name" must have values for every asset row.', ''],
    ['3. Automatic Deduplication', 'NOTE', 'Any serial numbers that already exist in your InventoryOS database will be safely skipped.', ''],
    ['4. Multi-Unit Expansion', 'NOTE', 'If you enter Quantity > 1, InventoryOS will automatically create individual serialized unit records.', ''],
    ['5. Blank Values', 'NOTE', 'Optional fields left blank will automatically receive standard system default values.', '']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 22 }, // Field
    { wch: 14 }, // Requirement
    { wch: 60 }, // Description
    { wch: 20 }  // Example
  ];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return wb;
}

/**
 * Triggers browser download of the canonical import template workbook (.xlsx)
 */
export function downloadImportTemplate(filename = 'InventoryOS_Import_Template.xlsx'): void {
  const wb = createImportTemplateWorkbook();
  XLSX.writeFile(wb, filename);
}

/**
 * Extracts and normalizes rows from an uploaded worksheet into domain Asset objects.
 */
export function parseUploadedWorksheet(
  worksheet: XLSX.WorkSheet,
  existingAssets: Asset[] = [],
  userDisplayName = 'System'
): Asset[] {
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows || rows.length <= 1) {
    throw new Error('The uploaded worksheet is empty or missing data rows.');
  }

  // Column mapping logic (match case insensitive headers with aliases)
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
  const findIndex = (aliases: string[]) => headers.findIndex(h => aliases.includes(h));

  const serialIdx = findIndex(['serial number', 'serial', 'serial no', 's/n serial', 'sn', 'serialnumber']);
  const boxIdIdx = findIndex(['box id', 'boxid', 'box', 'box_id', 'box no', 'carton']);
  const nameIdx = findIndex(['item name', 'item', 'name', 'itemname', 'product name', 'product']);
  const brandIdx = findIndex(['brand', 'make', 'manufacturer', 'oem']);
  const descIdx = findIndex(['description', 'desc', 'model', 'specs', 'details']);
  const qtyIdx = findIndex(['quantity', 'qty', 'count', 'units', 'pieces', 'pcs']);
  const cityIdx = findIndex(['location', 'city', 'warehouse', 'hub', 'site']);
  const ownerIdx = findIndex(['owner', 'company', 'client', 'organization']);
  const possessorIdx = findIndex(['current possessor', 'possessor', 'current possession', 'custodian', 'holder', 'manager']);
  const statusIdx = findIndex(['status', 'state', 'asset status']);
  const campaignIdx = findIndex(['campaign', 'currently used for (campaign)', 'project', 'event', 'activity']);

  if (serialIdx === -1 || nameIdx === -1) {
    throw new Error('Required columns "Serial Number" and "Item Name" could not be detected. Please download the template for exact headers.');
  }

  const baseAssetNum = getMaxIdIndex(existingAssets.map(a => a.assetId), /AST-(\d+)/i);
  const todayStr = new Date().toISOString().split('T')[0];

  const parsedRaw: Asset[] = rows.slice(1).map((r, i) => {
    const serial = String(r[serialIdx] || '').trim();
    const assetNum = baseAssetNum + i + 1;
    const boxIdVal = boxIdIdx !== -1 ? String(r[boxIdIdx] || '').trim() : '';
    const nameVal = String(r[nameIdx] || '').trim();

    return {
      sn: existingAssets.length + i + 1,
      assetId: `AST-${String(assetNum).padStart(6, '0')}`,
      serial,
      boxId: boxIdVal && boxIdVal !== '-' ? boxIdVal : '—',
      name: nameVal,
      brand: brandIdx !== -1 ? String(r[brandIdx] || '').trim() : '',
      desc: descIdx !== -1 ? String(r[descIdx] || '').trim() : '',
      qty: qtyIdx !== -1 ? parseInt(String(r[qtyIdx] || '1'), 10) || 1 : 1,
      city: cityIdx !== -1 ? (String(r[cityIdx] || '').trim() || 'Bangalore') : 'Bangalore',
      owner: ownerIdx !== -1 ? (String(r[ownerIdx] || '').trim() || 'AFMV') : 'AFMV',
      possessor: possessorIdx !== -1 ? (String(r[possessorIdx] || '').trim() || 'Warehouse') : 'Warehouse',
      status: statusIdx !== -1 ? (String(r[statusIdx] || '').trim() || 'In House') : 'In House',
      campaign: campaignIdx !== -1 ? (String(r[campaignIdx] || '').trim() || 'Nil') : 'Nil',
      receivedBy: userDisplayName || 'System',
      receivedOn: todayStr,
      shippingTo: 'Nil',
      shippingDate: 'Nil'
    };
  }).filter(item => Boolean(item.serial && item.name));

  if (parsedRaw.length === 0) {
    throw new Error('No valid items containing both a Serial Number and Item Name were found in the uploaded file.');
  }

  return expandAssetsWithQuantities(parsedRaw);
}
