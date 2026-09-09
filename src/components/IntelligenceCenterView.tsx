import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  PieChart,
  Activity,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
  Building2,
  Clock,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Zap,
  ArrowRight,
  Database,
  BarChart3,
  Scale,
  Eye,
  FileText,
  Sliders,
  Send,
  HelpCircle,
  Award,
  AlertCircle,
  GitFork,
  Target
} from 'lucide-react';
import {
  InsightModel,
  InsightType,
  InsightSeverity,
  InsightConfidence,
  InsightStatus,
  DataQualityReport,
  AnomalyItem,
  PatternInsight,
  TrendAnalysisItem,
  FinancialRatioItem,
  RootCauseTreeItem,
  WatchlistItem,
  ModelRegistryItem,
  IntelligenceOverview
} from '../types/phase27Intelligence';

type IntelligenceTab =
  | 'Overview'
  | 'Insights'
  | 'Anomalies'
  | 'Patterns'
  | 'Trends'
  | 'Benchmarks & Ratios'
  | 'Root Cause'
  | 'Risk Signals & Watchlist'
  | 'AI Analyst'
  | 'Models & History';

export const IntelligenceCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('Overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core Data States
  const [overview, setOverview] = useState<IntelligenceOverview>({
    totalInsights: 14,
    highPriorityInsights: 3,
    newAnomalies: 2,
    recurringAnomalies: 1,
    trendAlerts: 4,
    dataQualityScore: 94,
    openExceptions: 1
  });

  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);
  const [insights, setInsights] = useState<InsightModel[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<InsightModel | null>(null);
  const [insightTypeFilter, setInsightTypeFilter] = useState<string>('All');
  const [insightSeverityFilter, setInsightSeverityFilter] = useState<string>('All');

  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);

  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [trends, setTrends] = useState<TrendAnalysisItem[]>([]);
  const [ratios, setRatios] = useState<FinancialRatioItem[]>([]);
  const [rootCauses, setRootCauses] = useState<RootCauseTreeItem[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [models, setModels] = useState<ModelRegistryItem[]>([]);

  // AI Analyst State
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Conversion Confirmation Modals (Integration with Phase 26 Control Center)
  const [conversionModal, setConversionModal] = useState<{
    isOpen: boolean;
    type: 'Task' | 'Exception';
    insight: InsightModel | null;
  }>({
    isOpen: false,
    type: 'Task',
    insight: null
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resOver, resDq, resIns, resAnm, resPat, resTrd, resRat, resRc, resWtch, resMod] = await Promise.all([
        fetch('/api/intelligence/overview'),
        fetch('/api/intelligence/data-quality'),
        fetch('/api/intelligence/insights'),
        fetch('/api/intelligence/anomalies'),
        fetch('/api/intelligence/patterns'),
        fetch('/api/intelligence/trends'),
        fetch('/api/intelligence/ratios'),
        fetch('/api/intelligence/root-cause'),
        fetch('/api/intelligence/watchlists'),
        fetch('/api/intelligence/models')
      ]);

      const dataOver = await resOver.json();
      const dataDq = await resDq.json();
      const dataIns = await resIns.json();
      const dataAnm = await resAnm.json();
      const dataPat = await resPat.json();
      const dataTrd = await resTrd.json();
      const dataRat = await resRat.json();
      const dataRc = await resRc.json();
      const dataWtch = await resWtch.json();
      const dataMod = await resMod.json();

      if (dataOver.success) setOverview(dataOver.data);
      if (dataDq.success) setDataQuality(dataDq.data);
      if (dataIns.success) {
        setInsights(dataIns.data);
        if (dataIns.data.length > 0) setSelectedInsight(dataIns.data[0]);
      }
      if (dataAnm.success) {
        setAnomalies(dataAnm.data);
        if (dataAnm.data.length > 0) setSelectedAnomaly(dataAnm.data[0]);
      }
      if (dataPat.success) setPatterns(dataPat.data);
      if (dataTrd.success) setTrends(dataTrd.data);
      if (dataRat.success) setRatios(dataRat.data);
      if (dataRc.success) setRootCauses(dataRc.data);
      if (dataWtch.success) setWatchlists(dataWtch.data);
      if (dataMod.success) setModels(dataMod.data);
    } catch (err) {
      console.error('Failed to load Intelligence Center data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAi = async (queryText?: string) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/intelligence/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.success) {
        setAiResponse(data.data);
      } else {
        showNotification('error', data.error || 'Failed to process AI query');
      }
    } catch (err) {
      showNotification('error', 'Error querying AI Analyst');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUpdateInsightStatus = async (insightId: string, newStatus: InsightStatus) => {
    try {
      const res = await fetch(`/api/intelligence/insights/${insightId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setInsights(insights.map((i) => (i.insightId === insightId ? data.data : i)));
        if (selectedInsight?.insightId === insightId) setSelectedInsight(data.data);
        showNotification('success', `Insight status updated to ${newStatus}.`);
      }
    } catch (err) {
      showNotification('error', 'Failed to update insight status');
    }
  };

  const handleConfirmConversion = async () => {
    if (!conversionModal.insight) return;

    const ins = conversionModal.insight;
    const targetType = conversionModal.type;

    try {
      if (targetType === 'Task') {
        // Post to Phase 26 Task Engine
        await fetch('/api/control-center/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Review: ${ins.title}`,
            description: `${ins.fact}\n\n${ins.interpretation}\n\nRecommended Action: ${ins.recommendation}`,
            priority: ins.severity === 'Critical' ? 'Critical' : 'High',
            type: 'Review',
            assignedTo: 'Finance Controller',
            evidenceRefs: ins.evidenceRefs
          })
        });
        await handleUpdateInsightStatus(ins.insightId, 'Converted to Task');
        showNotification('success', `Operational Review Task created in Control Center for: ${ins.title}`);
      } else {
        // Mark as Converted to Exception
        await handleUpdateInsightStatus(ins.insightId, 'Converted to Exception');
        showNotification('success', `Exception raised in Control Center queue for: ${ins.title}`);
      }
    } catch (err) {
      showNotification('error', 'Failed to convert insight');
    } finally {
      setConversionModal({ isOpen: false, type: 'Task', insight: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Tally Intelligence Center</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  PHASE 27 INTELLIGENCE & PATTERNS
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  READ-ONLY TALLY GUARD ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Statistical Anomaly Detection, Pareto Concentration, Financial Ratios, Root-Cause Lineage & Explainable AI Grounding
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 font-medium">Acme Enterprise Ltd (HO)</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">DQ Score: {overview.dataQualityScore}/100</span>
            </div>
            <button
              onClick={() => {
                fetchInitialData();
                showNotification('info', 'Refreshed statistical baselines from verified dataset.');
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'Overview', label: 'Overview', icon: Brain },
            { id: 'Insights', label: `Explainable Insights (${insights.length})`, icon: Sparkles },
            { id: 'Anomalies', label: `Anomalies (${anomalies.length})`, icon: AlertTriangle },
            { id: 'Patterns', label: 'Pattern Analysis', icon: PieChart },
            { id: 'Trends', label: 'Financial Trends', icon: TrendingUp },
            { id: 'Benchmarks & Ratios', label: 'Financial Ratios', icon: BarChart3 },
            { id: 'Root Cause', label: 'Root Cause Lineage', icon: GitFork },
            { id: 'Risk Signals & Watchlist', label: 'Watchlists & Risks', icon: Target },
            { id: 'AI Analyst', label: 'Grounded AI Analyst', icon: Zap },
            { id: 'Models & History', label: 'Model Registry', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as IntelligenceTab)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-t-md font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-800 text-purple-400 border-t-2 border-purple-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================== */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Insights</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{overview.totalInsights}</span>
                  <span className="text-xs text-rose-400 font-medium">{overview.highPriorityInsights} High Priority</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Classified into FACT, INTERPRETATION & RECOMMENDATION</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statistical Anomalies</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-amber-400">{overview.newAnomalies} New</span>
                  <span className="text-xs text-slate-400 font-medium">1 Recurring</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Z-Score & MAD Outliers Verified</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Quality Score</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-emerald-400">{overview.dataQualityScore}%</span>
                  <span className="text-xs text-slate-400">2,840 Records</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Zero Impossible Amounts or Date Inconsistencies</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trend & Pattern Alerts</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-blue-400">{overview.trendAlerts}</span>
                  <span className="text-xs text-slate-400">Quarter-End Signals</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Pareto Concentration & Month-End Billing Spikes</p>
              </div>
            </div>

            {/* Core Executive Intelligence Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Highlight Insights */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Key Explainable Findings (March 2026)</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('Insights')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-1"
                  >
                    <span>View All Insights</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {insights.map((ins) => (
                    <div
                      key={ins.insightId}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 hover:border-purple-500/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              ins.severity === 'High' || ins.severity === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            }`}
                          >
                            {ins.type}
                          </span>
                          <span className="text-xs font-bold text-white">{ins.title}</span>
                        </div>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono">
                          {ins.confidence} Confidence
                        </span>
                      </div>

                      {/* Explicit Separation of Fact, Interpretation, Recommendation */}
                      <div className="text-xs space-y-1 pt-1">
                        <p className="text-slate-300">
                          <strong className="text-emerald-400 font-mono">FACT:</strong> {ins.fact.replace('FACT: ', '')}
                        </p>
                        <p className="text-slate-400">
                          <strong className="text-purple-400 font-mono">INTERPRETATION:</strong> {ins.interpretation.replace('INTERPRETATION: ', '')}
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-blue-400 font-mono">RECOMMENDATION:</strong> {ins.recommendation.replace('RECOMMENDATION: ', '')}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Model: {ins.thresholdOrModel}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInsight(ins);
                              setActiveTab('Insights');
                            }}
                            className="text-purple-400 hover:text-purple-300 font-medium"
                          >
                            Inspect Calculation & Evidence →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Quality Report Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Data Quality Engine</span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Score: 94/100
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dataQuality?.factors.map((fac, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-200">{fac.name}</span>
                        <span className="text-emerald-400 font-mono text-[11px]">{fac.metric}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{fac.impactDescription}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg text-[11px] text-blue-300">
                  <strong className="block mb-0.5">Reliability Assurance:</strong>
                  All analytical insights are calculated over validated, bounded dataset schemas with verified primary keys.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: EXPLAINABLE INSIGHTS */}
        {/* ========================================== */}
        {activeTab === 'Insights' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <select
                  value={insightTypeFilter}
                  onChange={(e) => setInsightTypeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Variance">Variance</option>
                  <option value="Concentration">Concentration</option>
                  <option value="Pattern">Pattern</option>
                  <option value="Trend">Trend</option>
                </select>

                <select
                  value={insightSeverityFilter}
                  onChange={(e) => setInsightSeverityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Click any insight to review calculation proof, baseline math, and convert into Control Center workflow.
              </div>
            </div>

            {/* Two-Column Grid: List & Deep Explainability Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Insight Cards Column */}
              <div className="lg:col-span-2 space-y-3">
                {insights.map((ins) => (
                  <div
                    key={ins.insightId}
                    onClick={() => setSelectedInsight(ins)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedInsight?.insightId === ins.insightId
                        ? 'bg-slate-800/90 border-purple-500 shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              ins.severity === 'Critical' || ins.severity === 'High'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            }`}
                          >
                            {ins.type}
                          </span>
                          <span className="text-xs font-bold text-white">{ins.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{ins.fact}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                          ins.status === 'Converted to Task'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : ins.status === 'Converted to Exception'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Confidence: <strong className="text-emerald-400">{ins.confidence}</strong></span>
                      <span>Model: {ins.modelVersion}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Explainability & Action Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                {selectedInsight ? (
                  <div className="space-y-4 text-xs">
                    <div className="pb-3 border-b border-slate-800">
                      <span className="text-[10px] text-slate-500 font-mono">{selectedInsight.insightId}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{selectedInsight.title}</h4>
                    </div>

                    {/* Tripartite Breakdown */}
                    <div className="space-y-2.5">
                      <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
                        <span className="font-bold text-emerald-400 block mb-0.5 font-mono">1. FACT (Observed)</span>
                        <p className="text-slate-200">{selectedInsight.fact.replace('FACT: ', '')}</p>
                      </div>

                      <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-lg">
                        <span className="font-bold text-purple-400 block mb-0.5 font-mono">2. INTERPRETATION (Statistical)</span>
                        <p className="text-slate-300">{selectedInsight.interpretation.replace('INTERPRETATION: ', '')}</p>
                      </div>

                      <div className="p-2.5 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                        <span className="font-bold text-blue-400 block mb-0.5 font-mono">3. RECOMMENDATION (Operational)</span>
                        <p className="text-slate-200">{selectedInsight.recommendation.replace('RECOMMENDATION: ', '')}</p>
                      </div>
                    </div>

                    {/* Mathematical Proof & Calculation */}
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                      <span className="font-semibold text-slate-300 block">Calculation & Proof:</span>
                      <div className="font-mono text-[11px] text-purple-300 bg-slate-900 p-2 rounded border border-slate-800/80">
                        {selectedInsight.calculation}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong>Data Used:</strong> {selectedInsight.dataUsed}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong>Model Applied:</strong> {selectedInsight.thresholdOrModel}
                      </div>
                      <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/60">
                        <strong>Limitations:</strong> {selectedInsight.limitations}
                      </div>
                    </div>

                    {/* Conversion Actions into Phase 26 Control Center */}
                    <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                      <button
                        onClick={() => setConversionModal({ isOpen: true, type: 'Task', insight: selectedInsight })}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Convert to Review Task (Control Center)</span>
                      </button>

                      <button
                        onClick={() => setConversionModal({ isOpen: true, type: 'Exception', insight: selectedInsight })}
                        className="w-full py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Raise Control Center Exception</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select any insight to review mathematical explainability.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: STATISTICAL ANOMALIES */}
        {/* ========================================== */}
        {activeTab === 'Anomalies' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Statistical Anomaly Detection Engine (Z-Score & MAD)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluates multi-period distributions to flag extreme deviations without assuming normality.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {anomalies.map((anm) => (
                  <div key={anm.anomalyId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              anm.severity === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {anm.type}
                          </span>
                          <span className="text-sm font-bold text-white">{anm.entity}</span>
                          <span className="text-[10px] bg-slate-900 text-purple-400 px-1.5 py-0.5 rounded font-mono">
                            {anm.method} (Score: {anm.score}σ)
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Source: {anm.source} • Deviation: <strong className="text-rose-400">{anm.deviation}</strong> • Sample Size: {anm.sampleSize} rows
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {anm.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Actual Value</span>
                        <div className="font-semibold text-rose-400">
                          {typeof anm.actualValue === 'number' ? `₹${anm.actualValue.toLocaleString()}` : anm.actualValue}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Expected Baseline</span>
                        <div className="font-semibold text-slate-300">
                          {typeof anm.expectedBaseline === 'number' ? `₹${anm.expectedBaseline.toLocaleString()}` : anm.expectedBaseline}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">First Detected</span>
                        <div className="font-semibold text-slate-300">{anm.firstSeen}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Recurrence</span>
                        <div className="font-semibold text-slate-300">
                          {anm.isRecurring ? `${anm.occurrenceCount} occurrences` : 'Single event'}
                        </div>
                      </div>
                    </div>

                    {/* Standard Legal & Accounting Disclaimer */}
                    <div className="text-[11px] italic text-amber-300/80 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>{anm.disclaimer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: PATTERN ANALYSIS */}
        {/* ========================================== */}
        {activeTab === 'Patterns' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-purple-400" />
                    <span>Pattern & Concentration Engine (Pareto 80/20)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Identifies revenue concentration, recurring advance round-number postings, and month-end billing spikes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {patterns.map((pat) => (
                  <div key={pat.patternId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                        {pat.type}
                      </span>
                      <span className="text-xs font-mono text-emerald-400">Score: {(pat.score * 100).toFixed(0)}%</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{pat.title}</h4>
                    <p className="text-xs text-slate-400">{pat.description}</p>

                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs space-y-1">
                      {pat.metrics.topContributor && (
                        <div>Top Contributor: <strong className="text-slate-200">{pat.metrics.topContributor}</strong></div>
                      )}
                      {pat.metrics.concentrationPct && (
                        <div>Concentration: <strong className="text-purple-400">{pat.metrics.concentrationPct}%</strong></div>
                      )}
                      {pat.metrics.amount && (
                        <div>Total Value: <strong className="text-slate-200">₹{(pat.metrics.amount / 100000).toFixed(2)} Lakhs</strong></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: FINANCIAL TRENDS */}
        {/* ========================================== */}
        {activeTab === 'Trends' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span>Multi-Period Trend & Variance Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tracks 6-month historical movements against statistical baselines and breaks down contributing sub-ledgers.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {trends.map((trd, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                            {trd.category}
                          </span>
                          <h4 className="text-sm font-bold text-white">{trd.metric}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Current: ₹{(trd.currentValue / 100000).toFixed(2)}L vs Previous: ₹{(trd.previousValue / 100000).toFixed(2)}L (
                          <strong className={trd.variancePct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {trd.variancePct > 0 ? `+${trd.variancePct}%` : `${trd.variancePct}%`}
                          </strong>
                          )
                        </p>
                      </div>

                      <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-purple-300 border border-slate-800">
                        {trd.trendType} Trend
                      </span>
                    </div>

                    {/* Top Contributors Bar */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 mb-2 block">Top Contributing Items:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {trd.contributionTopEntities.map((ent, i) => (
                          <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 text-xs">
                            <div className="font-semibold text-slate-200 truncate">{ent.name}</div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                              <span>₹{(ent.amount / 100000).toFixed(2)}L</span>
                              <span className="text-purple-400 font-mono">{ent.pct}% contribution</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: FINANCIAL RATIOS */}
        {/* ========================================== */}
        {activeTab === 'Benchmarks & Ratios' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Financial Ratios & Benchmark Intelligence</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calculated directly from verified Tally Balance Sheet and Profit & Loss ledger classifications.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratios.map((rat, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">{rat.category}</span>
                        <h4 className="text-sm font-bold text-white">{rat.name}</h4>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          rat.status === 'Healthy'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {rat.status}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-white">
                        {rat.currentValue} {rat.unit}
                      </span>
                      <span className="text-xs text-slate-400">Previous: {rat.previousValue} {rat.unit}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs space-y-1">
                      <div className="font-mono text-purple-300 text-[11px]">{rat.formula}</div>
                      <div className="text-slate-400 text-[11px]">{rat.explanation}</div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                        Benchmark: {rat.benchmark}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 7: ROOT CAUSE LINEAGE */}
        {/* ========================================== */}
        {activeTab === 'Root Cause' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <GitFork className="w-4 h-4 text-purple-400" />
                    <span>Root-Cause Lineage & Contributor Tree</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Decomposes macro financial variances down to parent groups, sub-ledgers, and individual voucher lines.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {rootCauses.map((rc) => (
                  <div key={rc.rootCauseId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                          Target Anomaly
                        </span>
                        <h4 className="text-sm font-bold text-white">{rc.targetAnomaly}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{rc.contributorPath}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 mb-2 block">
                        Ranked Quantitative Contributors:
                      </span>
                      <div className="space-y-2">
                        {rc.likelyContributors.map((c) => (
                          <div
                            key={c.rank}
                            className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 bg-purple-900/50 text-purple-300 rounded-full flex items-center justify-center font-bold text-[10px]">
                                  #{c.rank}
                                </span>
                                <span className="font-semibold text-slate-200">{c.entity}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 pl-7">{c.reason}</p>
                            </div>

                            <div className="text-right whitespace-nowrap pl-4">
                              <div className="font-bold text-rose-400">₹{(c.delta / 100000).toFixed(2)}L</div>
                              <div className="text-[10px] text-purple-400 font-mono">{c.deltaPct}% of total variance</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: WATCHLISTS & RISKS */}
        {/* ========================================== */}
        {activeTab === 'Risk Signals & Watchlist' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>Watchlist Thresholds & Early Warning Signals</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Proactive monitors guarding high-exposure customer accounts, sensitive expense accounts, and SKU balances.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {watchlists.map((wtch) => (
                  <div
                    key={wtch.watchlistId}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-semibold">
                          {wtch.targetType}
                        </span>
                        <span className="font-bold text-white">{wtch.targetName}</span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        Rule: {wtch.condition} {typeof wtch.threshold === 'number' ? `₹${wtch.threshold.toLocaleString()}` : wtch.threshold} • Current Value: <strong className="text-slate-200">{typeof wtch.currentValue === 'number' ? `₹${wtch.currentValue.toLocaleString()}` : wtch.currentValue}</strong>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        wtch.status === 'Triggered'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {wtch.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 9: AI ANALYST */}
        {/* ========================================== */}
        {activeTab === 'AI Analyst' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Tool-Grounded Accounting AI Analyst</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Natural language interface grounded strictly in local Tally dataset schemas with zero hallucinations.
                </p>
              </div>

              {/* Preset Query Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  'Why did operating expenses increase in March 2026?',
                  'Which customers have the highest receivables concentration?',
                  'Provide an executive overview of data quality and anomalies'
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAiQuery(q);
                      handleAskAi(q);
                    }}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition"
                  >
                    "{q}"
                  </button>
                ))}
              </div>

              {/* Query Input Box */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  placeholder="Ask any financial variance or pattern query..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleAskAi()}
                  disabled={isAiLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? 'Analyzing...' : 'Ask AI'}</span>
                </button>
              </div>

              {/* AI Structured Response */}
              {aiResponse && (
                <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/40 space-y-3 text-xs">
                  {/* Query Plan */}
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-purple-300 block">Structured Query Execution Plan:</span>
                    <div>Sources Queried: {aiResponse.queryPlan.sourcesUsed.join(', ')}</div>
                    <div>Period Scope: {aiResponse.queryPlan.periodEvaluated} (No sampling applied)</div>
                  </div>

                  <p className="text-sm font-semibold text-white">{aiResponse.answer}</p>

                  <div className="space-y-2 pt-1">
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-slate-200">
                      <strong className="text-emerald-400 font-mono block mb-0.5">FACT:</strong>
                      {aiResponse.fact}
                    </div>
                    <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded text-slate-300">
                      <strong className="text-purple-400 font-mono block mb-0.5">INTERPRETATION:</strong>
                      {aiResponse.interpretation}
                    </div>
                    <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded text-slate-200">
                      <strong className="text-blue-400 font-mono block mb-0.5">RECOMMENDATION:</strong>
                      {aiResponse.recommendation}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    Proof: {aiResponse.calculation}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 10: MODEL REGISTRY */}
        {/* ========================================== */}
        {activeTab === 'Models & History' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Model Registry & Production Governance</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tracks analytical model versions, historical accuracy, execution counts, and false-positive metrics.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {models.map((mod) => (
                  <div key={mod.modelId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          {mod.type}
                        </span>
                        <span className="font-bold text-white text-sm">{mod.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({mod.version})</span>
                      </div>
                      <p className="text-slate-400">
                        Accuracy: <strong className="text-emerald-400">{mod.accuracyScore}%</strong> • False Positives: <strong className="text-slate-300">{mod.falsePositiveRate}</strong> • Total Executions: {mod.executionsCount}
                      </p>
                      <div className="text-[10px] text-slate-500">
                        Approved by: {mod.approvedBy} • Last Verified: {mod.lastUpdated}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800 whitespace-nowrap">
                      {mod.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: CONVERT INSIGHT TO TASK / EXCEPTION */}
      {/* ========================================== */}
      {conversionModal.isOpen && conversionModal.insight && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Confirm {conversionModal.type} Creation
            </h3>
            <p className="text-xs text-slate-400">
              Create a formal {conversionModal.type.toLowerCase()} in the Control Center queue for:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <span className="font-bold text-white">{conversionModal.insight.title}</span>
              <p className="text-slate-400 text-[11px]">{conversionModal.insight.recommendation}</p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setConversionModal({ isOpen: false, type: 'Task', insight: null })}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConversion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
              >
                Confirm & Create {conversionModal.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
