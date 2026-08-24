import { Asset, GatePass, Shipment, AuditEntry, ShipmentStatus, ShipmentAssetItem, ShipmentTimelineEvent } from '../types';
import { generateGatePassId, generateShipmentId, generateTrackingNumber } from './identity';
import { assertLegalShipmentTransition } from './stateMachine';
import { validateGatePassInput } from './validation';

export interface CreateGatePassParams {
  type: 'outbound' | 'inbound';
  company: string;
  serials: string[];
  origin: string;
  originAddress?: string;
  dest: string;
  destAddress?: string;
  shipDate: string;
  eta: string;
  receiver: string;
  possessor: string;
  newStatus: string;
  notes: string;
  driverName?: string;
  driverContact?: string;
  vehicleNumber?: string;
  operatorEmail: string;
  operatorName: string;
}

export interface CreateGatePassResult {
  gatePass: GatePass;
  shipment: Shipment;
  updatedAssets: Asset[];
  auditEntries: AuditEntry[];
}

/**
 * Atomic Gate Pass + Shipment Transaction
 */
export function executeCreateGatePassOperation(
  params: CreateGatePassParams,
  currentAssets: Asset[],
  currentGatePasses: GatePass[],
  currentShipments: Shipment[]
): CreateGatePassResult {
  // 1. Validation
  const validation = validateGatePassInput(
    { origin: params.origin, dest: params.dest, serials: params.serials },
    currentAssets
  );
  if (!validation.valid) {
    throw new Error(`Gate Pass Creation Failed: ${validation.errors.join(' ')}`);
  }

  const selectedSet = new Set(params.serials.map(s => s.toLowerCase()));
  const matchingAssets = currentAssets.filter(a => selectedSet.has(a.serial.toLowerCase()));

  // 2. Generate Collision-Resistant IDs
  const gatePassId = generateGatePassId(currentGatePasses.map(g => g.id));
  const shipmentId = generateShipmentId(currentShipments.map(s => s.id));
  const trackingNumber = generateTrackingNumber('AFMV');

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTs = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // 3. Create Gate Pass
  const gatePass: GatePass = {
    id: gatePassId,
    type: params.type,
    company: params.company || 'AFMV Logistics Pvt. Ltd.',
    serials: params.serials,
    origin: params.origin,
    originAddress: params.originAddress,
    dest: params.dest,
    destAddress: params.destAddress,
    shipDate: params.shipDate || todayStr,
    eta: params.eta || params.shipDate || todayStr,
    receiver: params.receiver || '—',
    possessor: params.possessor || '—',
    newStatus: params.newStatus || 'In Transit',
    notes: params.notes || '',
    driverName: params.driverName,
    driverContact: params.driverContact,
    vehicleNumber: params.vehicleNumber,
    createdDate: todayStr
  };

  // 4. Create Linked Shipment
  const shipmentAssets: ShipmentAssetItem[] = matchingAssets.map(a => ({
    serial: a.serial,
    boxId: a.boxId || '—',
    name: a.name,
    brand: a.brand,
    qty: a.qty || 1,
    status: params.newStatus || 'In Transit',
    received: false,
    returned: false
  }));

  const timelineEvents: ShipmentTimelineEvent[] = [
    {
      id: `TL-1-${Date.now()}`,
      timestamp: nowTs,
      title: 'Gate Pass Approved & Shipment Created',
      status: 'Approved',
      location: params.origin,
      description: `Gate Pass ${gatePassId} issued for ${matchingAssets.length} assets. Auto-created shipment ${shipmentId}.`,
      performedBy: params.operatorEmail || 'System'
    },
    {
      id: `TL-2-${Date.now()}`,
      timestamp: nowTs,
      title: 'Dispatched in Transit',
      status: 'Dispatched',
      location: params.origin,
      description: `Dispatched from ${params.origin} to ${params.dest} via AFMV Express Logistics.`,
      performedBy: params.operatorEmail || 'System'
    }
  ];

  const primaryCampaign = matchingAssets.find(a => a.campaign && a.campaign !== 'Nil')?.campaign || 'General Movement';
  const primaryOwner = matchingAssets.find(a => a.owner && a.owner !== 'No info')?.owner || 'AFMV';

  const shipment: Shipment = {
    id: shipmentId,
    gatePassId,
    status: 'Dispatched',
    type: params.type === 'outbound' ? 'Campaign Dispatch' : 'Internal Movement',
    priority: 'Medium',
    origin: params.origin,
    destination: params.dest,
    currentLocation: params.origin,
    campaign: primaryCampaign,
    event: params.notes || 'Gate Pass Asset Movement',
    courier: 'AFMV Express Logistics',
    trackingNumber,
    vehicleNumber: params.vehicleNumber || '',
    driverName: params.driverName || '',
    driverContact: params.driverContact || '',
    dispatchDate: params.shipDate || todayStr,
    expectedDeliveryDate: params.eta || params.shipDate || todayStr,
    shipmentOwner: primaryOwner,
    sender: params.operatorName || params.operatorEmail || 'Warehouse Operations',
    receiver: params.receiver || '—',
    receiverContact: '',
    currentPossessor: params.possessor || '—',
    remarks: params.notes || 'Auto-created shipment from Gate Pass.',
    shippingCost: 2500,
    insurance: 'Standard Logistics Coverage',
    packageWeight: `${matchingAssets.length * 2.5} kg`,
    boxesCount: Math.max(1, Math.ceil(matchingAssets.length / 3)),
    totalAssets: matchingAssets.length,
    deliveredAssetsCount: 0,
    pendingAssetsCount: matchingAssets.length,
    returnedAssetsCount: 0,
    assets: shipmentAssets,
    timeline: timelineEvents,
    createdDate: todayStr,
    lastUpdated: nowTs
  };

  // 5. Update Asset States
  const updatedAssets = currentAssets.map(a => {
    if (selectedSet.has(a.serial.toLowerCase())) {
      return {
        ...a,
        status: params.newStatus || 'In Transit',
        city: params.dest,
        possessor: params.possessor || a.possessor,
        shippingTo: params.dest,
        shippingDate: params.shipDate || todayStr,
        lastUpdated: todayStr
      };
    }
    return a;
  });

  // 6. Generate Audit Log Entries
  const auditEntries: AuditEntry[] = [];
  for (const a of matchingAssets) {
    auditEntries.push({
      time: nowTs,
      serial: a.serial,
      field: 'Status',
      from: a.status,
      to: params.newStatus || 'In Transit',
      by: params.operatorName || params.operatorEmail || 'System',
      note: `Gate Pass ${gatePassId} Issued`
    });

    if (params.possessor && a.possessor !== params.possessor) {
      auditEntries.push({
        time: nowTs,
        serial: a.serial,
        field: 'Possessor',
        from: a.possessor,
        to: params.possessor,
        by: params.operatorName || params.operatorEmail || 'System',
        note: `Gate Pass ${gatePassId}`
      });
    }
  }

  return {
    gatePass,
    shipment,
    updatedAssets,
    auditEntries
  };
}

