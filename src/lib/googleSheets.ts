import { Asset, GatePass, AuditEntry, Campaign, Owner, Possessor, LocationInfo, AdminUser, AdminLog, Shipment } from '../types';
import { expandAssetsWithQuantities } from './assetUtils';
import { refreshGoogleAccessToken } from './firebase';
import { getCanonicalSpreadsheetId, DEFAULT_MASTER_SPREADSHEET_ID, DATABASE_NAME } from '../services/configService';

export const MASTER_SPREADSHEET_ID = DEFAULT_MASTER_SPREADSHEET_ID;

export { getCanonicalSpreadsheetId };

/**
 * Helper to pause execution with exponential backoff delay
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Central Google API request helper that automatically intercepts:
 * - 401 Unauthorized: requests fresh OAuth credentials via popup, and seamlessly retries.
 * - 429 Quota Exceeded / 503 Service Unavailable: applies exponential backoff with jitter.
 */
export async function googleFetch(
  url: string,
  options: RequestInit = {},
  retry = true,
  maxRetries = 3
): Promise<Response> {
  const token = localStorage.getItem('inventory_os_token');

  if (!token) {
    throw new Error('Google authentication is required.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  let attempt = 0;
  let delay = 1000;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401: Refresh Token and retry
      if (response.status === 401 && retry && attempt === 0) {
        attempt++;
        const freshToken = await refreshGoogleAccessToken();
        if (!freshToken) {
          throw new Error('Unable to refresh Google authentication.');
        }
        headers.set('Authorization', `Bearer ${freshToken}`);
        continue;
      }

      // Handle 429 or 503: Exponential backoff with jitter
      if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
        attempt++;
        const jitter = Math.floor(Math.random() * 500);
        await sleep(delay + jitter);
        delay = Math.min(delay * 2, 8000);
        continue;
      }

      return response;
    } catch (networkError: any) {
      if (attempt < maxRetries && (networkError.name === 'TypeError' || networkError.message?.includes('Failed to fetch'))) {
        attempt++;
        await sleep(delay);
        delay = Math.min(delay * 2, 8000);
        continue;
      }
      throw networkError;
    }
  }

  // Final fallback request
  return fetch(url, { ...options, headers });
}

const REQUIRED_SHEETS = [
  'Dashboard',
  'Assets Database',
  'Shipment Tracker',
  'Transactions',
  'Campaigns',
  'Owners',
  'Possessors',
  'Locations',
  'Gate Pass',
  'Audit Trail',
  'Reports',
  'Lookup Tables',
  'Settings',
  'Admin',
  'Hidden Config'
];

export interface SheetData {
  spreadsheetId: string;
  spreadsheetUrl: string;
  assets: Asset[];
  shipments: Shipment[];
  gatePasses: GatePass[];
  auditLogs: AuditEntry[];
  campaigns: Campaign[];
  owners: Owner[];
  possessors: Possessor[];
  locations: LocationInfo[];
  admins: AdminUser[];
  adminLogs: AdminLog[];
}

// Helpers for headers
const HEADERS = {
  'Assets Database': [
    'Asset ID', 'Serial Number', 'Box ID', 'Item Name', 'Brand', 'Description', 
    'Quantity', 'Location', 'Owner', 'Current Possessor', 'Campaign', 
    'Status', 'Received By', 'Received On', 'Shipping To', 'Shipping Date', 
    'Created Date', 'Last Updated'
  ],
  'Shipment Tracker': [
    'Shipment ID', 'Gate Pass ID', 'Status', 'Shipment Type', 'Priority', 'Origin', 'Destination', 
    'Current Location', 'Campaign', 'Courier', 'Tracking Number', 'Vehicle Number', 
    'Driver Name', 'Driver Contact', 'Dispatch Date', 'Expected Delivery', 'Actual Delivery', 
    'Sender', 'Receiver', 'Receiver Contact', 'Possessor', 'Total Assets', 'Delivered Assets', 
    'Pending Assets', 'Returned Assets', 'Shipping Cost', 'Insurance', 'Weight', 'Boxes', 'Remarks', 
    'Last Updated', 'Assets JSON', 'Timeline JSON'
  ],
  'Gate Pass': [
    'Gate Pass Number', 'Pass Type', 'Company', 'Serials', 'Origin', 'Origin Address', 'Destination', 'Destination Address', 
    'Shipping Date', 'ETA', 'Receiver', 'Possessor After', 'New Status', 'Notes', 'Created Date'
  ],
  'Audit Trail': [
    'Timestamp', 'Serial Number', 'Field Changed', 'Previous Value', 'New Value', 'Changed By', 'Reference'
  ],
  'Campaigns': [
    'Campaign Name', 'Client', 'Start Date', 'End Date', 'Owner', 'Budget', 'Description', 'Campaign Status'
  ],
  'Owners': ['Owner Name', 'Company', 'Contact'],
  'Possessors': ['Name', 'Role', 'Department'],
  'Locations': ['City', 'Address', 'Type'],
  'Settings': ['Setting Key', 'Setting Value']
};

