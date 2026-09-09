import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Download,
  Eye,
  FileText,
  Save,
  CheckCircle,
  Building,
  User,
  Calendar,
  FileCode,
  Package,
  BookOpen,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ReportPackageDefinition, ReportPackageSection } from '../types/documentsAndSchedules';

export const ReportPackagesView: React.FC = () => {
  const [packages, setPackages] = useState<ReportPackageDefinition[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ReportPackageDefinition>({
    id: 'PKG_9001',
    title: 'Monthly Executive Financial Board Deck',
    subtitle: 'Consolidated GST & Ledger Compliance Audit Package',
    description: 'Executive board package combining Sales Register, Tax Reconciliation, and Trial Balance.',
    companyName: 'EXFIN GLOBAL ENTERPRISES PVT LTD',
    preparedBy: 'Corporate Finance & Tax Audit Division',
    periodLabel: 'Q1 FY 2026-27 (April - June 2026)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    printSettings: {
      paperSize: 'A4',
      orientation: 'Landscape',
      marginPreset: 'Normal',
      showHeader: true,
      showFooter: true,
      headerText: 'EXFIN EXECUTIVE BOARD DECK',
      footerText: 'Confidential - Strictly for Board of Directors',
      includePageNumbers: true,
      primaryColorHex: '#0284c7'
    },
    sections: [
      {
        id: 'SEC_1',
        reportId: 'REP_8001',
        reportTitle: 'GST Sales & Tax Compliance Register',
        customTitle: '1. Executive Sales & Tax Summary',
        executiveNotes: 'Total gross sales increased by 14.2% YoY driven by interstate expansion. Tax liability matched Tally GSTR-1 records.',
        order: 1,
        includeCoverPageBreak: true
      },
      {
        id: 'SEC_2',
        reportId: 'REP_8002',
        reportTitle: 'Ledger Trial Balance & Closing Balances',
        customTitle: '2. Trial Balance & Group Ledgers',
        executiveNotes: 'No anomalous ledger debit/credit balances detected during automated verification.',
        order: 2,
        includeCoverPageBreak: true
      }
    ]
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSavePackage = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPackage)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save package', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    const newSec: ReportPackageSection = {
      id: `SEC_${Math.floor(Math.random() * 9000) + 1000}`,
      reportId: 'REP_8001',
      reportTitle: 'GST Sales & Tax Compliance Register',
      customTitle: `${selectedPackage.sections.length + 1}. Additional Section`,
      executiveNotes: 'Enter executive commentary here...',
      order: selectedPackage.sections.length + 1,
      includeCoverPageBreak: true
    };
    setSelectedPackage({
      ...selectedPackage,
      sections: [...selectedPackage.sections, newSec]
    });
  };

  const handleRemoveSection = (secId: string) => {
    setSelectedPackage({
      ...selectedPackage,
      sections: selectedPackage.sections.filter((s) => s.id !== secId)
    });
  };

  const handleExportPackageBundle = () => {
    const jsonStr = JSON.stringify(selectedPackage, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPackage.title.replace(/\s+/g, '_')}.exfinpkg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-[#0B1120] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-sky-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              Executive Board Deck & Audit Package Bundler
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bundle multiple report definitions, cover pages, and executive commentaries into a unified Board Deck (.exfinpkg).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span>{previewMode ? 'Edit Package' : 'Preview Cover Deck'}</span>
          </button>

          <button
            onClick={handleExportPackageBundle}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export Bundle (.exfinpkg)</span>
          </button>

          <button
            onClick={handleSavePackage}
            disabled={saving}
            className="flex items-center space-x-1.5 rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 shadow transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Package'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-6 py-2 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Executive Board Deck package definition saved successfully!</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {previewMode ? (
          /* PREVIEW MODE: COVER DECK PREVIEW */
          <div className="flex-1 bg-[#0F172A] p-8 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-4xl bg-[#0B1120] border border-slate-800 rounded-xl p-12 shadow-2xl space-y-8 my-auto">
              <div className="border-b-4 border-sky-500 pb-6">
                <span className="rounded bg-sky-950 border border-sky-800 px-3 py-1 text-xs font-mono font-bold text-sky-300 uppercase">
                  EXFIN BOARD DECK PACKAGE
                </span>
                <h1 className="text-3xl font-black text-slate-100 mt-4 tracking-tight">
                  {selectedPackage.title}
                </h1>
                <h2 className="text-base text-slate-400 mt-1 font-medium">
                  {selectedPackage.subtitle}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs text-slate-300 border-b border-slate-800 pb-6">
                <div>
                  <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Company / Organization
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1">
                    {selectedPackage.companyName}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Prepared By & Financial Period
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1">
                    {selectedPackage.preparedBy}
                  </div>
                  <div className="text-xs text-sky-400 mt-0.5">{selectedPackage.periodLabel}</div>
                </div>
              </div>

              {/* Bundled Sections Table of Contents */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Bundled Package Contents ({selectedPackage.sections.length} Reports)
                </h3>
                <div className="space-y-2">
                  {selectedPackage.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="rounded border border-slate-800 bg-[#1E293B] p-4 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-sm">{sec.customTitle}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          Source Report: {sec.reportTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        "{sec.executiveNotes}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT MODE: 2 COLUMNS */
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Cover Page Setup */}
            <div className="w-96 border-r border-slate-800 bg-[#0B1120] p-5 flex flex-col space-y-4 overflow-y-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Cover Page Metadata
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Package Title</label>
                  <input
                    type="text"
                    value={selectedPackage.title}
                    onChange={(e) => setSelectedPackage({ ...selectedPackage, title: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Subtitle</label>
                  <input
                    type="text"
                    value={selectedPackage.subtitle}
                    onChange={(e) => setSelectedPackage({ ...selectedPackage, subtitle: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={selectedPackage.companyName}
                    onChange={(e) => setSelectedPackage({ ...selectedPackage, companyName: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Prepared By</label>
                  <input
                    type="text"
                    value={selectedPackage.preparedBy}
                    onChange={(e) => setSelectedPackage({ ...selectedPackage, preparedBy: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Financial Period Label</label>
                  <input
                    type="text"
                    value={selectedPackage.periodLabel}
                    onChange={(e) => setSelectedPackage({ ...selectedPackage, periodLabel: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-[#1E293B] px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Bundled Section Ordering & Executive Commentary */}
            <div className="flex-1 bg-[#0F172A] p-6 overflow-y-auto flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Bundled Reports & Executive Commentary ({selectedPackage.sections.length})
                </h3>
                <button
                  onClick={handleAddSection}
                  className="flex items-center space-x-1 rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Report Section</span>
                </button>
              </div>

              <div className="space-y-4">
                {selectedPackage.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
                      <span className="font-bold text-sky-400 font-mono">
                        SECTION #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveSection(sec.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove Section"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">
                          Section Display Title
                        </label>
                        <input
                          type="text"
                          value={sec.customTitle || ''}
                          onChange={(e) => {
                            const updated = selectedPackage.sections.map((s) =>
                              s.id === sec.id ? { ...s, customTitle: e.target.value } : s
                            );
                            setSelectedPackage({ ...selectedPackage, sections: updated });
                          }}
                          className="w-full rounded border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 text-slate-100 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Source Report</label>
                        <select
                          value={sec.reportId}
                          onChange={(e) => {
                            const updated = selectedPackage.sections.map((s) =>
                              s.id === sec.id ? { ...s, reportId: e.target.value } : s
                            );
                            setSelectedPackage({ ...selectedPackage, sections: updated });
                          }}
                          className="w-full rounded border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 text-slate-100 outline-none focus:border-sky-500"
                        >
                          <option value="REP_8001">REP_8001: GST Sales & Tax Compliance</option>
                          <option value="REP_8002">REP_8002: Trial Balance & Ledgers</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-medium">
                        Executive Commentary / Audit Notes
                      </label>
                      <textarea
                        rows={2}
                        value={sec.executiveNotes || ''}
                        onChange={(e) => {
                          const updated = selectedPackage.sections.map((s) =>
                            s.id === sec.id ? { ...s, executiveNotes: e.target.value } : s
                          );
                          setSelectedPackage({ ...selectedPackage, sections: updated });
                        }}
                        className="w-full rounded border border-slate-800 bg-[#0B1120] p-2 text-xs text-slate-100 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
