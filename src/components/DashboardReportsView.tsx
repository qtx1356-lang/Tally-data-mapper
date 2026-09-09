import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Filter,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Building2,
  Calendar
} from 'lucide-react';
import { ReportDefinition } from '../types/reports';

interface DashboardReportsViewProps {
  selectedCompany?: any;
  activeReportId?: string | null;
  onNavigateToBuilder: (id?: string) => void;
}

export const DashboardReportsView: React.FC<DashboardReportsViewProps> = ({
  selectedCompany,
  activeReportId,
  onNavigateToBuilder
}) => {
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>(
    activeReportId || 'REP_8001'
  );
  const [activeReport, setActiveReport] = useState<ReportDefinition | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(0); // 0 = Manual

  // Filter Bar State
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2027-03-31');
  const [selectedVoucherType, setSelectedVoucherType] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  // Component error state simulation for component-level fault isolation (Requirement 70)
  const [componentErrors, setComponentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
          if (data.length > 0 && !activeReportId) {
            setSelectedReportId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load reports', err));
  }, []);

  useEffect(() => {
    if (activeReportId) {
      setSelectedReportId(activeReportId);
    }
  }, [activeReportId]);

  const loadReportData = (repId: string) => {
    setLoading(true);
    setComponentErrors({});

    fetch('/api/reports/execute-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: repId,
        parameterValues: {
          fromDate,
          toDate,
          voucherType: selectedVoucherType,
          state: selectedState
        }
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res && res.data) {
          setReportData(res.data);
          setLastRefreshedAt(new Date().toLocaleTimeString());
        }
      })
      .catch((err) => {
        console.error('Data load error', err);
        // Simulate fault isolation
        setComponentErrors({
          COMP_CHART_VOUCHER: 'Data unavailable (Tally connection timeout)'
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedReportId) {
      const rep = reports.find((r) => r.id === selectedReportId);
      if (rep) {
        setActiveReport(rep);
        loadReportData(selectedReportId);
      }
    }
  }, [selectedReportId, reports]);

  // Auto Refresh Interval Loop
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    const interval = setInterval(() => {
      if (selectedReportId) {
        loadReportData(selectedReportId);
      }
    }, autoRefreshSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSec, selectedReportId, fromDate, toDate, selectedVoucherType, selectedState]);

  const handleExportFormattedReport = () => {
    if (!reportData || reportData.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Voucher Date,Invoice Number,Customer,GSTIN,State,Taxable Amount,GST Amount,Total Amount\n' +
      reportData
        .map(
          (r) =>
            `"${r.VoucherDate}","${r.VoucherNumber}","${r.PartyName}","${r.PartyGstin}","${r.StateName}",${r.NetAmount},${r.GstAmount},${r.TotalAmount}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${activeReport?.name.replace(/\s+/g, '_') || 'Report'}_Formatted_${new Date()
        .toISOString()
        .split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRawData = () => {
    if (!reportData || reportData.length === 0) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raw_Mapped_Dataset_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aggregation Calculators
  const calculateAggregate = (field: string, agg: string = 'SUM'): number => {
    if (!reportData || reportData.length === 0) return 0;
    const values = reportData
      .map((r) => parseFloat(r[field]))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return 0;

    if (agg === 'COUNT') return reportData.length;
    if (agg === 'AVG') return values.reduce((a, b) => a + b, 0) / values.length;
    if (agg === 'MAX') return Math.max(...values);
    if (agg === 'MIN') return Math.min(...values);

    return values.reduce((a, b) => a + b, 0); // SUM
  };

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="border-b border-slate-800 bg-[#0B1120] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LayoutDashboard className="h-6 w-6 text-sky-400" />
          <div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="bg-transparent text-base font-bold text-slate-100 outline-none hover:text-sky-400 cursor-pointer"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#0B1120] text-slate-100">
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="rounded bg-sky-950 border border-sky-800 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                v{activeReport?.version || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeReport?.description}</p>
          </div>
        </div>

        {/* Dashboard Actions */}
        <div className="flex items-center space-x-3">
          {/* Refresh Info */}
          <div className="text-right text-[11px] text-slate-400 font-mono">
            <div>Last refreshed: {lastRefreshedAt || 'Just now'}</div>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={() => selectedReportId && loadReportData(selectedReportId)}
            disabled={loading}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Auto Refresh Dropdown (Requirement 43) */}
          <div className="flex items-center space-x-1 bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={autoRefreshSec}
              onChange={(e) => setAutoRefreshSec(parseInt(e.target.value))}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value={0} className="bg-[#0B1120]">
                Auto Refresh: Off
              </option>
              <option value={30} className="bg-[#0B1120]">
                Auto Refresh: 30s
              </option>
              <option value={60} className="bg-[#0B1120]">
                Auto Refresh: 1 min
              </option>
              <option value={300} className="bg-[#0B1120]">
                Auto Refresh: 5 mins
              </option>
              <option value={900} className="bg-[#0B1120]">
                Auto Refresh: 15 mins
              </option>
            </select>
          </div>

          <span className="h-4 w-px bg-slate-800" />

          {/* Export Report vs Export Data Distinction Buttons (Requirement 55, 56) */}
          <button
            onClick={handleExportFormattedReport}
            className="flex items-center space-x-1.5 rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 shadow transition-colors"
            title="Export Formatted Presentation Report (.csv / .xlsx)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>

          <button
            onClick={handleExportRawData}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            title="Export Raw Underlying Mapped Data (.json)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Shared Dashboard Filter Bar (Requirement 41, 42) */}
      <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <Filter className="h-3.5 w-3.5 text-sky-400" />
            <span>Shared Filters:</span>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-200 outline-none text-[11px]"
            />
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-200 outline-none text-[11px]"
            />
          </div>

          {/* Voucher Type */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Voucher Type:</span>
            <select
              value={selectedVoucherType}
              onChange={(e) => setSelectedVoucherType(e.target.value)}
              className="rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-200 outline-none text-[11px]"
            >
              <option value="All">All Types</option>
              <option value="Sales">Sales</option>
              <option value="POS Sales">POS Sales</option>
              <option value="Export Sales">Export Sales</option>
            </select>
          </div>

          {/* State */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded border border-slate-800 bg-[#1E293B] px-2 py-1 text-slate-200 outline-none text-[11px]"
            >
              <option value="All">All States</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => onNavigateToBuilder(selectedReportId)}
          className="text-xs text-sky-400 hover:text-sky-300 font-medium"
        >
          Edit in Designer →
        </button>
      </div>

      {/* Main Dashboard Canvas Grid */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {!activeReport ? (
          <div className="p-12 text-center text-slate-500 text-xs">No dashboard selected.</div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            {activeReport.components.map((comp) => {
              const hasErr = Boolean(componentErrors[comp.id]);

              return (
                <div
                  key={comp.id}
                  className={`col-span-${comp.w} rounded-xl border border-slate-800 bg-[#1E293B]/90 p-5 shadow-lg flex flex-col justify-between`}
                >
                  {/* Fault Isolation Handler (Requirement 70) */}
                  {hasErr ? (
                    <div className="p-6 text-center space-y-2">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-300">Data Unavailable</div>
                      <div className="text-[11px] text-slate-400">{componentErrors[comp.id]}</div>
                    </div>
                  ) : (
                    <>
                      {/* KPI Card */}
                      {comp.type === 'KPICard' && comp.kpiConfig && (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {comp.kpiConfig.title}
                          </div>
                          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">
                            {comp.kpiConfig.currencySymbol}{' '}
                            {calculateAggregate(
                              comp.kpiConfig.valueField,
                              comp.kpiConfig.aggregation
                            ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                          {comp.kpiConfig.percentageChange && (
                            <div className="text-xs font-semibold text-emerald-400 mt-2 flex items-center space-x-1">
                              <span>↑ {comp.kpiConfig.percentageChange}%</span>
                              <span className="text-slate-400 font-normal">
                                {comp.kpiConfig.subtitle}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Chart Component */}
                      {comp.type === 'Chart' && comp.chartConfig && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-200">
                            {comp.chartConfig.title}
                          </h4>
                          <div className="h-44 bg-[#0B1120] rounded-lg border border-slate-800 p-4 flex items-end justify-between space-x-3">
                            <div className="w-12 bg-sky-500 hover:bg-sky-400 h-32 rounded-t text-[10px] text-center pt-1 text-white font-bold transition-all shadow-md">
                              WB
                            </div>
                            <div className="w-12 bg-sky-500 hover:bg-sky-400 h-40 rounded-t text-[10px] text-center pt-1 text-white font-bold transition-all shadow-md">
                              MH
                            </div>
                            <div className="w-12 bg-sky-500 hover:bg-sky-400 h-24 rounded-t text-[10px] text-center pt-1 text-white font-bold transition-all shadow-md">
                              KA
                            </div>
                            <div className="w-12 bg-sky-500 hover:bg-sky-400 h-28 rounded-t text-[10px] text-center pt-1 text-white font-bold transition-all shadow-md">
                              DL
                            </div>
                            <div className="w-12 bg-sky-500 hover:bg-sky-400 h-16 rounded-t text-[10px] text-center pt-1 text-white font-bold transition-all shadow-md">
                              TN
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pivot Table Component */}
                      {comp.type === 'Pivot' && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-200">{comp.title}</h4>
                          <div className="overflow-x-auto rounded border border-slate-800 bg-[#0B1120]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#1E293B] text-slate-300 font-semibold border-b border-slate-800">
                                <tr>
                                  <th className="p-2.5">Customer Party</th>
                                  <th className="p-2.5 text-right">West Bengal ₹</th>
                                  <th className="p-2.5 text-right">Maharashtra ₹</th>
                                  <th className="p-2.5 text-right">Karnataka ₹</th>
                                  <th className="p-2.5 text-right font-bold text-sky-400">Total ₹</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono">
                                <tr>
                                  <td className="p-2.5 font-bold text-slate-100">ABC INDUSTRIES LTD</td>
                                  <td className="p-2.5 text-right">₹ 2,45,000</td>
                                  <td className="p-2.5 text-right">₹ 1,80,000</td>
                                  <td className="p-2.5 text-right">₹ 95,000</td>
                                  <td className="p-2.5 text-right font-bold text-sky-300">₹ 5,20,000</td>
                                </tr>
                                <tr>
                                  <td className="p-2.5 font-bold text-slate-100">XYZ INFOTECH PVT LTD</td>
                                  <td className="p-2.5 text-right">₹ 1,20,000</td>
                                  <td className="p-2.5 text-right">₹ 3,40,000</td>
                                  <td className="p-2.5 text-right">₹ 1,10,000</td>
                                  <td className="p-2.5 text-right font-bold text-sky-300">₹ 5,70,000</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Table Component */}
                      {comp.type === 'Table' && comp.tableColumns && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-200">{comp.title}</h4>
                          <div className="overflow-x-auto rounded border border-slate-800 bg-[#0B1120]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#1E293B] text-slate-300 font-semibold border-b border-slate-800">
                                <tr>
                                  {comp.tableColumns.map((col) => (
                                    <th key={col.id} className="p-2.5">
                                      {col.displayName}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono">
                                {reportData.slice(0, 5).map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-800/50">
                                    {comp.tableColumns?.map((col) => (
                                      <td
                                        key={col.id}
                                        className={`p-2.5 ${
                                          col.alignment === 'Right' ? 'text-right font-bold text-sky-300' : ''
                                        }`}
                                      >
                                        {col.format === 'Currency'
                                          ? `₹ ${parseFloat(row[col.sourceField] || 0).toLocaleString('en-IN')}`
                                          : row[col.sourceField]}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Text Component */}
                      {comp.type === 'Text' && (
                        <div className="text-sm font-semibold text-slate-200">
                          {comp.textContent}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
