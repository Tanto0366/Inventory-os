export interface Asset {
  sn: number;
  assetId: string;
  serial: string;
  boxId?: string;
  name: string;
  desc: string;
  brand: string;
  qty: number;
  city: string;
  owner: string;
  possessor: string;
  campaign: string;
  status: string;
  receivedBy: string;
  receivedOn: string;
  shippingTo: string;
  shippingDate: string;
  createdDate?: string;
  lastUpdated?: string;
}

export interface GatePass {
  id: string;
  type: 'outbound' | 'inbound';
  company: string;
  serials: string[];
  origin: string;
  dest: string;
  shipDate: string;
  eta: string;
  receiver: string;
  possessor: string;
  newStatus: string;
  notes: string;
  createdDate?: string;
  driverName?: string;
  driverContact?: string;
  vehicleNumber?: string;
}

export interface AuditEntry {
  time: string;
  serial: string;
  field: string;
  from: string;
  to: string;
  by: string;
  note: string;
}

export interface Campaign {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  owner: string;
  budget: string;
  description: string;
  status: string;
}

export interface Owner {
  name: string;
  company: string;
  contact: string;
}

export interface Possessor {
  name: string;
  role: string;
  department: string;
}

export interface LocationInfo {
  city: string;
  address: string;
  type: string;
}

export interface AdminUser {
  email: string;
  role: string;
  grantedBy: string;
  grantedOn: string;
}

export type ShipmentStatus = 
  | 'Draft' 
  | 'Awaiting Approval' 
  | 'Approved' 
  | 'Packed' 
  | 'Ready for Dispatch' 
  | 'Dispatched' 
  | 'In Transit' 
  | 'Reached Destination' 
  | 'Delivered' 
  | 'Partially Delivered' 
  | 'Acknowledged' 
  | 'Return Initiated' 
  | 'Returning' 
  | 'Returned' 
  | 'Closed' 
  | 'Cancelled' 
  | 'Lost' 
  | 'Damaged';

export interface ShipmentAssetItem {
  serial: string;
  boxId?: string;
  name: string;
  brand: string;
  qty: number;
  status: string;
  received?: boolean;
  receivedDate?: string;
  returned?: boolean;
  returnedDate?: string;
  remarks?: string;
}

export interface ShipmentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  status: string;
  location?: string;
  description: string;
  performedBy?: string;
}

export interface Shipment {
  id: string;
  gatePassId: string;
  status: ShipmentStatus;
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  origin: string;
  destination: string;
  currentLocation: string;
  campaign: string;
  event?: string;
  courier: string;
  trackingNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  shipmentOwner: string;
  sender: string;
  receiver: string;
  receiverContact: string;
  currentPossessor: string;
  remarks: string;
  shippingCost?: number;
  insurance?: string;
  packageWeight?: string;
  boxesCount?: number;
  totalAssets: number;
  deliveredAssetsCount: number;
  pendingAssetsCount: number;
  returnedAssetsCount: number;
  receiverSignature?: string;
  acknowledgedBy?: string;
  condition?: string;
  assets: ShipmentAssetItem[];
  timeline: ShipmentTimelineEvent[];
  createdDate: string;
  lastUpdated: string;
}

export interface AdminLog {
  timestamp: string;
  action: string;
  targetEmail: string;
  performedBy: string;
}


