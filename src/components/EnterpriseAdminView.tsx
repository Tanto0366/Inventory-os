import React, { useState } from 'react';
import { AdminUser, AdminLog } from '../types';
import { 
  Shield, UserCheck, UserX, AlertTriangle, Key, Search, RefreshCw, 
  Trash2, RotateCcw, Clock, Lock, CheckCircle2, XCircle, ShieldAlert,
  ArrowRightLeft, Eye, ShieldCheck, Mail, Database, FileSpreadsheet, Archive
} from 'lucide-react';
import { PRIMARY_SUPER_ADMIN_EMAIL, normalizeEmail } from '../lib/auth';

interface EnterpriseAdminViewProps {
  adminsList: AdminUser[];
  adminLogs: AdminLog[];
  currentUserEmail?: string;
  onGrantAdmin: (email: string, role: 'Admin' | 'Super Admin') => Promise<void>;
  onRevokeAdmin: (email: string) => Promise<void>;
  onRestoreAdmin: (email: string) => Promise<void>;
  onChangeRole: (email: string, newRole: 'Admin' | 'Super Admin') => Promise<void>;
  onDeleteAdminRecord?: (email: string) => Promise<void>;
  onDeleteRecord?: (email: string) => Promise<void>;
  onExportBackup?: () => void;
  onWipeDatabase?: () => Promise<void>;
}

