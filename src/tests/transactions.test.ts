import { describe, it, expect } from 'vitest';
import { 
  executeCreateGatePassOperation, 
  executeDeliveryOperation 
} from '../domain/transactions';
import { Asset, GatePass, Shipment } from '../types';

describe('Transactional Safety & Atomic Operations Tests', () => {
  const sampleAssets: Asset[] = [
    {
      sn: 1,
      assetId: 'AST-000001',
      serial: 'LAP-001',
      boxId: 'BOX-10',
      name: 'MacBook Pro',
      brand: 'Apple',
      desc: 'M3 Pro 16GB',
      qty: 1,
      city: 'Bangalore',
      status: 'In House',
      owner: 'AFMV',
      possessor: 'Warehouse',
      campaign: 'Tech Launch',
      receivedBy: 'Admin',
      receivedOn: '2026-01-01',
      shippingTo: 'Nil',
      shippingDate: 'Nil'
    },
    {
      sn: 2,
      assetId: 'AST-000002',
      serial: 'LAP-002',
      boxId: 'BOX-10',
      name: 'MacBook Air',
      brand: 'Apple',
      desc: 'M2 8GB',
      qty: 1,
      city: 'Bangalore',
      status: 'In House',
      owner: 'AFMV',
      possessor: 'Warehouse',
      campaign: 'Tech Launch',
      receivedBy: 'Admin',
      receivedOn: '2026-01-01',
      shippingTo: 'Nil',
      shippingDate: 'Nil'
    }
  ];

  it('atomically creates Gate Pass, linked Shipment, updates Assets, and creates Audit Logs', () => {
    const result = executeCreateGatePassOperation(
      {
        type: 'outbound',
        company: 'AFMV Logistics Pvt. Ltd.',
        serials: ['LAP-001', 'LAP-002'],
        origin: 'Bangalore',
        dest: 'Mumbai',
        shipDate: '2026-08-24',
        eta: '2026-08-26',
        receiver: 'Karan',
        possessor: 'Karan',
        newStatus: 'In Transit',
        notes: 'Priority Campaign Deployment',
        operatorEmail: 'aditya@aftermathventures.in',
        operatorName: 'Aditya'
      },
      sampleAssets,
      [],
      []
    );

    expect(result.gatePass.id).toBe('GP-001');
    expect(result.gatePass.serials).toEqual(['LAP-001', 'LAP-002']);
    expect(result.shipment.id).toBe('SHIP-001');
    expect(result.shipment.status).toBe('Dispatched');
    expect(result.shipment.assets).toHaveLength(2);

    // Assets updated
    const updatedLap1 = result.updatedAssets.find(a => a.serial === 'LAP-001');
    expect(updatedLap1?.status).toBe('In Transit');
    expect(updatedLap1?.city).toBe('Mumbai');
    expect(updatedLap1?.possessor).toBe('Karan');

    // Audit logs generated
    expect(result.auditEntries.length).toBeGreaterThanOrEqual(2);
    expect(result.auditEntries.some(e => e.serial === 'LAP-001' && e.to === 'In Transit')).toBe(true);
  });

  it('atomically processes Delivery and updates Shipment & Assets', () => {
    const initialShipment: Shipment = {
      id: 'SHIP-001',
      gatePassId: 'GP-001',
      status: 'In Transit',
      type: 'Campaign Dispatch',
      priority: 'Medium',
      origin: 'Bangalore',
      destination: 'Mumbai',
      currentLocation: 'Bangalore',
      campaign: 'Tech Launch',
      courier: 'AFMV Express',
      trackingNumber: 'TRK-AFMV-1234-5678',
      vehicleNumber: 'KA-01-EQ-9999',
      driverName: 'Ramesh Kumar',
      driverContact: '+91 9876543210',
      dispatchDate: '2026-08-24',
      expectedDeliveryDate: '2026-08-26',
      shipmentOwner: 'AFMV',
      sender: 'Warehouse',
      receiver: 'Karan',
      receiverContact: '+91 9988776655',
      currentPossessor: 'Karan',
      remarks: '',
      totalAssets: 2,
      deliveredAssetsCount: 0,
      pendingAssetsCount: 2,
      returnedAssetsCount: 0,
      assets: [
        { serial: 'LAP-001', boxId: 'BOX-10', name: 'MacBook Pro', brand: 'Apple', qty: 1, status: 'In Transit', received: false, returned: false },
        { serial: 'LAP-002', boxId: 'BOX-10', name: 'MacBook Air', brand: 'Apple', qty: 1, status: 'In Transit', received: false, returned: false }
      ],
      timeline: [],
      createdDate: '2026-08-24',
      lastUpdated: '2026-08-24'
    };

    // Full delivery of both units
    const deliveryResult = executeDeliveryOperation(
      {
        shipmentId: 'SHIP-001',
        receiverName: 'Karan',
        acknowledgedBy: 'Karan',
        deliveryDate: '2026-08-26',
        condition: 'Good / Perfect',
        remarks: 'All items checked in good condition',
        deliveredSerials: ['LAP-001', 'LAP-002'],
        operatorEmail: 'aditya@aftermathventures.in'
      },
      initialShipment,
      sampleAssets
    );

    expect(deliveryResult.updatedShipment.status).toBe('Delivered');
    expect(deliveryResult.updatedShipment.deliveredAssetsCount).toBe(2);
    expect(deliveryResult.updatedShipment.pendingAssetsCount).toBe(0);
    expect(deliveryResult.updatedShipment.actualDeliveryDate).toBe('2026-08-26');

    // Check assets updated
    const deliveredAsset1 = deliveryResult.updatedAssets.find(a => a.serial === 'LAP-001');
    expect(deliveredAsset1?.status).toBe('Delivered');
    expect(deliveredAsset1?.receivedBy).toBe('Karan');
    expect(deliveredAsset1?.receivedOn).toBe('2026-08-26');
  });
});
