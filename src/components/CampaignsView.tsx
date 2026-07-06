import React from 'react';
import { Campaign, Asset } from '../types';
import { Flag, Award, Calendar, CircleDollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CampaignsViewProps {
  campaigns: Campaign[];
  assets: Asset[];
}

export default function CampaignsView({ campaigns, assets }: CampaignsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((camp) => {
        // Query assigned assets dynamically
        const assigned = assets.filter(a => a.campaign === camp.name);
        const deployedCount = assigned.filter(a => a.status === 'Delivered' || a.status === 'In Transit').length;
        const totalUnits = assigned.reduce((sum, a) => sum + (a.qty || 1), 0);
        const pct = assigned.length > 0 ? Math.round((deployedCount / assigned.length) * 100) : 0;

        return (
          <div key={camp.name} className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold font-display text-[#2D3436] mb-1 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-[#6C5CE7] shrink-0" />
                    {camp.name}
                  </h3>
                  <div className="text-xs font-semibold text-[#ADB5BD] uppercase tracking-wide">
                    Client: {camp.client || 'Internal'}
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  camp.status === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {camp.status || 'Active'}
                </span>
              </div>

              {/* Description */}
              {camp.description && (
                <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                  {camp.description}
                </p>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-[#F8F9FA] p-4 rounded-2xl border border-[#E9ECEF]">
                <div>
                  <div className="text-[#ADB5BD] mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </div>
                  <div className="font-semibold text-[#2D3436]">
                    {camp.startDate || '—'} to {camp.endDate || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[#ADB5BD] mb-1 flex items-center gap-1">
                    <CircleDollarSign className="w-3.5 h-3.5" /> Budget Alloc.
                  </div>
                  <div className="font-semibold text-[#2D3436] font-mono">
                    {camp.budget || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[#ADB5BD] mb-1">Campaign Lead</div>
                  <div className="font-semibold text-[#2D3436]">{camp.owner || '—'}</div>
                </div>

                <div>
                  <div className="text-[#ADB5BD] mb-1">Total Assigned</div>
                  <div className="font-semibold text-[#2D3436] font-mono">
                    {assigned.length} assets ({totalUnits} units)
                  </div>
                </div>
              </div>
            </div>

            {/* Progress / Utilization bar */}
            <div className="space-y-2 mt-auto">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#636E72]">Deployment Rate</span>
                <span className="font-mono font-bold text-[#6C5CE7]">
                  {deployedCount} / {assigned.length} deployed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-[#F1F3F5] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#6C5CE7] rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#636E72] w-8 text-right">{pct}%</span>
              </div>

              {/* Sub-list of associated assets */}
              {assigned.length > 0 ? (
                <div className="mt-4 pt-3 border-t border-[#E9ECEF]">
                  <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider mb-2">
                    Linked Serials
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {assigned.map((a) => (
                      <span 
                        key={a.serial}
                        className="inline-block px-2 py-0.5 text-[10px] font-bold font-mono bg-white border border-[#DEE2E6] text-[#636E72]"
                        title={`${a.name} (${a.status})`}
                      >
                        {a.serial}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center py-2 text-[#ADB5BD] text-[10px] italic border-t border-[#E9ECEF]">
                  No assets currently tied to this campaign. Update asset properties to link.
                </div>
              )}
            </div>

          </div>
        );
      })}

      {campaigns.length === 0 && (
        <div className="col-span-2 text-center p-12 bg-white border border-[#E9ECEF] rounded-3xl shadow-sm text-[#ADB5BD]">
          No campaign records loaded from sheets.
        </div>
      )}
    </div>
  );
}