export const EnterpriseAdminView: React.FC<EnterpriseAdminViewProps> = ({
  adminsList,
  adminLogs,
  currentUserEmail,
  onGrantAdmin,
  onRevokeAdmin,
  onRestoreAdmin,
  onChangeRole,
  onDeleteAdminRecord,
  onDeleteRecord,
  onExportBackup,
  onWipeDatabase
}) => {
  const handleDelete = onDeleteAdminRecord || onDeleteRecord;
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Super Admin'>('Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Revoked'>('All');
  const [confirmRevokeEmail, setConfirmRevokeEmail] = useState<string | null>(null);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = normalizeEmail(newEmail);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Please enter a valid Google/Gmail email address.');
      return;
    }

    const existing = adminsList.find(a => normalizeEmail(a.email) === cleanEmail);
    if (existing && existing.status === 'Active') {
      alert(`User ${cleanEmail} is already active as a ${existing.role}.`);
      return;
    }

    if (existing && existing.status === 'Revoked') {
      if (window.confirm(`User ${cleanEmail} currently has Revoked status. Restore active access with role '${selectedRole}'?`)) {
        setIsSubmitting(true);
        try {
          await onRestoreAdmin(cleanEmail);
          if (existing.role !== selectedRole) {
            await onChangeRole(cleanEmail, selectedRole);
          }
          setNewEmail('');
        } finally {
          setIsSubmitting(false);
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onGrantAdmin(cleanEmail, selectedRole);
      setNewEmail('');
    } catch (err: any) {
      alert(err?.message || 'Failed to grant admin access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = adminsList.filter(admin => {
    const matchesSearch = admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          admin.grantedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' 
      ? true 
      : (statusFilter === 'Active' ? admin.status !== 'Revoked' : admin.status === 'Revoked');
    return matchesSearch && matchesStatus;
  });

  const activeCount = adminsList.filter(a => a.status !== 'Revoked').length;
  const superAdminCount = adminsList.filter(a => (a.role || '').toUpperCase().includes('SUPER') && a.status !== 'Revoked').length;
  const adminReadOnlyCount = adminsList.filter(a => !(a.role || '').toUpperCase().includes('SUPER') && a.status !== 'Revoked').length;
  const revokedCount = adminsList.filter(a => a.status === 'Revoked').length;

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Active Admins</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#2D3436] font-mono">{activeCount}</div>
          <div className="text-[11px] text-[#636E72] mt-0.5">Authorized Accounts</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Super Admins</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">{superAdminCount}</div>
          <div className="text-[11px] text-[#636E72] mt-0.5">Full Write Authority</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Read-Only Admins</span>
            <Eye className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 font-mono">{adminReadOnlyCount}</div>
          <div className="text-[11px] text-[#636E72] mt-0.5">Inspection Access</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Revoked Access</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">{revokedCount}</div>
          <div className="text-[11px] text-[#636E72] mt-0.5">Blocked Logins</div>
        </div>
      </div>

      {/* Main Row: Grant Form & Admin Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Grant Authority Form */}
        <div className="lg:col-span-1 bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6C5CE7]">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#2D3436]">Grant Authority</h3>
            </div>
            <p className="text-xs text-[#636E72] leading-relaxed mb-5">
              Add a verified Google account to grant immediate access. By default, users receive read-only Admin access unless designated as Super Admin.
            </p>

            <form onSubmit={handleGrantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#636E72] mb-1.5">
                  Google / Gmail Account <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#ADB5BD]" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full pl-9 pr-3 py-2 border border-[#DEE2E6] rounded-xl text-xs focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#636E72] mb-1.5">
                  Privilege Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('Admin')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedRole === 'Admin'
                        ? 'border-[#6C5CE7] bg-purple-50/50 ring-1 ring-[#6C5CE7]'
                        : 'border-[#DEE2E6] bg-[#F8F9FA] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#2D3436] mb-0.5">
                      <Eye className="w-3.5 h-3.5 text-[#6C5CE7]" />
                      Admin
                    </div>
                    <div className="text-[10px] text-[#636E72] leading-tight">
                      Read-only inspection, search, reports & audits
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('Super Admin')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedRole === 'Super Admin'
                        ? 'border-purple-600 bg-purple-100/50 ring-1 ring-purple-600'
                        : 'border-[#DEE2E6] bg-[#F8F9FA] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900 mb-0.5">
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      Super Admin
                    </div>
                    <div className="text-[10px] text-[#636E72] leading-tight">
                      Full write, dispatch, sync & admin authority
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] text-[11px] text-[#636E72] space-y-1">
                <div className="font-semibold text-[#2D3436] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#6C5CE7]" /> Authorization Rule:
                </div>
                <p>
                  New entries are instantly committed to the Google Sheet <code className="bg-white px-1 py-0.5 rounded border border-[#DEE2E6]">Admin</code> worksheet and logged with your digital signature.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Recording Authorization...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Grant {selectedRole} Access
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Authorized Admins Registry */}
        <div className="lg:col-span-2 bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold font-display text-[#2D3436]">Enterprise Administrators</h3>
                <p className="text-xs text-[#636E72]">
                  Manage authorized users, privilege levels, and revoke active sessions.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#ADB5BD]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search accounts..."
                    className="pl-8 pr-3 py-1.5 border border-[#DEE2E6] rounded-xl text-xs outline-none focus:border-[#6C5CE7] w-36 sm:w-44"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-[#DEE2E6] rounded-xl text-xs font-semibold text-[#2D3436] bg-[#F8F9FA] outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Only</option>
                  <option value="Revoked">Revoked</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[#E9ECEF] rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-[#636E72] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Google Account</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Granted By</th>
                    <th className="p-3">Date Granted</th>
                    <th className="p-3 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF] font-medium text-[#2D3436]">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[#ADB5BD] text-xs">
                        No administrators found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => {
                      const isPrimary = normalizeEmail(admin.email) === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL);
                      const isRevoked = admin.status === 'Revoked';

                      return (
                        <tr 
                          key={admin.email} 
                          className={`transition ${isRevoked ? 'bg-rose-50/30' : 'hover:bg-[#F8F9FA]/50'}`}
                        >
                          {/* Email */}
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#2D3436] flex items-center gap-1.5">
                              {admin.email}
                              {isPrimary && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Primary
                                </span>
                              )}
                            </div>
                            {admin.lastLogin && (
                              <div className="text-[10px] text-[#ADB5BD] font-normal">
                                Last active: {admin.lastLogin}
                              </div>
                            )}
                          </td>

                          {/* Role Badge & Switcher */}
                          <td className="p-3">
                            {isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-100">
                                🔐 Super Admin
                              </span>
                            ) : isRevoked ? (
                              <span className="text-[10px] text-slate-400 font-mono line-through">
                                {(admin.role || '').toUpperCase().includes('SUPER') ? 'Super Admin' : 'Admin'}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const isSuper = (admin.role || '').toUpperCase().includes('SUPER');
                                  return (
                                    <>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                        isSuper
                                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                                          : 'bg-sky-50 text-sky-700 border-sky-100'
                                      }`}>
                                        {isSuper ? '🔐 Super Admin' : '👤 Read-Only Admin'}
                                      </span>
                                      <button
                                        onClick={() => onChangeRole(admin.email, isSuper ? 'Admin' : 'Super Admin')}
                                        title={`Switch role to ${isSuper ? 'Admin (Read-Only)' : 'Super Admin (Full Write)'}`}
                                        className="p-1 hover:bg-[#E9ECEF] text-[#636E72] rounded-md transition cursor-pointer"
                                      >
                                        <ArrowRightLeft className="w-3 h-3" />
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            {isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                                Protected
                              </span>
                            ) : isRevoked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                                <XCircle className="w-3 h-3" /> Revoked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                          </td>

                          {/* Granted By */}
                          <td className="p-3 text-[11px] text-[#636E72] font-mono truncate max-w-[120px]" title={admin.grantedBy}>
                            {admin.grantedBy}
                          </td>

                          {/* Date Granted */}
                          <td className="p-3 font-mono text-[11px] text-[#636E72] whitespace-nowrap">
                            {admin.grantedOn}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            {isPrimary ? (
                              <span className="text-[10px] text-[#ADB5BD] italic">
                                Permanent Root
                              </span>
                            ) : isRevoked ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onRestoreAdmin(admin.email)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Restore active access for this account"
                                >
                                  <RotateCcw className="w-3 h-3" /> Restore
                                </button>
                                {handleDelete && (
                                  <button
                                    onClick={() => handleDelete(admin.email)}
                                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                                    title="Permanently remove record from ledger"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRevokeEmail(admin.email)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <UserX className="w-3 h-3" /> Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Administrative Security Audit Trail */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-display text-[#2D3436]">Administrative Security & Login Ledger</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold font-mono uppercase px-2.5 py-0.5 rounded-full">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">
              Append-only security log recording authorization grants, revocations, and access attempts.
            </p>
          </div>

          <div className="text-xs font-mono text-[#ADB5BD]">
            {adminLogs.length} events recorded
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E9ECEF] rounded-2xl max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#F8F9FA] z-10">
              <tr className="border-b border-[#E9ECEF] text-[#636E72] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Security Event</th>
                <th className="p-3">Target Account</th>
                <th className="p-3">Performed By</th>
                <th className="p-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF] font-medium text-[#2D3436]">
              {adminLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#ADB5BD] text-xs">
                    No administrative actions recorded yet.
                  </td>
                </tr>
              ) : (
                [...adminLogs].reverse().map((log, idx) => {
                  const isRevoke = log.action.toLowerCase().includes('revoke');
                  const isGrant = log.action.toLowerCase().includes('grant');
                  const isBlocked = log.result?.toLowerCase().includes('block') || log.result?.toLowerCase().includes('denied');

                  return (
                    <tr key={idx} className="hover:bg-[#F8F9FA]/50 transition">
                      <td className="p-3 font-mono text-[11px] text-[#636E72] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isRevoke || isBlocked
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : isGrant
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-[#2D3436]">
                        {log.targetEmail}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#636E72]">
                        {log.performedBy}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.result || 'Success'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: Utility & Maintenance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backups card */}
        {onExportBackup && (
          <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6C5CE7]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold font-display text-[#2D3436]">Spreadsheet Exports & Backups</h3>
              </div>
              <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                Generate an offline multi-tab XLSX backup containing full registries for Assets, Shipments, Gate Passes, Locations, and Audit Histories.
              </p>
            </div>
            <button
              onClick={onExportBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Complete Database Snapshot (.xlsx)
            </button>
          </div>
        )}

        {/* Wipe card */}
        {onWipeDatabase && (
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Archive className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold font-display text-red-950">Hard Reset & Format</h3>
              </div>
              <p className="text-xs text-[#636E72] leading-relaxed mb-4">
                Wipe all inventory worksheets and re-initialize with fresh standard header templates. This action is irreversible and restricted to Super Admins.
              </p>
            </div>
            <button
              onClick={onWipeDatabase}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-98"
            >
              <Archive className="w-4 h-4" /> Wipe Sheet & Reset Defaults
            </button>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Revoking Access */}
      {confirmRevokeEmail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E9ECEF] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold font-display text-[#2D3436]">Revoke Administrator Access?</h4>
              <p className="text-xs text-[#636E72] mt-1 leading-relaxed">
                Are you sure you want to revoke access for <strong className="font-mono text-[#2D3436]">{confirmRevokeEmail}</strong>?
                They will immediately be blocked from accessing InventoryOS.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmRevokeEmail(null)}
                className="flex-1 py-2 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = confirmRevokeEmail;
                  setConfirmRevokeEmail(null);
                  if (target) {
                    await onRevokeAdmin(target);
                  }
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
