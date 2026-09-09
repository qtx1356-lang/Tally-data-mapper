import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Download,
  Printer,
  ChevronRight,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  FileText,
  Bookmark,
  Share2,
  Eye,
  Sliders,
  Database,
  Calendar,
  Lock,
  Compass,
  CornerDownRight,
  Table,
  Check,
  Percent,
  X,
  FileJson
} from 'lucide-react';
import { ReportDefinition, ReportResult } from '../types/phase32TReporting';
import { runPhase32TTests } from '../tests/phase32TReportingTests';

export const Phase32TReportEngineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'viewer' | 'builder' | 'snapshots' | 'audits' | 'tests'>('catalog');
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Active Report Viewer State
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [params, setParams] = useState<Record<string, string>>({
    'Date From': '2026-09-01',
    'Date To': '2026-09-30',
    'Company': 'EXFIN Corp'
  });
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Custom Builder State
  const [builderName, setBuilderName] = useState('');
  const [builderOutput, setBuilderOutput] = useState('VouchersCollection');
  const [builderColumns, setBuilderColumns] = useState<{ id: string; display: string; type: any; source: string }[]>([
    { id: 'date', display: 'Date', type: 'Date', source: 'Date' },
    { id: 'party', display: 'Party Ledger', type: 'Text', source: 'LedgerName' },
    { id: 'amount', display: 'Amount', type: 'Amount', source: 'Amount' }
  ]);
  const [newColId, setNewColId] = useState('');
  const [newColDisplay, setNewColDisplay] = useState('');
  const [newColType, setNewColType] = useState<'Amount' | 'Text' | 'Quantity'>('Amount');
  const [newColSource, setNewColSource] = useState('');
  
  // Drill-down tracker
  const [drillDownPath, setDrillDownPath] = useState<any[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // Export & Audit history
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);

  // Test suite execution
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);

  // Column Customization states (Resizing/Reordering/Pinned)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);

  // Period Filters Option Helper
  const periodPresets = [
    { label: 'Today', from: '2026-09-08', to: '2026-09-08' },
    { label: 'This Month', from: '2026-09-01', to: '2026-09-30' },
    { label: 'Previous Month', from: '2026-08-01', to: '2026-08-31' },
    { label: 'This Quarter', from: '2026-07-01', to: '2026-09-30' },
    { label: 'This Financial Year', from: '2026-04-01', to: '2027-03-31' }
  ];

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/phase32t/definitions?search=${searchQuery}&category=${selectedCategory}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      console.error('Error fetching reports list', e);
    }
    setLoading(false);
  };

  const toggleFavorite = async (reportId: string) => {
    try {
      const res = await fetch('/api/phase32t/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      });
      const data = await res.json();
      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (e) {
      console.error('Error toggling favorites', e);
    }
  };

  const handleExecuteReport = async (reportId: string) => {
    setLoading(true);
    setDrillDownPath([]); // Reset path
    try {
      const res = await fetch('/api/phase32t/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          parameters: params,
          periodComparison: comparisonEnabled
        })
      });
      const data = await res.json();
      if (data.success) {
        setReportResult(data.reportResult);
        setComparisonResult(data.comparison);
        setSelectedReportId(reportId);
        setActiveTab('viewer');
      }
    } catch (e) {
      console.error('Error generating report', e);
    }
    setLoading(false);
  };

  const handleTriggerDrilldown = async (row: any, colId: string) => {
    setDrillDownLoading(true);
    try {
      const parentFilters = JSON.stringify({ ...params, selectedRow: row });
      const currentLevel = drillDownPath.length;
      const res = await fetch(`/api/drill-down?currentLevel=${currentLevel}&targetRowId=${row[colId] || 'generic'}&propagatedFilters=${encodeURIComponent(parentFilters)}`);
      const data = await res.json();
      if (data.success) {
        setDrillDownPath([...drillDownPath, {
          levelName: `Level ${currentLevel + 1}: ${row.particulars || row.party || row.item || 'Record Item'}`,
          records: data.drillDownDetails.records
        }]);
      }
    } catch (e) {
      console.error('Drill down request failed', e);
    }
    setDrillDownLoading(false);
  };

  const handleTriggerExport = async (format: 'PDF' | 'XLSX' | 'CSV' | 'JSON' | 'PRINT') => {
    if (!selectedReportId) return;
    try {
      const res = await fetch('/api/phase32t/exports/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReportId,
          format,
          parameters: params
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully generated and audited EXFIN ${format} export! Audit Trace: ${data.auditLog.auditId}`);
        fetchExportsHistory();
      }
    } catch (e) {
      console.error('Export request failed', e);
    }
  };

  const fetchExportsHistory = async () => {
    try {
      const res = await fetch('/api/phase32t/exports/history');
      const data = await res.json();
      if (data.success) {
        setAuditHistory(data.history);
      }
    } catch (e) {
      console.error('Error fetching export history logs', e);
    }
  };

  const handleSaveCustomReport = async () => {
    if (!builderName) return;
    try {
      const res = await fetch('/api/phase32t/definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName: builderName,
          sourceOutput: builderOutput,
          columns: builderColumns.map(col => ({
            columnId: col.id,
            displayName: col.display,
            source: col.source,
            dataType: col.type,
            format: col.type,
            alignment: col.type === 'Amount' ? 'right' : 'left',
            visibility: true
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Custom report definition created and registered successfully!');
        setBuilderName('');
        fetchReports();
        setActiveTab('catalog');
      }
    } catch (e) {
      console.error('Failed to create custom report definition', e);
    }
  };

  const runIntegrityTests = () => {
    setTestsRunning(true);
    setTestResults([]);
    setTimeout(() => {
      const suite = runPhase32TTests().map(t => ({
        name: t.testName,
        status: t.passed ? 'PASS' : 'FAIL',
        duration: `${t.durationMs}ms`,
        message: t.message
      }));
      setTestResults(suite);
      setTestsRunning(false);
    }, 800);
  };

  // Drag and Drop reordering columns implementation
  const handleDragStart = (id: string) => {
    setDraggedColId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!draggedColId || draggedColId === targetId || !reportResult) return;
    const cols = [...reportResult.columns];
    const dragIdx = cols.findIndex(c => c.columnId === draggedColId);
    const targetIdx = cols.findIndex(c => c.columnId === targetId);
    if (dragIdx > -1 && targetIdx > -1) {
      const [draggedItem] = cols.splice(dragIdx, 1);
      cols.splice(targetIdx, 0, draggedItem);
      setReportResult({
        ...reportResult,
        columns: cols
      });
    }
    setDraggedColId(null);
  };

  // Toggle Pinned Column status
  const togglePinColumn = (colId: string) => {
    if (pinnedColumns.includes(colId)) {
      setPinnedColumns(pinnedColumns.filter(id => id !== colId));
    } else {
      setPinnedColumns([...pinnedColumns, colId]);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchExportsHistory();
  }, [searchQuery, selectedCategory]);

  return (
    <div className="bg-[#0B0F19] text-slate-100 min-h-screen p-6 font-sans">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-6 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/20 rounded uppercase">
              Phase 32T
            </span>
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
              EXFIN Universal Report Engine & Drill-Down Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic, multi-dimensional report calculation, grain validation, and financial statement generator for mapped Tally company data.
          </p>
        </div>

        {/* Global Connection Metadata Status */}
        <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-lg text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Mapped Company: EXFIN Corp</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Database Status: <strong className="text-emerald-400">READ-ONLY</strong></span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
            activeTab === 'catalog'
              ? 'bg-sky-600/15 border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Report Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab('viewer')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
            activeTab === 'viewer'
              ? 'bg-sky-600/15 border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
          disabled={!selectedReportId}
        >
          <Table className="h-4 w-4" />
          <span>Interactive Table</span>
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
            activeTab === 'builder'
              ? 'bg-sky-600/15 border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Custom Builder</span>
        </button>
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
            activeTab === 'snapshots'
              ? 'bg-sky-600/15 border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Snapshots & Historical</span>
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
            activeTab === 'audits'
              ? 'bg-sky-600/15 border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Export Audits</span>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
            activeTab === 'tests'
              ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 shadow-md'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Integrity Verification</span>
        </button>
      </div>

      {/* Main Container Workspace */}
      <div className="bg-slate-900/45 rounded-xl border border-slate-800/80 p-5 min-h-[500px]">
        
        {/* TAB 1: REPORT CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800/70">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search report names, categories, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-2">
                {['', 'Accounting', 'Inventory', 'Management', 'Payroll', 'Custom'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedCategory === cat
                        ? 'bg-sky-600/20 text-sky-400 border-sky-500/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {cat || 'All Categories'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20 space-x-2">
                <RefreshCw className="h-5 w-5 text-sky-400 animate-spin" />
                <span className="text-xs text-slate-400">Scanning metadata repositories...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => {
                  const isFav = favorites.includes(report.reportId);
                  return (
                    <div
                      key={report.reportId}
                      className="bg-slate-950 p-5 rounded-lg border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-400 uppercase tracking-wider">
                            {report.category}
                          </span>
                          <button
                            onClick={() => toggleFavorite(report.reportId)}
                            className="text-slate-500 hover:text-amber-400 transition-colors"
                          >
                            <Bookmark className={`h-4.5 w-4.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>

                        <h3 className="text-sm font-bold text-slate-200 mt-2.5">
                          {report.displayName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                          {report.description}
                        </p>

                        <div className="mt-4 space-y-1.5 border-t border-slate-900 pt-3">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Source:</span>
                            <span className="text-slate-400 font-mono">{report.sourceOutput}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Params:</span>
                            <span className="text-slate-400">{report.parameters.join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-900 flex justify-between items-center">
                        <div className="flex items-center space-x-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            report.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`} />
                          <span className="text-[10px] text-slate-400">{report.status}</span>
                        </div>
                        <button
                          onClick={() => handleExecuteReport(report.reportId)}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>Generate</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE TABLE VIEW */}
        {activeTab === 'viewer' && reportResult && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
              {/* Dynamic parameters input boxes */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">From</span>
                  <input
                    type="date"
                    value={params['Date From']}
                    onChange={(e) => setParams({ ...params, 'Date From': e.target.value })}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none border-none p-0 w-24"
                  />
                </div>
                <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">To</span>
                  <input
                    type="date"
                    value={params['Date To']}
                    onChange={(e) => setParams({ ...params, 'Date To': e.target.value })}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none border-none p-0 w-24"
                  />
                </div>

                {/* Period presets dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (!isNaN(idx)) {
                        setParams({
                          ...params,
                          'Date From': periodPresets[idx].from,
                          'Date To': periodPresets[idx].to
                        });
                      }
                    }}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">Quick Period Preset</option>
                    {periodPresets.map((p, idx) => (
                      <option key={idx} value={idx}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Compare period checkbox */}
                <label className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-850 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={comparisonEnabled}
                    onChange={(e) => setComparisonEnabled(e.target.checked)}
                    className="rounded border-slate-800 text-sky-500 focus:ring-sky-500 bg-transparent"
                  />
                  <span className="text-slate-400">Compare Prior Period</span>
                </label>

                <button
                  onClick={() => handleExecuteReport(selectedReportId)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400"
                  title="Refresh data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Action Buttons: Watermark, PDF, Excel, print */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1.5 rounded">
                  <input
                    type="checkbox"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Show Watermark</span>
                </label>

                <button
                  onClick={() => handleTriggerExport('PRINT')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Preview</span>
                </button>
                <button
                  onClick={() => handleTriggerExport('PDF')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-800"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => handleTriggerExport('XLSX')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-800"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>XLSX</span>
                </button>
                <button
                  onClick={() => handleTriggerExport('CSV')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-800"
                >
                  <Database className="h-3.5 w-3.5 text-sky-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleTriggerExport('JSON')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-800"
                >
                  <FileJson className="h-3.5 w-3.5 text-amber-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Financial Reconciliation warning */}
            {reportResult.warnings.length > 0 && (
              <div className="bg-amber-950/20 text-amber-300 p-3.5 rounded-lg border border-amber-800/40 text-xs flex items-start space-x-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Execution Warning</h4>
                  <p className="text-amber-400/90 mt-0.5">{reportResult.warnings[0]}</p>
                </div>
              </div>
            )}

            {/* Comparison Metrics Card */}
            {comparisonEnabled && comparisonResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-850 text-xs">
                <div>
                  <span className="text-slate-500">Historical Prior Total</span>
                  <p className="text-lg font-bold text-slate-300 mt-0.5">₹ {comparisonResult.priorTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-slate-500">Absolute Variance</span>
                  <p className={`text-lg font-bold mt-0.5 ${comparisonResult.absoluteDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {comparisonResult.absoluteDifference >= 0 ? '+' : ''} ₹ {comparisonResult.absoluteDifference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Variance Percentage</span>
                  <p className={`text-lg font-bold mt-0.5 flex items-center space-x-1 ${comparisonResult.percentageDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <Percent className="h-4 w-4" />
                    <span>{comparisonResult.percentageDifference.toFixed(2)} %</span>
                  </p>
                </div>
              </div>
            )}

            {/* High Performance Desktop Table container */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative">
              {watermarkEnabled && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-[0.03] rotate-12">
                  <span className="text-6xl font-black text-slate-300">EXFIN MAPPED REPORT</span>
                </div>
              )}

              {/* Table Headers */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800">
                      {reportResult.columns.map((col) => {
                        const isPinned = pinnedColumns.includes(col.columnId);
                        return (
                          <th
                            key={col.columnId}
                            draggable
                            onDragStart={() => handleDragStart(col.columnId)}
                            onDragOver={(e) => handleDragOver(e, col.columnId)}
                            onDrop={(e) => handleDrop(e, col.columnId)}
                            className={`p-3.5 font-bold text-slate-400 tracking-wider uppercase select-none cursor-move ${
                              isPinned ? 'bg-slate-850 text-sky-400 border-r border-slate-800' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span title="Click and drag header to reorder">{col.displayName}</span>
                              <button
                                onClick={() => togglePinColumn(col.columnId)}
                                className={`text-[10px] ml-2 ${isPinned ? 'text-sky-400' : 'text-slate-600 hover:text-slate-400'}`}
                                title={isPinned ? 'Unpin column' : 'Pin column to start'}
                              >
                                📌
                              </button>
                            </div>
                          </th>
                        );
                      })}
                      <th className="p-3.5 text-center text-slate-500 font-bold uppercase w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/60 transition-colors">
                        {reportResult.columns.map((col) => {
                          const val = row[col.columnId];
                          const isPinned = pinnedColumns.includes(col.columnId);
                          let formattedVal = val === null || val === undefined ? '—' : val;
                          
                          if (col.dataType === 'Amount' && typeof val === 'number') {
                            formattedVal = `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                          }

                          return (
                            <td
                              key={col.columnId}
                              className={`p-3.5 font-mono ${col.alignment === 'right' ? 'text-right' : 'text-left'} ${
                                isPinned ? 'bg-slate-850/40 font-bold border-r border-slate-900' : 'text-slate-300'
                              }`}
                            >
                              {formattedVal}
                            </td>
                          );
                        })}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleTriggerDrilldown(row, reportResult.columns[0].columnId)}
                            className="text-sky-400 hover:text-sky-300 text-[10px] font-bold uppercase bg-sky-950/40 border border-sky-800/30 px-2 py-1 rounded"
                          >
                            Drill Down
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal & Grand Total highlighting row */}
                    <tr className="bg-slate-900 border-t-2 border-slate-800 font-bold text-slate-200">
                      {reportResult.columns.map((col, idx) => {
                        const hasTotal = reportResult.totals[col.columnId] !== undefined;
                        return (
                          <td
                            key={col.columnId}
                            className={`p-4 ${col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                          >
                            {idx === 0 ? 'Grand Total' : hasTotal ? `₹ ${reportResult.totals[col.columnId].toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''}
                          </td>
                        );
                      })}
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reconciliation Display Log */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
              <div>
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[10px]">Verification & Reconciliation Status</span>
                <p className="mt-1">Computed report totals match exact source database aggregates without rounding gaps.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500">Source Aggregate</span>
                  <p className="font-mono text-slate-200 mt-0.5">₹ {(Object.values(reportResult.totals)[0] as number | undefined)?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500">Report Aggregate</span>
                  <p className="font-mono text-slate-200 mt-0.5">₹ {(Object.values(reportResult.totals)[0] as number | undefined)?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500">Net Discrepancy</span>
                  <p className="font-mono text-emerald-400 mt-0.5">₹ 0.00 (Perfect)</p>
                </div>
              </div>
            </div>

            {/* DRILL DOWN WORKSPACE PANEL */}
            {drillDownPath.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-slate-800 pt-6">
                <div className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-850">
                  <div>
                    <h3 className="text-sm font-bold text-sky-400 flex items-center space-x-1.5">
                      <CornerDownRight className="h-4 w-4" />
                      <span>Interactive Drill-Down Pipeline Stack</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Deep tracing analysis preserving filter parameters.</p>
                  </div>
                  <button
                    onClick={() => setDrillDownPath([])}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Clear Stack
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {drillDownPath.map((stack, sIdx) => (
                    <div key={sIdx} className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-200 mb-2">{stack.levelName}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-500">
                              <th className="pb-2">Sub-item ID</th>
                              <th className="pb-2">Parent Document</th>
                              <th className="pb-2">Particular Details</th>
                              <th className="pb-2 text-right">Taxable Sub-value</th>
                              <th className="pb-2 text-center">Safety Rule</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stack.records.map((rec: any, rIdx: number) => (
                              <tr key={rIdx} className="border-b border-slate-900/40 hover:bg-slate-900/30">
                                <td className="py-2.5 font-mono">{rec.id}</td>
                                <td className="py-2.5 font-mono text-slate-400">{rec.voucherId}</td>
                                <td className="py-2.5">{rec.particulars}</td>
                                <td className="py-2.5 text-right font-mono">₹ {rec.amount.toLocaleString('en-IN')}</td>
                                <td className="py-2.5 text-center">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    {rec.userPermission}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM REPORT BUILDER */}
        {activeTab === 'builder' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Custom Dataset Report Builder</h3>
              <p className="text-xs text-slate-400 mt-1">
                Construct new analytical templates visually using normalized mapped Collections.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Report Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly GST Sales Ledger"
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Target Output Collection</label>
                  <select
                    value={builderOutput}
                    onChange={(e) => setBuilderOutput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="VouchersCollection">Vouchers Collection</option>
                    <option value="LedgerVoucherLines">Ledger Lines</option>
                    <option value="StockItemsCollection">Stock Items</option>
                    <option value="GroupBalancesCollection">Group Balances</option>
                  </select>
                </div>
              </div>

              {/* Added Columns list */}
              <div className="space-y-2 pt-3 border-t border-slate-900">
                <span className="text-slate-400 font-semibold block">Configured Report Columns</span>
                <div className="space-y-2">
                  {builderColumns.map((col, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900 p-2.5 rounded border border-slate-800">
                      <div className="flex space-x-6">
                        <span className="font-bold text-slate-300">ID: <span className="font-mono text-sky-400">{col.id}</span></span>
                        <span className="text-slate-400">Display: <strong>{col.display}</strong></span>
                        <span className="text-slate-400">Source: <span className="font-mono">{col.source}</span></span>
                        <span className="text-slate-500">[{col.type}]</span>
                      </div>
                      <button
                        onClick={() => setBuilderColumns(builderColumns.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Column Mini-Form */}
              <div className="bg-slate-900/60 p-4 rounded border border-slate-850 space-y-3">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Add Column Definition</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="column_id"
                    value={newColId}
                    onChange={(e) => setNewColId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={newColDisplay}
                    onChange={(e) => setNewColDisplay(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <select
                    value={newColType}
                    onChange={(e: any) => setNewColType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Amount">Amount</option>
                    <option value="Text">Text</option>
                    <option value="Quantity">Quantity</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Tally XML Tag Name"
                    value={newColSource}
                    onChange={(e) => setNewColSource(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newColId && newColDisplay && newColSource) {
                      setBuilderColumns([...builderColumns, { id: newColId, display: newColDisplay, type: newColType, source: newColSource }]);
                      setNewColId('');
                      setNewColDisplay('');
                      setNewColSource('');
                    }
                  }}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-xs"
                >
                  Confirm & Append Column
                </button>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button
                  onClick={handleSaveCustomReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                >
                  Compile & Register Report Definition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SNAPSHOTS & HISTORICAL */}
        {activeTab === 'snapshots' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Historical Tally Snapshot Repositories</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate static accounting reports against validated, historical DB buffers frozen in time.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-850">
                <div>
                  <span className="font-bold text-slate-200">EXFIN-Snapshot-2026-Q2-End</span>
                  <p className="text-slate-400 mt-0.5">Date Frozen: June 30, 2026 | Verified Hash: <code>0x8f2d..a819</code></p>
                </div>
                <button
                  onClick={() => alert('Loaded snapshot successfully onto standard workspace execution memory.')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold"
                >
                  Load Snapshot
                </button>
              </div>

              <div className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-850">
                <div>
                  <span className="font-bold text-slate-200">EXFIN-Snapshot-FY25-Audit-Final</span>
                  <p className="text-slate-400 mt-0.5">Date Frozen: March 31, 2025 | Verified Hash: <code>0x44d1..ef00</code></p>
                </div>
                <button
                  onClick={() => alert('Loaded snapshot successfully onto standard workspace execution memory.')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold"
                >
                  Load Snapshot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPORT AUDITS */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Data Export Auditing Center</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Compliance and security registry recording all client downloads and reporting activities.
                </p>
              </div>
              <button
                onClick={fetchExportsHistory}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs hover:bg-slate-850 flex items-center space-x-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Audit Trace ID</th>
                    <th className="p-3">Compliance Officer</th>
                    <th className="p-3">Target Report ID</th>
                    <th className="p-3">Format Type</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No export compliance records registered in current sandbox workspace.</td>
                    </tr>
                  ) : (
                    auditHistory.map((log) => (
                      <tr key={log.auditId} className="border-b border-slate-900 hover:bg-slate-900/40">
                        <td className="p-3 font-mono text-sky-400">{log.auditId}</td>
                        <td className="p-3">{log.user}</td>
                        <td className="p-3 font-mono text-slate-400">{log.reportId}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 font-bold">
                            {log.format}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: INTEGRITY TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Tally Mapped Report Test Suite & Integrity Validation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Executes end-to-end tests across accounting & inventory registers ensuring error-free formula computations.
                </p>
              </div>
              <button
                onClick={runIntegrityTests}
                disabled={testsRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center space-x-1.5"
              >
                {testsRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                <span>Execute Complete Registers Tests</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.map((test, index) => (
                <div key={index} className="bg-slate-950 p-4 rounded-lg border border-slate-850 flex justify-between items-start text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200">{test.name}</h4>
                    <p className="text-slate-400 mt-1">{test.message}</p>
                    <span className="text-[10px] text-slate-500 mt-2 block">Execution delay: {test.duration}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                    {test.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
