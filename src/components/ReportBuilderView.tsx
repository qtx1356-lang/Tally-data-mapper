import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Eye,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Move,
  Settings,
  Layers,
  LayoutGrid,
  BarChart3,
  Table as TableIcon,
  Calculator,
  Type,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Sliders,
  DollarSign,
  Grid,
  Download,
  Filter,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  ReportDefinition,
  ReportComponent,
  ComponentType,
  TableColumnConfig,
  KPIConfig,
  ChartConfig,
  PivotConfig,
  CalculatedField,
  ReportParameter,
  ReportValidationResult
} from '../types/reports';

interface ReportBuilderViewProps {
  initialReportId?: string | null;
  onBackToLibrary: () => void;
}

const AVAILABLE_FIELDS = [
  { name: 'VoucherDate', label: 'Voucher Date', type: 'Date' },
  { name: 'VoucherNumber', label: 'Voucher Number', type: 'Text' },
  { name: 'PartyName', label: 'Customer / Party Name', type: 'Text' },
  { name: 'PartyGstin', label: 'GSTIN Number', type: 'Text' },
  { name: 'StateName', label: 'State Name', type: 'Text' },
  { name: 'VoucherTypeName', label: 'Voucher Type', type: 'Text' },
  { name: 'NetAmount', label: 'Taxable Amount (Net)', type: 'Currency' },
  { name: 'GstAmount', label: 'GST Amount (Tax)', type: 'Currency' },
  { name: 'TotalAmount', label: 'Total Amount (Gross)', type: 'Currency' },
  { name: 'ParentGroup', label: 'Ledger Parent Group', type: 'Text' },
  { name: 'LedgerName', label: 'Ledger Account', type: 'Text' },
  { name: 'ClosingBalance', label: 'Closing Balance', type: 'Currency' }
];

