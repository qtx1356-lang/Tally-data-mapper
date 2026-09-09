import React, { useState, useEffect } from 'react';
import {
  Clock,
  Mail,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Play,
  FileSpreadsheet,
  FileText,
  Sliders,
  X,
  History,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';
import { ReportSchedule, ScheduleDeliveryLog } from '../types/documentsAndSchedules';

export const ReportSchedulerView: React.FC = () => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [logs, setLogs] = useState<ScheduleDeliveryLog[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ReportSchedule | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ReportSchedule>>({
    name: 'End-of-Day GST Reconciliation Report',
    reportOrPackageId: 'REP_8001',
    isPackage: false,
    scheduleType: 'Daily',
    timeOfDay: '18:00',
    enabled: true,
    recipientEmails: ['cfo@company.com', 'tax.audit@company.com'],
    exportFormat: 'PDF',
    emailSubject: 'Daily GST Sales Register & Tax Reconciliation Report',
    emailBody: 'Please find attached the daily automated GST reconciliation report exported from Tally.'
  });

  const fetchSchedulesAndLogs = () => {
    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.schedules)) setSchedules(data.schedules);
        if (Array.isArray(data.logs)) setLogs(data.logs);
      })
      .catch((err) => console.error('Failed to load schedules', err));
  };

  useEffect(() => {
    fetchSchedulesAndLogs();
  }, []);

  const handleSaveSchedule = async () => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditingModalOpen(false);
        fetchSchedulesAndLogs();
      }
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSchedulesAndLogs();
      }
    } catch (e) {
      console.error('Failed to delete schedule', e);
    }
  };

  const handleDispatchNow = async (scheduleId: string) => {
    setDispatchingId(scheduleId);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/schedules/dispatch-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(`Dispatch successful! Email delivered to ${data.log.recipientCount} recipients.`);
        fetchSchedulesAndLogs();
      } else {
        setDispatchResult(`Dispatch failed: ${data.message}`);
      }
    } catch (e: any) {
      setDispatchResult(`Error during dispatch: ${e.message}`);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-[#0B1120] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-sky-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              Report Scheduler & Automated Email Dispatch
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automate daily/weekly report generation, PDF attachments, and email distribution.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: 'New Automated Report Dispatch Schedule',
              reportOrPackageId: 'REP_8001',
              isPackage: false,
              scheduleType: 'Daily',
              timeOfDay: '09:00',
              enabled: true,
              recipientEmails: ['finance@company.com'],
              exportFormat: 'PDF',
              emailSubject: 'Automated Financial Report Attachment',
              emailBody: 'Attached is the latest automated financial intelligence report.'
            });
            setIsEditingModalOpen(true);
          }}
          className="flex items-center space-x-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Schedule</span>
        </button>
      </div>

      {/* Dispatch Result Alert */}
      {dispatchResult && (
        <div className="bg-sky-950 border-b border-sky-800 px-6 py-2 text-xs text-sky-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Send className="h-4 w-4 text-sky-400" />
            <span>{dispatchResult}</span>
          </div>
          <button onClick={() => setDispatchResult(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Active Schedules Column */}
        <div className="flex-1 flex flex-col space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Configured Schedules ({schedules.length})</span>
            <button
              onClick={fetchSchedulesAndLogs}
              className="text-slate-400 hover:text-white text-xs flex items-center space-x-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-800 bg-[#1E293B]/80 hover:border-slate-700 p-5 flex items-center justify-between transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        s.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-slate-100">{s.name}</h3>
                    <span className="rounded bg-sky-950 border border-sky-800 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                      {s.scheduleType} @ {s.timeOfDay}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      <span>{s.recipientEmails.length} Recipients</span>
                    </span>
                    <span>Format: <strong className="text-slate-200">{s.exportFormat}</strong></span>
                    <span>
                      Last Status:{' '}
                      <strong className={s.lastStatus === 'Success' ? 'text-emerald-400' : 'text-amber-400'}>
                        {s.lastStatus}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Schedule Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDispatchNow(s.id)}
                    disabled={dispatchingId === s.id}
                    className="flex items-center space-x-1 rounded bg-sky-600/90 hover:bg-sky-600 px-3 py-1.5 text-xs text-white font-medium transition-colors"
                  >
                    <Send className={`h-3.5 w-3.5 ${dispatchingId === s.id ? 'animate-bounce' : ''}`} />
                    <span>{dispatchingId === s.id ? 'Sending...' : 'Dispatch Now'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/40"
                    title="Delete Schedule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Audit Logs Column */}
        <div className="w-96 border-l border-slate-800 bg-[#0B1120] p-5 flex flex-col space-y-4 rounded-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
            <History className="h-4 w-4 text-sky-400" />
            <span>Delivery Audit History</span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded border border-slate-800 bg-[#1E293B]/60 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-200">{log.scheduleName}</span>
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{log.status}</span>
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] flex items-center justify-between font-mono">
                  <span>{new Date(log.executedAt).toLocaleTimeString()}</span>
                  <span>{log.recipientCount} Recipients • {log.executionTimeMs}ms</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0B1120] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Configure Automated Schedule</span>
              </h3>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Schedule Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Frequency</label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as any })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-2 text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly (Mondays)</option>
                    <option value="Monthly">Monthly (1st of month)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Dispatch Time</label>
                  <input
                    type="time"
                    value={formData.timeOfDay || '09:00'}
                    onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-2 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Recipient Emails (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.recipientEmails?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientEmails: e.target.value.split(',').map((x) => x.trim())
                    })
                  }
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Subject Line</label>
                <input
                  type="text"
                  value={formData.emailSubject || ''}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
