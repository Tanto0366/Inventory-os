import { describe, it, expect } from 'vitest';
import { getCanonicalSpreadsheetId, DEFAULT_MASTER_SPREADSHEET_ID } from '../services/configService';

describe('Google Sheets Schema Consistency Tests', () => {
  const SHEET_CONFIGS = {
    'Assets Database': {
      expectedColumns: 18,
      range: 'Assets Database!A:R',
      headers: [
        'Asset ID', 'Serial Number', 'Box ID', 'Item Name', 'Brand', 'Product Name', 
        'Quantity', 'Location', 'Owner', 'Current Possessor', 'Campaign', 
        'Status', 'Received By', 'Received On', 'Shipping To', 'Shipping Date', 
        'Created Date', 'Last Updated'
      ]
    },
    'Shipment Tracker': {
      expectedColumns: 33,
      range: 'Shipment Tracker!A:AG',
      headers: [
        'Shipment ID', 'Gate Pass ID', 'Status', 'Shipment Type', 'Priority', 'Origin', 'Destination', 
        'Current Location', 'Campaign', 'Courier', 'Tracking Number', 'Vehicle Number', 
        'Driver Name', 'Driver Contact', 'Dispatch Date', 'Expected Delivery', 'Actual Delivery', 
        'Sender', 'Receiver', 'Receiver Contact', 'Possessor', 'Total Assets', 'Delivered Assets', 
        'Pending Assets', 'Returned Assets', 'Shipping Cost', 'Insurance', 'Weight', 'Boxes', 'Remarks', 
        'Last Updated', 'Assets JSON', 'Timeline JSON'
      ]
    },
    'Gate Pass': {
      expectedColumns: 15,
      range: 'Gate Pass!A:O',
      headers: [
        'Gate Pass Number', 'Pass Type', 'Company', 'Serials', 'Origin', 'Origin Address', 'Destination', 'Destination Address', 
        'Shipping Date', 'ETA', 'Receiver', 'Possessor After', 'New Status', 'Notes', 'Created Date'
      ]
    },
    'Audit Trail': {
      expectedColumns: 7,
      range: 'Audit Trail!A:G',
      headers: [
        'Timestamp', 'Serial Number', 'Field Changed', 'Previous Value', 'New Value', 'Changed By', 'Reference'
      ]
    },
    'Admin': {
      expectedColumns: 7,
      range: 'Admin!A:G',
      headers: [
        'Admin Email', 'Role', 'Status', 'Granted By', 'Granted On', 'Last Login', 'Last Updated'
      ]
    }
  };

  it('verifies that each sheet header count precisely matches expected column range widths', () => {
    for (const [sheetName, config] of Object.entries(SHEET_CONFIGS)) {
      expect(config.headers.length, `${sheetName} header count`).toBe(config.expectedColumns);
    }
  });

  it('verifies canonical spreadsheet ID configuration fallback', () => {
    const canonicalId = getCanonicalSpreadsheetId();
    expect(canonicalId).toBe(DEFAULT_MASTER_SPREADSHEET_ID);
    expect(canonicalId).toBeTruthy();
  });
});
