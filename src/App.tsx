import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Home, 
  Send, 
  Truck, 
  Clock, 
  Activity, 
  Flag, 
  Shield, 
  LogOut, 
  Plus, 
  Search, 
  Menu, 
  Grid, 
  FileSpreadsheet, 
  ExternalLink, 
  FileDown, 
  X, 
  Printer, 
  Archive, 
  User, 
  RefreshCw, 
  SlidersHorizontal, 
  History, 
  UserPlus,
  Navigation
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Asset, GatePass, AuditEntry, Campaign, Owner, Possessor, LocationInfo, AdminUser, AdminLog, Shipment, ShipmentAssetItem } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import { 
  findSpreadsheet, 
  createAndProvisionSpreadsheet, 
  loadSpreadsheetData, 
  saveAssetsSheet, 
  saveShipmentsSheet,
  saveGatePassesSheet,
  saveAuditLogsSheet,
  appendGatePass, 
  appendAuditLog,
  saveCampaignsSheet,
  saveAdminsSheet,
  appendAdminLog,
  getSampleSheetData
} from './lib/googleSheets';
import { expandAssetsWithQuantities } from './lib/assetUtils';

import LoginView from './components/LoginView';
import SyncStatus from './components/SyncStatus';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import GatePassesView from './components/GatePassesView';
import { ShipmentsView } from './components/ShipmentsView';
import AuditTrailView from './components/AuditTrailView';
import CampaignsView from './components/CampaignsView';

