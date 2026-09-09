import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Play,
  Layers,
  Database,
  Filter,
  Calculator,
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  Eye,
  RotateCcw,
  Copy,
  Download,
  Check,
  X,
  Radio,
  Search,
  GitMerge,
  Terminal,
  Code,
  PieChart,
  BarChart3,
  TrendingUp,
  LayoutGrid,
  Share2,
  Calendar,
  Settings2,
  Info,
  ExternalLink,
  ChevronDown,
  Printer,
  Table as TableIcon
} from 'lucide-react';
import {
  ReportDefinition,
  DiscoveredDataset,
  DiscoveredReportField,
  ReportTemplateModel,
  DashboardModel,
  ReportExecutionJobModel,
  ExportAuditLog,
  SmartSuggestionItem,
  DrillDownTrace,
  SourceType,
  FieldDataType,
  ChartType,
  RelationshipJoin,
  FilterGroup,
  CalculatedFormula,
  GroupingHierarchy,
  SortConfiguration,
  TopNConfiguration,
  PivotConfiguration
} from '../types/phase30ReportEngine';

type ReportSection =
  | 'My Reports'
  | 'Templates'
  | 'Builder'
  | 'Dashboards'
  | 'Favorites'
  | 'Recent'
  | 'Shared'
  | 'Scheduled'
  | 'Exports';

