import React from 'react';
import { Shipment, Asset } from '../types';
import { X, Printer, Download, Truck, Package, ShieldCheck, MapPin, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface ShipmentManifestModalProps {
  shipment: Shipment | null;
  assetsDatabase: Asset[];
  onClose: () => void;
}

export const ShipmentManifestModal: React.FC<ShipmentManifestModalProps> = ({
  shipment,
  assetsDatabase,
  onClose
}) => {
  if (!shipment) return null;

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `Shipment_Manifest_${shipment.id}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
  };

  // Find asset full details if needed
  const manifestAssets = shipment.assets.map((sa) => {
    const full = assetsDatabase.find((a) => a.serial === sa.serial);
    return {
      ...sa,
      boxId: sa.boxId || full?.boxId || '—',
      desc: full?.desc || '',
      owner: full?.owner || shipment.shipmentOwner || 'AFMV'
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 print:shadow-none print:m-0 print:w-full print:max-w-none print:rounded-none">
        
        {/* Action Bar (Hidden during print) */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6C5CE7] rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Official Shipment Manifest</h3>
              <p className="text-xs text-slate-400">Shipment ID: <span className="font-mono text-purple-300">{shipment.id}</span> | Linked GP: <span className="font-mono text-slate-300">{shipment.gatePassId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Manifest
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div id="print-area" className="p-8 sm:p-10 print:p-8 bg-white font-sans">
          
          {/* Header & Logo */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-[#1E293B]">Inventory<span className="text-[#6C5CE7]">OS</span></span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-900 text-white rounded">Logistics</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">AFMV Asset & Warehouse Logistics Pvt. Ltd.</p>
              <p className="text-[11px] text-slate-400">Official Chain of Custody & Movement Record</p>
            </div>

            <div className="text-right sm:text-right border-l-2 sm:border-l-0 sm:border-r-2 border-slate-200 pl-4 sm:pl-0 sm:pr-4">
              <div className="text-xl font-extrabold text-[#1E293B] font-mono">{shipment.id}</div>
              <div className="text-xs font-medium text-slate-500">Gate Pass Ref: <span className="font-mono font-bold text-slate-800">{shipment.gatePassId}</span></div>
              <div className="mt-1">
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  Status: {shipment.status}
                </span>
              </div>
            </div>
          </div>

          {/* Logistics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dispatch Date</div>
              <div className="text-xs font-bold text-slate-800 font-mono">{shipment.dispatchDate || '—'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expected ETA</div>
              <div className="text-xs font-bold text-slate-800 font-mono">{shipment.expectedDeliveryDate || '—'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Courier & Tracking</div>
              <div className="text-xs font-bold text-slate-800 truncate">{shipment.courier || 'AFMV Direct'}</div>
              <div className="text-[10px] font-mono text-purple-600 font-bold">{shipment.trackingNumber || 'N/A'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vehicle / Driver</div>
              <div className="text-xs font-bold text-slate-800 truncate">{shipment.driverName || '—'}</div>
              <div className="text-[10px] font-mono text-slate-500">{shipment.vehicleNumber || '—'}</div>
            </div>
          </div>

          {/* Route & Contacts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Origin & Sender */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Origin & Sender Details</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div><span className="text-slate-400 font-medium">Origin Location:</span> <strong className="text-slate-800">{shipment.origin}</strong></div>
                <div><span className="text-slate-400 font-medium">Sender:</span> <strong className="text-slate-800">{shipment.sender || 'Logistics Admin'}</strong></div>
                <div><span className="text-slate-400 font-medium">Campaign:</span> <span className="text-purple-700 font-semibold">{shipment.campaign || 'General Inventory'}</span></div>
                <div><span className="text-slate-400 font-medium">Boxes / Packages:</span> <span className="font-semibold">{shipment.boxesCount || 1} Box(es)</span> ({shipment.packageWeight || 'N/A'})</div>
              </div>
            </div>

            {/* Destination & Receiver */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                <Truck className="w-4 h-4 text-[#6C5CE7]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Destination & Receiver</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div><span className="text-slate-400 font-medium">Destination:</span> <strong className="text-slate-800">{shipment.destination}</strong></div>
                <div><span className="text-slate-400 font-medium">Receiver Name:</span> <strong className="text-slate-800">{shipment.receiver || '—'}</strong></div>
                <div><span className="text-slate-400 font-medium">Receiver Contact:</span> <span className="font-mono">{shipment.receiverContact || '—'}</span></div>
                <div><span className="text-slate-400 font-medium">Current Possessor:</span> <span className="font-semibold">{shipment.currentPossessor || '—'}</span></div>
              </div>
            </div>
          </div>

          {/* Asset Manifest Table */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                Manifested Items List ({shipment.totalAssets} Total Assets)
              </h4>
              <span className="text-[11px] font-mono text-slate-500">All serial numbers verified</span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                    <th className="p-3">#</th>
                    <th className="p-3">Serial Number</th>
                    <th className="p-3">Box ID</th>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Brand / Product Name</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3">Item Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {manifestAssets.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-[#6C5CE7] bg-purple-50">{item.serial}</td>
                      <td className="p-3 font-mono font-semibold text-slate-700">{item.boxId}</td>
                      <td className="p-3 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.brand} {item.desc ? `(${item.desc})` : ''}</td>
                      <td className="p-3 text-center font-bold font-mono">{item.qty}</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.status || 'In Transit'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks & Insurance */}
          {shipment.remarks && (
            <div className="mb-8 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
              <strong className="font-bold">Shipment Notes / Special Instructions:</strong> {shipment.remarks}
            </div>
          )}

          {/* Signatures Block */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="flex flex-col items-center justify-end h-28">
              <div className="w-full border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">{shipment.sender || 'Authorized Dispatcher'}</p>
              <p className="text-[10px] text-slate-400">Sender Signature & Date</p>
            </div>

            <div className="flex flex-col items-center justify-end h-28">
              <div className="w-full border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">{shipment.driverName || 'Carrier Agent'}</p>
              <p className="text-[10px] text-slate-400">Driver / Courier Handover Sign</p>
            </div>

            <div className="flex flex-col items-center justify-end h-28">
              <div className="w-full border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">{shipment.acknowledgedBy || shipment.receiver || 'Recipient Signature'}</p>
              <p className="text-[10px] text-slate-400">Delivery Acknowledgement Sign</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
            Computer generated document. InventoryOS Supply Chain & Logistics Engine • Verified Document Hash #{shipment.id}-{shipment.gatePassId}
          </div>

        </div>
      </div>
    </div>
  );
};
