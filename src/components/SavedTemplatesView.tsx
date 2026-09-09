import React, { useState, useEffect } from 'react';
import {
  Table,
  Search,
  Plus,
  Trash2,
  Copy,
  FolderOpen,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

interface SavedTemplatesViewProps {
  selectedCompany: any;
  onSelectMapping: (mappingId: string) => void;
  onCreateNewMapping: () => void;
}

export const SavedTemplatesView: React.FC<SavedTemplatesViewProps> = ({
  selectedCompany,
  onSelectMapping,
  onCreateNewMapping
}) => {
  const companyId = selectedCompany ? selectedCompany.name : 'DEFAULT_COMP';

  const [mappings, setMappings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, [companyId, searchTerm]);

  const fetchMappings = () => {
    setIsLoading(true);
    let url = `/api/mappings?companyId=${encodeURIComponent(companyId)}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.mappings) {
          setMappings(data.mappings);
        }
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  const handleDuplicate = (id: string) => {
    fetch('/api/mappings/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchMappings();
        }
      })
      .catch(() => {});
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping template?')) return;

    fetch(`/api/mappings/${id}`, {
      method: 'DELETE'
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchMappings();
        }
      })
      .catch(() => {});
  };

  const handleExportFile = (mapping: any) => {
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

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Table className="h-5 w-5 text-sky-400" />
            <span>SAVED OUTPUT MAPPING TEMPLATES</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage reusable output mapping specifications, export/import .exfinmap templates
          </p>
        </div>

        <button
          onClick={onCreateNewMapping}
          className="flex items-center space-x-1.5 px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-950/50"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Mapping</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search templates by name, source entity, output fields or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <button
          onClick={fetchMappings}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          title="Refresh List"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Templates Grid / Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-[#1E293B]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-sky-400 mr-2" />
            <span>Loading mapping templates...</span>
          </div>
        ) : mappings.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0B1120] text-slate-300 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Template Name</th>
                <th className="p-3">Source Entity</th>
                <th className="p-3">Fields</th>
                <th className="p-3">Status</th>
                <th className="p-3">Template Type</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-100 text-xs">{m.name}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[280px]">{m.description}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-sky-400 font-bold">
                      {m.sourceEntity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-bold">
                    {m.fields ? m.fields.length : 0} columns
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === 'Valid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {m.status || 'Draft'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {m.configuration?.isPortableTemplate ? 'Portable Template' : 'Company Specific'}
                  </td>
                  <td className="p-3 text-slate-400 text-[10px]">
                    {new Date(m.updatedAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => onSelectMapping(m.id)}
                      className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] inline-flex items-center space-x-1"
                    >
                      <FolderOpen className="h-3 w-3" />
                      <span>Open</span>
                    </button>

                    <button
                      onClick={() => handleDuplicate(m.id)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Duplicate Template"
                    >
                      <Copy className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => handleExportFile(m)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Export .exfinmap"
                    >
                      <Download className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                      title="Delete Template"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500 py-16">
            No saved mapping templates found matching query.
          </div>
        )}
      </div>
    </div>
  );
};
