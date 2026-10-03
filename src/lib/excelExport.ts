import * as XLSX from 'xlsx';
import { Asset } from '../types';

/**
 * Logical export columns for Assets Ledger export
 * Preserving the canonical column structure used by the Assets Ledger and Google Sheets schema.
 */
export const EXPORT_ASSET_COLUMNS = [
  { header: 'S/N', key: 'sn', isText: false },
  { header: 'Asset ID', key: 'assetId', isText: true },
  { header: 'Item Name', key: 'name', isText: true },
  { header: 'Brand', key: 'brand', isText: true },
  { header: 'Product Name / Description', key: 'desc', isText: true },
  { header: 'Serial Number', key: 'serial', isText: true },
  { header: 'Box ID', key: 'boxId', isText: true },
  { header: 'Quantity', key: 'qty', isText: false },
  { header: 'Location', key: 'city', isText: true },
  { header: 'Owner', key: 'owner', isText: true },
  { header: 'Current Possessor', key: 'possessor', isText: true },
  { header: 'Campaign', key: 'campaign', isText: true },
  { header: 'Status', key: 'status', isText: true },
  { header: 'Received By', key: 'receivedBy', isText: true },
  { header: 'Received On', key: 'receivedOn', isText: true },
  { header: 'Shipping To', key: 'shippingTo', isText: true },
  { header: 'Shipping Date', key: 'shippingDate', isText: true },
  { header: 'Created Date', key: 'createdDate', isText: true },
  { header: 'Last Updated', key: 'lastUpdated', isText: true }
] as const;

/**
 * Generates dynamic filename incorporating selected count and current ISO date
 * Example: InventoryOS_Selected_Assets_5_2026-10-03.xlsx
 */
export function generateExportFilename(count: number, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  return `InventoryOS_Selected_Assets_${count}_${dateStr}.xlsx`;
}

/**
 * Builds an Excel Workbook (.xlsx) from a list of selected assets
 */
export function buildSelectedAssetsWorkbook(selectedAssets: Asset[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const headers = EXPORT_ASSET_COLUMNS.map(c => c.header);
  const rows: (string | number)[][] = selectedAssets.map((asset, index) => {
    const qtyVal = typeof asset.qty === 'number' ? asset.qty : (parseInt(String(asset.qty), 10) || 1);
    
    return [
      asset.sn || index + 1,
      String(asset.assetId || ''),
      String(asset.name || ''),
      String(asset.brand || ''),
      String(asset.desc || ''),
      String(asset.serial || ''),
      String(asset.boxId || '—'),
      qtyVal,
      String(asset.city || ''),
      String(asset.owner || ''),
      String(asset.possessor || ''),
      String(asset.campaign || ''),
      String(asset.status || ''),
      String(asset.receivedBy || ''),
      String(asset.receivedOn || ''),
      String(asset.shippingTo || ''),
      String(asset.shippingDate || ''),
      String(asset.createdDate || ''),
      String(asset.lastUpdated || '')
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set explicit text formatting for string columns to prevent Excel from converting serials / IDs
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const colMeta = EXPORT_ASSET_COLUMNS[C];
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && colMeta && colMeta.isText) {
        cell.t = 's';
        cell.z = '@'; // Explicit Excel text format
      }
    }
  }

  // Polished column widths
  ws['!cols'] = [
    { wch: 6 },  // S/N
    { wch: 14 }, // Asset ID
    { wch: 18 }, // Item Name
    { wch: 16 }, // Brand
    { wch: 28 }, // Product Name / Description
    { wch: 20 }, // Serial Number
    { wch: 14 }, // Box ID
    { wch: 10 }, // Quantity
    { wch: 18 }, // Location
    { wch: 16 }, // Owner
    { wch: 18 }, // Current Possessor
    { wch: 20 }, // Campaign
    { wch: 14 }, // Status
    { wch: 16 }, // Received By
    { wch: 14 }, // Received On
    { wch: 16 }, // Shipping To
    { wch: 14 }, // Shipping Date
    { wch: 14 }, // Created Date
    { wch: 14 }  // Last Updated
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Selected Assets');
  return wb;
}

/**
 * High-level helper to trigger download of selected assets into an Excel (.xlsx) file.
 * Handles validation, file writing, and error capturing.
 */
export function exportSelectedAssetsToExcel(
  selectedAssets: Asset[],
  customFilename?: string,
  writeFn: (wb: XLSX.WorkBook, filename: string) => void = XLSX.writeFile
): { success: boolean; count: number; error?: string } {
  if (!selectedAssets || selectedAssets.length === 0) {
    return {
      success: false,
      count: 0,
      error: 'Please select at least one asset to export.'
    };
  }

  try {
    const wb = buildSelectedAssetsWorkbook(selectedAssets);
    const filename = customFilename || generateExportFilename(selectedAssets.length);
    writeFn(wb, filename);

    return {
      success: true,
      count: selectedAssets.length
    };
  } catch (err: any) {
    console.error('Failed to export selected assets to Excel:', err);
    return {
      success: false,
      count: selectedAssets.length,
      error: err?.message || 'Unable to export selected assets. Please try again.'
    };
  }
}
