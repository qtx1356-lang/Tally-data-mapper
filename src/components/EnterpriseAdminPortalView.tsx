import React, { useState, useEffect } from 'react';
import {
  Globe,
  Building2,
  Key,
  Laptop,
  Activity,
  Package,
  Layers,
  FileText,
  LifeBuoy,
  History,
  CreditCard,
  Code,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  ChevronRight,
  ExternalLink,
  Lock,
  Unlock,
  X,
  Check,
  Eye,
  Sliders,
  UserCheck,
  Users,
  Server,
  Radio,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export type AdminTab =
  | 'Dashboard'
  | 'Customers'
  | 'Organizations'
  | 'Licenses'
  | 'Devices'
  | 'Editions & Features'
  | 'Releases'
  | 'Health Monitoring'
  | 'Support Tickets'
  | 'Audit Trail'
  | 'Subscriptions'
  | 'API Documentation';

interface EnterpriseAdminPortalViewProps {
  onBackToDesktop: () => void;
}

export const EnterpriseAdminPortalView: React.FC<EnterpriseAdminPortalViewProps> = ({ onBackToDesktop }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // System mode: Admin View vs Customer Self-Service Portal View
  const [isCustomerPortalMode, setIsCustomerPortalMode] = useState(false);
  const [selectedCustomerIdForPortal, setSelectedCustomerIdForPortal] = useState('CUST_001');

  // Active Admin Role & Session
  const [activeAdmin, setActiveAdmin] = useState<any>({
    id: 'ADM_001',
    username: 'elena.vance',
    displayName: 'Elena Vance (Super Admin)',
    role: 'Super Administrator',
    isMfaEnabled: true
  });
  const [availableAdmins, setAvailableAdmins] = useState<any[]>([]);

  // Outage / Gateway Simulator state
  const [outageMode, setOutageMode] = useState<'normal' | 'service_unavailable' | 'rate_limited'>('normal');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [editions, setEditions] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Filters
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState('All');
  const [licenseExpiryFilter, setLicenseExpiryFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals
  const [showCreateLicenseModal, setShowCreateLicenseModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateReleaseModal, setShowCreateReleaseModal] = useState(false);
  const [showInspectPayloadModal, setShowInspectPayloadModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState<any>(null);
  const [showOfflineLicModal, setShowOfflineLicModal] = useState<any>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<any>(null);

  // Form states
  const [newLicCustomer, setNewLicCustomer] = useState('CUST_001');
  const [newLicEdition, setNewLicEdition] = useState('ED_ENTP');
  const [newLicMaxDevices, setNewLicMaxDevices] = useState(5);
  const [newLicDurationDays, setNewLicDurationDays] = useState(365);

  const [newCustName, setNewCustName] = useState('');
  const [newCustCode, setNewCustCode] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [newRelVersion, setNewRelVersion] = useState('12.2.0');
  const [newRelChannel, setNewRelChannel] = useState<'Stable' | 'Beta' | 'Developer'>('Stable');
  const [newRelRollout, setNewRelRollout] = useState(100);
  const [newRelIsCritical, setNewRelIsCritical] = useState(false);

  const [revokeReason, setRevokeReason] = useState('Commercial terms termination / breach');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        custRes,
        orgRes,
        licRes,
        devRes,
        editRes,
        featRes,
        relRes,
        hltRes,
        tickRes,
        audRes,
        subRes,
        adminRes
      ] = await Promise.all([
        fetch('/api/v1/admin/stats').then(r => r.json()).catch(() => null),
        fetch('/api/v1/customers').then(r => r.json()).catch(() => []),
        fetch('/api/v1/organizations').then(r => r.json()).catch(() => []),
        fetch(`/api/v1/licenses?expiryAlert=${licenseExpiryFilter === 'All' ? '' : licenseExpiryFilter}`).then(r => r.json()).catch(() => []),
        fetch('/api/v1/devices').then(r => r.json()).catch(() => []),
        fetch('/api/v1/editions').then(r => r.json()).catch(() => []),
        fetch('/api/v1/features').then(r => r.json()).catch(() => []),
        fetch('/api/v1/releases').then(r => r.json()).catch(() => []),
        fetch('/api/v1/health/dashboard').then(r => r.json()).catch(() => null),
        fetch('/api/v1/support/tickets').then(r => r.json()).catch(() => []),
        fetch('/api/v1/admin/audit').then(r => r.json()).catch(() => []),
        fetch('/api/v1/subscriptions').then(r => r.json()).catch(() => []),
        fetch('/api/v1/admin/auth/me').then(r => r.json()).catch(() => null)
      ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(custRes)) setCustomers(custRes);
      if (Array.isArray(orgRes)) setOrganizations(orgRes);
      if (Array.isArray(licRes)) setLicenses(licRes);
      if (Array.isArray(devRes)) setDevices(devRes);
      if (Array.isArray(editRes)) setEditions(editRes);
      if (Array.isArray(featRes)) setFeatures(featRes);
      if (Array.isArray(relRes)) setReleases(relRes);
      if (hltRes) setHealthData(hltRes);
      if (Array.isArray(tickRes)) setTickets(tickRes);
      if (Array.isArray(audRes)) setAuditLogs(audRes);
      if (Array.isArray(subRes)) setSubscriptions(subRes);
      if (adminRes) {
        if (adminRes.admin) setActiveAdmin(adminRes.admin);
        if (adminRes.availableAdmins) setAvailableAdmins(adminRes.availableAdmins);
      }
    } catch (err: any) {
      console.error('Failed to fetch central admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [licenseExpiryFilter]);

  const switchAdminRole = async (adminId: string) => {
    try {
      const res = await fetch('/api/v1/admin/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      const data = await res.json();
      if (data.success) {
        setActiveAdmin(data.activeAdmin);
        setStatusMessage({ text: `Switched admin session to ${data.activeAdmin.displayName}`, type: 'info' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleToggleOutageSimulator = async (mode: 'normal' | 'service_unavailable' | 'rate_limited') => {
    try {
      const res = await fetch('/api/v1/admin/simulate-outage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        setOutageMode(mode);
        setStatusMessage({
          text: mode === 'normal'
            ? 'Gateway Outage simulation turned OFF (HTTP 200 OK)'
            : mode === 'service_unavailable'
            ? 'Gateway Maintenance simulated (HTTP 503 Outage)'
            : 'Gateway Rate-Limiting simulated (HTTP 429 Backoff)',
          type: mode === 'normal' ? 'success' : 'error'
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustCode || !newCustEmail) return;
    try {
      const res = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName,
          customerCode: newCustCode,
          email: newCustEmail,
          phone: newCustPhone
        })
      });
      if (res.ok) {
        setShowCreateCustomerModal(false);
        setNewCustName('');
        setNewCustCode('');
        setNewCustEmail('');
        setNewCustPhone('');
        setStatusMessage({ text: 'Customer account provisioned successfully', type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startsAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + newLicDurationDays * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch('/api/v1/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newLicCustomer,
          editionId: newLicEdition,
          startsAt,
          expiresAt,
          maxDevices: newLicMaxDevices
        })
      });
      if (res.ok) {
        setShowCreateLicenseModal(false);
        setStatusMessage({ text: 'Commercial License issued and cryptographically signed (Ed25519)', type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleSuspendLicense = async (licenseId: string) => {
    const reason = prompt('Enter suspension reason:', 'Payment review in progress') || 'Administrative suspension';
    try {
      const res = await fetch(`/api/v1/licenses/${licenseId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setStatusMessage({ text: `License ${licenseId} suspended`, type: 'info' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleRevokeLicense = async () => {
    if (!showRevokeModal) return;
    try {
      const res = await fetch(`/api/v1/licenses/${showRevokeModal.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason })
      });
      if (res.ok) {
        setShowRevokeModal(null);
        setStatusMessage({ text: 'License revoked permanently. Device bindings terminated.', type: 'error' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleReactivateLicense = async (licenseId: string) => {
    try {
      const res = await fetch(`/api/v1/licenses/${licenseId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setStatusMessage({ text: `License ${licenseId} reactivated`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleExportOfflineLicense = async (licenseId: string) => {
    try {
      const res = await fetch(`/api/v1/licenses/${licenseId}/export-offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.fileContent) {
        setShowOfflineLicModal(data);
      }
    } catch {
      // ignore
    }
  };

  const handleDeactivateDevice = async (deviceId: string, friendlyName: string) => {
    if (!confirm(`Deactivate hardware seat '${friendlyName}'? The client must reactivate on next run.`)) return;
    try {
      const res = await fetch('/api/v1/devices/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      if (res.ok) {
        setStatusMessage({ text: `Device ${friendlyName} deactivated successfully`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: newRelVersion,
          channel: newRelChannel,
          stagedRolloutPercent: newRelRollout,
          isCriticalSecurityUpdate: newRelIsCritical
        })
      });
      if (res.ok) {
        setShowCreateReleaseModal(false);
        setStatusMessage({ text: `Release v${newRelVersion} published to ${newRelChannel} channel (${newRelRollout}% staged rollout)`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  // Filtered views
  const displayCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const displayLicenses = licenses.filter(l => {
    const matchesSearch = l.customerName.toLowerCase().includes(licenseSearch.toLowerCase()) ||
      l.licenseKeyId.toLowerCase().includes(licenseSearch.toLowerCase()) ||
      l.id.toLowerCase().includes(licenseSearch.toLowerCase());
    const matchesStatus = licenseStatusFilter === 'All' || l.status === licenseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // If in customer portal mode, filter to only the selected customer
  const currentPortalCustomer = customers.find(c => c.id === selectedCustomerIdForPortal) || customers[0];
  const portalLicenses = licenses.filter(l => l.customerId === selectedCustomerIdForPortal);
  const portalDevices = devices.filter(d => portalLicenses.some(l => l.id === d.licenseId));
  const portalTickets = tickets.filter(t => t.customerId === selectedCustomerIdForPortal);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Top Universal Administration Header */}
      <header className="bg-[#111827] border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center shadow">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-white uppercase">EXFIN Central Admin Portal</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  SYSTEM B
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  v1.0 (REST /api/v1)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enterprise Customer Management • Asymmetric License Authority • Health Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Center: System & View Switcher */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#1E293B] p-1 rounded-lg border border-slate-700 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setIsCustomerPortalMode(false)}
              className={`px-3 py-1 rounded font-medium transition-all ${
                !isCustomerPortalMode
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enterprise Admin View
            </button>
            <button
              onClick={() => setIsCustomerPortalMode(true)}
              className={`px-3 py-1 rounded font-medium transition-all flex items-center space-x-1.5 ${
                isCustomerPortalMode
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Customer Self-Service View</span>
            </button>
          </div>

          {/* Outage Simulation Simulator Toggle */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs">
            <Radio className={`h-3.5 w-3.5 ${outageMode === 'normal' ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-slate-400 text-[11px]">Gateway Status:</span>
            <select
              value={outageMode}
              onChange={(e) => handleToggleOutageSimulator(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="normal" className="bg-slate-900 text-emerald-400">Online (HTTP 200)</option>
              <option value="service_unavailable" className="bg-slate-900 text-amber-400">Maintenance (503 Outage)</option>
              <option value="rate_limited" className="bg-slate-900 text-rose-400">Rate Limited (429 Backoff)</option>
            </select>
          </div>
        </div>

        {/* Right: Active Admin RBAC Switcher & Switch to Desktop Button */}
        <div className="flex items-center space-x-3">
          {/* Admin User Switcher */}
          {!isCustomerPortalMode ? (
            <div className="flex items-center space-x-2 bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block leading-tight">Admin Session</span>
                <select
                  value={activeAdmin.id}
                  onChange={(e) => switchAdminRole(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
                >
                  {availableAdmins.map((adm) => (
                    <option key={adm.id} value={adm.id} className="bg-slate-900 text-slate-200">
                      {adm.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs">
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block leading-tight">Viewing as Tenant</span>
                <select
                  value={selectedCustomerIdForPortal}
                  onChange={(e) => setSelectedCustomerIdForPortal(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Switch back to Desktop (System A) */}
          <button
            onClick={onBackToDesktop}
            className="flex items-center space-x-1.5 rounded border border-indigo-700/80 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 px-3 py-1.5 text-xs font-semibold shadow transition-colors"
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Switch to Desktop (System A)</span>
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`px-6 py-2 text-xs font-medium flex items-center justify-between border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
              : 'bg-sky-950/80 border-sky-800 text-sky-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      {!isCustomerPortalMode ? (
        // ==========================================
        // SYSTEM B: ENTERPRISE ADMIN PORTAL
        // ==========================================
        <div className="flex-1 flex overflow-hidden">
          {/* Admin Sidebar Navigation */}
          <aside className="w-64 bg-[#0D1322] border-r border-slate-800/80 flex flex-col p-3 space-y-6">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
                Platform Operations
              </span>
              <nav className="space-y-1">
                {[
                  { id: 'Dashboard', label: 'Overview & Fleet Metrics', icon: Activity },
                  { id: 'Customers', label: 'Customer Directory', icon: Building2, count: customers.length },
                  { id: 'Organizations', label: 'Organization Hierarchy', icon: Layers, count: organizations.length },
                  { id: 'Licenses', label: 'Commercial Licenses', icon: Key, count: licenses.length },
                  { id: 'Devices', label: 'Device Fleet Registry', icon: Laptop, count: devices.length },
                  { id: 'Editions & Features', label: 'Editions & Feature Matrix', icon: Package },
                  { id: 'Releases', label: 'Releases & Update Deploy', icon: Server, count: releases.length }
                ].map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/90 text-white font-semibold shadow'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
                Observability & Compliance
              </span>
              <nav className="space-y-1">
                {[
                  { id: 'Health Monitoring', label: 'Installation Health Telemetry', icon: Activity, count: healthData?.summary?.total },
                  { id: 'Support Tickets', label: 'Support & Diagnostics', icon: LifeBuoy, count: tickets.filter((t: any) => t.status === 'Open').length },
                  { id: 'Audit Trail', label: 'Administrative Audit Trail', icon: History },
                  { id: 'Subscriptions', label: 'Subscriptions & Billing', icon: CreditCard },
                  { id: 'API Documentation', label: 'OpenAPI 3.0 Explorer', icon: Code }
                ].map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/90 text-white font-semibold shadow'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isActive ? 'bg-indigo-700 text-white' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Privacy Compliance Box */}
            <div className="mt-auto bg-slate-900/80 border border-slate-800 rounded p-3 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Zero Financial Storage</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                The Central Platform collects ONLY technical diagnostics. Tally company financial ledgers and vouchers remain 100% on the customer's computer.
              </p>
            </div>
          </aside>

          {/* Admin Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-[#0B101D]">
            {/* TAB: DASHBOARD */}
            {activeTab === 'Dashboard' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Enterprise Administration Dashboard</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Commercial license authority, customer accounts, fleet health telemetry, and update distribution
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchData}
                      className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 shadow"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
                      <span>Refresh Telemetry</span>
                    </button>
                    <button
                      onClick={() => setShowCreateLicenseModal(true)}
                      className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center space-x-1.5 shadow"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Issue New License</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Total Licenses</span>
                      <Key className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-white">{stats?.licenses?.total ?? licenses.length}</span>
                      <span className="text-xs text-emerald-400 font-medium font-mono">
                        {stats?.licenses?.active ?? licenses.filter((l: any) => l.status === 'Active').length} Active
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Enterprise Tier: {licenses.filter((l: any) => l.editionName === 'Enterprise').length}</span>
                      <span>Business: {licenses.filter((l: any) => l.editionName === 'Business').length}</span>
                    </div>
                  </div>

                  <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Active Fleet Devices</span>
                      <Laptop className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-white">{stats?.devices?.active ?? devices.filter((d: any) => d.status === 'Active').length}</span>
                      <span className="text-xs text-slate-400">of {devices.length} registered</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Hardware Bound</span>
                      <span className="text-emerald-400">100% Unique Fingerprints</span>
                    </div>
                  </div>

                  <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Fleet Health Status</span>
                      <Activity className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-emerald-400">
                        {healthData?.summary?.healthy ?? 3} / {healthData?.summary?.total ?? 5}
                      </span>
                      <span className="text-xs text-slate-400">Healthy Nodes</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-amber-400 font-medium">
                        {healthData?.summary?.warning ?? 1} Warning
                      </span>
                      <span className="text-slate-500">
                        {healthData?.summary?.offline ?? 1} Offline
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Expiring in &lt; 30 Days</span>
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-amber-400">
                        {licenses.filter((l: any) => {
                          const now = Date.now();
                          const exp = new Date(l.expiresAt).getTime();
                          return exp > now && exp <= now + 30 * 24 * 60 * 60 * 1000 && l.status === 'Active';
                        }).length}
                      </span>
                      <span className="text-xs text-slate-400">Renewals Upcoming</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Expired: {licenses.filter((l: any) => l.status === 'Expired').length}</span>
                      <span className="text-rose-400">Suspended: {licenses.filter((l: any) => l.status === 'Suspended').length}</span>
                    </div>
                  </div>
                </div>

                {/* Expiration Alert Feeds & Rollouts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Expiration Alerts and License Table Preview */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <h2 className="text-sm font-bold text-white">Commercial Expiry Alerts & Required Actions</h2>
                        </div>
                        <span className="text-[11px] text-slate-400">Rule: Alert at 30 Days and 7 Days</span>
                      </div>

                      <div className="space-y-2.5">
                        {licenses.filter((l: any) => l.status === 'ExpiringSoon' || l.status === 'Expired' || l.status === 'Suspended').map((lic: any) => (
                          <div
                            key={lic.id}
                            className={`p-3 rounded border text-xs flex items-center justify-between ${
                              lic.status === 'Suspended'
                                ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                                : lic.status === 'Expired'
                                ? 'bg-slate-900 border-slate-700 text-slate-300'
                                : 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white">{lic.customerName}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {lic.editionName}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                                    lic.status === 'Suspended'
                                      ? 'bg-rose-900 text-rose-100'
                                      : lic.status === 'Expired'
                                      ? 'bg-slate-800 text-slate-400'
                                      : 'bg-amber-900 text-amber-100'
                                  }`}
                                >
                                  {lic.status === 'ExpiringSoon' ? 'Expiring in < 7 Days' : lic.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Key: <span className="font-mono">{lic.licenseKeyId}</span> • Expires: {new Date(lic.expiresAt).toLocaleDateString()}
                              </p>
                              {lic.revocationReason && (
                                <p className="text-[11px] text-rose-400 mt-0.5 italic">
                                  Reason: {lic.revocationReason}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {lic.status === 'Suspended' ? (
                                <button
                                  onClick={() => handleReactivateLicense(lic.id)}
                                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-semibold"
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendLicense(lic.id)}
                                  className="bg-amber-800 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => handleExportOfflineLicense(lic.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs font-semibold border border-slate-700"
                              >
                                Export .exfinlic
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Version Distribution Chart */}
                    <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                          <Server className="h-4 w-4 text-sky-400" />
                          <span>Fleet Software Version Distribution</span>
                        </h2>
                        <span className="text-xs text-slate-400">Targeting v12.0.0+ for all nodes</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 font-medium">v12.0.0 Stable (Current Mainstream)</span>
                            <span className="font-mono text-emerald-400 font-bold">80% (4 nodes)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 font-medium">v11.8.2 Legacy (Pending Customer Upgrade)</span>
                            <span className="font-mono text-amber-400 font-bold">20% (1 node)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Active Staged Releases & Quick Actions */}
                  <div className="space-y-4">
                    <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                          <Package className="h-4 w-4 text-indigo-400" />
                          <span>Active Releases</span>
                        </h2>
                        <button
                          onClick={() => setShowCreateReleaseModal(true)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          + New Release
                        </button>
                      </div>

                      <div className="space-y-3">
                        {releases.map((rel: any) => (
                          <div key={rel.version} className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">v{rel.version}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                  rel.channel === 'Stable'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : rel.channel === 'Beta'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {rel.channel} ({rel.stagedRolloutPercent}%)
                              </span>
                            </div>
                            {rel.isCriticalSecurityUpdate && (
                              <span className="mt-1 inline-block text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-bold">
                                Critical Security Hotfix
                              </span>
                            )}
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {rel.releaseNotes?.whatsNew?.[0] || 'Standard maintenance update'}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>Min: v{rel.minimumVersion}</span>
                              <span>Signed: Ed25519</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick System Diagnostics Info */}
                    <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-5 text-xs space-y-3">
                      <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
                        <span>Central Cryptographic Keys</span>
                      </h2>
                      <div className="space-y-1 text-slate-400 text-[11px]">
                        <p>
                          <span className="text-slate-300 font-semibold">Private Signing Key:</span> Strictly Server-Side (ED25519-PRIV-ROOT)
                        </p>
                        <p>
                          <span className="text-slate-300 font-semibold">Public Verification Key:</span> Embedded in Desktop binaries
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 truncate">
                          FP: SHA256:7f49c0d1283e18a9e6b472e391cb09f8...
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        <span className="text-emerald-400 font-bold block mb-0.5">Air-Gapped Operation:</span>
                        Desktop clients function offline without degradation during network outages.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CUSTOMERS */}
            {activeTab === 'Customers' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Enterprise Customer Directory</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Commercial subscriber accounts, enterprise organizations, and primary billing contacts
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateCustomerModal(true)}
                    className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center space-x-1.5 shadow"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Customer</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search customers by name, code, or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-[#131C2E] border border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    Showing {displayCustomers.length} of {customers.length} accounts
                  </span>
                </div>

                {/* Customers Table */}
                <div className="bg-[#131C2E] border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#182338] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Customer Code</th>
                        <th className="px-4 py-3">Account Name</th>
                        <th className="px-4 py-3">Primary Contact</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Licenses Active</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {displayCustomers.map((c: any) => {
                        const custLics = licenses.filter((l: any) => l.customerId === c.id);
                        return (
                          <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-indigo-400">{c.customerCode}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-white">{c.name}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">{c.notes}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{c.email}</div>
                              <div className="text-[11px] text-slate-500">{c.phone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  c.status === 'Active'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-slate-200 font-semibold">{custLics.length}</span>{' '}
                              <span className="text-[11px] text-slate-500">
                                ({custLics.map((l: any) => l.editionName).join(', ') || 'None'})
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setSelectedCustomerDetail(c)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded transition-colors"
                              >
                                View Account
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ORGANIZATIONS */}
            {activeTab === 'Organizations' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Customer Organization Hierarchy</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Multi-tier corporate organizational units, regional offices, and departmental entities
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((c: any) => {
                    const orgs = organizations.filter((o: any) => o.customerId === c.id);
                    return (
                      <div key={c.id} className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div>
                            <span className="font-mono text-[10px] text-indigo-400 font-bold block">{c.customerCode}</span>
                            <h3 className="font-bold text-white text-sm">{c.name}</h3>
                          </div>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                            {orgs.length} Units
                          </span>
                        </div>

                        <div className="space-y-2">
                          {orgs.map((org: any) => (
                            <div key={org.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-200">{org.name}</div>
                                <span className="text-[10px] text-slate-500 font-mono">ID: {org.id} • Region: {org.region}</span>
                              </div>
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                                {org.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: LICENSES */}
            {activeTab === 'Licenses' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Commercial License Authority</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cryptographically signed asymmetric licenses, device allowances, and feature entitlements
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateLicenseModal(true)}
                    className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center space-x-1.5 shadow"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Issue Commercial License</span>
                  </button>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center space-x-3 flex-1 max-w-md">
                    <Search className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by license ID, customer, or key..."
                      value={licenseSearch}
                      onChange={(e) => setLicenseSearch(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400">Status:</span>
                      <select
                        value={licenseStatusFilter}
                        onChange={(e) => setLicenseStatusFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="ExpiringSoon">Expiring Soon</option>
                        <option value="Expired">Expired</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Revoked">Revoked</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400">Expiry Alert:</span>
                      <select
                        value={licenseExpiryFilter}
                        onChange={(e) => setLicenseExpiryFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                      >
                        <option value="All">All Horizons</option>
                        <option value="30days">&lt; 30 Days (Warning)</option>
                        <option value="7days">&lt; 7 Days (Critical)</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* License List */}
                <div className="space-y-3">
                  {displayLicenses.map((lic: any) => {
                    const licDevices = devices.filter((d: any) => d.licenseId === lic.id && d.status === 'Active');
                    const isExpiringSoon = lic.status === 'ExpiringSoon';
                    const isExpired = lic.status === 'Expired';
                    const isSuspended = lic.status === 'Suspended';
                    const isRevoked = lic.status === 'Revoked';

                    return (
                      <div
                        key={lic.id}
                        className={`bg-[#131C2E] border rounded-lg p-4 transition-all shadow-sm ${
                          isSuspended || isRevoked
                            ? 'border-rose-900/60'
                            : isExpiringSoon
                            ? 'border-amber-900/60'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xs font-mono font-bold text-indigo-400">{lic.id}</span>
                              <span className="font-bold text-white text-sm">{lic.customerName}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  isSuspended || isRevoked
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : isExpired
                                    ? 'bg-slate-800 text-slate-400'
                                    : isExpiringSoon
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {lic.status}
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                {lic.editionName} Edition
                              </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400">
                              <span>Key: <code className="font-mono text-slate-200">{lic.licenseKeyId}</code></span>
                              <span>•</span>
                              <span>Expires: <strong className="text-slate-200">{new Date(lic.expiresAt).toLocaleDateString()}</strong></span>
                              <span>•</span>
                              <span>Devices: <strong className="text-slate-200">{licDevices.length} / {lic.maxDevices}</strong> seats bound</span>
                            </div>
                            {lic.revocationReason && (
                              <p className="mt-1 text-xs text-rose-400 font-medium">
                                Status Notice: {lic.revocationReason}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleExportOfflineLicense(lic.id)}
                              className="flex items-center space-x-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 shadow"
                            >
                              <Download className="h-3 w-3 text-sky-400" />
                              <span>Export .exfinlic</span>
                            </button>

                            {lic.status === 'Active' || lic.status === 'ExpiringSoon' ? (
                              <button
                                onClick={() => handleSuspendLicense(lic.id)}
                                className="flex items-center space-x-1.5 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800 px-2.5 py-1 text-xs font-medium text-amber-200 shadow"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Suspend</span>
                              </button>
                            ) : lic.status === 'Suspended' ? (
                              <button
                                onClick={() => handleReactivateLicense(lic.id)}
                                className="flex items-center space-x-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-200 shadow"
                              >
                                <Unlock className="h-3 w-3" />
                                <span>Reactivate</span>
                              </button>
                            ) : null}

                            {!isRevoked && (
                              <button
                                onClick={() => setShowRevokeModal(lic)}
                                className="flex items-center space-x-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 px-2.5 py-1 text-xs font-medium text-rose-200 shadow"
                              >
                                <X className="h-3 w-3" />
                                <span>Revoke</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Entitled Features Tags */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1">Entitlements:</span>
                          {lic.entitledFeatures?.map((f: string) => (
                            <span key={f} className="text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: DEVICES */}
            {activeTab === 'Devices' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Device Fleet Registry</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hardware-bound installations, unique machine fingerprints, and remote seat revocation
                    </p>
                  </div>
                </div>

                <div className="bg-[#131C2E] border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#182338] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Device Name</th>
                        <th className="px-4 py-3">Hardware Fingerprint</th>
                        <th className="px-4 py-3">Associated Account</th>
                        <th className="px-4 py-3">OS Platform</th>
                        <th className="px-4 py-3">App Version</th>
                        <th className="px-4 py-3">Last Seen</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {devices.map((d: any) => (
                        <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <Laptop className="h-3.5 w-3.5 text-sky-400" />
                              <span>{d.friendlyName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{d.id}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{d.deviceFingerprint}</td>
                          <td className="px-4 py-3 font-medium text-slate-200">{d.customerName}</td>
                          <td className="px-4 py-3 text-slate-400">{d.platform}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-emerald-400">v{d.applicationVersion}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(d.lastSeen).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                d.status === 'Active'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {d.status === 'Active' ? (
                              <button
                                onClick={() => handleDeactivateDevice(d.id, d.friendlyName)}
                                className="text-xs bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800 px-2.5 py-1 rounded transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Seat Released</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: EDITIONS & FEATURES */}
            {activeTab === 'Editions & Features' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Editions & Feature Entitlement Matrix</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Commercial packaging tiers, device concurrency quotas, and modular capability catalog
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {editions.map((ed: any) => (
                    <div key={ed.id} className="bg-[#131C2E] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-indigo-400">{ed.id}</span>
                          <span className="text-xs text-slate-400">{ed.maxDevices} Device{ed.maxDevices > 1 ? 's' : ''}</span>
                        </div>
                        <h3 className="text-base font-bold text-white">{ed.name}</h3>
                        <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
                          ${ed.pricePerYearUsd} <span className="text-xs font-normal text-slate-400">/ year</span>
                        </div>

                        <div className="mt-4 space-y-1.5 pt-4 border-t border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-2">Included Features:</span>
                          {ed.features.map((f: string) => (
                            <div key={f} className="text-xs flex items-center space-x-1.5 text-slate-300">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="font-mono text-[11px]">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Complete Feature Catalog */}
                <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-sky-400" />
                    <span>Complete Feature Entitlement Catalog</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {features.map((feat: any) => (
                      <div key={feat.id} className="p-3 rounded bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-300">{feat.id}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">{feat.category}</span>
                        </div>
                        <div className="font-semibold text-white mt-1">{feat.name}</div>
                        <p className="text-[11px] text-slate-400 mt-1">{feat.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RELEASES */}
            {activeTab === 'Releases' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Software Releases & Staged Rollouts</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Versioned installer distribution, SHA-256 package verification, and emergency hotfix flags
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateReleaseModal(true)}
                    className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center space-x-1.5 shadow"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Publish Release Package</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {releases.map((rel: any) => (
                    <div key={rel.version} className="bg-[#131C2E] border border-slate-800 rounded-lg p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-white font-mono">v{rel.version}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                              rel.channel === 'Stable'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : rel.channel === 'Beta'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {rel.channel} Channel
                          </span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                            Rollout: {rel.stagedRolloutPercent}%
                          </span>
                          {rel.isCriticalSecurityUpdate && (
                            <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded font-bold">
                              Mandatory Critical Hotfix
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          Released: {new Date(rel.releaseDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">What's New:</span>
                          <ul className="list-disc list-inside text-slate-300 space-y-1">
                            {rel.releaseNotes?.whatsNew?.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">Security & Fixes:</span>
                          <ul className="list-disc list-inside text-slate-300 space-y-1">
                            {rel.releaseNotes?.security?.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                            {rel.releaseNotes?.bugFixes?.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="truncate max-w-md">SHA-256: {rel.packageSha256}</span>
                        <span className="text-indigo-400 font-semibold">{rel.signature}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: HEALTH MONITORING */}
            {activeTab === 'Health Monitoring' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Fleet Health & Telemetry Receiver</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Low-frequency sanitized heartbeat monitoring, protocol versions, and latency benchmarks
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInspectPayloadModal(true)}
                    className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 shadow"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Inspect Sanitized Payload</span>
                  </button>
                </div>

                {/* Compliance Statement Banner */}
                <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-lg p-4 text-xs text-emerald-200 flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block font-semibold">Strict Data Confidentiality Guarantee (Requirement 37 & 38)</strong>
                    <p className="text-[11px] text-emerald-300/90 mt-0.5 leading-relaxed">
                      Telemetry is restricted strictly to technical health metrics (OS version, Tally connection state, application uptime, latency).
                      No Tally company financial records, vouchers, ledger accounts, or GST numbers are ever collected or stored centrally.
                    </p>
                  </div>
                </div>

                {/* Fleet Health Table */}
                <div className="bg-[#131C2E] border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#182338] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Workstation / Node</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Tally Version</th>
                        <th className="px-4 py-3">Access Mode</th>
                        <th className="px-4 py-3">Avg Latency</th>
                        <th className="px-4 py-3">Last Heartbeat</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {healthData?.fleet?.map((h: any) => (
                        <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{h.customerName}</div>
                            <span className="text-[10px] text-slate-500 font-mono">{h.deviceFingerprint}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{h.customerName}</td>
                          <td className="px-4 py-3 font-medium text-slate-200">{h.tallyVersion}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.2 rounded font-mono font-bold">
                              {h.connectionStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{h.averageReportLatencyMs} ms</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(h.lastSeenAt).toLocaleTimeString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                h.status === 'Healthy'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : h.status === 'Warning'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SUPPORT TICKETS */}
            {activeTab === 'Support Tickets' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Customer Support & Diagnostics</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Triage enterprise technical requests with optional attached sanitized diagnostic bundles
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {tickets.map((tick: any) => (
                    <div key={tick.id} className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold">{tick.id}</span>
                          <h3 className="font-bold text-white text-sm">{tick.subject}</h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                              tick.priority === 'Critical'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : tick.priority === 'High'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {tick.priority} Priority
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            tick.status === 'Open'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : tick.status === 'InProgress'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {tick.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{tick.description}</p>

                      {tick.diagnosticsAttached && (
                        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                          <span className="text-slate-300 font-semibold block mb-0.5">Sanitized Diagnostics Attached:</span>
                          <span className="font-mono">{tick.sanitizedDiagnosticsSummary}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Submitted by: <strong className="text-slate-300">{tick.customerName}</strong></span>
                        <span>{new Date(tick.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AUDIT TRAIL */}
            {activeTab === 'Audit Trail' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Central Administrative Audit Trail</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Immutable record of commercial license operations, suspensions, releases, and key authorizations
                    </p>
                  </div>
                </div>

                <div className="bg-[#131C2E] border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#182338] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp (UTC)</th>
                        <th className="px-4 py-3">Admin Operator</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Audit Details</th>
                        <th className="px-4 py-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-white">{log.adminUsername}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">{log.targetType}: {log.targetId}</td>
                          <td className="px-4 py-3 text-slate-300 max-w-md truncate">{log.details}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SUBSCRIPTIONS & BILLING */}
            {activeTab === 'Subscriptions' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Commercial Subscriptions & Billing</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Payment gateway synchronization, recurring contract schedules, and IBillingProvider integration
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscriptions.map((sub: any) => (
                    <div key={sub.id} className="bg-[#131C2E] border border-slate-800 rounded-lg p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <span className="font-mono text-[10px] text-indigo-400 font-bold block">{sub.id}</span>
                          <h3 className="font-bold text-white text-base">{sub.customerName}</h3>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            sub.status === 'Active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Plan:</span>
                          <span className="font-semibold text-slate-200">{sub.plan}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Billing Method:</span>
                          <span className="text-slate-200">{sub.billingProvider}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Annual Fee:</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">${sub.amountUsd} / yr</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Renewal Date:</span>
                          <span className="font-semibold text-slate-200">{new Date(sub.renewalDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: API DOCUMENTATION */}
            {activeTab === 'API Documentation' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Central REST API & OpenAPI 3.0 Documentation</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Versioned endpoints, client contracts, and asymmetric signature verification specs
                    </p>
                  </div>
                  <a
                    href="/api/v1/openapi.json"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 shadow"
                  >
                    <Code className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Raw OpenAPI JSON</span>
                  </a>
                </div>

                <div className="space-y-4">
                  {[
                    { method: 'POST', path: '/api/v1/licenses/validate', desc: 'Hardware-bound license activation and digital signature verification.' },
                    { method: 'POST', path: '/api/v1/licenses/refresh', desc: 'Queries Central Authority for updated feature entitlements and terms.' },
                    { method: 'POST', path: '/api/v1/devices/deactivate', desc: 'Releases a registered hardware workstation seat from a license quota.' },
                    { method: 'POST', path: '/api/v1/health/heartbeat', desc: 'Submits low-frequency technical health telemetry (strictly no financial data).' },
                    { method: 'GET', path: '/api/v1/releases/check-update', desc: 'Evaluates channel update manifests against current version and staged rollout.' },
                    { method: 'POST', path: '/api/v1/support/tickets', desc: 'Submits a customer technical inquiry with optional sanitized diagnostic package.' }
                  ].map((ep, idx) => (
                    <div key={idx} className="bg-[#131C2E] border border-slate-800 rounded-lg p-4 flex items-start space-x-3">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          ep.method === 'POST'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <div>
                        <code className="text-xs font-mono font-bold text-white">{ep.path}</code>
                        <p className="text-xs text-slate-400 mt-1">{ep.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        // ==========================================
        // CUSTOMER SELF-SERVICE PORTAL VIEW
        // ==========================================
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B101D]">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-[#131C2E] border border-slate-800 rounded-lg p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-mono font-bold">
                  CUSTOMER SELF-SERVICE PORTAL
                </span>
                <h1 className="text-2xl font-bold text-white mt-1.5">{currentPortalCustomer.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customer Code: <span className="font-mono text-indigo-400 font-bold">{currentPortalCustomer.customerCode}</span> • Contact: {currentPortalCustomer.email}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('Support Tickets')}
                  className="rounded bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow"
                >
                  Submit Support Ticket
                </button>
              </div>
            </div>

            {/* Tenant Isolated Licenses */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Key className="h-4 w-4 text-indigo-400" />
                <span>Your Active Subscriptions & Licenses</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portalLicenses.map((lic: any) => (
                  <div key={lic.id} className="bg-[#131C2E] border border-slate-800 rounded-lg p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-bold text-white text-base">{lic.editionName} Edition</span>
                        <div className="font-mono text-xs text-indigo-400 mt-0.5">{lic.licenseKeyId}</div>
                      </div>
                      <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                        {lic.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Expires: <strong className="text-slate-200">{new Date(lic.expiresAt).toLocaleDateString()}</strong></p>
                      <p>Device Seats: <strong className="text-slate-200">{portalDevices.length} / {lic.maxDevices}</strong> in use</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleExportOfflineLicense(lic.id)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded border border-slate-700"
                      >
                        Download Offline File (.exfinlic)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Registered Devices */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Laptop className="h-4 w-4 text-sky-400" />
                <span>Your Registered Hardware Devices</span>
              </h2>

              <div className="bg-[#131C2E] border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#182338] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Workstation Name</th>
                      <th className="px-4 py-3">Fingerprint</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {portalDevices.map((d: any) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3 font-semibold text-white">{d.friendlyName}</td>
                        <td className="px-4 py-3 font-mono">{d.deviceFingerprint}</td>
                        <td className="px-4 py-3 text-slate-400">{d.platform}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">v{d.applicationVersion}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                            {d.status}
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

      {/* MODAL: CREATE CUSTOMER */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Provision Enterprise Customer</span>
              </h3>
              <button onClick={() => setShowCreateCustomerModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Customer Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Global Technologies Ltd"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Customer Code (Unique Identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZENITH-TECH"
                  value={newCustCode}
                  onChange={(e) => setNewCustCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 uppercase font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Primary Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="licensing@zenith.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCustomerModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE LICENSE */}
      {showCreateLicenseModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Key className="h-4 w-4 text-indigo-400" />
                <span>Issue Asymmetric Commercial License</span>
              </h3>
              <button onClick={() => setShowCreateLicenseModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Customer Account</label>
                <select
                  value={newLicCustomer}
                  onChange={(e) => setNewLicCustomer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Edition Tier</label>
                  <select
                    value={newLicEdition}
                    onChange={(e) => {
                      setNewLicEdition(e.target.value);
                      const ed = editions.find(x => x.id === e.target.value);
                      if (ed) setNewLicMaxDevices(ed.maxDevices);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none"
                  >
                    {editions.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.name} (${ed.pricePerYearUsd}/yr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Max Device Seats</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newLicMaxDevices}
                    onChange={(e) => setNewLicMaxDevices(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Subscription Duration</label>
                <select
                  value={newLicDurationDays}
                  onChange={(e) => setNewLicDurationDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none"
                >
                  <option value={365}>1 Year (Standard Commercial Annual)</option>
                  <option value={730}>2 Years (Enterprise Multi-Year)</option>
                  <option value={30}>30 Days (Evaluation / Trial)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900/90 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="text-indigo-400 font-semibold block">Cryptographic Signing Process:</span>
                <p>The license token will be signed server-side using the Ed25519 private key. Desktop clients will verify validity against their built-in public key.</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLicenseModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
                >
                  Sign & Issue License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH RELEASE */}
      {showCreateReleaseModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Package className="h-4 w-4 text-indigo-400" />
                <span>Publish Update Release Package</span>
              </h3>
              <button onClick={() => setShowCreateReleaseModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Version (SemVer)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12.2.0"
                  value={newRelVersion}
                  onChange={(e) => setNewRelVersion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Channel</label>
                  <select
                    value={newRelChannel}
                    onChange={(e) => setNewRelChannel(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value="Stable">Stable</option>
                    <option value="Beta">Beta</option>
                    <option value="Developer">Developer</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Staged Rollout</label>
                  <select
                    value={newRelRollout}
                    onChange={(e) => setNewRelRollout(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value={100}>100% (Full Release)</option>
                    <option value={50}>50% Staged</option>
                    <option value={10}>10% Canary Tier</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="criticalUpdate"
                  checked={newRelIsCritical}
                  onChange={(e) => setNewRelIsCritical(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="criticalUpdate" className="text-slate-300 cursor-pointer">
                  Mark as Critical Security Hotfix (Bypasses regular delay)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateReleaseModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
                >
                  Publish Manifest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVOKE LICENSE CONFIRMATION */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-rose-800 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold text-white">Permanently Revoke License?</h3>
            </div>

            <p className="text-xs text-slate-300">
              You are about to revoke license <strong className="text-white font-mono">{showRevokeModal.licenseKeyId}</strong> belonging to <strong>{showRevokeModal.customerName}</strong>.
            </p>

            <div className="p-3 rounded bg-rose-950/50 border border-rose-900/80 text-[11px] text-rose-300 space-y-1">
              <span className="font-bold block">Permanent Consequence:</span>
              <p>All connected workstations will fail their subsequent online verification and background refresh calls. Offline machines will remain active until local key expiry.</p>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 text-xs font-medium">Revocation Justification</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setShowRevokeModal(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeLicense}
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFLINE LICENSE PACKAGE VIEWER */}
      {showOfflineLicModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Key className="h-4 w-4 text-emerald-400" />
                <span>Signed Offline License Package (.exfinlic)</span>
              </h3>
              <button onClick={() => setShowOfflineLicModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              File: <span className="font-mono text-indigo-400 font-bold">{showOfflineLicModal.filename}</span>
            </div>

            <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-60">
              {showOfflineLicModal.fileContent}
            </pre>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  const blob = new Blob([showOfflineLicModal.fileContent], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = showOfflineLicModal.filename;
                  a.click();
                  URL.revokeObjectURL(url);
                  setShowOfflineLicModal(null);
                }}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .exfinlic</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT SANITIZED TELEMETRY PAYLOAD */}
      {showInspectPayloadModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Sanitized Heartbeat Payload Transparency Inspector</span>
              </h3>
              <button onClick={() => setShowInspectPayloadModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This is the exact JSON structure transmitted by desktop clients during background health heartbeats.
              Observe that no financial figures, voucher contents, or accounting ledger data are present.
            </p>

            <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-64">
{JSON.stringify({
  licenseId: "LIC_001_ENTP",
  deviceFingerprint: "FPR-A491-B720-D911-3E2A",
  applicationVersion: "12.0.0",
  osVersion: "Windows 11 Pro 23H2 (x64)",
  tallyVersion: "TallyPrime 4.1 (64-bit)",
  connectionStatus: "Connected (Read-Only)",
  lastSuccessfulReportExecution: new Date().toISOString(),
  lastErrorCategory: "None",
  averageReportLatencyMs: 142,
  sanitizationGuarantee: "ZERO_FINANCIAL_RECORDS_TRANSMITTED"
}, null, 2)}
            </pre>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInspectPayloadModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-200 text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER DETAIL DRAWER */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#131C2E] border border-slate-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">{selectedCustomerDetail.customerCode}</span>
                <h3 className="text-base font-bold text-white">{selectedCustomerDetail.name}</h3>
              </div>
              <button onClick={() => setSelectedCustomerDetail(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <p>Email: <strong>{selectedCustomerDetail.email}</strong> • Phone: <strong>{selectedCustomerDetail.phone}</strong></p>
              <p>Notes: {selectedCustomerDetail.notes}</p>
              <p>Customer Since: {new Date(selectedCustomerDetail.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedCustomerIdForPortal(selectedCustomerDetail.id);
                  setIsCustomerPortalMode(true);
                  setSelectedCustomerDetail(null);
                }}
                className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Open Tenant Portal View</span>
              </button>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
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
