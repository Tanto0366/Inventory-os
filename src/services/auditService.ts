import { AuditEntry, AdminLog } from '../types';
import { generateAuditEventId } from '../domain/identity';

export interface CreateAuditEntryParams {
  serial: string;
  field: string;
  from: string;
  to: string;
  actorEmail?: string;
  actorName?: string;
  note?: string;
}

/**
 * Creates an immutable Audit Entry
 */
export function createAuditEntry(params: CreateAuditEntryParams): AuditEntry {
  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return {
    time: ts,
    serial: params.serial,
    field: params.field,
    from: params.from || '—',
    to: params.to || '—',
    by: params.actorName || params.actorEmail || 'System',
    note: params.note || generateAuditEventId()
  };
}

export interface CreateAdminLogParams {
  action: string;
  targetEmail: string;
  performedBy: string;
  result?: string;
}

/**
 * Creates an immutable Admin Access Log
 */
export function createAdminLog(params: CreateAdminLogParams): AdminLog {
  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return {
    timestamp: ts,
    action: params.action,
    targetEmail: params.targetEmail,
    performedBy: params.performedBy || 'System',
    result: params.result || 'Success'
  };
}
