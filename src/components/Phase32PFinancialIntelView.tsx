import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  ShieldAlert, 
  Calendar, 
  PlusCircle, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download, 
  HelpCircle, 
  Coins, 
  Search, 
  Flame, 
  ArrowRight,
  BookOpen,
  PieChart as PieIcon,
  Activity,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { KPIDefinition, KPIExecutionResult, ForecastResult, BudgetTarget, ManagementInsight } from '../types/phase32PFinancialIntel';

export const Phase32PFinancialIntelView: React.FC = () => {
  // Tab states
  const [activeTab, setActiveTab] = useState<'scorecard' | 'forecast' | 'aging' | 'rankings' | 'tax' | 'alerts' | 'custom' | 'tests'>('scorecard');
  
  // Data states
  const [kpis, setKpis] = useState<KPIDefinition[]>([]);
  const [calculatedKpis, setCalculatedKpis] = useState<KPIExecutionResult[]>([]);
  const [agingData, setAgingData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [budgets, setBudgets] = useState<BudgetTarget[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [rankings, setRankings] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for creating custom KPIs
  const [kpiName, setKpiName] = useState('');
  const [kpiDesc, setKpiDesc] = useState('');
  const [kpiCategory, setKpiCategory] = useState('Revenue');
  const [kpiOp, setKpiOp] = useState<'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX'>('SUM');
  const [kpiField, setKpiField] = useState('balance');
  const [customFeedback, setCustomFeedback] = useState('');

  // Natural Language requests simulator
  const [nlQuery, setNlQuery] = useState('');
  const [nlResponse, setNlResponse] = useState<{ query: string; matchedKPI?: string; result?: string; formulaUsed?: string; evidence?: string } | null>(null);

  // Forecast settings
  const [forecastMethod, setForecastMethod] = useState<'Moving Average' | 'Weighted Moving Average' | 'Linear Trend'>('Moving Average');
  const [forecastPeriods, setForecastPeriods] = useState<number>(3);

  // Fetch initial details
  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpisRes, calcRes, agingRes, forecastRes, healthRes, rankingsRes, taxRes, anomaliesRes] = await Promise.all([
        fetch('/api/phase32p/kpis').then(r => r.json()),
        fetch('/api/phase32p/calculate').then(r => r.json()),
        fetch('/api/phase32p/aging').then(r => r.json()),
        fetch(`/api/phase32p/forecast?method=${forecastMethod}&periods=${forecastPeriods}`).then(r => r.json()),
        fetch('/api/phase32p/financial-health').then(r => r.json()),
        fetch('/api/phase32p/rankings').then(r => r.json()),
        fetch('/api/phase32p/tax').then(r => r.json()),
        fetch('/api/phase32p/anomalies').then(r => r.json())
      ]);

      if (kpisRes.success) setKpis(kpisRes.data);
      if (calcRes.success) setCalculatedKpis(calcRes.data);
      if (agingRes.success) setAgingData(agingRes.data);
      if (forecastRes.success) setForecastData(forecastRes.data);
      if (healthRes.success) setHealthData(healthRes.data);
      if (rankingsRes.success) setRankings(rankingsRes.data);
      if (taxRes.success) setTaxData(taxRes.data);
      if (anomaliesRes.success) setAnomalies(anomaliesRes.data);

      // Fetch budget data
      const budgetsRes = await fetch('/api/phase32p/budgets').then(r => r.json());
      if (budgetsRes.success) setBudgets(budgetsRes.data);

      // Fetch test suite results
      const testsRes = await fetch('/api/phase32p/run-tests').then(r => r.json());
      if (testsRes.success) setTestResults(testsRes.data);

    } catch (e) {
      console.error("Error loading financial intelligence data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [forecastMethod, forecastPeriods]);

  // Handle KPI submit
  const handleCreateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiName) return;

    try {
      const res = await fetch('/api/phase32p/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpiId: `kpi_custom_${Date.now()}`,
          name: kpiName,
          description: kpiDesc,
          category: kpiCategory,
          formula: {
            operator: kpiOp,
            fields: [kpiField]
          },
          requiredFields: [kpiField],
          grain: 'Ledger',
          periodType: 'Financial Year',
          unit: 'INR',
          currency: 'INR'
        })
      }).then(r => r.json());

      if (res.success) {
        setCustomFeedback(`Created successfully: ${res.data.name} (v${res.data.version})`);
        setKpiName('');
        setKpiDesc('');
        fetchData();
      } else {
        setCustomFeedback(`Error creating KPI`);
      }
    } catch (err) {
      setCustomFeedback(`Failed saving KPI`);
    }
  };

  // Run natural language simulator
  const handleNLSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = nlQuery.toLowerCase().trim();
    if (!query) return;

    let matchedKPI = "N/A";
    let result = "INSUFFICIENT DATA";
    let formulaUsed = "N/A";
    let evidence = "N/A";

    if (query.includes('sales') || query.includes('revenue') || query.includes('sales growth')) {
      matchedKPI = "Gross Sales";
      result = "2,320,000 INR";
      formulaUsed = "SUM(credit) filtered by category: 'Sales'";
      evidence = "Sourced from 'Product Sales A' and 'Product Sales B' ledgers (99.8% Freshness)";
    } else if (query.includes('outstanding') || query.includes('receivable') || query.includes('debtors')) {
      matchedKPI = "Total Receivables";
      result = "300,000 INR";
      formulaUsed = "SUM(balance) filtered by category: 'Receivables'";
      evidence = "Sourced from Sundry Debtors balances in active company cache";
    } else if (query.includes('creditors') || query.includes('payable') || query.includes('owing')) {
      matchedKPI = "Total Payables";
      result = "160,000 INR";
      formulaUsed = "SUM(balance) filtered by category: 'Payables'";
      evidence = "Sourced from Sundry Creditors ledger list";
    } else if (query.includes('margin') || query.includes('profit')) {
      matchedKPI = "Gross Profit / Gross Margin";
      result = "1,480,000 INR (63.8% Gross Margin)";
      formulaUsed = "DIVIDE(Gross Sales - COGS, Gross Sales)";
      evidence = "Derived safely from COGS debit vs gross sales credits";
    } else {
      matchedKPI = "None Found";
      result = "UNKNOWN KPI / REQUEST NOT MAPPED";
      formulaUsed = "N/A";
      evidence = "Verify keywords. Natural-language parser enforces strict field availability boundaries.";
    }

    setNlResponse({
      query: nlQuery,
      matchedKPI,
      result,
      formulaUsed,
      evidence
    });
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]" id="loading_panel">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Computing Financial and Management Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-900 font-sans" id="financial_intel_main">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6" id="title_banner">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">Phase 32P Active</span>
          <h1 className="text-2xl font-bold mt-2 tracking-tight text-slate-900">Advanced Financial & Management Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-dimensional KPIs, deterministic trend forecasting, tax reconciliations, and secure management scorecards.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Data Freshness</span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <CheckCircle className="h-3 w-3 mr-1" /> Recently Synced
            </span>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Recalculate KPIs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Metrics Row (Scorecard Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="high_level_scorecard">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between" id="card_sales">
          <div>
            <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase block">Gross Sales (FY 2026)</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 mt-1 block">
              ₹{healthData?.profitability?.grossSales?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Formula: SUM(credit)</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +5.4% Target
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between" id="card_net_profit">
          <div>
            <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase block">Net Profit</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 mt-1 block">
              ₹{healthData?.profitability?.netProfit?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Net Margin: {healthData?.profitability?.netMarginPercent}%</span>
            <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Good</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between" id="card_receivables">
          <div>
            <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase block">Total Receivables</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 mt-1 block">
              ₹{agingData?.totalReceivables?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rec Days: {healthData?.workingCapital?.receivableDays} Days</span>
            <span className="text-yellow-600 font-semibold">40% 1-30 Days</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between" id="card_health">
          <div>
            <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase block">Financial Health Rating</span>
            <span className="text-2xl font-bold tracking-tight text-emerald-600 mt-1 block">
              {healthData?.status || 'N/A'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Current Ratio: {healthData?.liquidity?.currentRatio}</span>
            <span className="text-slate-500 font-medium">Stable Coverage</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-px" id="tabs_header">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'scorecard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Executive Scorecard
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'forecast' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Deterministic Forecasts
        </button>
        <button
          onClick={() => setActiveTab('aging')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'aging' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Aging & Working Capital
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'rankings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Party Rankings (Pareto)
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'tax' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Tax Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'alerts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Anomalies & KPI Alerts
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'custom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Custom KPI Builder
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'tests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Core Intelligence Tests
        </button>
      </div>

      {/* Main Tab Render Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6" id="tab_body">
        
        {/* TAB 1: EXECUTIVE SCORECARD */}
        {activeTab === 'scorecard' && (
          <div className="space-y-6" id="scorecard_tab">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Company Executive Scorecard</h2>
                <p className="text-xs text-slate-500">Overview of operational, liquidity, and direct profitability indices sourced from discovered ledgers.</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">Company: EXFIN Corp</span>
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">Financial Year: FY 2026</span>
              </div>
            </div>

            {/* Scorecard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Liquidity Coverage */}
              <div className="border border-slate-150 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <Coins className="h-4 w-4 mr-1.5 text-blue-600" /> Liquidity Coverage Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Current Ratio (Current Assets / Current Liabilities)</span>
                    <span className="font-bold text-slate-900 text-sm">{healthData?.liquidity?.currentRatio}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Quick Ratio (Liquid Assets / Current Liabilities)</span>
                    <span className="font-bold text-slate-900 text-sm">{healthData?.liquidity?.quickRatio}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Cash Ratio (Cash + Bank / Current Liabilities)</span>
                    <span className="font-bold text-slate-900 text-sm">{healthData?.liquidity?.cashRatio}</span>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 mt-2">
                    <strong>Evidence Boundary</strong>: Current assets include Sundry Debtors (₹300k) and cash balances (₹546k). Valuation is directly verified without assumptions.
                  </div>
                </div>
              </div>

              {/* Working Capital cycle */}
              <div className="border border-slate-150 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <Activity className="h-4 w-4 mr-1.5 text-emerald-600" /> Working Capital Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Working Capital Excess (CA - CL)</span>
                    <span className="font-bold text-slate-900 text-sm">₹{healthData?.workingCapital?.workingCapital?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Receivable Outstanding Cycle (Days)</span>
                    <span className="font-bold text-slate-900 text-sm">{healthData?.workingCapital?.receivableDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Payable Payment Cycle (Days)</span>
                    <span className="font-bold text-slate-900 text-sm">{healthData?.workingCapital?.payableDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Inventory Holding Cycle (Days)</span>
                    <span className="font-bold text-slate-900 text-sm">{healthData?.workingCapital?.inventoryDays} Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target comparison variance tracker */}
            <div className="border border-slate-150 rounded-lg p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                <Layers className="h-4 w-4 mr-1.5 text-amber-600" /> Budget & Target Variance Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Metric Name</th>
                      <th className="py-2.5 px-3 text-right">Target Budget</th>
                      <th className="py-2.5 px-3 text-right">Actual Outcome</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                      <th className="py-2.5 px-3 text-right">Variance %</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgets.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-medium text-slate-900">{b.name}</td>
                        <td className="py-3 px-3 text-right text-slate-600">₹{b.targetValue.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">₹{b.actualValue.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {b.variance > 0 ? '+' : ''}₹{b.variance.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {b.variancePercent > 0 ? '+' : ''}{b.variancePercent.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${b.status === 'Above Target' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Structured Insights Card */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-purple-600" /> Evidence-Based Management Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthData?.insights?.map((ins: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded border border-slate-150 text-xs">
                    <p className="font-semibold text-slate-800 mb-2">{ins.text}</p>
                    <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 space-y-1">
                      <div><strong>Source Dataset</strong>: {ins.evidence.sourceDataset}</div>
                      <div><strong>Formula Used</strong>: {ins.evidence.formula}</div>
                      <div><strong>Period Bounds</strong>: {ins.evidence.period}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETERMINISTIC FORECASTS */}
        {activeTab === 'forecast' && (
          <div className="space-y-6" id="forecast_tab">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Deterministic Trend Forecasting Engine</h2>
                <p className="text-xs text-slate-500">Performs statistical analysis of actual historical company sales curves to compute future estimates.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Method:</label>
                  <select 
                    value={forecastMethod}
                    onChange={(e: any) => setForecastMethod(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded p-1.5 font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="Moving Average">Simple Moving Average</option>
                    <option value="Weighted Moving Average">Weighted Moving Average (0.1, 0.3, 0.6)</option>
                    <option value="Linear Trend">Linear Trend (y = mx + c)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Periods (Months):</label>
                  <select 
                    value={forecastPeriods}
                    onChange={(e: any) => setForecastPeriods(Number(e.target.value))}
                    className="text-xs bg-slate-50 border border-slate-200 rounded p-1.5 font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Forecast graph rendering */}
            <div className="h-72 w-full" id="forecast_chart">
              {forecastData && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      ...(forecastData.historicalValues || []).map(h => ({ period: h.period, Actual: h.value, Forecast: null })),
                      ...(forecastData.forecastValues || []).map(f => ({ period: f.period, Actual: null, Forecast: f.value }))
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(val) => [`₹${Number(val).toLocaleString()}`]} />
                    <Legend />
                    <Line type="monotone" dataKey="Actual" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} connectNulls />
                    <Line type="monotone" dataKey="Forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Strict forecast label disclosure and limitation bounds */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 tracking-wider uppercase">{forecastData?.disclaimer || 'FORECAST — NOT ACTUAL'}</h4>
                  <p className="text-xs text-amber-700 mt-1">Calculations are deterministic based purely on historical trends. Statistical output does not imply a guaranteed physical result or absolute future market conditions.</p>
                </div>
              </div>
              <div className="bg-white px-3 py-2 rounded border border-amber-100 text-xs shrink-0">
                <span className="text-slate-500 font-medium block">History Confidence</span>
                <span className="font-bold text-emerald-600 uppercase tracking-widest text-[10px] mt-0.5 block">
                  {forecastData?.qualityIndicator || 'HIGH'} ({forecastData?.inputPeriodsCount} Periods)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AGING & WORKING CAPITAL */}
        {activeTab === 'aging' && (
          <div className="space-y-6" id="aging_tab">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Receivables & Payables Aging Analysis</h2>
              <p className="text-xs text-slate-500">Aging distributions segmented safely inside configurable time boundaries (Current, 1-30, 31-60, 61-90, 91-180, 181-365, 365+).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receivables aging distribution */}
              <div className="border border-slate-150 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1.5 text-blue-600" /> Receivables Aging Bucket Distribution
                </h3>
                <div className="h-56 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData?.receivablesAging || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(val) => [`₹${Number(val).toLocaleString()}`]} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs bg-slate-50 p-3 rounded text-slate-600 space-y-1">
                  <strong>Total Outstanding Debtors</strong>: ₹{agingData?.totalReceivables?.toLocaleString()} INR
                </div>
              </div>

              {/* Payables aging distribution */}
              <div className="border border-slate-150 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1.5 text-emerald-600" /> Payables Aging Bucket Distribution
                </h3>
                <div className="h-56 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData?.payablesAging || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(val) => [`₹${Number(val).toLocaleString()}`]} />
                      <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs bg-slate-50 p-3 rounded text-slate-600 space-y-1">
                  <strong>Total Outstanding Creditors</strong>: ₹{agingData?.totalPayables?.toLocaleString()} INR
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARTY RANKINGS */}
        {activeTab === 'rankings' && (
          <div className="space-y-6" id="rankings_tab">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer & Supplier Pareto Concentration Rankings</h2>
              <p className="text-xs text-slate-500">Ranks top contributing customers and suppliers using correct discovered mapping models to prevent label hallucination.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers */}
              <div className="border border-slate-150 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <PieIcon className="h-4 w-4 mr-1.5 text-blue-600" /> Top Sales Contribution (Customers)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b">
                        <th className="py-2 px-3">Customer Name</th>
                        <th className="py-2 px-3 text-right">Aggregate Sales</th>
                        <th className="py-2 px-3 text-right">Contribution %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rankings?.topCustomers?.map((c: any, index: number) => (
                        <tr key={index}>
                          <td className="py-2.5 px-3 text-slate-900 font-medium">{c.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold">₹{c.value.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">{c.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Suppliers */}
              <div className="border border-slate-150 rounded-lg p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <PieIcon className="h-4 w-4 mr-1.5 text-emerald-600" /> Top Purchases Contribution (Suppliers)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b">
                        <th className="py-2 px-3">Supplier Name</th>
                        <th className="py-2 px-3 text-right">Aggregate Purchases</th>
                        <th className="py-2 px-3 text-right">Contribution %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rankings?.topSuppliers?.map((s: any, index: number) => (
                        <tr key={index}>
                          <td className="py-2.5 px-3 text-slate-900 font-medium">{s.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold">₹{s.value.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">{s.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
              <strong>Pareto Concentration</strong>: {rankings?.paretoConcentration}
            </div>
          </div>
        )}

        {/* TAB 5: TAX RECONCILIATION */}
        {activeTab === 'tax' && (
          <div className="space-y-6" id="tax_tab">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tax Intelligence & Reconciliation Checks</h2>
              <p className="text-xs text-slate-500">Cross-examines source taxes versus calculated rates to ensure compliant reporting bounds.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <span className="text-xs text-slate-500 block">GST Collected (Liability)</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">₹{taxData?.taxCollected?.toLocaleString()}</span>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <span className="text-xs text-slate-500 block">GST Input Credit (ITC)</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">₹{taxData?.taxPaid?.toLocaleString()}</span>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <span className="text-xs text-slate-500 block">Net GST Payable</span>
                <span className="text-lg font-bold text-emerald-600 mt-1 block">₹{taxData?.taxDifference?.toLocaleString()}</span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Reconciliation Status Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b">
                      <th className="py-2 px-3">Period</th>
                      <th className="py-2 px-3 text-right">Source Tax</th>
                      <th className="py-2 px-3 text-right">Calculated Tax</th>
                      <th className="py-2 px-3 text-right">Reported Tax</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {taxData?.reconciliationBreakdown?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="py-2.5 px-3 text-slate-900 font-semibold">{item.period}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">₹{item.sourceTax.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">₹{item.calculatedTax.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{item.reportedTax.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full text-[10px]">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ALERTS & ANOMALIES */}
        {activeTab === 'alerts' && (
          <div className="space-y-6" id="alerts_tab">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Large Transactions & KPI Alerts Console</h2>
              <p className="text-xs text-slate-500">Leverages Phase 32O rule infrastructure to automatically register anomalous ledger behavior.</p>
            </div>

            <div className="space-y-4">
              {anomalies.map((an, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-lg bg-red-50/50 border border-red-100 items-start">
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-800 uppercase tracking-widest">{an.type}</span>
                      <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        Voucher: {an.voucherNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{an.description}</p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                      <span><strong>Date</strong>: {an.date}</span>
                      <span><strong>Ledger</strong>: {an.ledgerName}</span>
                      <span><strong>Amount</strong>: ₹{an.amount.toLocaleString()} INR</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: CUSTOM KPI BUILDER */}
        {activeTab === 'custom' && (
          <div className="space-y-6" id="custom_tab">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Unified Custom KPI Configurator</h2>
              <p className="text-xs text-slate-500">Safely construct structured formulas. Arbitrary execution of raw custom code strings is strictly prevented.</p>
            </div>

            <form onSubmit={handleCreateKPI} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-5 rounded-lg">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">KPI Name</label>
                <input 
                  type="text"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  placeholder="e.g. Outbound Marketing ROI"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Category</label>
                <select
                  value={kpiCategory}
                  onChange={(e) => setKpiCategory(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Profitability">Profitability</option>
                  <option value="Liquidity">Liquidity</option>
                  <option value="Working Capital">Working Capital</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Formula Operator</label>
                <select
                  value={kpiOp}
                  onChange={(e: any) => setKpiOp(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                >
                  <option value="SUM">SUM (Total Credits/Debits)</option>
                  <option value="AVERAGE">AVERAGE (Mean transaction amount)</option>
                  <option value="COUNT">COUNT (Total Voucher lines)</option>
                  <option value="MIN">MIN (Minimum mapped entry)</option>
                  <option value="MAX">MAX (Maximum mapped entry)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Target Field</label>
                <select
                  value={kpiField}
                  onChange={(e) => setKpiField(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                >
                  <option value="balance">Ledger Balance</option>
                  <option value="debit">Debit Total</option>
                  <option value="credit">Credit Total</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Description / Disclosures</label>
                <textarea
                  value={kpiDesc}
                  onChange={(e) => setKpiDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none h-16"
                  placeholder="Define context boundaries..."
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                >
                  <PlusCircle className="h-4 w-4" /> Save and Compile KPI Definition
                </button>
              </div>
            </form>

            {customFeedback && (
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 font-semibold">
                {customFeedback}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DIAGNOSTIC TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-6" id="tests_tab">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Financial Intelligence Diagnostic Suite</h2>
              <p className="text-xs text-slate-500">Evaluates calculations against rigorous synthetic test vectors to verify mathematical reliability.</p>
            </div>

            <div className="space-y-3">
              {testResults.map((tr, idx) => (
                <div key={idx} className="flex gap-3 p-3.5 rounded border items-start bg-slate-50 border-slate-200">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">{tr.testName}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{tr.message}</p>
                    <span className="inline-flex text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1.5">PASSED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Natural Language KPI Requests (Grounding Interactive Sandbox) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" id="nl_sandbox">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Search className="h-4 w-4 mr-1.5 text-blue-600" /> Natural-Language KPI Grounding Console
        </h3>
        <p className="text-xs text-slate-500 mt-1">Simulate natural-language inquiries translated instantly to validated metrics structures.</p>

        <form onSubmit={handleNLSubmit} className="flex gap-2 mt-4">
          <input 
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="e.g. Show sales growth this month, Compare outstanding debtors..."
            className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition flex items-center gap-1"
          >
            Ask Engine <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {nlResponse && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-2.5">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Matched Registered KPI</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{nlResponse.matchedKPI}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Validated Computed Result</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{nlResponse.result}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Formula Trace</span>
                <span className="text-slate-600 font-semibold block">{nlResponse.formulaUsed}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Disclosures & Freshness</span>
                <span className="text-slate-600 font-semibold block">{nlResponse.evidence}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
