import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Copy,
  Play,
  Trash2,
  Printer,
  Download,
  Calendar,
  Layers,
  Filter,
  CheckCircle,
  Clock,
  X,
  FileCode,
  SlidersHorizontal
} from 'lucide-react';
import { ReportDefinition } from '../types/reports';

interface ReportLibraryViewProps {
  onOpenReportInDesigner: (reportId: string | null) => void;
  onRunDashboard: (reportId: string) => void;
}

export const ReportLibraryView: React.FC<ReportLibraryViewProps> = ({
  onOpenReportInDesigner,
  onRunDashboard
}) => {
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Favorites'>('All');
  const [selectedReportForParams, setSelectedReportForParams] = useState<ReportDefinition | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [previewModalReport, setPreviewModalReport] = useState<ReportDefinition | null>(null);

  const fetchReports = () => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
        }
      })
      .catch((err) => console.error('Failed to load reports library', err));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch('/api/reports/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      console.error('Failed to duplicate report', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report definition?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      console.error('Failed to delete report', e);
    }
  };

  const handleExportDefinition = (rep: ReportDefinition) => {
    const jsonStr = JSON.stringify(rep, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rep.name.replace(/\s+/g, '_')}_v${rep.version}.exfinreport`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.mappingName && r.mappingName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFav = selectedFilter === 'Favorites' ? r.isFavorite : true;
    return matchesSearch && matchesFav;
  });

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="border-b border-slate-800 bg-[#0B1120] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="h-6 w-6 text-sky-400" />
            <span>Professional Report Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, execute, and export custom visual report definitions and dashboard packages.
          </p>
        </div>

        <button
          onClick={() => onOpenReportInDesigner(null)}
          className="flex items-center space-x-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by name or mapping..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#1E293B] pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-md bg-slate-800/80 p-0.5 text-xs font-medium">
            <button
              onClick={() => setSelectedFilter('All')}
              className={`rounded px-3 py-1 transition-colors ${
                selectedFilter === 'All' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Reports ({reports.length})
            </button>
            <button
              onClick={() => setSelectedFilter('Favorites')}
              className={`rounded px-3 py-1 transition-colors ${
                selectedFilter === 'Favorites' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Favorites ({reports.filter((r) => r.isFavorite).length})
            </button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-12 text-center space-y-3 max-w-lg mx-auto">
            <FileText className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Reports Found</h3>
            <p className="text-xs text-slate-500">
              No report definitions match your search query or filter selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-slate-800 bg-[#1E293B]/80 hover:border-slate-700 p-5 flex flex-col justify-between transition-all hover:shadow-lg space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-sky-400" />
                      <h3 className="text-sm font-bold text-slate-100">{rep.name}</h3>
                    </div>
                    {rep.isFavorite && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{rep.description}</p>

                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Layers className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-slate-400">Mapping:</span>
                      <span className="font-semibold text-slate-200">{rep.mappingName || rep.mappingId}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>Updated: {new Date(rep.updatedAt).toLocaleDateString()}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-sky-400">v{rep.version}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onRunDashboard(rep.id)}
                      className="flex items-center space-x-1 rounded bg-sky-600/90 hover:bg-sky-600 px-2.5 py-1 text-white font-medium transition-colors"
                      title="Run Dashboard / Visual View"
                    >
                      <Play className="h-3 w-3" />
                      <span>Run</span>
                    </button>

                    <button
                      onClick={() => onOpenReportInDesigner(rep.id)}
                      className="flex items-center space-x-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-200 transition-colors"
                    >
                      <span>Design</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDuplicate(rep.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      title="Duplicate Report"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleExportDefinition(rep)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      title="Export Definition Package (.exfinreport)"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rep.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/40"
                      title="Delete Report"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parameter Prompt Screen Modal (Requirement 30) */}
      {selectedReportForParams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0B1120] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <SlidersHorizontal className="h-4 w-4 text-sky-400" />
                <span>REPORT PARAMETERS</span>
              </h3>
              <button
                onClick={() => setSelectedReportForParams(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide required parameters before generating '{selectedReportForParams.name}'.
            </p>

            <div className="space-y-3 text-xs">
              {selectedReportForParams.parameters.map((p) => (
                <div key={p.id}>
                  <label className="block text-slate-300 font-medium mb-1">
                    {p.displayName} {p.required && <span className="text-rose-400">*</span>}
                  </label>

                  {p.dataType === 'Date' ? (
                    <input
                      type="date"
                      value={paramValues[p.name] || p.defaultValue || ''}
                      onChange={(e) =>
                        setParamValues({ ...paramValues, [p.name]: e.target.value })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                    />
                  ) : p.dataType === 'Dropdown' && p.options ? (
                    <select
                      value={paramValues[p.name] || p.defaultValue || ''}
                      onChange={(e) =>
                        setParamValues({ ...paramValues, [p.name]: e.target.value })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                    >
                      {p.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={paramValues[p.name] || p.defaultValue || ''}
                      onChange={(e) =>
                        setParamValues({ ...paramValues, [p.name]: e.target.value })
                      }
                      className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedReportForParams(null)}
                className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const repId = selectedReportForParams.id;
                  setSelectedReportForParams(null);
                  onRunDashboard(repId);
                }}
                className="rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
