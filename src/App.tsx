import React, { useState, useEffect } from 'react';
import { DataDiscoveryView } from './components/DataDiscoveryView';
import { DataExplorerView } from './components/DataExplorerView';
import { OutputMapperView } from './components/OutputMapperView';
import { SavedTemplatesView } from './components/SavedTemplatesView';
import { ExportDataView } from './components/ExportDataView';
import { ExportProfilesView } from './components/ExportProfilesView';
import { ExportHistoryView } from './components/ExportHistoryView';
import { AutomationView } from './components/AutomationView';
import { ReportBuilderView } from './components/ReportBuilderView';
import { ReportLibraryView } from './components/ReportLibraryView';
import { DashboardReportsView } from './components/DashboardReportsView';
import { DocumentPdfEngineView } from './components/DocumentPdfEngineView';
import { ReportSchedulerView } from './components/ReportSchedulerView';
import { ReportPackagesView } from './components/ReportPackagesView';
import { UniversalSchemaExplorerView } from './components/UniversalSchemaExplorerView';
import { UniversalQueryAndDataView } from './components/UniversalQueryAndDataView';
import { ReconciliationAndQualityView } from './components/ReconciliationAndQualityView';
import { TallyCopilotView } from './components/TallyCopilotView';
import { EnterpriseSecurityView } from './components/EnterpriseSecurityView';
import { EnterpriseAdminPortalView } from './components/EnterpriseAdminPortalView';
import { AccountingIntelligenceView } from './components/AccountingIntelligenceView';
import { UniversalOutputDiscoveryStudioView } from './components/UniversalOutputDiscoveryStudioView';
import { VisualQueryBuilderView } from './components/VisualQueryBuilderView';
import { UniversalTallyConnectorView } from './components/UniversalTallyConnectorView';
import { LocalDataEngineView } from './components/LocalDataEngineView';
import { ReportReconstructionView } from './components/ReportReconstructionView';
import { AutomationCenterView } from './components/AutomationCenterView';
import { ImportReconciliationCenterView } from './components/ImportReconciliationCenterView';
import { DocumentIntelligenceCenterView } from './components/DocumentIntelligenceCenterView';
import { FinancialControlCenterView } from './components/FinancialControlCenterView';
import { ConnectorCenterView } from './components/ConnectorCenterView';
import { OutputStudioView } from './components/OutputStudioView';
import { ControlCenterView } from './components/ControlCenterView';
import { IntelligenceCenterView } from './components/IntelligenceCenterView';
import { ConnectionsView } from './components/ConnectionsView';
import { ReportHarvesterView } from './components/ReportHarvesterView';
import { ReportCenterView } from './components/ReportCenterView';
import { ObjectGraphCenterView } from './components/ObjectGraphCenterView';
import { DataCatalogView } from './components/DataCatalogView';
import { Phase32HLineageCenterView } from './components/Phase32HLineageCenterView';
import { Phase32HSnapshotBackupView } from './components/Phase32HSnapshotBackupView';
import { Phase32HStorageHealthView } from './components/Phase32HStorageHealthView';
import { Phase32HSecurityAuditView } from './components/Phase32HSecurityAuditView';
import { Phase32IReportCenterView } from './components/Phase32IReportCenterView';
import { Phase32JTallyConnectionCenterView } from './components/Phase32JTallyConnectionCenterView';
import { Phase32KOutputReconstructionView } from './components/Phase32KOutputReconstructionView';
import { Phase32LAnalyticsView } from './components/Phase32LAnalyticsView';
import { Phase32MDesktopView } from './components/Phase32MDesktopView';
import { Phase32NWorkspaceView } from './components/Phase32NWorkspaceView';
import { Phase32OAutomationView } from './components/Phase32OAutomationView';
import { Phase32PFinancialIntelView } from './components/Phase32PFinancialIntelView';
import { Phase32QOutputCompatView } from './components/Phase32QOutputCompatView';
import { Phase32RCompatibilityView } from './components/Phase32RCompatibilityView';
import { Phase32SProfilingView } from './components/Phase32SProfilingView';
import { Phase32TReportEngineView } from './components/Phase32TReportEngineView';
import Phase32UAnalyticsWorkspaceView from './components/Phase32UAnalyticsWorkspaceView';
import Phase32VIntelligenceView from './components/Phase32VIntelligenceView';
import Phase32WAutomationView from './components/Phase32WAutomationView';
import Phase32XConsolidationView from './components/Phase32XConsolidationView';
import Phase32YApiGatewayView from './components/Phase32YApiGatewayView';
import Phase32ZPluginManagerView from './components/Phase32ZPluginManagerView';
import Phase33ProductionView from './components/Phase33ProductionView';
import Phase33ADiscoveryView from './components/Phase33ADiscoveryView';
import { AuditCenterView } from './components/audit/AuditCenterView';
import { AuditScannerView } from './components/audit/AuditScannerView';
import { ExceptionCenterView } from './components/audit/ExceptionCenterView';
import { AuditFindingsView } from './components/audit/AuditFindingsView';
import { AuditSamplingView } from './components/audit/AuditSamplingView';
import { AuditWorkspaceView } from './components/audit/AuditWorkspaceView';
import { AIAuditAssistantView } from './components/audit/AIAuditAssistantView';
import { FinancialAnalyticsView } from './components/audit/FinancialAnalyticsView';
import {
  Brain,
  LayoutDashboard,
  Server,
  Blocks,
  Radio,
  BarChart3,
  Building2,
  Compass,
  Database,
  GitMerge,
  Filter,
  FileCode,
  Download,
  Activity,
  Settings,
  Info,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FolderTree,
  Terminal,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Shield,
  FileText,
  Code2,
  Unplug,
  Check,
  ArrowRight,
  Clock,
  Settings2,
  Sliders,
  Printer,
  Mail,
  BookOpen,
  Layers,
  Scale,
  Bot,
  Sparkles,
  Globe,
  Zap,
  ArrowLeftRight,
  ScanText,
  FileSpreadsheet,
  GitFork,
  GitBranch,
  Archive,
  HardDrive,
  Monitor,
  Users,
  Search,
  PieChart,
  LineChart,
  ShoppingBag,
  Truck,
  CreditCard,
  Wallet,
  Box,
  Key,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

type NavigationPage =
  | 'Dashboard'
  // Tally
  | 'Tally Connection'
  | 'Company Explorer'
  | 'Smart Tally Discovery'
  | 'Data Mapping'
  // Audit
  | 'Audit Center'
  | 'Automated Audit Scanner'
  | 'Risk & Exceptions'
  | 'Audit Sampling'
  | 'Audit Workspace'
  | 'Audit Findings'
  // Analysis
  | 'Financial Analytics'
  | 'Receivable Analysis'
  | 'Payable Analysis'
  | 'Sales Analysis'
  | 'Purchase Analysis'
  | 'Expense Analysis'
  | 'GST & Tax Analytics'
  | 'Cash & Bank Analytics'
  | 'Inventory Analysis'
  | 'Consolidated Accounts'
  // Intelligence
  | 'AI Audit Assistant'
  | 'Anomaly Detection'
  | 'Financial Intelligence'
  | 'Company Profiling'
  // Reporting
  | 'Report Library'
  | 'Visual Dashboards'
  | 'Report Designer'
  | 'Report Scheduler'
  | 'Report Packages'
  // Automation
  | 'Automation Center'
  | 'Scheduled Jobs'
  | 'API Gateway'
  | 'Plugins'
  // System
  | 'Security & Admin'
  | 'System Health'
  | 'Backup & Restore'
  | 'About';

interface AppSettings {
  tallyHost: string;
  tallyPort: number;
  connectionTimeoutSeconds: number;
  previewRecordLimit: number;
  defaultExportDirectory: string;
  logLevel: string;
  theme: string;
  autoConnect: boolean;
  autoDetectCompany: boolean;
  lastSelectedCompanyName: string;
  lastSelectedCompanyGuid: string;
}

interface TallyCompany {
  id: string;
  name: string;
  guid?: string;
  booksFrom?: string;
  financialYearFrom?: string;
  financialYearTo?: string;
  isActive: boolean;
  isSelected: boolean;
  rawIdentifier?: string;
}

interface ConnectionResult {
  success: boolean;
  status: 'Connected' | 'Connecting' | 'Failed' | 'Timeout' | 'Disconnected';
  errorCode: string;
  errorMessage: string;
  technicalDetails: string;
  responseTimeMs: number;
  protocol: string;
  testedAt: string;
  rawPreview: string;
}

interface DiagnosticReport {
  host: string;
  port: number;
  dnsResolved: boolean;
  resolvedIp: string;
  httpAvailable: boolean;
  httpStatusCode: number;
  responseTimeMs: number;
  tallyDetected: boolean;
  detectedVersion: string;
  companyDetected: boolean;
  currentCompany: string;
  odbcCapabilityStatus: string;
  xmlCapabilityStatus: string;
  jsonCapabilityStatus: string;
  tdlCapabilityStatus: string;
  technicalDetails: string;
  lastError: string;
  checkedAt: string;
  rawOutput: string;
}

interface ProjectFileTree {
  project: string;
  files: string[];
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('Dashboard');
  const [connectionStatus, setConnectionStatus] = useState<'Disconnected' | 'Connecting' | 'Connected' | 'Failed' | 'Timeout'>('Disconnected');
  const [lastResult, setLastResult] = useState<ConnectionResult | null>(null);
  
  // Companies & Context
  const [companies, setCompanies] = useState<TallyCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<TallyCompany | null>(null);
  const [companyVerifyStatus, setCompanyVerifyStatus] = useState<string>('');
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState<boolean>(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    tallyHost: 'localhost',
    tallyPort: 9000,
    connectionTimeoutSeconds: 10,
    previewRecordLimit: 100,
    defaultExportDirectory: '%LOCALAPPDATA%\\EXFIN\\TallyDataMapper\\',
    logLevel: 'Information',
    theme: 'Dark',
    autoConnect: true,
    autoDetectCompany: true,
    lastSelectedCompanyName: '',
    lastSelectedCompanyGuid: ''
  });
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<string>('');

  // Diagnostics State
  const [diagnosticsHost, setDiagnosticsHost] = useState<string>('localhost');
  const [diagnosticsPort, setDiagnosticsPort] = useState<number>(9000);
  const [diagnosticsProtocol, setDiagnosticsProtocol] = useState<string>('HTTP / XML (Default)');
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Solution File Tree State
  const [solutionProjects, setSolutionProjects] = useState<ProjectFileTree[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('EXFIN.TallyMapper.sln');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [selectedReportForDesigner, setSelectedReportForDesigner] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'EXFIN.TallyMapper.sln': true,
    'EXFIN.TallyMapper.App': true,
    'EXFIN.TallyMapper.Core': true,
    'EXFIN.TallyMapper.Tally': true,
    'EXFIN.TallyMapper.Database': true,
    'EXFIN.TallyMapper.Discovery': true,
    'EXFIN.TallyMapper.Mapping': true,
    'EXFIN.TallyMapper.Export': true,
    'EXFIN.TallyMapper.Tests': true
  });

  // Output Mapper Navigation State
  const [selectedMappingIdToLoad, setSelectedMappingIdToLoad] = useState<string | null>(null);

  // Load Settings & Initial AutoConnect
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: AppSettings) => {
        setSettings(data);
        setDiagnosticsHost(data.tallyHost || 'localhost');
        setDiagnosticsPort(data.tallyPort || 9000);

        if (data.autoConnect) {
          testConnection(data.tallyHost, data.tallyPort, data.connectionTimeoutSeconds, true);
        }
      })
      .catch(() => {});

    fetchSolutionFiles();
  }, []);

  const fetchSolutionFiles = () => {
    fetch('/api/solution/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setSolutionProjects(data.projects);
        }
      })
      .catch(() => {});
  };

  const loadFileContent = (path: string) => {
    setSelectedFile(path);
    fetch(`/api/solution/file-content?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedFileContent(data.content || '// Content unavailable');
      })
      .catch(() => {
        setSelectedFileContent('// Error loading file content');
      });
  };

  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
  }, []);

  const testConnection = (host = settings.tallyHost, port = settings.tallyPort, timeout = settings.connectionTimeoutSeconds, isAuto = false) => {
    setConnectionStatus('Connecting');
    setCompanyVerifyStatus('');

    fetch('/api/tally/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, timeoutSeconds: timeout })
    })
      .then((res) => res.json())
      .then((data: ConnectionResult) => {
        setLastResult(data);
        if (data.success) {
          setConnectionStatus('Connected');
          fetchCompanies(host, port, timeout);
        } else {
          setConnectionStatus(data.status === 'Timeout' ? 'Timeout' : 'Failed');
          if (isAuto) {
            // Keep app usable, don't block
          }
        }
      })
      .catch((err) => {
        setConnectionStatus('Failed');
        setLastResult({
          success: false,
          status: 'Failed',
          errorCode: 'CONNECTION_REFUSED',
          errorMessage: `The TallyPrime connection was refused at ${host}:${port}.`,
          technicalDetails: err.message,
          responseTimeMs: 0,
          protocol: 'HTTP',
          testedAt: new Date().toISOString(),
          rawPreview: ''
        });
      });
  };

  const fetchCompanies = (host = settings.tallyHost, port = settings.tallyPort, timeout = settings.connectionTimeoutSeconds) => {
    setIsFetchingCompanies(true);
    fetch('/api/tally/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, timeoutSeconds: timeout })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsFetchingCompanies(false);
        if (data.success && data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
          const activeComp = data.companies.find((c: TallyCompany) => c.isActive) || data.companies[0];
          setSelectedCompany(activeComp);
        } else {
          setCompanies([]);
        }
      })
      .catch(() => {
        setIsFetchingCompanies(false);
      });
  };

  const verifyCompanyContext = () => {
    if (!selectedCompany) return;
    setCompanyVerifyStatus('Verifying company in TallyPrime...');
    fetch('/api/tally/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: settings.tallyHost, port: settings.tallyPort, timeoutSeconds: settings.connectionTimeoutSeconds })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.companies) {
          const exists = data.companies.some((c: TallyCompany) => c.name.toLowerCase() === selectedCompany.name.toLowerCase());
          if (exists) {
            setCompanyVerifyStatus(`✓ Verified: '${selectedCompany.name}' is active in TallyPrime.`);
          } else {
            setCompanyVerifyStatus(`Selected company '${selectedCompany.name}' is no longer available in TallyPrime.`);
            setSelectedCompany(null);
          }
        } else {
          setCompanyVerifyStatus('Could not verify company context.');
        }
      })
      .catch(() => {
        setCompanyVerifyStatus('Verification error.');
      });
  };

  const disconnect = () => {
    setConnectionStatus('Disconnected');
    setSelectedCompany(null);
    setLastResult(null);
    setCompanyVerifyStatus('Disconnected by user.');
  };

  const handleSaveSettings = () => {
    setSaveSettingsStatus('Saving settings to SQLite / DB...');
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSaveSettingsStatus('Settings persisted successfully!');
          setTimeout(() => setSaveSettingsStatus(''), 3000);
        }
      })
      .catch(() => {
        setSaveSettingsStatus('Failed to save settings');
      });
  };

  const runDiagnostics = () => {
    setIsRunningDiagnostics(true);
    setDiagnosticReport(null);

    fetch('/api/diagnostics/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: diagnosticsHost, port: diagnosticsPort, timeoutSeconds: settings.connectionTimeoutSeconds })
    })
      .then((res) => res.json())
      .then((data: DiagnosticReport) => {
        setDiagnosticReport(data);
        setIsRunningDiagnostics(false);
        if (data.httpAvailable) {
          setConnectionStatus('Connected');
        } else {
          setConnectionStatus('Failed');
        }
      })
      .catch(() => {
        setIsRunningDiagnostics(false);
        setConnectionStatus('Failed');
      });
  };

  const handleCopyDiagnostics = () => {
    if (diagnosticReport) {
      navigator.clipboard.writeText(diagnosticReport.rawOutput);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const toggleProjectExpand = (projName: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projName]: !prev[projName]
    }));
  };

  const navigationStructure: { section: string; items: { label: NavigationPage; icon: any }[] }[] = [
    {
      section: 'DASHBOARD',
      items: [{ label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
      section: 'TALLY',
      items: [
        { label: 'Tally Connection', icon: Radio },
        { label: 'Company Explorer', icon: Building2 },
        { label: 'Smart Tally Discovery', icon: Compass },
        { label: 'Data Mapping', icon: GitMerge }
      ]
    },
    {
      section: 'AUDIT',
      items: [
        { label: 'Audit Center', icon: ShieldCheck },
        { label: 'Automated Audit Scanner', icon: Activity },
        { label: 'Risk & Exceptions', icon: AlertTriangle },
        { label: 'Audit Sampling', icon: Filter },
        { label: 'Audit Workspace', icon: FolderTree },
        { label: 'Audit Findings', icon: CheckCircle2 }
      ]
    },
    {
      section: 'ANALYSIS',
      items: [
        { label: 'Financial Analytics', icon: BarChart3 },
        { label: 'Receivable Analysis', icon: TrendingDown },
        { label: 'Payable Analysis', icon: TrendingUp },
        { label: 'Sales Analysis', icon: ShoppingBag },
        { label: 'Purchase Analysis', icon: Truck },
        { label: 'Expense Analysis', icon: CreditCard },
        { label: 'GST & Tax Analytics', icon: Scale },
        { label: 'Cash & Bank Analytics', icon: Wallet },
        { label: 'Inventory Analysis', icon: Box },
        { label: 'Consolidated Accounts', icon: Globe }
      ]
    },
    {
      section: 'INTELLIGENCE',
      items: [
        { label: 'AI Audit Assistant', icon: Brain },
        { label: 'Anomaly Detection', icon: Zap },
        { label: 'Financial Intelligence', icon: Sparkles },
        { label: 'Company Profiling', icon: Search }
      ]
    },
    {
      section: 'REPORTING',
      items: [
        { label: 'Report Library', icon: FileSpreadsheet },
        { label: 'Visual Dashboards', icon: PieChart },
        { label: 'Report Designer', icon: FileCode },
        { label: 'Report Scheduler', icon: Mail },
        { label: 'Report Packages', icon: BookOpen }
      ]
    },
    {
      section: 'AUTOMATION',
      items: [
        { label: 'Automation Center', icon: Zap },
        { label: 'Scheduled Jobs', icon: Clock },
        { label: 'API Gateway', icon: Server },
        { label: 'Plugins', icon: Blocks }
      ]
    },
    {
      section: 'SYSTEM',
      items: [
        { label: 'Security & Admin', icon: Key },
        { label: 'System Health', icon: HardDrive },
        { label: 'Backup & Restore', icon: Archive },
        { label: 'About', icon: Info }
      ]
    }
  ];

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <header className="flex h-12 w-full items-center justify-between border-b border-slate-800 bg-[#0B1120] px-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 font-black text-white text-xs shadow-md">
            EX
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-100 tracking-wide leading-none">
              EXFIN Tally Audit Platform
            </span>
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
              Financial Intelligence & Compliance
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status Pill with Text */}
          <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-[#1E293B] px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'Connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : connectionStatus === 'Connecting'
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="text-slate-200 font-medium text-[10px]">
              {connectionStatus === 'Connected'
                ? 'Connected'
                : connectionStatus === 'Connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
          </div>

          {/* Current Company Context Pill */}
          <button
            onClick={() => setShowCompanyModal(true)}
            className="flex items-center space-x-2 text-[10px] text-slate-300 bg-slate-900/80 hover:bg-slate-800 px-3 py-1 rounded border border-slate-800 transition-colors"
          >
            <Building2 className="h-3 w-3 text-sky-400" />
            <span className="font-semibold text-slate-200 max-w-[150px] truncate">
              {selectedCompany ? selectedCompany.name : 'Select Company'}
            </span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-[#0B1120] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-800">
            {navigationStructure.map((section) => (
              <div key={section.section} className="mb-6 px-3">
                <h3 className="text-[10px] font-black text-slate-500 px-3 mb-2 tracking-[0.2em] uppercase">
                  {section.section}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.label;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setCurrentPage(item.label)}
                        className={`flex w-full items-center space-x-2.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-sky-600/10 text-sky-400 border border-sky-500/20 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-800 bg-[#070b14]">
             <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v1.0.1 Stable</span>
             </div>
          </div>
        </aside>

        {/* Workspace Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#0F172A] p-6">
          {/* Dashboard View */}
          {currentPage === 'Dashboard' && (
             <div className="space-y-6 max-w-6xl mx-auto">
               <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                 <div>
                   <h1 className="text-xl font-bold text-slate-100">Financial Intelligence Overview</h1>
                   <p className="text-xs text-slate-400 mt-0.5">
                     Unified monitoring and analytics dashboard for the connected TallyPrime environment.
                   </p>
                 </div>
                 <button
                   onClick={() => setCurrentPage('Audit Center')}
                   className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-900/20 flex items-center space-x-2 transition-all hover:scale-[1.02]"
                 >
                   <ShieldCheck className="h-4 w-4" />
                   <span>Enter Audit Center</span>
                 </button>
               </div>

               {/* Stats Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: 'Active Company', val: selectedCompany?.name || 'None', icon: Building2, color: 'text-sky-400' },
                   { label: 'Vouchers Analysed', val: '12,540', icon: Activity, color: 'text-emerald-400' },
                   { label: 'Risk Exceptions', val: '84', icon: AlertTriangle, color: 'text-rose-400' },
                   { label: 'Audit Progress', val: '32%', icon: CheckCircle2, color: 'text-amber-400' }
                 ].map(stat => (
                   <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                         <stat.icon className={`w-5 h-5 ${stat.color}`} />
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Overview</span>
                      </div>
                      <div className="space-y-0.5">
                         <span className="text-xs text-slate-400 block">{stat.label}</span>
                         <span className="text-xl font-black text-slate-50 truncate block">{stat.val}</span>
                      </div>
                   </div>
                 ))}
               </div>

               {/* Main Dashboard Layout */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                     <h3 className="text-sm font-bold text-slate-50 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-sky-400" />
                        Revenue & Risk Trend
                     </h3>
                     <div className="h-48 w-full flex items-end gap-1.5 px-2">
                        {[30, 45, 35, 60, 85, 40, 55, 70, 45, 95, 55, 75].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                             <div className="w-full bg-slate-800 rounded-t-lg h-full overflow-hidden relative">
                                <div className="absolute bottom-0 left-0 w-full bg-sky-500/80" style={{ height: `${h}%` }} />
                                <div className="absolute bottom-0 left-0 w-full bg-rose-500/40" style={{ height: `${h * 0.3}%` }} />
                             </div>
                             <span className="text-[9px] font-bold text-slate-600 uppercase">M{i+1}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-sky-900/40 to-indigo-900/40 border border-sky-500/20 rounded-3xl p-6 flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="p-3 bg-sky-500/20 rounded-2xl w-fit">
                           <Brain className="w-6 h-6 text-sky-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-50">AI Audit Assistant</h3>
                        <p className="text-sky-200/60 text-xs leading-relaxed">
                           Analyze complex Tally transaction patterns and detect anomalies using the integrated intelligence engine.
                        </p>
                     </div>
                     <button 
                       onClick={() => setCurrentPage('AI Audit Assistant')}
                       className="mt-8 w-full py-3 bg-white text-sky-950 font-black text-xs uppercase tracking-[0.15em] rounded-xl hover:bg-sky-50 transition-all shadow-xl shadow-sky-950/20"
                     >
                       Launch Assistant
                     </button>
                  </div>
               </div>
             </div>
          )}

          {/* Tally Views */}
          {currentPage === 'Tally Connection' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-100">Tally Connection Dashboard</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time TallyPrime connection monitoring, protocol discovery, and company context
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCompanyModal(true)}
                    className="rounded bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow flex items-center space-x-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Select Company</span>
                  </button>
                  <button
                    onClick={() => testConnection()}
                    className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 flex items-center space-x-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>

              {/* Real Connection Status Banner */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`h-3.5 w-3.5 rounded-full ${
                        connectionStatus === 'Connected'
                          ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                          : connectionStatus === 'Connecting'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                        <span>TALLY CONNECTION</span>
                        <span className="text-xs font-mono font-normal text-slate-400">
                          ● {connectionStatus}
                        </span>
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Target Endpoint: <span className="text-slate-200 font-mono">http://{settings.tallyHost}:{settings.tallyPort}/</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {connectionStatus === 'Connected' && (
                      <button
                        onClick={disconnect}
                        className="flex items-center space-x-1.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors"
                      >
                        <Unplug className="h-3.5 w-3.5" />
                        <span>Disconnect</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowCompanyModal(true)}
                      className="flex items-center space-x-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <Building2 className="h-3.5 w-3.5 text-sky-400" />
                      <span>Change Company</span>
                    </button>
                    <button
                      onClick={() => testConnection()}
                      className="flex items-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
                  <div className="rounded bg-slate-900/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Host</span>
                    <span className="font-mono text-slate-200 font-semibold">{settings.tallyHost}</span>
                  </div>

                  <div className="rounded bg-slate-900/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Port</span>
                    <span className="font-mono text-slate-200 font-semibold">{settings.tallyPort}</span>
                  </div>

                  <div className="rounded bg-slate-900/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Tally Server</span>
                    <span className={`font-semibold ${connectionStatus === 'Connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {connectionStatus === 'Connected' ? 'Detected' : 'Not Detected'}
                    </span>
                  </div>

                  <div className="rounded bg-slate-900/60 p-2.5 border border-slate-800 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Company</span>
                    <span className="text-slate-100 font-semibold truncate block" title={selectedCompany?.name || 'None'}>
                      {selectedCompany ? selectedCompany.name : 'None Selected'}
                    </span>
                  </div>

                  <div className="rounded bg-slate-900/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Financial Year</span>
                    <span className="text-slate-300 font-mono text-[11px] block truncate">
                      {selectedCompany?.financialYearFrom && selectedCompany?.financialYearTo
                        ? `${selectedCompany.financialYearFrom.substring(0, 4)}-${selectedCompany.financialYearTo.substring(2, 4)}`
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="rounded bg-slate-900/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Response Time</span>
                    <span className="font-mono text-sky-400 font-semibold">
                      {lastResult ? `${lastResult.responseTimeMs} ms` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Friendly Error Banner if Failed */}
                {lastResult && !lastResult.success && (
                  <div className="rounded border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-rose-300">{lastResult.errorMessage}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{lastResult.technicalDetails}</div>
                      <div className="pt-1 flex items-center space-x-2">
                        <button
                          onClick={() => testConnection()}
                          className="rounded bg-rose-900 hover:bg-rose-800 px-3 py-1 text-[11px] font-semibold text-white"
                        >
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Context & Verification Action Card */}
              {selectedCompany && (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{selectedCompany.name}</h3>
                      <p className="text-xs text-slate-400">
                        Financial Year: <span className="text-slate-200 font-mono">{selectedCompany.financialYearFrom || '01-04-2026'} → {selectedCompany.financialYearTo || '31-03-2027'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {companyVerifyStatus && (
                      <span className="text-xs font-mono text-emerald-400">{companyVerifyStatus}</span>
                    )}
                    <button
                      onClick={verifyCompanyContext}
                      className="rounded border border-sky-700 bg-sky-900/60 hover:bg-sky-800 px-3 py-1.5 text-xs font-semibold text-sky-200 flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                      <span>Verify Company</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Diagnostics Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Protocol Capabilities</span>
                    <Activity className="h-3.5 w-3.5 text-sky-400" />
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-900/50">
                      <span className="text-slate-300">HTTP Connection</span>
                      <span className={connectionStatus === 'Connected' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {connectionStatus === 'Connected' ? '✓ Tested & Available' : '✗ Unavailable'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-900/50">
                      <span className="text-slate-300">XML Interface</span>
                      <span className={connectionStatus === 'Connected' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {connectionStatus === 'Connected' ? '✓ Tested & Available' : '? Not available'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Host Settings</span>
                    <Settings className="h-3.5 w-3.5 text-purple-400" />
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <span className="text-[10px] text-slate-500 font-bold uppercase">Host</span>
                           <input 
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:border-sky-500 outline-none"
                              value={settings.tallyHost}
                              onChange={(e) => setSettings({...settings, tallyHost: e.target.value})}
                           />
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] text-slate-500 font-bold uppercase">Port</span>
                           <input 
                              type="number"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:border-sky-500 outline-none"
                              value={settings.tallyPort}
                              onChange={(e) => setSettings({...settings, tallyPort: parseInt(e.target.value)})}
                           />
                        </div>
                    </div>
                    <button 
                      onClick={handleSaveSettings}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase border border-slate-700 rounded transition-all"
                    >
                      Update Connection Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Companies View / Selection */}
          {(currentPage === 'Companies' || showCompanyModal) && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-100">SELECT TALLY COMPANY</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Query active company contexts directly from TallyPrime integration interface
                  </p>
                </div>
                {showCompanyModal && (
                  <button
                    onClick={() => setShowCompanyModal(false)}
                    className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs text-slate-300"
                  >
                    Close
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-6 shadow-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Available Company
                  </label>
                  {companies.length > 0 ? (
                    <select
                      value={selectedCompany?.name || ''}
                      onChange={(e) => {
                        const found = companies.find((c) => c.name === e.target.value);
                        if (found) setSelectedCompany(found);
                      }}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 font-semibold focus:border-sky-500 focus:outline-none"
                    >
                      {companies.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name} {c.isActive ? '(Active in Tally)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded border border-slate-800 bg-slate-900/60 p-4 text-center text-xs text-slate-400">
                      {isFetchingCompanies ? 'Fetching company list from TallyPrime...' : 'No companies detected. Ensure TallyPrime is open and connected.'}
                    </div>
                  )}
                </div>

                {selectedCompany && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Financial Year:</span>
                      <span className="font-mono text-slate-100 font-bold">
                        {selectedCompany.financialYearFrom || '01-04-2026'} → {selectedCompany.financialYearTo || '31-03-2027'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-semibold">Active in Tally</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => fetchCompanies()}
                    disabled={isFetchingCompanies}
                    className="flex items-center space-x-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-200"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${isFetchingCompanies ? 'animate-spin' : ''}`} />
                    <span>Refresh Companies</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedCompany) {
                        setShowCompanyModal(false);
                        setCurrentPage('Dashboard');
                      }
                    }}
                    disabled={!selectedCompany}
                    className="flex items-center space-x-2 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow"
                  >
                    <Check className="h-4 w-4" />
                    <span>Select Company</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Connection Diagnostics View */}
          {currentPage === 'Connection Diagnostics' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-slate-100">Connection Diagnostics</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test and troubleshoot TallyPrime connectivity, capabilities, and endpoint health
                </p>
              </div>

              {/* Diagnostic Form */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Host / IP
                    </label>
                    <input
                      type="text"
                      value={diagnosticsHost}
                      onChange={(e) => setDiagnosticsHost(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Port
                    </label>
                    <input
                      type="number"
                      value={diagnosticsPort}
                      onChange={(e) => setDiagnosticsPort(Number(e.target.value))}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Protocol
                    </label>
                    <select
                      value={diagnosticsProtocol}
                      onChange={(e) => setDiagnosticsProtocol(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="HTTP / XML (Default)">Tally HTTP / XML (Port 9000)</option>
                      <option value="Windows ODBC">Windows ODBC Driver Check</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={runDiagnostics}
                    disabled={isRunningDiagnostics}
                    className="flex items-center space-x-2 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 px-4 py-2 text-xs font-medium text-white shadow transition-colors"
                  >
                    <Activity className={`h-4 w-4 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                    <span>{isRunningDiagnostics ? 'Running Diagnostic Checks...' : 'Test Connection'}</span>
                  </button>

                  {diagnosticReport && (
                    <button
                      onClick={handleCopyDiagnostics}
                      className="flex items-center space-x-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-300"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy Diagnostics'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Diagnostic Results Cards */}
              {diagnosticReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded border border-slate-800 bg-[#1E293B] p-3">
                      <span className="text-[11px] text-slate-400">DNS Resolution</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-mono text-slate-200">
                          {diagnosticReport.resolvedIp}
                        </span>
                      </div>
                    </div>

                    <div className="rounded border border-slate-800 bg-[#1E293B] p-3">
                      <span className="text-[11px] text-slate-400">HTTP Connection</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {diagnosticReport.httpAvailable ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                        <span className="text-xs font-medium text-slate-200">
                          {diagnosticReport.httpAvailable ? `✓ Connected (${diagnosticReport.responseTimeMs} ms)` : '✗ Failed'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded border border-slate-800 bg-[#1E293B] p-3">
                      <span className="text-[11px] text-slate-400">Tally Server</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {diagnosticReport.tallyDetected ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        )}
                        <span className="text-xs font-medium text-slate-200">
                          {diagnosticReport.tallyDetected ? diagnosticReport.detectedVersion : 'Not Detected'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded border border-slate-800 bg-[#1E293B] p-3">
                      <span className="text-[11px] text-slate-400">Active Company</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {diagnosticReport.currentCompany}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities List */}
                  <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-2 text-xs">
                    <h4 className="font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-2">
                      Detected Capabilities
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-400 block">XML Capability</span>
                        <span className="font-semibold text-emerald-400">{diagnosticReport.xmlCapabilityStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">ODBC Capability</span>
                        <span className="font-mono text-amber-400">{diagnosticReport.odbcCapabilityStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">JSON Capability</span>
                        <span className="font-mono text-slate-400">{diagnosticReport.jsonCapabilityStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">TDL Capability</span>
                        <span className="font-semibold text-emerald-400">{diagnosticReport.tdlCapabilityStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details Accordion */}
                  <div className="rounded-lg border border-slate-800 bg-[#1E293B] overflow-hidden">
                    <button
                      onClick={() => setShowTechDetails(!showTechDetails)}
                      className="flex w-full items-center justify-between p-3.5 text-xs font-medium text-slate-300 hover:bg-slate-800/60"
                    >
                      <span className="flex items-center space-x-2">
                        <Terminal className="h-4 w-4 text-sky-400" />
                        <span>Technical Details & Raw Preview</span>
                      </span>
                      {showTechDetails ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {showTechDetails && (
                      <div className="border-t border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                        {diagnosticReport.rawOutput}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings View */}
          {currentPage === 'Settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-slate-100">Application Settings</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure connection defaults, timeouts, auto-connect behaviors, and database persistence
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-4">
                    Tally Connection Defaults
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tally Host
                      </label>
                      <input
                        type="text"
                        value={settings.tallyHost}
                        onChange={(e) => setSettings({ ...settings, tallyHost: e.target.value })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tally Port
                      </label>
                      <input
                        type="number"
                        value={settings.tallyPort}
                        onChange={(e) => setSettings({ ...settings, tallyPort: Number(e.target.value) })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Connection Timeout (Seconds)
                      </label>
                      <input
                        type="number"
                        value={settings.connectionTimeoutSeconds}
                        onChange={(e) => setSettings({ ...settings, connectionTimeoutSeconds: Number(e.target.value) })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-4">
                    Automation Options
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoConnect}
                        onChange={(e) => setSettings({ ...settings, autoConnect: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-300">
                        Auto Connect: Automatically test Tally connection on startup
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoDetectCompany}
                        onChange={(e) => setSettings({ ...settings, autoDetectCompany: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-300">
                        Auto Detect Company: Automatically select active company on connection
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-medium text-white shadow transition-colors"
                  >
                    Save Settings
                  </button>
                  {saveSettingsStatus && (
                    <span className="text-xs text-emerald-400 font-medium">
                      {saveSettingsStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Solution Inspector View */}
          {currentPage === 'Solution Inspector' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="border-b border-slate-800 pb-3 flex-shrink-0">
                <h1 className="text-xl font-bold text-slate-100">Solution File Inspector</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Browse generated .NET 8 solution files (`EXFIN.TallyMapper.sln`), C# source code, and XAML views
                </p>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
                {/* Left File Tree */}
                <div className="md:col-span-4 rounded-lg border border-slate-800 bg-[#1E293B] p-3 overflow-y-auto">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <FolderTree className="h-3.5 w-3.5 text-sky-400" />
                    <span>EXFIN.TallyMapper.sln</span>
                  </h3>

                  <div className="space-y-2 text-xs font-mono">
                    {solutionProjects.map((p) => {
                      const isExpanded = expandedProjects[p.project];
                      return (
                        <div key={p.project} className="space-y-1">
                          <button
                            onClick={() => toggleProjectExpand(p.project)}
                            className="flex w-full items-center space-x-1.5 text-slate-300 hover:text-white py-1 px-1 rounded hover:bg-slate-800/60"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            <span className="font-semibold text-sky-300 truncate">
                              {p.project}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="pl-4 space-y-0.5">
                              {p.files.map((filePath) => {
                                const fileName = filePath.split('/').pop() || filePath;
                                const isSelected = selectedFile === filePath;
                                return (
                                  <button
                                    key={filePath}
                                    onClick={() => loadFileContent(filePath)}
                                    className={`flex w-full items-center space-x-1.5 px-2 py-1 rounded text-left truncate transition-colors ${
                                      isSelected
                                        ? 'bg-sky-600/30 text-sky-300 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                    }`}
                                  >
                                    <FileText className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                    <span className="truncate">{fileName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Code Viewer */}
                <div className="md:col-span-8 rounded-lg border border-slate-800 bg-slate-950 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B] px-4 py-2 flex-shrink-0">
                    <span className="text-xs font-mono font-semibold text-sky-400 flex items-center space-x-1.5">
                      <Code2 className="h-3.5 w-3.5" />
                      <span>{selectedFile || 'Select a file'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      C# / .NET 8 / WPF Source Code
                    </span>
                  </div>

                  <div className="flex-1 p-4 overflow-auto font-mono text-[11px] text-slate-200 whitespace-pre">
                    {selectedFileContent}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About View */}
          {currentPage === 'About' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-slate-100">About EXFIN Tally Data Mapper</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production-quality Windows desktop application specification and codebase
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 font-black text-white text-base shadow">
                    EX
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">EXFIN Tally Data Mapper</h2>
                    <span className="text-slate-400 font-mono">Phase 2 Implemented</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Core Architecture & Isolation</h3>
                  <p>
                    EXFIN Tally Data Mapper connects to TallyPrime via standard integration protocols (Tally ODBC, HTTP XML, HTTP JSON, and TDL) without modifying proprietary Tally data files.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Local Storage Paths</h3>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400">
                    <li>App Data: %LOCALAPPDATA%\EXFIN\TallyDataMapper\</li>
                    <li>Logs: %LOCALAPPDATA%\EXFIN\TallyDataMapper\Logs\</li>
                    <li>Database: %LOCALAPPDATA%\EXFIN\TallyDataMapper\exfin_mapper.db</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Data Discovery View */}
          {currentPage === 'Data Discovery' && (
            <DataDiscoveryView
              selectedCompany={selectedCompany}
              onNavigateToExplorer={() => setCurrentPage('Data Explorer')}
            />
          )}

          {/* Data Explorer View */}
          {currentPage === 'Data Explorer' && (
            <DataExplorerView
              selectedCompany={selectedCompany}
            />
          )}

          {/* Output Mapper View */}
          {currentPage === 'Output Mapper' && (
            <OutputMapperView
              selectedCompany={selectedCompany}
              mappingIdToLoad={selectedMappingIdToLoad}
              onOpenTemplatesLibrary={() => setCurrentPage('Saved Templates')}
            />
          )}

          {/* Saved Templates View */}
          {currentPage === 'Saved Templates' && (
            <SavedTemplatesView
              selectedCompany={selectedCompany}
              onSelectMapping={(id) => {
                setSelectedMappingIdToLoad(id);
                setCurrentPage('Output Mapper');
              }}
              onCreateNewMapping={() => {
                setSelectedMappingIdToLoad(null);
                setCurrentPage('Output Mapper');
              }}
            />
          )}

          {/* Export Data View */}
          {currentPage === 'Export Data' && (
            <ExportDataView
              selectedCompany={selectedCompany}
              initialMappingId={selectedMappingIdToLoad}
              onNavigateToHistory={() => setCurrentPage('Export History')}
              onNavigateToProfiles={() => setCurrentPage('Export Profiles')}
            />
          )}

          {/* Export Profiles View */}
          {currentPage === 'Export Profiles' && (
            <ExportProfilesView
              onRunProfile={(profile) => {
                setSelectedMappingIdToLoad(profile.mappingId);
                setCurrentPage('Export Data');
              }}
              onCreateNew={() => setCurrentPage('Export Data')}
            />
          )}

          {/* Export History View */}
          {currentPage === 'Export History' && (
            <ExportHistoryView
              onRetryExport={(item) => {
                setSelectedMappingIdToLoad(item.mappingId);
                setCurrentPage('Export Data');
              }}
            />
          )}

          {/* Phase 32A: Universal Normalized Tally Data Model & Schema Registry */}
          {currentPage === 'Data Catalog' && <DataCatalogView />}

          {/* Phase 31: Accounting Object Graph & Semantic Join Engine */}
          {currentPage === 'Object Graph' && <ObjectGraphCenterView />}

          {/* Phase 32H: Operational Safety Layer (Lineage, Snapshots, Backup, Storage, Audit) */}
          {currentPage === 'Data Lineage Center' && <Phase32HLineageCenterView />}
          {currentPage === 'Backup & Restore' && <Phase32HSnapshotBackupView />}
          {currentPage === 'Storage & System Health' && <Phase32HStorageHealthView />}
          {currentPage === 'Security & Audit Center' && <Phase32HSecurityAuditView />}

          {/* Phase 32I: Universal Tally Reporting System */}
          {currentPage === 'Reports' && <Phase32IReportCenterView />}
          {currentPage === 'Universal Report Center' && <Phase32IReportCenterView />}

          {/* Phase 29: Universal Report Harvester & Automatic Enumeration */}
          {currentPage === 'Report Harvester' && <ReportHarvesterView />}

          {/* Phase 32K: Output Reconstruction & Report Equivalence Engine */}
          {currentPage === 'Report Reconstruction Engine' && <Phase32KOutputReconstructionView />}

          {/* Phase 32L: Advanced Analytics & Dataset Explorer */}
          {currentPage === 'Phase 32L Analytics' && <Phase32LAnalyticsView />}

          {/* Phase 32M: Desktop Distribution & Production Hardening */}
          {currentPage === 'Phase 32M Desktop' && <Phase32MDesktopView />}

          {/* Phase 32N: Secure Multi-Company, Multi-User Workspace Architecture */}
          {currentPage === 'Phase 32N Workspace' && <Phase32NWorkspaceView />}

          {/* Phase 32O: Enterprise Automation Engine */}
          {currentPage === 'Phase 32O Automation' && <Phase32OAutomationView />}

          {/* Phase 32P: Advanced Financial & Management Intelligence */}
          {currentPage === 'Phase 32P Financial Intel' && <Phase32PFinancialIntelView />}

          {/* Phase 32Q: Universal Tally Output Discovery & Report Compatibility */}
          {currentPage === 'Phase 32Q Output Compat' && <Phase32QOutputCompatView />}

          {/* Phase 33A: Adaptive Discovery */}
          {currentPage === 'Phase 33A Adaptive Discovery' && <Phase33ADiscoveryView />}

          {/* Phase 33: Production Desktop Environment */}
          {currentPage === 'Phase 33 Desktop App' && <Phase33ProductionView />}

          {/* Phase 32Z: Extension Framework */}
          {currentPage === 'Phase 32Z Plugins' && <Phase32ZPluginManagerView />}

          {/* Phase 32Y: API / Integration Gateway */}
          {currentPage === 'Phase 32Y API Gateway' && <Phase32YApiGatewayView />}

          {/* Phase 32X: Multi-Company Consolidation & Group Reporting */}
          {currentPage === 'Phase 32X Consolidation' && <Phase32XConsolidationView />}

          {/* Phase 32W: Universal Automation & Scheduled Intelligence Engine */}
          {currentPage === 'Phase 32W Automation' && <Phase32WAutomationView />}

          {/* Phase 32V: Explainable Intelligence Engine */}
          {currentPage === 'Phase 32V Intelligence' && <Phase32VIntelligenceView />}

          {/* Phase 32U: Interactive Analytics Workspace & Visual Report Designer */}
          {currentPage === 'Phase 32U Analytics' && <Phase32UAnalyticsWorkspaceView />}

          {/* Phase 32T: Universal Report Engine & Drill-down Workspace */}
          {currentPage === 'Phase 32T Reports' && <Phase32TReportEngineView />}

          {/* Phase 32S: Universal Tally Company Profiling & Semantic Mapping */}
          {currentPage === 'Phase 32S Profiling' && <Phase32SProfilingView />}

          {/* Phase 32R: Universal Tally Compatibility Matrix & Evolution */}
          {currentPage === 'Phase 32R Compatibility' && <Phase32RCompatibilityView />}

          {/* Phase 32J: Modular Tally Connectivity Layer & Capability Auto-Detection */}
          {currentPage === 'Connections' && <Phase32JTallyConnectionCenterView />}
          {currentPage === 'Connector Center' && <Phase32JTallyConnectionCenterView />}

          {/* Phase 27: Advanced Tally Intelligence & Anomaly Detection */}
          {currentPage === 'Intelligence' && <IntelligenceCenterView />}

          {/* Phase 26: Enterprise Workflow & Control Center */}
          {currentPage === 'Control Center' && <ControlCenterView />}

          {/* Phase 25: Universal Output Studio & Report Builder */}
          {currentPage === 'Output Studio' && <OutputStudioView />}

          {/* Phase 24: Enterprise Tally Integration & Connector Center */}
          {currentPage === 'Connector Center' && <ConnectorCenterView />}

          {/* Phase 23: Advanced Business Intelligence & Financial Control Center */}
          {currentPage === 'Financial Control' && <FinancialControlCenterView />}

          {/* Phase 22: Enterprise Document Intelligence & OCR */}
          {currentPage === 'Enterprise Document Intelligence' && <DocumentIntelligenceCenterView />}

          {/* Phase 21: Universal Data Import & Reconciliation */}
          {currentPage === 'Universal Data Import & Reconciliation' && <ImportReconciliationCenterView />}

          {/* Automation Jobs View & Enterprise Automation Center */}
          {currentPage === 'Automation Jobs' && <AutomationCenterView />}
          {currentPage === 'Enterprise Automation Center' && <AutomationCenterView />}

          {/* Report Designer View */}
          {currentPage === 'Report Designer' && (
            <ReportBuilderView
              initialReportId={selectedReportForDesigner}
              onBackToLibrary={() => setCurrentPage('Report Library')}
            />
          )}

          {/* Reporting Views */}
          {currentPage === 'Report Library' && (
            <ReportLibraryView
              onOpenReportInDesigner={(id) => {
                setSelectedReportForDesigner(id);
                setCurrentPage('Report Designer');
              }}
              onRunDashboard={(id) => {
                setSelectedReportForDesigner(id);
                setCurrentPage('Visual Dashboards');
              }}
            />
          )}

          {currentPage === 'Visual Dashboards' && (
            <DashboardReportsView
              selectedCompany={selectedCompany}
              activeReportId={selectedReportForDesigner}
              onNavigateToBuilder={(id) => {
                setSelectedReportForDesigner(id || null);
                setCurrentPage('Report Designer');
              }}
            />
          )}

          {currentPage === 'Report Designer' && (
            <ReportBuilderView 
               selectedCompany={selectedCompany} 
               initialReportId={selectedReportForDesigner}
            />
          )}

          {currentPage === 'Report Scheduler' && <ReportSchedulerView />}
          {currentPage === 'Report Packages' && <ReportPackagesView />}

          {/* Automation Views */}
          {currentPage === 'Automation Center' && <AutomationCenterView />}
          {currentPage === 'Scheduled Jobs' && <AutomationView />}
          {currentPage === 'API Gateway' && <Phase32YApiGatewayView />}
          {currentPage === 'Plugins' && <Phase32ZPluginManagerView />}

          {/* System Views */}
          {currentPage === 'Security & Admin' && (
             <EnterpriseSecurityView />
          )}
          {currentPage === 'System Health' && <Phase32HStorageHealthView />}
          {currentPage === 'Backup & Restore' && <Phase32HSnapshotBackupView />}
          {currentPage === 'About' && (
             <div className="max-w-2xl mx-auto space-y-8 py-12 text-center">
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl inline-block shadow-2xl">
                   <div className="w-24 h-24 bg-sky-600 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-sky-950/40">
                      EX
                   </div>
                </div>
                <div className="space-y-2">
                   <h1 className="text-3xl font-black text-slate-50 tracking-tight">EXFIN Tally Audit Platform</h1>
                   <p className="text-sky-400 font-bold uppercase tracking-[0.25em] text-[10px]">Enterprise Intelligence Edition</p>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
                   A professional financial audit analytics and decision-support platform designed to integrate directly with TallyPrime datasets. Empowering auditors with rule-based scanning, AI assistance, and deep-dive forensic intelligence.
                </p>
                <div className="pt-8 border-t border-slate-800 flex justify-center gap-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <div className="space-y-1">
                      <span className="block text-slate-300">Version</span>
                      <span>1.0.1 (Desktop)</span>
                   </div>
                   <div className="space-y-1">
                      <span className="block text-slate-300">Engine</span>
                      <span>Tally-V3 Unified</span>
                   </div>
                   <div className="space-y-1">
                      <span className="block text-slate-300">Status</span>
                      <span className="text-emerald-500">Certified Stable</span>
                   </div>
                </div>
             </div>
          )}

          {/* Fallback views for unmapped labels */}
          {currentPage === 'Smart Tally Discovery' && <Phase33ADiscoveryView />}
          {currentPage === 'Data Mapping' && (
             <OutputMapperView 
               selectedMappingId={selectedMappingIdToLoad}
               onMappingLoaded={() => setSelectedMappingIdToLoad(null)}
             />
          )}
          {currentPage === 'Anomaly Detection' && <Phase32VIntelligenceView />}
          {currentPage === 'Financial Intelligence' && <Phase32PFinancialIntelView />}
          {currentPage === 'Company Profiling' && <Phase32SProfilingView />}
          {currentPage === 'Consolidated Accounts' && <Phase32XConsolidationView />}
        </main>
      </div>
    </div>
  );
}
