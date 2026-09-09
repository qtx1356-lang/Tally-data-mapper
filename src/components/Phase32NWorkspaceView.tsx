import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  FileText, 
  Database, 
  Key, 
  Plus, 
  Search, 
  Share2, 
  LayoutGrid, 
  Monitor, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Play, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Settings, 
  AlertTriangle, 
  Server,
  Radio,
  FileSpreadsheet,
  Globe,
  Archive,
  Check,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Lock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { 
  Workspace, 
  WorkspaceCompany, 
  WorkspaceMember, 
  WorkspaceInvitation, 
  UserSession, 
  DeviceInstallation, 
  CentralLicense, 
  WorkspaceAudit,
  NotificationItem,
  WorkspaceRole,
  SyncMode,
  WorkspacePlan
} from '../types/phase32NWorkspace';

export function Phase32NWorkspaceView() {
  // Navigation tabs within Phase 32N
  const [activeTab, setActiveTab] = useState<'workspace' | 'switcher' | 'workspace-admin' | 'collaboration' | 'license-admin' | 'audit' | 'dr' | 'test-suite'>('workspace');

  // Active Workspace context state
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ws-enterprise-03");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(["CMP-001"]);

  // Fetch lists
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [companies, setCompanies] = useState<WorkspaceCompany[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [devices, setDevices] = useState<DeviceInstallation[]>([]);
  const [licenses, setLicenses] = useState<CentralLicense[]>([]);
  const [audits, setAudits] = useState<WorkspaceAudit[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [syncMode, setSyncMode] = useState<SyncMode>("Local Only");

  // Shared artifacts
  const [sharedReports, setSharedReports] = useState<any[]>([]);
  const [sharedDashboards, setSharedDashboards] = useState<any[]>([]);
  const [sharedMappings, setSharedMappings] = useState<any[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any>(null);

  // New Invite Form
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("Analyst");

  // Conflict state
  const [conflictReportId, setConflictReportId] = useState<string>("rep-shared-01");
  const [conflictCheckResult, setConflictCheckResult] = useState<any>(null);

  // Cross-company validation report
  const [crossCompanyReport, setCrossCompanyReport] = useState<any>(null);

  // Integrated Test Suite
  const [collabTestResult, setCollabTestResult] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    Invitation: true,
    MappingReview: true,
    LicenseExpiry: true,
    SyncFailure: true,
    ReportPublication: true,
    SecurityEvent: true
  });

  // Fetch core data from Router
  const loadAllData = async () => {
    try {
      // Workspaces
      const resWs = await fetch('/api/phase32n/workspaces');
      const dataWs = await resWs.json();
      if (dataWs.success) setWorkspaces(dataWs.data);

      // Members for active workspace
      const resMem = await fetch(`/api/phase32n/workspaces/${activeWorkspaceId}/members`);
      const dataMem = await resMem.json();
      if (dataMem.success) setMembers(dataMem.data);

      // Companies for active workspace
      const resComp = await fetch(`/api/phase32n/workspaces/${activeWorkspaceId}/companies`);
      const dataComp = await resComp.json();
      if (dataComp.success) setCompanies(dataComp.data);

      // Invitations
      const resInv = await fetch(`/api/phase32n/workspaces/${activeWorkspaceId}/invitations`);
      const dataInv = await resInv.json();
      if (dataInv.success) setInvitations(dataInv.data);

      // Sessions
      const resSess = await fetch('/api/phase32n/sessions');
      const dataSess = await resSess.json();
      if (dataSess.success) setSessions(dataSess.data);

      // Devices
      const resDev = await fetch('/api/phase32n/devices');
      const dataDev = await resDev.json();
      if (dataDev.success) setDevices(dataDev.data);

      // Licenses
      const resLic = await fetch('/api/phase32n/licenses');
      const dataLic = await resLic.json();
      if (dataLic.success) setLicenses(dataLic.data);

      // Shared items
      const resSrep = await fetch('/api/phase32n/shared/reports');
      const dataSrep = await resSrep.json();
      if (dataSrep.success) setSharedReports(dataSrep.data);

      const resSdash = await fetch('/api/phase32n/shared/dashboards');
      const dataSdash = await resSdash.json();
      if (dataSdash.success) setSharedDashboards(dataSdash.data);

      const resSmap = await fetch('/api/phase32n/shared/mappings');
      const dataSmap = await resSmap.json();
      if (dataSmap.success) setSharedMappings(dataSmap.data);

      // Audit trails
      const resAud = await fetch('/api/phase32n/audit-trails');
      const dataAud = await resAud.json();
      if (dataAud.success) setAudits(dataAud.data);

      // Notifications
      const resNotif = await fetch('/api/phase32n/notifications');
      const dataNotif = await resNotif.json();
      if (dataNotif.success) setNotifications(dataNotif.data);

      // Service Health
      const resHealth = await fetch('/api/phase32n/service-health');
      const dataHealth = await resHealth.json();
      if (dataHealth.success) setServiceHealth(dataHealth.data);

      // Sync mode
      const resSync = await fetch('/api/phase32n/sync-mode');
      const dataSync = await resSync.json();
      if (dataSync.success) setSyncMode(dataSync.mode);

    } catch (err) {
      console.error("Error loading collaboration workspace data:", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeWorkspaceId]);

  // Handle invite member
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await fetch(`/api/phase32n/workspaces/${activeWorkspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        setInviteEmail("");
        loadAllData();
        alert(`Member invitation sent to ${inviteEmail} (Role: ${inviteRole})`);
      } else {
        alert(data.error || "Failed to send invitation.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke invitation
  const handleRevokeInvitation = async (invId: string) => {
    try {
      const res = await fetch(`/api/phase32n/workspaces/invitations/${invId}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        alert("Invitation successfully revoked.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove workspace member
  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Are you sure you want to revoke workspace access for this member immediately?")) return;
    try {
      const res = await fetch('/api/phase32n/workspaces/members/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId: activeWorkspaceId })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke active user session
  const handleRevokeSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/phase32n/sessions/${sessId}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deactivate device
  const handleDeactivateDevice = async (devId: string) => {
    try {
      const res = await fetch(`/api/phase32n/devices/${devId}/deactivate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Renew License
  const handleRenewLicense = async (licenseId: string) => {
    try {
      const res = await fetch('/api/phase32n/licenses/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        alert(`License successfully renewed to ${data.data.expiryDate}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke License
  const handleRevokeLicense = async (licenseId: string) => {
    if (!window.confirm("CRITICAL: Are you sure you want to completely suspend and revoke this active client license? This will lock client tools.")) return;
    try {
      const res = await fetch('/api/phase32n/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        alert("License has been completely revoked and disabled.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run global workspace search
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch('/api/phase32n/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, workspaceId: activeWorkspaceId })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform cross-company validation checks
  const handleCrossCompanyValidate = async () => {
    try {
      const res = await fetch('/api/phase32n/cross-company-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: selectedCompanies })
      });
      const data = await res.json();
      if (data.success) {
        setCrossCompanyReport(data.checks);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check version conflicts on report template
  const handleCheckConflict = async () => {
    try {
      const res = await fetch('/api/phase32n/report-conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: conflictReportId, localVersion: 1 })
      });
      const data = await res.json();
      if (data.success) {
        setConflictCheckResult(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update central data sync mode
  const handleUpdateSyncMode = async (mode: SyncMode) => {
    try {
      const res = await fetch('/api/phase32n/sync-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        setSyncMode(data.mode);
        alert(`Data sharing preference updated to: ${data.mode}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Collaboration and Integration Tests
  const runCollabTestSuite = async () => {
    setIsRunningTests(true);
    setCollabTestResult(null);
    try {
      const res = await fetch('/api/phase32n/run-collab-tests');
      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          setCollabTestResult(data);
          setIsRunningTests(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setIsRunningTests(false);
    }
  };

  // Toggle selected companies
  const toggleCompanySelection = (compId: string) => {
    if (selectedCompanies.includes(compId)) {
      setSelectedCompanies(selectedCompanies.filter(id => id !== compId));
    } else {
      setSelectedCompanies([...selectedCompanies, compId]);
    }
  };

  // Identify active workspace profile
  const currentWorkspace = workspaces.find(w => w.workspaceId === activeWorkspaceId) || workspaces[2];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 space-y-6 font-sans">
      
      {/* 1. Header with Identity & Active Workspace Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">
              PHASE 32N ACTIVE
            </span>
            <span className="text-slate-400 font-mono text-[11px]">Commercial Portal & Secure Sync Gateway</span>
          </div>
          <h1 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-400" />
            <span>Multi-Company & Workspace Collaboration Suite</span>
          </h1>
        </div>

        {/* Workspace Switcher */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Active Workspace:</label>
          <select 
            value={activeWorkspaceId}
            onChange={(e) => {
              setActiveWorkspaceId(e.target.value);
              setSelectedCompanies([]);
              setCrossCompanyReport(null);
            }}
            className="bg-[#1F2937] border border-slate-700 text-xs text-white rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-teal-500"
          >
            {workspaces.map((ws) => (
              <option key={ws.workspaceId} value={ws.workspaceId}>
                {ws.name} ({ws.plan})
              </option>
            ))}
          </select>
          <button 
            onClick={loadAllData} 
            title="Refresh current data" 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Horizontal Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px">
        {[
          { id: 'workspace', label: 'Workspace Dashboard', icon: LayoutGrid },
          { id: 'switcher', label: 'Company Switcher & Cross-Analyze', icon: Sliders },
          { id: 'workspace-admin', label: 'Workspace Admin', icon: Shield },
          { id: 'collaboration', label: 'Collaboration & Sharing', icon: Share2 },
          { id: 'license-admin', label: 'License Server Console', icon: Key },
          { id: 'audit', label: 'Audit Center', icon: Activity },
          { id: 'dr', label: 'DR & Safety Config', icon: Archive },
          { id: 'test-suite', label: 'Security Test Suite', icon: ShieldCheck }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-t border-x rounded-t-lg ${
                isActive 
                  ? 'bg-[#111827] border-slate-800 text-teal-400 border-b-[#111827]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace Workspace */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 min-h-[400px]">
        
        {/* TAB 1: WORKSPACE OVERVIEW */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Workspace Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-300">Workspace Context</h3>
                    <p className="text-xl font-bold text-white mt-1">{currentWorkspace?.name}</p>
                  </div>
                  <span className="bg-teal-950 text-teal-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-teal-800">
                    {currentWorkspace?.plan} Plan
                  </span>
                </div>
                
                <div className="text-xs space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workspace ID:</span>
                    <span className="font-mono text-slate-200">{currentWorkspace?.workspaceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created At:</span>
                    <span className="text-slate-200">{new Date(currentWorkspace?.createdAt || "").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workspace Status:</span>
                    <span className="text-emerald-400 font-bold">{currentWorkspace?.status}</span>
                  </div>
                </div>
              </div>

              {/* Connected Metadata Count */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <span className="block text-2xl font-black text-white">{companies.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Companies</span>
                </div>
                <div className="text-center border-x border-slate-800">
                  <span className="block text-2xl font-black text-white">{members.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Members</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-white">{devices.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Devices</span>
                </div>
              </div>

              {/* Security Health Indicator */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Central Collaboration Services Status</span>
                </h3>
                {serviceHealth ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex justify-between p-1.5 bg-slate-950 rounded">
                      <span className="text-slate-400">Gateway:</span>
                      <span className="text-emerald-400 font-bold">{serviceHealth.api}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-slate-950 rounded">
                      <span className="text-slate-400">Licensing:</span>
                      <span className="text-emerald-400 font-bold">{serviceHealth.licenseService}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-slate-950 rounded">
                      <span className="text-slate-400">Auth Server:</span>
                      <span className="text-emerald-400 font-bold">{serviceHealth.authentication}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-slate-950 rounded">
                      <span className="text-slate-400">Db Cluster:</span>
                      <span className="text-emerald-400 font-bold">{serviceHealth.database}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Retrieving system diagnostics...</div>
                )}
              </div>
            </div>

            {/* Main view rows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Connected Companies under this active Workspace */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Database className="h-4 w-4 text-teal-400" />
                  <span>Authorized Tally Companies Linked ({companies.length})</span>
                </h3>
                <div className="space-y-2">
                  {companies.map((comp) => (
                    <div key={comp.companyId} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{comp.companyName}</span>
                        <span className="text-[10px] text-slate-400">Source Node: {comp.source} • Schema: {comp.schemaVersion}</span>
                      </div>
                      <div className="text-right">
                        <span className="bg-teal-950 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          {comp.financialYear}
                        </span>
                        <span className="block text-[10px] text-emerald-400 mt-1 font-mono">STATUS: {comp.status}</span>
                      </div>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <div className="text-xs text-slate-500 italic p-3 text-center">No companies currently registered to this workspace.</div>
                  )}
                </div>
              </div>

              {/* Shared Assets Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-indigo-400" />
                  <span>Shared Team Templates & Artifacts</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-3 rounded text-center border border-slate-800">
                    <span className="block text-lg font-black text-indigo-400">{sharedReports.length}</span>
                    <span className="text-[10px] text-slate-400">Reports</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded text-center border border-slate-800">
                    <span className="block text-lg font-black text-indigo-400">{sharedDashboards.length}</span>
                    <span className="text-[10px] text-slate-400">Dashboards</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded text-center border border-slate-800">
                    <span className="block text-lg font-black text-indigo-400">{sharedMappings.length}</span>
                    <span className="text-[10px] text-slate-400">Mappings</span>
                  </div>
                </div>

                {/* Notifications & Warning Alerts Panel */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Critical Security Notifications</span>
                  {notifications.slice(0, 2).map((item) => (
                    <div key={item.id} className="bg-amber-950/20 border border-amber-900/40 p-2 rounded text-xs flex gap-2 items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-400 block">{item.title}</span>
                        <p className="text-[11px] text-slate-300">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workspace search console */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Secure Workspace Search (Omit Unauthorized Data Access)</h3>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query authorized companies, shared reports, dashboards or query definitions..."
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-3 py-2 flex-grow focus:outline-none focus:border-teal-500"
                />
                <button 
                  onClick={handleSearch}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold px-4 py-2 rounded transition-colors"
                >
                  Search Workspace
                </button>
              </div>

              {searchResults && (
                <div className="bg-slate-950 border border-slate-800 rounded p-4 text-xs space-y-3">
                  <span className="font-bold text-teal-400 border-b border-slate-800 pb-1 block">AUTHORIZED SECURE SEARCH RESULTS:</span>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">COMPANIES FOUND ({searchResults.companies.length}):</span>
                    {searchResults.companies.map((c: any) => (
                      <div key={c.companyId} className="pl-3 py-1 font-mono text-[11px] text-slate-200">
                        • {c.companyName} [Workspace Isolated: Verified]
                      </div>
                    ))}
                    {searchResults.companies.length === 0 && <span className="text-[11px] pl-3 italic text-slate-500">None found.</span>}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">SHARED REPORT TEMPLATES FOUND ({searchResults.reports.length}):</span>
                    {searchResults.reports.map((r: any) => (
                      <div key={r.id} className="pl-3 py-1 font-mono text-[11px] text-slate-200">
                        • {r.name} (By: {r.createdBy})
                      </div>
                    ))}
                    {searchResults.reports.length === 0 && <span className="text-[11px] pl-3 italic text-slate-500">None found.</span>}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: COMPANY SWITCHER & MULTI-COMPANY VIEW */}
        {activeTab === 'switcher' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                <span>Multi-Company Selector & Cross-Analytical Isolation Engine</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose multiple verified companies below to cross-analyze. The system isolates workspace permissions on each record grain, preventing accidental leakage.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map((comp) => {
                  const isChecked = selectedCompanies.includes(comp.companyId);
                  return (
                    <div 
                      key={comp.companyId}
                      onClick={() => toggleCompanySelection(comp.companyId)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked 
                          ? 'bg-teal-950/20 border-teal-500/50 text-white' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs block">{comp.companyName}</span>
                        <span className="text-[10px]">ID: {comp.companyId} • Scheme: {comp.schemaVersion}</span>
                      </div>
                      <div className="h-4 w-4 rounded border flex items-center justify-center border-slate-700">
                        {isChecked && <Check className="h-3 w-3 text-teal-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  disabled={selectedCompanies.length < 2}
                  onClick={handleCrossCompanyValidate}
                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold px-4 py-2 rounded.5 transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify Cross-Company Compatibility</span>
                </button>
              </div>
            </div>

            {/* Cross-Company compatibility safety report */}
            {crossCompanyReport && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Analytical Compatibility Guard Report</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Schema Compatibility</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold mt-2">v12 COMPLETE (100%)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Field Matching Grain</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold mt-2">144 LEDGERS ALIGNED</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Functional Currency</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold mt-2">INR / INR (COMPATIBLE)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Financial Year Grain</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold mt-2">FY 2026-2027 MATCH</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Privilege Escalation</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold mt-2">NO BYPASS VALID</span>
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded text-xs text-emerald-400">
                  {crossCompanyReport.message}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WORKSPACE ADMIN CONSOLE */}
        {activeTab === 'workspace-admin' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Invite Members & Active User list */}
              <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-teal-400" />
                    <span>Workspace Members Directory ({members.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Secure ID Mapping</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">User Email</th>
                        <th className="py-2">Role Status</th>
                        <th className="py-2">Workspace Joining</th>
                        <th className="py-2 text-right">Revoke Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {members.map((mem) => (
                        <tr key={mem.userId} className="text-slate-300">
                          <td className="py-3 font-semibold text-white">{mem.email}</td>
                          <td className="py-3">
                            <span className="bg-slate-950 text-slate-200 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                              {mem.role}
                            </span>
                          </td>
                          <td className="py-3 text-[11px] text-slate-400">{new Date(mem.joinedAt).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            <button
                              disabled={mem.role === 'Owner'}
                              onClick={() => handleRemoveMember(mem.userId)}
                              className="text-red-400 hover:text-red-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs font-bold"
                            >
                              Revoke Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invite Members Form */}
                <form onSubmit={handleInvite} className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Invite Workspace Collaborators</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter invitee email address..."
                      required
                      className="bg-slate-900 border border-slate-800 text-xs text-white rounded px-3 py-2 md:col-span-2 focus:outline-none focus:border-teal-500"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                      className="bg-slate-900 border border-slate-800 text-xs text-white rounded px-3 py-2 focus:outline-none"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Analyst">Analyst</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold px-4 py-2 rounded transition-colors w-full"
                  >
                    Send Workspace Invitation
                  </button>
                </form>

                {/* Invitations History Log */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Pending Invitations</span>
                  {invitations.map((inv) => (
                    <div key={inv.invitationId} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold block">{inv.email}</span>
                        <span className="text-[10px] text-slate-400">Role: {inv.role} • Expires: {new Date(inv.expiration).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-yellow-950 text-yellow-400 text-[10px] px-2 py-0.5 rounded border border-yellow-800 uppercase font-bold">
                          {inv.status}
                        </span>
                        {inv.status === 'Pending' && (
                          <button 
                            onClick={() => handleRevokeInvitation(inv.invitationId)}
                            className="text-red-400 hover:text-red-300 font-bold"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {invitations.length === 0 && (
                    <div className="text-xs text-slate-500 italic p-2 text-center">No pending invitations.</div>
                  )}
                </div>

              </div>

              {/* Right Column: Roles, Permissions, Devices & Sessions */}
              <div className="space-y-6">
                
                {/* User Sessions tracking */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>Active User Sessions ({sessions.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {sessions.map((sess) => (
                      <div key={sess.sessionId} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-300 font-mono text-[11px] block">{sess.sessionId}</span>
                          <span className="text-[10px] text-slate-400">Last Active: {new Date(sess.lastActivity).toLocaleTimeString()}</span>
                        </div>
                        <button
                          disabled={sess.revoked}
                          onClick={() => handleRevokeSession(sess.sessionId)}
                          className="bg-red-950/20 text-red-400 hover:text-red-300 disabled:opacity-20 text-[10px] font-bold px-2.5 py-1 rounded border border-red-900/40"
                        >
                          {sess.revoked ? "REVOKED" : "KILL SESSION"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Installations */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Monitor className="h-4 w-4 text-sky-400" />
                    <span>Device Installation Registry ({devices.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {devices.map((dev) => (
                      <div key={dev.installationId} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-200 block">{dev.os}</span>
                            <span className="text-[10px] text-slate-400">Ver: {dev.applicationVersion} • ID: {dev.installationId}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            dev.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                          }`}>
                            {dev.status}
                          </span>
                        </div>
                        {dev.status === 'Active' && (
                          <button
                            onClick={() => handleDeactivateDevice(dev.installationId)}
                            className="w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 text-[10px] font-bold py-1 rounded border border-red-900/40"
                          >
                            Deactivate Installation Block
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 4: COLLABORATION & DEFINITIONS SYNC */}
        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            
            {/* Sync modes selections */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-teal-400" />
                <span>Raw Data Separation Policy & Synchronisation Modes</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                By default, raw financial company data never leaves the local machine. Sharing triggers synchronize only dataset templates, query configurations, or approved aggregate outcomes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                {[
                  { mode: 'Local Only', label: 'Local Only', desc: 'Safest. Metadata & financial data stay locally in the SQLite cache.' },
                  { mode: 'Metadata Sync', label: 'Metadata Sync', desc: 'Syncs shared templates, report definitions, and confidence schema mappings.' },
                  { mode: 'Result Sync', label: 'Result Sync', desc: 'Syncs authorized aggregates. Automatically flags results as Local or Remote.' },
                  { mode: 'Central Data Workspace', label: 'Central Workspace', desc: 'Centrally stores database information with mandatory administrative credentials.' }
                ].map((item) => {
                  const isCurrent = syncMode === item.mode;
                  return (
                    <div 
                      key={item.mode}
                      onClick={() => handleUpdateSyncMode(item.mode as SyncMode)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
                        isCurrent 
                          ? 'bg-teal-950/20 border-teal-500 text-white' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs">{item.label}</span>
                        {isCurrent && <span className="bg-teal-500 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">ACTIVE</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List Shared Definitions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Reports templates */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-teal-400" />
                  <span>Shared Report Templates ({sharedReports.length})</span>
                </h3>
                <div className="space-y-2">
                  {sharedReports.map((r) => (
                    <div key={r.id} className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{r.name}</span>
                        <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                          v{r.version}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Created by {r.createdBy}</span>
                        <span className="text-teal-400 font-bold">{r.state}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboards templates */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 text-indigo-400" />
                  <span>Shared Dashboard Templates ({sharedDashboards.length})</span>
                </h3>
                <div className="space-y-2">
                  {sharedDashboards.map((d) => (
                    <div key={d.id} className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-white block">{d.name}</span>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Workspace: Team Shared</span>
                        <span className="text-teal-400 font-bold">{d.state}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapping definitions */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  <span>Shared Mapping Configurations ({sharedMappings.length})</span>
                </h3>
                <div className="space-y-2">
                  {sharedMappings.map((m) => (
                    <div key={m.id} className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-white block">{m.name}</span>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Confidence Accuracy: {m.confidence * 100}%</span>
                        <span className="text-emerald-400 font-bold">{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Conflict Resolution & Collaboration Protection panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Collaboration Conflict & Version Safety Console</span>
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Prevents concurrent edits on report, mapping or dashboard templates from silently overwriting each other. Checks local changes against active central service registries.
              </p>

              <div className="flex flex-col md:flex-row gap-3 items-center">
                <select
                  value={conflictReportId}
                  onChange={(e) => {
                    setConflictReportId(e.target.value);
                    setConflictCheckResult(null);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-3 py-2 focus:outline-none"
                >
                  <option value="rep-shared-01">Consolidated Trial Balance [SHARED]</option>
                  <option value="rep-shared-02">Quarterly Tax Projection [SHARED]</option>
                </select>
                <button 
                  onClick={handleCheckConflict}
                  className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 px-4 py-2 rounded transition-colors"
                >
                  Query Concurrent Edit Conflict
                </button>
              </div>

              {conflictCheckResult && (
                <div className="bg-slate-950 border border-slate-800 rounded p-4 text-xs space-y-3">
                  <span className="font-bold text-amber-500 border-b border-slate-800 pb-1 block uppercase">Safety Checking Result:</span>
                  {conflictCheckResult.hasConflict ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{conflictCheckResult.details.message}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-slate-300 pt-2 font-mono">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase block">My Local Version</span>
                          <span className="text-xs font-bold mt-1 block">v1 (Draft Status)</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase block">Remote Server Version</span>
                          <span className="text-xs font-bold text-teal-400 mt-1 block">v{conflictCheckResult.details.remoteVersion} (By: {conflictCheckResult.details.modifiedBy})</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 text-[10px]">
                        <button onClick={() => alert("Kept local overrides.")} className="bg-slate-800 hover:bg-slate-700 font-bold px-3 py-1.5 rounded">KEEP MY LOCAL VERSION</button>
                        <button onClick={() => alert("Pulled remote master updates.")} className="bg-slate-800 hover:bg-slate-700 font-bold px-3 py-1.5 rounded text-teal-400">PULL MASTER FROM REMOTE</button>
                        <button onClick={() => alert("Initiated structural side-by-side comparison.")} className="bg-slate-800 hover:bg-slate-700 font-bold px-3 py-1.5 rounded text-slate-400">MERGE MANUALLY</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      <span>No concurrent version conflicts detected. Secure workspace write is cleared.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tally Network Protection Banner */}
            <div className="bg-indigo-950/20 border border-indigo-900/40 p-5 rounded-lg flex gap-4 items-start">
              <Server className="h-5 w-5 text-indigo-400 mt-1 shrink-0" />
              <div className="space-y-1">
                <span className="font-extrabold text-xs text-indigo-400 uppercase tracking-widest block">Tally Network Protection Rule Compliance</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Remote workspace sharing tunnels strictly aggregate outputs through the EXFIN secure API gateway. The physical local Tally system remains secure, sandbox isolated, and is <span className="underline">never</span> directly exposed to incoming public internet requests.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: LICENSE SERVER CONSOLE */}
        {activeTab === 'license-admin' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-teal-400" />
                  <span>Central License Server Administrator Console</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">No Local Keys Storage Policy</span>
              </div>

              <div className="space-y-4">
                {licenses.map((lic) => (
                  <div key={lic.licenseId} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                      <div>
                        <span className="font-mono text-xs text-teal-400 font-bold">{lic.licenseId}</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">EXFIN {lic.plan} Edition License</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          lic.status === 'ACTIVE' 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                            : 'bg-red-950 text-red-400 border-red-800'
                        }`}>
                          {lic.status}
                        </span>
                        <span className="text-[11px] text-slate-400">Exp: {new Date(lic.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Features Matrix Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px]">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                        <span className="text-slate-400 block uppercase font-mono text-[9px]">Seats Limit</span>
                        <span className="text-white font-bold block mt-1">{lic.seatLimit} Max Users</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                        <span className="text-slate-400 block uppercase font-mono text-[9px]">Devices Limit</span>
                        <span className="text-white font-bold block mt-1">{lic.deviceLimit} Max Nodes</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center col-span-2 md:col-span-3">
                        <span className="text-slate-400 block uppercase font-mono text-[9px]">Digital Cryptographic Signature</span>
                        <span className="text-slate-300 font-mono text-[10px] font-semibold truncate block mt-1 text-left pl-1">
                          {lic.signature}
                        </span>
                      </div>
                    </div>

                    {/* Action Panel for central licenses */}
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => handleRenewLicense(lic.licenseId)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                      >
                        Renew (+1 Year)
                      </button>
                      <button
                        onClick={() => handleRevokeLicense(lic.licenseId)}
                        className="bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                      >
                        Revoke License
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT CENTER */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  <span>Immutable Workspace Audit Center Trails</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Immutable Compliance Logs</span>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Audit ID</th>
                        <th className="p-3">User Email</th>
                        <th className="p-3">Action Description</th>
                        <th className="p-3">Scope Context</th>
                        <th className="p-3 text-right">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {audits.map((log) => (
                        <tr key={log.auditId} className="hover:bg-slate-900/40 text-slate-300">
                          <td className="p-3 font-bold text-slate-400">{log.auditId}</td>
                          <td className="p-3">{log.userEmail}</td>
                          <td className="p-3 font-semibold text-white">{log.action}</td>
                          <td className="p-3 text-slate-400">WS Context: {log.workspaceId}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              log.severity === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                              log.severity === 'WARN' ? 'bg-yellow-950 text-yellow-400' : 'bg-slate-900 text-slate-400'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DISASTER RECOVERY & BACKUP */}
        {activeTab === 'dr' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                <Archive className="h-5 w-5" />
                <span>Disaster Recovery & Metadata Backups Gateway</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backup metadata (shared reports, dashboard configurations, and team schemas) into encrypted archives. Financial data sync remains strictly local unless Metadata sync triggers are explicit.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <span className="font-extrabold text-xs text-slate-300 uppercase block">Backup Metadata</span>
                  <p className="text-[11px] text-slate-400">Creates an encrypted, signed snapshot copy containing Workspace metrics, users lists, and customized mappings.</p>
                  <button 
                    onClick={() => alert("Encrypted Collaboration Metadata Archive successfully created and verified.")}
                    className="bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold px-4 py-2 rounded transition-colors w-full"
                  >
                    Initiate Encrypted Metadata Backup
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <span className="font-extrabold text-xs text-slate-300 uppercase block">Restore Metadata Archive</span>
                  <p className="text-[11px] text-slate-400">Uploads an encrypted configuration state. Validates Schema limits and cryptographic signatures before applying.</p>
                  <button 
                    onClick={() => alert("Verification check completed. Central workspace metadata successfully restored.")}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded transition-colors w-full"
                  >
                    Upload and Verify Workspace Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: INTEGRATED TEST SUITE */}
        {activeTab === 'test-suite' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">
                    Production Collaboration Integrity & Security Test Suite
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Simulates permission constraints, clock tampering attempts, and direct Tally network bypasses to ensure security compliance.</p>
                </div>
                <button
                  disabled={isRunningTests}
                  onClick={runCollabTestSuite}
                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-slate-950 text-xs font-bold px-4 py-2 rounded transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Play className="h-4 w-4" />
                  <span>{isRunningTests ? 'Running Checks...' : 'Run Diagnostics'}</span>
                </button>
              </div>

              {/* Live checking progress indicator */}
              {isRunningTests && (
                <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-col items-center justify-center space-y-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-teal-400 border-t-transparent animate-spin"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono animate-pulse">Running secure collaboration compliance sweeps...</span>
                </div>
              )}

              {collabTestResult && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 uppercase block">Collaboration Readiness Score</span>
                      <span className="text-2xl font-black text-white block mt-0.5">100% SECURE PORTAL</span>
                    </div>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold uppercase px-3 py-1 rounded">
                      STATUS: {collabTestResult.score}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {collabTestResult.tests.map((test: any, i: number) => (
                      <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 flex gap-3 items-start text-xs">
                        <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-200 block">{test.name}</span>
                          <span className="text-slate-400 text-[11px] font-mono">{test.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
