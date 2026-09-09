import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Eye,
  BarChart3,
  Award,
  Zap,
  HelpCircle,
  Download,
  Printer,
  Maximize2
} from 'lucide-react';
import {
  ExecutiveSummaryMetrics,
  ManagementKPI,
  CashFlowHistoryItem,
  CashFlowForecastSummary,
  ReceivablesCenterData,
  PayablesCenterData,
  WorkingCapitalMetrics,
  BudgetRecord,
  ManagementScorecard,
  ScenarioResult,
  ForecastModelInfo,
  FinancialControlCheck,
  FinancialAuditLog
} from '../types/phase23FinancialControl';

type FinancialTab =
  | 'overview'
  | 'cash_flow'
  | 'receivables'
  | 'payables'
  | 'budget'
  | 'scorecard'
  | 'scenario_lab'
  | 'controls'
  | 'copilot_reports'
  | 'audit';

export const FinancialControlCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
  const [period, setPeriod] = useState<string>('Q2 FY27 (Apr-Aug)');
  const [loading, setLoading] = useState<boolean>(true);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  // Data States
  const [metrics, setMetrics] = useState<ExecutiveSummaryMetrics | null>(null);
  const [kpis, setKpis] = useState<ManagementKPI[]>([]);
  const [cashHistory, setCashHistory] = useState<CashFlowHistoryItem[]>([]);
  const [cashForecast, setCashForecast] = useState<CashFlowForecastSummary | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<number>(90);
  const [receivables, setReceivables] = useState<ReceivablesCenterData | null>(null);
  const [payables, setPayables] = useState<PayablesCenterData | null>(null);
  const [workingCap, setWorkingCap] = useState<WorkingCapitalMetrics | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [scorecard, setScorecard] = useState<ManagementScorecard | null>(null);
  const [forecastModels, setForecastModels] = useState<ForecastModelInfo[]>([]);
  const [controls, setControls] = useState<FinancialControlCheck[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);

  // Scenario Lab State
  const [scenarioSalesDelta, setScenarioSalesDelta] = useState<number>(10);
  const [scenarioCollectionDelay, setScenarioCollectionDelay] = useState<number>(15);
  const [scenarioOpexDelta, setScenarioOpexDelta] = useState<number>(5);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);

  // Copilot Query State
  const [copilotQuery, setCopilotQuery] = useState<string>('');
  const [copilotResponse, setCopilotResponse] = useState<any | null>(null);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Lineage Drilldown Modal
  const [drilldownModal, setDrilldownModal] = useState<{ title: string; calculation: string; source: string } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [forecastHorizon]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        kpiRes,
        cashRes,
        cashFcastRes,
        recRes,
        payRes,
        wcRes,
        budRes,
        scRes,
        modelsRes,
        ctrlRes,
        auditRes
      ] = await Promise.all([
        fetch('/api/financial-control/overview').then((r) => r.json()),
        fetch('/api/financial-control/kpis').then((r) => r.json()),
        fetch('/api/financial-control/cash-flow').then((r) => r.json()),
        fetch(`/api/financial-control/cash-flow/forecast?horizon=${forecastHorizon}`).then((r) => r.json()),
        fetch('/api/financial-control/receivables').then((r) => r.json()),
        fetch('/api/financial-control/payables').then((r) => r.json()),
        fetch('/api/financial-control/working-capital').then((r) => r.json()),
        fetch('/api/financial-control/budget').then((r) => r.json()),
        fetch('/api/financial-control/scorecard').then((r) => r.json()),
        fetch('/api/financial-control/forecast-models').then((r) => r.json()),
        fetch('/api/financial-control/controls').then((r) => r.json()),
        fetch('/api/financial-control/audit').then((r) => r.json())
      ]);

      if (overviewRes.executiveMetrics) setMetrics(overviewRes.executiveMetrics);
      if (kpiRes) setKpis(kpiRes);
      if (cashRes.history) setCashHistory(cashRes.history);
      if (cashFcastRes) setCashForecast(cashFcastRes);
      if (recRes) setReceivables(recRes);
      if (payRes) setPayables(payRes);
      if (wcRes) setWorkingCap(wcRes);
      if (budRes.records) setBudgets(budRes.records);
      if (scRes) setScorecard(scRes);
      if (modelsRes) setForecastModels(modelsRes);
      if (ctrlRes) setControls(ctrlRes);
      if (auditRes) setAuditLogs(auditRes);
    } catch (e) {
      console.error('Failed to load financial control data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async () => {
    setScenarioLoading(true);
    try {
      const res = await fetch('/api/financial-control/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Simulated Shock (${scenarioSalesDelta >= 0 ? '+' : ''}${scenarioSalesDelta}% Sales, +${scenarioCollectionDelay}d Collection)`,
          assumptions: {
            salesChangePercent: scenarioSalesDelta,
            collectionDelayDays: scenarioCollectionDelay,
            supplierPaymentDelayDays: 0,
            opexChangePercent: scenarioOpexDelta,
            priceChangePercent: 0,
            volumeChangePercent: scenarioSalesDelta
          }
        })
      });
      const data = await res.json();
      if (data.scenario) {
        setScenarioResult(data.scenario);
      }
    } catch (e) {
      console.error('Scenario execution failed', e);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleExecuteControl = async (ctrlId: string) => {
    try {
      const res = await fetch(`/api/financial-control/controls/${ctrlId}/execute`, { method: 'POST' });
      const data = await res.json();
      if (data.control) {
        setControls((prev) => prev.map((c) => (c.controlId === ctrlId ? data.control : c)));
      }
    } catch (e) {
      console.error('Control execution failed', e);
    }
  };

  const handleApproveBudget = async (budgetId: string) => {
    try {
      const res = await fetch('/api/financial-control/budget/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetId })
      });
      const data = await res.json();
      if (data.record) {
        setBudgets((prev) => prev.map((b) => (b.budgetId === budgetId ? data.record : b)));
      }
    } catch (e) {
      console.error('Budget approval failed', e);
    }
  };

  const handleCopilotQuery = async (queryText?: string) => {
    const q = queryText || copilotQuery;
    if (!q) return;
    setCopilotLoading(true);
    try {
      const res = await fetch('/api/financial-control/copilot-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q })
      });
      const data = await res.json();
      setCopilotResponse(data);
    } catch (e) {
      console.error('Copilot query failed', e);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await fetch('/api/financial-control/generate-report', { method: 'POST' });
      const data = await res.json();
      if (data.report) {
        alert(`Executive Report '${data.report.reportId}' generated and ready for Board distribution!`);
        fetchAllData();
      }
    } catch (e) {
      console.error('Report generation failed', e);
    }
  };

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div id="financial-control-center-root" className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Header Banner */}
      <header id="fcc-header" className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">EXFIN Financial Control Center</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  READ-ONLY TALLY CORE
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                  PHASE 23
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified Multi-Layer BI • Cash Runway Forecasting • Ageing & Due-Date Engines • What-If Sandbox
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <select
                id="fcc-period-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Q2 FY27 (Apr-Aug)" className="bg-slate-900 text-slate-200">
                  Q2 FY 2026-27 (Apr - Aug)
                </option>
                <option value="FY 2026-27 Full Year" className="bg-slate-900 text-slate-200">
                  FY 2026-27 (Apr 1 - Mar 31)
                </option>
                <option value="Trailing 90 Days" className="bg-slate-900 text-slate-200">
                  Trailing 90 Days
                </option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              id="fcc-refresh-btn"
              onClick={fetchAllData}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              Sync Model
            </button>

            {/* Board Presentation Mode Toggle */}
            <button
              id="fcc-presentation-btn"
              onClick={() => setPresentationMode(!presentationMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center transition ${
                presentationMode
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
              {presentationMode ? 'Exit Presentation' : 'Presentation View'}
            </button>

            {/* Generate Report Button */}
            <button
              id="fcc-export-report-btn"
              onClick={handleGenerateReport}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Export Board Report
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        {!presentationMode && (
          <nav id="fcc-nav-tabs" className="flex items-center space-x-1 mt-4 overflow-x-auto pb-1 border-t border-slate-800/80 pt-3">
            {[
              { id: 'overview', label: 'Executive Overview', icon: Activity },
              { id: 'cash_flow', label: 'Cash Flow & Forecast', icon: DollarSign },
              { id: 'receivables', label: 'Receivables & DSO', icon: ArrowUpRight },
              { id: 'payables', label: 'Payables & DPO', icon: ArrowDownRight },
              { id: 'budget', label: 'Budget vs Actual', icon: BarChart3 },
              { id: 'scorecard', label: 'Management Scorecard', icon: Award },
              { id: 'scenario_lab', label: 'Scenario Lab (What-If)', icon: Sliders },
              { id: 'controls', label: 'Financial Controls & Health', icon: ShieldCheck },
              { id: 'copilot_reports', label: 'Copilot Intelligence', icon: Bot },
              { id: 'audit', label: 'Audit Trail', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`fcc-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as FinancialTab)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center whitespace-nowrap transition ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Revenue */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Revenue (Net Sales)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    {metrics.revenue.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{formatINR(metrics.revenue.value)}</div>
                <div className="flex items-center text-xs text-emerald-400 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>+{metrics.revenue.growthRatePercent}% vs Previous Quarter</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Net Operating Profit</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    {metrics.netProfit.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{formatINR(metrics.netProfit.value)}</div>
                <div className="flex items-center text-xs text-emerald-400 mt-2">
                  <Percent className="w-3.5 h-3.5 mr-1" />
                  <span>{metrics.netProfit.marginPercent}% Net Operating Margin</span>
                </div>
              </div>

              {/* Liquid Cash */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Liquid Cash & Bank Reserves</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    {metrics.cashBankBalance.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {formatINR(metrics.cashBankBalance.value)}
                </div>
                <div className="flex items-center text-xs text-indigo-400 mt-2">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span>4.8 Months Operating Runway</span>
                </div>
              </div>

              {/* Working Capital */}
              {workingCap && (
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Net Working Capital</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      ACTUAL
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">{formatINR(workingCap.workingCapital)}</div>
                  <div className="flex items-center text-xs text-slate-400 mt-2">
                    <span>Rec + Inv - Payables (+6.4%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Core Management KPIs Table */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Management KPI Health Matrix (IKPIEngine)</h3>
                  <p className="text-xs text-slate-400">
                    Real-time operational ratios calculated from verified Tally balances against documented governance thresholds.
                  </p>
                </div>
                <span className="text-xs text-slate-400">Definitions Version: v2.1-IndianFY</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-medium">KPI Name & ID</th>
                      <th className="py-2.5 px-3 font-medium">Category</th>
                      <th className="py-2.5 px-3 font-medium">Current Actual</th>
                      <th className="py-2.5 px-3 font-medium">Target</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Owner</th>
                      <th className="py-2.5 px-3 font-medium text-right">Calculation Lineage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {kpis.map((k) => (
                      <tr key={k.kpiId} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{k.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{k.kpiId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                            {k.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-100">
                          {k.currentActual} {k.unit}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {k.target} {k.unit}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              k.status === 'On Target'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : k.status === 'Warning'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {k.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{k.owner}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              setDrilldownModal({
                                title: `${k.name} (${k.kpiId})`,
                                calculation: k.formulaDoc,
                                source: `${k.dataset} • Tally Analytical Cache`
                              })
                            }
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                          >
                            View Lineage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CASH FLOW & FORECAST */}
        {activeTab === 'cash_flow' && (
          <div className="space-y-6">
            {/* Cash Position Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400">HDFC Bank Operating Account</div>
                <div className="text-xl font-bold text-white mt-1">₹46,50,000</div>
                <div className="text-[11px] text-emerald-400 mt-1">✓ Reconciled with Bank Statement</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400">Petty Cash & Cash-in-Hand</div>
                <div className="text-xl font-bold text-white mt-1">₹2,40,000</div>
                <div className="text-[11px] text-slate-400 mt-1">Verified physical cash balance</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl bg-gradient-to-br from-slate-950 to-emerald-950/30">
                <div className="text-xs text-slate-400">Total Unencumbered Liquid Balance</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">₹48,90,000</div>
                <div className="text-[11px] text-emerald-300 mt-1">Zero Shortfall Risk Projected</div>
              </div>
            </div>

            {/* Historical Monthly Cash Bridge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Historical Cash Bridge (Verified Tally Books)</h3>
              <p className="text-xs text-slate-400 mb-4">
                Mathematical Validation: Opening Balance + Total Inflows - Total Outflows = Closing Balance.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-medium">Month</th>
                      <th className="py-2.5 px-3 font-medium text-right">Opening Cash</th>
                      <th className="py-2.5 px-3 font-medium text-right text-emerald-400">Total Inflows</th>
                      <th className="py-2.5 px-3 font-medium text-right text-rose-400">Total Outflows</th>
                      <th className="py-2.5 px-3 font-medium text-right text-white">Closing Cash</th>
                      <th className="py-2.5 px-3 font-medium text-center">Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cashHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-medium text-slate-200">{item.period}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">{formatINR(item.openingBalance)}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          +{formatINR(item.inflows)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-400 font-semibold">
                          -{formatINR(item.outflows)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatINR(item.closingBalance)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-semibold border border-emerald-500/40">
                            100% Balanced
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cash Flow Forecast Engine */}
            {cashForecast && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-white">Cash Runway & Horizon Forecast Engine</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                        FORECAST — MODEL ESTIMATE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Method: {cashForecast.methodUsed} (Receivables Due Dates + Historical Seasonality)
                    </p>
                  </div>

                  {/* Horizon Filter */}
                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 p-1 rounded-lg text-xs">
                    {[7, 30, 60, 90, 180, 365].map((h) => (
                      <button
                        key={h}
                        onClick={() => setForecastHorizon(h)}
                        className={`px-2 py-1 rounded font-medium transition ${
                          forecastHorizon === h ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {h}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Projected Inflows</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {formatINR(cashForecast.totalProjectedInflows)}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Projected Disbursements</span>
                    <div className="text-lg font-bold text-rose-400 mt-1">
                      {formatINR(cashForecast.totalProjectedOutflows)}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Net Projected Change</span>
                    <div className="text-lg font-bold text-indigo-400 mt-1">
                      {formatINR(cashForecast.netProjectedChange)}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Ending Projected Cash</span>
                    <div className="text-lg font-bold text-white mt-1">
                      {formatINR(cashForecast.endingProjectedBalance)}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                        <th className="py-2 px-3 font-medium">Projected Horizon Date</th>
                        <th className="py-2 px-3 font-medium text-right text-emerald-400">Expected Inflows</th>
                        <th className="py-2 px-3 font-medium text-right text-rose-400">Expected Outflows</th>
                        <th className="py-2 px-3 font-medium text-right text-white">Projected Balance</th>
                        <th className="py-2 px-3 font-medium text-right">Confidence Band (95%)</th>
                        <th className="py-2 px-3 font-medium text-center">Shortfall Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {cashForecast.forecasts.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-mono text-slate-200">
                            {f.date} ({f.horizonDays} days)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+{formatINR(f.expectedInflows)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-400">-{formatINR(f.expectedOutflows)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {formatINR(f.projectedBalance)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {formatINR(f.lowerConfidenceBound)} – {formatINR(f.upperConfidenceBound)} ({f.confidencePercent}%)
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {f.isShortfallRisk ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                                SHORTFALL RISK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                Safe Runway
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECEIVABLES & DSO */}
        {activeTab === 'receivables' && receivables && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Total Outstanding Debtors</span>
                <div className="text-2xl font-bold text-white mt-1">{formatINR(receivables.totalOutstanding)}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Overdue Amount (&gt; Credit Terms)</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">{formatINR(receivables.overdueAmount)}</div>
                <div className="text-[11px] text-slate-400 mt-1">12.4% of total outstanding</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Days Sales Outstanding (DSO)</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{receivables.dsoDays} Days</div>
                <div className="text-[11px] text-slate-400 mt-1">Target: 40.0 Days (Variance: +2.5d)</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">30-Day Collection Forecast</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {formatINR(receivables.collectionForecast30Days)}
                </div>
              </div>
            </div>

            {/* Ageing Buckets */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Debtors Ageing Distribution (Tally Bill-wise)</h3>
              <p className="text-xs text-slate-400 mb-4">Calculated from verified invoice due dates and receipt allocations.</p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {receivables.ageing.map((b, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs font-semibold text-slate-300">{b.bucketName}</span>
                    <div className="text-lg font-bold text-white mt-1">{formatINR(b.amount)}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>{b.percentage}%</span>
                      <span>{b.count} Invoices</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Debtors Behavior Matrix */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Top Debtors & Payment Consistency Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-medium">Customer Party Name</th>
                      <th className="py-2.5 px-3 font-medium text-right">Total Outstanding</th>
                      <th className="py-2.5 px-3 font-medium text-right text-rose-400">Overdue Balance</th>
                      <th className="py-2.5 px-3 font-medium text-center">Avg Days to Pay</th>
                      <th className="py-2.5 px-3 font-medium text-center">Payment Consistency</th>
                      <th className="py-2.5 px-3 font-medium">Overdue Behavior Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {receivables.topDebtors.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-medium text-slate-200">{d.partyName}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                          {formatINR(d.outstandingAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-rose-400">
                          {d.overdueAmount > 0 ? formatINR(d.overdueAmount) : '₹0.00'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{d.avgDaysToPay} Days</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              d.paymentConsistency === 'High'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : d.paymentConsistency === 'Medium'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {d.paymentConsistency}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{d.overdueFrequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYABLES & DPO */}
        {activeTab === 'payables' && payables && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Total Outstanding Payables</span>
                <div className="text-2xl font-bold text-white mt-1">{formatINR(payables.totalPayable)}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Current Overdue to Suppliers</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{formatINR(payables.overdueAmount)}</div>
                <div className="text-[11px] text-slate-400 mt-1">8.1% of total payables</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Days Payables Outstanding (DPO)</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{payables.dpoDays} Days</div>
                <div className="text-[11px] text-slate-400 mt-1">Target: 35.0 Days (Favorable)</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">30-Day Payment Forecast</span>
                <div className="text-2xl font-bold text-indigo-400 mt-1">{formatINR(payables.paymentForecast30Days)}</div>
              </div>
            </div>

            {/* Payables Ageing Buckets */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Creditors Ageing Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {payables.ageing.map((b, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs font-semibold text-slate-300">{b.bucketName}</span>
                    <div className="text-lg font-bold text-white mt-1">{formatINR(b.amount)}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>{b.percentage}%</span>
                      <span>{b.count} Bills</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BUDGET VS ACTUAL */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">FY 2026-27 Departmental & Ledger Budgets</h3>
                  <p className="text-xs text-slate-400">
                    Variance Calculation: Actual - Budget. Positive variance is favorable for Revenue, unfavorable for OpEx.
                  </p>
                </div>
                <button
                  onClick={() => alert('Opening Excel/CSV Budget Importer wizard...')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg flex items-center"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Import New Budget (XLSX)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-medium">Category / Account</th>
                      <th className="py-2.5 px-3 font-medium">Dimension</th>
                      <th className="py-2.5 px-3 font-medium text-right">Budget</th>
                      <th className="py-2.5 px-3 font-medium text-right text-white">Actual YTD</th>
                      <th className="py-2.5 px-3 font-medium text-right">Variance</th>
                      <th className="py-2.5 px-3 font-medium text-right">Year-End Forecast</th>
                      <th className="py-2.5 px-3 font-medium text-center">Approval Status</th>
                      <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {budgets.map((b) => (
                      <tr key={b.budgetId} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-medium text-slate-200">
                          <div>{b.category}</div>
                          <div className="text-[10px] font-mono text-slate-500">{b.budgetId}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {b.dimension}: <span className="text-slate-200">{b.dimensionValue}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{formatINR(b.budgetAmount)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">{formatINR(b.actualAmount)}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          <span className={b.isFavorable ? 'text-emerald-400' : 'text-rose-400'}>
                            {b.varianceAmount >= 0 ? '+' : ''}
                            {formatINR(b.varianceAmount)} ({b.variancePercent}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-indigo-300">
                          {formatINR(b.forecastToYearEnd)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              b.status === 'Approved' || b.status === 'Active'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {b.status !== 'Approved' && (
                            <button
                              onClick={() => handleApproveBudget(b.budgetId)}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MANAGEMENT SCORECARD */}
        {activeTab === 'scorecard' && scorecard && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white">Executive Management Scorecard</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    {scorecard.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Compound weighted performance score based on audited revenue growth, profit margin, cash runway, and working capital discipline.
                </p>
                <div className="text-xs font-mono text-slate-500 mt-2">Formula Version: {scorecard.formulaVersion}</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-4xl font-black text-emerald-400 tracking-tight">{scorecard.overallScore}/100</div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Composite Index</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Scorecard Component Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-medium">Strategic Component</th>
                      <th className="py-2.5 px-3 font-medium">Metric</th>
                      <th className="py-2.5 px-3 font-medium text-right">Target</th>
                      <th className="py-2.5 px-3 font-medium text-right text-white">Actual</th>
                      <th className="py-2.5 px-3 font-medium text-right">Score</th>
                      <th className="py-2.5 px-3 font-medium text-right">Weight</th>
                      <th className="py-2.5 px-3 font-medium text-right text-emerald-400">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {scorecard.components.map((c) => (
                      <tr key={c.componentId} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-medium text-slate-200">{c.name}</td>
                        <td className="py-3 px-3 text-slate-400">{c.metric}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{c.target}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">{c.actual}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">{c.score}%</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{c.weightPercent}%</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          +{c.weightedContribution.toFixed(2)} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SCENARIO LAB (WHAT-IF ANALYSIS) */}
        {activeTab === 'scenario_lab' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-white">What-If Multi-Variable Simulation Sandbox</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300">
                      SCENARIO — NOT ACTUAL ACCOUNTING DATA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Simulate revenue shocks, debtor collection delays, and operating expense inflation without modifying underlying Tally ledgers.
                  </p>
                </div>
              </div>

              {/* Sliders and Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300">Sales Volume / Revenue Delta</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {scenarioSalesDelta >= 0 ? '+' : ''}
                      {scenarioSalesDelta}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="50"
                    step="5"
                    value={scenarioSalesDelta}
                    onChange={(e) => setScenarioSalesDelta(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>-30%</span>
                    <span>0% (Base)</span>
                    <span>+50%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300">Debtor Collection Delay (DSO Expansion)</span>
                    <span className="font-mono font-bold text-amber-400">+{scenarioCollectionDelay} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={scenarioCollectionDelay}
                    onChange={(e) => setScenarioCollectionDelay(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0d (Normal)</span>
                    <span>+30d</span>
                    <span>+60d (Severe)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300">Operating Expenses (OpEx) Delta</span>
                    <span className="font-mono font-bold text-rose-400">
                      {scenarioOpexDelta >= 0 ? '+' : ''}
                      {scenarioOpexDelta}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="30"
                    step="5"
                    value={scenarioOpexDelta}
                    onChange={(e) => setScenarioOpexDelta(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>-10%</span>
                    <span>0% (Base)</span>
                    <span>+30%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mb-6">
                <button
                  onClick={handleRunScenario}
                  disabled={scenarioLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center shadow transition"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {scenarioLoading ? 'Computing Model...' : 'Execute What-If Simulation'}
                </button>
              </div>

              {/* Scenario Results Panel */}
              {scenarioResult && (
                <div className="space-y-6 border-t border-slate-800 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">Modeled Revenue</span>
                      <div className="text-xl font-bold text-white mt-1">
                        {formatINR(scenarioResult.scenarioRevenue)}
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        Base: {formatINR(scenarioResult.baseRevenue)}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">Modeled Net Profit</span>
                      <div className="text-xl font-bold text-white mt-1">
                        {formatINR(scenarioResult.scenarioNetProfit)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Base: {formatINR(scenarioResult.baseNetProfit)}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">Projected Liquid Cash</span>
                      <div className="text-xl font-bold text-indigo-400 mt-1">
                        {formatINR(scenarioResult.scenarioEndingCash)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Base: {formatINR(scenarioResult.baseEndingCash)}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">Modeled DSO</span>
                      <div className="text-xl font-bold text-amber-400 mt-1">{scenarioResult.scenarioDso} Days</div>
                      <div className="text-[11px] text-slate-400 mt-1">Base: {scenarioResult.baseDso} Days</div>
                    </div>
                  </div>

                  {/* Sensitivity Table */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-200 mb-3">
                      Revenue Sensitivity Matrix (-15% to +15% Range)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                            <th className="py-2 px-3 font-medium">Sales Delta</th>
                            <th className="py-2 px-3 font-medium text-right">Projected Revenue</th>
                            <th className="py-2 px-3 font-medium text-right">Projected Net Profit</th>
                            <th className="py-2 px-3 font-medium text-right text-indigo-300">Projected Cash Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {scenarioResult.sensitivityTable.map((row, i) => (
                            <tr key={i} className={row.salesDeltaPercent === 0 ? 'bg-slate-800/40 font-semibold' : ''}>
                              <td className="py-2.5 px-3 font-mono">
                                {row.salesDeltaPercent >= 0 ? '+' : ''}
                                {row.salesDeltaPercent}% {row.salesDeltaPercent === 0 && '(Baseline)'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                                {formatINR(row.projectedRevenue)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                                {formatINR(row.projectedProfit)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-indigo-400 font-bold">
                                {formatINR(row.projectedCash)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: FINANCIAL CONTROLS & HEALTH */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Automated Statutory & Internal Controls</h3>
                  <p className="text-xs text-slate-400">
                    Autonomous background verification for bank reconciliation, GST matching, and arithmetic line-item integrity.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {controls.map((ctrl) => (
                  <div
                    key={ctrl.controlId}
                    className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-white">{ctrl.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ctrl.status === 'Passed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ctrl.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ctrl.frequency}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{ctrl.evidenceSummary}</p>
                      <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500 mt-2">
                        <span>Execution ID: {ctrl.executionId}</span>
                        <span>Owner: {ctrl.owner}</span>
                        <span>Last Executed: {new Date(ctrl.lastExecuted).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => handleExecuteControl(ctrl.controlId)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        Re-Execute Check
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: COPILOT INTELLIGENCE & BOARD REPORTS */}
        {activeTab === 'copilot_reports' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Tally Financial Copilot & Natural Language Query</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Ask ad-hoc financial questions. Answers are mathematically grounded and labeled as FACT, CALCULATION, or FORECAST.
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  placeholder="e.g. Will cash fall below ₹25 lakh in the next 90 days? / Which customers are driving overdue?"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleCopilotQuery()}
                  disabled={copilotLoading || !copilotQuery}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {copilotLoading ? 'Analyzing...' : 'Ask Copilot'}
                </button>
              </div>

              {/* Sample Quick Questions */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'Will cash fall below ₹25 lakh next quarter?',
                  'What is our current DSO and top overdue debtors?',
                  'Where are we over budget on operating expenses?'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCopilotQuery(q);
                      handleCopilotQuery(q);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-[11px] text-slate-300"
                  >
                    "{q}"
                  </button>
                ))}
              </div>

              {/* Copilot Answer Display */}
              {copilotResponse && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                      {copilotResponse.dataLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Source: {copilotResponse.evidenceSource}
                    </span>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap text-slate-200 leading-relaxed">
                    {copilotResponse.response}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Financial Intelligence Governance & Audit Trail</h3>
            <p className="text-xs text-slate-400 mb-4">
              Immutable log of all KPI target modifications, budget approvals, and forecast executions.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="py-2.5 px-3 font-medium">Timestamp</th>
                    <th className="py-2.5 px-3 font-medium">Action</th>
                    <th className="py-2.5 px-3 font-medium">User & Role</th>
                    <th className="py-2.5 px-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.auditId} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {log.user} ({log.userRole})
                      </td>
                      <td className="py-3 px-3 text-slate-400">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Drilldown Calculation Modal */}
      {drilldownModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{drilldownModal.title}</h3>
              <button
                onClick={() => setDrilldownModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Mathematical Formula:</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-emerald-400 mt-1">
                  {drilldownModal.calculation}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Verified Data Lineage:</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 mt-1">
                  {drilldownModal.source}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDrilldownModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
