/**
 * InventoryOS Collision-Resistant Identity Generators
 * Ensures immutable, monotonic, and unique IDs across all domain entities.
 */

/**
 * Generates a collision-resistant UUID v4 string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Extracts highest numerical index from formatted prefix IDs (e.g. AST-000042 -> 42)
 */
export function getMaxIdIndex(ids: (string | undefined | null)[], prefixRegex: RegExp): number {
  let max = 0;
  for (const id of ids) {
    if (!id) continue;
    const match = id.match(prefixRegex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
  }
  return max;
}

/**
 * Generates an immutable Asset ID (e.g. AST-000001) that never collides after deletions.
 */
export function generateAssetId(existingAssetIds: string[] = []): string {
  const existingSet = new Set(existingAssetIds.map(id => id.toUpperCase()));
  let nextNum = getMaxIdIndex(existingAssetIds, /AST-(\d+)/i) + 1;

  while (true) {
    const candidate = `AST-${String(nextNum).padStart(6, '0')}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    nextNum++;
  }
}

/**
 * Generates an immutable Gate Pass ID (e.g. GP-001)
 */
export function generateGatePassId(existingGatePassIds: string[] = []): string {
  const existingSet = new Set(existingGatePassIds.map(id => id.toUpperCase()));
  let nextNum = getMaxIdIndex(existingGatePassIds, /GP-(\d+)/i) + 1;

  while (true) {
    const candidate = `GP-${String(nextNum).padStart(3, '0')}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    nextNum++;
  }
}

/**
 * Generates an immutable Shipment ID (e.g. SHIP-001)
 */
export function generateShipmentId(existingShipmentIds: string[] = []): string {
  const existingSet = new Set(existingShipmentIds.map(id => id.toUpperCase()));
  let nextNum = getMaxIdIndex(existingShipmentIds, /SHIP-(\d+)/i) + 1;

  while (true) {
    const candidate = `SHIP-${String(nextNum).padStart(3, '0')}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    nextNum++;
  }
}

/**
 * Generates an immutable Audit Event ID
 */
export function generateAuditEventId(): string {
  const ts = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EVT-${ts}-${rand}`;
}

/**
 * Generates a formal Tracking Number
 */
export function generateTrackingNumber(courierPrefix: string = 'AFMV'): string {
  const prefix = courierPrefix.toUpperCase().slice(0, 4);
  const num1 = Math.floor(1000 + Math.random() * 9000);
  const num2 = Math.floor(1000 + Math.random() * 9000);
  return `TRK-${prefix}-${num1}-${num2}`;
}

/**
 * Generates an idempotency token for operations
 */
export function generateIdempotencyKey(operationName: string): string {
  return `OP-${operationName.toUpperCase()}-${Date.now()}-${generateUUID().slice(0, 8)}`;
}
