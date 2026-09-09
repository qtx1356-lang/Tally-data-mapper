import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  FileJson,
  Database,
  Building2,
  Layers,
  FolderOpen,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  Settings2,
  Copy,
  Hash,
  ArrowRight
} from 'lucide-react';

interface ExportDataViewProps {
  selectedCompany?: any;
  initialMappingId?: string | null;
  onNavigateToHistory?: () => void;
  onNavigateToProfiles?: () => void;
}

export const ExportDataView: React.FC<ExportDataViewProps> = ({
  selectedCompany,
  initialMappingId,
  onNavigateToHistory,
  onNavigateToProfiles
}) => {
  const [mappings, setMappings] = useState<any[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<string>(initialMappingId || '');
  const [selectedMapping, setSelectedMapping] = useState<any | null>(null);
  const [format, setFormat] = useState<'Excel' | 'Csv' | 'Json' | 'Xml' | 'Sqlite'>('Excel');

  // Format Specific Options
  const [excelOpts, setExcelOpts] = useState({
    worksheetName: 'SalesData',
    includeHeaders: true,
    freezeHeader: true,
    autoSizeColumns: true,
    dateFormat: 'yyyy-MM-dd',
    decimalPlaces: 2,
    nullRepresentation: ''
  });

  const [csvOpts, setCsvOpts] = useState({
    delimiter: ',',
    useUtf8Bom: false,
    includeHeaders: true,
    quoteHandling: 'Auto',
    nullRepresentation: ''
  });

  const [jsonOpts, setJsonOpts] = useState({
    formatStyle: 'MetadataAndData',
    indented: true
  });

  const [xmlOpts, setXmlOpts] = useState({
    rootElementName: 'ExportData',
    rowElementName: 'Row',
    includeMetadata: true
  });

  const [sqliteOpts, setSqliteOpts] = useState({
    tableName: 'SalesRegister',
    overwriteMode: 'Replace'
  });

  const [globalOpts, setGlobalOpts] = useState({
    stopOnRowError: false,
    generateErrorCsv: true,
    calculateSha256Hash: true,
    overwritePolicy: 'Overwrite'
  });

  // Destination Path & Tokens
  const [destinationPath, setDestinationPath] = useState<string>('C:\\Exports\\{company}\\{mapping}-{date}.xlsx');
  const [resolvedPath, setResolvedPath] = useState<string>('');

  // Workflow Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState({
    step: 'Preparing',
    message: 'Validating mapping and company context...',
    recordsProcessed: 0,
    totalRecords: 12450
  });

  const [exportResult, setExportResult] = useState<any | null>(null);
  const [saveProfileName, setSaveProfileName] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState<boolean>(false);

  // Load Saved Mappings
  useEffect(() => {
    fetch('/api/mappings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMappings(data);
          if (data.length > 0 && !selectedMappingId) {
            setSelectedMappingId(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update Selected Mapping Details
  useEffect(() => {
    if (selectedMappingId) {
      const found = mappings.find((m) => m.id === selectedMappingId);
      if (found) {
        setSelectedMapping(found);
      } else {
        fetch(`/api/mappings/${selectedMappingId}`)
          .then((res) => res.json())
          .then((data) => setSelectedMapping(data))
          .catch(() => {});
      }
    }
  }, [selectedMappingId, mappings]);

  // Update Default Path Extension on Format Change
  useEffect(() => {
    const extMap: Record<string, string> = {
      Excel: '.xlsx',
      Csv: '.csv',
      Json: '.json',
      Xml: '.xml',
      Sqlite: '.db'
    };
    const newExt = extMap[format] || '.xlsx';

    if (destinationPath) {
      const pathWithoutExt = destinationPath.replace(/\.(xlsx|csv|json|xml|db)$/i, '');
      setDestinationPath(`${pathWithoutExt}${newExt}`);
    }
  }, [format]);

  // Resolve Path Preview via API
  useEffect(() => {
    const compName = selectedCompany?.companyName || 'ABC TRADING PVT LTD';
    const mapName = selectedMapping?.name || 'GST Sales Register';

    fetch('/api/export/resolve-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawPath: destinationPath,
        companyName: compName,
        mappingName: mapName
      })
    })
      .then((res) => res.json())
      .then((data) => setResolvedPath(data.resolvedPath || destinationPath))
      .catch(() => setResolvedPath(destinationPath));
  }, [destinationPath, selectedCompany, selectedMapping]);

  const insertToken = (token: string) => {
    setDestinationPath((prev) => `${prev} ${token}`.replace(/\s+/g, ' '));
  };

  const handleStartExport = () => {
    setIsExporting(true);
    setExportResult(null);

    // Simulated Export Progress Steps
    const steps = [
      { step: 'Validating mapping', msg: 'Verifying Tally ODBC schema and filter rules...', delay: 400 },
      { step: 'Connecting to Tally', msg: 'Establishing session context with active company...', delay: 800 },
      { step: 'Executing query', msg: 'Fetching normalized records from Tally engine...', delay: 1300 },
      { step: 'Transforming records', msg: 'Applying field expressions and data sanitization...', delay: 1800 },
      { step: 'Writing output', msg: `Stream writing ${format.toUpperCase()} rows to atomic temporary file...`, delay: 2400 },
      { step: 'Finalizing', msg: 'Verifying file integrity and atomic rename...', delay: 3000 }
    ];

    steps.forEach(({ step, msg, delay }) => {
      setTimeout(() => {
        setExportProgress((prev) => ({
          ...prev,
          step,
          message: msg,
          recordsProcessed: Math.min(prev.totalRecords, Math.floor((delay / 3000) * prev.totalRecords))
        }));
      }, delay);
    });

    setTimeout(() => {
      const compName = selectedCompany?.companyName || 'ABC TRADING PVT LTD';
      const mapName = selectedMapping?.name || 'GST Sales Register';

      fetch('/api/export/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappingId: selectedMappingId,
          mapping: selectedMapping,
          companyId: selectedCompany?.companyId || 'COMP_001',
          companyName: compName,
          format,
          destinationPath,
          options: {
            excel: excelOpts,
            csv: csvOpts,
            json: jsonOpts,
            xml: xmlOpts,
            sqlite: sqliteOpts,
            ...globalOpts
          }
        })
      })
        .then((res) => res.json())
        .then((data) => {
          setIsExporting(false);
          setExportResult(data);
        })
        .catch((err) => {
          setIsExporting(false);
          setExportResult({
            success: false,
            status: 'Failed',
            errors: [err.message || 'Export failed to execute.']
          });
        });
    }, 3400);
  };

  const handleSaveProfile = () => {
    if (!saveProfileName.trim()) return;
    setIsSavingProfile(true);

    fetch('/api/export/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: saveProfileName,
        mappingId: selectedMappingId,
        mappingName: selectedMapping?.name || 'Output Mapping',
        companyId: selectedCompany?.companyId || 'COMP_001',
        format,
        destinationPath,
        options: {
          excel: excelOpts,
          csv: csvOpts,
          json: jsonOpts,
          xml: xmlOpts,
          sqlite: sqliteOpts,
          ...globalOpts
        }
      })
    })
      .then((res) => res.json())
      .then(() => {
        setIsSavingProfile(false);
        setShowProfileSuccess(true);
        setSaveProfileName('');
        setTimeout(() => setShowProfileSuccess(false), 3000);
      })
      .catch(() => setIsSavingProfile(false));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">EXPORT DATA STUDIO</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
              Production Export Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Export validated, transformed Tally data directly to Excel, CSV, JSON, XML, or SQLite database.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToProfiles && (
            <button
              onClick={onNavigateToProfiles}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Profiles</span>
            </button>
          )}
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Export History</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form Box matching prompt ASCII structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mapping Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Output Mapping</span>
            </label>
            <select
              value={selectedMappingId}
              onChange={(e) => setSelectedMappingId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {mappings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.fields?.length || 0} fields • {m.status || 'Valid'})
                </option>
              ))}
            </select>
            {selectedMapping && (
              <p className="text-[11px] text-slate-400">
                Source Entity: <span className="text-slate-200 font-mono">{selectedMapping.sourceEntity}</span> • Version: v{selectedMapping.version || 1}
              </p>
            )}
          </div>

          {/* Active Company Context */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Tally Company</span>
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-emerald-400">
                  {selectedCompany?.companyName || 'ABC TRADING PVT LTD'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Tally ID: <span className="font-mono">{selectedCompany?.companyId || 'COMP_001'}</span> • Read-Only Verified
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-medium">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Export Format Selection */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Export Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'Excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet, color: 'text-emerald-400' },
              { id: 'Csv', label: 'CSV (.csv)', icon: FileText, color: 'text-amber-400' },
              { id: 'Json', label: 'JSON (.json)', icon: FileJson, color: 'text-sky-400' },
              { id: 'Xml', label: 'XML (.xml)', icon: FileCode, color: 'text-orange-400' },
              { id: 'Sqlite', label: 'SQLite (.db)', icon: Database, color: 'text-purple-400' }
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = format === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${fmt.color}`} />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Specific Options Inspector */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Format Options — {format}</span>
            </h3>
            <span className="text-[10px] text-slate-500">Configured for {format} Export Provider</span>
          </div>

          {format === 'Excel' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Worksheet Name</label>
                <input
                  type="text"
                  value={excelOpts.worksheetName}
                  onChange={(e) => setExcelOpts({ ...excelOpts, worksheetName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Date Format</label>
                <select
                  value={excelOpts.dateFormat}
                  onChange={(e) => setExcelOpts({ ...excelOpts, dateFormat: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="yyyy-MM-dd">YYYY-MM-DD (2026-09-07)</option>
                  <option value="dd/MM/yyyy">DD/MM/YYYY (07/09/2026)</option>
                  <option value="MM/dd/yyyy">MM/DD/YYYY (09/07/2026)</option>
                </select>
              </div>
              <div className="flex flex-col justify-center space-y-1 pt-3">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excelOpts.includeHeaders}
                    onChange={(e) => setExcelOpts({ ...excelOpts, includeHeaders: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Include Header Row</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excelOpts.freezeHeader}
                    onChange={(e) => setExcelOpts({ ...excelOpts, freezeHeader: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Freeze Top Header Row</span>
                </label>
              </div>
            </div>
          )}

          {format === 'Csv' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Delimiter</label>
                <select
                  value={csvOpts.delimiter}
                  onChange={(e) => setCsvOpts({ ...csvOpts, delimiter: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab (\t)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Null Representation</label>
                <input
                  type="text"
                  placeholder="(Blank)"
                  value={csvOpts.nullRepresentation}
                  onChange={(e) => setCsvOpts({ ...csvOpts, nullRepresentation: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col justify-center space-y-1 pt-3">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={csvOpts.useUtf8Bom}
                    onChange={(e) => setCsvOpts({ ...csvOpts, useUtf8Bom: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>UTF-8 with BOM</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={csvOpts.includeHeaders}
                    onChange={(e) => setCsvOpts({ ...csvOpts, includeHeaders: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Include Headers</span>
                </label>
              </div>
            </div>
          )}

          {format === 'Json' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">JSON Format Structure</label>
                <select
                  value={jsonOpts.formatStyle}
                  onChange={(e) => setJsonOpts({ ...jsonOpts, formatStyle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="MetadataAndData">Metadata + Data Array</option>
                  <option value="DataOnly">Data Array Only</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-5">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jsonOpts.indented}
                    onChange={(e) => setJsonOpts({ ...jsonOpts, indented: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Pretty Indented JSON</span>
                </label>
              </div>
            </div>
          )}

          {format === 'Xml' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Root Element Tag</label>
                <input
                  type="text"
                  value={xmlOpts.rootElementName}
                  onChange={(e) => setXmlOpts({ ...xmlOpts, rootElementName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Row Element Tag</label>
                <input
                  type="text"
                  value={xmlOpts.rowElementName}
                  onChange={(e) => setXmlOpts({ ...xmlOpts, rowElementName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center space-x-2 pt-5">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={xmlOpts.includeMetadata}
                    onChange={(e) => setXmlOpts({ ...xmlOpts, includeMetadata: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Include XML Metadata Block</span>
                </label>
              </div>
            </div>
          )}

          {format === 'Sqlite' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Database Table Name</label>
                <input
                  type="text"
                  value={sqliteOpts.tableName}
                  onChange={(e) => setSqliteOpts({ ...sqliteOpts, tableName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Table Mode</label>
                <select
                  value={sqliteOpts.overwriteMode}
                  onChange={(e) => setSqliteOpts({ ...sqliteOpts, overwriteMode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Replace">Replace Table (DROP & CREATE)</option>
                  <option value="Append">Append Rows to Existing Table</option>
                  <option value="Overwrite">Overwrite Database File</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Destination Path Box with Filename Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Destination Path</span>
            </label>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400 mr-1">Insert Token:</span>
              {['{date}', '{time}', '{datetime}', '{company}', '{mapping}'].map((tok) => (
                <button
                  key={tok}
                  onClick={() => insertToken(tok)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[10px] rounded border border-slate-700 transition"
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Realtime Resolved Path Preview */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded p-2.5 flex items-center space-x-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Resolved Output File:</span>
            <span className="font-mono text-emerald-300 truncate">{resolvedPath}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-4 gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Profile Name (e.g. Daily Sales Excel)"
              value={saveProfileName}
              onChange={(e) => setSaveProfileName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-48"
            />
            <button
              onClick={handleSaveProfile}
              disabled={!saveProfileName.trim() || isSavingProfile}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save as Profile</span>
            </button>
            {showProfileSuccess && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Preview</span>
            </button>

            <button
              onClick={handleStartExport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-950/40 flex items-center space-x-2 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>EXPORT NOW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Export Configuration Preview</span>
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Mapping:</span>
                  <span className="font-semibold text-slate-200">{selectedMapping?.name || 'Output Mapping'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Company:</span>
                  <span className="font-semibold text-emerald-400">{selectedCompany?.companyName || 'ABC TRADING PVT LTD'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Export Format:</span>
                  <span className="font-semibold text-sky-400">{format}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Output Columns:</span>
                  <span className="font-mono text-slate-200">{selectedMapping?.fields?.length || 0} fields mapped</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Target Path:</span>
                <p className="font-mono text-emerald-300 bg-slate-950 p-2 rounded border border-slate-800 break-all">
                  {resolvedPath}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Mapped Output Schema:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedMapping?.fields || []).map((f: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-[11px]"
                    >
                      {f.outputName || f.sourcePath}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Execution Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Export in Progress...</h3>
                <p className="text-xs text-slate-400">{exportProgress.step}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>Records Processed:</span>
                <span>{exportProgress.recordsProcessed.toLocaleString()} / {exportProgress.totalRecords.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(exportProgress.recordsProcessed / exportProgress.totalRecords) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 italic text-center pt-1">{exportProgress.message}</p>
            </div>

            <div className="flex justify-center border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsExporting(false)}
                className="px-4 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-medium rounded transition"
              >
                Cancel Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Completion / Result Modal */}
      {exportResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              {exportResult.success ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
              )}
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {exportResult.success ? 'EXPORT COMPLETE' : 'EXPORT FAILED'}
                </h3>
                <p className="text-xs text-slate-400">
                  {exportResult.success ? 'Data exported successfully to local destination.' : 'An error occurred during export.'}
                </p>
              </div>
            </div>

            {exportResult.success && exportResult.statistics && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Records Exported:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {exportResult.statistics.recordsWritten.toLocaleString()} rows
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Format:</span>
                  <span className="font-medium text-slate-200">{format}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-mono text-slate-200">{(exportResult.statistics.durationMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-mono text-slate-200">{(exportResult.statistics.bytesWritten / 1024).toFixed(1)} KB</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Destination File:</span>
                  <span className="font-mono text-emerald-300 break-all text-[11px]">
                    {exportResult.destinationPath}
                  </span>
                </div>
              </div>
            )}

            {!exportResult.success && (
              <div className="bg-rose-950/30 border border-rose-900/60 rounded p-3 text-xs text-rose-300 space-y-1">
                <span className="font-semibold block">Error Details:</span>
                <p>{exportResult.errors?.[0] || 'Unknown export error'}</p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                onClick={() => setExportResult(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded"
              >
                Close
              </button>
              {onNavigateToHistory && (
                <button
                  onClick={() => {
                    setExportResult(null);
                    onNavigateToHistory();
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition"
                >
                  View Export History
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
