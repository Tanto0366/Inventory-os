export interface Asset {
  sn: number;
  assetId: string;
  serial: string;
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

export interface AdminLog {
  timestamp: string;
  action: string;
  targetEmail: string;
  performedBy: string;
}

