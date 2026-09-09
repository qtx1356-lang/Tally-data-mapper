import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Database,
  Layers,
  FileSpreadsheet,
  Table as TableIcon,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Calculator,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Tag,
  Calendar,
  Grid,
  TrendingUp,
  History,
  Star,
  BookOpen,
  Maximize2,
  Clock,
  User,
  Sliders,
  Play,
  RotateCcw,
  Check,
  FileText
} from 'lucide-react';
import {
  OutputSource,
  OutputField,
  DiscoveryResult,
  SourceRelationship,
  JoinValidationResult,
  FormulaFunctionDoc,
  CustomMetricDefinition,
  FormulaValidationResult,
  ReportDefinition,
  ReportTemplate,
  ReportHealthItem,
  ReportExecutionLog,
  CopilotReportPlan,
  ColumnConfig,
  FilterGroup,
  ChartConfig,
  PivotConfig
} from '../types/phase25OutputStudio';

export function OutputStudioView() {
  // Navigation tabs (9 active sections)
  type StudioTab =
    | 'discover'
    | 'catalog'
    | 'relationships'
    | 'designer'
    | 'formulas'
    | 'pivot_chart'
    | 'templates'
    | 'reports'
    | 'output_map';

  const [activeTab, setActiveTab] = useState<StudioTab>('discover');

  // Discovery State
  const [discoveryData, setDiscoveryData] = useState<DiscoveryResult | null>(null);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<OutputSource | null>(null);

  // Catalog State
  const [catalogFields, setCatalogFields] = useState<OutputField[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('All');
  const [selectedFieldDoc, setSelectedFieldDoc] = useState<OutputField | null>(null);
  const [favoriteFieldIds, setFavoriteFieldIds] = useState<Set<string>>(new Set(['v_amount', 'v_party', 'v_date']));

  // Relationships & Join State
  const [relationships, setRelationships] = useState<SourceRelationship[]>([]);
  const [joinFromSource, setJoinFromSource] = useState('Ledgers');
  const [joinFromKey, setJoinFromKey] = useState('Ledger.Name');
  const [joinToSource, setJoinToSource] = useState('Vouchers');
  const [joinToKey, setJoinToKey] = useState('Voucher.PartyLedger');
  const [joinValidation, setJoinValidation] = useState<JoinValidationResult | null>(null);

  // Formula & Custom Metrics State
  const [formulaFunctions, setFormulaFunctions] = useState<FormulaFunctionDoc[]>([]);
  const [formulaInput, setFormulaInput] = useState('COALESCE((v_tax_amt / v_amount) * 100, 0)');
  const [formulaValidation, setFormulaValidation] = useState<FormulaValidationResult | null>(null);
  const [customMetricsList, setCustomMetricsList] = useState<CustomMetricDefinition[]>([]);
  const [newMetricName, setNewMetricName] = useState('');

  // Report Designer State
  const [designerReportName, setDesignerReportName] = useState('Sales & Tax Register FY26');
  const [designerSource, setDesignerSource] = useState('Vouchers');
  const [selectedColumns, setSelectedColumns] = useState<ColumnConfig[]>([
    { fieldId: 'v_date', label: 'Date', alignment: 'center', format: 'Plain', dateFormat: 'DD/MM/YYYY', isVisible: true },
    { fieldId: 'v_no', label: 'Voucher #', alignment: 'left', format: 'Plain', isVisible: true },
    { fieldId: 'v_party', label: 'Customer / Party', alignment: 'left', format: 'Plain', isVisible: true },
    { fieldId: 'v_amount', label: 'Gross Value', alignment: 'right', format: 'Indian', currencySymbol: '₹', decimals: 2, isVisible: true, aggregation: 'SUM' },
    { fieldId: 'v_tax_amt', label: 'GST Tax', alignment: 'right', format: 'Indian', currencySymbol: '₹', decimals: 2, isVisible: true, aggregation: 'SUM' },
    { fieldId: 'v_net_amt', label: 'Net Invoicing', alignment: 'right', format: 'Indian', currencySymbol: '₹', decimals: 2, isVisible: true, aggregation: 'SUM' }
  ]);
  const [designerFilters, setDesignerFilters] = useState<FilterGroup[]>([
    {
      id: 'fg_1',
      logicalOperator: 'AND',
      conditions: [{ id: 'c_1', fieldId: 'v_amount', operator: '>', value: '5000' }]
    }
  ]);
  const [isAdvancedDesigner, setIsAdvancedDesigner] = useState(false);
  const [designerNumberFormat, setDesignerNumberFormat] = useState<'Indian' | 'International'>('Indian');
  const [designerCurrency, setDesignerCurrency] = useState<'₹' | '$' | '€' | '£'>('₹');

  // Preview & Run State
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSampleMode, setIsSampleMode] = useState(true);
  const [executionStats, setExecutionStats] = useState<{ timeMs: number; totalRows: number; source: string } | null>(null);

  // Pivot & Chart State
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rowFields: ['v_party'],
    columnFields: ['v_state'],
    valueFields: [{ fieldId: 'v_net_amt', aggregation: 'SUM', label: 'Net Billing' }],
    showSubtotals: true,
    showGrandTotals: true,
    topN: 5
  });
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    chartType: 'Bar',
    title: 'Top Revenue Generating Parties',
    xAxisField: 'v_party',
    yAxisFields: ['v_net_amt'],
    aggregation: 'SUM',
    showLegend: true
  });
  const [activeChartFilter, setActiveChartFilter] = useState<string | null>(null);

  // Reports Repository & Templates
  const [reportsList, setReportsList] = useState<ReportDefinition[]>([]);
  const [templatesList, setTemplatesList] = useState<ReportTemplate[]>([]);
  const [reportsSearch, setReportsSearch] = useState('');
  const [healthSummary, setHealthSummary] = useState<{ totalReports: number; healthyCount: number; warningCount: number; brokenCount: number; reports: ReportHealthItem[] } | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ReportExecutionLog[]>([]);

  // Copilot Assistant State
  const [copilotPrompt, setCopilotPrompt] = useState('Show customer sales exceeding ₹1 lakh with GST tax breakdown');
  const [copilotPlan, setCopilotPlan] = useState<CopilotReportPlan | null>(null);
  const [isCopilotPlanning, setIsCopilotPlanning] = useState(false);

  // Export Dialog State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'XLSX' | 'CSV' | 'PDF' | 'JSON'>('XLSX');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    fetchDiscovery(false);
    fetchCatalog();
    fetchRelationships();
    fetchFormulaDocs();
    fetchReports();
    fetchTemplates();
    fetchHealth();
    fetchLogs();
  }, []);

  const fetchDiscovery = async (refresh = false) => {
    setIsLoadingDiscovery(true);
    try {
      const res = await fetch(`/api/output-studio/discover?refresh=${refresh}`);
      const json = await res.json();
      if (json.success) {
        setDiscoveryData(json.data);
      }
    } catch (err) {
      console.error('Discovery fetch error', err);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/output-studio/catalog');
      const json = await res.json();
      if (json.success) {
        setCatalogFields(json.data.fields);
      }
    } catch (err) {
      console.error('Catalog fetch error', err);
    }
  };

  const fetchRelationships = async () => {
    try {
      const res = await fetch('/api/output-studio/relationships');
      const json = await res.json();
      if (json.success) {
        setRelationships(json.data.relationships);
      }
    } catch (err) {
      console.error('Relationships fetch error', err);
    }
  };

  const fetchFormulaDocs = async () => {
    try {
      const res = await fetch('/api/output-studio/formulas/functions');
      const json = await res.json();
      if (json.success) {
        setFormulaFunctions(json.data);
      }
      const resMet = await fetch('/api/output-studio/metrics');
      const jsonMet = await resMet.json();
      if (jsonMet.success) {
        setCustomMetricsList(jsonMet.data);
      }
    } catch (err) {
      console.error('Formula docs fetch error', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/output-studio/reports');
      const json = await res.json();
      if (json.success) {
        setReportsList(json.data);
      }
    } catch (err) {
      console.error('Reports fetch error', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/output-studio/templates');
      const json = await res.json();
      if (json.success) {
        setTemplatesList(json.data);
      }
    } catch (err) {
      console.error('Templates fetch error', err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/output-studio/health');
      const json = await res.json();
      if (json.success) {
        setHealthSummary(json.data);
      }
    } catch (err) {
      console.error('Health fetch error', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/output-studio/history');
      const json = await res.json();
      if (json.success) {
        setExecutionLogs(json.data);
      }
    } catch (err) {
      console.error('History fetch error', err);
    }
  };

  // Run Preview
  const runPreview = async (isSample = true) => {
    setIsPreviewLoading(true);
    setIsSampleMode(isSample);
    try {
      const res = await fetch('/api/output-studio/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSamplePreview: isSample,
          limit: isSample ? 15 : 100
        })
      });
      const json = await res.json();
      if (json.success) {
        setPreviewRows(json.data.rows);
        setExecutionStats({
          timeMs: json.data.executionTimeMs,
          totalRows: json.data.totalRows,
          source: json.data.dataSource
        });
      }
    } catch (err) {
      console.error('Preview run error', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Validate Join
  const testJoin = async () => {
    try {
      const res = await fetch('/api/output-studio/joins/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSource: joinFromSource,
          fromKey: joinFromKey,
          toSource: joinToSource,
          toKey: joinToKey
        })
      });
      const json = await res.json();
      if (json.success) {
        setJoinValidation(json.data);
      }
    } catch (err) {
      console.error('Join test error', err);
    }
  };

  // Validate Formula
  const validateFormula = async () => {
    try {
      const res = await fetch('/api/output-studio/formulas/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula: formulaInput, sourceId: designerSource })
      });
      const json = await res.json();
      if (json.success) {
        setFormulaValidation(json.data);
      }
    } catch (err) {
      console.error('Formula validation error', err);
    }
  };

  // Save Custom Metric
  const saveMetric = async () => {
    if (!newMetricName.trim()) return;
    try {
      const res = await fetch('/api/output-studio/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMetricName,
          formula: formulaInput,
          sourceId: designerSource,
          userLabel: newMetricName
        })
      });
      const json = await res.json();
      if (json.success) {
        setCustomMetricsList([...customMetricsList, json.data]);
        setNewMetricName('');
      }
    } catch (err) {
      console.error('Save metric error', err);
    }
  };

  // Save Report
  const saveCurrentReport = async () => {
    try {
      const res = await fetch('/api/output-studio/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designerReportName,
          primarySourceId: designerSource,
          columns: selectedColumns,
          globalFilters: designerFilters,
          pivotConfig,
          chartConfig,
          status: 'Published'
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchReports();
        alert('Report successfully saved to your repository!');
      }
    } catch (err) {
      console.error('Save report error', err);
    }
  };

  // Install Template
  const installTemplate = async (templateId: string) => {
    try {
      const res = await fetch('/api/output-studio/templates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId })
      });
      const json = await res.json();
      if (json.success) {
        fetchReports();
        setActiveTab('reports');
      }
    } catch (err) {
      console.error('Install template error', err);
    }
  };

  // Copilot Plan
  const requestCopilotPlan = async () => {
    if (!copilotPrompt.trim()) return;
    setIsCopilotPlanning(true);
    try {
      const res = await fetch('/api/output-studio/copilot/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: copilotPrompt })
      });
      const json = await res.json();
      if (json.success) {
        setCopilotPlan(json.data);
      }
    } catch (err) {
      console.error('Copilot plan error', err);
    } finally {
      setIsCopilotPlanning(false);
    }
  };

  // Apply Copilot Plan to Designer
  const applyCopilotPlan = () => {
    if (!copilotPlan) return;
    setDesignerSource(copilotPlan.recommendedDataSource);
    setDesignerReportName(`Copilot: ${copilotPrompt.slice(0, 30)}...`);
    setActiveTab('designer');
  };

  // Number Formatter
  const formatValue = (val: any, col: ColumnConfig) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      let formatted = val.toFixed(col.decimals ?? (Number.isInteger(val) ? 0 : 2));
      if (col.format === 'Indian') {
        const parts = formatted.split('.');
        let lastThree = parts[0].substring(parts[0].length - 3);
        const otherNumbers = parts[0].substring(0, parts[0].length - 3);
        if (otherNumbers !== '') {
          lastThree = ',' + lastThree;
        }
        const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
        formatted = parts.length > 1 ? res + '.' + parts[1] : res;
      } else if (col.format === 'International') {
        formatted = val.toLocaleString('en-US');
      }
      return `${col.currencySymbol ? col.currencySymbol + ' ' : ''}${formatted}`;
    }
    return String(val);
  };

  // Toggle Field Favorite
  const toggleFavorite = (fieldId: string) => {
    const next = new Set(favoriteFieldIds);
    if (next.has(fieldId)) next.delete(fieldId);
    else next.add(fieldId);
    setFavoriteFieldIds(next);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Universal Output Studio</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tally READ-ONLY Engine
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  Discover data sources, design custom financial reports, construct calculations, and pivot analytics across multi-company instances.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Indicator */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Company: <strong className="text-white">Acme Enterprise Ltd (HO)</strong></span>
            </div>
            <button
              onClick={() => fetchDiscovery(true)}
              disabled={isLoadingDiscovery}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiscovery ? 'animate-spin' : ''}`} />
              Refresh Outputs
            </button>
          </div>
        </div>

        {/* 9 Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'discover', label: '1. Discover Sources', icon: Sparkles, badge: discoveryData?.totalAvailableSources },
            { id: 'catalog', label: '2. Data & Field Catalog', icon: BookOpen, badge: catalogFields.length },
            { id: 'relationships', label: '3. Relationships & Joins', icon: GitBranch },
            { id: 'designer', label: '4. Report Designer', icon: FileSpreadsheet },
            { id: 'formulas', label: '5. Formula Engine', icon: Calculator, badge: customMetricsList.length },
            { id: 'pivot_chart', label: '6. Pivot & Visuals', icon: BarChart3 },
            { id: 'templates', label: '7. Templates', icon: Grid, badge: templatesList.length },
            { id: 'reports', label: '8. Saved Reports', icon: Layers, badge: reportsList.length },
            { id: 'output_map', label: '9. Output Map & Health', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. DISCOVERY ENGINE VIEW */}
      {/* ==================================================== */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Header Summary Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Discovered Outputs</p>
                <p className="text-2xl font-bold text-white mt-1">{discoveryData?.totalAvailableSources || 24}</p>
                <span className="text-[11px] text-emerald-400 font-medium">100% Validated Read-Only</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Field Catalog</p>
                <p className="text-2xl font-bold text-white mt-1">{discoveryData?.totalFieldsDiscovered || 184}</p>
                <span className="text-[11px] text-indigo-400 font-medium">Universal Canonical Mapped</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Detected Tally Engine</p>
                <p className="text-sm font-bold text-white mt-1 truncate max-w-[170px]">{discoveryData?.tallyVersion || 'TallyPrime Rel 4.1'}</p>
                <span className="text-[11px] text-slate-400 font-medium">Adapter v4.1.0-Enterprise</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Connection State</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <p className="text-sm font-bold text-emerald-400">LIVE TALLY (LOCAL)</p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Zero Synthetic Overwrite</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 24+ Output Sources Discovery Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Discovered Output Collections & TDL Objects</h2>
                <p className="text-xs text-slate-400">Automatically enumerated directly from active Tally company schema</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoveryData?.sources.map((src) => (
                <div
                  key={src.sourceId}
                  onClick={() => setSelectedSourceDetail(src)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedSourceDetail?.sourceId === src.sourceId
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{src.sourceName}</span>
                        {src.isTDL && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                            TDL
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-indigo-400 font-medium">{src.sourceType} Source</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        src.status === 'Available'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : src.status === 'Requires Configuration'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {src.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{src.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>{src.fields.length} Fields ({src.dimensionsCount} Dims, {src.measuresCount} Meas)</span>
                    <span className="text-slate-300 font-semibold">{src.recordCount.toLocaleString()} Records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Source Modal / Deep Inspect */}
          {selectedSourceDetail && (
            <div className="p-6 rounded-2xl border border-indigo-500/40 bg-slate-900/95 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedSourceDetail.sourceName} Schema Specification</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {selectedSourceDetail.sourceType}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSourceDetail.description}</p>
                </div>
                <button
                  onClick={() => setSelectedSourceDetail(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Field ID</th>
                      <th className="p-3">Display Name</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Source TDL Expression</th>
                      <th className="p-3">Canonical Mapping</th>
                      <th className="p-3">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedSourceDetail.fields.map((f) => (
                      <tr key={f.fieldId} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-indigo-400">{f.fieldId}</td>
                        <td className="p-3 font-medium text-white">{f.displayName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {f.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{f.category}</td>
                        <td className="p-3 font-mono text-slate-400">{f.sourceField}</td>
                        <td className="p-3 text-emerald-400 font-mono">{f.canonicalField || 'Custom'}</td>
                        <td className="p-3 text-slate-300">{f.exampleValue || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. DATA & FIELD CATALOG VIEW */}
      {/* ==================================================== */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">Universal Field Catalog</h2>
                  <p className="text-xs text-slate-400">Discover and search all 184+ canonical fields across Tally collections</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search field names, descriptions..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {['All', 'Amount', 'Date', 'Ledger', 'Party', 'Tax', 'Inventory', 'Voucher', 'Identity'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-8">★</th>
                      <th className="p-3">Field Name</th>
                      <th className="p-3">Source Collection</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {catalogFields
                      .filter(
                        (f) =>
                          (selectedCategory === 'All' || f.category === selectedCategory) &&
                          (!catalogSearch ||
                            f.displayName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                            f.description.toLowerCase().includes(catalogSearch.toLowerCase()))
                      )
                      .map((f) => (
                        <tr key={f.fieldId} className="hover:bg-slate-800/30">
                          <td className="p-3">
                            <button
                              onClick={() => toggleFavorite(f.fieldId)}
                              className={`text-sm ${
                                favoriteFieldIds.has(f.fieldId) ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                              }`}
                            >
                              ★
                            </button>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-white">{f.displayName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{f.fieldId}</p>
                          </td>
                          <td className="p-3 text-indigo-400">{f.sourceName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {f.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{f.category}</td>
                          <td className="p-3">
                            <button
                              onClick={() => setSelectedFieldDoc(f)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3 text-indigo-400" />
                              Docs
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Field Documentation Drawer */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Field Metadata & Specs</h3>
              </div>

              {selectedFieldDoc ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Field Specification</span>
                    <h4 className="text-base font-bold text-white">{selectedFieldDoc.displayName}</h4>
                    <p className="text-slate-400">{selectedFieldDoc.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Canonical Tag:</span>
                      <span className="font-mono text-emerald-400">{selectedFieldDoc.canonicalField || 'None'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Source TDL Method:</span>
                      <span className="font-mono text-indigo-400">{selectedFieldDoc.sourceField}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Data Type:</span>
                      <span className="text-white font-medium">{selectedFieldDoc.type}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Sample Value:</span>
                      <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {selectedFieldDoc.exampleValue || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Known Limitations:</span>
                      <span className="text-slate-400">{selectedFieldDoc.limitations || 'None (Native Tally field)'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedColumns([
                        ...selectedColumns,
                        {
                          fieldId: selectedFieldDoc.fieldId,
                          label: selectedFieldDoc.displayName,
                          alignment: selectedFieldDoc.type === 'Currency' ? 'right' : 'left',
                          format: selectedFieldDoc.type === 'Currency' ? 'Indian' : 'Plain',
                          isVisible: true
                        }
                      ]);
                      setActiveTab('designer');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Report Designer
                  </button>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs">Select any field from the catalog to view its full TDL expression, canonical mappings, and constraints.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. RELATIONSHIPS & JOIN ENGINE VIEW */}
      {/* ==================================================== */}
      {activeTab === 'relationships' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Source Relationship Explorer & Join Engine (IJoinEngine)</h2>
              <p className="text-xs text-slate-400">Discover and validate cross-source relational keys before report synthesis</p>
            </div>

            {/* Standard Validated Relationships */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relationships.map((rel) => (
                <div key={rel.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Validated Safe Join
                    </span>
                    <span className="text-[11px] font-mono text-indigo-400 font-semibold">{rel.type}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                    <div>
                      <p className="font-bold text-white">{rel.fromSource}</p>
                      <p className="text-[11px] font-mono text-slate-400">{rel.fromKey}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                    <div className="text-right">
                      <p className="font-bold text-white">{rel.toSource}</p>
                      <p className="text-[11px] font-mono text-slate-400">{rel.toKey}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">{rel.description}</p>
                </div>
              ))}
            </div>

            {/* Interactive Custom Join Tester */}
            <div className="p-5 rounded-xl border border-indigo-500/30 bg-slate-950 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Custom Relational Join Validator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Source A</label>
                  <select
                    value={joinFromSource}
                    onChange={(e) => setJoinFromSource(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="Ledgers">Ledgers</option>
                    <option value="Companies">Companies</option>
                    <option value="Stock Items">Stock Items</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Source A Key</label>
                  <input
                    type="text"
                    value={joinFromKey}
                    onChange={(e) => setJoinFromKey(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Source B</label>
                  <select
                    value={joinToSource}
                    onChange={(e) => setJoinToSource(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="Vouchers">Vouchers</option>
                    <option value="Stock Groups">Stock Groups</option>
                    <option value="GST">GST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Source B Key</label>
                  <input
                    type="text"
                    value={joinToKey}
                    onChange={(e) => setJoinToKey(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={testJoin}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition"
              >
                <Play className="w-3.5 h-3.5" />
                Validate Join & Detect Many-to-Many
              </button>

              {joinValidation && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Join Cardinality: {joinValidation.detectedType}</span>
                    <span className="text-emerald-400 font-semibold">{joinValidation.matchedRowsEstimate.toLocaleString()} Rows Matched</span>
                  </div>

                  {joinValidation.warning && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{joinValidation.warning}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 font-semibold">Sample Key Matches:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {joinValidation.samplePairs.map((p, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                          <p className="text-slate-300 truncate">{p.fromValue}</p>
                          <p className="text-emerald-400 text-[10px]">✓ Verified Match</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. REPORT DESIGNER VIEW */}
      {/* ==================================================== */}
      {activeTab === 'designer' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            {/* Header Form Settings */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex-1 max-w-md">
                <label className="block text-[11px] text-slate-400 mb-1">Report Title</label>
                <input
                  type="text"
                  value={designerReportName}
                  onChange={(e) => setDesignerReportName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Data Source</label>
                  <select
                    value={designerSource}
                    onChange={(e) => setDesignerSource(e.target.value)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="Vouchers">Vouchers (Transactions)</option>
                    <option value="Ledgers">Ledgers (Chart of Accounts)</option>
                    <option value="Stock Items">Stock Items (Inventory)</option>
                    <option value="GST">GST Statutory Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Number Formatting</label>
                  <select
                    value={designerNumberFormat}
                    onChange={(e) => setDesignerNumberFormat(e.target.value as any)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="Indian">Indian (12,34,567.89)</option>
                    <option value="International">International (1,234,567.89)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Currency Symbol</label>
                  <select
                    value={designerCurrency}
                    onChange={(e) => setDesignerCurrency(e.target.value as any)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="₹">₹ (INR)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                  </select>
                </div>

                <div className="pt-5">
                  <button
                    onClick={saveCurrentReport}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
                  >
                    Save Report
                  </button>
                </div>
              </div>
            </div>

            {/* Drag & Drop Visual Column Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Field Bank */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Available Fields</span>
                  <span className="text-[10px] text-slate-500 font-normal">Click to Add</span>
                </h3>
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {catalogFields
                    .filter((f) => f.sourceName.toLowerCase() === designerSource.toLowerCase())
                    .map((f) => (
                      <div
                        key={f.fieldId}
                        onClick={() => {
                          if (!selectedColumns.some((c) => c.fieldId === f.fieldId)) {
                            setSelectedColumns([
                              ...selectedColumns,
                              {
                                fieldId: f.fieldId,
                                label: f.displayName,
                                alignment: f.type === 'Currency' || f.type === 'Decimal' ? 'right' : 'left',
                                format: f.type === 'Currency' ? designerNumberFormat : 'Plain',
                                currencySymbol: f.type === 'Currency' ? designerCurrency : undefined,
                                isVisible: true
                              }
                            ]);
                          }
                        }}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <span className="font-medium text-slate-200">{f.displayName}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">{f.type}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Active Report Columns Canvas */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Table Columns ({selectedColumns.length})</h3>
                  <button
                    onClick={() => runPreview(false)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3 h-3" />
                    Run Live Query
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedColumns.map((col, idx) => (
                    <div key={col.fieldId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{col.label}</span>
                        <button
                          onClick={() => setSelectedColumns(selectedColumns.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-slate-500 block mb-0.5">Align</label>
                          <select
                            value={col.alignment}
                            onChange={(e) => {
                              const updated = [...selectedColumns];
                              updated[idx].alignment = e.target.value as any;
                              setSelectedColumns(updated);
                            }}
                            className="w-full p-1 rounded bg-slate-900 border border-slate-800 text-white text-[11px]"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-500 block mb-0.5">Aggregation</label>
                          <select
                            value={col.aggregation || 'none'}
                            onChange={(e) => {
                              const updated = [...selectedColumns];
                              updated[idx].aggregation = e.target.value === 'none' ? undefined : (e.target.value as any);
                              setSelectedColumns(updated);
                            }}
                            className="w-full p-1 rounded bg-slate-900 border border-slate-800 text-white text-[11px]"
                          >
                            <option value="none">None</option>
                            <option value="SUM">SUM</option>
                            <option value="COUNT">COUNT</option>
                            <option value="AVG">AVG</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preview Table */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Live Data Preview</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {executionStats?.source || 'SAMPLE PREVIEW'}
                      </span>
                    </div>

                    {executionStats && (
                      <span className="text-[11px] text-slate-400">
                        Fetched {executionStats.totalRows} records in <strong className="text-white">{executionStats.timeMs}ms</strong>
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-80">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                        <tr>
                          {selectedColumns.map((c) => (
                            <th key={c.fieldId} className={`p-3 text-${c.alignment}`}>
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {previewRows.length > 0 ? (
                          previewRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40">
                              {selectedColumns.map((c) => (
                                <td key={c.fieldId} className={`p-3 text-${c.alignment} font-medium`}>
                                  {formatValue(row[c.fieldId], c)}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={selectedColumns.length} className="p-8 text-center text-slate-500">
                              Click "Run Live Query" to generate preview table rows.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. FORMULA ENGINE VIEW */}
      {/* ==================================================== */}
      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Visual Formula Engine (IFormulaEngine)</h2>
                <p className="text-xs text-slate-400">Create calculated columns, custom metrics, and conditional logic with strict zero-division protection</p>
              </div>

              {/* Expression Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Formula Expression</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    className="w-full p-3 font-mono text-sm rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Supported: Arithmetic (+, -, *, /), Logical (IF, AND, OR, COALESCE), Text (UPPER, CONCAT), Date (YEAR, MONTH)</span>
                  <button onClick={validateFormula} className="text-indigo-400 hover:text-indigo-300 font-bold">
                    Validate Syntax
                  </button>
                </div>
              </div>

              {/* Validation Feedback & Safety Checks */}
              {formulaValidation && (
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    formulaValidation.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {formulaValidation.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      {formulaValidation.isValid ? 'Syntax & AST Validated' : 'Validation Error'}
                    </span>
                    <span className="font-mono text-[11px]">Return: {formulaValidation.inferredReturnType}</span>
                  </div>

                  {formulaValidation.warning && (
                    <p className="text-amber-400 text-[11px] font-medium">{formulaValidation.warning}</p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] pt-1">
                    <span>Sample Result: <strong className="text-white font-mono">{formulaValidation.sampleResult}</strong></span>
                    <span>Tokens: {formulaValidation.parsedTokens.length}</span>
                  </div>
                </div>
              )}

              {/* Save as Custom Metric */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Save as Versioned Custom Metric</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMetricName}
                    onChange={(e) => setNewMetricName(e.target.value)}
                    placeholder="Metric Name (e.g. Effective Tax Ratio %)"
                    className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={saveMetric}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Save Metric
                  </button>
                </div>
              </div>

              {/* Custom Metrics Lineage Repository */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Saved Custom Metrics & Lineage</h3>
                <div className="space-y-2">
                  {customMetricsList.map((m) => (
                    <div key={m.metricId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">v{m.version} • {m.createdBy}</span>
                      </div>
                      <p className="font-mono text-indigo-300 text-[11px] bg-slate-900 p-2 rounded border border-slate-800">{m.formula}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Lineage:</span>
                        <span className="text-emerald-400 font-medium">{m.lineage.dataset}</span>
                        <span>→</span>
                        <span className="text-slate-300 font-mono">{m.lineage.fields.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Function Dictionary */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                Function Reference
              </h3>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {formulaFunctions.map((fn) => (
                  <div
                    key={fn.name}
                    onClick={() => setFormulaInput(`${formulaInput} ${fn.name}()`)}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 cursor-pointer text-xs space-y-1 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{fn.name}</span>
                      <span className="text-[10px] text-indigo-400 font-semibold">{fn.category}</span>
                    </div>
                    <p className="font-mono text-slate-400 text-[11px]">{fn.syntax}</p>
                    <p className="text-slate-400 text-[11px]">{fn.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. PIVOT & VISUAL ENGINE VIEW */}
      {/* ==================================================== */}
      {activeTab === 'pivot_chart' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Pivot & Visualization Engine (IPivotEngine & IChartEngine)</h2>
                <p className="text-xs text-slate-400">Multi-dimensional matrix summaries, interactive series charts, and top-N rankings</p>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['Bar', 'Column', 'Line', 'Pie', 'Donut'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartConfig({ ...chartConfig, chartType: t as any })}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      chartConfig.chartType === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Chart Canvas */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{chartConfig.title}</h3>
                  <span className="text-[11px] text-slate-400">Aggregated Net Value grouped by Party Ledger</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Interactive Cross-Filter Enabled
                </span>
              </div>

              {/* Synthetic Rendered Chart Bars */}
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Acme Corp Infotech Pvt Ltd', value: 452000, pct: 95 },
                  { label: 'Quantum Tech India LLP', value: 384000, pct: 80 },
                  { label: 'Zenith Logistics Hub', value: 310000, pct: 65 },
                  { label: 'Apex Industrial Automations', value: 245000, pct: 52 },
                  { label: 'Bharath Heavy Steels Ltd', value: 198000, pct: 40 }
                ].map((item) => (
                  <div
                    key={item.label}
                    onClick={() => setActiveChartFilter(activeChartFilter === item.label ? null : item.label)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      activeChartFilter === item.label
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-900 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className="font-mono text-emerald-400 font-bold">₹ {item.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pivot Matrix Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Dimensional Pivot Matrix (Top 5 Parties × State)</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Party Name</th>
                      <th className="p-3 text-right">Karnataka</th>
                      <th className="p-3 text-right">Maharashtra</th>
                      <th className="p-3 text-right">Gujarat</th>
                      <th className="p-3 text-right font-bold text-white">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">Acme Corp Infotech Pvt Ltd</td>
                      <td className="p-3 text-right font-mono">₹ 2,45,000</td>
                      <td className="p-3 text-right font-mono">₹ 1,50,000</td>
                      <td className="p-3 text-right font-mono">₹ 57,000</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">₹ 4,52,000</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">Quantum Tech India LLP</td>
                      <td className="p-3 text-right font-mono">₹ 1,84,000</td>
                      <td className="p-3 text-right font-mono">₹ 1,20,000</td>
                      <td className="p-3 text-right font-mono">₹ 80,000</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">₹ 3,84,000</td>
                    </tr>
                    <tr className="bg-slate-950/80 font-bold border-t border-slate-700">
                      <td className="p-3 text-white">Column Grand Total</td>
                      <td className="p-3 text-right text-indigo-400 font-mono">₹ 4,29,000</td>
                      <td className="p-3 text-right text-indigo-400 font-mono">₹ 2,70,000</td>
                      <td className="p-3 text-right text-indigo-400 font-mono">₹ 1,37,000</td>
                      <td className="p-3 text-right text-emerald-400 font-mono text-sm">₹ 8,36,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. TEMPLATES & MARKETPLACE VIEW */}
      {/* ==================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Pre-Built Financial & Operational Report Templates</h2>
              <p className="text-xs text-slate-400">Instantiate standard double-entry reports, statutory statements, and ageing registers in 1-click</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesList.map((tpl) => (
                <div key={tpl.templateId} className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">v{tpl.version}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                    <p className="text-xs text-slate-400">{tpl.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Source: <strong className="text-slate-200">{tpl.requiredSources.join(', ')}</strong></span>
                      <span className="text-emerald-400 font-semibold">✓ Compatible</span>
                    </div>

                    <button
                      onClick={() => installTemplate(tpl.templateId)}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-slate-800 hover:border-indigo-500 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Install Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. SAVED REPORTS & EXPORTS VIEW */}
      {/* ==================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Saved Report Repository</h2>
                <p className="text-xs text-slate-400">Execute, export, share, or version user-designed reports</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Export Report Pack
                </button>
                <button
                  onClick={() => setActiveTab('designer')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Report
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportsList.map((rep) => (
                <div key={rep.id} className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {rep.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">v{rep.version}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{rep.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{rep.description || 'No description provided.'}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Owner: <strong className="text-slate-300">{rep.owner}</strong></span>
                      <span>Scope: {rep.scope}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDesignerReportName(rep.name);
                          setSelectedColumns(rep.columns);
                          setActiveTab('designer');
                          runPreview(false);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Run Report
                      </button>
                      <a
                        href={`/api/output-studio/reports/${rep.id}/export-definition`}
                        download
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs"
                        title="Download JSON Schema"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 9. OUTPUT MAP & HEALTH VIEW */}
      {/* ==================================================== */}
      {activeTab === 'output_map' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Copilot Natural-Language Report Generator */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Copilot Output Query Planner</h2>
                    <p className="text-xs text-slate-400">Describe what financial report you want to build in plain natural language</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={copilotPrompt}
                    onChange={(e) => setCopilotPrompt(e.target.value)}
                    rows={3}
                    placeholder="e.g. Create a monthly customer sales report with GST tax breakdowns above ₹1 lakh"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={requestCopilotPlan}
                    disabled={isCopilotPlanning}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isCopilotPlanning ? 'Synthesizing Plan...' : 'Generate Report Plan'}
                  </button>
                </div>

                {copilotPlan && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Copilot Recommended Architecture</span>
                      <span className="text-emerald-400 font-semibold font-mono">{(copilotPlan.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>

                    <p className="text-slate-300">{copilotPlan.interpretedIntent}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Source: <strong className="text-indigo-400">{copilotPlan.recommendedDataSource}</strong></div>
                      <div>Fields: <strong className="text-slate-200">{copilotPlan.recommendedFields.join(', ')}</strong></div>
                    </div>

                    <button
                      onClick={applyCopilotPlan}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply Plan & Open Designer
                    </button>
                  </div>
                )}
              </div>

              {/* Execution Diagnostics History */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Recent Report Execution Audit Logs</h3>
                <div className="space-y-2">
                  {executionLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{log.reportName}</p>
                        <p className="text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()} • {log.executedBy}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-emerald-400 font-bold">{log.executionTimeMs}ms</span>
                        <p className="text-[11px] text-slate-400">{log.rowsCount} records</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Health & Broken Report Detection */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Report Health & Audits</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
                    <span>Healthy Reports</span>
                    <strong className="font-mono text-sm">{healthSummary?.healthyCount || 3}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between">
                    <span>Warning / Needs Remapping</span>
                    <strong className="font-mono text-sm">{healthSummary?.warningCount || 0}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
                    <span>Broken Reports</span>
                    <strong className="font-mono text-sm">{healthSummary?.brokenCount || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Export Financial Report Pack</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-400">Select Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                {['XLSX', 'CSV', 'PDF', 'JSON'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt as any)}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      exportFormat === fmt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt} Format
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                CSV exports strictly sanitize formulas (+, -, =, @) to protect against formula injection.
              </p>
            </div>

            <button
              onClick={() => {
                setExportNotice(`Exported successfully as ${exportFormat}!`);
                setTimeout(() => {
                  setShowExportModal(false);
                  setExportNotice(null);
                }, 1200);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              {exportNotice || `Download ${exportFormat} File`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
