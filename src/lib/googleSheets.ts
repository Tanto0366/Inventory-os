import { Asset, GatePass, AuditEntry, Campaign, Owner, Possessor, LocationInfo, AdminUser, AdminLog, Shipment } from '../types';

const DATABASE_NAME = 'InventoryOS_Database';

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
    'Asset ID', 'Serial Number', 'Box ID', 'Item Name', 'Brand', 'Model', 'Description', 
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
    'Gate Pass Number', 'Pass Type', 'Company', 'Serials', 'Origin', 'Destination', 
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
  { id: 'GP-001', type: 'outbound', company: 'AFMV Logistics Pvt. Ltd.', serials: ['PF48LND0', 'PF4954J4'], origin: 'Mumbai', dest: 'Practice Office Delhi', shipDate: '2026-01-09', eta: '2026-02-09', receiver: 'Karan', possessor: 'Karan', newStatus: 'In Transit', notes: 'Lenovo AP Yoga campaign delivery', createdDate: '2026-01-09' },
  { id: 'GP-002', type: 'outbound', company: 'AFMV Logistics Pvt. Ltd.', serials: ['5CG5214PHW', '5CG5214PHJ', '5CG5214PJS', '5CD5305K7Z'], origin: 'Kochi', dest: 'Gurgaon - Nodwin office', shipDate: '2026-01-28', eta: '2026-02-01', receiver: 'Aditya', possessor: 'Aditya', newStatus: 'Delivered', notes: 'OMEN Red.Gaming event', createdDate: '2026-01-28' },
  { id: 'GP-003', type: 'inbound', company: 'AFMV Logistics Pvt. Ltd.', serials: ['HP-MULTI-6'], origin: 'Chennai', dest: 'Bangalore', shipDate: '2026-01-08', eta: '2026-01-12', receiver: 'Nikhil', possessor: 'Nikhil', newStatus: 'In House', notes: 'Return from Redington Store Activity', createdDate: '2026-01-12' }
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

