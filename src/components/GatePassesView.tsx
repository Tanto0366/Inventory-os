import React, { useState } from 'react';
import { GatePass, Asset } from '../types';
import { Truck, MapPin, Calendar, Clipboard, Download, Eye, FileText, ArrowRight } from 'lucide-react';

interface GatePassesViewProps {
  gatePasses: GatePass[];
  assets: Asset[];
  onPreviewGatePass: (gp: GatePass) => void;
}

export default function GatePassesView({
  gatePasses,
  assets,
  onPreviewGatePass
}: GatePassesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter gate passes
  const filteredGP = gatePasses.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.id.toLowerCase().includes(q) ||
      g.origin.toLowerCase().includes(q) ||
      g.dest.toLowerCase().includes(q) ||
      g.receiver.toLowerCase().includes(q) ||
      g.company.toLowerCase().includes(q) ||
      g.serials.some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Search Header */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl p-5 shadow-sm">
        <input 
          type="text" 
          placeholder="Search gate passes by ID, Origin, Destination, Receiver, Company or Serial number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-sm text-[#2D3436] outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 font-sans placeholder-[#ADB5BD] transition"
        />
      </div>

      {/* Grid List */}
      <div className="space-y-4">
        {filteredGP.map((gp) => {
          const passAssets = gp.serials.map(s => assets.find(a => a.serial === s)).filter(Boolean) as Asset[];
          const isOutbound = gp.type === 'outbound';

          return (
            <div key={gp.id} className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
              
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9ECEF] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-base text-[#6C5CE7]">{gp.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isOutbound ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {gp.type}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#6C5CE7] border border-[#E9ECEF]">
                    {gp.newStatus}
                  </span>
                  
                  <button
                    onClick={() => onPreviewGatePass(gp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white text-xs font-semibold rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> PDF Preview
                  </button>
                </div>
              </div>

              {/* Grid Body */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                
                <div>
                  <div className="text-[#ADB5BD] mb-1 font-sans uppercase tracking-wider font-semibold text-[10px]">Logistics Company</div>
                  <div className="font-semibold text-[#2D3436]">{gp.company || 'AFMV Logistics Pvt. Ltd.'}</div>
                </div>

                <div>
                  <div className="text-[#ADB5BD] mb-1 font-sans uppercase tracking-wider font-semibold text-[10px]">Route</div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#2D3436]">
                    <span>{gp.origin}</span>
                    <ArrowRight className="w-3 h-3 text-[#ADB5BD] shrink-0" />
                    <span>{gp.dest}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[#ADB5BD] mb-1 font-sans uppercase tracking-wider font-semibold text-[10px]">Schedule</div>
                  <div className="font-semibold text-[#2D3436]">
                    Ship Date: {gp.shipDate || '—'}
                    {gp.eta && <span className="block text-[#636E72] font-normal">ETA: {gp.eta}</span>}
                  </div>
                </div>

                <div>
                  <div className="text-[#ADB5BD] mb-1 font-sans uppercase tracking-wider font-semibold text-[10px]">Receiver / Possessor</div>
                  <div className="font-semibold text-[#2D3436]">
                    {gp.receiver || '—'}
                    {gp.possessor && <span className="block text-[#636E72] font-normal">Assigned: {gp.possessor}</span>}
                  </div>
                </div>

              </div>

              {/* Collapsible Assets Subtable */}
              <div className="mt-4 pt-4 border-t border-[#E9ECEF]">
                <div className="text-[#ADB5BD] mb-2 font-sans uppercase tracking-wider font-semibold text-[10px]">
                  Assets on this pass ({passAssets.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {passAssets.map((a) => (
                    <div key={a.serial} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#F1F3F5] hover:bg-[#E9ECEF]/80 transition">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#6C5CE7] bg-white border border-[#DEE2E6] px-1.5 py-0.5 rounded text-[10px]">
                          {a.serial}
                        </span>
                        <span className="font-semibold text-[#2D3436] font-display">
                          {a.name}
                        </span>
                        {a.desc && <span className="text-[#ADB5BD] font-medium font-sans">— {a.desc}</span>}
                      </div>
                      <span className="font-mono text-[#ADB5BD] text-[10px]">{a.brand}</span>
                    </div>
                  ))}
                  {passAssets.length === 0 && (
                    <div className="text-xs text-red-500 font-medium">
                      ⚠ The assets linked to this gate pass have been deleted.
                    </div>
                  )}
                </div>
              </div>

              {/* Notes footer */}
              {gp.notes && (
                <div className="mt-3 p-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl text-xs text-[#636E72] leading-relaxed">
                  <span className="font-semibold text-[#2D3436]">Dispatch Notes:</span> {gp.notes}
                </div>
              )}

            </div>
          );
        })}

        {filteredGP.length === 0 && (
          <div className="text-center p-12 bg-white border border-[#E9ECEF] rounded-3xl shadow-sm text-[#ADB5BD]">
            No gate passes found matching your query
          </div>
        )}
      </div>

    </div>
  );
}
