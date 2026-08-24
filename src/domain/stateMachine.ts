import { ShipmentStatus } from '../types';

/**
 * Formal Domain State Machine for InventoryOS
 * Enforces legal state transitions and prevents invalid lifecycle movements.
 */

export const LEGAL_SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  'Draft': ['Awaiting Approval', 'Approved', 'Cancelled'],
  'Awaiting Approval': ['Approved', 'Draft', 'Cancelled'],
  'Approved': ['Packed', 'Ready for Dispatch', 'Dispatched', 'Cancelled'],
  'Packed': ['Ready for Dispatch', 'Dispatched', 'Cancelled'],
  'Ready for Dispatch': ['Dispatched', 'In Transit', 'Cancelled'],
  'Dispatched': ['In Transit', 'Reached Destination', 'Damaged', 'Lost', 'Cancelled'],
  'In Transit': ['Reached Destination', 'Delivered', 'Partially Delivered', 'Damaged', 'Lost', 'Return Initiated'],
  'Reached Destination': ['Delivered', 'Partially Delivered', 'Damaged', 'Lost', 'Return Initiated'],
  'Delivered': ['Acknowledged', 'Return Initiated', 'Closed'],
  'Partially Delivered': ['Delivered', 'Acknowledged', 'Return Initiated', 'Closed'],
  'Acknowledged': ['Return Initiated', 'Closed'],
  'Return Initiated': ['Returning', 'Cancelled', 'Closed'],
  'Returning': ['Returned', 'Damaged', 'Lost'],
  'Returned': ['Closed'],
  'Closed': [], // Terminal state
  'Cancelled': [], // Terminal state
  'Lost': ['Closed'],
  'Damaged': ['Closed', 'Return Initiated']
};

/**
 * Validates if a shipment status transition is legally permitted.
 */
export function isValidShipmentTransition(
  currentStatus: ShipmentStatus,
  nextStatus: ShipmentStatus
): boolean {
  if (currentStatus === nextStatus) return true; // Idempotent no-op
  const allowed = LEGAL_SHIPMENT_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Asserts that a shipment status transition is legal, throwing a clear error otherwise.
 */
export function assertLegalShipmentTransition(
  currentStatus: ShipmentStatus,
  nextStatus: ShipmentStatus,
  shipmentId: string = 'Shipment'
): void {
  if (!isValidShipmentTransition(currentStatus, nextStatus)) {
    const allowed = LEGAL_SHIPMENT_TRANSITIONS[currentStatus] || [];
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'None (Terminal State)';
    throw new Error(
      `Invalid State Transition: Cannot move ${shipmentId} from '${currentStatus}' to '${nextStatus}'. Permitted transitions from '${currentStatus}': [${allowedStr}].`
    );
  }
}

/**
 * Asset Status Validations
 */
export type AssetStatus = 
  | 'In House'
  | 'In Transit'
  | 'Delivered'
  | 'Ready for Pickup'
  | 'Under Maintenance'
  | 'Archived'
  | 'Lost'
  | 'Damaged';

export const VALID_ASSET_STATUSES: AssetStatus[] = [
  'In House',
  'In Transit',
  'Delivered',
  'Ready for Pickup',
  'Under Maintenance',
  'Archived',
  'Lost',
  'Damaged'
];

export function isValidAssetStatus(status: string): boolean {
  return VALID_ASSET_STATUSES.includes(status as AssetStatus);
}