const SAMPLE_ASSETS: Asset[] = [
  { sn: 1, assetId: 'AST-000001', serial: 'PF5QGT2K', name: 'Laptop', desc: 'Lenovo Legion 5', qty: 1, brand: 'Lenovo', owner: 'No info', possessor: 'Nikhil', city: 'Bangalore', status: 'In House', campaign: 'Nil', receivedBy: 'Prem', receivedOn: '2026-01-02', shippingTo: 'Nil', shippingDate: 'Nil' },
  { sn: 2, assetId: 'AST-000002', serial: 'HP-MULTI-6', name: 'Laptop', desc: 'HP', qty: 6, brand: 'HP', owner: 'AFMV', possessor: 'Nikhil', city: 'Bangalore', status: 'In House', campaign: 'Redington store Activity', receivedBy: 'Nikhil', receivedOn: '2026-01-12', shippingTo: 'Chennai', shippingDate: '2026-01-08' },
  { sn: 3, assetId: 'AST-000003', serial: 'MPAD-AFMV-6', name: 'Mouse pad', desc: '', qty: 6, brand: 'Hyperx', owner: 'AFMV', possessor: 'Nikhil', city: 'Bangalore', status: 'In House', campaign: 'Redington store Activity', receivedBy: 'Nikhil', receivedOn: '2026-01-12', shippingTo: 'Chennai', shippingDate: '2026-01-08' },
  { sn: 4, assetId: 'AST-000004', serial: 'MOUSE-HX-2', name: 'Mouse', desc: 'Hyperx', qty: 2, brand: 'Hyperx', owner: 'AFMV', possessor: 'Nikhil', city: 'Bangalore', status: 'In House', campaign: 'Redington store Activity', receivedBy: 'Nikhil', receivedOn: '2026-01-12', shippingTo: 'Chennai', shippingDate: '2026-01-08' },
  { sn: 5, assetId: 'AST-000005', serial: 'LSTANDS-6', name: 'Laptop stands', desc: '', qty: 6, brand: 'Generic', owner: 'AFMV', possessor: 'Nikhil', city: 'Bangalore', status: 'In House', campaign: 'Redington store Activity', receivedBy: 'Nikhil', receivedOn: '2026-01-12', shippingTo: 'Chennai', shippingDate: '2026-01-08' },
  { sn: 6, assetId: 'AST-000006', serial: 'HSET-HX-4', name: 'Headset', desc: 'Hyperx', qty: 4, brand: 'Hyperx', owner: 'AFMV', possessor: 'Nikhil', city: 'Bangalore', status: 'In House', campaign: 'Redington store Activity', receivedBy: 'Nikhil', receivedOn: '2026-01-12', shippingTo: 'Chennai', shippingDate: '2026-01-08' },
  { sn: 7, assetId: 'AST-000007', serial: 'PF48LND0', name: 'Laptop', desc: 'Yoga 9i', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Karan', city: 'Mumbai', status: 'In House', campaign: 'Lenovo AP Yoga', receivedBy: 'Karan', receivedOn: '2026-01-09', shippingTo: 'Practice Office Delhi', shippingDate: '2026-02-09' },
  { sn: 8, assetId: 'AST-000008', serial: 'PF4954J4', name: 'Laptop', desc: 'Yoga 9', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Karan', city: 'Mumbai', status: 'In House', campaign: 'Lenovo AP Yoga', receivedBy: 'Karan', receivedOn: '2026-01-09', shippingTo: 'Practice Office Delhi', shippingDate: '2026-02-09' },
  { sn: 9, assetId: 'AST-000009', serial: 'YOGA7-001', name: 'Laptop', desc: 'Yoga 7', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Karan', city: 'Mumbai', status: 'In House', campaign: 'Lenovo AP Yoga', receivedBy: 'Karan', receivedOn: '2026-01-09', shippingTo: '', shippingDate: '' },
  { sn: 10, assetId: 'AST-000010', serial: 'PF5CXBPZ', name: 'Laptop', desc: 'Yoga Slim 9i', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Nabu', city: 'Bangalore', status: 'In House', campaign: 'Lenovo AP Yoga', receivedBy: 'Nabu', receivedOn: '2026-01-09', shippingTo: '', shippingDate: '' },
  { sn: 11, assetId: 'AST-000011', serial: 'PF4SX2SM', name: 'Laptop', desc: 'Yoga 9i', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Aditya', city: 'Delhi', status: 'Delivered', campaign: 'Lenovo AP Yoga', receivedBy: 'Aditya', receivedOn: '2026-01-09', shippingTo: '', shippingDate: '' },
  { sn: 12, assetId: 'AST-000012', serial: 'PF4SX2ZS', name: 'Laptop', desc: 'Yoga 9i', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Aditya', city: 'Delhi', status: 'Delivered', campaign: 'Lenovo AP Yoga', receivedBy: 'Aditya', receivedOn: '2026-01-09', shippingTo: '', shippingDate: '' },
  { sn: 13, assetId: 'AST-000013', serial: 'YX0E2GHG', name: 'Laptop', desc: 'Yoga 7 2-in-1', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Aditya', city: 'Delhi', status: 'Delivered', campaign: 'Lenovo AP Yoga', receivedBy: 'Aditya', receivedOn: '2026-01-09', shippingTo: '', shippingDate: '' },
  { sn: 14, assetId: 'AST-000014', serial: 'MOUSE-LNV-1', name: 'Mouse', desc: '', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Aditya', city: 'Delhi', status: 'Ready for Pickup', campaign: 'Lenovo AP Yoga', receivedBy: 'Aditya', receivedOn: '2026-01-09', shippingTo: '', shippingDate: '' },
  { sn: 15, assetId: 'AST-000015', serial: '5CG5214PHW', name: 'Laptop', desc: 'OMEN 16 MAX', qty: 1, brand: 'OMEN', owner: 'Redington', possessor: 'Aditya', city: 'Kochi', status: 'Delivered', campaign: 'Red.Gaming', receivedBy: 'Aditya', receivedOn: '2026-01-25', shippingTo: 'Gurgaon - Nodwin office', shippingDate: '2026-01-28' },
  { sn: 16, assetId: 'AST-000016', serial: '5CG5214PHJ', name: 'Laptop', desc: 'OMEN 16 MAX', qty: 1, brand: 'OMEN', owner: 'Redington', possessor: 'Aditya', city: 'Kochi', status: 'Delivered', campaign: 'Red.Gaming', receivedBy: 'Aditya', receivedOn: '2026-01-25', shippingTo: 'Gurgaon - Nodwin office', shippingDate: '2026-01-28' },
  { sn: 17, assetId: 'AST-000017', serial: '5CG5214PJS', name: 'Laptop', desc: 'OMEN 16 MAX', qty: 1, brand: 'OMEN', owner: 'Redington', possessor: 'Aditya', city: 'Kochi', status: 'Delivered', campaign: 'Red.Gaming', receivedBy: 'Aditya', receivedOn: '2026-01-25', shippingTo: 'Gurgaon - Nodwin office', shippingDate: '2026-01-28' },
  { sn: 18, assetId: 'AST-000018', serial: '5CD5305K7Z', name: 'Laptop', desc: 'OMEN 16', qty: 1, brand: 'OMEN', owner: 'Redington', possessor: 'Aditya', city: 'Kochi', status: 'Delivered', campaign: 'Red.Gaming', receivedBy: 'Aditya', receivedOn: '2026-01-25', shippingTo: 'Gurgaon - Nodwin office', shippingDate: '2026-01-28' },
  { sn: 19, assetId: 'AST-000019', serial: 'HP-PATNA-6', name: 'Laptop', desc: 'HP', qty: 6, brand: 'HP', owner: 'AFMV', possessor: 'Aditya', city: 'Patna', status: 'Delivered', campaign: 'Red.Gaming', receivedBy: 'Aditya', receivedOn: '2026-01-23', shippingTo: 'Bangalore - Inventory house', shippingDate: '' },
  { sn: 20, assetId: 'AST-000020', serial: 'MP2SRN3DQ', name: 'Laptop', desc: 'LOQ RTX 5050', qty: 1, brand: 'Lenovo', owner: 'Lenovo', possessor: 'Aditya', city: 'Delhi', status: 'Delivered', campaign: 'Lenovo AP Yoga', receivedBy: 'Aditya', receivedOn: '2026-01-28', shippingTo: 'Practice Office Delhi', shippingDate: '2026-02-09' }
];

const SAMPLE_GATE_PASSES: GatePass[] = [
  { id: 'GP-001', type: 'outbound', company: 'AFMV Logistics Pvt. Ltd.', serials: ['PF48LND0', 'PF4954J4'], origin: 'Mumbai', originAddress: 'Hub 4, BKC Industrial Estate, Mumbai 400051', dest: 'Practice Office Delhi', destAddress: 'Tower B, DLF Cyber City, Phase 2, Gurugram / Delhi NCR', shipDate: '2026-01-09', eta: '2026-02-09', receiver: 'Karan', possessor: 'Karan', newStatus: 'In Transit', notes: 'Lenovo AP Yoga campaign delivery', createdDate: '2026-01-09' },
  { id: 'GP-002', type: 'outbound', company: 'AFMV Logistics Pvt. Ltd.', serials: ['5CG5214PHW', '5CG5214PHJ', '5CG5214PJS', '5CD5305K7Z'], origin: 'Kochi', originAddress: 'Central Tech Park, Kakkanad, Kochi 682030', dest: 'Gurgaon - Nodwin office', destAddress: 'Nodwin Gaming HQ, Udyog Vihar Phase 4, Gurugram 122015', shipDate: '2026-01-28', eta: '2026-02-01', receiver: 'Aditya', possessor: 'Aditya', newStatus: 'Delivered', notes: 'OMEN Red.Gaming event', createdDate: '2026-01-28' },
  { id: 'GP-003', type: 'inbound', company: 'AFMV Logistics Pvt. Ltd.', serials: ['HP-MULTI-6'], origin: 'Chennai', originAddress: 'Redington Distribution Hub, Guindy, Chennai 600032', dest: 'Bangalore', destAddress: 'AFMV Logistics Warehouse, Indiranagar, Bangalore 560038', shipDate: '2026-01-08', eta: '2026-01-12', receiver: 'Nikhil', possessor: 'Nikhil', newStatus: 'In House', notes: 'Return from Redington Store Activity', createdDate: '2026-01-12' }
];

export const SAMPLE_SHIPMENTS: Shipment[] = [
  {
    id: 'SHIP-001',
    gatePassId: 'GP-001',
    status: 'In Transit',
    type: 'Campaign Dispatch',
    priority: 'High',
    origin: 'Mumbai',
    destination: 'Practice Office Delhi',
    currentLocation: 'Delhi Hub',
    campaign: 'Lenovo AP Yoga',
    event: 'Lenovo AP Yoga campaign delivery',
    courier: 'Blue Dart Logistics',
    trackingNumber: 'BD-88492019',
    vehicleNumber: 'MH-02-DN-4821',
    driverName: 'Rajesh Sharma',
    driverContact: '+91 98201 55432',
    dispatchDate: '2026-01-09',
    expectedDeliveryDate: '2026-02-09',
    shipmentOwner: 'Lenovo',
    sender: 'Karan (Operations)',
    receiver: 'Practice Office Delhi',
    receiverContact: '+91 98110 22334',
    currentPossessor: 'Karan',
    remarks: 'Handle with care. High-value Yoga 9i laptops.',
    shippingCost: 3500,
    insurance: 'Insured (₹3,00,000)',
    packageWeight: '8.5 kg',
    boxesCount: 2,
    totalAssets: 2,
    deliveredAssetsCount: 0,
    pendingAssetsCount: 2,
    returnedAssetsCount: 0,
    assets: [
      { serial: 'PF48LND0', boxId: 'BOX-MUM-01', name: 'Laptop', brand: 'Lenovo', qty: 1, status: 'In Transit', received: false },
      { serial: 'PF4954J4', boxId: 'BOX-MUM-01', name: 'Laptop', brand: 'Lenovo', qty: 1, status: 'In Transit', received: false }
    ],
    timeline: [
      { id: 'T1', timestamp: '2026-01-09 10:00', title: 'Gate Pass Approved', status: 'Approved', location: 'Mumbai HQ', description: 'Gate pass GP-001 approved and shipment record generated.', performedBy: 'System' },
      { id: 'T2', timestamp: '2026-01-09 11:30', title: 'Packed & Dispatched', status: 'Dispatched', location: 'Mumbai Warehouse', description: 'Handed over to Blue Dart driver Rajesh Sharma.', performedBy: 'Karan' },
      { id: 'T3', timestamp: '2026-01-10 14:20', title: 'In Transit - Delhi Hub', status: 'In Transit', location: 'Delhi Hub', description: 'Shipment arrived at Delhi distribution center.', performedBy: 'Blue Dart' }
    ],
    createdDate: '2026-01-09',
    lastUpdated: '2026-01-10 14:20'
  },
  {
    id: 'SHIP-002',
    gatePassId: 'GP-002',
    status: 'Delivered',
    type: 'Store Deployment',
    priority: 'Urgent',
    origin: 'Kochi',
    destination: 'Gurgaon - Nodwin office',
    currentLocation: 'Gurgaon - Nodwin office',
    campaign: 'Red.Gaming',
    event: 'OMEN Red.Gaming event',
    courier: 'DTDC Priority Air',
    trackingNumber: 'DTDC-7738201',
    vehicleNumber: 'KL-07-BW-1102',
    driverName: 'Suresh Kumar',
    driverContact: '+91 94470 12345',
    dispatchDate: '2026-01-28',
    expectedDeliveryDate: '2026-02-01',
    actualDeliveryDate: '2026-01-31',
    shipmentOwner: 'Redington',
    sender: 'Aditya',
    receiver: 'Aditya (Nodwin Office)',
    receiverContact: '+91 99000 88776',
    currentPossessor: 'Aditya',
    remarks: 'Delivered in good condition and acknowledged by site team.',
    shippingCost: 5200,
    insurance: 'Insured (₹5,00,000)',
    packageWeight: '18 kg',
    boxesCount: 4,
    totalAssets: 4,
    deliveredAssetsCount: 4,
    pendingAssetsCount: 0,
    returnedAssetsCount: 0,
    receiverSignature: 'Aditya (Digitally Signed)',
    acknowledgedBy: 'Aditya',
    condition: 'Good / Perfect',
    assets: [
      { serial: '5CG5214PHW', boxId: 'BOX-KCH-01', name: 'Laptop', brand: 'OMEN', qty: 1, status: 'Delivered', received: true, receivedDate: '2026-01-31' },
      { serial: '5CG5214PHJ', boxId: 'BOX-KCH-01', name: 'Laptop', brand: 'OMEN', qty: 1, status: 'Delivered', received: true, receivedDate: '2026-01-31' },
      { serial: '5CG5214PJS', boxId: 'BOX-KCH-02', name: 'Laptop', brand: 'OMEN', qty: 1, status: 'Delivered', received: true, receivedDate: '2026-01-31' },
      { serial: '5CD5305K7Z', boxId: 'BOX-KCH-02', name: 'Laptop', brand: 'OMEN', qty: 1, status: 'Delivered', received: true, receivedDate: '2026-01-31' }
    ],
    timeline: [
      { id: 'T1', timestamp: '2026-01-28 09:00', title: 'Gate Pass Approved', status: 'Approved', location: 'Kochi Hub', description: 'Gate pass GP-002 created.', performedBy: 'System' },
      { id: 'T2', timestamp: '2026-01-28 10:15', title: 'Dispatched via Air', status: 'Dispatched', location: 'Kochi Airport', description: 'Dispatched via DTDC Air Freight.', performedBy: 'Aditya' },
      { id: 'T3', timestamp: '2026-01-31 16:00', title: 'Delivered & Acknowledged', status: 'Delivered', location: 'Gurgaon Nodwin Office', description: 'Delivered in full and signed by Aditya.', performedBy: 'Aditya' }
    ],
    createdDate: '2026-01-28',
    lastUpdated: '2026-01-31 16:00'
  },
  {
    id: 'SHIP-003',
    gatePassId: 'GP-003',
    status: 'Returned',
    type: 'Return Shipment',
    priority: 'Medium',
    origin: 'Chennai',
    destination: 'Bangalore',
    currentLocation: 'Bangalore Warehouse',
    campaign: 'Redington store Activity',
    event: 'Return from Redington Store Activity',
    courier: 'AFMV Internal Transport',
    trackingNumber: 'INT-MAA-BLR-09',
    vehicleNumber: 'KA-01-MJ-9901',
    driverName: 'Mani',
    driverContact: '+91 97410 99887',
    dispatchDate: '2026-01-08',
    expectedDeliveryDate: '2026-01-12',
    actualDeliveryDate: '2026-01-12',
    shipmentOwner: 'AFMV',
    sender: 'Chennai Store',
    receiver: 'Nikhil (Indiranagar WH)',
    receiverContact: '+91 98860 11223',
    currentPossessor: 'Nikhil',
    remarks: 'Returned back to Bangalore stock after store activity.',
    shippingCost: 1800,
    insurance: 'Standard',
    packageWeight: '12 kg',
    boxesCount: 3,
    totalAssets: 1,
    deliveredAssetsCount: 1,
    pendingAssetsCount: 0,
    returnedAssetsCount: 1,
    receiverSignature: 'Nikhil',
    acknowledgedBy: 'Nikhil',
    condition: 'Returned in Good Condition',
    assets: [
      { serial: 'HP-MULTI-6', boxId: 'BOX-BLR-12', name: 'Laptop', brand: 'HP', qty: 6, status: 'In House', received: true, receivedDate: '2026-01-12', returned: true, returnedDate: '2026-01-12' }
    ],
    timeline: [
      { id: 'T1', timestamp: '2026-01-08 11:00', title: 'Return Initiated', status: 'Return Initiated', location: 'Chennai', description: 'Return shipment initiated for HP multi units.', performedBy: 'Chennai Store' },
      { id: 'T2', timestamp: '2026-01-12 10:00', title: 'Received & Restocked', status: 'Returned', location: 'Bangalore Warehouse', description: 'Restocked in Indiranagar warehouse by Nikhil.', performedBy: 'Nikhil' }
    ],
    createdDate: '2026-01-08',
    lastUpdated: '2026-01-12 10:00'
  }
];

const SAMPLE_AUDIT: AuditEntry[] = [
  { time: '2026-01-28 10:00', serial: '5CG5214PHW', field: 'Status', from: 'In House', to: 'Delivered', by: 'Warehouse Admin', note: 'GP-002' },
  { time: '2026-01-28 10:00', serial: '5CG5214PHJ', field: 'Status', from: 'In House', to: 'Delivered', by: 'Warehouse Admin', note: 'GP-002' },
  { time: '2026-01-28 10:00', serial: '5CG5214PJS', field: 'Status', from: 'In House', to: 'Delivered', by: 'Warehouse Admin', note: 'GP-002' },
  { time: '2026-01-12 09:00', serial: 'HP-MULTI-6', field: 'Location', from: 'Chennai', to: 'Bangalore', by: 'Nikhil', note: 'GP-003 received' },
  { time: '2026-01-09 11:30', serial: 'PF48LND0', field: 'Possessor', from: 'Warehouse', to: 'Karan', by: 'Warehouse Admin', note: 'GP-001' },
  { time: '2026-01-09 11:30', serial: 'PF4954J4', field: 'Possessor', from: 'Warehouse', to: 'Karan', by: 'Warehouse Admin', note: 'GP-001' }
];

const SAMPLE_CAMPAIGNS: Campaign[] = [
  { name: 'Lenovo AP Yoga', client: 'Lenovo India', startDate: '2026-01-01', endDate: '2026-03-31', owner: 'Aditya', budget: '₹5,00,000', description: 'Store activation for Yoga Premium laptops', status: 'Active' },
  { name: 'Red.Gaming', client: 'Redington / HP', startDate: '2026-01-15', endDate: '2026-02-15', owner: 'Karan', budget: '₹12,00,000', description: 'Gaming roadshow at Nodwin centers', status: 'Active' }
];

const SAMPLE_OWNERS: Owner[] = [
  { name: 'Lenovo', company: 'Lenovo India', contact: 'lenovo@afmv.in' },
  { name: 'Redington', company: 'Redington Distribution', contact: 'redington@afmv.in' },
  { name: 'AFMV', company: 'Aftermath Ventures', contact: 'aditya@aftermathventures.in' }
];

const SAMPLE_POSSESSORS: Possessor[] = [
  { name: 'Nikhil', role: 'Store Lead', department: 'Logistics' },
  { name: 'Karan', role: 'Operations', department: 'Events' },
  { name: 'Aditya', role: 'Director', department: 'Strategy' },
  { name: 'Nabu', role: 'Field Exec', department: 'Support' }
];

const SAMPLE_LOCATIONS: LocationInfo[] = [
  { city: 'Bangalore', address: 'AFMV Main Warehouse, Indiranagar', type: 'Central' },
  { city: 'Mumbai', address: 'Karan Office, Bandra East', type: 'Branch' },
  { city: 'Delhi', address: 'Practice Office Delhi, Connaught Place', type: 'Site' },
  { city: 'Kochi', address: 'Event Warehouse, Kakkanad', type: 'Site' }
];

// Search for existing spreadsheet in user's Drive (including shared files)
export async function findSpreadsheet(token?: string): Promise<string | null> {
  const query = `name = '${DATABASE_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  
  // Try wide search supporting shared files and all drives first
  try {
    const wideUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,owners,modifiedTime)&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
    const res = await googleFetch(wideUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }
  } catch (e) {
    console.warn('Wide drive search notice:', e);
  }

  // Standard search fallback
  try {
    const standardUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,owners,modifiedTime)&orderBy=modifiedTime desc`;
    const res = await googleFetch(standardUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }
  } catch (e) {
    console.warn('Standard Drive search notice:', e);
  }

  return null;
}

/**
 * Resolves the master spreadsheet ID with canonical precedence:
 * 1. Configured VITE_INVENTORYOS_SPREADSHEET_ID env var or canonical default
 * 2. Explicitly passed target spreadsheet ID (e.g. manually connected)
 * 3. Drive discovery for InventoryOS_Database (including shared drives)
 */
export async function resolveMasterSpreadsheetId(token?: string, explicitId?: string): Promise<string | null> {
  const canonical = getCanonicalSpreadsheetId();
  if (canonical) {
    return canonical;
  }

  if (explicitId && explicitId.trim()) {
    return explicitId.trim();
  }

  const found = await findSpreadsheet(token);
  if (found) {
    return found;
  }

  return null;
}

/**
 * Grants Google Drive permission to a user so they can read/write the master spreadsheet.
 */
export async function shareSpreadsheetWithUser(
  spreadsheetId: string,
  token?: string,
  email: string = '',
  role: 'writer' | 'reader' = 'writer'
): Promise<boolean> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`;
    const res = await googleFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: role === 'writer' ? 'writer' : 'reader',
        type: 'user',
        emailAddress: email.trim().toLowerCase()
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Drive Share Warning] Failed to share spreadsheet with ${email}:`, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Drive Share Warning] Exception sharing spreadsheet with ${email}:`, err);
    return false;
  }
}

// In-memory cache for schema validation to avoid redundant API hits within 30s
const verifiedSpreadsheets = new Map<string, number>();

/**
 * Robust Google API error handler. Extracts the exact error message from Google's response body.
 */
export async function handleGoogleApiError(res: Response, context?: string): Promise<never> {
  let detailMessage = `${res.status} ${res.statusText}`;
  try {
    const errorJson = await res.json();
    if (errorJson?.error?.message) {
      detailMessage = errorJson.error.message;
    } else if (errorJson?.message) {
      detailMessage = errorJson.message;
    }
  } catch {
    try {
      const text = await res.text();
      if (text) detailMessage = text.slice(0, 300);
    } catch {}
  }
  const prefix = context ? `${context}: ` : 'Google Sheets Error: ';
  throw new Error(`${prefix}${detailMessage}`);
}

/**
 * Verifies spreadsheet exists, inspects worksheet metadata, and automatically creates missing tabs & default headers.
 */
export async function ensureSpreadsheetSchema(spreadsheetId: string, token?: string, force = false): Promise<void> {
  const lastVerified = verifiedSpreadsheets.get(spreadsheetId);
  const now = Date.now();
  if (!force && lastVerified && now - lastVerified < 30000) {
    return;
  }

  // 1. Verify spreadsheet exists & read worksheet metadata
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const metaRes = await googleFetch(metaUrl);
  if (!metaRes.ok) {
    await handleGoogleApiError(metaRes, 'Failed to fetch spreadsheet metadata');
  }

  const meta = await metaRes.json();
  const existingSheets: { sheetId: number; title: string }[] = (meta.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title
  }));
  const existingTitles = new Set(existingSheets.map(s => s.title));

  // 2. Check required tabs
  const missingTabs = REQUIRED_SHEETS.filter(req => !existingTitles.has(req));
  const requests: any[] = [];

  // Special case: if spreadsheet only has "Sheet1" and missing Dashboard, rename Sheet1 to Dashboard
  if (existingSheets.length === 1 && existingSheets[0].title === 'Sheet1' && !existingTitles.has('Dashboard')) {
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: existingSheets[0].sheetId,
          title: 'Dashboard'
        },
        fields: 'title'
      }
    });
    existingTitles.add('Dashboard');
  }

  // 3. Automatically add missing tabs
  for (const tab of missingTabs) {
    if (tab === 'Dashboard' && existingTitles.has('Dashboard')) continue;
    requests.push({
      addSheet: {
        properties: { title: tab }
      }
    });
  }

  if (requests.length > 0) {
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const batchRes = await googleFetch(batchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    if (!batchRes.ok) {
      await handleGoogleApiError(batchRes, 'Failed to create missing worksheet tabs');
    }
  }

  // 4. Verify & Write initial headers for any newly created or missing tab headers
  const headerUpdates: { range: string; values: any[][] }[] = [];
  
  if (missingTabs.includes('Assets Database')) {
    headerUpdates.push({ range: 'Assets Database!A1:R1', values: [HEADERS['Assets Database']] });
  }
  if (missingTabs.includes('Shipment Tracker')) {
    headerUpdates.push({ range: 'Shipment Tracker!A1:AG1', values: [HEADERS['Shipment Tracker']] });
  }
  if (missingTabs.includes('Gate Pass')) {
    headerUpdates.push({ range: 'Gate Pass!A1:O1', values: [HEADERS['Gate Pass']] });
  }
  if (missingTabs.includes('Audit Trail')) {
    headerUpdates.push({ range: 'Audit Trail!A1:G1', values: [HEADERS['Audit Trail']] });
  }
  if (missingTabs.includes('Campaigns')) {
    headerUpdates.push({ range: 'Campaigns!A1:H1', values: [HEADERS['Campaigns']] });
  }
  if (missingTabs.includes('Admin')) {
    headerUpdates.push({ range: 'Admin!A1:G1', values: [['Email', 'Role', 'Status', 'Granted By', 'Granted On', 'Last Login', 'Last Updated']] });
    headerUpdates.push({ range: 'Admin!I1:M1', values: [['Timestamp', 'Action', 'Target Email', 'Performed By', 'Result']] });
  }
  if (missingTabs.includes('Owners')) {
    headerUpdates.push({ range: 'Owners!A1:C1', values: [HEADERS['Owners']] });
  }
  if (missingTabs.includes('Possessors')) {
    headerUpdates.push({ range: 'Possessors!A1:C1', values: [HEADERS['Possessors']] });
  }
  if (missingTabs.includes('Locations')) {
    headerUpdates.push({ range: 'Locations!A1:C1', values: [HEADERS['Locations']] });
  }

  if (headerUpdates.length > 0) {
    await writeBatchValues(spreadsheetId, token || '', headerUpdates);
  }

  verifiedSpreadsheets.set(spreadsheetId, now);
}

// 2. Create and provision a brand new spreadsheet with all sheets and headers
export async function createAndProvisionSpreadsheet(token?: string): Promise<SheetData> {
  // Create spreadsheet container
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createRes = await googleFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: DATABASE_NAME }
    })
  });

  if (!createRes.ok) {
    await handleGoogleApiError(createRes, 'Failed to create new spreadsheet');
  }
  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // We need to add the required sheets. The first sheet is already there (usually 'Sheet1').
  // We can rename 'Sheet1' to 'Dashboard' and add all other sheets.
  const firstSheetId = spreadsheet.sheets?.[0]?.properties?.sheetId || 0;
  
  const requests: any[] = [
    {
      updateSheetProperties: {
        properties: {
          sheetId: firstSheetId,
          title: 'Dashboard'
        },
        fields: 'title'
      }
    }
  ];

  // Add the remaining sheets
  REQUIRED_SHEETS.slice(1).forEach(title => {
    requests.push({
      addSheet: {
        properties: { title }
      }
    });
  });

  const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const batchRes = await googleFetch(batchUpdateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!batchRes.ok) {
    await handleGoogleApiError(batchRes, 'Failed to provision sheets');
  }

  // Populate Dashboard Sheet with clean welcome / overview information
  const welcomeValues = [
    ['InventoryOS spreadsheet Database — Connected'],
    [],
    ['Do not delete or rename worksheets! These are managed automatically by your InventoryOS App.'],
    [],
    ['Worksheet Name', 'Purpose', 'Record Count'],
    ['Dashboard', 'Instructions and database state overview', '1'],
    ['Assets Database', 'Master assets ledger with serial numbers and history', String(SAMPLE_ASSETS.length)],
    ['Gate Pass', 'Logistics gate passes generated', String(SAMPLE_GATE_PASSES.length)],
    ['Audit Trail', 'Change history log for serial tracking', String(SAMPLE_AUDIT.length)],
    ['Campaigns', 'Marketing and client campaign assignments', String(SAMPLE_CAMPAIGNS.length)],
    ['Owners', 'Asset owners lookup', String(SAMPLE_OWNERS.length)],
    ['Possessors', 'Staff members currently assigned assets', String(SAMPLE_POSSESSORS.length)],
    ['Locations', 'Operating locations and warehouses', String(SAMPLE_LOCATIONS.length)],
    ['Settings', 'Configuration variables', '0']
  ];

  // Pre-populate with Sample Data
  const updates = [
    { range: 'Dashboard!A1:C14', values: welcomeValues },
    { range: 'Assets Database!A1:R1', values: [HEADERS['Assets Database']] },
    { range: `Assets Database!A2:R${SAMPLE_ASSETS.length + 1}`, values: SAMPLE_ASSETS.map(mapAssetToRow) },
    { range: 'Shipment Tracker!A1:AG1', values: [HEADERS['Shipment Tracker']] },
    { range: `Shipment Tracker!A2:AG${SAMPLE_SHIPMENTS.length + 1}`, values: SAMPLE_SHIPMENTS.map(mapShipmentToRow) },
    { range: 'Gate Pass!A1:O1', values: [HEADERS['Gate Pass']] },
    { range: `Gate Pass!A2:O${SAMPLE_GATE_PASSES.length + 1}`, values: SAMPLE_GATE_PASSES.map(mapGatePassToRow) },
    { range: 'Audit Trail!A1:G1', values: [HEADERS['Audit Trail']] },
    { range: `Audit Trail!A2:G${SAMPLE_AUDIT.length + 1}`, values: SAMPLE_AUDIT.map(mapAuditToRow) },
    { range: 'Campaigns!A1:H1', values: [HEADERS['Campaigns']] },
    { range: `Campaigns!A2:H${SAMPLE_CAMPAIGNS.length + 1}`, values: SAMPLE_CAMPAIGNS.map(mapCampaignToRow) },
    { range: 'Owners!A1:C1', values: [HEADERS['Owners']] },
    { range: `Owners!A2:C${SAMPLE_OWNERS.length + 1}`, values: SAMPLE_OWNERS.map(o => [o.name, o.company, o.contact]) },
    { range: 'Possessors!A1:C1', values: [HEADERS['Possessors']] },
    { range: `Possessors!A2:C${SAMPLE_POSSESSORS.length + 1}`, values: SAMPLE_POSSESSORS.map(p => [p.name, p.role, p.department]) },
    { range: 'Locations!A1:C1', values: [HEADERS['Locations']] },
    { range: `Locations!A2:C${SAMPLE_LOCATIONS.length + 1}`, values: SAMPLE_LOCATIONS.map(l => [l.city, l.address, l.type]) },
    { range: 'Admin!A1:G1', values: [['Email', 'Role', 'Status', 'Granted By', 'Granted On', 'Last Login', 'Last Updated']] },
    { range: 'Admin!A2:G2', values: [['aditya@aftermathventures.in', 'Super Admin', 'Protected', 'System', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]]] },
    { range: 'Admin!I1:M1', values: [['Timestamp', 'Action', 'Target Email', 'Performed By', 'Result']] }
  ];

  await writeBatchValues(spreadsheetId, token || '', updates);
  verifiedSpreadsheets.set(spreadsheetId, Date.now());

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    assets: SAMPLE_ASSETS,
    shipments: SAMPLE_SHIPMENTS,
    gatePasses: SAMPLE_GATE_PASSES,
    auditLogs: SAMPLE_AUDIT,
    campaigns: SAMPLE_CAMPAIGNS,
    owners: SAMPLE_OWNERS,
    possessors: SAMPLE_POSSESSORS,
    locations: SAMPLE_LOCATIONS,
    admins: [
      { email: 'aditya@aftermathventures.in', role: 'Super Admin', status: 'Protected', grantedBy: 'System', grantedOn: new Date().toISOString().split('T')[0], lastLogin: new Date().toISOString().split('T')[0], lastUpdated: new Date().toISOString().split('T')[0] }
    ],
    adminLogs: []
  };
}

export interface ReadAdminRecordsResult {
  ok: boolean;
  admins: AdminUser[];
  error?: string;
  statusCode?: number;
}

/**
 * Direct loader for the master Admin authorization ledger.
 * Throws explicit descriptive errors if unavailable or empty.
 */
export async function loadAdminLedger(
  spreadsheetId: string,
  _token?: string
): Promise<AdminUser[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Admin!A1:G500')}`;

  const res = await googleFetch(url);

  if (!res.ok) {
    await handleGoogleApiError(
      res,
      'Failed to load InventoryOS authorization ledger'
    );
  }

  const result = await res.json();

  if (!result.values) {
    throw new Error(
      'InventoryOS authorization ledger is empty or unavailable.'
    );
  }

  const admins = parseRowsToAdmins(result.values);
  if (!admins || admins.length === 0) {
    throw new Error(
      'Authorization ledger could not be loaded from the master Google Sheet.'
    );
  }

  return admins;
}

/**
 * Step 1 of permission architecture: Read ONLY Admin!A:G from master Google Spreadsheet.
 * Does NOT touch any other worksheet.
 */
export async function readAdminRecordsOnly(
  spreadsheetId: string,
  token?: string
): Promise<ReadAdminRecordsResult> {
  try {
    const admins = await loadAdminLedger(spreadsheetId, token);
    return {
      ok: true,
      admins
    };
  } catch (err: any) {
    return {
      ok: false,
      admins: [],
      error: err.message || 'Network error occurred while connecting to Google Sheets Admin ledger.'
    };
  }
}

// 3. Load entire database from spreadsheet in batch with prior schema check (Super Admin mode)
export async function loadSpreadsheetData(spreadsheetId: string, token?: string): Promise<SheetData> {
  // Ensure schema exists before querying batch ranges to avoid "Unable to parse range"
  await ensureSpreadsheetSchema(spreadsheetId, token);
  return loadSpreadsheetDataReadOnly(spreadsheetId, token);
}

// 3b. Read-Only Database Loader for Admin Users (NEVER creates worksheets, NEVER writes headers, NEVER alters structure)
export async function loadSpreadsheetDataReadOnly(spreadsheetId: string, _token?: string): Promise<SheetData> {
  const ranges = [
    'Assets Database!A1:R2000',
    'Gate Pass!A1:O1000',
    'Audit Trail!A1:G3000',
    'Campaigns!A1:H500',
    'Owners!A1:C500',
    'Possessors!A1:C500',
    'Locations!A1:C500',
    'Admin!A1:G500',
    'Admin!I1:M1000',
    'Shipment Tracker!A1:AG2000'
  ];

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`;

  const res = await googleFetch(url);

  if (!res.ok) {
    await handleGoogleApiError(res, 'Google Sheets Error during batch data load');
  }
  const result = await res.json();
  const valueRanges = result.valueRanges || [];

  const assets = parseRowsToAssets(valueRanges[0]?.values || []);
  const gatePasses = parseRowsToGatePasses(valueRanges[1]?.values || []);
  const auditLogs = parseRowsToAudit(valueRanges[2]?.values || []);
  const campaigns = parseRowsToCampaigns(valueRanges[3]?.values || []);
  const owners = parseRowsToOwners(valueRanges[4]?.values || []);
  const possessors = parseRowsToPossessors(valueRanges[5]?.values || []);
  const locations = parseRowsToLocations(valueRanges[6]?.values || []);
  const admins = parseRowsToAdmins(valueRanges[7]?.values || []);
  const adminLogs = parseRowsToAdminLogs(valueRanges[8]?.values || []);
  const shipments = parseRowsToShipments(valueRanges[9]?.values || []);

  if (!admins || admins.length === 0) {
    throw new Error(
      'Authorization ledger could not be loaded from the master Google Sheet.'
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    assets,
    shipments: shipments.length > 0 ? shipments : SAMPLE_SHIPMENTS,
    gatePasses,
    auditLogs,
    campaigns,
    owners,
    possessors,
    locations,
    admins,
    adminLogs
  };
}

// 4. Master Full Database Sync Pipeline
export async function syncFullDatabase(
  spreadsheetId: string,
  token: string,
  data: {
    assets: Asset[];
    shipments: Shipment[];
    gatePasses: GatePass[];
    auditLogs: AuditEntry[];
    campaigns: Campaign[];
    admins: AdminUser[];
  }
): Promise<void> {
  // Step 1: Verify spreadsheet exists, read worksheet metadata, check required tabs, create missing tabs, verify headers
  await ensureSpreadsheetSchema(spreadsheetId, token);

  // Step 2: Sync Assets Database
  await saveAssetsSheet(spreadsheetId, token, data.assets);

  // Step 3: Sync Shipment Tracker
  await saveShipmentsSheet(spreadsheetId, token, data.shipments);

  // Step 4: Sync Gate Passes
  await saveGatePassesSheet(spreadsheetId, token, data.gatePasses);

  // Step 5: Sync Audit Trail
  await saveAuditLogsSheet(spreadsheetId, token, data.auditLogs);

  // Step 6: Sync Campaigns
  await saveCampaignsSheet(spreadsheetId, token, data.campaigns);

  // Step 7: Sync Admins
  await saveAdminsSheet(spreadsheetId, token, data.admins);
}

// Helper: Clear a specific range
async function clearRange(spreadsheetId: string, token: string, range: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  const res = await googleFetch(url, {
    method: 'POST'
  });
  if (!res.ok) {
    console.warn(`Clear range warning on "${range}":`, res.statusText);
  }
}

// Overwrite/save the entire Assets worksheet
export async function saveAssetsSheet(spreadsheetId: string, token: string, assets: Asset[]): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const values = assets.map(mapAssetToRow);
  const clearRangeName = `Assets Database!A2:R${Math.max(assets.length + 100, 200)}`;
  await clearRange(spreadsheetId, token, clearRangeName);
  await writeValues(spreadsheetId, token, `Assets Database!A1:R${assets.length + 1}`, [HEADERS['Assets Database'], ...values]);
}

// Save all Gate Passes
export async function saveGatePassesSheet(spreadsheetId: string, token: string, gatePasses: GatePass[]): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const values = gatePasses.map(mapGatePassToRow);
  const clearRangeName =
  `Gate Pass!A2:O${Math.max(gatePasses.length + 100, 200)}`;

await clearRange(
  spreadsheetId,
  token,
  clearRangeName
);

await writeValues(
  spreadsheetId,
  token,
  `Gate Pass!A1:O${gatePasses.length + 1}`,
  [HEADERS['Gate Pass'], ...values]
);
}

// Save all Audit Logs
export async function saveAuditLogsSheet(spreadsheetId: string, token: string, auditLogs: AuditEntry[]): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const values = auditLogs.map(mapAuditToRow);
  const clearRangeName = `Audit Trail!A2:G${Math.max(auditLogs.length + 100, 200)}`;
  await clearRange(spreadsheetId, token, clearRangeName);
  await writeValues(spreadsheetId, token, `Audit Trail!A1:G${auditLogs.length + 1}`, [HEADERS['Audit Trail'], ...values]);
}

// Append new Gate Pass
export async function appendGatePass(spreadsheetId: string, token: string, gp: GatePass): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const row = mapGatePassToRow(gp);
  const range = 'Gate Pass!A2';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  
  const res = await googleFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
  if (!res.ok) {
    await handleGoogleApiError(res, 'Google Sheets Error appending Gate Pass');
  }
}

// Append new Audit Entry
export async function appendAuditLog(spreadsheetId: string, token: string, log: AuditEntry): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const row = mapAuditToRow(log);
  const range = 'Audit Trail!A2';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  
  const res = await googleFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
  if (!res.ok) {
    await handleGoogleApiError(res, 'Google Sheets Error appending Audit Log');
  }
}

// Sync Campaigns
export async function saveCampaignsSheet(spreadsheetId: string, token: string, campaigns: Campaign[]): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const values = campaigns.map(mapCampaignToRow);
  await clearRange(spreadsheetId, token, 'Campaigns!A2:H500');
  await writeValues(spreadsheetId, token, `Campaigns!A1:H${campaigns.length + 1}`, [HEADERS['Campaigns'], ...values]);
}

// Bulk general batch writer
async function writeBatchValues(spreadsheetId: string, token: string, updates: { range: string, values: any[][] }[]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const data = {
    valueInputOption: 'USER_ENTERED',
    data: updates.map(u => ({ range: u.range, values: u.values }))
  };
  const res = await googleFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    await handleGoogleApiError(res, 'Google Sheets Error during batch update');
  }
}

async function writeValues(spreadsheetId: string, token: string, range: string, values: any[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await googleFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });
  if (!res.ok) {
    await handleGoogleApiError(res, `Google Sheets Error writing to range "${range}"`);
  }
}

// Mapping Utilities
function mapAssetToRow(a: Asset): any[] {
  return [
    a.assetId || '',
    a.serial || '',
    a.boxId || '',
    a.name || '',
    a.brand || '',
    a.desc || '',
    a.qty || 1,
    a.city || '',
    a.owner || '',
    a.possessor || '',
    a.campaign || '',
    a.status || '',
    a.receivedBy || '',
    a.receivedOn || '',
    a.shippingTo || '',
    a.shippingDate || '',
    a.createdDate || new Date().toISOString().split('T')[0],
    a.lastUpdated || new Date().toISOString().split('T')[0]
  ];
}

function mapGatePassToRow(g: GatePass): any[] {
  return [
    g.id || '',
    g.type || 'outbound',
    g.company || '',
    JSON.stringify(g.serials || []),
    g.origin || '',
    g.originAddress || '',
    g.dest || '',
    g.destAddress || '',
    g.shipDate || '',
    g.eta || '',
    g.receiver || '',
    g.possessor || '',
    g.newStatus || '',
    g.notes || '',
    g.createdDate || new Date().toISOString().split('T')[0]
  ];
}

function mapAuditToRow(l: AuditEntry): any[] {
  return [
    l.time || '',
    l.serial || '',
    l.field || '',
    l.from || '',
    l.to || '',
    l.by || '',
    l.note || ''
  ];
}

function mapCampaignToRow(c: Campaign): any[] {
  return [
    c.name || '',
    c.client || '',
    c.startDate || '',
    c.endDate || '',
    c.owner || '',
    c.budget || '',
    c.description || '',
    c.status || 'Active'
  ];
}

// Parser Utilities
function parseRowsToAssets(rows: any[][]): Asset[] {
  if (rows.length <= 1) return [];
  const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());

  // Helper to dynamically resolve column index by header names with fallback
  const getCol = (possibleNames: string[], defaultIdx: number): number => {
    for (const name of possibleNames) {
      const idx = headerRow.indexOf(name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return defaultIdx;
  };

  const hasBoxInHeader = headerRow.includes('box id') || headerRow.includes('box') || headerRow.includes('boxid');
  const is18ColFormat = hasBoxInHeader || (rows[1] && rows[1].length >= 18);

  const assetIdIdx = getCol(['asset id', 'assetid', 'id'], 0);
  const serialIdx = getCol(['serial number', 'serial', 'serial no', 'serialno', 'sn'], 1);
  const boxIdIdx = getCol(['box id', 'box', 'boxid', 'box no'], hasBoxInHeader ? headerRow.indexOf('box id') : -1);
  
  // When Box ID is present at index 2, standard 18-col indices apply
  const nameIdx = getCol(['item name', 'name', 'item', 'product'], is18ColFormat ? 3 : 2);
  const brandIdx = getCol(['brand', 'make', 'oem'], is18ColFormat ? 4 : 3);
  const descIdx = getCol(['description', 'desc', 'model', 'specs'], is18ColFormat ? 5 : 4);
  const qtyIdx = getCol(['quantity', 'qty', 'count', 'units'], is18ColFormat ? 6 : 5);
  const cityIdx = getCol(['location', 'city', 'warehouse', 'site', 'current location'], is18ColFormat ? 7 : 6);
  const ownerIdx = getCol(['owner', 'company', 'client'], is18ColFormat ? 8 : 7);
  const possessorIdx = getCol(['current possessor', 'possessor', 'custodian', 'holder', 'manager'], is18ColFormat ? 9 : 8);
  const campaignIdx = getCol(['campaign', 'event', 'project', 'activity'], is18ColFormat ? 10 : 9);
  const statusIdx = getCol(['status', 'state', 'asset status'], is18ColFormat ? 11 : 10);
  const receivedByIdx = getCol(['received by', 'receiver', 'accepted by'], is18ColFormat ? 12 : 11);
  const receivedOnIdx = getCol(['received on', 'received date', 'date received'], is18ColFormat ? 13 : 12);
  const shippingToIdx = getCol(['shipping to', 'destination', 'ship to', 'dispatched to'], is18ColFormat ? 14 : 13);
  const shippingDateIdx = getCol(['shipping date', 'ship date', 'dispatched date'], is18ColFormat ? 15 : 14);
  const createdDateIdx = getCol(['created date', 'created on', 'date added', 'created'], is18ColFormat ? 16 : 15);
  const lastUpdatedIdx = getCol(['last updated', 'updated on', 'last modified', 'updated'], is18ColFormat ? 17 : 16);

  const body = rows.slice(1);
  const rawAssets = body.map((r, i) => {
    const assetId = String(r[assetIdIdx] || '').trim();
    const serial = String(r[serialIdx] || '').trim();
    const boxId = boxIdIdx !== -1 && r[boxIdIdx] !== undefined ? String(r[boxIdIdx] || '').trim() : '';
    const name = String(r[nameIdx] || '').trim();
    const brand = String(r[brandIdx] || '').trim();
    const desc = String(r[descIdx] || '').trim();
    const qty = parseInt(String(r[qtyIdx] || '1')) || 1;
    const city = String(r[cityIdx] || '').trim();
    const owner = String(r[ownerIdx] || '').trim();
    const possessor = String(r[possessorIdx] || '').trim();
    const campaign = String(r[campaignIdx] || '').trim();
    const status = String(r[statusIdx] || '').trim();
    const receivedBy = String(r[receivedByIdx] || '').trim();
    const receivedOn = String(r[receivedOnIdx] || '').trim();
    const shippingTo = String(r[shippingToIdx] || '').trim();
    const shippingDate = String(r[shippingDateIdx] || '').trim();
    const createdDate = String(r[createdDateIdx] || '').trim();
    const lastUpdated = String(r[lastUpdatedIdx] || '').trim();

    return {
      sn: i + 1,
      assetId,
      serial,
      boxId,
      name: name || desc || brand || 'Item',
      brand,
      desc,
      qty,
      city,
      owner,
      possessor,
      campaign,
      status,
      receivedBy,
      receivedOn,
      shippingTo,
      shippingDate,
      createdDate,
      lastUpdated
    };
  }).filter(a => a.serial && (a.name || a.brand || a.desc));

  return expandAssetsWithQuantities(rawAssets);
}

function parseRowsToGatePasses(rows: any[][]): GatePass[] {
  if (rows.length <= 1) return [];
  const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
  
  const getCol = (possibleNames: string[], defaultIdx: number): number => {
    for (const name of possibleNames) {
      const idx = headerRow.indexOf(name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return defaultIdx;
  };

  const idIdx = getCol(['gate pass number', 'gate pass id', 'id', 'pass number'], 0);
  const typeIdx = getCol(['pass type', 'type'], 1);
  const companyIdx = getCol(['company', 'organization'], 2);
  const serialsIdx = getCol(['serials', 'serial numbers', 'asset serials'], 3);
  const originIdx = getCol(['origin', 'source', 'from'], 4);
  const originAddrIdx = getCol(['origin address', 'origin addr', 'from address'], 5);
  const destIdx = getCol(['destination', 'dest', 'to'], 6);
  const destAddrIdx = getCol(['destination address', 'dest addr', 'to address'], 7);
  const shipDateIdx = getCol(['shipping date', 'ship date', 'dispatch date'], 8);
  const etaIdx = getCol(['eta', 'expected arrival', 'expected delivery'], 9);
  const receiverIdx = getCol(['receiver', 'recipient', 'received by'], 10);
  const possessorIdx = getCol(['possessor after', 'possessor', 'custodian'], 11);
  const newStatusIdx = getCol(['new status', 'status'], 12);
  const notesIdx = getCol(['notes', 'remarks', 'description'], 13);
  const createdDateIdx = getCol(['created date', 'created on', 'date'], 14);

  const body = rows.slice(1);
  return body.map(r => {
    let serials: string[] = [];
    const rawSerials = r[serialsIdx];
    try {
      const parsed = JSON.parse(rawSerials || '[]');
      serials = Array.isArray(parsed) ? parsed : [];
    } catch {
      serials = rawSerials ? String(rawSerials).split(',').map(s => s.trim()) : [];
    }

    return {
      id: String(r[idIdx] || '').trim(),
      type: (String(r[typeIdx] || '').toLowerCase() === 'inbound' ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
      company: String(r[companyIdx] || '').trim(),
      serials,
      origin: String(r[originIdx] || '').trim(),
      originAddress: String(r[originAddrIdx] || '').trim(),
      dest: String(r[destIdx] || '').trim(),
      destAddress: String(r[destAddrIdx] || '').trim(),
      shipDate: String(r[shipDateIdx] || '').trim(),
      eta: String(r[etaIdx] || '').trim(),
      receiver: String(r[receiverIdx] || '').trim(),
      possessor: String(r[possessorIdx] || '').trim(),
      newStatus: String(r[newStatusIdx] || '').trim(),
      notes: String(r[notesIdx] || '').trim(),
      createdDate: String(r[createdDateIdx] || '').trim()
    };
  }).filter(g => g.id);
}

function parseRowsToAudit(rows: any[][]): AuditEntry[] {
  if (rows.length <= 1) return [];
  const body = rows.slice(1);
  return body.map(r => ({
    time: String(r[0] || ''),
    serial: String(r[1] || ''),
    field: String(r[2] || ''),
    from: String(r[3] || ''),
    to: String(r[4] || ''),
    by: String(r[5] || ''),
    note: String(r[6] || '')
  })).filter(l => l.serial);
}

function parseRowsToCampaigns(rows: any[][]): Campaign[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    name: String(r[0] || ''),
    client: String(r[1] || ''),
    startDate: String(r[2] || ''),
    endDate: String(r[3] || ''),
    owner: String(r[4] || ''),
    budget: String(r[5] || ''),
    description: String(r[6] || ''),
    status: String(r[7] || 'Active')
  })).filter(c => c.name);
}

function parseRowsToOwners(rows: any[][]): Owner[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    name: String(r[0] || ''),
    company: String(r[1] || ''),
    contact: String(r[2] || '')
  })).filter(o => o.name);
}

function parseRowsToPossessors(rows: any[][]): Possessor[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    name: String(r[0] || ''),
    role: String(r[1] || ''),
    department: String(r[2] || '')
  })).filter(p => p.name);
}

function parseRowsToLocations(rows: any[][]): LocationInfo[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    city: String(r[0] || ''),
    address: String(r[1] || ''),
    type: String(r[2] || '')
  })).filter(l => l.city);
}

export function parseRowsToAdmins(rows: any[][]): AdminUser[] {
  if (!rows || rows.length === 0) return [];
  
  // Detect if first row is header
  const firstRowFirstCell = String(rows[0]?.[0] || '').trim().toLowerCase();
  const isHeaderFirst = firstRowFirstCell === 'email' || firstRowFirstCell === 'user email';
  const dataRows = isHeaderFirst ? rows.slice(1) : rows;
  const header = (isHeaderFirst ? rows[0] : []).map(h => String(h || '').trim().toLowerCase());
  const hasStatus = header.includes('status');

  const seen = new Set<string>();
  const parsedList: AdminUser[] = [];

  for (const r of dataRows) {
    const rawEmail = String(r[0] || '').trim();
    const cleanEmail = rawEmail.toLowerCase();
    if (!cleanEmail || cleanEmail === 'email' || !cleanEmail.includes('@')) continue;
    if (seen.has(cleanEmail)) continue;
    seen.add(cleanEmail);

    const isPrimary = cleanEmail === 'aditya@aftermathventures.in';
    const rawRole = String(r[1] || '').trim().toLowerCase();
    const role: 'SUPER_ADMIN' | 'ADMIN' = (isPrimary || rawRole.includes('super')) ? 'SUPER_ADMIN' : 'ADMIN';
    
    // Check if status exists in 3rd column or based on header
    let status: 'Active' | 'Revoked' | 'Protected' = isPrimary ? 'Protected' : 'Active';
    if (hasStatus || r.length >= 3) {
      const rawStatus = String(r[2] || '').trim().toLowerCase();
      if (rawStatus === 'revoked') {
        status = 'Revoked';
      } else if (rawStatus === 'protected' || isPrimary) {
        status = 'Protected';
      } else {
        status = 'Active';
      }
    }

    parsedList.push({
      email: rawEmail,
      role,
      status,
      grantedBy: String(r[3] || (isPrimary ? 'System' : 'Super Admin')).trim(),
      grantedOn: String(r[4] || '2026-08-14').trim(),
      lastLogin: r[5] ? String(r[5]).trim() : undefined,
      lastUpdated: r[6] ? String(r[6]).trim() : undefined
    });
  }

  // Ensure Primary Super Admin is always present
  if (!seen.has('aditya@aftermathventures.in')) {
    parsedList.unshift({
      email: 'aditya@aftermathventures.in',
      role: 'SUPER_ADMIN',
      status: 'Protected',
      grantedBy: 'System',
      grantedOn: '2026-08-14',
      lastLogin: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    });
  }

  return parsedList;
}

function parseRowsToAdminLogs(rows: any[][]): AdminLog[] {
  if (!rows || rows.length === 0) return [];
  const firstRowFirstCell = String(rows[0]?.[0] || '').trim().toLowerCase();
  const isHeaderFirst = firstRowFirstCell === 'timestamp' || firstRowFirstCell === 'time';
  const dataRows = isHeaderFirst ? rows.slice(1) : rows;

  return dataRows.map(r => ({
    timestamp: String(r[0] || '').trim(),
    action: String(r[1] || '').trim(),
    targetEmail: String(r[2] || '').trim(),
    performedBy: String(r[3] || '').trim(),
    result: String(r[4] || 'Success').trim()
  })).filter(l => l.timestamp && l.timestamp.toLowerCase() !== 'timestamp');
}

export function mapShipmentToRow(s: Shipment): any[] {
  return [
    s.id || '',
    s.gatePassId || '',
    s.status || 'Draft',
    s.type || 'Campaign Dispatch',
    s.priority || 'Medium',
    s.origin || '',
    s.destination || '',
    s.currentLocation || '',
    s.campaign || '',
    s.courier || '',
    s.trackingNumber || '',
    s.vehicleNumber || '',
    s.driverName || '',
    s.driverContact || '',
    s.dispatchDate || '',
    s.expectedDeliveryDate || '',
    s.actualDeliveryDate || '',
    s.sender || '',
    s.receiver || '',
    s.receiverContact || '',
    s.currentPossessor || '',
    s.totalAssets || 0,
    s.deliveredAssetsCount || 0,
    s.pendingAssetsCount || 0,
    s.returnedAssetsCount || 0,
    s.shippingCost || 0,
    s.insurance || '',
    s.packageWeight || '',
    s.boxesCount || 1,
    s.remarks || '',
    s.lastUpdated || new Date().toISOString(),
    JSON.stringify(s.assets || []),
    JSON.stringify(s.timeline || [])
  ];
}

export function parseRowsToShipments(rows: any[][]): Shipment[] {
  if (!rows || rows.length <= 1) return [];
  const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());

  const getCol = (possibleNames: string[], defaultIdx: number): number => {
    for (const name of possibleNames) {
      const idx = headerRow.indexOf(name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return defaultIdx;
  };

  const idIdx = getCol(['shipment id', 'id', 'shipment number'], 0);
  const gatePassIdIdx = getCol(['gate pass id', 'gate pass number', 'gp id'], 1);
  const statusIdx = getCol(['status', 'shipment status'], 2);
  const typeIdx = getCol(['shipment type', 'type'], 3);
  const priorityIdx = getCol(['priority'], 4);
  const originIdx = getCol(['origin', 'source', 'from'], 5);
  const destinationIdx = getCol(['destination', 'dest', 'to'], 6);
  const currentLocIdx = getCol(['current location', 'location'], 7);
  const campaignIdx = getCol(['campaign', 'event', 'project'], 8);
  const courierIdx = getCol(['courier', 'transporter', 'carrier'], 9);
  const trackingNumberIdx = getCol(['tracking number', 'tracking no', 'awb'], 10);
  const vehicleNumberIdx = getCol(['vehicle number', 'vehicle no', 'truck no'], 11);
  const driverNameIdx = getCol(['driver name', 'driver'], 12);
  const driverContactIdx = getCol(['driver contact', 'driver phone'], 13);
  const dispatchDateIdx = getCol(['dispatch date', 'shipping date', 'dispatched on'], 14);
  const expectedDeliveryDateIdx = getCol(['expected delivery', 'eta', 'expected delivery date'], 15);
  const actualDeliveryDateIdx = getCol(['actual delivery', 'delivery date', 'delivered on'], 16);
  const senderIdx = getCol(['sender', 'dispatched by'], 17);
  const receiverIdx = getCol(['receiver', 'received by', 'recipient'], 18);
  const receiverContactIdx = getCol(['receiver contact', 'recipient contact', 'phone'], 19);
  const currentPossessorIdx = getCol(['possessor', 'current possessor', 'custodian'], 20);
  const totalAssetsIdx = getCol(['total assets', 'asset count', 'assets count'], 21);
  const deliveredAssetsIdx = getCol(['delivered assets', 'delivered count'], 22);
  const pendingAssetsIdx = getCol(['pending assets', 'pending count'], 23);
  const returnedAssetsIdx = getCol(['returned assets', 'returned count'], 24);
  const shippingCostIdx = getCol(['shipping cost', 'cost', 'freight charges'], 25);
  const insuranceIdx = getCol(['insurance', 'insurance details'], 26);
  const packageWeightIdx = getCol(['weight', 'package weight'], 27);
  const boxesCountIdx = getCol(['boxes', 'boxes count', 'box count'], 28);
  const remarksIdx = getCol(['remarks', 'notes', 'comments'], 29);
  const lastUpdatedIdx = getCol(['last updated', 'updated on'], 30);
  const assetsJsonIdx = getCol(['assets json', 'assets', 'items json'], 31);
  const timelineJsonIdx = getCol(['timeline json', 'timeline', 'events json'], 32);

  const body = rows.slice(1);
  return body.map(r => {
    let assets: any[] = [];
    let timeline: any[] = [];
    try {
      assets = JSON.parse(r[assetsJsonIdx] || '[]');
    } catch {
      assets = [];
    }
    try {
      timeline = JSON.parse(r[timelineJsonIdx] || '[]');
    } catch {
      timeline = [];
    }
    return {
      id: String(r[idIdx] || '').trim(),
      gatePassId: String(r[gatePassIdIdx] || '').trim(),
      status: (r[statusIdx] || 'In Transit') as any,
      type: String(r[typeIdx] || 'Campaign Dispatch').trim(),
      priority: (r[priorityIdx] || 'Medium') as any,
      origin: String(r[originIdx] || '').trim(),
      destination: String(r[destinationIdx] || '').trim(),
      currentLocation: String(r[currentLocIdx] || '').trim(),
      campaign: String(r[campaignIdx] || '').trim(),
      event: String(r[campaignIdx] || 'Campaign Event').trim(),
      courier: String(r[courierIdx] || '').trim(),
      trackingNumber: String(r[trackingNumberIdx] || '').trim(),
      vehicleNumber: String(r[vehicleNumberIdx] || '').trim(),
      driverName: String(r[driverNameIdx] || '').trim(),
      driverContact: String(r[driverContactIdx] || '').trim(),
      dispatchDate: String(r[dispatchDateIdx] || '').trim(),
      expectedDeliveryDate: String(r[expectedDeliveryDateIdx] || '').trim(),
      actualDeliveryDate: String(r[actualDeliveryDateIdx] || '').trim(),
      sender: String(r[senderIdx] || '').trim(),
      receiver: String(r[receiverIdx] || '').trim(),
      receiverContact: String(r[receiverContactIdx] || '').trim(),
      currentPossessor: String(r[currentPossessorIdx] || '').trim(),
      shipmentOwner: String(r[currentPossessorIdx] || 'AFMV').trim(),
      totalAssets: parseInt(String(r[totalAssetsIdx] || '0')) || 0,
      deliveredAssetsCount: parseInt(String(r[deliveredAssetsIdx] || '0')) || 0,
      pendingAssetsCount: parseInt(String(r[pendingAssetsIdx] || '0')) || 0,
      returnedAssetsCount: parseInt(String(r[returnedAssetsIdx] || '0')) || 0,
      shippingCost: parseFloat(String(r[shippingCostIdx] || '0')) || 0,
      insurance: String(r[insuranceIdx] || '').trim(),
      packageWeight: String(r[packageWeightIdx] || '').trim(),
      boxesCount: parseInt(String(r[boxesCountIdx] || '1')) || 1,
      remarks: String(r[remarksIdx] || '').trim(),
      lastUpdated: String(r[lastUpdatedIdx] || '').trim(),
      assets,
      timeline,
      createdDate: String(r[dispatchDateIdx] || new Date().toISOString().split('T')[0]).trim()
    };
  }).filter(s => s.id);
}

export async function saveShipmentsSheet(spreadsheetId: string, token: string, shipments: Shipment[]): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);
  const values = shipments.map(mapShipmentToRow);
  const clearRangeName = `Shipment Tracker!A2:AG${Math.max(shipments.length + 100, 200)}`;
  await clearRange(spreadsheetId, token, clearRangeName);
  await writeValues(spreadsheetId, token, `Shipment Tracker!A1:AG${shipments.length + 1}`, [HEADERS['Shipment Tracker'], ...values]);
}

// Format and organize the Admin worksheet with professional Google Sheets styling, freezing, column widths, and rogue data cleanup
export async function formatAndOrganizeAdminSheet(
  spreadsheetId: string, 
  token: string, 
  admins: AdminUser[],
  adminLogs?: AdminLog[]
): Promise<void> {
  await ensureSpreadsheetSchema(spreadsheetId, token);

  // 1. Fetch spreadsheet metadata to get the sheetId of the Admin tab
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`;
  const metaRes = await googleFetch(metaUrl);
  if (!metaRes.ok) {
    await handleGoogleApiError(metaRes, 'Failed to inspect Admin sheet properties');
  }
  const meta = await metaRes.json();
  const adminSheetObj = (meta.sheets || []).find((s: any) => s.properties?.title === 'Admin');
  const adminSheetId: number = adminSheetObj?.properties?.sheetId ?? 0;

  // 2. Deduplicate and normalize admins list
  const seen = new Set<string>();
  const normalizedAdmins: AdminUser[] = [];

  // Primary Super Admin is always first & protected
  normalizedAdmins.push({
    email: 'aditya@aftermathventures.in',
    role: 'SUPER_ADMIN',
    status: 'Protected',
    grantedBy: 'System',
    grantedOn: '2026-08-14',
    lastLogin: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0]
  });
  seen.add('aditya@aftermathventures.in');

  for (const a of admins) {
    const cleanEmail = (a.email || '').trim().toLowerCase();
    if (!cleanEmail || seen.has(cleanEmail)) continue;
    seen.add(cleanEmail);

    const isSuper = (a.role || '').toUpperCase().includes('SUPER');
    normalizedAdmins.push({
      email: a.email.trim(),
      role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
      status: a.status === 'Revoked' ? 'Revoked' : 'Active',
      grantedBy: a.grantedBy || 'Super Admin',
      grantedOn: a.grantedOn || new Date().toISOString().split('T')[0],
      lastLogin: a.lastLogin || '',
      lastUpdated: a.lastUpdated || new Date().toISOString().split('T')[0]
    });
  }

  // 3. Prepare admin rows
  const adminHeaders = ['Email', 'Role', 'Status', 'Granted By', 'Granted On', 'Last Login', 'Last Updated'];
  const adminValues = normalizedAdmins.map(a => [
    a.email,
    a.role,
    a.status,
    a.grantedBy,
    a.grantedOn,
    a.lastLogin || '—',
    a.lastUpdated || '—'
  ]);

  // 4. Prepare logs rows
  let logsToWrite: AdminLog[] = adminLogs || [];
  if (!adminLogs || adminLogs.length === 0) {
    try {
      const logsRes = await googleFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Admin!I2:M200')}`
      );
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.values && Array.isArray(logsData.values)) {
          logsToWrite = parseRowsToAdminLogs(logsData.values);
        }
      }
    } catch {}
  }

  const logHeaders = ['Timestamp', 'Action', 'Target Email', 'Performed By', 'Result'];
  const logValues = logsToWrite.map(l => [
    l.timestamp,
    l.action,
    l.targetEmail,
    l.performedBy,
    l.result || 'Success'
  ]);

  // 5. Clean out all dirty/orphaned cells across columns A to Z
  await clearRange(spreadsheetId, token, 'Admin!A2:Z500');

  // 6. Write cleanly organized tables
  const updates: { range: string; values: any[][] }[] = [
    { range: `Admin!A1:G${adminValues.length + 1}`, values: [adminHeaders, ...adminValues] },
    { range: `Admin!I1:M${Math.max(logValues.length + 1, 2)}`, values: [logHeaders, ...(logValues.length > 0 ? logValues : [['—', 'No security events recorded yet', '—', '—', '—']])] }
  ];
  await writeBatchValues(spreadsheetId, token, updates);

  // 7. Apply Google Sheets native styling via batchUpdate
  const colWidths = [
    { col: 0, width: 280 }, // A: Email
    { col: 1, width: 140 }, // B: Role
    { col: 2, width: 120 }, // C: Status
    { col: 3, width: 240 }, // D: Granted By
    { col: 4, width: 120 }, // E: Granted On
    { col: 5, width: 130 }, // F: Last Login
    { col: 6, width: 130 }, // G: Last Updated
    { col: 7, width: 40 },  // H: Separator
    { col: 8, width: 180 }, // I: Timestamp
    { col: 9, width: 220 }, // J: Action
    { col: 10, width: 240 },// K: Target Email
    { col: 11, width: 240 },// L: Performed By
    { col: 12, width: 110 } // M: Result
  ];

  const requests: any[] = [
    // Freeze header row 1
    {
      updateSheetProperties: {
        properties: {
          sheetId: adminSheetId,
          gridProperties: {
            frozenRowCount: 1
          }
        },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    // Set Header row height
    {
      updateDimensionProperties: {
        range: {
          sheetId: adminSheetId,
          dimension: 'ROWS',
          startIndex: 0,
          endIndex: 1
        },
        properties: { pixelSize: 38 },
        fields: 'pixelSize'
      }
    }
  ];

  // Set column widths
  for (const { col, width } of colWidths) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: adminSheetId,
          dimension: 'COLUMNS',
          startIndex: col,
          endIndex: col + 1
        },
        properties: { pixelSize: width },
        fields: 'pixelSize'
      }
    });
  }

  // Format Header A1:G1 (Dark Navy Slate)
  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 7
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.118, green: 0.161, blue: 0.231 },
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
          verticalAlignment: 'MIDDLE',
          horizontalAlignment: 'LEFT'
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment)'
    }
  });

  // Format Header I1:M1 (Deep Slate)
  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 8,
        endColumnIndex: 13
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.2, green: 0.255, blue: 0.333 },
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
          verticalAlignment: 'MIDDLE',
          horizontalAlignment: 'LEFT'
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment)'
    }
  });

  // Format Separator Column H (light neutral divider)
  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 0,
        endRowIndex: 500,
        startColumnIndex: 7,
        endColumnIndex: 8
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.965, green: 0.973, blue: 0.98 }
        }
      },
      fields: 'userEnteredFormat.backgroundColor'
    }
  });

  // Format Admin Data Rows (A2:G50)
  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 1,
        endRowIndex: Math.max(adminValues.length + 1, 20),
        startColumnIndex: 0,
        endColumnIndex: 7
      },
      cell: {
        userEnteredFormat: {
          verticalAlignment: 'MIDDLE',
          wrapStrategy: 'CLIP',
          textFormat: { fontSize: 10 }
        }
      },
      fields: 'userEnteredFormat(verticalAlignment,wrapStrategy,textFormat)'
    }
  });

  // Format Log Data Rows (I2:M50)
  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 1,
        endRowIndex: Math.max(logValues.length + 1, 20),
        startColumnIndex: 8,
        endColumnIndex: 13
      },
      cell: {
        userEnteredFormat: {
          verticalAlignment: 'MIDDLE',
          wrapStrategy: 'CLIP',
          textFormat: { fontSize: 10 }
        }
      },
      fields: 'userEnteredFormat(verticalAlignment,wrapStrategy,textFormat)'
    }
  });

  // Center align specific columns in Admin table (Role, Status, Dates)
  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 1,
        endRowIndex: Math.max(adminValues.length + 1, 20),
        startColumnIndex: 1,
        endColumnIndex: 3
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: 'CENTER'
        }
      },
      fields: 'userEnteredFormat.horizontalAlignment'
    }
  });

  requests.push({
    repeatCell: {
      range: {
        sheetId: adminSheetId,
        startRowIndex: 1,
        endRowIndex: Math.max(adminValues.length + 1, 20),
        startColumnIndex: 4,
        endColumnIndex: 7
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: 'CENTER'
        }
      },
      fields: 'userEnteredFormat.horizontalAlignment'
    }
  });

  // Execute batchUpdate
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const batchRes = await googleFetch(batchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!batchRes.ok) {
    console.warn('Google Sheets notice: styling batchUpdate warning:', batchRes.statusText);
  }
}

