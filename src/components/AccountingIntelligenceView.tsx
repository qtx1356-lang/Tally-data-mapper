import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Shield,
  HelpCircle,
  RefreshCw,
  Download,
  Filter,
  Layers,
  Calendar,
  DollarSign,
  Package,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Sliders,
  Check,
  ChevronRight,
  Scale,
  Zap,
  Tag,
  Search,
  SlidersHorizontal,
  Info,
  Building2,
  UserCheck,
  XCircle,
  Sparkles,
  Play,
  Save,
  Trash2,
  AlertOctagon,
  Percent
} from 'lucide-react';
import {
  AccountingPeriod,
  ExecutiveKpi,
  SalesAnalyticsResult,
  PurchaseAnalyticsResult,
  ExpenseAnalyticsResult,
  CashFlowResult,
  InventoryAnalyticsResult,
  ReceivablesAgingSummary,
  PayablesAgingSummary,
  ProductMarginReport,
  GstAnalyticsSummary,
  GstRateBreakdown,
  GstExceptionReport,
  ReconciliationJobResult,
  BusinessRuleDefinition,
  ExecutiveDashboardOverview,
  AccountingAnomaly,
  DuplicateVoucherCandidate,
  SemanticFieldDiscovery,
  KpiDetailCalculation,
  RuleCondition
} from '../types/accountingIntelligence';

type AnalyticsTab =
  | 'Executive Overview'
  | 'Sales Intelligence'
  | 'Margins & Profitability'
  | 'Receivables & Payables'
  | 'Purchases & Expenses'
  | 'Inventory Intelligence'
  | 'GST Analytics & Exceptions'
  | 'GST Reconciliation'
  | 'Anomalies & Duplicates'
  | 'Business Rule Engine'
  | 'Semantic Model';

