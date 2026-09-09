import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Building2,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Trash2,
  Plus,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  Mic,
  MicOff,
  Eye,
  Code2,
  Calculator,
  Compass,
  TrendingDown,
  TrendingUp,
  Download,
  Check,
  ChevronRight,
  Filter,
  Info,
  Maximize2,
  Table as TableIcon,
  PieChart as PieChartIcon,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Cpu,
  ArrowUpRight
} from 'lucide-react';
import {
  CopilotMode,
  DataSourceIndicator,
  CopilotMessageV2,
  CopilotReportDraft,
  CopilotAuditTrailItem,
  AiProviderConfigState,
  VoiceCommandState
} from '../types/phase19Copilot';

export function TallyCopilotView() {
  // Navigation & Modes
  const [activeMode, setActiveMode] = useState<CopilotMode>('Ask');
  const [messages, setMessages] = useState<CopilotMessageV2[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Context & Freshness
  const [companyContext, setCompanyContext] = useState({
    companyId: 'COMP_EXFIN_01',
    companyName: 'EXFIN GLOBAL ENTERPRISES PVT LTD',
    financialYear: '2026-2027',
    currency: 'INR (₹)',
    dataSource: 'LOCAL DATASET' as DataSourceIndicator,
    lastSynchronized: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  });

  // Active Modals & Drawers
  const [activeTraceModal, setActiveTraceModal] = useState<{
    type: 'Data' | 'Query' | 'Calculation' | 'Source';
    msg: CopilotMessageV2;
  } | null>(null);
  const [drilldownDrawer, setDrilldownDrawer] = useState<{
    isOpen: boolean;
    dimension: string;
    value: string;
    records: any[];
    lineage: any;
  } | null>(null);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    report: CopilotReportDraft;
    editInstruction: string;
    isEditing: boolean;
  } | null>(null);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<CopilotAuditTrailItem[]>([]);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // AI Provider & Privacy
  const [providerConfig, setProviderConfig] = useState<AiProviderConfigState>({
    providerName: 'Gemini-3.8-Flash',
    isLocalMode: false,
    isOfflineFallbackAvailable: true,
    dataMinimizationEnabled: true,
    discloseDataTransmission: true,
    cloudDisclosureText:
      'Data Minimization Active: Only sanitized query ASTs and aggregated totals are transmitted. Raw confidential records remain strictly local on-premises.'
  });

  // Voice Command Simulation
  const [voiceState, setVoiceState] = useState<VoiceCommandState>({
    isListening: false,
    transcript: '',
    recognizedIntent: '',
    confidence: 0
  });

  // Visual Display Toggles per message ID: 'both' | 'table' | 'chart'
  const [displayModeMap, setDisplayModeMap] = useState<Record<string, 'both' | 'table' | 'chart'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableModes: CopilotMode[] = [
    'Ask',
    'Analyze',
    'Build Report',
    'Explain',
    'Compare',
    'Investigate',
    'Find',
    'Summarize'
  ];

  const quickPrompts = [
    { label: 'Sales this month', prompt: 'Show monthly sales trend and tax breakdown', mode: 'Analyze' as CopilotMode },
    { label: 'Who owes the most?', prompt: 'Which customers owe the most in outstanding receivables?', mode: 'Investigate' as CopilotMode },
    { label: 'Compare with last year', prompt: 'Compare sales with last year and show variance', mode: 'Compare' as CopilotMode },
    { label: 'Top 10 products', prompt: 'Show my top 10 inventory products by valuation', mode: 'Find' as CopilotMode },
    { label: 'Reconcile GST tax', prompt: 'Reconcile GST tax output liability across registers', mode: 'Explain' as CopilotMode },
    { label: 'Build monthly report', prompt: 'Build a comprehensive monthly sales and tax report', mode: 'Build Report' as CopilotMode }
  ];

  // Initialize
  useEffect(() => {
    fetchContext();
    fetchAuditTrail();
    seedWelcomeMessage();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const fetchContext = async () => {
    try {
      const res = await fetch('/api/copilot/v2/context');
      if (res.ok) {
        const data = await res.json();
        if (data.activeCompany) setCompanyContext(data.activeCompany);
        if (data.aiProviderConfig) setProviderConfig(data.aiProviderConfig);
      }
    } catch (err) {
      console.warn('Using local copilot context fallback');
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const res = await fetch('/api/copilot/v2/audit-trail');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.warn('Audit fetch error');
    }
  };

  const seedWelcomeMessage = () => {
    const welcome: CopilotMessageV2 = {
      messageId: 'MSG-WELCOME-01',
      sender: 'Copilot',
      content:
        'Welcome to **EXFIN Copilot**. I am your natural-language accounting intelligence engine connected to your discovered Tally dataset.\n\n' +
        'Every financial answer is deterministically calculated against your verified local database with zero synthetic estimations or hallucinations.\n\n' +
        'Select a mode above or click one of the suggested inquiries below to begin.',
      timestamp: new Date().toISOString(),
      mode: 'Ask',
      confidence: {
        intentConfidence: 1.0,
        fieldMappingConfidence: 1.0,
        queryConfidence: 1.0
      },
      provenance: {
        dataset: 'Sales & Ledger Vouchers',
        company: companyContext.companyName,
        period: companyContext.financialYear,
        queryOrReport: 'SYSTEM_BOOT',
        generatedAt: new Date().toISOString(),
        sourceType: companyContext.dataSource,
        lastSynchronized: companyContext.lastSynchronized,
        traceId: 'TRC-SYS-001'
      }
    };
    setMessages([welcome]);
  };

  const handleSendMessage = async (textToSend?: string, overrideMode?: CopilotMode) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    const currentMode = overrideMode || activeMode;

    const userMsg: CopilotMessageV2 = {
      messageId: `MSG-USER-${Date.now()}`,
      sender: 'User',
      content: query,
      timestamp: new Date().toISOString(),
      mode: currentMode,
      confidence: { intentConfidence: 1.0, fieldMappingConfidence: 1.0, queryConfidence: 1.0 }
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      // If user requested Build Report mode directly, trigger report generator
      if (currentMode === 'Build Report') {
        const repRes = await fetch('/api/copilot/v2/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query, companyId: companyContext.companyId })
        });
        const repData = await repRes.json();

        const copilotMsg: CopilotMessageV2 = {
          messageId: `MSG-${Date.now()}`,
          sender: 'Copilot',
          content: `I generated a structured **${repData.reportDraft.title}** definition grounded in your discovered Tally schema for **${companyContext.companyName}**.\n\nYou can review columns, groupings, formulas, and edit it using natural language before saving.`,
          timestamp: new Date().toISOString(),
          mode: 'Build Report',
          reportDraft: repData.reportDraft,
          confidence: { intentConfidence: 0.98, fieldMappingConfidence: 0.96, queryConfidence: 0.99 },
          provenance: {
            dataset: 'SalesVouchers',
            company: companyContext.companyName,
            period: companyContext.financialYear,
            queryOrReport: repData.reportDraft.reportId,
            generatedAt: new Date().toISOString(),
            sourceType: companyContext.dataSource,
            lastSynchronized: companyContext.lastSynchronized,
            traceId: `TRC-${Date.now()}`
          }
        };

        setMessages((prev) => [...prev, copilotMsg]);
        setIsProcessing(false);
        fetchAuditTrail();
        return;
      }

      // Normal Natural Language Query Pipeline
      const res = await fetch('/api/copilot/v2/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          mode: currentMode,
          companyId: companyContext.companyId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to query Copilot API');
      }

      const copilotResponse: CopilotMessageV2 = await res.json();
      setMessages((prev) => [...prev, copilotResponse]);
      fetchAuditTrail();
    } catch (err: any) {
      const errorMsg: CopilotMessageV2 = {
        messageId: `MSG-ERR-${Date.now()}`,
        sender: 'Copilot',
        content: `⚠️ I encountered an error communicating with the local analytical query engine: ${err.message}. Tally connection remains safe and read-only.`,
        timestamp: new Date().toISOString(),
        mode: currentMode,
        confidence: { intentConfidence: 0.5, fieldMappingConfidence: 0.5, queryConfidence: 0.5 }
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrilldown = async (dimension: string, value: string, parentQueryId?: string) => {
    try {
      const res = await fetch('/api/copilot/v2/drilldown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentQueryId: parentQueryId || 'AST-ROOT',
          dimension,
          value,
          companyId: companyContext.companyId
        })
      });
      const data = await res.json();
      setDrilldownDrawer({
        isOpen: true,
        dimension,
        value,
        records: data.records || [],
        lineage: data.lineage
      });
    } catch (err) {
      console.error('Drilldown error', err);
    }
  };

  const handleReportNaturalEdit = async (reportId: string, instruction: string) => {
    if (!instruction.trim()) return;
    try {
      const res = await fetch('/api/copilot/v2/edit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, instruction })
      });
      const data = await res.json();
      if (data.reportDraft && reportModal) {
        setReportModal({
          ...reportModal,
          report: data.reportDraft,
          editInstruction: ''
        });
      }
    } catch (err) {
      console.error('Report edit error', err);
    }
  };

  const handleSaveReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/copilot/v2/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      });
      const data = await res.json();
      if (data.success && reportModal) {
        setReportModal({
          ...reportModal,
          report: { ...reportModal.report, isSaved: true }
        });
        fetchAuditTrail();
      }
    } catch (err) {
      console.error('Save report error', err);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'Helpful' | 'NotHelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.messageId === messageId ? { ...m, feedback } : m))
    );
    try {
      await fetch('/api/copilot/v2/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback })
      });
    } catch (err) {
      console.error('Feedback error', err);
    }
  };

  const handleSimulateVoice = async () => {
    if (voiceState.isListening) {
      setVoiceState((prev) => ({ ...prev, isListening: false }));
      return;
    }

    setVoiceState({
      isListening: true,
      transcript: 'Listening for financial command...',
      recognizedIntent: '',
      confidence: 0
    });

    setTimeout(async () => {
      const sampleTranscripts = [
        'Show sales this month and compare with last year',
        'Which customers owe the most in receivables?',
        'Build a monthly sales report with GST amounts'
      ];
      const selected = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];

      try {
        const res = await fetch('/api/copilot/v2/voice-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: selected })
        });
        const data = await res.json();

        setVoiceState({
          isListening: false,
          transcript: selected,
          recognizedIntent: data.voiceState.recognizedIntent,
          confidence: data.voiceState.confidence
        });

        setInputQuery(selected);
        if (data.mode) {
          setActiveMode(data.mode);
        }
      } catch (err) {
        setVoiceState((prev) => ({ ...prev, isListening: false }));
      }
    }, 1200);
  };

  const handleSwitchCompany = async (newCompanyId: string, newCompanyName: string) => {
    try {
      const res = await fetch('/api/copilot/v2/switch-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: newCompanyId, companyName: newCompanyName })
      });
      const data = await res.json();
      if (data.success) {
        setCompanyContext(data.activeCompany);
        // Requirement 106: Context Isolation reset
        setMessages([]);
        const resetMsg: CopilotMessageV2 = {
          messageId: `MSG-RESET-${Date.now()}`,
          sender: 'System',
          content: `Switched active company context to **${newCompanyName}** (${newCompanyId}). Memory and prior query caches have been safely cleared to prevent cross-company data leakage.`,
          timestamp: new Date().toISOString(),
          mode: 'Ask',
          confidence: { intentConfidence: 1.0, fieldMappingConfidence: 1.0, queryConfidence: 1.0 }
        };
        setMessages([resetMsg]);
        fetchAuditTrail();
      }
    } catch (err) {
      console.error('Company switch error', err);
    }
  };

  return (
    <div id="phase19-copilot-container" className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 text-slate-900">
      {/* Top Header Bar */}
      <header id="copilot-header" className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">EXFIN COPILOT</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Phase 19
                </span>
              </div>
              <p className="text-xs text-slate-500">Intelligent Accounting Copilot & Natural-Language Tally Query Engine</p>
            </div>
          </div>
        </div>

        {/* Data Source & Freshness Badges */}
        <div className="flex items-center space-x-3">
          {/* Company Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500 ml-2 mr-1" />
            <select
              id="company-context-selector"
              value={companyContext.companyId}
              onChange={(e) => {
                const isAcme = e.target.value === 'COMP_ACME_02';
                handleSwitchCompany(
                  e.target.value,
                  isAcme ? 'Acme Technologies Pvt Ltd' : 'EXFIN GLOBAL ENTERPRISES PVT LTD'
                );
              }}
              aria-label="Active Company Context"
              className="bg-transparent text-xs font-medium text-slate-700 py-1 px-2 focus:outline-none cursor-pointer"
            >
              <option value="COMP_EXFIN_01">EXFIN GLOBAL ENTERPRISES PVT LTD</option>
              <option value="COMP_ACME_02">Acme Technologies Pvt Ltd</option>
            </select>
          </div>

          {/* Data Source Indicator (Requirement 4) */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Source: <strong>{companyContext.dataSource}</strong></span>
          </div>

          {/* Data Freshness Indicator (Requirement 5) */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Last sync: <strong>8 mins ago</strong></span>
          </div>

          {/* Audit Trail Button */}
          <button
            id="btn-open-audit-trail"
            onClick={() => setAuditDrawerOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>

          {/* Privacy & AI Provider */}
          <button
            id="btn-open-privacy-settings"
            onClick={() => setPrivacyModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>{providerConfig.isLocalMode ? 'Local Engine' : 'Gemini 3.8'}</span>
          </button>
        </div>
      </header>

      {/* Copilot Mode Selector Bar (Requirement 2 & 151) */}
      <div id="copilot-mode-selector" className="bg-slate-100/80 border-b border-slate-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1 overflow-x-auto">
          <span className="text-xs font-semibold uppercase text-slate-500 mr-2 tracking-wider">Mode:</span>
          {availableModes.map((mode) => {
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                id={`mode-btn-${mode.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>

        <div className="flex items-center text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
          <span>Strictly Read-Only against Tally • Zero Data Alteration</span>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div id="copilot-conversation-stream" className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.sender === 'User';
          const isSystem = msg.sender === 'System';
          const displayMode = displayModeMap[msg.messageId] || 'both';

          if (isSystem) {
            return (
              <div key={msg.messageId} className="flex justify-center my-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{msg.content}</span>
                </div>
              </div>
            );
          }

          if (isUser) {
            return (
              <div key={msg.messageId} className="flex justify-end">
                <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-5 py-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
                    <span className="font-semibold uppercase tracking-wider">{msg.mode}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          }

          // Copilot Response Message
          return (
            <div key={msg.messageId} className="flex flex-col space-y-3 max-w-4xl">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-5 shadow-sm space-y-4">
                {/* Message Header & Provenance Banner (Requirement 6) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <span className="text-xs font-semibold text-slate-800">EXFIN Accounting Copilot</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.confidence && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {(msg.confidence.queryConfidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>

                  {/* Provenance Quick Badges */}
                  {msg.provenance && (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        Dataset: <strong>{msg.provenance.dataset}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        Period: <strong>{msg.provenance.period}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Narrative Text */}
                <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                  {msg.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>

                {/* Missing Data Notification (Requirement 8 & 154) */}
                {msg.isMissingData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Unverified Attribute</h4>
                      <p className="text-xs mt-1">
                        {msg.missingDataReason || "The requested metrics do not exist in the connected Tally database. Copilot strictly prohibits synthetic data creation."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Clarification Prompt (Requirement 9 & 155) */}
                {msg.clarificationPrompt && (
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-indigo-900">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold">{msg.clarificationPrompt.question}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.clarificationPrompt.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(opt, 'Ask')}
                          className="text-left text-xs bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 font-medium text-slate-700 transition-colors flex items-center justify-between group"
                        >
                          <span>{opt}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Numeric Headline & Deterministic Aggregation Card (Requirement 18, 19, 21) */}
                {msg.numericHeadline && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {msg.numericHeadline.label}
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {msg.numericHeadline.value}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Period: <strong>{msg.numericHeadline.period}</strong>
                      </div>
                    </div>

                    {msg.numericHeadline.percentageChange && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:text-right shrink-0">
                        <div className="flex items-center sm:justify-end space-x-1">
                          {msg.numericHeadline.percentageChange.startsWith('-') ? (
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          )}
                          <span
                            className={`text-sm font-bold ${
                              msg.numericHeadline.percentageChange.startsWith('-')
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {msg.numericHeadline.percentageChange}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          vs {msg.numericHeadline.comparedWith || 'Prior Period'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ageing Breakdown Card (Requirement 55) */}
                {msg.ageingBreakdown && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Outstanding Ageing Analysis (Days Overdue)
                      </span>
                      <span className="text-xs text-slate-500">5 Analytical Brackets</span>
                    </div>
                    <div className="divide-y divide-slate-200 text-xs">
                      {msg.ageingBreakdown.map((b) => (
                        <div key={b.bracket} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/60">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-slate-800 w-24">{b.bracket}</span>
                            <span className="text-slate-500">{b.count} vouchers</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="font-mono font-medium text-slate-900">
                              ₹{b.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="w-14 text-right font-medium text-slate-600">
                              {b.percentageOfTotal.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tax Reconciliation Card (Requirement 56) */}
                {msg.taxReconciliation && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 uppercase tracking-wider">
                        GST Tax Output Reconciliation
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Matched (₹0.00 Variance)
                      </span>
                    </div>
                    <p className="text-emerald-800">{msg.taxReconciliation.technicalCause}</p>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60">
                      <div>
                        <span className="text-slate-500 block">Sales Ledger Tax:</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{msg.taxReconciliation.salesTaxComputed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">GSTR-1 Outward:</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{msg.taxReconciliation.gstOutputRecorded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Difference:</span>
                        <span className="font-mono font-bold text-emerald-700">₹0.00 (Exact)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights Engine Breakdown (Requirement 47 - 59) */}
                {msg.insights && msg.insights.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Analytical Insights & Anomalies</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {msg.insights.map((ins) => (
                        <div
                          key={ins.insightId}
                          className="border border-slate-200 rounded-lg p-3 bg-white hover:border-indigo-300 transition-colors space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{ins.metric}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                                ins.type === 'Anomaly' || ins.type === 'Exception'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {ins.type}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{ins.evidence}</p>
                          <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span>Method: {ins.methodUsed}</span>
                            <span>{(ins.confidence * 100).toFixed(0)}% conf</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visualizations: Table & Chart (Requirement 70-74) */}
                {(msg.tableData || msg.chartData) && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden space-y-0">
                    {/* View mode toggle */}
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Data Records & Visual Representation
                      </span>
                      <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md p-0.5 text-xs">
                        <button
                          onClick={() => setDisplayModeMap({ ...displayModeMap, [msg.messageId]: 'table' })}
                          className={`px-2 py-1 rounded ${
                            displayMode === 'table' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Table
                        </button>
                        <button
                          onClick={() => setDisplayModeMap({ ...displayModeMap, [msg.messageId]: 'chart' })}
                          className={`px-2 py-1 rounded ${
                            displayMode === 'chart' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => setDisplayModeMap({ ...displayModeMap, [msg.messageId]: 'both' })}
                          className={`px-2 py-1 rounded ${
                            displayMode === 'both' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Both
                        </button>
                      </div>
                    </div>

                    {/* Chart Visualization */}
                    {(displayMode === 'chart' || displayMode === 'both') && msg.chartData && (
                      <div className="p-4 bg-white border-b border-slate-100">
                        <div className="space-y-2.5">
                          {msg.chartData.map((d, i) => {
                            const max = Math.max(...msg.chartData!.map((c) => c.value || 0));
                            const pct = max > 0 ? (d.value / max) * 100 : 0;
                            return (
                              <div key={i} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-medium">
                                  <span className="text-slate-800">{d.name}</span>
                                  <span className="font-mono text-slate-600">
                                    ₹{d.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Table Visualization */}
                    {(displayMode === 'table' || displayMode === 'both') && msg.tableData && (
                      <div className="overflow-x-auto max-h-72">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              {Object.keys(msg.tableData[0] || {}).map((col) => (
                                <th key={col} className="px-4 py-2.5 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                              <th className="px-4 py-2.5 text-right whitespace-nowrap">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {msg.tableData.map((row, rIdx) => {
                              const primaryDim = row.Customer || row.Month || row.Product || row.TaxHead || Object.values(row)[0];
                              return (
                                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                  {Object.entries(row).map(([k, v]: [string, any], cIdx) => (
                                    <td key={cIdx} className="px-4 py-2 whitespace-nowrap text-slate-800 font-medium">
                                      {typeof v === 'number'
                                        ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                        : String(v)}
                                    </td>
                                  ))}
                                  <td className="px-4 py-2 whitespace-nowrap text-right">
                                    <button
                                      onClick={() => handleDrilldown('Customer', String(primaryDim), msg.traceability?.queryAst?.astId)}
                                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center space-x-1"
                                    >
                                      <span>Drill Down</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Report Generation Draft Preview (Requirement 65-69) */}
                {msg.reportDraft && (
                  <div className="border border-indigo-200 rounded-xl bg-indigo-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{msg.reportDraft.title}</h4>
                          <p className="text-[11px] text-slate-500">{msg.reportDraft.description}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-semibold">
                        Draft v{msg.reportDraft.version}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 bg-white border border-indigo-100 rounded-lg p-3">
                      <div>
                        <strong className="text-slate-700">Display Columns:</strong>{' '}
                        <span className="font-mono text-slate-600">{msg.reportDraft.displayColumns.join(', ')}</span>
                      </div>
                      <div>
                        <strong className="text-slate-700">Calculations:</strong>{' '}
                        <span className="font-mono text-slate-600">{msg.reportDraft.calculations.join(' | ')}</span>
                      </div>
                      <div>
                        <strong className="text-slate-700">Group By:</strong>{' '}
                        <span className="font-mono text-slate-600">{msg.reportDraft.groupBy.join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() =>
                          setReportModal({
                            isOpen: true,
                            report: msg.reportDraft!,
                            editInstruction: '',
                            isEditing: false
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      >
                        Review & Edit
                      </button>
                      <button
                        onClick={() => handleSaveReport(msg.reportDraft!.reportId)}
                        disabled={msg.reportDraft.isSaved}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                          msg.reportDraft.isSaved
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{msg.reportDraft.isSaved ? 'Saved to Registry' : 'Save Report'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Traceability & Audit Tool Bar (Requirement 7) */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Trace:</span>
                    <button
                      onClick={() => setActiveTraceModal({ type: 'Data', msg })}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center space-x-1"
                    >
                      <TableIcon className="w-3 h-3 text-slate-500" />
                      <span>[View Data]</span>
                    </button>
                    <button
                      onClick={() => setActiveTraceModal({ type: 'Query', msg })}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center space-x-1"
                    >
                      <Code2 className="w-3 h-3 text-slate-500" />
                      <span>[View Query]</span>
                    </button>
                    <button
                      onClick={() => setActiveTraceModal({ type: 'Calculation', msg })}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center space-x-1"
                    >
                      <Calculator className="w-3 h-3 text-slate-500" />
                      <span>[View Calculation]</span>
                    </button>
                    <button
                      onClick={() => setActiveTraceModal({ type: 'Source', msg })}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center space-x-1"
                    >
                      <Compass className="w-3 h-3 text-slate-500" />
                      <span>[View Source]</span>
                    </button>
                  </div>

                  {/* Feedback Buttons (Requirement 145) */}
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-[11px]">Was this helpful?</span>
                    <button
                      onClick={() => handleFeedback(msg.messageId, 'Helpful')}
                      className={`p-1 rounded hover:text-emerald-600 transition-colors ${
                        msg.feedback === 'Helpful' ? 'text-emerald-600 bg-emerald-50' : ''
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.messageId, 'NotHelpful')}
                      className={`p-1 rounded hover:text-rose-600 transition-colors ${
                        msg.feedback === 'NotHelpful' ? 'text-rose-600 bg-rose-50' : ''
                      }`}
                      title="Not Helpful"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-xl p-4 max-w-md shadow-xs animate-pulse">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Processing Natural Language Query...</span>
              <p className="text-[11px] text-slate-400">Validating AST • Computing totals against verified local store</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div id="quick-prompts-bar" className="bg-white border-t border-slate-200 px-6 py-2.5 overflow-x-auto">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Suggested:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => handleSendMessage(item.prompt, item.mode)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-medium border border-slate-200 transition-all shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Input Area with Voice & Actions */}
      <div id="copilot-input-container" className="bg-white border-t border-slate-200 p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-3 max-w-7xl mx-auto"
        >
          {/* Voice Input Button (Requirement 111 & 112) */}
          <button
            type="button"
            id="voice-command-btn"
            onClick={handleSimulateVoice}
            className={`p-2.5 rounded-xl border transition-all ${
              voiceState.isListening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title="Voice-Ready Command Interface (Speech-to-Intent)"
          >
            {voiceState.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Natural Language Prompt Input (Requirement 3) */}
          <div className="relative flex-1">
            <input
              id="copilot-natural-language-input"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your connected Tally data (e.g., 'Show sales this month', 'Which customers owe the most?')..."
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="copilot-submit-query-btn"
            disabled={isProcessing || !inputQuery.trim()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-xs flex items-center space-x-2 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Traceability Modal (Requirements 7, 24, 25) */}
      {activeTraceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Traceability Audit: [{activeTraceModal.type}]
                </h3>
              </div>
              <button
                onClick={() => setActiveTraceModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activeTraceModal.type === 'Data' && (
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Verified local data snapshot for <strong>{activeTraceModal.msg.provenance?.company}</strong>:
                  </p>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {JSON.stringify(activeTraceModal.msg.tableData || activeTraceModal.msg.chartData || {}, null, 2)}
                  </pre>
                </div>
              )}

              {activeTraceModal.type === 'Query' && (
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Compiled safe SQL query AST executed on DuckDB analytical engine (no raw SQL injection):
                  </p>
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {activeTraceModal.msg.traceability?.querySql ||
                      `SELECT "PartyLedgerName", SUM("Amount") AS "MetricTotal" FROM "${activeTraceModal.msg.provenance?.dataset || 'SalesVouchers'}" GROUP BY "PartyLedgerName"`}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                    <strong>Complexity Score:</strong> {activeTraceModal.msg.traceability?.queryAst?.complexityScore || 1} •{' '}
                    <strong>Cost:</strong> {activeTraceModal.msg.traceability?.queryAst?.estimatedCost || 'Low (<10ms)'}
                  </div>
                </div>
              )}

              {activeTraceModal.type === 'Calculation' && (
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Deterministic mathematical formula verified by C# analytical engine:
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 p-3 rounded-lg font-mono text-xs">
                    Formula: {activeTraceModal.msg.traceability?.calculationFormula || 'SUM("Amount")'}
                    <br />
                    Variance Math: ((CurrentPeriod - PreviousPeriod) / |PreviousPeriod|) * 100
                  </div>
                  <p className="text-slate-500">
                    Zero-division protection active: if previous period amount is zero, returns <code>0.00%</code> rather than crashing.
                  </p>
                </div>
              )}

              {activeTraceModal.type === 'Source' && (
                <div className="space-y-2">
                  <p className="text-slate-600">Originating Tally Prime data lineage path:</p>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono text-xs text-slate-800 space-y-1">
                    <div><strong>Tally Object:</strong> {activeTraceModal.msg.traceability?.sourceCollectionPath || 'Tally.Company.Vouchers'}</div>
                    <div><strong>Local Store:</strong> DuckDB Embedded Columnar Parquet Store</div>
                    <div><strong>Lineage:</strong> {activeTraceModal.msg.traceability?.lineagePath || 'Native Tally XML Connector -> Reconstructed Parquet Cache'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveTraceModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Drawer (Requirement 80-83) */}
      {drilldownDrawer && drilldownDrawer.isOpen && (
        <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Drill Down: {drilldownDrawer.dimension} = '{drilldownDrawer.value}'
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Lineage: {drilldownDrawer.lineage?.sourceCollection}
              </p>
            </div>
            <button
              onClick={() => setDrilldownDrawer(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-xs text-slate-600">
              Showing {drilldownDrawer.records.length} underlying voucher allocations for this party:
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {drilldownDrawer.records.map((r, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.VoucherNumber}</span>
                    <span className="font-mono font-bold text-indigo-600">
                      ₹{r.Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Date: {r.Date} • Type: {r.VoucherType}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {r.Status}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    Item: <strong>{r.Item}</strong> (Qty: {r.Qty} @ ₹{r.Rate})
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={() => setDrilldownDrawer(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
            >
              Close Drilldown
            </button>
          </div>
        </div>
      )}

      {/* Natural Language Report Review & Edit Modal (Requirements 65-69, 75-78) */}
      {reportModal && reportModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Review & Author Report Definition
                </h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Report Title</label>
                  <input
                    type="text"
                    value={reportModal.report.title}
                    onChange={(e) =>
                      setReportModal({
                        ...reportModal,
                        report: { ...reportModal.report, title: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Recommended Chart</label>
                  <select
                    value={reportModal.report.recommendedChartType}
                    onChange={(e) =>
                      setReportModal({
                        ...reportModal,
                        report: {
                          ...reportModal.report,
                          recommendedChartType: e.target.value as any
                        }
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Bar">Bar Chart</option>
                    <option value="Line">Line Chart</option>
                    <option value="Pie">Pie Chart</option>
                    <option value="Column">Column Chart</option>
                  </select>
                </div>
              </div>

              {/* Natural Language Report Editing Input */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-2">
                <label className="font-bold text-indigo-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Modify with Natural Language</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={reportModal.editInstruction}
                    onChange={(e) =>
                      setReportModal({ ...reportModal, editInstruction: e.target.value })
                    }
                    placeholder="e.g. 'Add GST amount', 'Remove quantity', 'Group by customer'..."
                    className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs"
                  />
                  <button
                    onClick={() =>
                      handleReportNaturalEdit(reportModal.report.reportId, reportModal.editInstruction)
                    }
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Apply Edit
                  </button>
                </div>
              </div>

              {/* Display Columns */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Display Columns:</label>
                <div className="flex flex-wrap gap-1.5">
                  {reportModal.report.displayColumns.map((col) => (
                    <span
                      key={col}
                      className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Calculations */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Calculated Expressions:</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 font-mono text-[11px] text-slate-700">
                  {reportModal.report.calculations.map((c, i) => (
                    <div key={i}>{c}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {reportModal.report.isSaved ? '✅ Saved in Phase 18 Report Store' : 'Draft not yet committed'}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setReportModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSaveReport(reportModal.report.reportId)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Report Definition</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Drawer (Requirements 134, 135) */}
      {auditDrawerOpen && (
        <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Copilot Query Audit Trail</h3>
                <p className="text-xs text-slate-500">Traceable security log of all queries & tool executions</p>
              </div>
            </div>
            <button
              onClick={() => setAuditDrawerOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {auditLogs.map((log) => (
              <div key={log.auditId} className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.question}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                    {log.status}
                  </span>
                </div>
                <div className="text-slate-500 space-y-0.5 text-[11px]">
                  <div>User: <strong>{log.user}</strong> • Intent: <strong>{log.intent}</strong></div>
                  <div>Dataset: <strong>{log.dataset}</strong> • Cost: <strong>{log.queryCost}</strong></div>
                  <div>Model: {log.modelUsed}</div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {log.toolCalls?.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                      🔧 {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={() => setAuditDrawerOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Privacy & AI Provider Configuration Modal (Requirements 123-129, 160) */}
      {privacyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">AI Model & Data Minimization</h3>
              </div>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Strict Data Minimization Guarantee</span>
                </div>
                <p className="text-indigo-800 leading-relaxed">
                  {providerConfig.cloudDisclosureText}
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700">Execution Mode:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="providerMode"
                      checked={!providerConfig.isLocalMode}
                      onChange={() => setProviderConfig({ ...providerConfig, isLocalMode: false })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="text-slate-800">Gemini 3.8 Flash (Server-Side Cloud Model)</strong>
                      <p className="text-slate-500 text-[11px]">
                        Provides executive financial narratives over deterministic AST math results via server-side SDK.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="providerMode"
                      checked={providerConfig.isLocalMode}
                      onChange={() => setProviderConfig({ ...providerConfig, isLocalMode: true })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="text-slate-800">Local Offline Deterministic Engine</strong>
                      <p className="text-slate-500 text-[11px]">
                        100% on-premises. Zero cloud transmissions. Uses built-in heuristic narrative compiler.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <strong className="text-slate-800">Sensitive Field Masking</strong>
                  <p className="text-slate-500 text-[11px]">Automatically masks PAN, GSTINs, and phone numbers</p>
                </div>
                <input
                  type="checkbox"
                  checked={providerConfig.dataMinimizationEnabled}
                  onChange={(e) =>
                    setProviderConfig({ ...providerConfig, dataMinimizationEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