export interface DeliveryParams {
  shipmentId: string;
  receiverName: string;
  acknowledgedBy: string;
  deliveryDate: string;
  condition: string;
  remarks: string;
  deliveredSerials: string[];
  operatorEmail: string;
}

export interface DeliveryResult {
  updatedShipment: Shipment;
  updatedAssets: Asset[];
  auditEntries: AuditEntry[];
}

/**
 * Atomic Delivery & Partial Delivery Confirmation
 */
export function executeDeliveryOperation(
  params: DeliveryParams,
  shipment: Shipment,
  currentAssets: Asset[]
): DeliveryResult {
  const deliveredSet = new Set(params.deliveredSerials.map(s => s.toLowerCase()));
  const totalCount = shipment.assets.length;
  const deliveredCount = shipment.assets.filter(a => deliveredSet.has(a.serial.toLowerCase())).length;

  if (deliveredCount === 0) {
    throw new Error('Delivery confirmation requires at least one received asset serial.');
  }

  const isPartial = deliveredCount < totalCount;
  const nextStatus: ShipmentStatus = isPartial ? 'Partially Delivered' : 'Delivered';

  assertLegalShipmentTransition(shipment.status, nextStatus, shipment.id);

  const nowTs = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Update Shipment Assets
  const updatedShipmentAssets = shipment.assets.map(sa => {
    const isDelivered = deliveredSet.has(sa.serial.toLowerCase());
    return {
      ...sa,
      status: isDelivered ? 'Delivered' : (sa.status || 'Pending'),
      received: isDelivered,
      receivedDate: isDelivered ? params.deliveryDate : sa.receivedDate
    };
  });

  // Update Global Assets
  const updatedAssets = currentAssets.map(a => {
    if (deliveredSet.has(a.serial.toLowerCase())) {
      return {
        ...a,
        status: 'Delivered',
        city: shipment.destination,
        receivedBy: params.receiverName || a.receivedBy,
        receivedOn: params.deliveryDate,
        lastUpdated: params.deliveryDate
      };
    }
    return a;
  });

  const timelineEvent: ShipmentTimelineEvent = {
    id: `TL-DEL-${Date.now()}`,
    timestamp: nowTs,
    title: isPartial ? `Partial Delivery Confirmed (${deliveredCount}/${totalCount})` : 'Delivery Confirmed',
    status: nextStatus,
    location: shipment.destination,
    description: `Receiver: ${params.receiverName}. Acknowledged By: ${params.acknowledgedBy}. Condition: ${params.condition}. ${params.remarks}`,
    performedBy: params.acknowledgedBy || params.operatorEmail || 'System'
  };

  const updatedShipment: Shipment = {
    ...shipment,
    status: nextStatus,
    actualDeliveryDate: params.deliveryDate,
    receiver: params.receiverName || shipment.receiver,
    receiverSignature: `${params.receiverName} (Verified Signature)`,
    acknowledgedBy: params.acknowledgedBy,
    condition: params.condition,
    remarks: params.remarks ? `${shipment.remarks ? shipment.remarks + ' | ' : ''}${params.remarks}` : shipment.remarks,
    deliveredAssetsCount: deliveredCount,
    pendingAssetsCount: Math.max(0, totalCount - deliveredCount),
    assets: updatedShipmentAssets,
    timeline: [timelineEvent, ...shipment.timeline],
    lastUpdated: nowTs
  };

  const auditEntries: AuditEntry[] = [];
  for (const sn of params.deliveredSerials) {
    auditEntries.push({
      time: nowTs,
      serial: sn,
      field: 'Status',
      from: 'In Transit',
      to: 'Delivered',
      by: params.acknowledgedBy || params.operatorEmail || 'System',
      note: `Shipment ${shipment.id} Delivered`
    });
  }

  return {
    updatedShipment,
    updatedAssets,
    auditEntries
  };
}
