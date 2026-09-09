import React, { useState, useEffect } from 'react';
import {
  Clock,
  RotateCcw,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  FileText,
  FileJson,
  FileCode,
  Database,
  Search,
  Trash2,
  RefreshCw,
  Hash,
  Info
} from 'lucide-react';

interface ExportHistoryViewProps {
  onRetryExport?: (historyItem: any) => void;
}

export const ExportHistoryView: React.FC<ExportHistoryViewProps> = ({ onRetryExport }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const loadHistory = () => {
    setLoading(true);
    fetch('/api/export/history')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = () => {
    if (!confirm('Are you sure you want to clear export history logs?')) return;
    fetch('/api/export/history', { method: 'DELETE' })
      .then(() => loadHistory())
      .catch(() => {});
  };

  const filtered = history.filter(
    (h) =>
      h.mappingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.format?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.destinationPath?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFormatIcon = (fmt: string) => {
    switch (fmt?.toLowerCase()) {
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'csv':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-sky-400" />;
      case 'xml':
        return <FileCode className="w-4 h-4 text-orange-400" />;
      case 'sqlite':
        return <Database className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">EXPORT HISTORY LOGS</h1>
          </div>
          <p className="text-xs text-slate-400">
            Execution history, status stats, performance timing, and SHA-256 file hashes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search history by mapping, company, format, or file path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={loadHistory}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          title="Refresh History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* History Table matching requirement 43 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Mapping & Company</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4">Destination File</th>
              <th className="py-3 px-4 text-right">Rows</th>
              <th className="py-3 px-4 text-right">Duration</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3.5 px-4 font-sans text-slate-300 text-[11px]">
                  {new Date(item.completedAt || item.startedAt).toLocaleString()}
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-100">{item.mappingName}</p>
                    <p className="text-[10px] text-emerald-400">{item.companyName}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <div className="flex items-center space-x-1.5 font-medium">
                    {getFormatIcon(item.format)}
                    <span>{item.format}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-[11px] text-slate-400 max-w-xs truncate" title={item.destinationPath}>
                  {item.destinationPath}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                  {item.recordsWritten?.toLocaleString() || item.recordsRead?.toLocaleString() || 0}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                  {((item.durationMs || 1000) / 1000).toFixed(1)}s
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : item.status === 'CompletedWithWarnings'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {item.status === 'Completed' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : item.status === 'CompletedWithWarnings' ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>{item.status}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => alert(`Opening OS folder for file: ${item.destinationPath}`)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                      title="Open File Folder in File Explorer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    {onRetryExport && (
                      <button
                        onClick={() => onRetryExport(item)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                        title="Retry Export"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                      </button>
                    )}
                    {item.errorMessage && (
                      <button
                        onClick={() => setSelectedError(item.errorMessage)}
                        className="p-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 transition"
                        title="View Error Details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No export history logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Export Error Log</span>
            </h3>
            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded border border-slate-800 break-all">
              {selectedError}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedError(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
