import React, { useState } from 'react';
import { Shipment, ShipmentStatus, Asset, AuditEntry } from '../types';
import { 
  Truck, Package, Search, Filter, Plus, Calendar, MapPin, CheckCircle2, 
  AlertTriangle, Clock, RefreshCw, FileText, ChevronDown, ChevronRight, 
  User, Shield, DollarSign, BarChart2, CheckSquare, Layers, Eye, ArrowUpRight,
  Send, CornerDownLeft, Box, Tag, Edit3, Check, X, ShieldAlert, Navigation
} from 'lucide-react';
import { ShipmentManifestModal } from './ShipmentManifestModal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface ShipmentsViewProps {
  shipments: Shipment[];
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  logTransaction: (serial: string, field: string, from: string, to: string, note?: string) => Promise<void>;
  saveShipmentsSheet: (shipments: Shipment[]) => Promise<void>;
  saveAssetsSheet: (assets: Asset[]) => Promise<void>;
  userEmail?: string;
  isSuperAdmin?: boolean;
  onOpenGatePassPreview?: (gatePassId: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Draft': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'Awaiting Approval': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Approved': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Packed': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Ready for Dispatch': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Dispatched': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'In Transit': { bg: 'bg-[#F3E8FF]', text: 'text-[#6C5CE7]', border: 'border-[#D8B4FE]' },
  'Reached Destination': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Delivered': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Partially Delivered': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  'Acknowledged': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  'Return Initiated': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Returning': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'Returned': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  'Closed': { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' },
  'Cancelled': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Lost': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  'Damaged': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

const PRIORITY_COLORS: Record<string, string> = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-blue-50 text-blue-600',
  'High': 'bg-amber-50 text-amber-700',
  'Urgent': 'bg-rose-100 text-rose-700 font-bold'
};

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  shipments,
  setShipments,
  assets,
  setAssets,
  logTransaction,
  saveShipmentsSheet,
  saveAssetsSheet,
  userEmail,
  isSuperAdmin = true,
  onOpenGatePassPreview
}) => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [courierFilter, setCourierFilter] = useState('All');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Expanded Rows
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);

  // Modals
  const [manifestShipment, setManifestShipment] = useState<Shipment | null>(null);
  
  // Status Update Modal
  const [statusModalShipment, setStatusModalShipment] = useState<Shipment | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: 'In Transit' as ShipmentStatus,
    currentLocation: '',
    courier: '',
    trackingNumber: '',
    driverName: '',
    driverContact: '',
    vehicleNumber: '',
    expectedDeliveryDate: '',
    remarks: ''
  });

  // Delivery Modal
  const [deliveryModalShipment, setDeliveryModalShipment] = useState<Shipment | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    receiverName: '',
    acknowledgedBy: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    condition: 'Good / Perfect',
    remarks: '',
    deliveredSerials: new Set<string>()
  });

  // Calculated Metrics
  const totalShipments = shipments.length;
  const activeShipments = shipments.filter(s => ['Dispatched', 'In Transit', 'Ready for Dispatch', 'Packed'].includes(s.status)).length;
  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length;
  const deliveredCount = shipments.filter(s => ['Delivered', 'Acknowledged'].includes(s.status)).length;
  const partiallyDeliveredCount = shipments.filter(s => s.status === 'Partially Delivered').length;
  const returnedCount = shipments.filter(s => ['Return Initiated', 'Returning', 'Returned'].includes(s.status)).length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const delayedCount = shipments.filter(s => 
    s.expectedDeliveryDate && 
    s.expectedDeliveryDate < todayStr && 
    !['Delivered', 'Acknowledged', 'Returned', 'Closed', 'Cancelled'].includes(s.status)
  ).length;

  const pendingAckCount = shipments.filter(s => s.status === 'Delivered' && !s.acknowledgedBy).length;

  // Unique Lists for Dropdowns
  const campaignsList = Array.from(new Set(shipments.map(s => s.campaign).filter(Boolean)));
  const couriersList = Array.from(new Set(shipments.map(s => s.courier).filter(Boolean)));

  // Filtered Shipments
  const filteredShipments = shipments.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      s.id.toLowerCase().includes(q) ||
      s.gatePassId.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      (s.courier || '').toLowerCase().includes(q) ||
      (s.trackingNumber || '').toLowerCase().includes(q) ||
      (s.driverName || '').toLowerCase().includes(q) ||
      (s.vehicleNumber || '').toLowerCase().includes(q) ||
      (s.receiver || '').toLowerCase().includes(q) ||
      (s.campaign || '').toLowerCase().includes(q) ||
      s.assets.some(a => a.serial.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'All' || 
      (statusFilter === 'Delayed' ? (s.expectedDeliveryDate < todayStr && !['Delivered', 'Returned', 'Closed'].includes(s.status)) : s.status === statusFilter);

    const matchPriority = priorityFilter === 'All' || s.priority === priorityFilter;
    const matchType = typeFilter === 'All' || s.type === typeFilter;
    const matchCampaign = campaignFilter === 'All' || s.campaign === campaignFilter;
    const matchCourier = courierFilter === 'All' || s.courier === courierFilter;

    return matchSearch && matchStatus && matchPriority && matchType && matchCampaign && matchCourier;
  });

  // Toggle Expanded Row
  const toggleExpand = (id: string) => {
    setExpandedShipmentId(prev => prev === id ? null : id);
  };

  // Open Status Update Modal
  const openStatusModal = (shipment: Shipment) => {
    setStatusModalShipment(shipment);
    setUpdateForm({
      status: shipment.status,
      currentLocation: shipment.currentLocation || shipment.origin,
      courier: shipment.courier || '',
      trackingNumber: shipment.trackingNumber || '',
      driverName: shipment.driverName || '',
      driverContact: shipment.driverContact || '',
      vehicleNumber: shipment.vehicleNumber || '',
      expectedDeliveryDate: shipment.expectedDeliveryDate || '',
      remarks: shipment.remarks || ''
    });
  };

  // Save Status Update
  const handleSaveStatusUpdate = async () => {
    if (!statusModalShipment) return;

    const oldStatus = statusModalShipment.status;
    const newStatus = updateForm.status;

    // Create new timeline event
    const newTimelineEvent = {
      id: `T-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      title: `Status updated to ${newStatus}`,
      status: newStatus,
      location: updateForm.currentLocation || statusModalShipment.currentLocation,
      description: updateForm.remarks || `Shipment details updated. Courier: ${updateForm.courier || 'N/A'}, Driver: ${updateForm.driverName || 'N/A'}`,
      performedBy: userEmail || 'Logistics Admin'
    };

    // Update asset status mappings if delivery or return
    let updatedAssets = [...assets];

    const newShipmentAssets = statusModalShipment.assets.map(sa => {
      let itemStatus = sa.status;
      if (newStatus === 'Delivered' || newStatus === 'Acknowledged') {
        itemStatus = 'Delivered';
      } else if (newStatus === 'In Transit' || newStatus === 'Dispatched') {
        itemStatus = 'In Transit';
      } else if (newStatus === 'Returned') {
        itemStatus = 'In House';
      } else if (newStatus === 'Lost') {
        itemStatus = 'Lost';
      } else if (newStatus === 'Damaged') {
        itemStatus = 'Maintenance';
      }
      return { ...sa, status: itemStatus };
    });

    // Also sync Asset Database statuses for these serials
    updatedAssets = updatedAssets.map(a => {
      const match = newShipmentAssets.find(sa => sa.serial === a.serial);
      if (match) {
        return {
          ...a,
          status: match.status === 'In Transit' ? 'In Transit' : match.status === 'Delivered' ? 'Delivered' : match.status === 'In House' ? 'In House' : a.status,
          city: updateForm.currentLocation || a.city,
          possessor: statusModalShipment.receiver || a.possessor
        };
      }
      return a;
    });

    const updatedShipments = shipments.map(s => {
      if (s.id === statusModalShipment.id) {
        return {
          ...s,
          status: newStatus,
          currentLocation: updateForm.currentLocation || s.currentLocation,
          courier: updateForm.courier || s.courier,
          trackingNumber: updateForm.trackingNumber || s.trackingNumber,
          driverName: updateForm.driverName || s.driverName,
          driverContact: updateForm.driverContact || s.driverContact,
          vehicleNumber: updateForm.vehicleNumber || s.vehicleNumber,
          expectedDeliveryDate: updateForm.expectedDeliveryDate || s.expectedDeliveryDate,
          actualDeliveryDate: (newStatus === 'Delivered' || newStatus === 'Acknowledged') ? (s.actualDeliveryDate || new Date().toISOString().split('T')[0]) : s.actualDeliveryDate,
          remarks: updateForm.remarks || s.remarks,
          assets: newShipmentAssets,
          timeline: [newTimelineEvent, ...s.timeline],
          lastUpdated: new Date().toLocaleString('en-IN')
        };
      }
      return s;
    });

    setShipments(updatedShipments);
    setAssets(updatedAssets);
    setStatusModalShipment(null);

    // Save sheets and log audit trail
    await saveShipmentsSheet(updatedShipments);
    await saveAssetsSheet(updatedAssets);

    for (const sa of newShipmentAssets) {
      await logTransaction(sa.serial, 'Shipment Status', oldStatus, newStatus, `Shipment ${statusModalShipment.id}`);
    }
  };

  // Open Delivery Confirmation Modal
  const openDeliveryModal = (shipment: Shipment) => {
    setDeliveryModalShipment(shipment);
    const initialSerials = new Set(shipment.assets.map(a => a.serial));
    setDeliveryForm({
      receiverName: shipment.receiver || '',
      acknowledgedBy: shipment.receiver || userEmail || '',
      deliveryDate: new Date().toISOString().split('T')[0],
      condition: 'Good / Perfect',
      remarks: 'Delivered and verified at destination.',
      deliveredSerials: initialSerials
    });
  };

  // Save Delivery Confirmation
  const handleConfirmDelivery = async () => {
    if (!deliveryModalShipment) return;

    const totalCount = deliveryModalShipment.assets.length;
    const deliveredCount = deliveryForm.deliveredSerials.size;

    const isPartial = deliveredCount < totalCount && deliveredCount > 0;
    const newStatus: ShipmentStatus = isPartial ? 'Partially Delivered' : 'Delivered';

    const updatedShipmentAssets = deliveryModalShipment.assets.map(sa => {
      const isDelivered = deliveryForm.deliveredSerials.has(sa.serial);
      return {
        ...sa,
        status: isDelivered ? 'Delivered' : 'Pending',
        received: isDelivered,
        receivedDate: isDelivered ? deliveryForm.deliveryDate : sa.receivedDate
      };
    });

    // Update global assets
    const updatedGlobalAssets = assets.map(a => {
      if (deliveryForm.deliveredSerials.has(a.serial)) {
        return {
          ...a,
          status: 'Delivered',
          city: deliveryModalShipment.destination,
          receivedBy: deliveryForm.receiverName || a.receivedBy,
          receivedOn: deliveryForm.deliveryDate
        };
      }
      return a;
    });

    const newTimelineEvent = {
      id: `T-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      title: isPartial ? `Partial Delivery Confirmed (${deliveredCount}/${totalCount})` : 'Delivery Confirmed & Acknowledged',
      status: newStatus,
      location: deliveryModalShipment.destination,
      description: `Receiver: ${deliveryForm.receiverName}, Acknowledged By: ${deliveryForm.acknowledgedBy}. Condition: ${deliveryForm.condition}. ${deliveryForm.remarks}`,
      performedBy: deliveryForm.acknowledgedBy || userEmail || 'System'
    };

    const updatedShipments = shipments.map(s => {
      if (s.id === deliveryModalShipment.id) {
        return {
          ...s,
          status: newStatus,
          actualDeliveryDate: deliveryForm.deliveryDate,
          receiver: deliveryForm.receiverName || s.receiver,
          receiverSignature: `${deliveryForm.receiverName} (Signed)`,
          acknowledgedBy: deliveryForm.acknowledgedBy,
          condition: deliveryForm.condition,
          remarks: deliveryForm.remarks ? `${s.remarks ? s.remarks + ' | ' : ''}${deliveryForm.remarks}` : s.remarks,
          deliveredAssetsCount: deliveredCount,
          pendingAssetsCount: totalCount - deliveredCount,
          assets: updatedShipmentAssets,
          timeline: [newTimelineEvent, ...s.timeline],
          lastUpdated: new Date().toLocaleString('en-IN')
        };
      }
      return s;
    });

    setShipments(updatedShipments);
    setAssets(updatedGlobalAssets);
    setDeliveryModalShipment(null);

    await saveShipmentsSheet(updatedShipments);
    await saveAssetsSheet(updatedGlobalAssets);

    for (const serial of Array.from(deliveryForm.deliveredSerials)) {
      await logTransaction(serial, 'Status', 'In Transit', 'Delivered', `Shipment ${deliveryModalShipment.id} Delivered`);
    }
  };

  // Helper render Progress Bar
  const renderProgressBar = (status: ShipmentStatus) => {
    const stages = [
      { name: 'Created', done: true },
      { name: 'Approved', done: !['Draft', 'Awaiting Approval'].includes(status) },
      { name: 'Packed', done: !['Draft', 'Awaiting Approval', 'Approved'].includes(status) },
      { name: 'Dispatched', done: ['Dispatched', 'In Transit', 'Reached Destination', 'Delivered', 'Partially Delivered', 'Acknowledged', 'Return Initiated', 'Returning', 'Returned', 'Closed'].includes(status) },
      { name: 'Delivered', done: ['Delivered', 'Partially Delivered', 'Acknowledged', 'Return Initiated', 'Returning', 'Returned', 'Closed'].includes(status) },
      { name: 'Acknowledged', done: ['Acknowledged', 'Closed'].includes(status) }
    ];

    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 my-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
          <span>Shipment Progress Lifecycle</span>
          <span className="font-bold text-[#6C5CE7]">{status}</span>
        </div>
        <div className="relative flex items-center justify-between">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
          {stages.map((st, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                st.done ? 'bg-[#6C5CE7] text-white ring-4 ring-[#6C5CE7]/20' : 'bg-slate-200 text-slate-500'
              }`}>
                {st.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-semibold ${st.done ? 'text-slate-900' : 'text-slate-400'}`}>{st.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Chart Data Preparation
  const statusDataMap = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartStatusData = Object.entries(statusDataMap).map(([name, value]) => ({ name, value }));

  const cityDataMap = shipments.reduce((acc, s) => {
    acc[s.destination] = (acc[s.destination] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartCityData = Object.entries(cityDataMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#6C5CE7]/10 text-[#6C5CE7]">
              Supply Chain & Logistics Engine
            </span>
            <span className="text-xs font-mono text-slate-400">Live Tracker</span>
          </div>
          <h1 className="text-xl font-black text-[#2D3436] tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#6C5CE7]" />
            Shipment Tracking Dashboard
          </h1>
          <p className="text-xs text-[#636E72] mt-0.5">
            Auto-created shipment records linked directly to Gate Passes, courier tracking, asset chain of custody, and Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              showAnalytics ? 'bg-[#6C5CE7] text-white' : 'bg-[#F1F3F5] text-[#2D3436] hover:bg-[#E9ECEF]'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            {showAnalytics ? 'Hide Analytics' : 'Logistics Analytics'}
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        <div className="p-3 bg-white rounded-2xl border border-[#DEE2E6] shadow-xs">
          <div className="text-[10px] font-bold text-[#636E72] uppercase tracking-wider mb-1">Total Shipments</div>
          <div className="text-xl font-black text-[#2D3436]">{totalShipments}</div>
          <div className="text-[10px] text-slate-400 font-medium">Recorded</div>
        </div>

        <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 shadow-xs">
          <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">Active / Dispatched</div>
          <div className="text-xl font-black text-purple-900">{activeShipments}</div>
          <div className="text-[10px] text-purple-600 font-medium">In Logistics</div>
        </div>

        <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">In Transit</div>
          <div className="text-xl font-black text-indigo-900">{inTransitCount}</div>
          <div className="text-[10px] text-indigo-600 font-medium">En Route</div>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Delivered</div>
          <div className="text-xl font-black text-emerald-900">{deliveredCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Completed</div>
        </div>

        <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Partially Delivered</div>
          <div className="text-xl font-black text-amber-900">{partiallyDeliveredCount}</div>
          <div className="text-[10px] text-amber-600 font-medium">Split Lots</div>
        </div>

        <div className="p-3 bg-slate-100 rounded-2xl border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Returned</div>
          <div className="text-xl font-black text-slate-900">{returnedCount}</div>
          <div className="text-[10px] text-slate-500 font-medium">Back in WH</div>
        </div>

        <div className={`p-3 rounded-2xl border shadow-xs ${delayedCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-white border-[#DEE2E6]'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Delayed / Overdue</div>
          <div className="text-xl font-black">{delayedCount}</div>
          <div className="text-[10px] font-medium opacity-80">Past ETA</div>
        </div>

        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Pending Ack.</div>
          <div className="text-xl font-black text-blue-900">{pendingAckCount}</div>
          <div className="text-[10px] text-blue-600 font-medium">Needs Sign</div>
        </div>

      </div>

      {/* Toggleable Analytics Section */}
      {showAnalytics && (
        <div className="p-6 bg-white rounded-2xl border border-[#DEE2E6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#2D3436] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#6C5CE7]" />
              Logistics & Distribution Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3">Shipments by Status</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartStatusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6C5CE7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3">Shipments by Destination City</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartCityData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Shipment ID, Gate Pass, Serial, Courier, Driver, City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs bg-slate-50 text-[#2D3436] font-medium outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Partially Delivered">Partially Delivered</option>
              <option value="Returned">Returned</option>
              <option value="Delayed">Delayed / Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs bg-slate-50 text-[#2D3436] font-medium outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* Campaign Filter */}
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs bg-slate-50 text-[#2D3436] font-medium outline-none cursor-pointer"
            >
              <option value="All">All Campaigns</option>
              {campaignsList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Courier Filter */}
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs bg-slate-50 text-[#2D3436] font-medium outline-none cursor-pointer"
            >
              <option value="All">All Couriers</option>
              {couriersList.map(cr => <option key={cr} value={cr}>{cr}</option>)}
            </select>

            {(searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || campaignFilter !== 'All' || courierFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setCampaignFilter('All');
                  setCourierFilter('All');
                }}
                className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Main Shipments Table */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E9ECEF] flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#2D3436] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#6C5CE7]" />
            Shipments Ledger ({filteredShipments.length} Records)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Click row to expand breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#636E72] font-semibold text-[11px] uppercase tracking-wider border-b border-[#E9ECEF]">
                <th className="p-3.5 w-10"></th>
                <th className="p-3.5">Shipment ID</th>
                <th className="p-3.5">Gate Pass #</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Priority / Type</th>
                <th className="p-3.5">Route (Origin ➔ Dest)</th>
                <th className="p-3.5">Courier & Tracking</th>
                <th className="p-3.5">Driver & Vehicle</th>
                <th className="p-3.5">Dispatch / ETA</th>
                <th className="p-3.5">Receiver</th>
                <th className="p-3.5 text-center">Assets</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF] text-[#2D3436]">
              {filteredShipments.map((s) => {
                const isExpanded = expandedShipmentId === s.id;
                const statusStyle = STATUS_COLORS[s.status] || { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
                const priorityStyle = PRIORITY_COLORS[s.priority] || 'bg-slate-100 text-slate-600';
                const isOverdue = s.expectedDeliveryDate && s.expectedDeliveryDate < todayStr && !['Delivered', 'Acknowledged', 'Returned', 'Closed', 'Cancelled'].includes(s.status);

                return (
                  <React.Fragment key={s.id}>
                    
                    {/* Main Row */}
                    <tr 
                      onClick={() => toggleExpand(s.id)} 
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${isExpanded ? 'bg-purple-50/30' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#6C5CE7]" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </td>

                      <td className="p-3.5 font-mono font-black text-[#6C5CE7] text-xs">
                        {s.id}
                      </td>

                      <td className="p-3.5 font-mono text-slate-600">
                        {onOpenGatePassPreview ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenGatePassPreview(s.gatePassId);
                            }}
                            className="hover:underline text-[#6C5CE7] font-semibold cursor-pointer"
                          >
                            {s.gatePassId}
                          </button>
                        ) : (
                          s.gatePassId
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />}
                          {s.status}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold w-max ${priorityStyle}`}>
                            {s.priority}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">
                            {s.type}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-semibold text-xs">
                          <span>{s.origin}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="text-purple-700">{s.destination}</span>
                        </div>
                        {s.campaign && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{s.campaign}</div>}
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-xs truncate max-w-[130px]">{s.courier || 'AFMV Transport'}</div>
                        <div className="font-mono text-[10px] text-purple-600 font-bold">{s.trackingNumber || 'N/A'}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-xs">{s.driverName || '—'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{s.vehicleNumber || '—'}</div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px]">
                        <div>Dispatch: <span className="font-semibold">{s.dispatchDate || '—'}</span></div>
                        <div className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                          ETA: {s.expectedDeliveryDate || '—'}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-xs">{s.receiver || '—'}</div>
                        <div className="text-[10px] text-slate-400">{s.currentPossessor ? `With: ${s.currentPossessor}` : ''}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-800 text-xs">
                          {s.totalAssets}
                        </span>
                      </td>

                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => openStatusModal(s)}
                                title="Update Status / Logistics"
                                className="p-1.5 hover:bg-purple-50 text-purple-700 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => openDeliveryModal(s)}
                                title="Confirm Delivery / Receipt"
                                className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setManifestShipment(s)}
                            title="Print Shipment Manifest"
                            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b-2 border-purple-200">
                        <td colSpan={12} className="p-6">
                          <div className="space-y-6">
                            
                            {/* Progress Lifecycle Bar */}
                            {renderProgressBar(s.status)}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              
                              {/* Asset Breakdown Table */}
                              <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                  <h4 className="text-xs font-bold text-[#2D3436] uppercase tracking-wider flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#6C5CE7]" />
                                    Shipment Asset Items ({s.assets.length})
                                  </h4>
                                  <span className="text-[11px] text-slate-400">Delivered: {s.deliveredAssetsCount || 0} / Pending: {s.pendingAssetsCount || s.totalAssets}</span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase border-b border-slate-200">
                                        <th className="p-2">Serial Number</th>
                                        <th className="p-2">Box ID</th>
                                        <th className="p-2">Item Name</th>
                                        <th className="p-2">Brand</th>
                                        <th className="p-2 text-center">Qty</th>
                                        <th className="p-2">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-800">
                                      {s.assets.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                          <td className="p-2 font-mono font-bold text-[#6C5CE7]">{item.serial}</td>
                                          <td className="p-2 font-mono font-semibold text-slate-600">{item.boxId || '—'}</td>
                                          <td className="p-2 font-bold">{item.name}</td>
                                          <td className="p-2 text-slate-500">{item.brand}</td>
                                          <td className="p-2 text-center font-bold font-mono">{item.qty}</td>
                                          <td className="p-2">
                                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                                              item.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                                            }`}>
                                              {item.status || 'In Transit'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Timeline Sidebar */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                <h4 className="text-xs font-bold text-[#2D3436] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  Shipment Activity Timeline
                                </h4>

                                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                                  {s.timeline.map((event, idx) => (
                                    <div key={event.id || idx} className="relative pl-5 border-l-2 border-purple-300">
                                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#6C5CE7]"></div>
                                      <div className="text-[11px] font-bold text-slate-800">{event.title}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{event.timestamp} • {event.location || s.currentLocation}</div>
                                      <div className="text-[11px] text-slate-600 mt-0.5">{event.description}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>

                          </div>
                        </td>
                      </tr>
                    )}

                  </React.Fragment>
                );
              })}

              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-12 text-center">
                    <p className="text-slate-500 font-medium text-sm mb-1">No shipments matched your search or active filters</p>
                    <p className="text-xs text-slate-400">Try resetting search parameters or issue a new Gate Pass to auto-create shipments.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STATUS & LOGISTICS UPDATE MODAL */}
      {statusModalShipment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#2D3436]">Update Shipment #{statusModalShipment.id}</h3>
                <p className="text-xs text-slate-400 font-mono">Linked Gate Pass: {statusModalShipment.gatePassId}</p>
              </div>
              <button onClick={() => setStatusModalShipment(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Shipment Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as ShipmentStatus })}
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-xl text-xs font-bold bg-purple-50 text-purple-900 outline-none"
                >
                  <option value="Packed">Packed</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Reached Destination">Reached Destination</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Acknowledged">Acknowledged</option>
                  <option value="Return Initiated">Return Initiated</option>
                  <option value="Returning">Returning</option>
                  <option value="Returned">Returned</option>
                  <option value="Lost">Lost</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Location</label>
                  <input
                    type="text"
                    value={updateForm.currentLocation}
                    onChange={(e) => setUpdateForm({ ...updateForm, currentLocation: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none"
                    placeholder="e.g. Delhi Hub"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={updateForm.expectedDeliveryDate}
                    onChange={(e) => setUpdateForm({ ...updateForm, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Courier Partner</label>
                  <input
                    type="text"
                    value={updateForm.courier}
                    onChange={(e) => setUpdateForm({ ...updateForm, courier: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none"
                    placeholder="e.g. Blue Dart"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={updateForm.trackingNumber}
                    onChange={(e) => setUpdateForm({ ...updateForm, trackingNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none font-mono"
                    placeholder="e.g. BD-9988110"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={updateForm.driverName}
                    onChange={(e) => setUpdateForm({ ...updateForm, driverName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Contact</label>
                  <input
                    type="text"
                    value={updateForm.driverContact}
                    onChange={(e) => setUpdateForm({ ...updateForm, driverContact: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle No.</label>
                  <input
                    type="text"
                    value={updateForm.vehicleNumber}
                    onChange={(e) => setUpdateForm({ ...updateForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Update Notes / Log Remark</label>
                <textarea
                  value={updateForm.remarks}
                  onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none"
                  placeholder="Details regarding this status update..."
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStatusModalShipment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatusUpdate}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Save & Append Timeline
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELIVERY CONFIRMATION MODAL */}
      {deliveryModalShipment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#2D3436]">Delivery Confirmation: #{deliveryModalShipment.id}</h3>
                <p className="text-xs text-emerald-600 font-semibold">Destination: {deliveryModalShipment.destination}</p>
              </div>
              <button onClick={() => setDeliveryModalShipment(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Receiver Name</label>
                  <input
                    type="text"
                    value={deliveryForm.receiverName}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Acknowledged By</label>
                  <input
                    type="text"
                    value={deliveryForm.acknowledgedBy}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, acknowledgedBy: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none font-bold text-purple-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Actual Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryForm.deliveryDate}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Package Condition</label>
                  <select
                    value={deliveryForm.condition}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, condition: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none bg-slate-50 font-semibold"
                  >
                    <option value="Good / Perfect">Good / Perfect</option>
                    <option value="Minor Box Wear">Minor Box Wear</option>
                    <option value="Damaged Outer Packaging">Damaged Outer Packaging</option>
                    <option value="Missing Items (Partial)">Missing Items (Partial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Verify Delivered Assets (Uncheck if missing/partial)</label>
                <div className="max-h-36 overflow-y-auto border border-[#DEE2E6] rounded-xl p-2 space-y-1 bg-slate-50">
                  {deliveryModalShipment.assets.map((item) => {
                    const isChecked = deliveryForm.deliveredSerials.has(item.serial);
                    return (
                      <label key={item.serial} className="flex items-center gap-2 text-xs p-1 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = new Set(deliveryForm.deliveredSerials);
                            if (e.target.checked) next.add(item.serial);
                            else next.delete(item.serial);
                            setDeliveryForm({ ...deliveryForm, deliveredSerials: next });
                          }}
                          className="rounded text-[#6C5CE7]"
                        />
                        <span className="font-mono font-bold text-[#6C5CE7]">{item.serial}</span>
                        <span className="text-slate-700 font-semibold truncate">{item.name} ({item.brand})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Remarks / Acknowledgement Note</label>
                <textarea
                  value={deliveryForm.remarks}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeliveryModalShipment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Delivery
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINT MANIFEST MODAL */}
      {manifestShipment && (
        <ShipmentManifestModal
          shipment={manifestShipment}
          assetsDatabase={assets}
          onClose={() => setManifestShipment(null)}
        />
      )}

    </div>
  );
};
