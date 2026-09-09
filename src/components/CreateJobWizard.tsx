import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Bell,
  Check,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import {
  AutomationJob,
  JobSchedule,
  RetryPolicy,
  NotificationConfiguration,
  ScheduleType,
  MonthlyScheduleType,
  BackoffStrategy,
  AttachmentPolicy
} from '../types/automation';

interface CreateJobWizardProps {
  selectedCompany?: any;
  onClose: () => void;
  onJobSaved: () => void;
}

export const CreateJobWizard: React.FC<CreateJobWizardProps> = ({
  selectedCompany,
  onClose,
  onJobSaved
}) => {
  const [step, setStep] = useState<number>(1);

  // Available Mappings and Export Profiles
  const [mappings, setMappings] = useState<any[]>([]);
  const [exportProfiles, setExportProfiles] = useState<any[]>([]);

  // Step 1: Name & Desc
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Step 2: Company Selection
  const [companyMode, setCompanyMode] = useState<'CURRENT' | 'SPECIFIC'>('CURRENT');
  const [specificCompanyId, setSpecificCompanyId] = useState('COMP_001');
  const [specificCompanyName, setSpecificCompanyName] = useState('ABC TRADING PVT LTD');

  // Step 3: Mapping Selection
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [selectedMappingName, setSelectedMappingName] = useState('');

  // Step 4: Export Profile Selection
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedProfileName, setSelectedProfileName] = useState('');

  // Step 5: Schedule Configuration
  const [scheduleType, setScheduleType] = useState<ScheduleType>('Daily');
  const [scheduleTime, setScheduleTime] = useState('19:00');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [monthlyType, setMonthlyType] = useState<MonthlyScheduleType>('Day1');
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [specificDate, setSpecificDate] = useState('2026-09-08T19:00');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(60);
  const [schedulePreviewDates, setSchedulePreviewDates] = useState<string[]>([]);

  // Step 6: Retry Policy
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [initialDelaySeconds, setInitialDelaySeconds] = useState<number>(60);
  const [backoffStrategy, setBackoffStrategy] = useState<BackoffStrategy>('Exponential');

  // Step 7: Notifications
  const [enableInApp, setEnableInApp] = useState(true);
  const [enableEmail, setEnableEmail] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('accounts@abctrading.com');
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(true);
  const [notifyOnWarning, setNotifyOnWarning] = useState(true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [attachmentPolicy, setAttachmentPolicy] = useState<AttachmentPolicy>('NoAttachment');

  const [isSaving, setIsSaving] = useState(false);

  // Load Mappings & Profiles
  useEffect(() => {
    fetch('/api/mappings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMappings(data);
          setSelectedMappingId(data[0].id);
          setSelectedMappingName(data[0].name);
        }
      })
      .catch(() => {});

    fetch('/api/export/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExportProfiles(data);
          setSelectedProfileId(data[0].id);
          setSelectedProfileName(data[0].name);
        }
      })
      .catch(() => {});
  }, []);

  // Update Schedule Preview
  useEffect(() => {
    const currentSchedule: JobSchedule = {
      type: scheduleType,
      time: scheduleTime,
      daysOfWeek: weeklyDays,
      monthlyType,
      monthlyDay,
      specificDate,
      intervalMinutes,
      timeZone: 'India Standard Time'
    };

    fetch('/api/automation/schedule/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: currentSchedule })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.upcoming) {
          setSchedulePreviewDates(data.upcoming);
        }
      })
      .catch(() => {});
  }, [scheduleType, scheduleTime, weeklyDays, monthlyType, monthlyDay, specificDate, intervalMinutes]);

  const toggleWeeklyDay = (dayNum: number) => {
    if (weeklyDays.includes(dayNum)) {
      if (weeklyDays.length > 1) {
        setWeeklyDays(weeklyDays.filter((d) => d !== dayNum));
      }
    } else {
      setWeeklyDays([...weeklyDays, dayNum].sort());
    }
  };

  const handleSaveJob = (enableImmediately: boolean) => {
    setIsSaving(true);

    const compName =
      companyMode === 'CURRENT'
        ? selectedCompany?.companyName || 'ABC TRADING PVT LTD'
        : specificCompanyName;
    const compId =
      companyMode === 'CURRENT'
        ? selectedCompany?.companyId || 'COMP_001'
        : specificCompanyId;

    const payload = {
      name: jobName || 'Untitled Scheduled Job',
      description: jobDescription,
      mappingId: selectedMappingId,
      mappingName: selectedMappingName,
      exportProfileId: selectedProfileId,
      exportProfileName: selectedProfileName,
      companyId: compId,
      companyName: compName,
      schedule: {
        type: scheduleType,
        time: scheduleTime,
        daysOfWeek: weeklyDays,
        monthlyType,
        monthlyDay,
        specificDate,
        intervalMinutes,
        timeZone: 'India Standard Time'
      },
      isEnabled: enableImmediately,
      retryPolicy: {
        maxAttempts,
        initialDelaySeconds,
        backoffStrategy
      },
      notificationConfiguration: {
        enableInApp,
        enableEmail,
        emailRecipients: emailRecipients
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
        notifyOnSuccess,
        notifyOnWarning,
        notifyOnFailure,
        attachmentPolicy,
        maxAttachmentMb: 10
      },
      missedJobPolicy: 'Skip'
    };

    fetch('/api/automation/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setIsSaving(false);
        onJobSaved();
      })
      .catch(() => setIsSaving(false));
  };

  const wizardSteps = [
    { num: 1, label: 'Name' },
    { num: 2, label: 'Company' },
    { num: 3, label: 'Mapping' },
    { num: 4, label: 'Profile' },
    { num: 5, label: 'Schedule' },
    { num: 6, label: 'Retry' },
    { num: 7, label: 'Notify' },
    { num: 8, label: 'Review' },
    { num: 9, label: 'Save' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>CREATE AUTOMATION JOB WIZARD</span>
            </h2>
            <p className="text-xs text-slate-400">
              Configure scheduled exports with company safety checks and retry policies.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1 bg-slate-800 rounded"
          >
            Cancel
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
          {wizardSteps.map((s) => (
            <div
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] font-semibold cursor-pointer shrink-0 transition ${
                s.num === step
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : s.num < step
                  ? 'text-slate-300 hover:text-slate-100'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                {s.num < step ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : s.num}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Job Name */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 1: Job Name & Description</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Job Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Sales Register Excel Export"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Exports verified GST sales register every evening at 19:00 for audit..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Selection & Safety */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 2: Company Selection & Safety Guardrail</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCompanyMode('CURRENT')}
                  className={`p-3 rounded-lg border text-left space-y-1 transition ${
                    companyMode === 'CURRENT'
                      ? 'bg-slate-800 border-emerald-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Current Active Company</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Executes job against whatever company is active in Tally at run time.
                  </p>
                </button>

                <button
                  onClick={() => setCompanyMode('SPECIFIC')}
                  className={`p-3 rounded-lg border text-left space-y-1 transition ${
                    companyMode === 'SPECIFIC'
                      ? 'bg-slate-800 border-emerald-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">Specific Company Binding</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Strict verification before execution. Aborts if company does not match.
                  </p>
                </button>
              </div>

              {companyMode === 'SPECIFIC' && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                  <label className="text-xs font-medium text-slate-300 block">Target Company Name</label>
                  <input
                    type="text"
                    value={specificCompanyName}
                    onChange={(e) => setSpecificCompanyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
              )}

              <div className="bg-amber-950/30 border border-amber-800/60 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Company Safety Rule (Requirement 8)</span>
                  Before executing any job, the automation engine connects to Tally and verifies the active company.
                  If the active company does not match, the job stops immediately with a <span className="font-mono text-amber-200">CompanyMismatch</span> warning.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Mapping Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 3: Select Output Mapping</h3>
            <div className="space-y-2">
              {mappings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMappingId(m.id);
                    setSelectedMappingName(m.name);
                  }}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    selectedMappingId === m.id
                      ? 'bg-slate-800 border-emerald-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{m.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Source Entity: <span className="font-mono text-slate-300">{m.sourceEntity}</span> • {m.fields?.length || 0} fields
                      </p>
                    </div>
                  </div>
                  {selectedMappingId === m.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Export Profile */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 4: Select Export Profile</h3>
            <div className="space-y-2">
              {exportProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProfileId(p.id);
                    setSelectedProfileName(p.name);
                  }}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    selectedProfileId === p.id
                      ? 'bg-slate-800 border-emerald-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Format: {p.format} • Destination: {p.destinationPath}
                      </p>
                    </div>
                  </div>
                  {selectedProfileId === p.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Schedule & Preview */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 5: Schedule Configuration & Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Schedule Frequency</label>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Daily">Daily (Every Day)</option>
                    <option value="Weekly">Weekly (Selected Days)</option>
                    <option value="Monthly">Monthly (1st, 15th, or Last Day)</option>
                    <option value="Interval">Interval (Every X Minutes)</option>
                    <option value="Once">One-Time Execution</option>
                  </select>
                </div>

                {scheduleType !== 'Interval' && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Execution Time (HH:mm)</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                )}

                {scheduleType === 'Weekly' && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Active Days of Week</label>
                    <div className="flex gap-1">
                      {[
                        { num: 1, label: 'Mon' },
                        { num: 2, label: 'Tue' },
                        { num: 3, label: 'Wed' },
                        { num: 4, label: 'Thu' },
                        { num: 5, label: 'Fri' },
                        { num: 6, label: 'Sat' },
                        { num: 0, label: 'Sun' }
                      ].map((d) => (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleWeeklyDay(d.num)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border transition ${
                            weeklyDays.includes(d.num)
                              ? 'bg-emerald-600 border-emerald-500 text-slate-950'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {scheduleType === 'Monthly' && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Monthly Day</label>
                    <select
                      value={monthlyType}
                      onChange={(e) => setMonthlyType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100"
                    >
                      <option value="Day1">1st Day of Month</option>
                      <option value="Day15">15th Day of Month</option>
                      <option value="LastDay">Last Day of Month (28/30/31)</option>
                    </select>
                  </div>
                )}

                {scheduleType === 'Interval' && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Interval Minutes (Min: 5m)</label>
                    <input
                      type="number"
                      min={5}
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                )}

                <p className="text-[10px] text-slate-500 pt-1">Timezone: Windows India Standard Time (IST)</p>
              </div>

              {/* Schedule Preview (Requirement 43) */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Schedule Preview — Upcoming 5 Executions</span>
                </h4>
                <p className="text-[10px] text-slate-400">Verifies execution dates before saving:</p>

                <div className="space-y-1.5 font-mono text-[11px]">
                  {schedulePreviewDates.map((dt, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800/80 text-emerald-300 flex items-center justify-between"
                    >
                      <span>Run #{idx + 1}:</span>
                      <span>{new Date(dt).toLocaleString()}</span>
                    </div>
                  ))}
                  {schedulePreviewDates.length === 0 && (
                    <p className="text-slate-500 text-xs">Calculating preview...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Retry Policy */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 6: Configure Retry & Backoff Strategy</h3>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Maximum Retry Attempts</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Initial Retry Delay (Seconds)</label>
                  <input
                    type="number"
                    min={10}
                    value={initialDelaySeconds}
                    onChange={(e) => setInitialDelaySeconds(parseInt(e.target.value) || 60)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Backoff Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Fixed', 'Linear', 'Exponential'].map((str) => (
                    <button
                      key={str}
                      type="button"
                      onClick={() => setBackoffStrategy(str as any)}
                      className={`py-2 text-xs font-bold rounded border transition ${
                        backoffStrategy === str
                          ? 'bg-slate-800 border-emerald-500 text-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {str} Backoff
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-3 rounded border border-slate-800">
                <p className="text-slate-300 font-semibold">Error Classification Rules:</p>
                <p>• <span className="text-emerald-400 font-mono">Transient Error</span> (Tally connection dropped) → Automatically retried up to {maxAttempts} times.</p>
                <p>• <span className="text-rose-400 font-mono">Company Mismatch / Mapping Error</span> → Stopped immediately to protect data integrity (No retry loop).</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Notifications */}
        {step === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 7: Notifications Configuration</h3>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-slate-200 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInApp}
                    onChange={(e) => setEnableInApp(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Enable In-App Notifications</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-200 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmail}
                    onChange={(e) => setEnableEmail(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Enable Email Notifications</span>
                </label>
              </div>

              {enableEmail && (
                <div>
                  <label className="text-slate-400 block mb-1">Email Recipients (Comma Separated)</label>
                  <input
                    type="text"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <span className="text-slate-400 block font-semibold">Notify On Events:</span>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnSuccess}
                      onChange={(e) => setNotifyOnSuccess(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                    />
                    <span>Success</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnWarning}
                      onChange={(e) => setNotifyOnWarning(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                    />
                    <span>Warning</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnFailure}
                      onChange={(e) => setNotifyOnFailure(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                    />
                    <span>Failure</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Review */}
        {step === 8 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Step 8: Review Automation Job Configuration</h3>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-slate-400 block">Job Name:</span>
                  <span className="font-bold text-slate-100">{jobName || 'Untitled Job'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Target Company:</span>
                  <span className="font-semibold text-emerald-400">
                    {companyMode === 'CURRENT'
                      ? selectedCompany?.companyName || 'ABC TRADING PVT LTD'
                      : specificCompanyName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mapping:</span>
                  <span className="font-medium text-slate-200">{selectedMappingName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Export Profile:</span>
                  <span className="font-medium text-slate-200">{selectedProfileName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Schedule:</span>
                  <span className="font-mono text-cyan-400">{scheduleType} at {scheduleTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Next Expected Run:</span>
                  <span className="font-mono text-amber-300">
                    {schedulePreviewDates[0] ? new Date(schedulePreviewDates[0]).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Save */}
        {step === 9 && (
          <div className="space-y-5 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-100">READY TO SAVE AUTOMATION JOB</h3>
              <p className="text-xs text-slate-400">
                Choose whether to enable this job immediately or save in disabled state.
              </p>
            </div>

            <div className="flex justify-center space-x-4 pt-2">
              <button
                onClick={() => handleSaveJob(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                Save as Disabled
              </button>
              <button
                onClick={() => handleSaveJob(true)}
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition shadow-lg"
              >
                SAVE & ENABLE NOW
              </button>
            </div>
          </div>
        )}

        {/* Bottom Wizard Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded border border-slate-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < 9 && (
            <button
              onClick={() => setStep(Math.min(9, step + 1))}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded flex items-center space-x-1 transition"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
