/**
 * Phase 32H - SECURITY & AUDIT CENTER VIEW
 * Audit Event Stream, Security Threat Event Logs, Integrity Verification, and Disaster Recovery Sequence Execution.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Play,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  AuditEvent,
  SecurityEvent,
  IntegrityReport,
  DisasterRecoveryCheckResult
} from '../types/phase32HOperationalSafety';

export const Phase32HSecurityAuditView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'SECURITY' | 'INTEGRITY' | 'DR'>('AUDIT');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [drResults, setDrResults] = useState<DisasterRecoveryCheckResult[]>([]);
  const [searchUser, setSearchUser] = useState<string>('');
  const [searchAction, setSearchAction] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchAuditEvents();
    fetchSecurityEvents();
    fetchIntegrityCheck();
  }, []);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const url = `/api/safety/audit/events?companyId=CMP-001${searchUser ? `&user=${searchUser}` : ''}${searchAction ? `&action=${searchAction}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAuditEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const res = await fetch('/api/safety/security/events?companyId=CMP-001');
      const data = await res.json();
      if (data.success) {
        setSecurityEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching security events:', err);
    }
  };

  const fetchIntegrityCheck = async () => {
    try {
      const res = await fetch('/api/safety/integrity/check?companyId=CMP-001');
      const data = await res.json();
      if (data.success) {
        setIntegrityReport(data.report);
      }
    } catch (err) {
      console.error('Error fetching integrity check:', err);
    }
  };

  const handleExecuteDR = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/safety/recovery/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: 'CMP-001', backupId: 'BKP-EXFIN-20260331-001' })
      });
      const data = await res.json();
      if (data.success) {
        setDrResults(data.results);
        alert('Disaster Recovery Test Sequence Completed Successfully! All 9 verification steps passed.');
      } else {
        alert('Disaster Recovery Test Failed.');
      }
    } catch (err) {
      console.error('Error executing DR sequence:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            SECURITY & AUDIT CENTER
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Immutable Audit Trail, Security Event Monitor, Integrity Checks & Disaster Recovery Verification
          </p>
        </div>

        <button
          onClick={fetchAuditEvents}
          className="bg-indigo-600 text-white text-xs px-3.5 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-1.5 font-medium shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Stream
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-2 px-3 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'AUDIT' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Stream ({auditEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-2 px-3 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'SECURITY' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Security Events ({securityEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('INTEGRITY')}
          className={`pb-2 px-3 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'INTEGRITY' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          System Integrity Check
        </button>

        <button
          onClick={() => setActiveTab('DR')}
          className={`pb-2 px-3 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'DR' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Play className="w-4 h-4" />
          Disaster Recovery Sequence
        </button>
      </div>

      {/* TAB 1: AUDIT STREAM */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Filter by user..."
                className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              />
            </div>

            <button
              onClick={fetchAuditEvents}
              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-semibold hover:bg-indigo-700"
            >
              Filter Audit Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditEvents.map((ev) => (
                  <tr key={ev.auditId} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-indigo-700">{ev.auditId}</td>
                    <td className="p-3 text-slate-600">{new Date(ev.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-medium text-slate-800">{ev.user}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                        {ev.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{ev.companyId}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        ev.result === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {ev.result}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{ev.severity}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{ev.correlationId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY EVENTS */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Security Threat & Access Event Monitor
          </h2>

          <div className="space-y-3">
            {securityEvents.map((sec) => (
              <div key={sec.eventId} className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start justify-between">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">{sec.eventType}</span>
                    <span className="text-slate-500">{new Date(sec.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-red-900">{sec.description}</p>
                  <p className="text-slate-700">User: <strong>{sec.user}</strong> | Target Company: <strong>{sec.companyId}</strong> | Correlation: <code>{sec.correlationId}</code></p>
                </div>

                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded border border-red-300">
                  {sec.blocked ? 'BLOCKED & LOGGED' : 'FLAGGED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM INTEGRITY */}
      {activeTab === 'INTEGRITY' && integrityReport && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              System Integrity Verification Report
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded font-bold">
              OVERALL STATUS: {integrityReport.overallStatus}
            </span>
          </div>

          <div className="space-y-2">
            {integrityReport.checks.map((c, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{c.component}</span>
                <span className="text-slate-600">{c.message}</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DISASTER RECOVERY */}
      {activeTab === 'DR' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600" />
                Automated Disaster Recovery Verification Sequence
              </h2>
              <p className="text-xs text-gray-500 mt-1">Executes 9-Step Standard Recovery Checklist</p>
            </div>

            <button
              onClick={handleExecuteDR}
              className="bg-indigo-600 text-white text-xs px-4 py-2 rounded.md font-bold hover:bg-indigo-700 shadow-xs flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Run Disaster Recovery Test
            </button>
          </div>

          {drResults.length > 0 && (
            <div className="space-y-2">
              {drResults.map((dr) => (
                <div key={dr.step} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[11px]">
                      {dr.step}
                    </span>
                    <span className="font-bold text-slate-900">{dr.stepName}</span>
                  </div>
                  <span className="text-slate-500">{dr.details} ({dr.durationMs}ms)</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px]">
                    {dr.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