export function AccountingIntelligenceView() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Executive Overview');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('CurrentFinancialYear');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tallyConnected, setTallyConnected] = useState<boolean>(true);
  const [activeKpiCalculation, setActiveKpiCalculation] = useState<KpiDetailCalculation | null>(null);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<any | null>(null);

  // Sales trend mode
  const [salesTrendMetric, setSalesTrendMetric] = useState<'Value' | 'Quantity' | 'InvoiceCount'>('Value');
  const [topCustomersLimit, setTopCustomersLimit] = useState<number>(10);

  // Inventory filter
  const [slowMovingDays, setSlowMovingDays] = useState<number>(90);
  const [deadStockDays, setDeadStockDays] = useState<number>(180);

  // Reconciliation tolerance
  const [amountTolerance, setAmountTolerance] = useState<number>(1.0);
  const [taxTolerance, setTaxTolerance] = useState<number>(1.0);

  // State for fetched data
  const [overview, setOverview] = useState<ExecutiveDashboardOverview | null>(null);
  const [salesData, setSalesData] = useState<SalesAnalyticsResult | null>(null);
  const [purchaseData, setPurchaseData] = useState<PurchaseAnalyticsResult | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseAnalyticsResult | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowResult | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryAnalyticsResult | null>(null);
  const [receivablesData, setReceivablesData] = useState<ReceivablesAgingSummary | null>(null);
  const [payablesData, setPayablesData] = useState<PayablesAgingSummary | null>(null);
  const [marginsData, setMarginsData] = useState<ProductMarginReport | null>(null);
  const [gstSummary, setGstSummary] = useState<GstAnalyticsSummary | null>(null);
  const [gstRates, setGstRates] = useState<GstRateBreakdown[]>([]);
  const [gstExceptions, setGstExceptions] = useState<GstExceptionReport | null>(null);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationJobResult | null>(null);
  const [anomalies, setAnomalies] = useState<AccountingAnomaly[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateVoucherCandidate[]>([]);
  const [rules, setRules] = useState<BusinessRuleDefinition[]>([]);
  const [semanticModel, setSemanticModel] = useState<SemanticFieldDiscovery[]>([]);

  // Rule Builder Form State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleTestResult, setRuleTestResult] = useState<any | null>(null);
  const [isTestingRule, setIsTestingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BusinessRuleDefinition>>({
    name: 'High Outstanding Alert',
    description: 'Flag receivables exceeding specified credit amount and days',
    scope: 'Receivable',
    logicalOperator: 'AND',
    severity: 'High',
    actionType: 'Include in Dashboard',
    enabled: true,
    conditions: [
      { field: 'OutstandingAmount', operator: '>', value: '500000', valueType: 'Numeric' },
      { field: 'OldestDueDays', operator: '>', value: '90', valueType: 'Days' }
    ]
  });

  // Fetch data on period change or initial load
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        overviewRes,
        salesRes,
        purchasesRes,
        expensesRes,
        cashRes,
        invRes,
        recRes,
        payRes,
        marginsRes,
        gstRes,
        reconRes,
        anomRes,
        rulesRes,
        semanticRes
      ] = await Promise.all([
        fetch(`/api/accounting/overview?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/sales?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/purchases?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/expenses?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/cashflow?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/inventory?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/receivables`).then((r) => r.json()),
        fetch(`/api/accounting/payables`).then((r) => r.json()),
        fetch(`/api/accounting/margins?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/gst?period=${selectedPeriod}`).then((r) => r.json()),
        fetch(`/api/accounting/reconciliation`).then((r) => r.json()),
        fetch(`/api/accounting/anomalies`).then((r) => r.json()),
        fetch(`/api/accounting/rules`).then((r) => r.json()),
        fetch(`/api/accounting/semantic-model`).then((r) => r.json())
      ]);

      setOverview(overviewRes);
      setSalesData(salesRes);
      setPurchaseData(purchasesRes);
      setExpenseData(expensesRes);
      setCashFlowData(cashRes);
      setInventoryData(invRes);
      setReceivablesData(recRes);
      setPayablesData(payRes);
      setMarginsData(marginsRes);
      setGstSummary(gstRes.summary);
      setGstRates(gstRes.rates || []);
      setGstExceptions(gstRes.exceptions);
      setReconciliationData(reconRes);
      setAnomalies(anomRes.anomalies || []);
      setDuplicates(anomRes.duplicates || []);
      setRules(rulesRes);
      setSemanticModel(semanticRes.semanticConcepts || []);
    } catch (err) {
      console.error('Failed to load accounting intelligence data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchKpiTransparency = async (kpiId: string) => {
    try {
      const res = await fetch(`/api/accounting/kpis/${kpiId}/transparency`);
      const data = await res.json();
      setActiveKpiCalculation(data);
    } catch (err) {
      console.error('Failed to fetch KPI transparency:', err);
    }
  };

  const handleTestRule = async () => {
    setIsTestingRule(true);
    try {
      const res = await fetch('/api/accounting/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      const data = await res.json();
      setRuleTestResult(data);
    } catch (err) {
      console.error('Failed to test rule:', err);
    } finally {
      setIsTestingRule(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const res = await fetch('/api/accounting/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      const saved = await res.json();
      setRules((prev) => [...prev, saved]);
      setIsRuleModalOpen(false);
      setRuleTestResult(null);
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  const handleToggleRule = async (rule: BusinessRuleDefinition) => {
    try {
      const updated = { ...rule, enabled: !rule.enabled };
      await fetch(`/api/accounting/rules/${rule.ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setRules((prev) => prev.map((r) => (r.ruleId === rule.ruleId ? updated : r)));
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleInvalidateCache = async () => {
    try {
      await fetch('/api/accounting/cache/invalidate', { method: 'POST' });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to invalidate cache:', err);
    }
  };

  const formatCurrency = (val?: number | null) => {
    if (val === null || val === undefined) return 'Unavailable';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatLakhsCr = (val: number) => {
    if (Math.abs(val) >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(val) >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0B1120] text-slate-100 overflow-hidden select-none">
      {/* Top Banner: Accounting Intelligence & Period Engine */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100 tracking-wide">
                EXFIN Accounting Intelligence Engine
              </h1>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-700/50">
                Phase 14 Read-Only
              </span>
              <span className="rounded bg-blue-950/80 px-2 py-0.5 text-[10px] font-mono font-medium text-blue-400 border border-blue-700/50 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                Zero Tally Writes Guaranteed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic accounting analytics, GST reconciliation, anomaly detection & business rule engine
            </p>
          </div>
        </div>

        {/* Period Selector & Actions */}
        <div className="flex items-center space-x-3">
          {/* Tally Connectivity Status Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                tallyConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 font-mono text-[11px]">
              {tallyConnected ? 'Tally Connected (Live)' : 'Live Data Unavailable'}
            </span>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="CurrentFinancialYear" className="bg-slate-900">Current FY (2026-2027)</option>
              <option value="PreviousFinancialYear" className="bg-slate-900">Previous FY (2025-2026)</option>
              <option value="CurrentQuarter" className="bg-slate-900">Current Quarter (Q2 FY27)</option>
              <option value="PreviousQuarter" className="bg-slate-900">Previous Quarter (Q1 FY27)</option>
              <option value="CurrentMonth" className="bg-slate-900">Current Month (Sep 2026)</option>
              <option value="PreviousMonth" className="bg-slate-900">Previous Month (Aug 2026)</option>
            </select>
          </div>

          {/* Refresh & Cache Invalidation */}
          <button
            onClick={handleInvalidateCache}
            title="Invalidate Cache & Refresh from Live Tally Schema"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0F172A] px-6 overflow-x-auto no-scrollbar space-x-1 py-1">
        {(
          [
            'Executive Overview',
            'Sales Intelligence',
            'Margins & Profitability',
            'Receivables & Payables',
            'Purchases & Expenses',
            'Inventory Intelligence',
            'GST Analytics & Exceptions',
            'GST Reconciliation',
            'Anomalies & Duplicates',
            'Business Rule Engine',
            'Semantic Model'
          ] as AnalyticsTab[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Disclaimers & Professional Advice Warning */}
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Review Recommended:</strong> Analytical calculations, anomalies, and reconciliation flags are derived from discovered Tally vouchers and do not constitute professional accounting, tax, legal, or statutory advice.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-300/80 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/50">
            Source: 01-Apr-2026 to 31-Mar-2027
          </span>
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'Executive Overview' && overview && (
          <div className="space-y-6">
            {/* Top Row KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {overview.kpiCards.map((kpi) => (
                <div
                  key={kpi.id}
                  className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        kpi.statusBadge === 'Optimal'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                          : kpi.statusBadge === 'Warning'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {kpi.statusBadge}
                    </span>
                  </div>

                  <div className="my-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-100 tracking-tight">
                      {kpi.formattedValue}
                    </span>
                    {kpi.changePercentage !== null && (
                      <span
                        className={`text-xs font-semibold flex items-center ${
                          kpi.changePercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {kpi.changePercentage >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                        )}
                        {Math.abs(kpi.changePercentage)}%
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[170px]" title={kpi.sourceDescription}>
                      {kpi.periodLabel}
                    </span>
                    <button
                      onClick={() => handleFetchKpiTransparency(kpi.id)}
                      className="text-sky-400 hover:text-sky-300 flex items-center space-x-0.5"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>How calculated</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Management Alerts & High-Risk Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Alerts List */}
              <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-slate-100">Management Action Alerts</h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {overview.alerts.length} Flagged Review Items
                  </span>
                </div>

                <div className="space-y-3">
                  {overview.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              alert.priority === 'Critical'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                : alert.priority === 'High'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-sky-950 text-sky-300 border border-sky-800/60'
                            }`}
                          >
                            {alert.priority}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {alert.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {alert.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{alert.whatHappened}</p>

                      <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-800/80 space-y-1">
                        <div>
                          <strong className="text-slate-300">Why Flagged:</strong> {alert.whyFlagged}
                        </div>
                        <div>
                          <strong className="text-slate-300">Calculation:</strong> {alert.calculation}
                        </div>
                        <div className="text-amber-300/90">
                          <strong>Action:</strong> {alert.recommendedReviewAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Quality Gate & Completeness Scores */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <h2 className="text-sm font-bold text-slate-100">Data Quality Gate</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    STATUS: GOOD
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Sales Data Completeness</span>
                      <span className="font-mono text-emerald-400">
                        {overview.dataQualityStatus.salesCompleteness}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${overview.dataQualityStatus.salesCompleteness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Customer Master Completeness</span>
                      <span className="font-mono text-emerald-400">
                        {overview.dataQualityStatus.customerCompleteness}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${overview.dataQualityStatus.customerCompleteness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>GST Tax Code Completeness</span>
                      <span className="font-mono text-emerald-400">
                        {overview.dataQualityStatus.gstCompleteness}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${overview.dataQualityStatus.gstCompleteness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Inventory Valuation Reliability</span>
                      <span className="font-mono text-sky-400">
                        {overview.dataQualityStatus.inventoryCompleteness}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-sky-500 h-1.5 rounded-full"
                        style={{ width: `${overview.dataQualityStatus.inventoryCompleteness}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
                  <div className="font-semibold text-slate-300">Audit & Validation Notes:</div>
                  {overview.dataQualityStatus.notes.map((note, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALES INTELLIGENCE */}
        {activeTab === 'Sales Intelligence' && salesData && (
          <div className="space-y-6">
            {/* Sales Trends Header & Metric Switcher */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#1E293B] p-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Monthly Sales Trends</h2>
                <p className="text-xs text-slate-400">
                  Total Gross Sales: {formatLakhsCr(salesData.totalGrossSales)} | Invoices: {salesData.totalInvoices} | Items: {salesData.totalQuantity.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setSalesTrendMetric('Value')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    salesTrendMetric === 'Value'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sales Value
                </button>
                <button
                  onClick={() => setSalesTrendMetric('Quantity')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    salesTrendMetric === 'Quantity'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Quantity (Units)
                </button>
                <button
                  onClick={() => setSalesTrendMetric('InvoiceCount')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    salesTrendMetric === 'InvoiceCount'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Invoice Count
                </button>
              </div>
            </div>

            {/* Monthly Trend Bars */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
              <div className="grid grid-cols-6 gap-3 text-center">
                {salesData.monthlyTrends.map((month) => {
                  const displayValue =
                    salesTrendMetric === 'Value'
                      ? formatLakhsCr(month.salesValue)
                      : salesTrendMetric === 'Quantity'
                      ? `${month.quantity.toLocaleString()} pcs`
                      : `${month.invoiceCount} inv`;
                  return (
                    <div
                      key={month.name}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="text-xs font-semibold text-slate-300">{month.name}</div>
                      <div className="text-base font-bold text-slate-100">{displayValue}</div>
                      <div
                        className={`text-[11px] font-medium flex items-center justify-center ${
                          month.growthPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {month.growthPercentage >= 0 ? '+' : ''}
                        {month.growthPercentage}% MoM
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {month.percentageOfTotal}% of Total
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Customers & Customer Concentration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Customers Table */}
              <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-100">Top Customers by Sales Value</h3>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <span>Show:</span>
                    {[10, 20, 50].map((lim) => (
                      <button
                        key={lim}
                        onClick={() => setTopCustomersLimit(lim)}
                        className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                          topCustomersLimit === lim
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        Top {lim}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-medium">Customer Name</th>
                        <th className="pb-2 font-medium text-right">Sales Value</th>
                        <th className="pb-2 font-medium text-right">Gross Profit</th>
                        <th className="pb-2 font-medium text-right">Margin %</th>
                        <th className="pb-2 font-medium text-right">Share %</th>
                        <th className="pb-2 font-medium text-right">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {salesData.topCustomers.slice(0, topCustomersLimit).map((cust, idx) => (
                        <tr key={cust.name} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-medium text-slate-200">
                            <span className="text-slate-500 mr-2 font-mono text-[10px]">
                              #{idx + 1}
                            </span>
                            {cust.name}
                          </td>
                          <td className="py-2.5 font-mono text-slate-100 text-right">
                            {formatLakhsCr(cust.salesValue)}
                          </td>
                          <td className="py-2.5 font-mono text-emerald-400 text-right">
                            {cust.grossProfit ? formatLakhsCr(cust.grossProfit) : '—'}
                          </td>
                          <td className="py-2.5 font-mono text-slate-300 text-right">
                            {cust.grossMarginPercentage ? `${cust.grossMarginPercentage}%` : '—'}
                          </td>
                          <td className="py-2.5 font-mono text-slate-400 text-right">
                            {cust.percentageOfTotal}%
                          </td>
                          <td className="py-2.5 font-mono text-right">
                            <span
                              className={
                                cust.growthPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }
                            >
                              {cust.growthPercentage >= 0 ? '+' : ''}
                              {cust.growthPercentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Concentration Card & Declining Accounts */}
              <div className="space-y-6">
                {/* Concentration Metric */}
                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-100">Customer Concentration</h3>
                    <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50">
                      MODERATE RISK
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Top 5 Customers Share</span>
                      <span className="font-bold text-base text-slate-100 font-mono">
                        {salesData.concentration.top5SharePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${salesData.concentration.top5SharePercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-slate-300 pt-2">
                      <span>Top 10 Customers Share</span>
                      <span className="font-bold text-base text-slate-100 font-mono">
                        {salesData.concentration.top10SharePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-sky-500 h-2 rounded-full"
                        style={{ width: `${salesData.concentration.top10SharePercentage}%` }}
                      />
                    </div>

                    <div className="pt-2 text-[11px] text-slate-400">
                      Total Active Billing Accounts: <strong>{salesData.concentration.totalActiveCustomers} Customers</strong>
                    </div>
                  </div>
                </div>

                {/* Declining Accounts Card */}
                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-slate-100">Customer Sales Decline</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {salesData.decliningCustomers.map((dec) => (
                      <div
                        key={dec.customerName}
                        className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex justify-between font-medium text-slate-200">
                          <span className="truncate max-w-[180px]">{dec.customerName}</span>
                          <span className="text-rose-400 font-mono font-semibold">
                            {dec.growthPercentage}%
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Curr: {formatLakhsCr(dec.currentSales)}</span>
                          <span>Prev: {formatLakhsCr(dec.previousSales)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MARGINS & PROFITABILITY */}
        {activeTab === 'Margins & Profitability' && marginsData && (
          <div className="space-y-6">
            {/* Margin Data Quality Gate Banner */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#1E293B] p-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">
                    Gross Margin & Profitability Engine
                  </h2>
                  <p className="text-xs text-slate-400">{marginsData.qualityStatus.message}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL REVENUE</span>
                  <span className="font-bold text-slate-200">{formatLakhsCr(marginsData.totalRevenue)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL COGS</span>
                  <span className="font-bold text-slate-200">
                    {marginsData.totalCost ? formatLakhsCr(marginsData.totalCost) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">GROSS MARGIN</span>
                  <span className="font-bold text-emerald-400">
                    {marginsData.overallMarginPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* High Margin Products vs Low Margin Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* High Margin Products */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">High-Margin Products</h3>
                </div>

                <div className="space-y-3">
                  {marginsData.topMarginProducts.map((prod) => (
                    <div
                      key={prod.productName}
                      className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{prod.productName}</div>
                          <div className="text-[10px] text-slate-500">{prod.stockGroup}</div>
                        </div>
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {prod.grossMarginPercentage}% Margin
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Sales: {formatLakhsCr(prod.salesValue)}</span>
                        <span>COGS: {prod.costOfGoodsSold ? formatLakhsCr(prod.costOfGoodsSold) : '—'}</span>
                        <span className="text-emerald-400">
                          Profit: {prod.grossProfit ? formatLakhsCr(prod.grossProfit) : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Margin & Incomplete Cost Products */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Low-Margin & Cost Audit Exceptions
                  </h3>
                </div>

                <div className="space-y-3">
                  {marginsData.lowestMarginProducts.map((prod) => (
                    <div
                      key={prod.productName}
                      className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{prod.productName}</div>
                          <div className="text-[10px] text-slate-500">{prod.stockGroup}</div>
                        </div>
                        {prod.costBasisReliability === 'Unavailable' ? (
                          <span className="text-[10px] font-bold font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60">
                            COST INCOMPLETE
                          </span>
                        ) : (
                          <span className="text-sm font-bold font-mono text-amber-400">
                            {prod.grossMarginPercentage}% Margin
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        {prod.statusNote}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RECEIVABLES & PAYABLES */}
        {activeTab === 'Receivables & Payables' && receivablesData && payablesData && (
          <div className="space-y-6">
            {/* Receivables Ageing Overview */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Receivables Ageing Analysis</h3>
                  <p className="text-xs text-slate-400">
                    Total Receivables: {formatLakhsCr(receivablesData.totalReceivables)} | Not Due: {formatLakhsCr(receivablesData.totalNotDue)} | Overdue: {formatLakhsCr(receivablesData.totalOverdue)}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  As of Date: {receivablesData.asOfDate}
                </span>
              </div>

              {/* Ageing Buckets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {receivablesData.buckets.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 text-center space-y-1"
                  >
                    <div className="text-xs text-slate-400 font-medium">{b.label}</div>
                    <div className="text-base font-bold text-slate-100 font-mono">
                      {formatLakhsCr(b.totalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500">{b.billCount} open bills</div>
                  </div>
                ))}
              </div>

              {/* Top Overdue Customers Table */}
              <div className="pt-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Customer-Wise Overdue Balances
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-medium">Customer Name</th>
                        <th className="pb-2 font-medium text-right">Total Outstanding</th>
                        <th className="pb-2 font-medium text-right">Overdue Amount</th>
                        <th className="pb-2 font-medium text-center">Oldest Due Date</th>
                        <th className="pb-2 font-medium text-right">Max Days</th>
                        <th className="pb-2 font-medium text-center">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {receivablesData.topOverdueCustomers.map((cust) => (
                        <tr key={cust.customerName} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-medium text-slate-200">{cust.customerName}</td>
                          <td className="py-2.5 font-mono text-right text-slate-100">
                            {formatLakhsCr(cust.totalOutstanding)}
                          </td>
                          <td className="py-2.5 font-mono text-right text-rose-400 font-semibold">
                            {formatLakhsCr(cust.overdueAmount)}
                          </td>
                          <td className="py-2.5 font-mono text-center text-slate-400">
                            {cust.oldestDueDate}
                          </td>
                          <td className="py-2.5 font-mono text-right text-slate-200">
                            {cust.maxOverdueDays} days
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cust.riskCategory === 'Critical'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                  : cust.riskCategory === 'High'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {cust.riskCategory}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payables Ageing & Cash Flow Movements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payables Ageing */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100">Supplier Payables Ageing</h3>
                  <span className="text-xs font-mono text-slate-300">
                    Total: {formatLakhsCr(payablesData.totalPayables)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {payablesData.buckets.slice(0, 3).map((b) => (
                    <div key={b.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                      <div className="text-[11px] text-slate-400">{b.label}</div>
                      <div className="text-sm font-bold text-slate-100 font-mono">
                        {formatLakhsCr(b.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  {payablesData.topSuppliersPayable.map((sup) => (
                    <div
                      key={sup.supplierName}
                      className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{sup.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Due: {sup.oldestDueDate} ({sup.maxOverdueDays} days)
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-slate-200 font-bold">{formatLakhsCr(sup.totalPayable)}</div>
                        <div className="text-amber-400 text-[11px]">
                          Overdue: {formatLakhsCr(sup.overdueAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Flow View */}
              {cashFlowData && (
                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-100">Cash Flow Movement Summary</h3>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Net: +{formatLakhsCr(cashFlowData.netCashMovement)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span>Total Cash & Bank Inflows (Receipts)</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatLakhsCr(cashFlowData.totalReceipts)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span>Total Outflows (Payments & Transfers)</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {formatLakhsCr(cashFlowData.totalPayments)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span>Bank Accounts Balance (Discovered)</span>
                      <span className="font-mono text-slate-100 font-bold">
                        {formatLakhsCr(cashFlowData.bankLedgerBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Cash-in-hand Balance</span>
                      <span className="font-mono text-slate-100 font-bold">
                        {formatLakhsCr(cashFlowData.cashLedgerBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded bg-slate-900/80 p-2.5 text-[11px] text-slate-400 border border-slate-800 leading-relaxed">
                    {cashFlowData.accountingDisclaimer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PURCHASES & EXPENSES */}
        {activeTab === 'Purchases & Expenses' && purchaseData && expenseData && (
          <div className="space-y-6">
            {/* Top Row: Purchases & Expenses Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Purchases Breakdown */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100">Top Suppliers by Purchase Value</h3>
                  <span className="text-xs font-mono text-slate-300">
                    Total: {formatLakhsCr(purchaseData.totalPurchases)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {purchaseData.topSuppliers.map((sup, idx) => (
                    <div
                      key={sup.name}
                      className="p-3 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">
                          <span className="text-slate-500 mr-2 font-mono text-[10px]">#{idx + 1}</span>
                          {sup.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sup.invoiceCount} Bills | {sup.percentageOfTotal}% Share
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-100">
                        {formatLakhsCr(sup.salesValue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Spikes & Audit Alerts */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">Detected Expense Spikes</h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60">
                    THRESHOLD &gt; 30% MoM
                  </span>
                </div>

                <div className="space-y-3">
                  {expenseData.detectedSpikes.map((sp) => (
                    <div
                      key={sp.expenseLedgerName}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex justify-between items-start text-xs">
                        <div className="font-semibold text-slate-200">{sp.expenseLedgerName}</div>
                        <span className="text-rose-400 font-mono font-bold">
                          +{sp.increasePercentage}% Spike
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{sp.explanation}</div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>Curr: {formatLakhsCr(sp.currentPeriodAmount)}</span>
                        <span>Prev: {formatLakhsCr(sp.previousPeriodAmount)}</span>
                        <span className="text-rose-400">Diff: +{formatLakhsCr(sp.increaseAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expense by Group List */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Expenses by Accounting Group
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {expenseData.groupWiseExpenses.map((grp) => (
                      <div
                        key={grp.name}
                        className="flex justify-between items-center py-1.5 px-2 rounded bg-slate-900/40 border border-slate-800/60"
                      >
                        <span className="text-slate-300">{grp.name}</span>
                        <span className="font-mono text-slate-200 font-bold">
                          {formatLakhsCr(grp.salesValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INVENTORY INTELLIGENCE */}
        {activeTab === 'Inventory Intelligence' && inventoryData && (
          <div className="space-y-6">
            {/* Inventory KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-slate-400 font-medium">Total Inventory Value</span>
                <div className="text-xl font-bold text-slate-100 font-mono my-1">
                  {formatLakhsCr(inventoryData.totalInventoryValue)}
                </div>
                <span className="text-[10px] text-slate-500">{inventoryData.totalDistinctItems} Items</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-amber-400 font-medium">Slow-Moving Stock</span>
                <div className="text-xl font-bold text-amber-400 font-mono my-1">
                  {formatLakhsCr(inventoryData.slowMovingStockValue)}
                </div>
                <span className="text-[10px] text-slate-500">&gt; {slowMovingDays} Days Without Movement</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-rose-400 font-medium">Dead Stock</span>
                <div className="text-xl font-bold text-rose-400 font-mono my-1">
                  {formatLakhsCr(inventoryData.deadStockValue)}
                </div>
                <span className="text-[10px] text-slate-500">&gt; {deadStockDays} Days Zero Movement</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-slate-400 font-medium">Warehouse Godowns</span>
                <div className="text-xl font-bold text-sky-400 font-mono my-1">4 Godowns</div>
                <span className="text-[10px] text-slate-500">Live stock valuation active</span>
              </div>
            </div>

            {/* Top Items by Value & Dead Stock Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Stock Items */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100">Top Inventory Items by Closing Value</h3>
                </div>

                <div className="space-y-2.5">
                  {inventoryData.topItemsByValue.map((item) => (
                    <div
                      key={item.itemName}
                      className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-start font-semibold text-slate-200">
                        <span>{item.itemName}</span>
                        <span className="font-mono text-emerald-400">
                          {formatLakhsCr(item.closingValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Qty: {item.closingQuantity.toLocaleString()} @ ₹{item.closingRate}</span>
                        <span>Location: {item.godownLocation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dead Stock & Obsolete Parts */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-slate-100">Dead Stock (&gt; 180 Days Inactive)</h3>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {inventoryData.deadStockItems.map((item) => (
                    <div
                      key={item.itemName}
                      className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-start font-semibold text-slate-200">
                        <span>{item.itemName}</span>
                        <span className="font-mono text-rose-400 font-bold">
                          {formatLakhsCr(item.closingValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Last Moved: {item.lastMovementDate}</span>
                        <span className="text-rose-300 font-semibold">{item.daysSinceLastMovement} Days Idle</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: GST ANALYTICS & EXCEPTIONS */}
        {activeTab === 'GST Analytics & Exceptions' && gstSummary && gstExceptions && (
          <div className="space-y-6">
            {/* GST Summary Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-slate-400 font-medium">GST Taxable Turnover</span>
                <div className="text-xl font-bold text-slate-100 font-mono my-1">
                  {formatLakhsCr(gstSummary.totalTaxableValue)}
                </div>
                <span className="text-[10px] text-slate-500">{gstSummary.totalGstInvoices} Invoices</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-slate-400 font-medium">CGST + SGST Recorded</span>
                <div className="text-xl font-bold text-emerald-400 font-mono my-1">
                  {formatLakhsCr(gstSummary.totalCgst + gstSummary.totalSgst)}
                </div>
                <span className="text-[10px] text-slate-500">Intra-state supplies</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-slate-400 font-medium">IGST Recorded</span>
                <div className="text-xl font-bold text-sky-400 font-mono my-1">
                  {formatLakhsCr(gstSummary.totalIgst)}
                </div>
                <span className="text-[10px] text-slate-500">Inter-state supplies</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 text-center">
                <span className="text-xs text-amber-400 font-medium">GST Exceptions Found</span>
                <div className="text-xl font-bold text-amber-400 font-mono my-1">
                  {gstExceptions.totalExceptionsFound}
                </div>
                <span className="text-[10px] text-slate-500">{gstExceptions.totalVouchersScanned} Scanned</span>
              </div>
            </div>

            {/* GST Rate Analysis Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100">Discovered GST Tax Rate Slabs</h3>
              <div className="grid grid-cols-4 gap-3 text-center">
                {gstRates.map((rate) => (
                  <div
                    key={rate.taxRatePercentage}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1"
                  >
                    <div className="text-base font-bold text-sky-400 font-mono">
                      {rate.taxRatePercentage}% Slab
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      {formatLakhsCr(rate.taxableValue)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Tax: {formatLakhsCr(rate.totalTax)} ({rate.voucherCount} Vouchers)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GST Exception Records Table */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">GST Exception Audit Register</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Tolerance: ₹1.00 | Format: Statutory 15-char Regex
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium">Voucher #</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Party Name</th>
                      <th className="pb-2 font-medium">Exception Type</th>
                      <th className="pb-2 font-medium text-right">Taxable</th>
                      <th className="pb-2 font-medium text-right">Recorded Tax</th>
                      <th className="pb-2 font-medium text-right">Expected Tax</th>
                      <th className="pb-2 font-medium text-right">Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {gstExceptions.exceptions.map((exc) => (
                      <tr key={exc.voucherNumber} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-slate-200">
                          {exc.voucherNumber}
                        </td>
                        <td className="py-2.5 font-mono text-slate-400">{exc.voucherDate}</td>
                        <td className="py-2.5 font-medium text-slate-300">{exc.partyName}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              exc.severity === 'Error'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            }`}
                          >
                            {exc.exceptionType}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-right text-slate-300">
                          {formatLakhsCr(exc.taxableValue)}
                        </td>
                        <td className="py-2.5 font-mono text-right text-slate-300">
                          {formatCurrency(exc.recordedTax)}
                        </td>
                        <td className="py-2.5 font-mono text-right text-emerald-400">
                          {formatCurrency(exc.expectedTax)}
                        </td>
                        <td className="py-2.5 font-mono text-right text-rose-400 font-bold">
                          {exc.difference > 0 ? `₹${exc.difference}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: GST RECONCILIATION */}
        {activeTab === 'GST Reconciliation' && reconciliationData && (
          <div className="space-y-6">
            {/* Reconciliation KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-[#1E293B] border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">Total Scanned</div>
                <div className="text-lg font-bold text-slate-100 font-mono">
                  {reconciliationData.totalRecords}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1E293B] border border-slate-800 text-center">
                <div className="text-[11px] text-emerald-400">Matched</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  {reconciliationData.matchedCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1E293B] border border-slate-800 text-center">
                <div className="text-[11px] text-sky-400">Partial Match</div>
                <div className="text-lg font-bold text-sky-400 font-mono">
                  {reconciliationData.partiallyMatchedCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1E293B] border border-slate-800 text-center">
                <div className="text-[11px] text-rose-400">Mismatch</div>
                <div className="text-lg font-bold text-rose-400 font-mono">
                  {reconciliationData.mismatchCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1E293B] border border-slate-800 text-center">
                <div className="text-[11px] text-amber-400">Missing in Tally</div>
                <div className="text-lg font-bold text-amber-400 font-mono">
                  {reconciliationData.missingInTallyCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1E293B] border border-slate-800 text-center">
                <div className="text-[11px] text-purple-400">Needs Review</div>
                <div className="text-lg font-bold text-purple-400 font-mono">
                  {reconciliationData.needsReviewCount}
                </div>
              </div>
            </div>

            {/* Reconciliation Detailed List */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Tally Purchase Invoices vs Vendor GSTR-2B Filing
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <span>Tolerance: ₹{amountTolerance} Taxable / ₹{taxTolerance} Tax</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {reconciliationData.items.map((item) => (
                  <div
                    key={item.matchId}
                    className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Matched'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                              : item.status === 'Partially Matched'
                              ? 'bg-sky-950 text-sky-300 border border-sky-700/50'
                              : item.status === 'Mismatch'
                              ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {item.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-400">({item.invoiceDate})</span>
                        <span className="text-xs font-semibold text-slate-300">— {item.partyName}</span>
                      </div>

                      <button
                        onClick={() => setSelectedDiscrepancy(item)}
                        className="text-sky-400 hover:text-sky-300 text-xs flex items-center space-x-1 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Drill-down</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/40 p-2 rounded border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">TALLY TAXABLE</span>
                        <span className="text-slate-300">{formatCurrency(item.tallyTaxableValue)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">EXTERNAL TAXABLE</span>
                        <span className="text-slate-300">{formatCurrency(item.externalTaxableValue)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">TAXABLE DIFF</span>
                        <span
                          className={
                            item.taxableDifference === 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'
                          }
                        >
                          {formatCurrency(item.taxableDifference)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">TAX DIFF</span>
                        <span
                          className={
                            item.taxDifference === 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'
                          }
                        >
                          {formatCurrency(item.taxDifference)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">{item.matchReason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: ANOMALIES & DUPLICATES */}
        {activeTab === 'Anomalies & Duplicates' && (
          <div className="space-y-6">
            {/* Anomaly Principle Disclaimer */}
            <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 px-4 py-2.5 text-xs text-sky-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  <strong>Analytical Principle:</strong> An accounting anomaly is unusual compared with configured historical trends or business rules, but does NOT automatically constitute fraud or wrongdoing.
                </span>
              </div>
            </div>

            {/* Anomaly Cards */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Detected Statistical & Pattern Anomalies
                  </h3>
                </div>
                <span className="text-xs text-slate-400">{anomalies.length} Flagged Transactions</span>
              </div>

              <div className="space-y-3">
                {anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            anom.severity === 'High'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {anom.anomalyType}
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {anom.voucherNumber}
                        </span>
                        <span className="text-xs text-slate-400">({anom.voucherDate})</span>
                        <span className="text-xs font-semibold text-slate-300">
                          — {anom.partyOrAccount}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-100 text-sm">
                        {formatCurrency(anom.amount)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">{anom.reason}</div>

                    <div className="flex justify-between text-[11px] font-mono text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/80">
                      <span>Benchmark: {anom.historicalBenchmark}</span>
                      <span className="text-slate-500">{anom.analyticalNote}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duplicate Voucher Candidates */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-slate-100">Duplicate Voucher Candidates</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Matching: Voucher #, Date, Party, Gross Amount
                </span>
              </div>

              <div className="space-y-3">
                {duplicates.map((dup) => (
                  <div
                    key={dup.voucherNumber}
                    className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-200 text-xs">
                          {dup.voucherNumber} — {dup.partyName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Date: {dup.voucherDate} | Type: {dup.voucherType}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-slate-100 block">
                          {formatCurrency(dup.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            dup.confidenceLevel === 'High'
                              ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                              : 'bg-amber-950 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          Confidence: {dup.confidenceLevel}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-800/80">
                      {dup.matchingCriteriaSummary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: BUSINESS RULE ENGINE */}
        {activeTab === 'Business Rule Engine' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#1E293B] p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Configurable Business Rules</h3>
                <p className="text-xs text-slate-400">
                  Define automated condition triggers across Receivables, GST, Inventory, Expenses & Sales
                </p>
              </div>

              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Create Business Rule</span>
              </button>
            </div>

            {/* Rules List */}
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.ruleId}
                  className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {rule.ruleId}
                        </span>
                        <span className="text-sm font-bold text-slate-100">{rule.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            rule.severity === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                              : rule.severity === 'High'
                              ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                              : 'bg-sky-950 text-sky-300 border-sky-800/60'
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right text-[11px] font-mono text-slate-400">
                        <div>Scope: {rule.scope}</div>
                        <div>Triggered: {rule.triggeredCount} times</div>
                      </div>
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${
                          rule.enabled
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Conditions Logic Box */}
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1">
                    <span className="text-slate-500 font-bold">WHEN:</span>
                    {rule.conditions.map((cond, cIdx) => (
                      <div key={cIdx} className="text-slate-300 ml-4">
                        {cIdx > 0 && <span className="text-emerald-400 mr-2">{rule.logicalOperator}</span>}
                        <span className="text-sky-300">{cond.field}</span>{' '}
                        <span className="text-amber-300">{cond.operator}</span>{' '}
                        <span className="text-emerald-300">{cond.value}</span>{' '}
                        <span className="text-slate-500 text-[10px]">({cond.valueType})</span>
                      </div>
                    ))}
                    <div className="text-slate-400 ml-4 pt-1">
                      <span className="text-slate-500 font-bold">THEN ACTION:</span>{' '}
                      <span className="text-slate-200">{rule.actionType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: SEMANTIC MODEL */}
        {activeTab === 'Semantic Model' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4">
              <h3 className="text-sm font-bold text-slate-100">Accounting Semantic Layer Mapping</h3>
              <p className="text-xs text-slate-400">
                Maps 23 core accounting concepts to actual TallyPrime XML/ODBC schema fields discovered dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {semanticModel.map((item) => (
                <div
                  key={item.semanticConcept}
                  className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">{item.semanticConcept}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        item.status === 'Discovered'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                          : item.status === 'Mapped'
                          ? 'bg-sky-950 text-sky-300 border-sky-700/50'
                          : 'bg-rose-950 text-rose-300 border-rose-700/50'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-400">
                    <div>Field: <span className="text-slate-300">{item.discoveredTallyField || 'Not available in schema'}</span></div>
                    <div>Table: <span className="text-slate-300">{item.tallyTableOrObject}</span></div>
                    {item.aliasUsed && (
                      <div className="text-sky-400 text-[10px]">Alias: {item.aliasUsed}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Calculation Transparency Modal */}
      {activeKpiCalculation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#1E293B] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {activeKpiCalculation.title} — Calculation Transparency
                </h3>
              </div>
              <button
                onClick={() => setActiveKpiCalculation(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-slate-400 block mb-1">Mathematical Formula:</strong>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-400">
                  {activeKpiCalculation.formulaDisplay}
                </div>
              </div>

              <div>
                <strong className="text-slate-400 block mb-1">Input Components:</strong>
                <div className="space-y-1 bg-slate-900 p-2.5 rounded border border-slate-800 font-mono">
                  {Object.entries(activeKpiCalculation.inputComponents).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-300">{key}:</span>
                      <span className="text-slate-100 font-bold">{formatCurrency(typeof val === 'number' ? val : Number(val) || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-slate-400 block mb-1">Accounting Justification:</strong>
                <p className="text-slate-300 leading-relaxed">
                  {activeKpiCalculation.accountingJustification}
                </p>
              </div>

              <div>
                <strong className="text-slate-400 block mb-1">Tally Source Fields Discovered:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {activeKpiCalculation.tallySourceFieldsDiscovered.map((fld) => (
                    <span
                      key={fld}
                      className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-sky-300 border border-slate-700"
                    >
                      {fld}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveKpiCalculation(null)}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Detail Drill-down Modal */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#1E293B] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                Reconciliation Audit Drill-down
              </h3>
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-mono bg-slate-900 p-2.5 rounded border border-slate-800">
                <span>Invoice: <strong>{selectedDiscrepancy.invoiceNumber}</strong></span>
                <span>Date: {selectedDiscrepancy.invoiceDate}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Party Name:</span>
                  <span className="font-semibold text-slate-200">{selectedDiscrepancy.partyName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Tally Recorded Taxable:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(selectedDiscrepancy.tallyTaxableValue)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">External GSTR-2B Taxable:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(selectedDiscrepancy.externalTaxableValue)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Taxable Discrepancy:</span>
                  <span className="font-mono text-rose-400 font-bold">{formatCurrency(selectedDiscrepancy.taxableDifference)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Tax Discrepancy:</span>
                  <span className="font-mono text-rose-400 font-bold">{formatCurrency(selectedDiscrepancy.taxDifference)}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-amber-950/20 border border-amber-700/40 text-amber-200">
                <strong>Recommended Review Action:</strong> {selectedDiscrepancy.matchReason}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Rule Builder Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-[#1E293B] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Visual Business Rule Builder</h3>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Scope</label>
                  <select
                    value={newRule.scope}
                    onChange={(e) => setNewRule({ ...newRule, scope: e.target.value as any })}
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-200 focus:outline-none"
                  >
                    <option value="Receivable">Receivable</option>
                    <option value="Sales">Sales</option>
                    <option value="GST">GST</option>
                    <option value="Expense">Expense</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Payable">Payable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-200 focus:outline-none"
                />
              </div>

              {/* Conditions Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Conditions Logic:
                </span>
                {newRule.conditions?.map((cond, cIdx) => (
                  <div key={cIdx} className="flex items-center space-x-2">
                    <span className="text-slate-400 font-mono text-[11px] w-12">
                      {cIdx === 0 ? 'WHEN' : 'AND'}
                    </span>
                    <input
                      type="text"
                      value={cond.field}
                      onChange={(e) => {
                        const updated = [...(newRule.conditions || [])];
                        updated[cIdx].field = e.target.value;
                        setNewRule({ ...newRule, conditions: updated });
                      }}
                      placeholder="Field"
                      className="w-1/3 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200"
                    />
                    <select
                      value={cond.operator}
                      onChange={(e) => {
                        const updated = [...(newRule.conditions || [])];
                        updated[cIdx].operator = e.target.value as any;
                        setNewRule({ ...newRule, conditions: updated });
                      }}
                      className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200"
                    >
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">==</option>
                      <option value="!=">!=</option>
                    </select>
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) => {
                        const updated = [...(newRule.conditions || [])];
                        updated[cIdx].value = e.target.value;
                        setNewRule({ ...newRule, conditions: updated });
                      }}
                      placeholder="Value"
                      className="w-1/3 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Action Type</label>
                  <select
                    value={newRule.actionType}
                    onChange={(e) => setNewRule({ ...newRule, actionType: e.target.value as any })}
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-200"
                  >
                    <option value="Flag">Flag</option>
                    <option value="Highlight">Highlight</option>
                    <option value="Include in Dashboard">Include in Dashboard</option>
                    <option value="Include in Report">Include in Report</option>
                  </select>
                </div>
              </div>

              {/* Simulation Result Box */}
              {ruleTestResult && (
                <div className="rounded bg-slate-900 p-3 border border-emerald-500/40 text-[11px] text-emerald-300 space-y-1">
                  <div className="font-bold">✓ Test Simulation Passed</div>
                  <div>Records Evaluated: {ruleTestResult.recordsEvaluated}</div>
                  <div>Records Affected: {ruleTestResult.recordsAffected} records match criteria</div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between">
              <button
                onClick={handleTestRule}
                disabled={isTestingRule}
                className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-400 flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestingRule ? 'Testing...' : 'Run Test'}</span>
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm"
                >
                  Save & Enable Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
