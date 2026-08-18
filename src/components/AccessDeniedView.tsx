import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, LogOut, Mail, Lock, CheckCircle2, Link2, Database, ChevronDown, ChevronUp, AlertOctagon } from 'lucide-react';
import { PRIMARY_SUPER_ADMIN_EMAIL } from '../lib/auth';

interface AccessDeniedViewProps {
  userEmail: string;
  isRevoked?: boolean;
  onLogout: () => void;
  onRefreshAuth: (customSheetId?: string) => Promise<any> | void;
  isChecking?: boolean;
  currentSpreadsheetId?: string | null;
  adminsCount?: number;
  errorMessage?: string | null;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  userEmail,
  isRevoked,
  onLogout,
  onRefreshAuth,
  isChecking = false,
  currentSpreadsheetId,
  adminsCount = 0,
  errorMessage
}) => {
  const [copied, setCopied] = useState(false);
  const [showConnectSheet, setShowConnectSheet] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [connectMsg, setConnectMsg] = useState<string | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PRIMARY_SUPER_ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConnectCustomSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) return;

    let targetId = sheetInput.trim();
    // Extract ID from URL if full Google Sheets link was pasted
    const match = targetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      targetId = match[1];
    }

    setConnectMsg('Connecting and verifying master database...');
    try {
      await onRefreshAuth(targetId);
      setConnectMsg(null);
    } catch (err: any) {
      setConnectMsg(`Connection failed: ${err.message || 'Unable to load spreadsheet'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#E9ECEF] rounded-3xl p-8 shadow-sm text-center">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-[#6C5CE7] rounded-xl flex items-center justify-center text-white shadow-xs">
            <svg className="w-5 h-5 text-white" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-base font-bold font-display text-[#2D3436] leading-none">InventoryOS</div>
            <div className="text-[10px] text-[#ADB5BD] font-mono uppercase tracking-wider">Access Control Gateway</div>
          </div>
        </div>

        {/* Database Reachability Alert if master sheet couldn't be loaded */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left flex items-start gap-2.5 text-xs text-amber-900">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">AUTHORIZATION CHECK FAILED</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                InventoryOS could not verify your permissions because the master database could not be reached.
              </div>
              <div className="text-[10px] font-mono text-amber-700 mt-1 break-all">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* Status Badge & Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold mb-3">
          <Lock className="w-3.5 h-3.5" />
          {isRevoked ? 'Access Revoked' : 'Access Restricted'}
        </div>

        <h1 className="text-xl font-bold font-display text-[#2D3436] mb-2">
          {isRevoked ? 'Account Access Revoked' : 'Authorization Required'}
        </h1>

        <p className="text-xs text-[#636E72] leading-relaxed mb-6">
          {isRevoked
            ? 'Your administrator privileges for this Google account have been revoked by a Super Admin.'
            : 'Your Google account is not listed in the authorized administrators ledger. InventoryOS data is restricted to verified Admin and Super Admin users.'}
        </p>

        {/* Account Info Box */}
        <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl p-4 text-left text-xs mb-4 space-y-2">
          <div>
            <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Signed-In Google Account</div>
            <div className="font-mono font-bold text-[#2D3436] break-all">{userEmail}</div>
          </div>

          <div className="pt-2 border-t border-[#E9ECEF] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Assigned Role</div>
              <div className="font-semibold text-rose-600">
                {isRevoked ? 'Revoked' : 'Unauthorized / No Access'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Known Admins</div>
              <div className="font-mono font-bold text-[#2D3436]">{adminsCount} loaded</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E9ECEF] flex items-center justify-between text-[11px]">
            <div>
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Connected Database</div>
              <div className="font-mono text-[#636E72]">
                {currentSpreadsheetId ? `InventoryOS_Database (${currentSpreadsheetId.slice(0, 8)}...)` : 'Not Connected'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Auth Source</div>
              <div className="font-mono text-[#636E72]">Master Admin Worksheet</div>
            </div>
          </div>
        </div>

        {/* Connect Spreadsheet Accordion (For multi-user team sync) */}
        <div className="mb-4 text-left">
          <button
            type="button"
            onClick={() => setShowConnectSheet(!showConnectSheet)}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#6C5CE7]" />
              {currentSpreadsheetId ? 'Master Spreadsheet Connected' : 'Connect Master Spreadsheet ID'}
            </span>
            {showConnectSheet ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showConnectSheet && (
            <form onSubmit={handleConnectCustomSheet} className="mt-2 p-3 bg-white border border-gray-200 rounded-xl space-y-2">
              <div className="text-[11px] text-gray-500">
                Paste the master Google Sheet URL or ID if this account was just granted access:
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]"
                />
                <button
                  type="submit"
                  disabled={isChecking || !sheetInput.trim()}
                  className="px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  Connect
                </button>
              </div>
              {connectMsg && (
                <div className="text-[11px] text-purple-700 font-medium">{connectMsg}</div>
              )}
            </form>
          )}
        </div>

        {/* Request Access Help */}
        <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl text-left text-xs text-purple-900 mb-6 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-purple-800">
            <Mail className="w-4 h-4" /> Need Access?
          </div>
          <p className="text-[11px] leading-relaxed text-purple-900">
            Contact the Primary Super Admin to request role assignment:
          </p>
          <div className="flex items-center justify-between gap-2 bg-white/80 border border-purple-200 rounded-xl px-3 py-1.5 font-mono text-[11px]">
            <span className="truncate select-all text-purple-950 font-bold">{PRIMARY_SUPER_ADMIN_EMAIL}</span>
            <button
              onClick={handleCopyEmail}
              className="text-[10px] font-bold text-[#6C5CE7] hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          <button
            onClick={() => onRefreshAuth()}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-60 active:scale-98"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Re-checking permissions...' : 'Check Authorization Again'}
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-[#DEE2E6] text-[#2D3436] rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#636E72]" />
            Sign Out / Switch Account
          </button>
        </div>

        <p className="text-[10px] text-[#ADB5BD] mt-6">
          Security policy: All authentication and authorization attempts are timestamped and logged.
        </p>

      </div>
    </div>
  );
};