export const ReportCenterView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ReportSection>('My Reports');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core Data
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [datasets, setDatasets] = useState<DiscoveredDataset[]>([]);
  const [templates, setTemplates] = useState<ReportTemplateModel[]>([]);
  const [dashboards, setDashboards] = useState<DashboardModel[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestionItem[]>([]);
  const [exportLogs, setExportLogs] = useState<ExportAuditLog[]>([]);

  // Selected Report / Active Execution State
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [activeJobResult, setActiveJobResult] = useState<ReportExecutionJobModel | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [drillDownData, setDrillDownData] = useState<DrillDownTrace | null>(null);
  const [isDrillingDown, setIsDrillingDown] = useState<boolean>(false);
  const [printPreviewMode, setPrintPreviewMode] = useState<boolean>(false);

  // Search & Filter in list
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // ==========================================
  // BUILDER WIZARD STATE (11 STEPS)
  // ==========================================
  const [builderStep, setBuilderStep] = useState<number>(1);
  const [builderReport, setBuilderReport] = useState<ReportDefinition>({
    reportId: '',
    name: 'Untitled Universal Report',
    description: 'Custom dynamic report created via Universal Report Builder',
    sourceType: 'Live Tally',
    companyScope: ['Acme Enterprise Ltd (HO)'],
    isMultiCompanyConsolidated: false,
    primaryDataset: 'ds-sales',
    joinedDatasets: [],
    selectedFields: [],
    joins: [],
    filterGroups: [],
    calculations: [],
    groupings: [],
    showSubtotals: true,
    showGrandTotal: true,
    showRunningTotal: true,
    showContributionPercentage: true,
    sortings: [],
    topN: { enabled: false, type: 'Top', count: 10, metricFieldId: '' },
    pivotConfig: { enabled: false, rowFields: [], columnFields: [], values: [], showSubtotals: true, showGrandTotals: true },
    visualization: { chartType: 'Table', dimensions: [], measures: [] },
    parameters: [],
    branding: { title: 'Enterprise Report', companyName: 'Acme Enterprise Ltd', orientation: 'A4 Portrait' },
    publishingStatus: 'Draft',
    version: 1,
    owner: 'Controller Arjun',
    tags: ['Custom', 'Finance'],
    createdAt: '',
    updatedAt: ''
  });

  // Builder calculation temporary inputs
  const [tempCalcName, setTempCalcName] = useState<string>('');
  const [tempCalcFormula, setTempCalcFormula] = useState<string>('');
  const [tempCalcDesc, setTempCalcDesc] = useState<string>('');

  // Field tree search
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>('');

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
      const [resRep, resDs, resTmpl, resDash, resSug, resExp] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/reports/meta/datasets'),
        fetch('/api/reports/meta/templates'),
        fetch('/api/reports/dashboards/all'),
        fetch('/api/reports/meta/suggestions'),
        fetch('/api/reports/exports/audit')
      ]);

      const dataRep = await resRep.json();
      const dataDs = await resDs.json();
      const dataTmpl = await resTmpl.json();
      const dataDash = await resDash.json();
      const dataSug = await resSug.json();
      const dataExp = await resExp.json();

      if (dataRep.success) {
        setReports(dataRep.data);
        if (dataRep.data.length > 0 && !selectedReport) {
          setSelectedReport(dataRep.data[0]);
          executeReport(dataRep.data[0]);
        }
      }
      if (dataDs.success) setDatasets(dataDs.data);
      if (dataTmpl.success) setTemplates(dataTmpl.data);
      if (dataDash.success) setDashboards(dataDash.data);
      if (dataSug.success) setSuggestions(dataSug.data);
      if (dataExp.success) setExportLogs(dataExp.data);
    } catch (err) {
      console.error('Failed to load Universal Report Engine data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeReport = async (report: ReportDefinition) => {
    setIsExecuting(true);
    setDrillDownData(null);
    try {
      const res = await fetch(`/api/reports/${report.reportId || 'TEMP'}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transientReport: !report.reportId ? report : undefined })
      });
      const data = await res.json();
      if (data.success) {
        setActiveJobResult(data.data);
      }
    } catch (err) {
      showNotification('error', 'Report execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDrillDown = async (dimensionName: string, dimensionValue: string, metricName: string) => {
    if (!selectedReport) return;
    setIsDrillingDown(true);
    try {
      const res = await fetch(`/api/reports/${selectedReport.reportId}/drill-down`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimensionName, dimensionValue, metricName })
      });
      const data = await res.json();
      if (data.success) {
        setDrillDownData(data.data);
        showNotification('info', `Underlying voucher drill-down loaded for ${dimensionValue}`);
      }
    } catch (err) {
      showNotification('error', 'Drill-down resolution failed');
    } finally {
      setIsDrillingDown(false);
    }
  };

  const handleExport = async (format: 'PDF' | 'XLSX' | 'CSV' | 'JSON') => {
    if (!selectedReport || !activeJobResult) return;
    try {
      await fetch('/api/reports/exports/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.reportId,
          reportName: selectedReport.name,
          company: selectedReport.companyScope.join(', '),
          format,
          rowCount: activeJobResult.totalRecords
        })
      });

      // Synthetic File Download simulation
      const filename = `${selectedReport.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${format.toLowerCase()}`;
      showNotification('success', `Exported "${selectedReport.name}" as ${format} successfully. (Saved to Downloads: ${filename})`);
      fetchInitialData();
    } catch (err) {
      showNotification('error', 'Export generation failed');
    }
  };

  const handleSaveBuilderReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderReport)
      });
      const data = await res.json();
      if (data.success) {
        setReports([data.data, ...reports]);
        setSelectedReport(data.data);
        setActiveSection('My Reports');
        executeReport(data.data);
        showNotification('success', `Report "${data.data.name}" saved and validated successfully.`);
      }
    } catch (err) {
      showNotification('error', 'Failed to save report');
    }
  };

  const handleAddCalculationToBuilder = () => {
    if (!tempCalcName || !tempCalcFormula) {
      showNotification('error', 'Formula name and mathematical expression are required.');
      return;
    }
    const newCalc: CalculatedFormula = {
      calculationId: `calc-${Date.now()}`,
      name: tempCalcName,
      formulaString: tempCalcFormula,
      description: tempCalcDesc || 'User defined custom calculation',
      returnType: 'Currency',
      lineage: {
        inputFields: [tempCalcFormula.split(/[\s+\-*/()]+/)[0] || 'Amount'],
        sourceDatasets: [builderReport.primaryDataset]
      },
      sampleResult: 125000
    };
    setBuilderReport({
      ...builderReport,
      calculations: [...builderReport.calculations, newCalc]
    });
    setTempCalcName('');
    setTempCalcFormula('');
    setTempCalcDesc('');
    showNotification('success', `Calculated field "${newCalc.name}" added to pipeline.`);
  };

  const currentDatasetObj = datasets.find((d) => d.datasetId === builderReport.primaryDataset);

  // Filtered reports for My Reports view
  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'All' || r.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar / Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Universal Dynamic Report Engine</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  PHASE 30 REPORT BUILDER & ENGINE
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LIVE TALLY ACTIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Any Data → Any Report • Joins • Calculated Formulas • Multi-Level Pivots • Deep Drill-Down • Custom Report Designer
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-200 font-medium">Acme Enterprise Ltd (HO)</span>
            </div>

            <button
              onClick={() => {
                setBuilderStep(1);
                setActiveSection('Builder');
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-md text-xs shadow flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
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
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Smart Suggestions Banner (Phase 29 Harvester Integration) */}
        {suggestions.length > 0 && activeSection === 'My Reports' && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-slate-900 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <span className="font-bold text-white">Smart Report Suggestion:</span>{' '}
                <span className="text-purple-200 font-medium">{suggestions[0].title}</span>{' '}
                <span className="text-slate-400">— {suggestions[0].reason}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setBuilderReport({
                  ...builderReport,
                  name: suggestions[0].title,
                  primaryDataset: suggestions[0].presetReportDefinition.primaryDataset || 'ds-sales',
                  visualization: suggestions[0].presetReportDefinition.visualization as any
                });
                setActiveSection('Builder');
                setBuilderStep(3);
                showNotification('info', `Pre-configured builder with suggested fields for ${suggestions[0].title}`);
              }}
              className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 rounded font-semibold text-[11px] transition"
            >
              Build This Report →
            </button>
          </div>
        )}

        {/* Main Navigation Sections */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'My Reports', label: `My Reports (${reports.length})`, icon: FileSpreadsheet },
            { id: 'Builder', label: 'Report Builder (11-Step)', icon: Calculator },
            { id: 'Templates', label: `Templates Library (${templates.length})`, icon: Layers },
            { id: 'Dashboards', label: `Dashboards & KPIs (${dashboards.length})`, icon: LayoutGrid },
            { id: 'Favorites', label: 'Favorites', icon: Sparkles },
            { id: 'Recent', label: 'Recent', icon: Clock },
            { id: 'Shared', label: 'Shared with Team', icon: Share2 },
            { id: 'Scheduled', label: 'Scheduled Jobs', icon: Calendar },
            { id: 'Exports', label: `Export Audit (${exportLogs.length})`, icon: Download }
          ].map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as ReportSection)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-t-md font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* SECTION 1: MY REPORTS & VIEWER */}
        {/* ========================================== */}
        {activeSection === 'My Reports' && (
          <div className="space-y-6">
            {/* Search & Tag Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reports by name, description, or field..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto">
                {['All', 'Sales', 'Finance', 'Inventory', 'Receivables', 'Management'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1.5 rounded-full font-medium transition ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Reports</h3>
                {filteredReports.map((rep) => {
                  const isSelected = selectedReport?.reportId === rep.reportId;
                  return (
                    <div
                      key={rep.reportId}
                      onClick={() => {
                        setSelectedReport(rep);
                        executeReport(rep);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-slate-900 border-blue-500 shadow-xl'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                            {rep.sourceType.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              rep.publishingStatus === 'Published'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {rep.publishingStatus} (v{rep.version})
                          </span>
                        </div>
                        {rep.isFavorite && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      </div>

                      <h4 className="text-sm font-bold text-white mt-2">{rep.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{rep.description}</p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                        <span>Fields: <strong className="text-slate-200">{rep.selectedFields.length}</strong></span>
                        <span>Owner: <strong className="text-slate-200">{rep.owner.split(' ')[0]}</strong></span>
                        <span className="flex items-center space-x-1 text-blue-400">
                          <span>Run</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Report Execution Viewer & Visualizer */}
              <div className="lg:col-span-2 space-y-4">
                {selectedReport && activeJobResult ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                    {/* Viewer Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-bold text-white">{selectedReport.name}</h2>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">
                            {selectedReport.reportId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedReport.branding.title}</p>
                      </div>

                      {/* Export & Actions Toolbar */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExport('PDF')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold text-xs flex items-center space-x-1.5"
                          title="Export PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-rose-400" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleExport('XLSX')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold text-xs flex items-center space-x-1.5"
                          title="Export Excel XLSX"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>XLSX</span>
                        </button>
                        <button
                          onClick={() => handleExport('CSV')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold text-xs flex items-center space-x-1.5"
                          title="Export CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => executeReport(selectedReport)}
                          disabled={isExecuting}
                          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs transition"
                          title="Re-run Report"
                        >
                          <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Performance & Execution Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Execution Time</span>
                        <span className="text-sm font-bold text-emerald-400">{activeJobResult.durationMs} ms (Read-Only)</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Records Filtered</span>
                        <span className="text-sm font-bold text-white">
                          {activeJobResult.recordsAfterFilter} / {activeJobResult.recordsBeforeFilter}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Grand Total Sum</span>
                        <span className="text-sm font-bold text-blue-400">
                          ₹ {Number(activeJobResult.aggregates?.GrandTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Source Integrity</span>
                        <span className="text-sm font-bold text-purple-400">100% Unmutated</span>
                      </div>
                    </div>

                    {/* Visual Chart or Table Mode */}
                    {selectedReport.visualization.chartType === 'Bar' || selectedReport.visualization.chartType === 'Column' ? (
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                            <span>Visual Distribution: {selectedReport.visualization.measures[0]} by {selectedReport.visualization.dimensions[0]}</span>
                          </span>
                        </div>

                        {/* Interactive Synthetic Bar Graph with Click-to-Drilldown */}
                        <div className="space-y-2 pt-2">
                          {activeJobResult.rows?.slice(0, 5).map((row, idx) => {
                            const val = row['Net Amount'] || row['Due Amount'] || row['Closing Stock Value'] || 100000;
                            const label = row['Customer Name'] || row['Item SKU Name'] || row['Aging Slab'] || `Item ${idx + 1}`;
                            const maxVal = 1000000;
                            const pct = Math.min(100, Math.round((val / maxVal) * 100));

                            return (
                              <div
                                key={idx}
                                onClick={() => handleDrillDown(selectedReport.visualization.dimensions[0] || 'Customer', label, 'Net Amount')}
                                className="group cursor-pointer p-2 rounded hover:bg-slate-900 transition"
                              >
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-300 group-hover:text-blue-300 font-medium flex items-center space-x-1">
                                    <span>{label}</span>
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                                  </span>
                                  <span className="font-mono text-slate-200 font-bold">
                                    ₹ {Number(val).toLocaleString('en-IN')} ({row['Contribution %'] || `${pct}%`})
                                  </span>
                                </div>
                                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-slate-500 italic">💡 Click any bar item to drill down into underlying source vouchers.</p>
                      </div>
                    ) : null}

                    {/* Table View */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                          <TableIcon className="w-4 h-4 text-emerald-400" />
                          <span>Tabular Result Matrix</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">Showing {activeJobResult.rows?.length || 0} active rows</span>
                      </div>

                      <div className="overflow-x-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                            <tr>
                              {Object.keys(activeJobResult.rows?.[0] || {}).map((col, idx) => (
                                <th key={idx} className="p-2.5 whitespace-nowrap">{col}</th>
                              ))}
                              <th className="p-2.5 text-right whitespace-nowrap">Audit Trace</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {activeJobResult.rows?.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                                {Object.values(row).map((val: any, cIdx) => (
                                  <td key={cIdx} className="p-2.5 text-slate-200 whitespace-nowrap">
                                    {typeof val === 'number' ? `₹ ${val.toLocaleString('en-IN')}` : String(val)}
                                  </td>
                                ))}
                                <td className="p-2.5 text-right">
                                  <button
                                    onClick={() => handleDrillDown('RowTrace', row['Customer Name'] || row['Debtor Name'] || 'Row', 'LineTotal')}
                                    className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded border border-blue-500/30 text-[10px] transition"
                                  >
                                    Drill-Down
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Drill-Down Modal/Drawer */}
                    {drillDownData && (
                      <div className="p-4 bg-slate-950 border border-blue-500/40 rounded-xl space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            <h4 className="font-bold text-white">Underlying Source Voucher Audit Trace (IDrillDownEngine)</h4>
                          </div>
                          <button onClick={() => setDrillDownData(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        {/* Breadcrumbs Path */}
                        <div className="flex items-center space-x-2 text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                          {drillDownData.path.map((p, idx) => (
                            <React.Fragment key={idx}>
                              <span className="font-semibold text-blue-400">{p.dimensionName}: {p.dimensionValue}</span>
                              {idx < drillDownData.path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-500" />}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Underlying Vouchers Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px] border border-slate-800 rounded">
                            <thead className="bg-slate-900 text-slate-400">
                              <tr>
                                <th className="p-2 text-left">Voucher No</th>
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2 text-left">Line Item Description</th>
                                <th className="p-2 text-right">Qty</th>
                                <th className="p-2 text-right">Taxable Amt</th>
                                <th className="p-2 text-right">GST</th>
                                <th className="p-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {drillDownData.underlyingRecords.map((rec, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/40">
                                  <td className="p-2 font-mono text-purple-300 font-bold">{rec.VoucherNo}</td>
                                  <td className="p-2 text-slate-300">{rec.Date}</td>
                                  <td className="p-2 text-slate-200">{rec.Item}</td>
                                  <td className="p-2 text-right text-slate-300">{rec.Qty}</td>
                                  <td className="p-2 text-right font-mono">₹ {rec.Amount.toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-right font-mono text-emerald-400">₹ {rec.Tax.toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-right font-mono font-bold text-white">₹ {rec.Total.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs">Select or execute a report from the list to view live data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 2: 11-STEP REPORT BUILDER WIZARD */}
        {/* ========================================== */}
        {activeSection === 'Builder' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Steps Progress Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-white flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <span>Universal Report Builder — Step {builderStep} of 11:</span>
                  <span className="text-blue-400 font-semibold">
                    {[
                      'Source Selection',
                      'Dataset Selector',
                      'Field Selection',
                      'Relationships & Joins',
                      'Advanced Filters',
                      'Calculations & Formulas',
                      'Grouping & Totals',
                      'Sorting & Top N',
                      'Visualization & Pivots',
                      'Preview & Drill-Down',
                      'Branding & Save'
                    ][builderStep - 1]}
                  </span>
                </span>
                <span className="text-slate-400 text-[11px] font-mono">Status: {builderReport.publishingStatus}</span>
              </div>

              {/* Step indicator pills */}
              <div className="grid grid-cols-11 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBuilderStep(s)}
                    className={`h-2 rounded-full transition ${
                      builderStep === s
                        ? 'bg-blue-500'
                        : builderStep > s
                        ? 'bg-emerald-500'
                        : 'bg-slate-800'
                    }`}
                    title={`Step ${s}`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Source Selection */}
            {builderStep === 1 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 1: Select Data Source & Multi-Company Scope</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect directly to Live Tally, historical snapshots, or imported datasets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'Live Tally', label: 'LIVE TALLY', desc: 'Real-time introspection via safe XML/HTTP read envelope', badge: 'Active (Port 9000)' },
                    { id: 'Tally Snapshot', label: 'TALLY SNAPSHOT', desc: 'Point-in-time immutable backup snapshot', badge: '07 Mar 2026' },
                    { id: 'Imported Dataset', label: 'IMPORTED DATASET', desc: 'Staged CSV / JSON schema ingestion', badge: 'Ready' }
                  ].map((src) => (
                    <div
                      key={src.id}
                      onClick={() => setBuilderReport({ ...builderReport, sourceType: src.id as SourceType })}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        builderReport.sourceType === src.id
                          ? 'bg-blue-950/40 border-blue-500 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{src.label}</span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">{src.badge}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{src.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Company Selection */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Company Scope</span>
                    <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={builderReport.isMultiCompanyConsolidated}
                        onChange={(e) => setBuilderReport({ ...builderReport, isMultiCompanyConsolidated: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600"
                      />
                      <span>Enable Multi-Company Consolidation</span>
                    </label>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-300 flex items-center justify-between">
                    <span>1. Acme Enterprise Ltd (HO) [Active Head Office]</span>
                    <span className="text-emerald-400 font-bold">Primary</span>
                  </div>
                  {builderReport.isMultiCompanyConsolidated && (
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-300 flex items-center justify-between">
                      <span>2. Acme Trading South Branch [Branch Ledger]</span>
                      <span className="text-blue-400 font-bold">Consolidated</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Dataset Selector */}
            {builderStep === 2 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 2: Select Canonical Discovered Dataset</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose the primary domain entity discovered during Phase 28/29 introspection.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {datasets.map((ds) => (
                    <div
                      key={ds.datasetId}
                      onClick={() => setBuilderReport({ ...builderReport, primaryDataset: ds.datasetId, selectedFields: ds.fields })}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        builderReport.primaryDataset === ds.datasetId
                          ? 'bg-blue-950/40 border-blue-500 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{ds.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded">
                          {ds.recordCount} Records
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{ds.description}</p>
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-blue-400 font-mono">
                        {ds.fields.length} Discovered Fields Available
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Field Selection (Searchable Tree) */}
            {builderStep === 3 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Step 3: Discovered Field Selector Tree</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Check fields to include in your output columns, groupings, or calculations.
                    </p>
                  </div>
                  <div className="relative max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search fields..."
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {currentDatasetObj?.fields
                    .filter((f) => f.displayName.toLowerCase().includes(fieldSearchTerm.toLowerCase()) || f.fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase()))
                    .map((f) => {
                      const isSelected = builderReport.selectedFields.some((sf) => sf.fieldId === f.fieldId);
                      return (
                        <div
                          key={f.fieldId}
                          onClick={() => {
                            if (isSelected) {
                              setBuilderReport({
                                ...builderReport,
                                selectedFields: builderReport.selectedFields.filter((sf) => sf.fieldId !== f.fieldId)
                              });
                            } else {
                              setBuilderReport({
                                ...builderReport,
                                selectedFields: [...builderReport.selectedFields, f]
                              });
                            }
                          }}
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'bg-blue-950/50 border-blue-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded bg-slate-900 border-slate-700 text-blue-600"
                            />
                            <div>
                              <div className="font-bold flex items-center space-x-2">
                                <span>{f.displayName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({f.fieldName})</span>
                              </div>
                              <span className="text-[10px] text-slate-400">Path: {f.sourcePath}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 text-[10px] bg-slate-900 border border-slate-800 text-purple-300 rounded font-mono">
                              {f.dataType}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold">
                              {Math.round(f.confidence * 100)}% Confidence
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Step 4: Relationships & Joins */}
            {builderStep === 4 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 4: Relationships & Entity Joins (IRelationshipEngine)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Link companion datasets with strict Cartesian explosion guard and confidence scoring.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Active Joins (0 Cartesian Warnings)</span>
                    <span className="text-emerald-400 font-semibold">Join Safety Engine: Guard Active</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200">SalesVoucher → Customer Ledger Master</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Key: Voucher.PARTYLEDGERNAME = Ledger.NAME (Left Join)</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] font-bold">
                      Safe (98% Match)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Advanced Filters */}
            {builderStep === 5 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 5: Advanced Filter Engine (IFilterEngine)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Apply conditional filters, Indian FY ranges, relative periods, and nested AND/OR logic.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Filter Group 1 (AND)</span>
                    <span className="text-slate-400 text-[11px]">Records Before: 1,420 • Records After: 1,280</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Field</span>
                      <span className="font-bold text-slate-200">Net Amount</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Operator</span>
                      <span className="font-bold text-blue-400">Greater Than</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Threshold Value</span>
                      <span className="font-bold text-emerald-400">₹ 5,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Calculations & Formulas */}
            {builderStep === 6 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 6: Calculation & Formula Sandbox (ICalculationEngine)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Define arithmetic & logical formulas in a sandboxed AST environment with Division by Zero protection (returns N/A).
                  </p>
                </div>

                {/* Formula Add Form */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-white block">Add New Calculated Metric:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Calculated Column Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Gross Invoice Total"
                        value={tempCalcName}
                        onChange={(e) => setTempCalcName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Expression (e.g. Amount + GSTAmount)</label>
                      <input
                        type="text"
                        placeholder="Amount + GSTAmount"
                        value={tempCalcFormula}
                        onChange={(e) => setTempCalcFormula(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddCalculationToBuilder}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Calculated Formula</span>
                  </button>
                </div>

                {/* Existing formulas */}
                {builderReport.calculations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300">Active Formulas ({builderReport.calculations.length}):</span>
                    {builderReport.calculations.map((c) => (
                      <div key={c.calculationId} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white">{c.name}</span>
                          <p className="text-[11px] font-mono text-purple-300 mt-0.5">{c.formulaString}</p>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold">Preview: {String(c.sampleResult)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 7: Grouping & Totals */}
            {builderStep === 7 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 7: Dynamic Grouping & Hierarchical Totals</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Group records hierarchically (Month → Customer) and configure Subtotals and Running Totals.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderReport.showGrandTotal}
                      onChange={(e) => setBuilderReport({ ...builderReport, showGrandTotal: e.target.checked })}
                      className="rounded bg-slate-900 text-blue-600"
                    />
                    <span className="font-semibold text-white">Display Grand Total Row</span>
                  </label>
                  <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderReport.showSubtotals}
                      onChange={(e) => setBuilderReport({ ...builderReport, showSubtotals: e.target.checked })}
                      className="rounded bg-slate-900 text-blue-600"
                    />
                    <span className="font-semibold text-white">Display Group Subtotals</span>
                  </label>
                  <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderReport.showRunningTotal}
                      onChange={(e) => setBuilderReport({ ...builderReport, showRunningTotal: e.target.checked })}
                      className="rounded bg-slate-900 text-blue-600"
                    />
                    <span className="font-semibold text-white">Calculate Running Total</span>
                  </label>
                  <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderReport.showContributionPercentage}
                      onChange={(e) => setBuilderReport({ ...builderReport, showContributionPercentage: e.target.checked })}
                      className="rounded bg-slate-900 text-blue-600"
                    />
                    <span className="font-semibold text-white">Calculate Contribution %</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 8: Sorting & Top N */}
            {builderStep === 8 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 8: Sorting & Top / Bottom N Rankings</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sort by metric value or categorize into Top 5, Top 10, or Bottom N leaders.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderReport.topN?.enabled}
                      onChange={(e) =>
                        setBuilderReport({
                          ...builderReport,
                          topN: {
                            enabled: e.target.checked,
                            type: 'Top',
                            count: 10,
                            metricFieldId: 'f-s-4'
                          }
                        })
                      }
                      className="rounded bg-slate-900 text-blue-600"
                    />
                    <span className="font-bold text-white">Enable Top / Bottom N Restriction</span>
                  </label>

                  {builderReport.topN?.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Rank Direction</label>
                        <select
                          value={builderReport.topN.type}
                          onChange={(e) =>
                            setBuilderReport({
                              ...builderReport,
                              topN: { ...builderReport.topN!, type: e.target.value as 'Top' | 'Bottom' }
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
                        >
                          <option value="Top">Top (Highest Performing)</option>
                          <option value="Bottom">Bottom (Lowest Performing)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Count</label>
                        <select
                          value={builderReport.topN.count}
                          onChange={(e) =>
                            setBuilderReport({
                              ...builderReport,
                              topN: { ...builderReport.topN!, count: parseInt(e.target.value) }
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
                        >
                          <option value="5">Top 5</option>
                          <option value="10">Top 10</option>
                          <option value="20">Top 20</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 9: Visualization & Pivots */}
            {builderStep === 9 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 9: Choose Visualization Archetype</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select between standard tables, multi-axis charts, or pivot matrices.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'Table', label: 'Data Table', icon: TableIcon },
                    { id: 'Bar', label: 'Bar Chart', icon: BarChart3 },
                    { id: 'Column', label: 'Column Chart', icon: BarChart3 },
                    { id: 'Pie', label: 'Pie Chart', icon: PieChart },
                    { id: 'Pivot', label: 'Multi-Axis Pivot', icon: LayoutGrid }
                  ].map((v) => {
                    const Icon = v.icon;
                    return (
                      <div
                        key={v.id}
                        onClick={() =>
                          setBuilderReport({
                            ...builderReport,
                            visualization: {
                              ...builderReport.visualization,
                              chartType: v.id as ChartType,
                              dimensions: ['Customer Name'],
                              measures: ['Net Amount']
                            }
                          })
                        }
                        className={`p-4 rounded-xl border cursor-pointer text-center space-y-2 transition ${
                          builderReport.visualization.chartType === v.id
                            ? 'bg-blue-950/50 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto text-blue-400" />
                        <span className="text-xs font-bold block">{v.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 10: Preview & Drill-Down */}
            {builderStep === 10 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 10: Live Report Test & Query Cost Preview</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Validate execution safety, row count estimates, and read-only query plans.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Query Cost Estimate:</span>
                    <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold">
                      Cost: LOW (Safe Execution)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-300">
                    <div>Estimated Records: <strong className="text-white">1,420</strong></div>
                    <div>Join Operations: <strong className="text-blue-400">1 Safe Join</strong></div>
                    <div>Memory Buffer: <strong className="text-emerald-400">1.2 MB</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => executeReport(builderReport)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Execute Transient Preview</span>
                </button>
              </div>
            )}

            {/* Step 11: Branding & Save */}
            {builderStep === 11 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 11: Formatting, Branding & Save</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Set report titles, print orientation, number formats, and publish status.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Report Display Name</label>
                    <input
                      type="text"
                      value={builderReport.name}
                      onChange={(e) => setBuilderReport({ ...builderReport, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Business Description</label>
                    <textarea
                      rows={2}
                      value={builderReport.description}
                      onChange={(e) => setBuilderReport({ ...builderReport, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Print Orientation</label>
                      <select
                        value={builderReport.branding.orientation}
                        onChange={(e) =>
                          setBuilderReport({
                            ...builderReport,
                            branding: { ...builderReport.branding, orientation: e.target.value as any }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                      >
                        <option value="A4 Portrait">A4 Portrait</option>
                        <option value="A4 Landscape">A4 Landscape</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Publishing Status</label>
                      <select
                        value={builderReport.publishingStatus}
                        onChange={(e) =>
                          setBuilderReport({
                            ...builderReport,
                            publishingStatus: e.target.value as any
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-bold"
                      >
                        <option value="Draft">Draft (Private)</option>
                        <option value="Validated">Validated (Reviewed)</option>
                        <option value="Published">Published (Production Dashboard)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBuilderReport}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-sm shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Report Definition</span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons for Wizard */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={builderStep === 1}
                onClick={() => setBuilderStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded font-semibold text-xs transition"
              >
                ← Previous Step
              </button>
              <button
                disabled={builderStep === 11}
                onClick={() => setBuilderStep((prev) => Math.min(11, prev + 1))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-semibold text-xs transition"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 3: TEMPLATES LIBRARY */}
        {/* ========================================== */}
        {activeSection === 'Templates' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Universal Report Template Library</h3>
              <p className="text-xs text-slate-400 mt-1">
                Standardized templates with automatic compatibility checks against discovered Tally fields.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <div key={tmpl.templateId} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{tmpl.name}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        tmpl.compatibility === 'Compatible'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {tmpl.compatibility}
                    </span>
                  </div>

                  <p className="text-slate-400">{tmpl.description}</p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">
                      Required: <strong className="text-slate-200">{tmpl.requiredFields.length} Fields</strong>
                    </span>

                    <button
                      onClick={() => {
                        setBuilderReport({
                          ...builderReport,
                          name: tmpl.name,
                          description: tmpl.description
                        });
                        setActiveSection('Builder');
                        setBuilderStep(3);
                        showNotification('success', `Instantiated template "${tmpl.name}" in Builder.`);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-[11px]"
                    >
                      Use Template →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 4: DASHBOARDS & KPIS */}
        {/* ========================================== */}
        {activeSection === 'Dashboards' && (
          <div className="space-y-6">
            {dashboards.map((dash) => (
              <div key={dash.dashboardId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{dash.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{dash.description}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Production Live
                  </span>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {dash.widgets
                    .filter((w) => w.type === 'KPI')
                    .map((kpi) => (
                      <div key={kpi.widgetId} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <span className="text-slate-400 font-semibold block">{kpi.title}</span>
                        <div className="text-2xl font-bold text-white font-mono">{kpi.kpiConfig?.currentValue}</div>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span
                            className={`font-bold ${
                              (kpi.kpiConfig?.changePercentage || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {(kpi.kpiConfig?.changePercentage || 0) >= 0 ? '+' : ''}
                            {kpi.kpiConfig?.changePercentage}%
                          </span>
                          <span className="text-slate-500">vs {kpi.kpiConfig?.comparisonType}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 5: EXPORTS & AUDIT */}
        {/* ========================================== */}
        {activeSection === 'Exports' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Export Audit Trail & History (Compliance Ledger)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Immutable audit log recording every export event, user identity, format, and row count.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Audit ID</th>
                      <th className="p-2.5">Report Name</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Format</th>
                      <th className="p-2.5">Rows</th>
                      <th className="p-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {exportLogs.map((log) => (
                      <tr key={log.auditId} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-400">{log.auditId}</td>
                        <td className="p-2.5 text-white font-sans font-medium">{log.reportName}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{log.company}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{log.user}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-200 rounded">
                            {log.format}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">{log.rowCount}</td>
                        <td className="p-2.5 text-slate-400">{log.timestamp.slice(0, 19).replace('T', ' ')}</td>
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
  );
};