// Save entire Admins list with complete formatting and rogue cell cleanup
export async function saveAdminsSheet(
  spreadsheetId: string, 
  token: string, 
  admins: AdminUser[],
  adminLogs?: AdminLog[]
): Promise<void> {
  await formatAndOrganizeAdminSheet(spreadsheetId, token, admins, adminLogs);
}

// Append an admin activity log strictly to Columns I:M without touching Column A
export async function appendAdminLog(spreadsheetId: string, token: string, log: AdminLog): Promise<void> {
  try {
    await ensureSpreadsheetSchema(spreadsheetId, token);
    
    // Read current logs in Column I to calculate the next empty row
    const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Admin!I1:I500')}`;
    const checkRes = await googleFetch(checkUrl);
    let nextRow = 2;
    if (checkRes.ok) {
      const data = await checkRes.json();
      nextRow = (data.values?.length || 1) + 1;
    }

    const row = [log.timestamp, log.action, log.targetEmail, log.performedBy, log.result || 'Success'];
    const targetRange = `Admin!I${nextRow}:M${nextRow}`;
    await writeValues(spreadsheetId, token, targetRange, [row]);
  } catch (err) {
    console.warn('Google Sheets notice: Admin log write warning:', err);
  }
}

export function getSampleSheetData(): SheetData {
  return {
    spreadsheetId: 'SAMPLE_SPREADSHEET_ID',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/SAMPLE_SPREADSHEET_ID',
    assets: expandAssetsWithQuantities(SAMPLE_ASSETS),
    shipments: SAMPLE_SHIPMENTS,
    gatePasses: SAMPLE_GATE_PASSES,
    auditLogs: SAMPLE_AUDIT,
    campaigns: SAMPLE_CAMPAIGNS,
    owners: SAMPLE_OWNERS,
    possessors: SAMPLE_POSSESSORS,
    locations: SAMPLE_LOCATIONS,
    admins: [
      { 
        email: 'aditya@aftermathventures.in', 
        role: 'Super Admin', 
        status: 'Protected',
        grantedBy: 'System', 
        grantedOn: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    ],
    adminLogs: []
  };
}
