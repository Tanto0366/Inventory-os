import React from 'react';
import { RefreshCw, ExternalLink, CheckCircle } from 'lucide-react';

interface SyncStatusProps {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSync: Date | null;
  isSyncing: boolean;
  onSync: () => void;
  isAdmin?: boolean;
  syncError?: string | null;
}

export default function SyncStatus({
  spreadsheetId,
  spreadsheetUrl,
  lastSync,
  isSyncing,
  onSync,
  isAdmin,
  syncError
}: SyncStatusProps) {
  if (syncError) {
    return (
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold text-amber-900 font-display">Local Mode (Sheets Sync Offline)</span>
        </div>
        <p className="text-[11px] text-amber-700 leading-none">
          Operating offline. Edits are saved locally and will sync when connection restores.
        </p>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-xs font-medium transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Retrying...' : 'Retry Sync'}
        </button>
      </div>
    );
  }

  if (!spreadsheetId) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium">
        <span>Google Sheet not connected</span>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="ml-auto px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition disabled:opacity-50"
        >
          {isSyncing ? 'Connecting...' : 'Connect now'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80 text-emerald-800 text-xs md:text-sm">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 height-4 text-emerald-600" />
        <span className="font-semibold text-emerald-900 font-display">Linked with Google Sheets</span>
      </div>
      
      {isAdmin && spreadsheetUrl && (
        <a
          href={spreadsheetUrl}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium underline transition"
        >
          Open Spreadsheet <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {lastSync && (
        <span className="text-emerald-600/80 font-mono text-[11px] ml-auto">
          Last sync: {lastSync.toLocaleTimeString()}
        </span>
      )}

      <button
        onClick={onSync}
        disabled={isSyncing}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition active:scale-95 disabled:opacity-50"
        title="Sync now"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