export const ReportBuilderView: React.FC<ReportBuilderViewProps> = ({
  initialReportId,
  onBackToLibrary
}) => {
  const [report, setReport] = useState<ReportDefinition>({
    id: `REP_${Math.floor(Math.random() * 90000) + 10000}`,
    name: 'New Custom Financial Report',
    description: 'Custom report designed with EXFIN Report Builder.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'EXFIN User',
    mappingId: 'MAP_1001',
    mappingName: 'GST Sales Register',
    components: [],
    calculatedFields: [],
    parameters: [
      { id: 'p1', name: 'fromDate', displayName: 'From Date', dataType: 'Date', defaultValue: '2026-04-01', required: true },
      { id: 'p2', name: 'toDate', displayName: 'To Date', dataType: 'Date', defaultValue: '2027-03-31', required: true }
    ],
    filters: [],
    theme: {
      id: 'THEME_BUS_CLASSIC',
      name: 'Professional Business',
      primaryFont: 'Inter, sans-serif',
      headingFont: 'Inter, sans-serif',
      primaryColor: '#0284c7',
      accentColor: '#10b981',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      borderStyle: '1px solid #1e293b'
    },
    pageSettings: { paperSize: 'A4', orientation: 'Landscape', margins: 'Normal' }
  });

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [designMode, setDesignMode] = useState<'Design' | 'Preview'>('Design');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationResult, setValidationResult] = useState<ReportValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [newFormulaName, setNewFormulaName] = useState('');
  const [newFormulaExpr, setNewFormulaExpr] = useState('');
  const [formulaError, setFormulaError] = useState<string | null>(null);

  // Undo/Redo history stacks
  const [history, setHistory] = useState<ReportDefinition[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (initialReportId) {
      fetch(`/api/reports/${initialReportId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setReport(data);
            if (data.components.length > 0) {
              setSelectedComponentId(data.components[0].id);
            }
          }
        })
        .catch((err) => console.error('Failed to load report definition', err));
    }
  }, [initialReportId]);

  const pushState = (updated: ReportDefinition) => {
    const newHist = history.slice(0, historyIndex + 1);
    setHistory([...newHist, updated]);
    setHistoryIndex(newHist.length);
    setReport(updated);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setReport(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setReport(history[historyIndex + 1]);
    }
  };

  const addComponent = (type: ComponentType) => {
    const id = `COMP_${type.toUpperCase()}_${Math.floor(Math.random() * 9000) + 1000}`;
    let newComp: ReportComponent = {
      id,
      type,
      title: `New ${type} Component`,
      x: 0,
      y: report.components.length * 2,
      w: type === 'KPICard' ? 3 : type === 'Text' ? 12 : 6,
      h: type === 'KPICard' ? 1 : type === 'Table' || type === 'Pivot' ? 3 : 2
    };

    if (type === 'KPICard') {
      newComp.kpiConfig = {
        title: 'TOTAL SALES',
        valueField: 'TotalAmount',
        aggregation: 'SUM',
        currencySymbol: '₹',
        useIndianFormat: true,
        subtitle: 'Selected financial period'
      };
    } else if (type === 'Table') {
      newComp.tableColumns = [
        { id: 'c1', sourceField: 'VoucherDate', displayName: 'Date', alignment: 'Left', format: 'Date', visible: true, sortable: true },
        { id: 'c2', sourceField: 'VoucherNumber', displayName: 'Voucher No', alignment: 'Left', format: 'Text', visible: true, sortable: true },
        { id: 'c3', sourceField: 'PartyName', displayName: 'Customer', alignment: 'Left', format: 'Text', visible: true, sortable: true },
        { id: 'c4', sourceField: 'TotalAmount', displayName: 'Total Amount', alignment: 'Right', format: 'Currency', currencySymbol: '₹', useIndianFormat: true, visible: true, sortable: true, aggregate: 'SUM' }
      ];
    } else if (type === 'Chart') {
      newComp.chartConfig = {
        chartType: 'Bar',
        categoryField: 'StateName',
        valueField: 'TotalAmount',
        aggregation: 'SUM',
        limit: 10,
        title: 'State Sales Breakdown',
        showLegend: true,
        showLabels: true
      };
    } else if (type === 'Pivot') {
      newComp.pivotConfig = {
        rows: ['PartyName'],
        columns: ['StateName'],
        values: [{ field: 'TotalAmount', aggregation: 'SUM', displayName: 'Sales ₹' }],
        filters: ['VoucherTypeName']
      };
    } else if (type === 'Text') {
      newComp.textContent = 'Enter custom section header or commentary here...';
      newComp.fontSize = 16;
      newComp.isBold = true;
      newComp.alignment = 'Left';
    }

    const updated = {
      ...report,
      components: [...report.components, newComp]
    };

    pushState(updated);
    setSelectedComponentId(id);
  };

  const removeComponent = (id: string) => {
    const updated = {
      ...report,
      components: report.components.filter((c) => c.id !== id)
    };
    pushState(updated);
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const updateSelectedComponent = (patch: Partial<ReportComponent>) => {
    if (!selectedComponentId) return;
    const updated = {
      ...report,
      components: report.components.map((c) =>
        c.id === selectedComponentId ? { ...c, ...patch } : c
      )
    };
    pushState(updated);
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      const isExisting = Boolean(initialReportId);
      const res = await fetch(`/api/reports${isExisting ? `/${report.id}` : ''}`, {
        method: isExisting ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleValidateReport = async () => {
    setValidating(true);
    try {
      const res = await fetch('/api/reports/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (e) {
      console.error('Validation failed', e);
    } finally {
      setValidating(false);
    }
  };

  const handleAddCalculatedField = () => {
    if (!newFormulaName.trim() || !newFormulaExpr.trim()) {
      setFormulaError('Formula name and expression are required.');
      return;
    }

    // Safety validation
    if (newFormulaExpr.includes('eval') || newFormulaExpr.includes('<script>') || newFormulaExpr.includes('process.')) {
      setFormulaError('Invalid or insecure syntax detected in formula expression.');
      return;
    }

    const newField: CalculatedField = {
      id: `CALC_${Math.floor(Math.random() * 9000) + 1000}`,
      name: newFormulaName.trim().replace(/\s+/g, ''),
      expression: newFormulaExpr.trim(),
      dataType: 'Decimal',
      format: 'Percentage'
    };

    const updated = {
      ...report,
      calculatedFields: [...report.calculatedFields, newField]
    };
    pushState(updated);

    setNewFormulaName('');
    setNewFormulaExpr('');
    setFormulaError(null);
    setShowFormulaModal(false);
  };

  const selectedComp = report.components.find((c) => c.id === selectedComponentId);

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-[#0B1120] px-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLibrary}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Library</span>
          </button>

          <span className="h-4 w-px bg-slate-800" />

          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-sky-400" />
            <input
              type="text"
              value={report.name}
              onChange={(e) => pushState({ ...report, name: e.target.value })}
              className="bg-transparent text-sm font-bold text-slate-100 border border-transparent hover:border-slate-700 focus:border-sky-500 rounded px-2 py-0.5 outline-none"
            />
            <span className="rounded bg-sky-950 border border-sky-800 px-2 py-0.5 text-[10px] font-mono text-sky-300">
              v{report.version}
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <span className="h-4 w-px bg-slate-800" />

          {/* Design / Preview Toggle */}
          <div className="flex rounded-md bg-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setDesignMode('Design')}
              className={`flex items-center space-x-1.5 rounded px-3 py-1 transition-colors ${
                designMode === 'Design' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Canvas Builder</span>
            </button>
            <button
              onClick={() => setDesignMode('Preview')}
              className={`flex items-center space-x-1.5 rounded px-3 py-1 transition-colors ${
                designMode === 'Preview' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Report Preview</span>
            </button>
          </div>

          <span className="h-4 w-px bg-slate-800" />

          {/* Validate Report */}
          <button
            onClick={handleValidateReport}
            disabled={validating}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-[#1E293B] px-3 py-1 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>{validating ? 'Validating...' : 'Validate'}</span>
          </button>

          {/* Save Report */}
          <button
            onClick={handleSaveReport}
            disabled={saving}
            className="flex items-center space-x-1.5 rounded bg-sky-600 px-4 py-1 text-xs font-semibold text-white shadow hover:bg-sky-500 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Report'}</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>Report definition saved successfully. (Version {report.version})</span>
          </div>
        </div>
      )}

      {/* Validation Result Modal / Alert */}
      {validationResult && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {validationResult.isValid ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <span className="font-semibold text-slate-200">
              Compatibility Status: {validationResult.status}
            </span>
            {validationResult.messages.length > 0 && (
              <span className="text-slate-400">
                ({validationResult.messages.length} diagnostic messages)
              </span>
            )}
          </div>
          <button
            onClick={() => setValidationResult(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3-Column Visual Report Designer Layout (Requirement 6, 79) */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLUMN 1: DATA PANEL (Left) */}
        <div className="w-64 border-r border-slate-800 bg-[#0B1120] p-3 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Data Source</span>
              <Layers className="h-3.5 w-3.5 text-sky-400" />
            </h3>
            <div className="rounded border border-slate-800 bg-[#1E293B] p-2 text-xs">
              <div className="font-semibold text-slate-200">{report.mappingName}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                ID: {report.mappingId}
              </div>
            </div>
          </div>

          {/* Add Component Palette */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Add Components
            </h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => addComponent('KPICard')}
                className="flex items-center space-x-1.5 rounded border border-slate-800 bg-[#1E293B] p-2 hover:bg-slate-700 text-slate-200 text-left transition-colors"
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span>KPI Card</span>
              </button>
              <button
                onClick={() => addComponent('Chart')}
                className="flex items-center space-x-1.5 rounded border border-slate-800 bg-[#1E293B] p-2 hover:bg-slate-700 text-slate-200 text-left transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
                <span>Chart</span>
              </button>
              <button
                onClick={() => addComponent('Table')}
                className="flex items-center space-x-1.5 rounded border border-slate-800 bg-[#1E293B] p-2 hover:bg-slate-700 text-slate-200 text-left transition-colors"
              >
                <TableIcon className="h-3.5 w-3.5 text-amber-400" />
                <span>Table</span>
              </button>
              <button
                onClick={() => addComponent('Pivot')}
                className="flex items-center space-x-1.5 rounded border border-slate-800 bg-[#1E293B] p-2 hover:bg-slate-700 text-slate-200 text-left transition-colors"
              >
                <Grid className="h-3.5 w-3.5 text-purple-400" />
                <span>Pivot</span>
              </button>
              <button
                onClick={() => addComponent('Text')}
                className="flex items-center space-x-1.5 rounded border border-slate-800 bg-[#1E293B] p-2 hover:bg-slate-700 text-slate-200 text-left transition-colors col-span-2"
              >
                <Type className="h-3.5 w-3.5 text-indigo-400" />
                <span>Text Header / Section</span>
              </button>
            </div>
          </div>

          {/* Mapped Fields List */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Mapped Source Fields
            </h3>
            <div className="space-y-1">
              {AVAILABLE_FIELDS.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between rounded border border-slate-800/80 bg-[#1E293B]/60 px-2 py-1.5 text-xs text-slate-300 hover:border-slate-700"
                >
                  <span className="font-mono text-[11px] text-slate-200">{f.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{f.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculated Fields Section (Requirement 58, 59) */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Calculated Fields
              </h3>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="p-1 text-sky-400 hover:text-sky-300"
                title="Add Calculated Field"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {report.calculatedFields.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">No calculated formulas defined.</div>
            ) : (
              <div className="space-y-1">
                {report.calculatedFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="rounded border border-sky-900/60 bg-sky-950/40 p-1.5 text-xs"
                  >
                    <div className="font-semibold text-sky-300 flex items-center justify-between">
                      <span>{cf.name}</span>
                      <span className="text-[9px] text-sky-400 uppercase font-mono">{cf.format}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      = {cf.expression}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: REPORT CANVAS (Center) */}
        <div className="flex-1 bg-[#0F172A] p-6 overflow-y-auto">
          {designMode === 'Preview' ? (
            /* PREVIEW MODE */
            <div className="max-w-5xl mx-auto space-y-6 bg-[#0B1120] border border-slate-800 rounded-xl p-8 shadow-2xl">
              {/* Report Title & Metadata Header */}
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-wide text-slate-100">{report.name}</h1>
                  <p className="text-xs text-slate-400 mt-1">{report.description}</p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-sky-950 border border-sky-800 px-3 py-1 text-xs font-mono font-medium text-sky-300">
                    EXFIN MAPPED REPORT
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Generated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Render Preview Component Grid */}
              <div className="grid grid-cols-12 gap-4">
                {report.components.map((comp) => (
                  <div
                    key={comp.id}
                    className={`col-span-${comp.w} rounded-lg border border-slate-800 bg-[#1E293B] p-4`}
                  >
                    {comp.type === 'KPICard' && comp.kpiConfig && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {comp.kpiConfig.title}
                        </div>
                        <div className="text-2xl font-black text-slate-100 mt-1">
                          {comp.kpiConfig.currencySymbol} 24,52,000.00
                        </div>
                        {comp.kpiConfig.percentageChange && (
                          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center space-x-1">
                            <span>↑ {comp.kpiConfig.percentageChange}%</span>
                            <span className="text-slate-400 font-normal">
                              {comp.kpiConfig.subtitle}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {comp.type === 'Table' && comp.tableColumns && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-3">{comp.title}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#0B1120] text-slate-400 font-semibold border-b border-slate-800">
                              <tr>
                                {comp.tableColumns.map((col) => (
                                  <th key={col.id} className="p-2">
                                    {col.displayName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                              <tr>
                                <td className="p-2">2026-04-10</td>
                                <td className="p-2">INV-2026-1001</td>
                                <td className="p-2">ABC INDUSTRIES LTD</td>
                                <td className="p-2">19AAACB1001C1Z5</td>
                                <td className="p-2">West Bengal</td>
                                <td className="p-2 text-right font-bold text-sky-300">₹ 85,000.00</td>
                                <td className="p-2 text-right text-emerald-400">₹ 15,300.00</td>
                                <td className="p-2 text-right font-bold text-white">₹ 1,00,300.00</td>
                              </tr>
                              <tr>
                                <td className="p-2">2026-04-12</td>
                                <td className="p-2">INV-2026-1002</td>
                                <td className="p-2">XYZ INFOTECH PVT LTD</td>
                                <td className="p-2">27AAACB1002C1Z5</td>
                                <td className="p-2">Maharashtra</td>
                                <td className="p-2 text-right font-bold text-sky-300">₹ 1,40,000.00</td>
                                <td className="p-2 text-right text-emerald-400">₹ 25,200.00</td>
                                <td className="p-2 text-right font-bold text-white">₹ 1,65,200.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {comp.type === 'Chart' && comp.chartConfig && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-2">
                          {comp.chartConfig.title}
                        </h4>
                        <div className="h-40 bg-[#0B1120] rounded border border-slate-800/80 p-4 flex items-end justify-between space-x-2">
                          <div className="w-12 bg-sky-500 h-28 rounded-t text-[10px] text-center pt-1 text-white font-bold">
                            WB
                          </div>
                          <div className="w-12 bg-sky-500 h-36 rounded-t text-[10px] text-center pt-1 text-white font-bold">
                            MH
                          </div>
                          <div className="w-12 bg-sky-500 h-20 rounded-t text-[10px] text-center pt-1 text-white font-bold">
                            KA
                          </div>
                          <div className="w-12 bg-sky-500 h-24 rounded-t text-[10px] text-center pt-1 text-white font-bold">
                            DL
                          </div>
                          <div className="w-12 bg-sky-500 h-16 rounded-t text-[10px] text-center pt-1 text-white font-bold">
                            TN
                          </div>
                        </div>
                      </div>
                    )}

                    {comp.type === 'Text' && (
                      <div
                        className={`text-${comp.alignment?.toLowerCase() || 'left'} text-${
                          comp.fontSize || 16
                        }px ${comp.isBold ? 'font-bold' : ''} text-slate-200`}
                      >
                        {comp.textContent}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DESIGN CANVAS MODE */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Visual Canvas (Grid Snap Enabled)</span>
                <span>{report.components.length} Components Placed</span>
              </div>

              {report.components.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-[#0B1120] p-12 text-center space-y-3">
                  <LayoutGrid className="h-10 w-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-300">
                    Report Canvas is Empty
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click component buttons in the left Data panel (KPI Card, Chart, Table, Pivot, Text) to add components to your report layout.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  {report.components.map((comp) => {
                    const isSelected = comp.id === selectedComponentId;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedComponentId(comp.id)}
                        className={`col-span-${comp.w} rounded-lg border p-4 transition-all relative cursor-pointer ${
                          isSelected
                            ? 'border-sky-500 bg-[#1E293B] shadow-[0_0_15px_rgba(2,132,199,0.3)] ring-1 ring-sky-500'
                            : 'border-slate-800 bg-[#1E293B]/70 hover:border-slate-700'
                        }`}
                      >
                        {/* Drag / Remove Top Controls */}
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeComponent(comp.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Remove Component"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Component Visual Stub */}
                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1 flex items-center space-x-1">
                          <Move className="h-3 w-3 text-slate-500" />
                          <span>{comp.type} COMPONENT</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-100">{comp.title}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 3: PROPERTIES INSPECTOR (Right) */}
        <div className="w-80 border-l border-slate-800 bg-[#0B1120] p-4 flex flex-col space-y-4 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
            <Sliders className="h-3.5 w-3.5 text-sky-400" />
            <span>Property Inspector</span>
          </h3>

          {!selectedComp ? (
            <div className="text-xs text-slate-500 italic p-4 text-center">
              Select a component on the canvas to inspect and customize its formatting, field bindings, and styling properties.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Component Title */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Component Title</label>
                <input
                  type="text"
                  value={selectedComp.title || ''}
                  onChange={(e) => updateSelectedComponent({ title: e.target.value })}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-1.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              {/* Grid Width Span */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Grid Span Width (1 - 12)</label>
                <select
                  value={selectedComp.w}
                  onChange={(e) => updateSelectedComponent({ w: parseInt(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-2 py-1.5 text-slate-100 outline-none focus:border-sky-500"
                >
                  <option value={3}>3 Columns (Quarter Width)</option>
                  <option value={4}>4 Columns (Third Width)</option>
                  <option value={6}>6 Columns (Half Width)</option>
                  <option value={12}>12 Columns (Full Width)</option>
                </select>
              </div>

              {/* KPI Specific Properties */}
              {selectedComp.type === 'KPICard' && selectedComp.kpiConfig && (
                <div className="space-y-3 border-t border-slate-800 pt-3">
                  <h4 className="font-bold text-slate-300">KPI Card Configuration</h4>
                  <div>
                    <label className="block text-slate-400 mb-1">Value Field</label>
                    <select
                      value={selectedComp.kpiConfig.valueField}
                      onChange={(e) =>
                        updateSelectedComponent({
                          kpiConfig: { ...selectedComp.kpiConfig!, valueField: e.target.value }
                        })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-100"
                    >
                      {AVAILABLE_FIELDS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.label} ({f.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Aggregation</label>
                    <select
                      value={selectedComp.kpiConfig.aggregation}
                      onChange={(e) =>
                        updateSelectedComponent({
                          kpiConfig: {
                            ...selectedComp.kpiConfig!,
                            aggregation: e.target.value as any
                          }
                        })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-100"
                    >
                      <option value="SUM">SUM</option>
                      <option value="COUNT">COUNT</option>
                      <option value="AVG">AVG</option>
                      <option value="MIN">MIN</option>
                      <option value="MAX">MAX</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Chart Specific Properties */}
              {selectedComp.type === 'Chart' && selectedComp.chartConfig && (
                <div className="space-y-3 border-t border-slate-800 pt-3">
                  <h4 className="font-bold text-slate-300">Chart Configuration</h4>
                  <div>
                    <label className="block text-slate-400 mb-1">Chart Type</label>
                    <select
                      value={selectedComp.chartConfig.chartType}
                      onChange={(e) =>
                        updateSelectedComponent({
                          chartConfig: { ...selectedComp.chartConfig!, chartType: e.target.value as any }
                        })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-100"
                    >
                      <option value="Bar">Bar Chart</option>
                      <option value="Column">Column Chart</option>
                      <option value="Line">Line Chart</option>
                      <option value="Area">Area Chart</option>
                      <option value="Pie">Pie Chart</option>
                      <option value="Donut">Donut Chart</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Category Axis (X)</label>
                    <select
                      value={selectedComp.chartConfig.categoryField}
                      onChange={(e) =>
                        updateSelectedComponent({
                          chartConfig: { ...selectedComp.chartConfig!, categoryField: e.target.value }
                        })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-100"
                    >
                      {AVAILABLE_FIELDS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Value Field (Y)</label>
                    <select
                      value={selectedComp.chartConfig.valueField}
                      onChange={(e) =>
                        updateSelectedComponent({
                          chartConfig: { ...selectedComp.chartConfig!, valueField: e.target.value }
                        })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-100"
                    >
                      {AVAILABLE_FIELDS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Calculated Field Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0B1120] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-sky-400" />
                <span>Add Calculated Formula Field</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formulaError && (
              <div className="rounded border border-rose-900/60 bg-rose-950/40 p-2 text-xs text-rose-300">
                {formulaError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Field Name</label>
                <input
                  type="text"
                  placeholder="e.g. TaxMarginPct"
                  value={newFormulaName}
                  onChange={(e) => setNewFormulaName(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Formula Expression</label>
                <input
                  type="text"
                  placeholder="e.g. (GstAmount / TotalAmount) * 100"
                  value={newFormulaExpr}
                  onChange={(e) => setNewFormulaExpr(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Use valid arithmetic operators (+, -, *, /). Division by zero is automatically handled cleanly as 0.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCalculatedField}
                className="rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