// 1. Search for existing spreadsheet in user's Drive
export async function findSpreadsheet(token: string): Promise<string | null> {
  const query = `name = '${DATABASE_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to search Drive');
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  } catch (e) {
    console.warn('Network issue or unauthorized when finding spreadsheet:', e);
  }
  return null;
}

// 2. Create and provision a brand new spreadsheet with all sheets and headers
export async function createAndProvisionSpreadsheet(token: string): Promise<SheetData> {
  // Create spreadsheet container
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: DATABASE_NAME }
    })
  });

  if (!createRes.ok) throw new Error('Failed to create new spreadsheet');
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
  const batchRes = await fetch(batchUpdateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!batchRes.ok) throw new Error('Failed to provision sheets');

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
    { range: 'Gate Pass!A1:M1', values: [HEADERS['Gate Pass']] },
    { range: `Gate Pass!A2:M${SAMPLE_GATE_PASSES.length + 1}`, values: SAMPLE_GATE_PASSES.map(mapGatePassToRow) },
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
    { range: 'Admin!A1:D1', values: [['Email', 'Role', 'Granted By', 'Granted On']] },
    { range: 'Admin!A2:D2', values: [['aditya@aftermathventures.in', 'Super Admin', 'System', new Date().toISOString().split('T')[0]]] },
    { range: 'Admin!F1:I1', values: [['Timestamp', 'Action', 'Target Email', 'Performed By']] }
  ];

  await writeBatchValues(spreadsheetId, token, updates);

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
      { email: 'aditya@aftermathventures.in', role: 'Super Admin', grantedBy: 'System', grantedOn: new Date().toISOString().split('T')[0] }
    ],
    adminLogs: []
  };
}

// 3. Load entire database from spreadsheet in batch
export async function loadSpreadsheetData(spreadsheetId: string, token: string): Promise<SheetData> {
  const ranges = [
    'Assets Database!A1:R2000',
    'Gate Pass!A1:M1000',
    'Audit Trail!A1:G3000',
    'Campaigns!A1:H500',
    'Owners!A1:C500',
    'Possessors!A1:C500',
    'Locations!A1:C500',
    'Admin!A1:D500',
    'Admin!F1:I1000',
    'Shipment Tracker!A1:AG2000'
  ];

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('Failed to batch load spreadsheet sheets');
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

// 4. Overwrite/save the entire Assets worksheet or append
export async function saveAssetsSheet(spreadsheetId: string, token: string, assets: Asset[]): Promise<void> {
  // Overwrite entire A2:R range to match the updated state
  const values = assets.map(mapAssetToRow);
  
  // We first clear any potential old values, or overwrite with full array.
  // Overwriting A2:R with values
  const range = `Assets Database!A2:R${assets.length + 100}`; // buffer clear
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  const writeRange = `Assets Database!A2:R${assets.length + 1}`;
  await writeValues(spreadsheetId, token, writeRange, values);
}

// 5. Append new Gate Pass
export async function appendGatePass(spreadsheetId: string, token: string, gp: GatePass): Promise<void> {
  const row = mapGatePassToRow(gp);
  const range = 'Gate Pass!A2';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
}

// 6. Append new Audit Entry
export async function appendAuditLog(spreadsheetId: string, token: string, log: AuditEntry): Promise<void> {
  const row = mapAuditToRow(log);
  const range = 'Audit Trail!A2';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
}

// 7. Sync Campaigns, Owners, Possessors, Locations
export async function saveCampaignsSheet(spreadsheetId: string, token: string, campaigns: Campaign[]): Promise<void> {
  const values = campaigns.map(mapCampaignToRow);
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Campaigns!A2:H200:clear`;
  await fetch(clearUrl, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  await writeValues(spreadsheetId, token, `Campaigns!A2:H${campaigns.length + 1}`, values);
}

// Bulk general batch writer
async function writeBatchValues(spreadsheetId: string, token: string, updates: { range: string, values: any[][] }[]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const data = {
    valueInputOption: 'USER_ENTERED',
    data: updates.map(u => ({ range: u.range, values: u.values }))
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed batch update sheet');
}

async function writeValues(spreadsheetId: string, token: string, range: string, values: any[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });
  if (!res.ok) throw new Error(`Failed to write values to range ${range}`);
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
    g.dest || '',
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
  const boxIdIdx = headerRow.indexOf('box id');

  const body = rows.slice(1);
  return body.map((r, i) => {
    // Check if column 2 is boxId or if boxId exists
    const hasBoxHeader = boxIdIdx !== -1;
    let boxId = '';
    let name = '';
    let brand = '';
    let desc = '';
    let qty = 1;
    let city = '';
    let owner = '';
    let possessor = '';
    let campaign = '';
    let status = '';
    let receivedBy = '';
    let receivedOn = '';
    let shippingTo = '';
    let shippingDate = '';
    let createdDate = '';
    let lastUpdated = '';

    if (hasBoxHeader) {
      boxId = String(r[boxIdIdx] || '');
      name = String(r[2] || '');
      brand = String(r[3] || '');
      desc = String(r[4] || '');
      qty = parseInt(r[5]) || 1;
      city = String(r[6] || '');
      owner = String(r[7] || '');
      possessor = String(r[8] || '');
      campaign = String(r[9] || '');
      status = String(r[10] || '');
      receivedBy = String(r[11] || '');
      receivedOn = String(r[12] || '');
      shippingTo = String(r[13] || '');
      shippingDate = String(r[14] || '');
      createdDate = String(r[15] || '');
      lastUpdated = String(r[16] || '');
    } else if (r.length >= 18) {
      // 18+ columns means Box ID is inserted at index 2
      boxId = String(r[2] || '');
      name = String(r[3] || '');
      brand = String(r[4] || '');
      desc = String(r[5] || '');
      qty = parseInt(r[6]) || 1;
      city = String(r[7] || '');
      owner = String(r[8] || '');
      possessor = String(r[9] || '');
      campaign = String(r[10] || '');
      status = String(r[11] || '');
      receivedBy = String(r[12] || '');
      receivedOn = String(r[13] || '');
      shippingTo = String(r[14] || '');
      shippingDate = String(r[15] || '');
      createdDate = String(r[16] || '');
      lastUpdated = String(r[17] || '');
    } else {
      // Legacy format without Box ID
      boxId = '';
      name = String(r[2] || '');
      brand = String(r[3] || '');
      desc = String(r[4] || '');
      qty = parseInt(r[5]) || 1;
      city = String(r[6] || '');
      owner = String(r[7] || '');
      possessor = String(r[8] || '');
      campaign = String(r[9] || '');
      status = String(r[10] || '');
      receivedBy = String(r[11] || '');
      receivedOn = String(r[12] || '');
      shippingTo = String(r[13] || '');
      shippingDate = String(r[14] || '');
      createdDate = String(r[15] || '');
      lastUpdated = String(r[16] || '');
    }

    return {
      sn: i + 1,
      assetId: String(r[0] || ''),
      serial: String(r[1] || ''),
      boxId,
      name,
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
  }).filter(a => a.serial && a.name);
}

function parseRowsToGatePasses(rows: any[][]): GatePass[] {
  if (rows.length <= 1) return [];
  const body = rows.slice(1);
  return body.map(r => {
    let serials: string[] = [];
    try {
      const parsed = JSON.parse(r[3] || '[]');
      serials = Array.isArray(parsed) ? parsed : [];
    } catch {
      serials = r[3] ? String(r[3]).split(',').map(s => s.trim()) : [];
    }
    return {
      id: String(r[0] || ''),
      type: (r[1] === 'inbound' ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
      company: String(r[2] || ''),
      serials,
      origin: String(r[4] || ''),
      dest: String(r[5] || ''),
      shipDate: String(r[6] || ''),
      eta: String(r[7] || ''),
      receiver: String(r[8] || ''),
      possessor: String(r[9] || ''),
      newStatus: String(r[10] || ''),
      notes: String(r[11] || ''),
      createdDate: String(r[12] || '')
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

function parseRowsToAdmins(rows: any[][]): AdminUser[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    email: String(r[0] || '').trim(),
    role: String(r[1] || 'Super Admin').trim(),
    grantedBy: String(r[2] || 'System').trim(),
    grantedOn: String(r[3] || '').trim()
  })).filter(a => a.email);
}

function parseRowsToAdminLogs(rows: any[][]): AdminLog[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    timestamp: String(r[0] || '').trim(),
    action: String(r[1] || '').trim(),
    targetEmail: String(r[2] || '').trim(),
    performedBy: String(r[3] || '').trim()
  })).filter(l => l.timestamp);
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
  const body = rows.slice(1);
  return body.map(r => {
    let assets: any[] = [];
    let timeline: any[] = [];
    try {
      assets = JSON.parse(r[31] || '[]');
    } catch {
      assets = [];
    }
    try {
      timeline = JSON.parse(r[32] || '[]');
    } catch {
      timeline = [];
    }
    return {
      id: String(r[0] || ''),
      gatePassId: String(r[1] || ''),
      status: (r[2] || 'In Transit') as any,
      type: String(r[3] || 'Campaign Dispatch'),
      priority: (r[4] || 'Medium') as any,
      origin: String(r[5] || ''),
      destination: String(r[6] || ''),
      currentLocation: String(r[7] || ''),
      campaign: String(r[8] || ''),
      event: String(r[8] || 'Campaign Event'),
      courier: String(r[9] || ''),
      trackingNumber: String(r[10] || ''),
      vehicleNumber: String(r[11] || ''),
      driverName: String(r[12] || ''),
      driverContact: String(r[13] || ''),
      dispatchDate: String(r[14] || ''),
      expectedDeliveryDate: String(r[15] || ''),
      actualDeliveryDate: String(r[16] || ''),
      sender: String(r[17] || ''),
      receiver: String(r[18] || ''),
      receiverContact: String(r[19] || ''),
      currentPossessor: String(r[20] || ''),
      shipmentOwner: String(r[20] || 'AFMV'),
      totalAssets: parseInt(r[21]) || 0,
      deliveredAssetsCount: parseInt(r[22]) || 0,
      pendingAssetsCount: parseInt(r[23]) || 0,
      returnedAssetsCount: parseInt(r[24]) || 0,
      shippingCost: parseFloat(r[25]) || 0,
      insurance: String(r[26] || ''),
      packageWeight: String(r[27] || ''),
      boxesCount: parseInt(r[28]) || 1,
      remarks: String(r[29] || ''),
      lastUpdated: String(r[30] || ''),
      assets,
      timeline,
      createdDate: String(r[14] || new Date().toISOString().split('T')[0])
    };
  }).filter(s => s.id);
}

export async function saveShipmentsSheet(spreadsheetId: string, token: string, shipments: Shipment[]): Promise<void> {
  const values = shipments.map(mapShipmentToRow);
  const range = `Shipment Tracker!A2:AG${shipments.length + 100}`;
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  await writeValues(spreadsheetId, token, `Shipment Tracker!A1:AG${shipments.length + 1}`, [HEADERS['Shipment Tracker'], ...values]);
}

// Save entire Admins list
export async function saveAdminsSheet(spreadsheetId: string, token: string, admins: AdminUser[]): Promise<void> {
  const headers = ['Email', 'Role', 'Granted By', 'Granted On'];
  const values = admins.map(a => [a.email, a.role, a.grantedBy, a.grantedOn]);
  
  // Clear first
  const range = 'Admin!A1:D500';
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  await writeValues(spreadsheetId, token, `Admin!A1:D${admins.length + 1}`, [headers, ...values]);
}

// Append an admin log
export async function appendAdminLog(spreadsheetId: string, token: string, log: AdminLog): Promise<void> {
  const row = [log.timestamp, log.action, log.targetEmail, log.performedBy];
  const range = 'Admin!F2';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
}

export function getSampleSheetData(): SheetData {
  return {
    spreadsheetId: 'SAMPLE_SPREADSHEET_ID',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/SAMPLE_SPREADSHEET_ID',
    assets: SAMPLE_ASSETS,
    shipments: SAMPLE_SHIPMENTS,
    gatePasses: SAMPLE_GATE_PASSES,
    auditLogs: SAMPLE_AUDIT,
    campaigns: SAMPLE_CAMPAIGNS,
    owners: SAMPLE_OWNERS,
    possessors: SAMPLE_POSSESSORS,
    locations: SAMPLE_LOCATIONS,
    admins: [
      { email: 'aditya@aftermathventures.in', role: 'Super Admin', grantedBy: 'System', grantedOn: new Date().toISOString().split('T')[0] }
    ],
    adminLogs: []
  };
}
