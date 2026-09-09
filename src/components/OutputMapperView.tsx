import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Settings2,
  Filter,
  Sliders,
  RefreshCw,
  Code2,
  Info,
  Copy,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  FileCode,
  Table
} from 'lucide-react';

interface OutputMapperViewProps {
  selectedCompany: any;
  mappingIdToLoad?: string | null;
  onOpenTemplatesLibrary?: () => void;
}

export const OutputMapperView: React.FC<OutputMapperViewProps> = ({
  selectedCompany,
  mappingIdToLoad,
  onOpenTemplatesLibrary
}) => {
  const companyId = selectedCompany ? selectedCompany.name : 'DEFAULT_COMP';

  // Discovery Model State
  const [unifiedModel, setUnifiedModel] = useState<any>(null);
  const [availablePaths, setAvailablePaths] = useState<any[]>([]);
  const [pathSearch, setPathSearch] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState('All');

  // Mapping State
  const [mapping, setMapping] = useState<any>({
    id: `MAP_${Math.floor(Math.random() * 90000) + 10000}`,
    name: 'New Output Mapping',
    description: 'Custom output mapping specification',
    companyId: companyId,
    sourceEntity: 'Voucher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    status: 'Draft',
    fields: [
      { id: 'f1', sourcePath: 'Voucher.Date', outputName: 'invoice_date', outputDataType: 'Date', ordinal: 1, transformation: 'FORMAT_DATE', transformationParameter: 'yyyy-MM-dd', isRequired: true, isVisible: true, oneToManyStrategy: 'ExpandRows' },
      { id: 'f2', sourcePath: 'Voucher.VoucherNumber', outputName: 'invoice_no', outputDataType: 'String', ordinal: 2, transformation: 'None', isRequired: true, isVisible: true, oneToManyStrategy: 'ExpandRows' },
      { id: 'f3', sourcePath: 'Voucher.Party.Name', outputName: 'customer_name', outputDataType: 'String', ordinal: 3, transformation: 'UPPER', isRequired: true, isVisible: true, oneToManyStrategy: 'ExpandRows' },
      { id: 'f4', sourcePath: 'Voucher.Party.GSTIN', outputName: 'gstin', outputDataType: 'String', ordinal: 4, transformation: 'None', defaultValue: 'URP', isRequired: false, isVisible: true, oneToManyStrategy: 'ExpandRows' },
      { id: 'f5', sourcePath: 'Voucher.Amount', outputName: 'invoice_amount', outputDataType: 'Decimal', ordinal: 5, transformation: 'ROUND', transformationParameter: '2', isRequired: true, isVisible: true, oneToManyStrategy: 'ExpandRows' }
    ],
    rootFilter: {
      id: 'rf1',
      logicalOperator: 'AND',
      rules: [
        { id: 'r1', fieldPath: 'Voucher.VoucherTypeName', operator: 'Equals', value: 'Sales' }
      ],
      subGroups: []
    },
    parameters: [
      { name: 'FromDate', displayName: 'From Date', dataType: 'Date', defaultValue: '2026-04-01', currentValue: '2026-04-01' },
      { name: 'ToDate', displayName: 'To Date', dataType: 'Date', defaultValue: '2027-03-31', currentValue: '2027-03-31' }
    ],
    configuration: {
      defaultOneToManyHandling: 'ExpandRows',
      errorStrategy: 'ContinueAndReport',
      isPortableTemplate: true,
      maxPreviewRows: 100
    }
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('f1');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isExecutingPreview, setIsExecutingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'Fields' | 'Filters' | 'Parameters' | 'Validation' | 'Preview'>('Fields');

  // Load Mapping or Unified Metadata on Mount/Change
  useEffect(() => {
    fetchUnifiedDiscovery();
  }, [companyId]);

  useEffect(() => {
    if (mappingIdToLoad) {
      loadMapping(mappingIdToLoad);
    }
  }, [mappingIdToLoad]);

  const fetchUnifiedDiscovery = () => {
    fetch(`/api/odbc/unified-discovery?companyId=${encodeURIComponent(companyId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.model) {
          setUnifiedModel(data.model);
          if (data.model.canonicalPaths) {
            setAvailablePaths(data.model.canonicalPaths);
          }
        }
      })
      .catch(() => {});
  };

  const loadMapping = (id: string) => {
    fetch(`/api/mappings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.mapping) {
          setMapping(data.mapping);
          if (data.mapping.fields && data.mapping.fields.length > 0) {
            setSelectedFieldId(data.mapping.fields[0].id);
          }
        }
      })
      .catch(() => {});
  };

  const handleSaveMapping = () => {
    fetch('/api/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMapping(data.mapping);
          alert('Mapping saved successfully!');
        }
      })
      .catch(() => alert('Failed to save mapping.'));
  };

  const handleValidateMapping = () => {
    fetch('/api/mappings/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapping, discoveryModel: unifiedModel })
    })
      .then((res) => res.json())
      .then((data) => {
        setValidationResult(data.validation);
        setActiveTab('Validation');
      })
      .catch(() => {});
  };

  const handleRunPreview = () => {
    setIsExecutingPreview(true);
    fetch('/api/mappings/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapping, limit: mapping.configuration?.maxPreviewRows || 100 })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsExecutingPreview(false);
        setPreviewResult(data.result);
        setActiveTab('Preview');
      })
      .catch(() => {
        setIsExecutingPreview(false);
      });
  };

  const handleExportExfinMap = () => {
    fetch('/api/mappings/export-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapping })
    })
      .then((res) => res.json())
      .then((data) => {
        const blob = new Blob([data.jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  const handleImportExfinMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      fetch('/api/mappings/import-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonContent: content })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.mapping) {
            setMapping(data.mapping);
            if (data.mapping.fields?.length > 0) {
              setSelectedFieldId(data.mapping.fields[0].id);
            }
            alert('Mapping imported successfully!');
          }
        })
        .catch(() => alert('Failed to import .exfinmap file.'));
    };
    reader.readAsText(file);
  };

  // Field Helpers
  const addFieldToMapping = (pathStr: string) => {
    const parts = pathStr.split('.');
    let baseName = parts[parts.length - 1].toLowerCase();

    // Check for duplicates
    const existingNames = new Set(mapping.fields.map((f: any) => f.outputName));
    let finalName = baseName;
    let counter = 1;
    while (existingNames.has(finalName)) {
      finalName = `${baseName}_${counter++}`;
    }

    const newField = {
      id: `f_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sourcePath: pathStr,
      outputName: finalName,
      outputDataType: 'String',
      ordinal: mapping.fields.length + 1,
      transformation: 'None',
      isRequired: false,
      isVisible: true,
      oneToManyStrategy: 'ExpandRows'
    };

    const updatedFields = [...mapping.fields, newField];
    setMapping({ ...mapping, fields: updatedFields, updatedAt: new Date().toISOString() });
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    const updated = mapping.fields.filter((f: any) => f.id !== id);
    // reorder
    updated.forEach((f: any, idx: number) => (f.ordinal = idx + 1));
    setMapping({ ...mapping, fields: updated, updatedAt: new Date().toISOString() });
    if (selectedFieldId === id) {
      setSelectedFieldId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const fields = [...mapping.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;

    fields.forEach((f: any, idx: number) => (f.ordinal = idx + 1));
    setMapping({ ...mapping, fields, updatedAt: new Date().toISOString() });
  };

  const updateSelectedField = (key: string, value: any) => {
    if (!selectedFieldId) return;
    const updatedFields = mapping.fields.map((f: any) => {
      if (f.id === selectedFieldId) {
        return { ...f, [key]: value };
      }
      return f;
    });
    setMapping({ ...mapping, fields: updatedFields, updatedAt: new Date().toISOString() });
  };

  const selectedField = mapping.fields.find((f: any) => f.id === selectedFieldId);

  const filteredPaths = availablePaths.filter((p: any) => {
    const matchSearch = p.pathString.toLowerCase().includes(pathSearch.toLowerCase()) || p.entityName.toLowerCase().includes(pathSearch.toLowerCase());
    const matchEntity = selectedEntityFilter === 'All' || p.entityName === selectedEntityFilter;
    return matchSearch && matchEntity;
  });

  const uniqueEntities = ['All', ...Array.from(new Set(availablePaths.map((p: any) => p.entityName)))];

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={mapping.name}
                onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                className="bg-transparent text-lg font-bold text-slate-100 focus:outline-none focus:border-b border-amber-400 font-mono"
              />
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                mapping.status === 'Valid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {mapping.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Source Entity: <strong className="text-sky-400">{mapping.sourceEntity}</strong> | Version: {mapping.version}
            </p>
          </div>
        </div>

        {/* Global Mapper Actions */}
        <div className="flex items-center space-x-2">
          {onOpenTemplatesLibrary && (
            <button
              onClick={onOpenTemplatesLibrary}
              className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Table className="h-3.5 w-3.5 text-sky-400" />
              <span>Saved Templates</span>
            </button>
          )}

          <label className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer">
            <Upload className="h-3.5 w-3.5 text-emerald-400" />
            <span>Import .exfinmap</span>
            <input type="file" accept=".exfinmap,.json" onChange={handleImportExfinMap} className="hidden" />
          </label>

          <button
            onClick={handleExportExfinMap}
            className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span>Export .exfinmap</span>
          </button>

          <button
            onClick={handleValidateMapping}
            className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Validate</span>
          </button>

          <button
            onClick={handleRunPreview}
            disabled={isExecutingPreview}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50"
          >
            {isExecutingPreview ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>Preview Result</span>
          </button>

          <button
            onClick={handleSaveMapping}
            className="flex items-center space-x-1 px-4 py-1.5 rounded text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Mapping</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('Fields')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
            activeTab === 'Fields' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Output Fields ({mapping.fields.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('Filters')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
            activeTab === 'Filters' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters ({mapping.rootFilter?.rules?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('Parameters')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
            activeTab === 'Parameters' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Parameters ({mapping.parameters?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('Validation')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
            activeTab === 'Validation' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Validation {validationResult && `(${validationResult.errorCount} Errors)`}</span>
        </button>

        <button
          onClick={() => setActiveTab('Preview')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
            activeTab === 'Preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Preview Data {previewResult && `(${previewResult.rows.length} Rows)`}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'Fields' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-full min-h-0">
            
            {/* LEFT PANE: Discovered Source Fields Catalog */}
            <div className="md:col-span-3 rounded-lg border border-slate-800 bg-[#1E293B] p-3 flex flex-col min-h-0 overflow-hidden space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
                  <Code2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>AVAILABLE TALLY DATA</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{filteredPaths.length} Paths</span>
              </div>

              {/* Entity Filter & Search */}
              <div className="space-y-1.5 text-xs">
                <select
                  value={selectedEntityFilter}
                  onChange={(e) => setSelectedEntityFilter(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:outline-none"
                >
                  {uniqueEntities.map((ent) => (
                    <option key={ent} value={ent}>{ent}</option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search field paths..."
                    value={pathSearch}
                    onChange={(e) => setPathSearch(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 pl-8 pr-3 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Path List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                {filteredPaths.map((pathObj) => (
                  <div
                    key={pathObj.id || pathObj.pathString}
                    onDoubleClick={() => addFieldToMapping(pathObj.pathString)}
                    className="p-2 rounded border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="truncate space-y-0.5">
                      <div className="font-mono text-[11px] font-bold text-sky-300 truncate">{pathObj.pathString}</div>
                      <div className="text-[10px] text-slate-400">{pathObj.entityName} | {pathObj.dataType}</div>
                    </div>
                    <button
                      onClick={() => addFieldToMapping(pathObj.pathString)}
                      className="p-1 rounded bg-sky-600/20 text-sky-300 opacity-0 group-hover:opacity-100 hover:bg-sky-600 hover:text-white transition-all"
                      title="Add to Output Mapping"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER PANE: Output Mapping Table */}
            <div className="md:col-span-6 rounded-lg border border-slate-800 bg-slate-950 flex flex-col min-h-0 overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  <span>OUTPUT MAPPING SCHEMA</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Click row to configure</span>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#0B1120] text-slate-300 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 w-8">#</th>
                      <th className="p-2.5">Output Column Name</th>
                      <th className="p-2.5">Source Path</th>
                      <th className="p-2.5">Transform</th>
                      <th className="p-2.5">One-To-Many</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {mapping.fields.map((f: any, idx: number) => {
                      const isSelected = f.id === selectedFieldId;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedFieldId(f.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-900/40 text-sky-200 border-l-2 border-sky-400' : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 text-slate-500 font-bold">{f.ordinal}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={f.outputName}
                              onChange={(e) => {
                                const newName = e.target.value;
                                const updated = mapping.fields.map((field: any) =>
                                  field.id === f.id ? { ...field, outputName: newName } : field
                                );
                                setMapping({ ...mapping, fields: updated });
                              }}
                              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs font-bold text-slate-100 focus:border-sky-400 focus:outline-none w-full"
                            />
                          </td>
                          <td className="p-2.5 font-bold text-sky-300 truncate max-w-[180px]">{f.sourcePath}</td>
                          <td className="p-2.5">
                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px] text-amber-300">
                              {f.transformation || 'None'}
                            </span>
                          </td>
                          <td className="p-2.5 text-[10px] text-slate-400">
                            {f.oneToManyStrategy || 'ExpandRows'}
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveField(idx, 'up'); }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveField(idx, 'down'); }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                              className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT PANE: Selected Field Properties Inspector */}
            <div className="md:col-span-3 rounded-lg border border-slate-800 bg-[#1E293B] p-3 flex flex-col min-h-0 overflow-y-auto space-y-3">
              <div className="border-b border-slate-800 pb-2 flex items-center space-x-2">
                <Settings2 className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-100">FIELD SETTINGS</span>
              </div>

              {selectedField ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Source Path</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedField.sourcePath}
                      className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-sky-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Output Column Name</label>
                    <input
                      type="text"
                      value={selectedField.outputName}
                      onChange={(e) => updateSelectedField('outputName', e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Data Type</label>
                      <select
                        value={selectedField.outputDataType || 'String'}
                        onChange={(e) => updateSelectedField('outputDataType', e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:outline-none"
                      >
                        <option value="String">String</option>
                        <option value="Integer">Integer</option>
                        <option value="Decimal">Decimal</option>
                        <option value="Date">Date</option>
                        <option value="Boolean">Boolean</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Transformation</label>
                      <select
                        value={selectedField.transformation || 'None'}
                        onChange={(e) => updateSelectedField('transformation', e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-amber-300 font-semibold focus:outline-none"
                      >
                        <option value="None">None</option>
                        <option value="TRIM">TRIM</option>
                        <option value="UPPER">UPPER</option>
                        <option value="LOWER">LOWER</option>
                        <option value="CONCAT">CONCAT</option>
                        <option value="ROUND">ROUND</option>
                        <option value="FORMAT_DATE">FORMAT_DATE</option>
                        <option value="IF">IF (Conditional)</option>
                      </select>
                    </div>
                  </div>

                  {selectedField.transformation !== 'None' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Transform Parameter / Format</label>
                      <input
                        type="text"
                        placeholder="e.g. 2 for ROUND, yyyy-MM-dd for DATE, Voucher.Date,Voucher.Number for CONCAT"
                        value={selectedField.transformationParameter || ''}
                        onChange={(e) => updateSelectedField('transformationParameter', e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-amber-300 focus:outline-none font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Default Value (if NULL)</label>
                    <input
                      type="text"
                      placeholder="e.g. URP, 0, N/A"
                      value={selectedField.defaultValue || ''}
                      onChange={(e) => updateSelectedField('defaultValue', e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">One-To-Many Strategy</label>
                    <select
                      value={selectedField.oneToManyStrategy || 'ExpandRows'}
                      onChange={(e) => updateSelectedField('oneToManyStrategy', e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="ExpandRows">Expand Rows (Default)</option>
                      <option value="Aggregate">Aggregate (SUM/COUNT)</option>
                      <option value="First">First Record</option>
                      <option value="Last">Last Record</option>
                      <option value="Concatenate">Concatenate Values</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedField.isRequired || false}
                        onChange={(e) => updateSelectedField('isRequired', e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                      />
                      <span className="text-slate-300">Is Required</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedField.isVisible ?? true}
                        onChange={(e) => updateSelectedField('isVisible', e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                      />
                      <span className="text-slate-300">Visible</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-8 text-center">
                  Select a field to inspect or configure properties.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: FILTERS BUILDER */}
        {activeTab === 'Filters' && (
          <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Filter className="h-4 w-4 text-sky-400" />
                <span>FILTER RULES & LOGICAL GROUPS</span>
              </h3>
              <button
                onClick={() => {
                  const newRule = { id: `r_${Date.now()}`, fieldPath: 'Voucher.VoucherTypeName', operator: 'Equals', value: 'Sales' };
                  const rules = [...(mapping.rootFilter?.rules || []), newRule];
                  setMapping({ ...mapping, rootFilter: { ...mapping.rootFilter, rules } });
                }}
                className="flex items-center space-x-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Filter Rule</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {mapping.rootFilter?.rules?.map((rule: any, idx: number) => (
                <div key={rule.id} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-xs">
                  <span className="font-bold text-sky-400">Rule #{idx + 1}</span>

                  <input
                    type="text"
                    value={rule.fieldPath}
                    onChange={(e) => {
                      const updatedRules = mapping.rootFilter.rules.map((r: any) => r.id === rule.id ? { ...r, fieldPath: e.target.value } : r);
                      setMapping({ ...mapping, rootFilter: { ...mapping.rootFilter, rules: updatedRules } });
                    }}
                    placeholder="Field Path"
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sky-300 font-mono w-48 focus:outline-none"
                  />

                  <select
                    value={rule.operator}
                    onChange={(e) => {
                      const updatedRules = mapping.rootFilter.rules.map((r: any) => r.id === rule.id ? { ...r, operator: e.target.value } : r);
                      setMapping({ ...mapping, rootFilter: { ...mapping.rootFilter, rules: updatedRules } });
                    }}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:outline-none"
                  >
                    <option value="Equals">Equals (=)</option>
                    <option value="NotEquals">Not Equals (!=)</option>
                    <option value="Contains">Contains</option>
                    <option value="GreaterThan">Greater Than (&gt;)</option>
                    <option value="LessThan">Less Than (&lt;)</option>
                    <option value="Between">Between</option>
                  </select>

                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => {
                      const updatedRules = mapping.rootFilter.rules.map((r: any) => r.id === rule.id ? { ...r, value: e.target.value } : r);
                      setMapping({ ...mapping, rootFilter: { ...mapping.rootFilter, rules: updatedRules } });
                    }}
                    placeholder="Target Value"
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 flex-1 focus:outline-none"
                  />

                  <button
                    onClick={() => {
                      const updatedRules = mapping.rootFilter.rules.filter((r: any) => r.id !== rule.id);
                      setMapping({ ...mapping, rootFilter: { ...mapping.rootFilter, rules: updatedRules } });
                    }}
                    className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PARAMETERS */}
        {activeTab === 'Parameters' && (
          <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-sky-400" />
                <span>DYNAMIC MAPPING PARAMETERS</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {mapping.parameters?.map((param: any, idx: number) => (
                <div key={param.name} className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/80">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold">Parameter Name</label>
                    <span className="font-bold text-sky-300">{param.displayName || param.name}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold">Data Type</label>
                    <span className="font-mono text-emerald-400">{param.dataType}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold">Current Value</label>
                    <input
                      type="text"
                      value={param.currentValue || ''}
                      onChange={(e) => {
                        const updated = mapping.parameters.map((p: any) => p.name === param.name ? { ...p, currentValue: e.target.value } : p);
                        setMapping({ ...mapping, parameters: updated });
                      }}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: VALIDATION REPORT */}
        {activeTab === 'Validation' && (
          <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 h-full flex flex-col space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>MAPPING COMPATIBILITY & SCHEMA VALIDATION REPORT</span>
              </h3>
              <button
                onClick={handleValidateMapping}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold"
              >
                Re-Validate
              </button>
            </div>

            {validationResult ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border border-slate-800 bg-slate-900/80 text-center">
                    <span className="text-slate-400 block text-[10px]">Errors</span>
                    <span className="text-lg font-bold text-rose-400">{validationResult.errorCount}</span>
                  </div>
                  <div className="p-3 rounded border border-slate-800 bg-slate-900/80 text-center">
                    <span className="text-slate-400 block text-[10px]">Warnings</span>
                    <span className="text-lg font-bold text-amber-400">{validationResult.warningCount}</span>
                  </div>
                  <div className="p-3 rounded border border-slate-800 bg-slate-900/80 text-center">
                    <span className="text-slate-400 block text-[10px]">Status</span>
                    <span className={`text-lg font-bold ${validationResult.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {validationResult.isValid ? 'COMPATIBLE' : 'INVALID'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {validationResult.messages?.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border text-xs space-y-1 ${
                        msg.level === 'Error' ? 'border-rose-800 bg-rose-950/30 text-rose-200' : 'border-amber-800 bg-amber-950/30 text-amber-200'
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span>[{msg.level}] {msg.fieldPath}</span>
                      </div>
                      <div>{msg.message}</div>
                      {msg.suggestedFix && <div className="text-[10px] text-slate-400">Fix: {msg.suggestedFix}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-12">
                Click 'Validate' above to check output mapping schema compatibility against Tally metadata.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PREVIEW RESULT */}
        {activeTab === 'Preview' && (
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-shrink-0">
              <div className="flex items-center space-x-3 text-xs">
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <Play className="h-3.5 w-3.5" />
                  <span>PREVIEW DATA RESULT</span>
                </span>
                {previewResult && (
                  <span className="text-slate-400 font-mono">
                    {previewResult.rows.length} Rows returned in {previewResult.executionTimeMs}ms
                  </span>
                )}
              </div>

              <button
                onClick={handleRunPreview}
                disabled={isExecutingPreview}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center space-x-1"
              >
                <RefreshCw className={`h-3 w-3 ${isExecutingPreview ? 'animate-spin' : ''}`} />
                <span>Re-Run Preview</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
              {isExecutingPreview ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin text-emerald-400 mr-2" />
                  <span>Executing output mapping engine against Tally data...</span>
                </div>
              ) : previewResult && previewResult.rows && previewResult.rows.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#0B1120] text-slate-300 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      {previewResult.schema.columns.map((col: any) => (
                        <th key={col.name} className="p-2.5 font-semibold whitespace-nowrap">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {previewResult.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-900/60">
                        {previewResult.schema.columns.map((col: any) => (
                          <td key={col.name} className="p-2.5 whitespace-nowrap text-slate-200">
                            {row[col.name] === null || row[col.name] === undefined ? (
                              <span className="text-slate-600 italic">NULL</span>
                            ) : (
                              String(row[col.name])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  No preview records returned for current mapping criteria.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
