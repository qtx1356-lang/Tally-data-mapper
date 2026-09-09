import React, { useState, useEffect } from 'react';
import {
  Settings2,
  Play,
  Copy,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  FileJson,
  FileCode,
  Database,
  Search,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface ExportProfilesViewProps {
  onRunProfile?: (profile: any) => void;
  onCreateNew?: () => void;
}

export const ExportProfilesView: React.FC<ExportProfilesViewProps> = ({
  onRunProfile,
  onCreateNew
}) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProfiles = () => {
    setLoading(true);
    fetch('/api/export/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProfiles(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this export profile?')) return;
    fetch(`/api/export/profiles/${id}`, { method: 'DELETE' })
      .then(() => loadProfiles())
      .catch(() => {});
  };

  const handleDuplicate = (id: string) => {
    fetch('/api/export/profiles/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then(() => loadProfiles())
      .catch(() => {});
  };

  const filtered = profiles.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mappingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.format?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Settings2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">EXPORT PROFILES</h1>
          </div>
          <p className="text-xs text-slate-400">
            Saved export configurations and preset templates ready for single-click execution.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search profiles by name, mapping, or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={loadProfiles}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          title="Refresh Profiles"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Profiles Table matching requirement 19 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Profile Name</th>
              <th className="py-3 px-4">Output Mapping</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4">Last Export</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.map((prof) => (
              <tr key={prof.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3.5 px-4 font-sans font-semibold text-slate-100">
                  {prof.name}
                </td>
                <td className="py-3.5 px-4 text-slate-300 font-sans">
                  {prof.mappingName || 'GST Sales Register'}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-1.5 font-sans font-medium">
                    {getFormatIcon(prof.format)}
                    <span>{prof.format}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={prof.destinationPath}>
                  {prof.destinationPath}
                </td>
                <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                  {prof.lastExportAt ? new Date(prof.lastExportAt).toLocaleString() : 'Never'}
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      prof.lastStatus === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{prof.lastStatus || 'Ready'}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <div className="flex items-center justify-end space-x-2">
                    {onRunProfile && (
                      <button
                        onClick={() => onRunProfile(prof)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] rounded flex items-center space-x-1 transition"
                        title="Run Export Profile"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(prof.id)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                      title="Duplicate Profile"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prof.id)}
                      className="p-1 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded border border-slate-700 transition"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No export profiles found matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
