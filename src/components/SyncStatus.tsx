import React from 'react';
import { RefreshCw, ExternalLink, CheckCircle, Database, AlertCircle, Table, DownloadCloud, UploadCloud, ShieldAlert } from 'lucide-react';

interface SyncStatusProps {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSync: Date | null;
  isSyncing: boolean;
  onSync: () => void;
  onPull?: () => void;
  onPush?: () => void;
  isAdmin?: boolean;
  syncError?: string | null;
  counts?: {
    assets: number;
    gatePasses: number;
    shipments: number;
    auditLogs: number;
    campaigns: number;
    admins: number;
  };
}

export default function SyncStatus({
  spreadsheetId,
  spreadsheetUrl,
  lastSync,
  isSyncing,
  onSync,
  onPull,
  onPush,
  syncError,
  counts
}: SyncStatusProps) {
  return (
    <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E9ECEF]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-[#2D3436]">Google Sheets Sync Console</h3>
              {spreadsheetId ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Local Mode
                </span>
              )}
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">
              Automated two-way synchronization between InventoryOS and Google Sheets database with destructive-wipe prevention
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F8F9FA] hover:bg-[#E9ECEF] text-[#2D3436] border border-[#DEE2E6] rounded-xl text-xs font-bold transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#636E72]" /> Open Sheet
            </a>
          )}
          
          {onPull && (
            <button
              onClick={onPull}
              disabled={isSyncing}
              title="Download and refresh all records from Google Sheets into InventoryOS"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <DownloadCloud className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-bounce' : ''}`} />
              Pull from Sheet
            </button>
          )}

          {onPush && (
            <button
              onClick={onPush}
              disabled={isSyncing}
              title="Save all local records to Google Sheets with safety checks"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-700" />
              Push to Sheet
            </button>
          )}

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Sheet Now'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner / Alert */}
      {syncError ? (
        <div className={`p-4 rounded-2xl border ${
          syncError === 'DEMO_MODE'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        } space-y-2`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                syncError === 'DEMO_MODE' ? 'text-amber-600' : 'text-rose-600'
              }`} />
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {syncError === 'DEMO_MODE' ? 'Offline Demo Session' : 'Google Sheets Sync Error'}
                </div>
                <div className="text-xs leading-relaxed opacity-90">
                  {syncError === 'DEMO_MODE'
                    ? 'Operating in offline demo mode. Click "Sync Sheet Now" or sign in with Google to enable live two-way sync.'
                    : syncError}
                </div>
                {syncError !== 'DEMO_MODE' && (
                  <div className="text-[11px] font-mono text-rose-700 bg-white/70 p-2 rounded-xl border border-rose-200/60 mt-2 break-all">
                    {syncError}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm ${
                syncError === 'DEMO_MODE'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isSyncing ? 'Retrying...' : 'Retry Sync'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF] text-xs">
          <div className="flex items-center gap-2 text-[#2D3436]">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Spreadsheet ID:</span>
            <span className="font-mono text-[11px] text-[#636E72] bg-white px-2 py-0.5 rounded border border-[#DEE2E6]">
              {spreadsheetId || 'Not Connected'}
            </span>
          </div>
          <div className="text-[11px] text-[#636E72] font-mono">
            Last Synced: <span className="font-bold text-[#2D3436]">{lastSync ? lastSync.toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
      )}

      {/* Collection Row Counters Grid */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#636E72] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Table className="w-3 h-3 text-[#6C5CE7]" /> Assets
            </div>
            <div className="text-lg font-bold font-display text-[#2D3436]">{counts.assets}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Rows Synced</div>
          </div>

          <div className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#636E72] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Table className="w-3 h-3 text-[#6C5CE7]" /> Gate Passes
            </div>
            <div className="text-lg font-bold font-display text-[#2D3436]">{counts.gatePasses}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Rows Synced</div>
          </div>

          <div className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#636E72] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Table className="w-3 h-3 text-[#6C5CE7]" /> Shipments
            </div>
            <div className="text-lg font-bold font-display text-[#2D3436]">{counts.shipments}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Rows Synced</div>
          </div>

          <div className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#636E72] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Table className="w-3 h-3 text-[#6C5CE7]" /> Audit Trail
            </div>
            <div className="text-lg font-bold font-display text-[#2D3436]">{counts.auditLogs}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Rows Synced</div>
          </div>

          <div className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#636E72] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Table className="w-3 h-3 text-[#6C5CE7]" /> Campaigns
            </div>
            <div className="text-lg font-bold font-display text-[#2D3436]">{counts.campaigns}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Rows Synced</div>
          </div>

          <div className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#636E72] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Table className="w-3 h-3 text-[#6C5CE7]" /> Admins
            </div>
            <div className="text-lg font-bold font-display text-[#2D3436]">{counts.admins}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Rows Synced</div>
          </div>
        </div>
      )}
    </div>
  );
}