export default function App() {
  // Auth & Token state
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Core Data state with robust local fallback
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_assets');
      if (stored) return expandAssetsWithQuantities(JSON.parse(stored));
    } catch {}
    return expandAssetsWithQuantities(getSampleSheetData().assets);
  });

  const [gatePasses, setGatePasses] = useState<GatePass[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_gatepasses');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().gatePasses;
  });

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_shipments');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().shipments;
  });

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_auditlogs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().auditLogs;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_campaigns');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().campaigns;
  });

  const [owners, setOwners] = useState<Owner[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_owners');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().owners;
  });

  const [possessors, setPossessors] = useState<Possessor[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_possessors');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().possessors;
  });

  const [locations, setLocations] = useState<LocationInfo[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_locations');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().locations;
  });

  // Navigation / UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'shipments' | 'gatepasses' | 'timeline' | 'audit' | 'campaigns' | 'import' | 'superadmin'>('dashboard');
  
  const [adminsList, setAdminsList] = useState<AdminUser[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_admins');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().admins;
  });

  const [adminLogs, setAdminLogs] = useState<AdminLog[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_os_adminlogs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleSheetData().adminLogs;
  });

  const isAdmin = !!(user && (
    user.email === 'aditya@aftermathventures.in' || 
    adminsList.some(a => a.email.toLowerCase() === user.email.toLowerCase())
  ));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [editAssetOpen, setEditAssetOpen] = useState(false);
  const [gatePassOpen, setGatePassOpen] = useState(false);
  const [previewGpOpen, setPreviewGpOpen] = useState(false);

  // Form states
  const [editingSerial, setEditingSerial] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState({
    name: '',
    serial: '',
    boxId: '',
    brand: '',
    desc: '',
    qty: 1,
    city: 'Bangalore',
    owner: '',
    possessor: '',
    status: 'In House',
    campaign: '',
    receivedBy: '',
    receivedOn: new Date().toISOString().split('T')[0]
  });

  const [gpForm, setGpForm] = useState({
    company: 'AFMV Logistics Pvt. Ltd.',
    type: 'outbound' as 'outbound' | 'inbound',
    origin: 'Bangalore',
    dest: '',
    shipDate: new Date().toISOString().split('T')[0],
    eta: '',
    receiver: '',
    possessor: '',
    newStatus: 'In Transit',
    notes: '',
    driverName: '',
    driverContact: '',
    vehicleNumber: ''
  });
  const [gpSelectedSerials, setGpSelectedSerials] = useState<Set<string>>(new Set());
  const [gpAssetSearch, setGpAssetSearch] = useState('');
  const [previewingGp, setPreviewingGp] = useState<GatePass | null>(null);

  // Import Preview State
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Asset[]>([]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_assets', JSON.stringify(assets));
    } catch {}
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_gatepasses', JSON.stringify(gatePasses));
    } catch {}
  }, [gatePasses]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_shipments', JSON.stringify(shipments));
    } catch {}
  }, [shipments]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_auditlogs', JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_campaigns', JSON.stringify(campaigns));
    } catch {}
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_owners', JSON.stringify(owners));
    } catch {}
  }, [owners]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_possessors', JSON.stringify(possessors));
    } catch {}
  }, [possessors]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_locations', JSON.stringify(locations));
    } catch {}
  }, [locations]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_admins', JSON.stringify(adminsList));
    } catch {}
  }, [adminsList]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_os_adminlogs', JSON.stringify(adminLogs));
    } catch {}
  }, [adminLogs]);

  // Initialize Auth listeners on load
  useEffect(() => {
    initAuth(
      async (user, activeToken) => {
        setUser(user);
        setToken(activeToken);
        setNeedsAuth(false);
        try {
          localStorage.setItem('inventory_os_token', activeToken);
        } catch {}

        const log = {
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          action: 'Session Restored',
          targetEmail: user.email || '',
          performedBy: user.email || ''
        };
        setAdminLogs(prev => [log, ...prev]);

        try {
          let id = spreadsheetId || localStorage.getItem('inventory_os_spreadsheet_id');
          if (!id) {
            id = await findSpreadsheet(activeToken);
          }
          if (id) {
            setSpreadsheetId(id);
            setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${id}`);
            try {
              localStorage.setItem('inventory_os_spreadsheet_id', id);
            } catch {}

            // Load data from spreadsheet on startup if local state is empty
            const hasLocal = localStorage.getItem('inventory_os_assets');
            if (!hasLocal) {
              const data = await loadSpreadsheetData(id, activeToken);
              if (data.assets && data.assets.length > 0) setAssets(data.assets);
              if (data.shipments && data.shipments.length > 0) setShipments(data.shipments);
              if (data.gatePasses && data.gatePasses.length > 0) setGatePasses(data.gatePasses);
              if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
              if (data.campaigns && data.campaigns.length > 0) setCampaigns(data.campaigns);
              if (data.owners && data.owners.length > 0) setOwners(data.owners);
              if (data.possessors && data.possessors.length > 0) setPossessors(data.possessors);
              if (data.locations && data.locations.length > 0) setLocations(data.locations);
              if (data.admins && data.admins.length > 0) setAdminsList(data.admins);
              if (data.adminLogs) setAdminLogs(data.adminLogs);
            }
            setLastSync(new Date());
            setSyncError(null);
          }
        } catch (err: any) {
          console.warn('Initial spreadsheet check warning:', err);
        }
      },
      () => {
        setNeedsAuth(true);
      }
    );
  }, []);

  // Handle Sign In Action
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        try {
          localStorage.setItem('inventory_os_token', result.accessToken);
        } catch {}

        const log = {
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          action: 'User Signed In',
          targetEmail: result.user.email || '',
          performedBy: result.user.email || ''
        };
        setAdminLogs(prev => [log, ...prev]);

        await triggerSheetsSync(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'OAuth verification failed. Try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginDemo = () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      setUser({
        uid: 'demo-user-id',
        email: 'aditya@aftermathventures.in', // Match primary owner so they get full administrative permissions
        displayName: 'Demo Guest Administrator',
        photoURL: ''
      } as any);
      setToken('DEMO_TOKEN');
      setNeedsAuth(false);
      setSyncError('DEMO_MODE'); // Indicator that we are operating in Local Offline mode
      
      const log = {
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        action: 'Demo Session Started',
        targetEmail: 'aditya@aftermathventures.in',
        performedBy: 'Demo Guest'
      };
      setAdminLogs(prev => [log, ...prev]);
    } catch (err: any) {
      setAuthError(err.message || 'Demo access failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out? Your local sync state will be cleared.')) {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setSpreadsheetUrl(null);
      setAssets([]);
      setGatePasses([]);
      setAuditLogs([]);
      setNeedsAuth(true);
    }
  };

  // Helper: Run Google Sheets operation with offline-resilience try/catch wrapper
  const runSheetSync = async (fn: (sheetId: string, activeToken: string) => Promise<void>) => {
    const activeToken = token || localStorage.getItem('inventory_os_token');
    if (!activeToken || activeToken === 'DEMO_TOKEN') return;

    setIsSyncing(true);
    try {
      let activeSheetId = spreadsheetId || localStorage.getItem('inventory_os_spreadsheet_id');
      if (!activeSheetId) {
        activeSheetId = await findSpreadsheet(activeToken);
        if (!activeSheetId) {
          const data = await createAndProvisionSpreadsheet(activeToken);
          activeSheetId = data.spreadsheetId;
        }
        setSpreadsheetId(activeSheetId);
        setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${activeSheetId}`);
        try {
          localStorage.setItem('inventory_os_spreadsheet_id', activeSheetId);
        } catch {}
      }

      await fn(activeSheetId, activeToken);
      setLastSync(new Date());
      setSyncError(null);
    } catch (e: any) {
      console.warn('Sheets operation deferred (operating in local-only mode):', e.message || e);
      setSyncError(e.message || 'Offline');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync Google Sheets integration
  const triggerSheetsSync = async (activeToken: string | null = token) => {
    const currentToken = activeToken || token || localStorage.getItem('inventory_os_token');
    if (!currentToken || currentToken === 'DEMO_TOKEN') {
      setSyncError('DEMO_MODE');
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      let sheetId = spreadsheetId || localStorage.getItem('inventory_os_spreadsheet_id') || await findSpreadsheet(currentToken);
      if (!sheetId) {
        const data = await createAndProvisionSpreadsheet(currentToken);
        sheetId = data.spreadsheetId;
      }

      setSpreadsheetId(sheetId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${sheetId}`);
      try {
        localStorage.setItem('inventory_os_spreadsheet_id', sheetId);
      } catch {}

      // Save all current local collections to Google Sheets
      await saveAssetsSheet(sheetId, currentToken, assets);
      await saveGatePassesSheet(sheetId, currentToken, gatePasses);
      await saveAuditLogsSheet(sheetId, currentToken, auditLogs);
      await saveShipmentsSheet(sheetId, currentToken, shipments);
      await saveCampaignsSheet(sheetId, currentToken, campaigns);
      await saveAdminsSheet(sheetId, currentToken, adminsList);

      setLastSync(new Date());
      setSyncError(null);
    } catch (e: any) {
      console.warn('Google Sheets Sync is currently offline:', e.message || e);
      setSyncError(e.message || 'Failed to sync with Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  const logAdminAction = async (action: string, targetEmail: string) => {
    const log = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      action,
      targetEmail,
      performedBy: user?.email || 'System'
    };
    setAdminLogs(prev => [log, ...prev]);
    await runSheetSync(async (sheetId, activeToken) => {
      await appendAdminLog(sheetId, activeToken, log);
    });
  };

  // Helper: Create log helper
  const logTransaction = async (serial: string, field: string, from: string, to: string, ref: string) => {
    const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const log: AuditEntry = {
      time: ts,
      serial,
      field,
      from,
      to,
      by: user?.displayName || 'System',
      note: ref
    };
    
    setAuditLogs(prev => {
      const nextAuditLogs = [log, ...prev];
      runSheetSync(async (sheetId, activeToken) => {
        await saveAuditLogsSheet(sheetId, activeToken, nextAuditLogs);
      });
      return nextAuditLogs;
    });
  };

  // Asset action handlers
  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.serial) {
      alert('Item Name and unique Serial Number are required.');
      return;
    }

    const cleanedSerial = assetForm.serial.trim();
    const qtyCount = Math.max(1, assetForm.qty || 1);

    if (qtyCount === 1 && assets.some(a => a.serial.toLowerCase() === cleanedSerial.toLowerCase())) {
      alert('An asset with this serial number already exists.');
      return;
    }

    const nextAssetId = `AST-${String(assets.length + 1).padStart(6, '0')}`;
    const rawNewAsset: Asset = {
      sn: assets.length + 1,
      assetId: nextAssetId,
      serial: cleanedSerial,
      boxId: assetForm.boxId ? assetForm.boxId.trim() : '—',
      name: assetForm.name,
      brand: assetForm.brand,
      desc: assetForm.desc,
      qty: qtyCount,
      city: assetForm.city,
      owner: assetForm.owner || 'No info',
      possessor: assetForm.possessor || 'Warehouse',
      campaign: assetForm.campaign || 'Nil',
      status: assetForm.status,
      receivedBy: assetForm.receivedBy || (user?.displayName || 'System'),
      receivedOn: assetForm.receivedOn || new Date().toISOString().split('T')[0],
      shippingTo: 'Nil',
      shippingDate: 'Nil',
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    const nextAssets = expandAssetsWithQuantities([...assets, rawNewAsset]);
    setAssets(nextAssets);
    setAddAssetOpen(false);

    await runSheetSync(async (sheetId, activeToken) => {
      await saveAssetsSheet(sheetId, activeToken, nextAssets);
    });

    // Find newly added units and log transactions
    const addedUnits = nextAssets.filter(item => 
      !assets.some(existing => existing.serial === item.serial && existing.assetId === item.assetId)
    );
    for (const unit of addedUnits) {
      await logTransaction(unit.serial, 'Status', '—', unit.status, 'Asset Registration');
    }

    // Reset Form
    setAssetForm({
      name: '', serial: '', boxId: '', brand: '', desc: '', qty: 1, city: 'Bangalore',
      owner: '', possessor: '', status: 'In House', campaign: '',
      receivedBy: '', receivedOn: new Date().toISOString().split('T')[0]
    });
  };

  const handleOpenEditAsset = (serial: string) => {
    const a = assets.find(x => x.serial === serial);
    if (!a) return;
    setEditingSerial(serial);
    setAssetForm({
      name: a.name,
      serial: a.serial,
      boxId: a.boxId || '',
      brand: a.brand,
      desc: a.desc,
      qty: a.qty || 1,
      city: a.city,
      owner: a.owner,
      possessor: a.possessor,
      status: a.status,
      campaign: a.campaign,
      receivedBy: a.receivedBy,
      receivedOn: a.receivedOn
    });
    setEditAssetOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!editingSerial) return;
    const original = assets.find(x => x.serial === editingSerial);
    if (!original) return;

    const qtyCount = Math.max(1, assetForm.qty || 1);

    const updatedRawAssets = assets.map(a => {
      if (a.serial === editingSerial) {
        return {
          ...a,
          name: assetForm.name,
          boxId: assetForm.boxId ? assetForm.boxId.trim() : '—',
          brand: assetForm.brand,
          desc: assetForm.desc,
          qty: qtyCount,
          city: assetForm.city,
          owner: assetForm.owner,
          possessor: assetForm.possessor,
          status: assetForm.status,
          campaign: assetForm.campaign,
          receivedBy: assetForm.receivedBy,
          receivedOn: assetForm.receivedOn,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    });

    const nextAssets = expandAssetsWithQuantities(updatedRawAssets);
    setAssets(nextAssets);
    setEditAssetOpen(false);

    await runSheetSync(async (sheetId, activeToken) => {
      await saveAssetsSheet(sheetId, activeToken, nextAssets);
    });

    // Log key audits
    if (original.status !== assetForm.status) {
      await logTransaction(editingSerial, 'Status', original.status, assetForm.status, 'Details update');
    }
    if (original.possessor !== assetForm.possessor) {
      await logTransaction(editingSerial, 'Possessor', original.possessor, assetForm.possessor, 'Details update');
    }
    if (original.city !== assetForm.city) {
      await logTransaction(editingSerial, 'Location', original.city, assetForm.city, 'Details update');
    }
    if (original.boxId !== assetForm.boxId) {
      await logTransaction(editingSerial, 'Box ID', original.boxId || '—', assetForm.boxId || '—', 'Details update');
    }

    setEditingSerial(null);
  };

  const handleDeleteAsset = async (serial: string) => {
    const updated = assets.filter(a => a.serial !== serial);
    setAssets(updated);
    await runSheetSync(async (sheetId, activeToken) => {
      await saveAssetsSheet(sheetId, activeToken, updated);
    });
    await logTransaction(serial, 'Deleted', 'Active', 'Archived', 'Removal');
  };

  const handleBulkDelete = async (serials: string[]) => {
    const updated = assets.filter(a => !serials.includes(a.serial));
    setAssets(updated);
    await runSheetSync(async (sheetId, activeToken) => {
      await saveAssetsSheet(sheetId, activeToken, updated);
    });
    for (const s of serials) {
      await logTransaction(s, 'Deleted', 'Active', 'Archived', 'Bulk deletion');
    }
  };

  // Issue Gate Pass handlers
  const handleIssueGatePass = async () => {
    if (gpSelectedSerials.size === 0) {
      alert('Select at least one asset for this gate pass.');
      return;
    }
    if (!gpForm.origin || !gpForm.dest) {
      alert('Origin and Destination points are required.');
      return;
    }

    const nextId = `GP-${String(gatePasses.length + 1).padStart(3, '0')}`;
    const newPass: GatePass = {
      id: nextId,
      type: gpForm.type,
      company: gpForm.company || 'AFMV Logistics Pvt. Ltd.',
      serials: Array.from(gpSelectedSerials),
      origin: gpForm.origin,
      dest: gpForm.dest,
      shipDate: gpForm.shipDate,
      eta: gpForm.eta,
      receiver: gpForm.receiver || '—',
      possessor: gpForm.possessor || '—',
      newStatus: gpForm.newStatus,
      notes: gpForm.notes,
      createdDate: new Date().toISOString().split('T')[0],
      driverName: gpForm.driverName ? gpForm.driverName.trim() : undefined,
      driverContact: gpForm.driverContact ? gpForm.driverContact.trim() : undefined,
      vehicleNumber: gpForm.vehicleNumber ? gpForm.vehicleNumber.trim() : undefined
    };

    // Update the statuses of matching serials locally
    const updatedAssets = assets.map(a => {
      if (gpSelectedSerials.has(a.serial)) {
        return {
          ...a,
          status: gpForm.newStatus,
          city: gpForm.dest,
          possessor: gpForm.possessor || a.possessor,
          shippingTo: gpForm.dest,
          shippingDate: gpForm.shipDate
        };
      }
      return a;
    });

    // Auto-create linked Shipment Record
    const shipmentId = `SHIP-${String(shipments.length + 1).padStart(3, '0')}`;
    const selectedAssetObjects = assets.filter(a => gpSelectedSerials.has(a.serial));
    const shipmentAssets: ShipmentAssetItem[] = selectedAssetObjects.map(a => ({
      serial: a.serial,
      boxId: a.boxId || '—',
      name: a.name,
      brand: a.brand,
      qty: a.qty || 1,
      status: gpForm.newStatus || 'In Transit',
      received: false,
      returned: false
    }));

    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const todayYMD = new Date().toISOString().split('T')[0];

    const newShipment: Shipment = {
      id: shipmentId,
      gatePassId: nextId,
      status: 'Dispatched',
      type: gpForm.type === 'outbound' ? 'Campaign Dispatch' : 'Internal Movement',
      priority: 'Medium',
      origin: gpForm.origin,
      destination: gpForm.dest,
      currentLocation: gpForm.origin,
      campaign: selectedAssetObjects[0]?.campaign || 'General',
      event: gpForm.notes || 'Gate Pass Asset Movement',
      courier: 'AFMV Express Logistics',
      trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleNumber: gpForm.vehicleNumber ? gpForm.vehicleNumber.trim() : '',
      driverName: gpForm.driverName ? gpForm.driverName.trim() : '',
      driverContact: gpForm.driverContact ? gpForm.driverContact.trim() : '',
      dispatchDate: gpForm.shipDate || todayYMD,
      expectedDeliveryDate: gpForm.eta || gpForm.shipDate || todayYMD,
      shipmentOwner: selectedAssetObjects[0]?.owner || 'AFMV',
      sender: user?.displayName || user?.email || 'Warehouse Admin',
      receiver: gpForm.receiver || '—',
      receiverContact: '',
      currentPossessor: gpForm.possessor || '—',
      remarks: gpForm.notes || 'Auto-created shipment from Gate Pass.',
      shippingCost: 2500,
      insurance: 'Standard Logistics Coverage',
      packageWeight: `${selectedAssetObjects.length * 2.5} kg`,
      boxesCount: Math.ceil(selectedAssetObjects.length / 3),
      totalAssets: selectedAssetObjects.length,
      deliveredAssetsCount: 0,
      pendingAssetsCount: selectedAssetObjects.length,
      returnedAssetsCount: 0,
      assets: shipmentAssets,
      timeline: [
        {
          id: `T1-${Date.now()}`,
          timestamp: nowStr,
          title: 'Gate Pass Approved & Shipment Created',
          status: 'Approved',
          location: gpForm.origin,
          description: `Gate Pass ${nextId} issued for ${selectedAssetObjects.length} assets. Auto-generated Shipment ${shipmentId}.`,
          performedBy: user?.email || 'System'
        },
        {
          id: `T2-${Date.now()}`,
          timestamp: nowStr,
          title: 'Dispatched in Transit',
          status: 'Dispatched',
          location: gpForm.origin,
          description: `Dispatched from ${gpForm.origin} to ${gpForm.dest} via AFMV Express.`,
          performedBy: user?.email || 'System'
        }
      ],
      createdDate: todayYMD,
      lastUpdated: nowStr
    };

    const nextShipments = [newShipment, ...shipments];
    const nextGatePasses = [newPass, ...gatePasses];
    setAssets(updatedAssets);
    setGatePasses(nextGatePasses);
    setShipments(nextShipments);
    setGatePassOpen(false);

    await runSheetSync(async (sheetId, activeToken) => {
      await saveAssetsSheet(sheetId, activeToken, updatedAssets);
      await saveGatePassesSheet(sheetId, activeToken, nextGatePasses);
      await saveShipmentsSheet(sheetId, activeToken, nextShipments);
    });

    // Log logs for each asset
    for (const sn of (Array.from(gpSelectedSerials) as string[])) {
      const original = assets.find(x => x.serial === sn);
      await logTransaction(sn, 'Status', original?.status || 'In House', gpForm.newStatus, nextId);
      if (gpForm.possessor && original?.possessor !== gpForm.possessor) {
        await logTransaction(sn, 'Possessor', original?.possessor || 'Warehouse', gpForm.possessor, nextId);
      }
    }

    // Reset Form
    setGpSelectedSerials(new Set());
    setGpForm({
      company: 'AFMV Logistics Pvt. Ltd.', type: 'outbound', origin: 'Bangalore', dest: '',
      shipDate: new Date().toISOString().split('T')[0], eta: '', receiver: '', possessor: '',
      newStatus: 'In Transit', notes: '', driverName: '', driverContact: '', vehicleNumber: ''
    });
  };

  const handleOpenPreviewGp = (gp: GatePass) => {
    setPreviewingGp(gp);
    setPreviewGpOpen(true);
  };

  // XLSX Import Handler
  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length <= 1) {
        alert('Empty worksheet uploaded.');
        return;
      }

      // Column mapping logic (match case insensitive headers)
      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const findIndex = (aliases: string[]) => headers.findIndex(h => aliases.includes(h));

      const serialIdx = findIndex(['serial', 'serial number', 'serial no', 's/n serial']);
      const boxIdIdx = findIndex(['box id', 'box', 'box_id', 'boxid', 'box no']);
      const nameIdx = findIndex(['item', 'item name', 'name']);
      const brandIdx = findIndex(['brand']);
      const descIdx = findIndex(['description', 'desc', 'model']);
      const qtyIdx = findIndex(['quantity', 'qty']);
      const cityIdx = findIndex(['location', 'city']);
      const ownerIdx = findIndex(['owner']);
      const possessorIdx = findIndex(['possessor', 'current possession', 'current possessor']);
      const statusIdx = findIndex(['status']);
      const campaignIdx = findIndex(['campaign', 'currently used for (campaign)']);

      if (serialIdx === -1 || nameIdx === -1) {
        alert('Required columns "Serial Number" and "Item Name" could not be detected. Download the template for exact headers.');
        return;
      }

      const parsedRaw: Asset[] = rows.slice(1).map((r, i) => {
        const serial = String(r[serialIdx] || '').trim();
        return {
          sn: assets.length + i + 1,
          assetId: `AST-${String(assets.length + i + 1).padStart(6, '0')}`,
          serial,
          boxId: boxIdIdx !== -1 ? String(r[boxIdIdx] || '').trim() : '—',
          name: String(r[nameIdx] || ''),
          brand: brandIdx !== -1 ? String(r[brandIdx] || '') : '',
          desc: descIdx !== -1 ? String(r[descIdx] || '') : '',
          qty: qtyIdx !== -1 ? parseInt(r[qtyIdx]) || 1 : 1,
          city: cityIdx !== -1 ? String(r[cityIdx] || 'Bangalore') : 'Bangalore',
          owner: ownerIdx !== -1 ? String(r[ownerIdx] || 'AFMV') : 'AFMV',
          possessor: possessorIdx !== -1 ? String(r[possessorIdx] || 'Warehouse') : 'Warehouse',
          status: statusIdx !== -1 ? String(r[statusIdx] || 'In House') : 'In House',
          campaign: campaignIdx !== -1 ? String(r[campaignIdx] || 'Nil') : 'Nil',
          receivedBy: user?.displayName || 'System',
          receivedOn: new Date().toISOString().split('T')[0],
          shippingTo: 'Nil',
          shippingDate: 'Nil'
        };
      }).filter(item => item.serial && item.name);

      const parsed = expandAssetsWithQuantities(parsedRaw);

      if (parsed.length === 0) {
        alert('No valid items containing serials and names were parsed.');
        return;
      }

      setPendingImportData(parsed);
      setImportPreviewOpen(true);
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    // Skip duplicate serials
    const uniqueIncoming = pendingImportData.filter(incoming => {
      return !assets.some(existing => existing.serial.toLowerCase() === incoming.serial.toLowerCase());
    });

    if (uniqueIncoming.length === 0) {
      alert('All items in the uploaded sheet are already present in the database.');
      setImportPreviewOpen(false);
      return;
    }

    const nextAssetsList = [...assets, ...uniqueIncoming];
    setAssets(nextAssetsList);
    setImportPreviewOpen(false);

    for (const incoming of uniqueIncoming) {
      await logTransaction(incoming.serial, 'Status', '—', incoming.status, 'XLSX Import');
    }

    alert(`Imported ${uniqueIncoming.length} unique assets successfully!`);
    setPendingImportData([]);
  };

  // Full XLSX Multi-Sheet Exporter
  const handleExportAll = () => {
    const wb = XLSX.utils.book_new();

    // 1. Assets Sheet
    const assetsHeaders = [
      'Asset ID', 'Serial Number', 'Box ID', 'Item Name', 'Brand', 'Model/Description', 
      'Quantity', 'Location', 'Owner', 'Current Possessor', 'Campaign', 'Status', 
      'Received By', 'Received On', 'Shipping To', 'Shipping Date'
    ];
    const assetsData = assets.map(a => [
      a.assetId, a.serial, a.boxId || '—', a.name, a.brand, a.desc, a.qty, a.city, a.owner, 
      a.possessor, a.campaign, a.status, a.receivedBy, a.receivedOn, a.shippingTo, a.shippingDate
    ]);
    const wsAssets = XLSX.utils.aoa_to_sheet([assetsHeaders, ...assetsData]);
    XLSX.utils.book_append_sheet(wb, wsAssets, 'Inventory Database');

    // 2. Audit Trail
    const auditHeaders = ['Timestamp', 'Serial Number', 'Field Changed', 'Previous Value', 'New Value', 'Changed By', 'Reference'];
    const auditData = auditLogs.map(l => [l.time, l.serial, l.field, l.from, l.to, l.by, l.note]);
    const wsAudit = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditData]);
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Trail');

    // 3. Gate Passes
    const gpHeaders = ['Gate Pass ID', 'Pass Type', 'Logistics Company', 'Linked Serials', 'Origin', 'Destination', 'Ship Date', 'ETA', 'Receiver', 'New Status', 'Notes'];
    const gpData = gatePasses.map(g => [g.id, g.type, g.company, g.serials.join(', '), g.origin, g.dest, g.shipDate, g.eta, g.receiver, g.newStatus, g.notes]);
    const wsGp = XLSX.utils.aoa_to_sheet([gpHeaders, ...gpData]);
    XLSX.utils.book_append_sheet(wb, wsGp, 'Gate Passes');

    XLSX.writeFile(wb, `InventoryOS_Database_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Super Admin complete cleanup
  const handleWipeDatabase = async () => {
    const answer = prompt('Type "WIPE" to completely format your database and reset it with default template records:');
    if (answer === 'WIPE') {
      setIsSyncing(true);
      try {
        if (spreadsheetId && token) {
          // Provision a brand new clean sheet
          const res = await createAndProvisionSpreadsheet(token);
          setAssets(res.assets);
          setGatePasses(res.gatePasses);
          setAuditLogs(res.auditLogs);
          setCampaigns(res.campaigns);
          alert('Database reset successful! spreadsheet cleared and sample tables loaded.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed formatting. Check Google Sheet permissions.');
      } finally {
        setIsSyncing(false);
      }
    } else {
      alert('Action cancelled.');
    }
  };

  // Download template helper
  const handleDownloadTemplate = () => {
    const headers = [
      ['Serial Number', 'Item Name', 'Brand', 'Description', 'Quantity', 'Location', 'Owner', 'Current Possession', 'Status', 'Campaign']
    ];
    const sample = [
      ['PF5QGT2K', 'Laptop', 'Lenovo', 'Lenovo Legion 5', '1', 'Bangalore', 'AFMV', 'Nikhil', 'In House', 'Redington store Activity']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'InventoryOS_Import_Template.xlsx');
  };

  // Gate Pass selection filtered assets
  const filteredGpAssets = assets.filter(a => {
    if (!gpAssetSearch) return true;
    const q = gpAssetSearch.toLowerCase();
    return (
      a.serial.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.brand || '').toLowerCase().includes(q)
    );
  });

  const toggleGpSelectedSerial = (serial: string, checked: boolean) => {
    setGpSelectedSerials(prev => {
      const next = new Set(prev);
      if (checked) next.add(serial);
      else next.delete(serial);
      return next;
    });
  };

  // Show login screen if authentication is pending
  if (needsAuth) {
    return (
      <LoginView 
        onLogin={handleLogin}
        onLoginDemo={handleLoginDemo}
        isLoggingIn={isLoggingIn}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#2D3436]">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E9ECEF] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6C5CE7] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-[#2D3436] leading-none">InventoryOS</h1>
            <span className="text-[10px] text-[#ADB5BD] font-mono tracking-widest uppercase">Sheets Integration Console</span>
          </div>
        </div>

        {/* Sync state and open spreadsheet link */}
        <div className="hidden md:block">
          <SyncStatus 
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            lastSync={lastSync}
            isSyncing={isSyncing}
            onSync={() => triggerSheetsSync()}
            isAdmin={isAdmin}
          />
        </div>

        {/* User profile & controls */}
        <div className="flex items-center gap-3">
          {/* Static Role Badge */}
          <div
            className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 border ${
              isAdmin 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-[#F1F3F5] text-[#636E72] border-[#DEE2E6]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isAdmin ? '🔐 Super Admin' : 'Field Staff'}
          </div>

          {/* User initials */}
          {user && (
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white text-xs font-bold flex items-center justify-center border border-[#DEE2E6] shadow-sm"
                title={user.email}
              >
                {user.displayName ? user.displayName.slice(0,2).toUpperCase() : 'US'}
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-[#ADB5BD] hover:text-red-600 rounded-lg transition"
                title="Log Out Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 bg-[#F1F3F5] rounded-xl hover:bg-[#E9ECEF]"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sync bar on small viewport heights */}
      <div className="block md:hidden px-4 py-2 border-b border-[#E9ECEF] bg-white">
        <SyncStatus 
          spreadsheetId={spreadsheetId}
          spreadsheetUrl={spreadsheetUrl}
          lastSync={lastSync}
          isSyncing={isSyncing}
          onSync={() => triggerSheetsSync()}
          isAdmin={isAdmin}
        />
      </div>

      {/* 2. CORE WORKSPACE LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className={`w-full md:w-64 bg-white border-r border-[#E9ECEF] flex-shrink-0 transition-all ${
          mobileMenuOpen ? 'block' : 'hidden md:block'
        }`}>
          <div className="p-4 space-y-6">
            
            {/* Tab lists */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-widest px-3 mb-2">Overview</div>
              <button 
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'dashboard' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <Grid className="w-4 h-4 shrink-0" /> Dashboard
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-widest px-3 mb-2 font-sans">Ledger Sheets</div>
              
              <button 
                onClick={() => { setActiveTab('assets'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'assets' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 shrink-0" /> Assets Ledger
                </div>
                <span className="text-[10px] font-mono bg-[#F1F3F5] text-[#636E72] rounded-full px-2 py-0.5">{assets.length}</span>
              </button>

              <button 
                onClick={() => { setActiveTab('gatepasses'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'gatepasses' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 shrink-0" /> Gate Passes
                </div>
                <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 ${activeTab === 'gatepasses' ? 'bg-white/20 text-white' : 'bg-[#F1F3F5] text-[#636E72]'}`}>
                  {gatePasses.length}
                </span>
              </button>

              <button 
                onClick={() => { setActiveTab('shipments'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'shipments' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Navigation className="w-4 h-4 shrink-0" /> Shipment Tracker
                </div>
                <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 ${activeTab === 'shipments' ? 'bg-white/20 text-white' : 'bg-[#F1F3F5] text-[#636E72]'}`}>
                  {shipments.length}
                </span>
              </button>

              <button 
                onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'audit' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <History className="w-4 h-4 shrink-0" /> Audit Trail
              </button>

              <button 
                onClick={() => { setActiveTab('campaigns'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'campaigns' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <Flag className="w-4 h-4 shrink-0" /> Campaigns
              </button>
            </div>

            {/* Admin only subcategories */}
            <div className="space-y-1.5 pt-4 border-t border-[#E9ECEF]">
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-widest px-3 mb-2 font-sans">Import & Tools</div>
              
              <button 
                onClick={() => { setActiveTab('import'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                  activeTab === 'import' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" /> Bulk Import
              </button>

              {isAdmin && (
                <button 
                  onClick={() => { setActiveTab('superadmin'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
                    activeTab === 'superadmin' ? 'bg-[#6C5CE7] text-white' : 'text-[#636E72] hover:bg-[#F8F9FA] hover:text-[#2D3436]'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" /> Super Admin
                </button>
              )}
            </div>

          </div>
        </aside>

        {/* Primary Content Panel */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* Subpage Header controls */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-[#2D3436] uppercase tracking-tight">
                {activeTab === 'dashboard' && 'Executive Summary'}
                {activeTab === 'assets' && 'Assets Ledger Registry'}
                {activeTab === 'gatepasses' && 'Gate Pass Dispatches'}
                {activeTab === 'shipments' && 'Shipment Tracking Ledger'}
                {activeTab === 'audit' && 'System Audit Trail'}
                {activeTab === 'campaigns' && 'Client Campaigns'}
                {activeTab === 'import' && 'XLSX Spreadsheet Importer'}
                {activeTab === 'superadmin' && 'Enterprise Admin controls'}
              </h2>
              <p className="text-xs text-[#636E72] font-medium">
                {activeTab === 'dashboard' && 'Live warehouse statistics, brand ratios, and logs.'}
                {activeTab === 'assets' && 'Track serial numbers, current locations, and managers.'}
                {activeTab === 'gatepasses' && 'Issue, download, and review inbound/outbound dispatches.'}
                {activeTab === 'shipments' && 'Monitor auto-created shipments, couriers, timelines, and proof of delivery.'}
                {activeTab === 'audit' && 'Track historical updates per asset.'}
                {activeTab === 'campaigns' && 'Monitor event budgets, schedules, and deployments.'}
                {activeTab === 'import' && 'Upload existing spreadsheet data with headers validation.'}
                {activeTab === 'superadmin' && 'Execute hard wipes, snapshot archives, or master backups.'}
              </p>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssetForm({
                    name: '', serial: '', brand: '', desc: '', qty: 1, city: 'Bangalore',
                    owner: '', possessor: '', status: 'In House', campaign: '',
                    receivedBy: '', receivedOn: new Date().toISOString().split('T')[0]
                  });
                  setAddAssetOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F8F9FA] text-[#2D3436] border border-[#DEE2E6] rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#6C5CE7]" /> Register Asset
              </button>
              
              <button
                onClick={() => {
                  setGpSelectedSerials(new Set());
                  setGpForm({
                    company: 'AFMV Logistics Pvt. Ltd.', type: 'outbound', origin: 'Bangalore', dest: '',
                    shipDate: new Date().toISOString().split('T')[0], eta: '', receiver: '', possessor: '',
                    newStatus: 'In Transit', notes: ''
                  });
                  setGatePassOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <Truck className="w-4 h-4 text-white" /> New Gate Pass
              </button>
            </div>
          </div>

          {/* Active Tab Router */}
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && (
              <DashboardView 
                assets={assets}
                auditLogs={auditLogs}
                campaigns={campaigns}
              />
            )}

            {activeTab === 'assets' && (
              <AssetsView 
                assets={assets}
                isAdmin={isAdmin}
                onEditAsset={handleOpenEditAsset}
                onDeleteAsset={handleDeleteAsset}
                onBulkDelete={handleBulkDelete}
              />
            )}

            {activeTab === 'gatepasses' && (
              <GatePassesView 
                gatePasses={gatePasses}
                assets={assets}
                onPreviewGatePass={handleOpenPreviewGp}
              />
            )}

            {activeTab === 'shipments' && (
              <ShipmentsView
                shipments={shipments}
                setShipments={setShipments}
                assets={assets}
                setAssets={setAssets}
                logTransaction={logTransaction}
                saveShipmentsSheet={async (updated) => {
                  await runSheetSync(async (sheetId, activeToken) => {
                    await saveShipmentsSheet(sheetId, activeToken, updated);
                  });
                }}
                saveAssetsSheet={async (updated) => {
                  await runSheetSync(async (sheetId, activeToken) => {
                    await saveAssetsSheet(sheetId, activeToken, updated);
                  });
                }}
                userEmail={user?.email}
                onOpenGatePassPreview={handleOpenPreviewGp}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailView 
                auditLogs={auditLogs}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignsView 
                campaigns={campaigns}
                assets={assets}
              />
            )}

            {activeTab === 'import' && (
              <div className="space-y-6">
                
                {/* Drag and Drop card */}
                <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm space-y-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-[#ADB5BD] font-sans">
                    Step 1: Get the Import Template
                  </h3>
                  <p className="text-xs text-[#636E72] leading-relaxed">
                    Make sure your data headers match exactly to enable automatic validation and duplication skipping.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" /> Download Import Template (.xlsx)
                  </button>
                </div>

                <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm space-y-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-[#ADB5BD] font-sans">
                    Step 2: Upload Completed Sheet
                  </h3>
                  
                  {/* Upload Drop Zone */}
                  <div className="relative border-2 border-dashed border-[#DEE2E6] hover:border-[#6C5CE7] rounded-3xl p-10 bg-[#F8F9FA] text-center transition cursor-pointer">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleXlsxUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileSpreadsheet className="w-10 h-10 text-[#ADB5BD] mx-auto mb-3" />
                    <span className="block text-xs font-bold text-[#2D3436]">
                      Drag & Drop your XLSX/CSV file here, or click to browse
                    </span>
                    <span className="block text-[10px] text-[#ADB5BD] font-mono mt-1 uppercase">
                      Supports MS Excel, Open Office, CSV formats
                    </span>
                  </div>
                </div>

              </div>
            )}

            {isAdmin && activeTab === 'superadmin' && (
              <div className="space-y-6">
                
                {/* 1. TOP ROW: USER MANAGER */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left panel: Grant Authority */}
                  <div className="lg:col-span-1 bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-display text-[#2D3436] mb-2">Grant Authority</h3>
                      <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                        Add a new Super Admin user by their registered Google/Gmail account. They will instantly gain enterprise management and spreadsheet capabilities.
                      </p>
                      
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const emailInput = form.elements.namedItem('adminEmail') as HTMLInputElement;
                        const email = emailInput.value.trim().toLowerCase();
                        if (!email) return;
                        if (!email.includes('@')) {
                          alert('Please enter a valid email address');
                          return;
                        }
                        if (adminsList.some(a => a.email.toLowerCase() === email)) {
                          alert('This email already has Super Admin access');
                          return;
                        }
                        
                        const nextAdmins = [
                          ...adminsList,
                          {
                            email,
                            role: 'Super Admin',
                            grantedBy: user?.email || 'System',
                            grantedOn: new Date().toISOString().split('T')[0]
                          }
                        ];
                        
                        setAdminsList(nextAdmins);
                        await runSheetSync(async (sheetId, activeToken) => {
                          await saveAdminsSheet(sheetId, activeToken, nextAdmins);
                        });
                        await logAdminAction('Granted Super Admin', email);
                        emailInput.value = '';
                        alert(`Super Admin authority granted successfully to ${email}`);
                      }} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#636E72] mb-1">Gmail Account *</label>
                          <input 
                            name="adminEmail"
                            type="email" 
                            required
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <Shield className="w-4 h-4" /> Grant Super Admin Role
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right panel: Authorized Admins Registry */}
                  <div className="lg:col-span-2 bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold font-display text-[#2D3436] mb-2">Enterprise Administrators</h3>
                    <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                      A list of Gmail accounts with exclusive access to the system ledger sheets, imports, and core formatting tools.
                    </p>
                    
                    <div className="overflow-x-auto border border-[#E9ECEF] rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-[#636E72] font-semibold uppercase tracking-wider text-[10px]">
                            <th className="p-3">Gmail Account</th>
                            <th className="p-3">Authorized Role</th>
                            <th className="p-3">Assigned By</th>
                            <th className="p-3">Date Granted</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9ECEF] font-medium text-[#2D3436]">
                          {adminsList.map((admin) => (
                            <tr key={admin.email} className="hover:bg-[#F8F9FA]/50 transition">
                              <td className="p-3 font-mono font-bold text-[#2D3436]">{admin.email}</td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-100">
                                  🔐 Super Admin
                                </span>
                              </td>
                              <td className="p-3 text-[#636E72]">{admin.grantedBy}</td>
                              <td className="p-3 font-mono text-xs text-[#636E72]">{admin.grantedOn}</td>
                              <td className="p-3 text-right">
                                {admin.email.toLowerCase() === 'aditya@aftermathventures.in' ? (
                                  <span className="text-[10px] text-[#ADB5BD] italic">Primary Owner</span>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Are you sure you want to revoke Super Admin status from ${admin.email}?`)) {
                                        const nextAdmins = adminsList.filter(a => a.email.toLowerCase() !== admin.email.toLowerCase());
                                        setAdminsList(nextAdmins);
                                        await runSheetSync(async () => {
                                          await saveAdminsSheet(spreadsheetId!, token!, nextAdmins);
                                        });
                                        await logAdminAction('Revoked Super Admin', admin.email);
                                        alert(`Authority successfully revoked from ${admin.email}`);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold transition"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* 2. MIDDLE ROW: ADMINISTRATIVE LOGS */}
                <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold font-display text-[#2D3436]">Administrative Activity & Sign-in Logs</h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold font-mono uppercase px-2.5 py-1 rounded-full">
                      Traceability Ledger
                    </span>
                  </div>
                  <p className="text-xs text-[#636E72] mb-4">
                    Audit trail of all administrative actions, sign-in sessions, promotions, and revokes across the entire cloud integration.
                  </p>
                  
                  <div className="overflow-x-auto border border-[#E9ECEF] rounded-2xl max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#F8F9FA] shadow-[0_1px_0_0_#E9ECEF]">
                        <tr className="text-[#636E72] font-semibold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Action Type</th>
                          <th className="p-3">Target / Entity</th>
                          <th className="p-3">Performed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9ECEF] font-medium text-[#2D3436]">
                        {adminLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-[#ADB5BD] italic">
                              No admin action records loaded. Sign in or grant privileges to generate logs.
                            </td>
                          </tr>
                        ) : (
                          adminLogs.map((log, index) => (
                            <tr key={index} className="hover:bg-[#F8F9FA]/30 transition text-xs">
                              <td className="p-3 font-mono text-[#636E72] whitespace-nowrap">{log.timestamp}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  log.action.includes('Granted') 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : log.action.includes('Revoked')
                                    ? 'bg-red-50 text-red-700 border-red-100'
                                    : log.action.includes('Wipe')
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-[#2D3436]">{log.targetEmail}</td>
                              <td className="p-3 font-mono text-xs text-[#636E72]">{log.performedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. BOTTOM ROW: UTILITY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Backups card */}
                  <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-display text-[#2D3436] mb-2">Spreadsheet Exports & Backups</h3>
                      <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                        Create complete, multi-tab snapshots of your system state including all Assets, Audit histories, and Gate Passes.
                      </p>
                    </div>
                    <button
                      onClick={handleExportAll}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export Complete Database Snapshot (.xlsx)
                    </button>
                  </div>

                  {/* Wipe card */}
                  <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500">
                    <div>
                      <h3 className="text-lg font-bold font-display text-red-950 mb-2">Hard Reset & Format</h3>
                      <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                        Wipe the current database worksheets on the spreadsheet and load the clean default template. This deletes all existing log lists.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('WARNING: This will delete ALL assets, gate passes, audit logs, campaigns, and user logs. This action is IRREVERSIBLE. Are you sure you want to perform a hard reset?')) {
                          await handleWipeDatabase();
                          await logAdminAction('Wiped Database Sheets', 'All Ledgers');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Archive className="w-4 h-4" /> Wipe Sheet & Reset defaults
                    </button>
                  </div>

                </div>

              </div>
            )}
          </div>

        </main>
      </div>

      {/* ========================================== */}
      {/* 3. MODALS AND FLOATING DIALOGS */}
      {/* ========================================== */}

      {/* A. REGISTER/ADD ASSET MODAL */}
      {addAssetOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9ECEF] rounded-3xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E9ECEF] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2D3436] font-display">Register New Asset</h3>
              <button onClick={() => setAddAssetOpen(false)} className="p-1 hover:bg-[#E9ECEF] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Item Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Laptop, Mouse"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1 flex justify-between">
                    <span>Serial Number *</span>
                    <button
                      onClick={() => setAssetForm({...assetForm, serial: Math.random().toString(36).substring(2, 10).toUpperCase()})}
                      className="text-[10px] text-[#6C5CE7] font-semibold uppercase hover:underline"
                    >
                      Generate
                    </button>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. SN-9812A"
                    value={assetForm.serial}
                    onChange={(e) => setAssetForm({...assetForm, serial: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono uppercase transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Box ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BOX-101"
                    value={assetForm.boxId}
                    onChange={(e) => setAssetForm({...assetForm, boxId: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono uppercase transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Brand</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lenovo, HP"
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({...assetForm, brand: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={assetForm.qty}
                    onChange={(e) => setAssetForm({...assetForm, qty: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#636E72] mb-1">Description / Model</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Yoga Slim 9i, HP ProBook"
                  value={assetForm.desc}
                  onChange={(e) => setAssetForm({...assetForm, desc: e.target.value})}
                  className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-sans transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Operating Location</label>
                  <select 
                    value={assetForm.city}
                    onChange={(e) => setAssetForm({...assetForm, city: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] outline-none transition"
                  >
                    <option>Bangalore</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Kochi</option>
                    <option>Chennai</option>
                    <option>Hyderabad</option>
                    <option>Patna</option>
                    <option>Gurgaon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Asset Status</label>
                  <select 
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({...assetForm, status: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] outline-none transition"
                  >
                    <option>In House</option>
                    <option>Delivered</option>
                    <option>In Transit</option>
                    <option>Ready for Pickup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Asset Owner</label>
                  <input 
                    type="text" 
                    placeholder="e.g. AFMV, Lenovo"
                    value={assetForm.owner}
                    onChange={(e) => setAssetForm({...assetForm, owner: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Current Possessor</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Nikhil, Karan"
                    value={assetForm.possessor}
                    onChange={(e) => setAssetForm({...assetForm, possessor: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Project Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lenovo AP Yoga, Red.Gaming"
                    value={assetForm.campaign}
                    onChange={(e) => setAssetForm({...assetForm, campaign: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Received On Date</label>
                  <input 
                    type="date" 
                    value={assetForm.receivedOn}
                    onChange={(e) => setAssetForm({...assetForm, receivedOn: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono transition"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E9ECEF] flex justify-end gap-2">
              <button 
                onClick={() => setAddAssetOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAsset}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Save Asset
              </button>
            </div>

          </div>
        </div>
      )}

      {/* B. EDIT ASSET MODAL WITH QR / BARCODE LABELS */}
      {editAssetOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9ECEF] rounded-3xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E9ECEF] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2D3436] font-display">Update Asset Profile</h3>
              <button onClick={() => setEditAssetOpen(false)} className="p-1 hover:bg-[#E9ECEF] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Asset Barcode Label Mockup (Vector Printable) */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#E9ECEF] text-center flex flex-col items-center">
                <div className="text-[10px] font-bold text-[#ADB5BD] font-mono uppercase mb-2">Printable Label Preview</div>
                
                {/* Barcode Mockup */}
                <div className="flex gap-[1px] justify-center h-10 w-48 mb-1.5 bg-white border border-[#E9ECEF] p-1 rounded">
                  {Array.from(assetForm.serial).map((char: any, index) => {
                    const charCode = (char as string).charCodeAt(0);
                    const widthClass = charCode % 3 === 0 ? 'w-[3px]' : charCode % 2 === 0 ? 'w-[2px]' : 'w-[1px]';
                    return <div key={index} className={`bg-black h-full ${widthClass}`} />;
                  })}
                </div>
                
                <div className="text-xs font-mono font-bold tracking-widest text-[#2D3436] mb-1.5">
                  {assetForm.serial}
                </div>
                
                <div className="text-[10px] text-[#636E72] font-sans font-medium">
                  {assetForm.name} — {assetForm.brand} {assetForm.boxId ? `(Box: ${assetForm.boxId})` : ''}
                </div>

                <button
                  onClick={() => {
                    const w = window.open('', '_blank');
                    w?.document.write(`
                      <html>
                        <head><title>Print Label</title><style>
                          body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; }
                          .barcode { display: flex; gap: 1px; height: 50px; margin-bottom: 8px; }
                          .bar { bg-color: black; background: black; height: 100%; }
                        </style></head>
                        <body onload="window.print()">
                          <div class="barcode">
                            ${Array.from(assetForm.serial).map((char: any) => {
                              const cc = (char as string).charCodeAt(0);
                              const w = cc % 3 === 0 ? '3px' : cc % 2 === 0 ? '2px' : '1px';
                              return `<div class="bar" style="width:${w}"></div>`;
                            }).join('')}
                          </div>
                          <div style="font-size:14px; font-weight:bold; letter-spacing:4px;">${assetForm.serial}</div>
                          <div style="font-size:10px; margin-top:4px;">${assetForm.name} - ${assetForm.brand}</div>
                        </body>
                      </html>
                    `);
                    w?.document.close();
                  }}
                  className="mt-3 flex items-center gap-1 text-[10px] text-[#6C5CE7] font-bold uppercase hover:underline cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Barcode Label
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Item Name</label>
                  <input 
                    type="text" 
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Serial Number (Locked)</label>
                  <input 
                    type="text" 
                    value={assetForm.serial}
                    disabled
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs bg-[#F1F3F5] text-[#636E72] font-mono uppercase outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Box ID</label>
                  <input 
                    type="text" 
                    value={assetForm.boxId}
                    onChange={(e) => setAssetForm({...assetForm, boxId: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono uppercase transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Brand</label>
                  <input 
                    type="text" 
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({...assetForm, brand: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={assetForm.qty}
                    onChange={(e) => setAssetForm({...assetForm, qty: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#636E72] mb-1">Description / Model</label>
                <textarea 
                  rows={2}
                  value={assetForm.desc}
                  onChange={(e) => setAssetForm({...assetForm, desc: e.target.value})}
                  className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Location / City</label>
                  <select 
                    value={assetForm.city}
                    onChange={(e) => setAssetForm({...assetForm, city: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] outline-none transition"
                  >
                    <option>Bangalore</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Kochi</option>
                    <option>Chennai</option>
                    <option>Hyderabad</option>
                    <option>Patna</option>
                    <option>Gurgaon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Asset Status</label>
                  <select 
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({...assetForm, status: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] outline-none transition"
                  >
                    <option>In House</option>
                    <option>Delivered</option>
                    <option>In Transit</option>
                    <option>Ready for Pickup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Owner</label>
                  <input 
                    type="text" 
                    value={assetForm.owner}
                    onChange={(e) => setAssetForm({...assetForm, owner: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Current Possessor</label>
                  <input 
                    type="text" 
                    value={assetForm.possessor}
                    onChange={(e) => setAssetForm({...assetForm, possessor: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Project Campaign Name</label>
                  <input 
                    type="text" 
                    value={assetForm.campaign}
                    onChange={(e) => setAssetForm({...assetForm, campaign: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#636E72] mb-1">Received On</label>
                  <input 
                    type="date" 
                    value={assetForm.receivedOn}
                    onChange={(e) => setAssetForm({...assetForm, receivedOn: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono transition"
                  />
                </div>
              </div>

            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E9ECEF] flex justify-end gap-2">
              <button 
                onClick={() => setEditAssetOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateAsset}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* C. CREATE GATE PASS MODAL */}
      {gatePassOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9ECEF] rounded-3xl w-full max-w-4xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E9ECEF] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2D3436] font-display">Compile Logistics Gate Pass</h3>
              <button onClick={() => setGatePassOpen(false)} className="p-1 hover:bg-[#E9ECEF] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Logistics Metadata */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Company Name</label>
                      <input 
                        type="text" 
                        value={gpForm.company}
                        onChange={(e) => setGpForm({...gpForm, company: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Pass Type</label>
                      <select 
                        value={gpForm.type}
                        onChange={(e) => setGpForm({...gpForm, type: e.target.value as 'outbound' | 'inbound'})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] outline-none transition"
                      >
                        <option value="outbound">Outbound — Dispatch</option>
                        <option value="inbound">Inbound — Receipt</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Origin *</label>
                      <input 
                        type="text" 
                        placeholder="Warehouse / City"
                        value={gpForm.origin}
                        onChange={(e) => setGpForm({...gpForm, origin: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Destination *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Delhi Site"
                        value={gpForm.dest}
                        onChange={(e) => setGpForm({...gpForm, dest: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Shipping Date</label>
                      <input 
                        type="date" 
                        value={gpForm.shipDate}
                        onChange={(e) => setGpForm({...gpForm, shipDate: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">ETA expected</label>
                      <input 
                        type="date" 
                        value={gpForm.eta}
                        onChange={(e) => setGpForm({...gpForm, eta: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none font-mono transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Receiver Name</label>
                      <input 
                        type="text" 
                        placeholder="Who signs"
                        value={gpForm.receiver}
                        onChange={(e) => setGpForm({...gpForm, receiver: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#636E72] mb-1">Assign Possessor</label>
                      <input 
                        type="text" 
                        placeholder="Who holds after move"
                        value={gpForm.possessor}
                        onChange={(e) => setGpForm({...gpForm, possessor: e.target.value})}
                        className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Optional Driver & Vehicle Info */}
                  <div className="pt-2 border-t border-[#E9ECEF]">
                    <span className="text-[11px] font-bold text-[#6C5CE7] uppercase tracking-wider block mb-2">Driver & Vehicle Details (Optional)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#636E72] mb-1">Driver Name (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Rajesh Kumar"
                          value={gpForm.driverName}
                          onChange={(e) => setGpForm({...gpForm, driverName: e.target.value})}
                          className="w-full px-2.5 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#636E72] mb-1">Driver Contact (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +91 98765..."
                          value={gpForm.driverContact}
                          onChange={(e) => setGpForm({...gpForm, driverContact: e.target.value})}
                          className="w-full px-2.5 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#636E72] mb-1">Vehicle No. (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. KA-01-EQ-9812"
                          value={gpForm.vehicleNumber}
                          onChange={(e) => setGpForm({...gpForm, vehicleNumber: e.target.value})}
                          className="w-full px-2.5 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#636E72] mb-1">Set New Status after move</label>
                    <select 
                      value={gpForm.newStatus}
                      onChange={(e) => setGpForm({...gpForm, newStatus: e.target.value})}
                      className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] outline-none transition"
                    >
                      <option>In Transit</option>
                      <option>Delivered</option>
                      <option>In House</option>
                      <option>Ready for Pickup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#636E72] mb-1">Dispatch Notes</label>
                    <textarea 
                      rows={3}
                      placeholder="Add packaging details, carrier info, etc..."
                      value={gpForm.notes}
                      onChange={(e) => setGpForm({...gpForm, notes: e.target.value})}
                      className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                    />
                  </div>
                </div>

                {/* Multi-asset selector search panel */}
                <div className="flex flex-col border border-[#E9ECEF] rounded-2xl p-4 bg-[#F8F9FA] max-h-[380px]">
                  <label className="block text-xs font-bold text-[#2D3436] mb-2">Select Assets for this dispatch *</label>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ADB5BD]" />
                    <input 
                      type="text" 
                      placeholder="Search to filter serials..."
                      value={gpAssetSearch}
                      onChange={(e) => setGpAssetSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#DEE2E6] rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {filteredGpAssets.map(a => {
                      const isSelected = gpSelectedSerials.has(a.serial);
                      return (
                        <label 
                          key={a.serial} 
                          className={`flex items-center gap-3 p-2 bg-white rounded-lg border text-xs cursor-pointer hover:border-[#6C5CE7] transition ${
                            isSelected ? 'border-[#6C5CE7] bg-[#6C5CE7]/10' : 'border-[#E9ECEF]'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleGpSelectedSerial(a.serial, e.target.checked)}
                            className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="font-mono font-bold text-[#2D3436] block text-[11px]">{a.serial}</span>
                            <span className="text-[#636E72] font-medium font-display block text-[10px] truncate max-w-[200px]">
                              {a.name} — {a.brand}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#ADB5BD] font-sans ml-auto">{a.city}</span>
                        </label>
                      );
                    })}
                    {filteredGpAssets.length === 0 && (
                      <div className="text-center py-8 text-[#ADB5BD] text-xs font-medium">
                        No matches found
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E9ECEF] text-right font-mono text-[10px] font-bold text-[#6C5CE7]">
                    {gpSelectedSerials.size} item(s) selected
                  </div>

                </div>

              </div>

            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E9ECEF] flex justify-end gap-2">
              <button 
                onClick={() => setGatePassOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleIssueGatePass}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Issue Pass & Sync
              </button>
            </div>

          </div>
        </div>
      )}

      {/* D. LOGISTICS DISPATCH PRINT VIEW MODAL */}
      {previewGpOpen && previewingGp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9ECEF] rounded-3xl w-full max-w-4xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E9ECEF] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2D3436] font-display">Gate Pass Document Preview</h3>
              <button onClick={() => setPreviewGpOpen(false)} className="p-1 hover:bg-[#E9ECEF] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              
              {/* Document Target for Print */}
              <div id="print-area" className="bg-white border border-[#DEE2E6] rounded-2xl p-8 max-w-3xl mx-auto shadow-sm text-sm">
                
                {/* Header block */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#6C5CE7] pb-6 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-[#2D3436] leading-none">{previewingGp.company}</h2>
                    <span className="text-xs text-[#ADB5BD] font-sans font-medium uppercase mt-1 block">Enterprise Asset Logistics System</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <h1 className="text-lg font-bold font-mono text-[#6C5CE7]">GATE PASS DISPATCH</h1>
                    <span className="text-xs text-[#636E72] font-semibold block mt-0.5">ID: {previewingGp.id}</span>
                    <span className="text-xs text-[#ADB5BD] block font-medium mt-0.5">Date: {previewingGp.createdDate}</span>
                  </div>
                </div>

                {/* Route Arrow Panel */}
                <div className="flex justify-between items-center bg-[#F8F9FA] rounded-2xl p-5 border border-[#E9ECEF] mb-6 text-center">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#ADB5BD] font-semibold uppercase font-sans">Origin point</span>
                    <span className="block font-bold text-[#2D3436] text-sm mt-0.5">{previewingGp.origin}</span>
                  </div>
                  <div className="px-4 text-[#6C5CE7]">
                    <svg className="w-6 h-6 transform rotate-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-[#ADB5BD] font-semibold uppercase font-sans">Destination point</span>
                    <span className="block font-bold text-[#2D3436] text-sm mt-0.5">{previewingGp.dest}</span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#F1F3F5] p-4 border border-[#E9ECEF] rounded-xl text-xs mb-6">
                  <div>
                    <span className="text-[#ADB5BD] block font-medium">Ship Date</span>
                    <span className="font-bold text-[#2D3436]">{previewingGp.shipDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#ADB5BD] block font-medium">Expected ETA</span>
                    <span className="font-bold text-[#2D3436]">{previewingGp.eta || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#ADB5BD] block font-medium">Receiver Name</span>
                    <span className="font-bold text-[#2D3436]">{previewingGp.receiver || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#ADB5BD] block font-medium">Post Status</span>
                    <span className="font-bold text-[#6C5CE7]">{previewingGp.newStatus}</span>
                  </div>
                </div>

                {/* Associated items Table */}
                <table className="w-full text-xs text-left border border-[#E9ECEF] rounded-lg overflow-hidden mb-6">
                  <thead className="bg-[#6C5CE7] text-white text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">Serial No</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {previewingGp.serials.map((s, idx) => {
                      const a = assets.find(x => x.serial === s);
                      return (
                        <tr key={s} className="hover:bg-[#F8F9FA]">
                          <td className="p-3 text-[#ADB5BD]">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-[#2D3436]">{s}</td>
                          <td className="p-3 font-semibold text-[#2D3436] font-display">
                            {a?.name || '—'} {a?.desc && <span className="text-[#ADB5BD] font-sans font-medium">— {a.desc}</span>}
                          </td>
                          <td className="p-3 font-medium text-[#636E72]">{a?.brand || '—'}</td>
                          <td className="p-3 text-right font-mono font-semibold text-[#2D3436]">{a?.qty || 1}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary counters */}
                <div className="text-right text-xs text-[#636E72] font-sans mb-10">
                  Total listed items: <span className="font-bold text-[#2D3436]">{previewingGp.serials.length}</span>
                </div>

                {/* Signature Panel */}
                <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-[#E9ECEF]">
                  <div className="text-center">
                    <div className="h-10 border-b border-[#DEE2E6] w-48 mx-auto"></div>
                    <span className="text-[10px] text-[#ADB5BD] uppercase tracking-widest font-semibold mt-2 block">
                      Authorised Dispatcher Signature
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="h-10 border-b border-[#DEE2E6] w-48 mx-auto"></div>
                    <span className="text-[10px] text-[#ADB5BD] uppercase tracking-widest font-semibold mt-2 block">
                      Carrier Receipt Confirmation
                    </span>
                  </div>
                </div>

              </div>

            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E9ECEF] flex justify-end gap-2">
              <button 
                onClick={() => setPreviewGpOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Back to List
              </button>
              
              <button 
                onClick={() => {
                  const prevTitle = document.title;
                  if (previewingGp) {
                    document.title = `GatePass_${previewingGp.id}_${(previewingGp.company || 'InventoryOS').replace(/[^a-zA-Z0-9]/g, '_')}`;
                  }
                  window.print();
                  setTimeout(() => {
                    document.title = prevTitle;
                  }, 1000);
                }}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Download / Print Gate Pass
              </button>
            </div>

          </div>
        </div>
      )}

      {/* E. BULK XLSX IMPORT PREVIEW MODAL */}
      {importPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9ECEF] rounded-3xl w-full max-w-4xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#E9ECEF] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2D3436] font-display">Confirm Bulk Spreadsheet Import</h3>
              <button onClick={() => setImportPreviewOpen(false)} className="p-1 hover:bg-[#E9ECEF] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-[#636E72] mb-4">
                We detected <span className="font-bold text-[#6C5CE7]">{pendingImportData.length} valid item(s)</span>. All items containing duplicate serial numbers already saved in the sheet will be filtered out to prevent data pollution.
              </div>

              <div className="overflow-x-auto border border-[#E9ECEF] rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] font-sans font-bold text-[#636E72] uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Serial No</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {pendingImportData.map((a) => {
                      const isDupe = assets.some(e => e.serial.toLowerCase() === a.serial.toLowerCase());
                      return (
                        <tr 
                          key={a.serial} 
                          className={`hover:bg-[#F8F9FA] ${isDupe ? 'bg-red-50/40 text-red-700 opacity-60 line-through' : ''}`}
                        >
                          <td className="p-3 font-mono font-bold">{a.serial}</td>
                          <td className="p-3 font-semibold font-display">{a.name}</td>
                          <td className="p-3">{a.brand || '—'}</td>
                          <td className="p-3 text-[#636E72] truncate max-w-xs">{a.desc || '—'}</td>
                          <td className="p-3 font-semibold">{a.city}</td>
                          <td className="p-3 font-medium text-[#ADB5BD]">{a.owner}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#E9ECEF] bg-[#F1F3F5]">
                              {isDupe ? 'Duplicate Serial (Skip)' : a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E9ECEF] flex justify-end gap-2">
              <button 
                onClick={() => { setImportPreviewOpen(false); setPendingImportData([]); }}
                className="px-4 py-2 bg-white hover:bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Abort
              </button>
              <button 
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Import Unique Records
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
