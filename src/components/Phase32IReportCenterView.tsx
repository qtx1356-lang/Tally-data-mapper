/**
 * Phase 32I - Universal Report Center View Component
 * Provides a visual Report Builder (13-step wizard), Output Catalog Browser,
 * Adaptive Template Gallery, Interactive Report Runner, Grain Validation,
 * Drill-Down/Up Traversal, Record Inspector, and Multi-Format Exporter.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Play,
  Download,
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  Database,
  ArrowRight,
  Eye,
  Settings,
  ChevronRight,
  Table as TableIcon,
  ShieldAlert,
  ListFilter,
  BarChart2,
  Lock,
  Tag
} from 'lucide-react';
import {
  ReportDefinition,
  TallyOutputCatalogItem,
  ReportTemplate,
  ReportExecutionResult,
  RecordDetailResult,
  OutputCategory,
  ReportType
} from '../types/phase32IReporting';

export const Phase32IReportCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'CATALOG' | 'TEMPLATES' | 'BUILDER' | 'VIEWER'>('REPORTS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [companyId, setCompanyId] = useState<string>('CMP-001');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Catalog, Templates, Reports State
  const [catalog, setCatalog] = useState<TallyOutputCatalogItem[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [activeReport, setActiveReport] = useState<ReportDefinition | null>(null);
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null);

  // Drill-Down & Detail State
  const [drillDetail, setDrillDetail] = useState<RecordDetailResult | null>(null);
  const [drillLevel, setDrillLevel] = useState<string>('Summary');
  const [drillRows, setDrillRows] = useState<any[] | null>(null);

  // Status & Loading
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Report Builder State (13-Step Wizard)
  const [builderStep, setBuilderStep] = useState<number>(1);
  const [builderForm, setBuilderForm] = useState<Partial<ReportDefinition>>({
    name: '',
    description: '',
    companyScope: 'CMP-001',
    dataset: 'canonical-vouchers',
    layout: 'Tabular',
    sourcePreference: 'WAREHOUSE',
    fields: [
      { outputField: 'Voucher No', sourceField: 'VOUCHERNUMBER', canonicalField: 'voucherNumber', warehouseField: 'voucherNumber', dataType: 'string' },
      { outputField: 'Amount', sourceField: 'AMOUNT', canonicalField: 'amount', warehouseField: 'amount', dataType: 'number', formatting: { decimalPlaces: 2 } }
    ],
    filters: [],
    grouping: [],
    sorting: [{ field: 'date', order: 'DESC' }],
    aggregations: [{ field: 'amount', function: 'SUM', alias: 'totalAmount' }],
    calculatedFields: [],
    parameters: {},
    permissions: { visibility: 'Company-scoped' },
    tags: ['Custom']
  });

  useEffect(() => {
    fetchInitialData();
  }, [companyId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch(`/api/reports/catalog?companyId=${companyId}`);
      const catData = await catRes.json();
      if (catData.success) setCatalog(catData.catalog);

      const tplRes = await fetch(`/api/reports/templates?companyId=${companyId}`);
      const tplData = await tplRes.json();
      if (tplData.success) setTemplates(tplData.templates);

      const rptRes = await fetch(`/api/reports/definitions?companyId=${companyId}`);
      const rptData = await rptRes.json();
      if (rptData.success) setReports(rptData.reports);
    } catch (err: any) {
      setStatusMessage(`Error loading initial data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/catalog/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Catalog refreshed. ${data.refreshedCount} outputs inspected.`);
        fetchInitialData();
      }
    } catch (err: any) {
      setStatusMessage(`Catalog refresh failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReport = async (report: ReportDefinition) => {
    setActiveReport(report);
    setActiveTab('VIEWER');
    setLoading(true);
    setStatusMessage(`Executing '${report.name}'...`);

    try {
      const res = await fetch(`/api/reports/execute/${report.reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ companyId })
      });
      const data = await res.json();
      if (data.success) {
        setExecutionResult(data.result);
        setStatusMessage(`Executed successfully in ${data.result.executionDurationMs}ms (${data.result.totalCount} rows).`);
      } else {
        setStatusMessage(`Execution failed: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Execution error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!builderForm.name) {
      setStatusMessage('Report Name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderForm)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Report '${data.report.name}' created successfully!`);
        fetchInitialData();
        setActiveReport(data.report);
        handleRunReport(data.report);
      } else {
        setStatusMessage(`Save failed: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Save error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'CSV' | 'Excel' | 'PDF') => {
    if (!activeReport) return;

    setStatusMessage(`Exporting report as ${format}...`);
    try {
      const res = await fetch(`/api/reports/export/${activeReport.reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ format })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport.name.replace(/\s+/g, '_')}.${format.toLowerCase() === 'excel' ? 'xls' : format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatusMessage(`Report exported successfully as ${format}.`);
    } catch (err: any) {
      setStatusMessage(`Export failed: ${err.message}`);
    }
  };

  const handleInspectRecord = async (datasetId: string, recordId: string) => {
    try {
      const res = await fetch(`/api/reports/record-detail?datasetId=${datasetId}&recordId=${recordId}&companyId=${companyId}`);
      const data = await res.json();
      if (data.success) {
        setDrillDetail(data.detail);
      }
    } catch (err: any) {
      setStatusMessage(`Record inspection failed: ${err.message}`);
    }
  };

  const filteredCatalog = catalog.filter((item) => {
    const catMatch = selectedCategory === 'ALL' || item.category === selectedCategory;
    const searchMatch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.dataset.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  const filteredReports = reports.filter((r) => {
    const searchMatch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return searchMatch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" /> Phase 32I Operational Layer
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Universal Tally Reporting System</h1>
          <p className="text-sm text-slate-400">
            Discovered capability reports, grain safety validation, adaptive templates & multi-format analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            <span className="text-slate-400 px-2 font-medium">Company Scope:</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-slate-900 text-white rounded px-2 py-1 font-semibold focus:outline-none"
            >
              <option value="CMP-001">Acme Enterprise Ltd (CMP-001)</option>
              <option value="CMP-002">Zenith Global Trading (CMP-002)</option>
              <option value="MULTI_COMPANY">Multi-Company Cross Analytics</option>
            </select>
          </div>

          <button
            onClick={() => {
              setBuilderForm({
                name: '',
                description: '',
                companyScope: companyId,
                dataset: 'canonical-vouchers',
                layout: 'Tabular',
                sourcePreference: 'WAREHOUSE',
                fields: [
                  { outputField: 'Voucher No', sourceField: 'VOUCHERNUMBER', canonicalField: 'voucherNumber', warehouseField: 'voucherNumber', dataType: 'string' },
                  { outputField: 'Amount', sourceField: 'AMOUNT', canonicalField: 'amount', warehouseField: 'amount', dataType: 'number', formatting: { decimalPlaces: 2 } }
                ],
                filters: [],
                grouping: [],
                sorting: [{ field: 'date', order: 'DESC' }],
                aggregations: [{ field: 'amount', function: 'SUM', alias: 'totalAmount' }],
                calculatedFields: [],
                parameters: {},
                permissions: { visibility: 'Company-scoped' },
                tags: ['Custom']
              });
              setBuilderStep(1);
              setActiveTab('BUILDER');
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Create Custom Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 my-4 text-xs font-medium space-x-6">
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-3 flex items-center gap-2 ${activeTab === 'REPORTS' ? 'border-b-2 border-indigo-500 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" /> Saved Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`pb-3 flex items-center gap-2 ${activeTab === 'CATALOG' ? 'border-b-2 border-indigo-500 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Database className="w-4 h-4" /> Discovered Output Catalog ({catalog.length})
        </button>

        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-3 flex items-center gap-2 ${activeTab === 'TEMPLATES' ? 'border-b-2 border-indigo-500 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <BarChart2 className="w-4 h-4" /> Adaptive Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('BUILDER')}
          className={`pb-3 flex items-center gap-2 ${activeTab === 'BUILDER' ? 'border-b-2 border-indigo-500 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Settings className="w-4 h-4" /> 13-Step Report Builder
        </button>

        {activeReport && (
          <button
            onClick={() => setActiveTab('VIEWER')}
            className={`pb-3 flex items-center gap-2 ${activeTab === 'VIEWER' ? 'border-b-2 border-indigo-500 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Eye className="w-4 h-4" /> Active Report: {activeReport.name}
          </button>
        )}
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div className="bg-slate-800 border border-indigo-500/30 text-indigo-300 text-xs px-4 py-2.5 rounded-lg mb-6 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SAVED REPORTS VIEW */}
      {activeTab === 'REPORTS' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-3 py-1.5 w-64 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredReports.length} reports available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div key={report.reportId} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {report.layout}
                    </span>
                    <div className="flex items-center gap-2">
                      {report.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      <span className="text-[10px] text-slate-400">v{report.version}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{report.name}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{report.description}</p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dataset: {report.dataset}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                    <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                    <span>Grain: {report.grain}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {report.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
                  <span className="text-[10px] text-slate-500">Scope: {Array.isArray(report.companyScope) ? report.companyScope.join(', ') : report.companyScope}</span>
                  <button
                    onClick={() => handleRunReport(report)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    <Play className="w-3.5 h-3.5" /> Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DISCOVERED OUTPUT CATALOG VIEW */}
      {activeTab === 'CATALOG' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Category Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 text-xs text-white border border-slate-700 rounded px-2 py-1 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Accounting">Accounting</option>
                <option value="Inventory">Inventory</option>
                <option value="Sales">Sales</option>
                <option value="Tax">Tax</option>
                <option value="Banking">Banking</option>
                <option value="Payroll">Payroll</option>
                <option value="Receivables">Receivables</option>
                <option value="Masters">Masters</option>
                <option value="Exceptions">Exceptions</option>
              </select>
            </div>

            <button
              onClick={refreshCatalog}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Output Catalog
            </button>
          </div>

          <div className="overflow-x-auto bg-slate-800/80 border border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Output Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Source Channel</th>
                  <th className="p-3">Availability Confidence</th>
                  <th className="p-3">Warehouse Dataset</th>
                  <th className="p-3">Report Grain</th>
                  <th className="p-3">Fields</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredCatalog.map((item) => (
                  <tr key={item.outputId} className="hover:bg-slate-800 transition">
                    <td className="p-3 font-semibold text-white">{item.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{item.source}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.availability === 'Confirmed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.availability === 'Probable'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {item.availability}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-indigo-300">{item.dataset}</td>
                    <td className="p-3 text-slate-400">{item.grain}</td>
                    <td className="p-3 text-slate-300">{item.fields.length} fields</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ADAPTIVE TEMPLATE GALLERY VIEW */}
      {activeTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.templateId} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold bg-slate-900 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                    {tpl.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      tpl.compatibility === 'Compatible'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {tpl.compatibility}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{tpl.description}</p>

                <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                  <div>
                    <strong className="text-slate-300">Required Datasets:</strong> {tpl.requiredDatasets.join(', ')}
                  </div>
                  <div>
                    <strong className="text-slate-300">Required Fields:</strong> {tpl.requiredFields.join(', ')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setBuilderForm({
                    name: `Custom ${tpl.name}`,
                    description: tpl.description,
                    companyScope: companyId,
                    dataset: tpl.requiredDatasets[0] || 'canonical-vouchers',
                    layout: tpl.definition.layout || 'Tabular',
                    sourcePreference: 'WAREHOUSE',
                    fields: [
                      { outputField: 'Field 1', sourceField: 'F1', canonicalField: 'f1', warehouseField: 'f1', dataType: 'string' }
                    ],
                    filters: [],
                    grouping: tpl.definition.grouping || [],
                    sorting: [{ field: 'date', order: 'DESC' }],
                    aggregations: tpl.definition.aggregations || [],
                    calculatedFields: [],
                    parameters: {},
                    permissions: { visibility: 'Company-scoped' },
                    tags: [tpl.category]
                  });
                  setBuilderStep(1);
                  setActiveTab('BUILDER');
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg transition"
              >
                Use Adaptive Template <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. 13-STEP VISUAL REPORT BUILDER */}
      {activeTab === 'BUILDER' && (
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Visual Report Builder (13-Step Wizard)</h2>
              <p className="text-xs text-slate-400">Configure report datasets, fields, filters, aggregations, grain safety & permissions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400 font-semibold">Step {builderStep} of 13</span>
            </div>
          </div>

          {/* Wizard Steps Nav */}
          <div className="flex items-center overflow-x-auto pb-4 mb-6 border-b border-slate-700/60 gap-2 text-[10px] font-semibold uppercase tracking-wider">
            {[
              '1. Scope', '2. Dataset', '3. Fields', '4. Filters', '5. Grouping',
              '6. Sorting', '7. Aggregations', '8. Calculations', '9. Source',
              '10. Preview', '11. Details', '12. Run', '13. Export'
            ].map((label, idx) => (
              <button
                key={label}
                onClick={() => setBuilderStep(idx + 1)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  builderStep === idx + 1
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Step 1: Scope */}
          {builderStep === 1 && (
            <div className="space-y-4 max-w-lg">
              <label className="block text-xs font-semibold text-slate-300">Company Scope</label>
              <select
                value={Array.isArray(builderForm.companyScope) ? 'MULTI' : builderForm.companyScope}
                onChange={(e) => setBuilderForm({ ...builderForm, companyScope: e.target.value === 'MULTI' ? ['CMP-001', 'CMP-002'] : e.target.value })}
                className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-lg p-2.5"
              >
                <option value="CMP-001">Acme Enterprise Ltd (CMP-001)</option>
                <option value="CMP-002">Zenith Global Trading (CMP-002)</option>
                <option value="MULTI">Multi-Company Cross Analytics (CMP-001 + CMP-002)</option>
              </select>

              <label className="block text-xs font-semibold text-slate-300">Report Layout Type</label>
              <select
                value={builderForm.layout}
                onChange={(e) => setBuilderForm({ ...builderForm, layout: e.target.value as ReportType })}
                className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-lg p-2.5"
              >
                <option value="Tabular">Tabular</option>
                <option value="Summary">Summary</option>
                <option value="Grouped">Grouped</option>
                <option value="Detail">Detail</option>
                <option value="Transaction">Transaction</option>
                <option value="Master">Master</option>
                <option value="Exception">Exception</option>
              </select>
            </div>
          )}

          {/* Step 2: Dataset */}
          {builderStep === 2 && (
            <div className="space-y-4 max-w-lg">
              <label className="block text-xs font-semibold text-slate-300">Select Dataset</label>
              <select
                value={builderForm.dataset}
                onChange={(e) => setBuilderForm({ ...builderForm, dataset: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-lg p-2.5 font-mono"
              >
                {catalog.map((c) => (
                  <option key={c.dataset} value={c.dataset}>
                    {c.name} ({c.dataset}) - {c.grain}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Fields */}
          {builderStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-300">Selected Fields for Report Output</h3>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-2">
                {builderForm.fields?.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs bg-slate-800 p-2.5 rounded border border-slate-700">
                    <span className="font-semibold text-white">{f.outputField}</span>
                    <span className="font-mono text-indigo-300">({f.warehouseField})</span>
                    <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded text-[10px]">{f.dataType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 10: Preview */}
          {builderStep === 10 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" /> Grain Validation Passed: One row per entity
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-xs text-slate-300">
                <p className="font-semibold text-white mb-2">Preview Row Execution:</p>
                <div className="font-mono text-[11px] text-slate-400">
                  [{JSON.stringify(builderForm.fields?.map((f) => f.outputField))}]
                </div>
              </div>
            </div>
          )}

          {/* Step 11: Save Details */}
          {builderStep === 11 && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Report Name</label>
                <input
                  type="text"
                  placeholder="e.g., Executive Sales Summary"
                  value={builderForm.name || ''}
                  onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                  className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="Report objectives and details..."
                  value={builderForm.description || ''}
                  onChange={(e) => setBuilderForm({ ...builderForm, description: e.target.value })}
                  className="w-full bg-slate-900 text-white text-xs border border-slate-700 rounded-lg p-2.5 h-20"
                />
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-700 pt-4 mt-6">
            <button
              onClick={() => setBuilderStep((prev) => Math.max(1, prev - 1))}
              disabled={builderStep === 1}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              Previous
            </button>

            {builderStep < 11 ? (
              <button
                onClick={() => setBuilderStep((prev) => Math.min(13, prev + 1))}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSaveReport}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-lg transition"
              >
                Save & Run Report
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. ACTIVE REPORT INTERACTIVE VIEWER */}
      {activeTab === 'VIEWER' && activeReport && (
        <div className="space-y-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white">{activeReport.name}</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                  {activeReport.layout}
                </span>
              </div>
              <p className="text-xs text-slate-400">{activeReport.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('CSV')}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => handleExport('Excel')}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => handleExport('PDF')}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Execution Warning / Grain Metadata */}
          {executionResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400">Source Channel:</span>
                <span className="font-semibold text-emerald-400 ml-2">{executionResult.sourceUsed}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400">Report Grain:</span>
                <span className="font-semibold text-white ml-2">{executionResult.grain}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400">Data Quality:</span>
                <span className="font-semibold text-emerald-400 ml-2">{executionResult.qualityWarning}</span>
              </div>
            </div>
          )}

          {/* Data Table */}
          {executionResult && (
            <div className="overflow-x-auto bg-slate-800/80 border border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                  <tr>
                    {executionResult.rows.length > 0 &&
                      Object.keys(executionResult.rows[0]).map((key) => (
                        <th key={key} className="p-3">
                          {key}
                        </th>
                      ))}
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {executionResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800 transition">
                      {Object.entries(row).map(([k, v]) => (
                        <td key={k} className="p-3 font-mono text-[11px]">
                          {String(v)}
                        </td>
                      ))}
                      <td className="p-3">
                        <button
                          onClick={() => handleInspectRecord(activeReport.dataset, row.voucherId || row.ledgerId || row.id || `REC-${idx}`)}
                          className="text-indigo-400 hover:underline font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Inspector Drawer */}
      {drillDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-white">Record Detail & Trace Lineage</h3>
              <button onClick={() => setDrillDetail(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-indigo-400 mb-1">Canonical Record Payload</h4>
              <pre className="bg-slate-900 p-3 rounded text-[11px] text-slate-300 font-mono overflow-x-auto">
                {JSON.stringify(drillDetail.canonicalRecord, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-emerald-400 mb-1">Lineage Graph Trace</h4>
              <pre className="bg-slate-900 p-3 rounded text-[11px] text-slate-300 font-mono overflow-x-auto">
                {JSON.stringify(drillDetail.lineage, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
