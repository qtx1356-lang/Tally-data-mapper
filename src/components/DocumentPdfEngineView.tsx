import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Settings,
  Layout,
  Palette,
  Eye,
  CheckCircle,
  Save,
  RotateCcw,
  Sparkles,
  Type,
  Maximize2,
  FileSpreadsheet,
  Building,
  Image as ImageIcon
} from 'lucide-react';
import { DocumentPrintSettings } from '../types/documentsAndSchedules';

export const DocumentPdfEngineView: React.FC = () => {
  const [settings, setSettings] = useState<DocumentPrintSettings>({
    paperSize: 'A4',
    orientation: 'Landscape',
    marginPreset: 'Normal',
    showHeader: true,
    showFooter: true,
    headerText: 'EXFIN FINANCIAL INTELLIGENCE SYSTEM',
    footerText: 'Confidential - Generated for Management & Statutory Compliance',
    includePageNumbers: true,
    watermarkText: 'CONFIDENTIAL',
    primaryColorHex: '#0284c7',
    companyLogoUrl: ''
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState<'Standard' | 'PrintLayout'>('PrintLayout');

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-[#0B1120] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Printer className="h-6 w-6 text-sky-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              Professional Document & PDF Print Engine
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure pixel-perfect PDF rendering, letterhead watermarks, page margins, and print styling.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerPrint}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-amber-400" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center space-x-1.5 rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 shadow transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Default Print Style'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-6 py-2 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Default Document & PDF print engine settings saved successfully!</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-80 border-r border-slate-800 bg-[#0B1120] p-5 flex flex-col space-y-5 overflow-y-auto">
          {/* Page Layout Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
              <Layout className="h-3.5 w-3.5 text-sky-400" />
              <span>Page Setup & Paper</span>
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Paper Size</label>
              <select
                value={settings.paperSize}
                onChange={(e) => setSettings({ ...settings, paperSize: e.target.value as any })}
                className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="Letter">Letter (8.5 x 11 in)</option>
                <option value="Legal">Legal (8.5 x 14 in)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Orientation</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, orientation: 'Portrait' })}
                  className={`rounded border p-2 text-center transition-colors ${
                    settings.orientation === 'Portrait'
                      ? 'border-sky-500 bg-sky-950/60 text-sky-300 font-bold'
                      : 'border-slate-800 bg-[#1E293B] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, orientation: 'Landscape' })}
                  className={`rounded border p-2 text-center transition-colors ${
                    settings.orientation === 'Landscape'
                      ? 'border-sky-500 bg-sky-950/60 text-sky-300 font-bold'
                      : 'border-slate-800 bg-[#1E293B] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Margin Preset</label>
              <select
                value={settings.marginPreset}
                onChange={(e) => setSettings({ ...settings, marginPreset: e.target.value as any })}
                className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
              >
                <option value="Normal">Normal (0.75 in / 19mm)</option>
                <option value="Narrow">Narrow (0.5 in / 12mm)</option>
                <option value="Wide">Wide (1.0 in / 25mm)</option>
              </select>
            </div>
          </div>

          {/* Letterhead Header & Footer */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
              <Type className="h-3.5 w-3.5 text-sky-400" />
              <span>Header & Footer Letterhead</span>
            </h3>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Show Page Header</span>
              <input
                type="checkbox"
                checked={settings.showHeader}
                onChange={(e) => setSettings({ ...settings, showHeader: e.target.checked })}
                className="rounded accent-sky-500"
              />
            </div>

            {settings.showHeader && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Header Title Text</label>
                <input
                  type="text"
                  value={settings.headerText}
                  onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-300">Show Page Footer</span>
              <input
                type="checkbox"
                checked={settings.showFooter}
                onChange={(e) => setSettings({ ...settings, showFooter: e.target.checked })}
                className="rounded accent-sky-500"
              />
            </div>

            {settings.showFooter && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Footer Legal Disclaimer</label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                  className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-300">Include "Page X of Y" Numbering</span>
              <input
                type="checkbox"
                checked={settings.includePageNumbers}
                onChange={(e) =>
                  setSettings({ ...settings, includePageNumbers: e.target.checked })
                }
                className="rounded accent-sky-500"
              />
            </div>
          </div>

          {/* Watermark & Branding */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
              <Palette className="h-3.5 w-3.5 text-sky-400" />
              <span>Watermark & Accent Theme</span>
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Diagonal Watermark</label>
              <input
                type="text"
                value={settings.watermarkText || ''}
                onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                placeholder="e.g. DRAFT / CONFIDENTIAL"
                className="w-full rounded border border-slate-800 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Primary Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.primaryColorHex}
                  onChange={(e) => setSettings({ ...settings, primaryColorHex: e.target.value })}
                  className="h-8 w-12 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-300">{settings.primaryColorHex}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Page Preview Area */}
        <div className="flex-1 bg-[#0F172A] p-8 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-4xl mb-4 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span>
              Live Document Render Preview ({settings.paperSize} - {settings.orientation})
            </span>
            <span className="text-sky-400 font-mono">Pixel-Perfect Print Canvas</span>
          </div>

          {/* Simulated Printed Paper Container */}
          <div
            className={`w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-sm p-8 relative min-h-[600px] border border-slate-300 font-sans ${
              settings.orientation === 'Landscape' ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'
            }`}
          >
            {/* Diagonal Watermark Overlay */}
            {settings.watermarkText && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 rotate-[-30deg]">
                <span className="text-7xl font-black tracking-widest text-slate-900 border-4 border-slate-900 px-8 py-2 uppercase">
                  {settings.watermarkText}
                </span>
              </div>
            )}

            {/* Document Header */}
            {settings.showHeader && (
              <div
                className="border-b-2 pb-3 mb-6 flex items-center justify-between"
                style={{ borderColor: settings.primaryColorHex }}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {settings.headerText}
                  </div>
                  <div className="text-xl font-black tracking-tight text-slate-900 mt-0.5">
                    GST Sales & Tax Compliance Audit Register
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-xs font-bold px-2 py-0.5 rounded text-white inline-block"
                    style={{ backgroundColor: settings.primaryColorHex }}
                  >
                    EXFIN VERIFIED
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Date: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {/* Document Content Table Simulation */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Summary Ledger Vouchers (FY 2026-27)
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className="text-white font-semibold"
                    style={{ backgroundColor: settings.primaryColorHex }}
                  >
                    <th className="p-2 border border-slate-300">Voucher Date</th>
                    <th className="p-2 border border-slate-300">Voucher No</th>
                    <th className="p-2 border border-slate-300">Customer / Party Name</th>
                    <th className="p-2 border border-slate-300 text-right">Taxable Amount</th>
                    <th className="p-2 border border-slate-300 text-right">GST Tax Amount</th>
                    <th className="p-2 border border-slate-300 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
                  <tr>
                    <td className="p-2 border border-slate-200">2026-04-10</td>
                    <td className="p-2 border border-slate-200">INV-2026-1001</td>
                    <td className="p-2 border border-slate-200 font-sans font-semibold">ABC INDUSTRIES LTD</td>
                    <td className="p-2 border border-slate-200 text-right">₹ 85,000.00</td>
                    <td className="p-2 border border-slate-200 text-right">₹ 15,300.00</td>
                    <td className="p-2 border border-slate-200 text-right font-bold">₹ 1,00,300.00</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2 border border-slate-200">2026-04-12</td>
                    <td className="p-2 border border-slate-200">INV-2026-1002</td>
                    <td className="p-2 border border-slate-200 font-sans font-semibold">XYZ INFOTECH PVT LTD</td>
                    <td className="p-2 border border-slate-200 text-right">₹ 1,40,000.00</td>
                    <td className="p-2 border border-slate-200 text-right">₹ 25,200.00</td>
                    <td className="p-2 border border-slate-200 text-right font-bold">₹ 1,65,200.00</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200">2026-04-15</td>
                    <td className="p-2 border border-slate-200">INV-2026-1003</td>
                    <td className="p-2 border border-slate-200 font-sans font-semibold">GLOBAL TECH TRADERS</td>
                    <td className="p-2 border border-slate-200 text-right">₹ 2,10,000.00</td>
                    <td className="p-2 border border-slate-200 text-right">₹ 37,800.00</td>
                    <td className="p-2 border border-slate-200 text-right font-bold">₹ 2,47,800.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Footer */}
            {settings.showFooter && (
              <div className="absolute bottom-6 left-8 right-8 border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <div>{settings.footerText}</div>
                {settings.includePageNumbers && <div>Page 1 of 1</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
