import { describe, it, expect } from 'vitest';
import { 
  isValidShipmentTransition, 
  assertLegalShipmentTransition, 
  LEGAL_SHIPMENT_TRANSITIONS 
} from '../domain/stateMachine';
import { ShipmentStatus } from '../types';

describe('Shipment State Machine Tests', () => {
  it('allows standard forward progression through the lifecycle', () => {
    expect(isValidShipmentTransition('Draft', 'Approved')).toBe(true);
    expect(isValidShipmentTransition('Approved', 'Dispatched')).toBe(true);
    expect(isValidShipmentTransition('Dispatched', 'In Transit')).toBe(true);
    expect(isValidShipmentTransition('In Transit', 'Reached Destination')).toBe(true);
    expect(isValidShipmentTransition('Reached Destination', 'Delivered')).toBe(true);
    expect(isValidShipmentTransition('Delivered', 'Acknowledged')).toBe(true);
    expect(isValidShipmentTransition('Acknowledged', 'Closed')).toBe(true);
  });

  it('allows return lifecycle transitions', () => {
    expect(isValidShipmentTransition('In Transit', 'Return Initiated')).toBe(true);
    expect(isValidShipmentTransition('Return Initiated', 'Returning')).toBe(true);
    expect(isValidShipmentTransition('Returning', 'Returned')).toBe(true);
    expect(isValidShipmentTransition('Returned', 'Closed')).toBe(true);
  });

  it('allows idempotent transitions (same state)', () => {
    expect(isValidShipmentTransition('In Transit', 'In Transit')).toBe(true);
    expect(isValidShipmentTransition('Delivered', 'Delivered')).toBe(true);
  });

  it('blocks illegal transitions from terminal or non-adjacent states', () => {
    expect(isValidShipmentTransition('Closed', 'Draft')).toBe(false);
    expect(isValidShipmentTransition('Closed', 'In Transit')).toBe(false);
    expect(isValidShipmentTransition('Cancelled', 'Dispatched')).toBe(false);
    expect(isValidShipmentTransition('Draft', 'Delivered')).toBe(false);
  });

  it('assertLegalShipmentTransition throws clear domain errors for illegal moves', () => {
    expect(() => {
      assertLegalShipmentTransition('Closed', 'In Transit', 'SHIP-001');
    }).toThrow(/Invalid State Transition: Cannot move SHIP-001 from 'Closed' to 'In Transit'/);

    expect(() => {
      assertLegalShipmentTransition('Draft', 'Approved', 'SHIP-001');
    }).not.toThrow();
  });
});
