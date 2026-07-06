import React, { useState } from 'react';
import { AuditEntry } from '../types';
import { History, Search, Filter } from 'lucide-react';

interface AuditTrailViewProps {
  auditLogs: AuditEntry[];
}

export default function AuditTrailView({ auditLogs }: AuditTrailViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('');

  // Filter logs
  const filteredLogs = auditLogs.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.serial.toLowerCase().includes(q) && !(l.note || '').toLowerCase().includes(q)) return false;
    }
    if (filterField && l.field !== filterField) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Search Header */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl p-5 shadow-sm flex flex-wrap items-center gap-4">
        
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD]" />
          <input 
            type="text" 
            placeholder="Search audit trail by Serial number or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 font-sans placeholder-[#ADB5BD] transition"
          />
        </div>

        {/* Change Field Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#ADB5BD]" />
          <select 
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="px-3 py-2 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
          >
            <option value="">All Action Types</option>
            <option value="Status">Status Update</option>
            <option value="Possessor">Possessor Handover</option>
            <option value="Location">Location Shift</option>
            <option value="Deleted">Deletion</option>
          </select>
        </div>

      </div>

      {/* Main Audit Feed */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-[#6C5CE7]" />
          Transaction ledger logs ({filteredLogs.length})
        </h3>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredLogs.map((log, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-[#E9ECEF] last:border-0 last:pb-0">
              
              {/* Left Details */}
              <div className="flex items-start gap-4">
                
                {/* Visual Dot indicator */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  log.field === 'Deleted' ? 'bg-red-500' :
                  log.field === 'Status' ? 'bg-amber-500' :
                  log.field === 'Possessor' ? 'bg-green-500' : 'bg-blue-500'
                }`} />

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#2D3436] text-xs bg-[#F1F3F5] px-2 py-0.5 rounded">
                      {log.serial}
                    </span>
                    <span className="text-xs font-semibold text-[#6C5CE7]">
                      {log.field} Changed
                    </span>
                  </div>
                  
                  <div className="text-xs text-[#636E72] mt-1">
                    Value transitioned: <span className="font-semibold text-[#ADB5BD] font-mono">"{log.from || 'None'}"</span> → <span className="font-semibold text-[#2D3436] font-mono">"{log.to}"</span>
                  </div>
                </div>

              </div>

              {/* Right metadata */}
              <div className="text-right sm:text-right shrink-0">
                <div className="text-[10px] font-bold text-[#ADB5BD] font-mono uppercase tracking-wider">
                  Reference: {log.note || 'Manual'}
                </div>
                <div className="text-[10px] text-[#ADB5BD] font-medium font-sans mt-0.5">
                  Logged by <span className="text-[#2D3436] font-semibold">{log.by || 'System'}</span> · {log.time}
                </div>
              </div>

            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-[#ADB5BD] text-sm">
              No matching transaction records found
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
