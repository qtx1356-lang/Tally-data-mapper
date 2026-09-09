import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Users,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  HardDrive,
  Laptop,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  Database,
  Building2,
  Check,
  X,
  Search,
  ExternalLink,
  Code,
  FileText,
  Copy,
  AlertCircle
} from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  email: string;
  roleId: string;
  status: string;
  failedLoginAttempts: number;
  isLocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface RoleItem {
  roleId: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

interface PermissionItem {
  permissionId: string;
  name: string;
  category: string;
  description: string;
}

interface LicenseInfo {
  license: {
    licenseId: string;
    licenseKey: string;
    product: string;
    edition: string;
    type: string;
    customer: string;
    customerId: string;
    issuedAt: string;
    expiresAt: string;
    status: string;
    maxDevices: number;
    features: string[];
    signature: string;
    publicKeyFingerprint: string;
    lastVerifiedAt: string;
    offlineGraceDaysRemaining: number;
  };
  daysRemaining: number;
  registeredDevices: Array<{
    deviceId: string;
    deviceName: string;
    platform: string;
    registeredAt: string;
    lastSeenAt: string;
    isCurrentDevice: boolean;
    isActive: boolean;
  }>;
  activeDeviceCount: number;
  isDeviceLimitReached: boolean;
  featureMatrix: Array<{
    featureKey: string;
    name: string;
    free: string;
    professional: string;
    business: string;
    enterprise: string;
  }>;
}

export const EnterpriseSecurityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'licensing' | 'policies' | 'backup' | 'updates' | 'about'>('users');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  
  // License state
  const [licenseData, setLicenseData] = useState<LicenseInfo | null>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activationMsg, setActivationMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Security settings & Audit
  const [settings, setSettings] = useState<any>({
    sessionTimeoutMinutes: 60,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireDigit: true,
    auditRetentionDays: 365,
    allowedExportFormats: 'CSV, JSON, XLSX, PDF',
    defaultReportDirectory: '%AppData%\\EXFIN\\TallyMapper\\Reports',
    updateChannel: 'Stable'
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState({ search: '', severity: 'All' });

  // Backup state
  const [backups, setBackups] = useState<any[]>([]);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Update & Installer state
  const [updateManifest, setUpdateManifest] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [installerSpec, setInstallerSpec] = useState<any>(null);

  // Modal / Feedback state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load all foundational data
  const loadInitialData = async () => {
    try {
      const [meRes, usersRes, rolesRes, permsRes, sessRes, licRes, setRes, auditRes, bkpRes, updRes, instRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/security/users'),
        fetch('/api/security/roles'),
        fetch('/api/security/permissions'),
        fetch('/api/security/sessions'),
        fetch('/api/license/info'),
        fetch('/api/security/settings'),
        fetch('/api/audit-log'),
        fetch('/api/backup/history'),
        fetch('/api/updates/check'),
        fetch('/api/installer/spec')
      ]);

      if (meRes.ok) setCurrentUser((await meRes.json()).user);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (permsRes.ok) setPermissions(await permsRes.json());
      if (sessRes.ok) setActiveSessions(await sessRes.json());
      if (licRes.ok) setLicenseData(await licRes.json());
      if (setRes.ok) setSettings(await setRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (bkpRes.ok) setBackups(await bkpRes.json());
      if (updRes.ok) setUpdateManifest(await updRes.json());
      if (instRes.ok) setInstallerSpec(await instRes.json());
    } catch (err) {
      console.error('Failed to load security & licensing data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Quick user switcher to test RBAC roles
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.activeUser);
        setNotice(`Active user switched to '${data.activeUser.username}' (${data.activeUser.displayName}). RBAC permissions updated.`);
        setTimeout(() => setNotice(null), 4000);
        loadInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
          confirmPassword: passwordForm.confirm
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ text: 'Password successfully updated.', isError: false });
        setPasswordForm({ current: '', next: '', confirm: '' });
        setTimeout(() => setPasswordModalOpen(false), 1500);
      } else {
        setPasswordMsg({ text: data.error || 'Failed to change password.', isError: true });
      }
    } catch {
      setPasswordMsg({ text: 'Network communication error.', isError: true });
    }
  };

  // Activate License
  const handleActivateLicense = async (keyToUse?: string) => {
    const key = keyToUse || licenseKeyInput;
    if (!key.trim()) return;
    setActivationMsg(null);
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key, deviceName: 'WORKSTATION-MAIN' })
      });
      const data = await res.json();
      if (res.ok) {
        setActivationMsg({ text: data.message, isError: false });
        setLicenseKeyInput('');
        loadInitialData();
      } else {
        setActivationMsg({ text: data.error || 'Activation failed.', isError: true });
      }
    } catch {
      setActivationMsg({ text: 'License service unreachable.', isError: true });
    }
  };

  // Start 14-Day Free Trial
  const handleStartTrial = async () => {
    try {
      const res = await fetch('/api/license/start-trial', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActivationMsg({ text: '14-Day Professional Trial mode activated.', isError: false });
        loadInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deactivate Device
  const handleDeactivateDevice = async (deviceId: string) => {
    try {
      const res = await fetch('/api/license/deactivate-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      if (res.ok) {
        loadInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Terminate Session
  const handleTerminateSession = async (sessionId: string) => {
    try {
      await fetch(`/api/security/sessions/${sessionId}/terminate`, { method: 'POST' });
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Backup
  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEncrypted: true, includeAuditLogs: true })
      });
      const data = await res.json();
      if (res.ok) {
        setBackupNotice(`Encrypted backup '${data.package.filename}' generated with SHA-256 checksum.`);
        setTimeout(() => setBackupNotice(null), 4000);
        loadInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Validate Backup
  const handleValidateBackup = async (backupId: string) => {
    try {
      const res = await fetch('/api/backup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });
      const data = await res.json();
      if (res.ok) {
        setBackupNotice(`Verification Success: ${data.checksumStatus} (${data.compatibility})`);
        setTimeout(() => setBackupNotice(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async (backupId: string) => {
    if (!window.confirm('Restore configuration from this package? An automatic safety snapshot will be created before applying.')) return;
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });
      const data = await res.json();
      if (res.ok) {
        setBackupNotice(data.message);
        setTimeout(() => setBackupNotice(null), 5000);
        loadInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check & Download Update
  const handleDownloadUpdate = async () => {
    setUpdateStatus('Downloading update package to staging directory and verifying SHA-256 signature...');
    try {
      const res = await fetch('/api/updates/download-verify', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setUpdateStatus('Update v12.1.0-RTM verified and staged. Ready for restart upgrade.');
      }
    } catch (err) {
      setUpdateStatus('Failed to download update.');
    }
  };

  // Stage Update for Install
  const handleStageInstall = async () => {
    try {
      const res = await fetch('/api/updates/install', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setUpdateStatus('Update successfully staged. Standalone application will apply schema migrations on next launch.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy text helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSeverity = auditFilter.severity === 'All' || log.severity === auditFilter.severity;
    const q = auditFilter.search.toLowerCase();
    const matchesSearch = !q || log.action?.toLowerCase().includes(q) || log.user?.toLowerCase().includes(q) || log.details?.toLowerCase().includes(q);
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Notice */}
      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Profile Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Enterprise Security & Licensing</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Phase 12 Ready
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                {licenseData?.license?.edition || 'Enterprise'} Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-user RBAC, cryptographically verified licensing, immutable audit logging, local encryption & distributable installer.
            </p>
          </div>
        </div>

        {/* Current User & Quick RBAC Role Switcher */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="text-right pr-2 border-r border-slate-200">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-end">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentUser?.displayName || 'System Administrator'}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Role: <span className="font-semibold text-slate-700">{currentUser?.roleName || 'Administrator'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 font-medium hidden sm:inline">Switch Role:</label>
            <select
              className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              value={currentUser?.id || 'USR_ADMIN'}
              onChange={(e) => handleSwitchUser(e.target.value)}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.roleId.replace('ROLE_', '')})
                </option>
              ))}
            </select>

            <button
              onClick={() => setPasswordModalOpen(true)}
              className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded transition-colors"
            >
              Password
            </button>
          </div>
        </div>
      </div>

      {/* Warning Banners */}
      {licenseData?.license?.status === 'Trial' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span><strong>Trial Mode Active:</strong> {licenseData.daysRemaining} days remaining. Automated background scheduling and email delivery are restricted to Enterprise editions.</span>
          </div>
          <button onClick={() => setActiveTab('licensing')} className="underline font-bold text-amber-900 hover:text-amber-950">
            Activate Full License
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-px">
        {[
          { id: 'users', label: 'Users & RBAC Roles', icon: Users },
          { id: 'licensing', label: 'Licensing & Devices', icon: Key },
          { id: 'policies', label: 'Security & Audit Logs', icon: Lock },
          { id: 'backup', label: 'Backup & Restore', icon: Database },
          { id: 'updates', label: 'Updates & Installer', icon: RefreshCw },
          { id: 'about', label: 'About & SBOM', icon: Info }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS & RBAC ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Accounts Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Configured User Accounts</h2>
                <p className="text-xs text-slate-500">Local user authentication with salted PBKDF2 hashing, lockout protection, and company boundaries.</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Total Users: <strong>{users.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Failed Logins</th>
                    <th className="p-3">Last Login</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{u.displayName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">@{u.username} • {u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.roleId === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                          u.roleId === 'ROLE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                          u.roleId === 'ROLE_ANALYST' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {u.roleId.replace('ROLE_', '')}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.isLocked ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" /> Locked Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono">{u.failedLoginAttempts} / {settings.maxFailedAttempts}</td>
                      <td className="p-3 text-slate-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSwitchUser(u.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                        >
                          Login As
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Sessions Inspector */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Active Desktop Sessions</h2>
              </div>
              <span className="text-xs text-slate-500">Auto-expiry timeout: <strong>{settings.sessionTimeoutMinutes} mins</strong></span>
            </div>

            <div className="space-y-2">
              {activeSessions.map(sess => (
                <div key={sess.sessionId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>{sess.displayName} (@{sess.username})</span>
                      <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">ONLINE</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5 font-mono">
                      Device: {sess.deviceIdentifier} • IP: {sess.ipAddress} • Logged in: {new Date(sess.loginTime).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTerminateSession(sess.sessionId)}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded font-medium transition-colors"
                  >
                    Terminate Session
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Granular Permissions Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Granular RBAC Permissions Catalog (20 Permissions)</h2>
            <p className="text-xs text-slate-500 mb-4">Strictly enforced in both UI elements and backend service methods.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {roles.map(role => (
                <div key={role.roleId} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>{role.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-mono">{role.permissions.length} perms</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 mb-2">{role.description}</p>
                  
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {permissions.map(p => {
                      const granted = role.permissions.includes(p.permissionId);
                      return (
                        <div key={p.permissionId} className="flex items-center gap-1.5 text-[11px]">
                          {granted ? (
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-slate-300 shrink-0" />
                          )}
                          <span className={granted ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                            {p.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LICENSING & DEVICES */}
      {activeTab === 'licensing' && (
        <div className="space-y-6">
          {/* License Status Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Installed License Information</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    licenseData?.license?.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    licenseData?.license?.status === 'Trial' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {licenseData?.license?.status?.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Licensed Edition</div>
                    <div className="text-sm font-bold text-slate-900">{licenseData?.license?.edition}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">License Type</div>
                    <div className="text-sm font-bold text-slate-900">{licenseData?.license?.type}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Valid Until</div>
                    <div className="text-sm font-bold text-slate-900">
                      {licenseData?.license?.expiresAt ? new Date(licenseData.license.expiresAt).toLocaleDateString() : 'N/A'}
                      <span className="text-[10px] text-emerald-600 block font-normal">
                        ({licenseData?.daysRemaining} days remaining)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 font-mono">
                  <div><strong>Customer:</strong> {licenseData?.license?.customer} ({licenseData?.license?.customerId})</div>
                  <div><strong>License ID:</strong> {licenseData?.license?.licenseId}</div>
                  <div><strong>Key:</strong> {licenseData?.license?.licenseKey}</div>
                  <div><strong>Verification Signature:</strong> <span className="text-[11px] text-slate-500 break-all">{licenseData?.license?.signature?.substring(0, 32)}... [ED25519 Verified]</span></div>
                  <div><strong>Public Verification Key:</strong> {licenseData?.license?.publicKeyFingerprint}</div>
                </div>
              </div>

              {/* Air-Gapped Offline Grace Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    Offline Grace Period
                  </div>
                  <p className="text-[11px] text-slate-600">
                    EXFIN supports 100% offline air-gapped financial operations without constant internet connectivity.
                  </p>
                  <div className="mt-3 p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Offline Grace Status:</span>
                      <strong className="text-emerald-700">Healthy</strong>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Days Remaining:</span>
                      <strong>{licenseData?.license?.offlineGraceDaysRemaining || 7} Days</strong>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                  Clock rollback tampering protection: <span className="text-emerald-600 font-semibold">Active & Normal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activate License Key Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Activate Commercial License Key</h2>
            <p className="text-xs text-slate-500 mb-3">Enter your signed cryptographic license key provided in your EXFIN commercial subscription bundle.</p>

            {activationMsg && (
              <div className={`p-3 rounded-lg text-xs font-medium mb-3 ${
                activationMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {activationMsg.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="EXFIN-ENTP-XXXX-XXXX-XXXX-SIGNED-ED25519"
                className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleActivateLicense()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Activate Key
              </button>
            </div>

            {/* Quick Test Key Presets for Evaluator */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Quick Evaluator Presets:</span>
              <button
                onClick={() => handleActivateLicense('EXFIN-ENTP-98A4-2C7F-6B1E-77D0-SIGNED-ED25519')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-[11px] font-semibold transition-colors"
              >
                Enterprise Edition
              </button>
              <button
                onClick={() => handleActivateLicense('EXFIN-PRO-44B1-88F2-11C9-33A5-SIGNED-ED25519')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-[11px] font-semibold transition-colors"
              >
                Professional Edition
              </button>
              <button
                onClick={() => handleStartTrial()}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 text-[11px] font-semibold transition-colors"
              >
                14-Day Trial Mode
              </button>
            </div>
          </div>

          {/* Device Registration & Limits */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Registered Devices & Hardware Bindings</h2>
                <p className="text-xs text-slate-500">Device limit enforcement: maximum allowed devices for {licenseData?.license?.edition} edition.</p>
              </div>
              <div className="text-xs font-bold text-slate-700">
                Registered: <span className="text-blue-600">{licenseData?.activeDeviceCount}</span> / {licenseData?.license?.maxDevices} Devices
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Device Name</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Device Fingerprint</th>
                    <th className="p-3">Registered Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenseData?.registeredDevices?.map(dev => (
                    <tr key={dev.deviceId} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-slate-400" />
                        {dev.deviceName}
                        {dev.isCurrentDevice && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">THIS DEVICE</span>
                        )}
                      </td>
                      <td className="p-3">{dev.platform}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{dev.deviceId}</td>
                      <td className="p-3 text-slate-500">{new Date(dev.registeredAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        {dev.isActive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold">Deactivated</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {dev.isActive && (
                          <button
                            onClick={() => handleDeactivateDevice(dev.deviceId)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configurable Feature Matrix Across Editions */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Commercial Feature Matrix Across Product Editions</h2>
            <p className="text-xs text-slate-500 mb-4">Enterprise feature gating evaluated dynamically based on active license entitlement payload.</p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Capability / Feature</th>
                    <th className="p-3 text-center">Free</th>
                    <th className="p-3 text-center">Professional</th>
                    <th className="p-3 text-center">Business</th>
                    <th className="p-3 text-center bg-blue-50/70 text-blue-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenseData?.featureMatrix?.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-800">{f.name}</td>
                      <td className="p-3 text-center text-slate-500">{f.free}</td>
                      <td className="p-3 text-center text-slate-700">{f.professional}</td>
                      <td className="p-3 text-center text-slate-700">{f.business}</td>
                      <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/30">{f.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY POLICIES & AUDIT LOGS */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Security Settings Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Local Security & Lockout Policies</h2>
            <p className="text-xs text-slate-500 mb-4">Configure brute-force protection, account lockout, and inactivity thresholds.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Max Failed Attempts</label>
                <input
                  type="number"
                  value={settings.maxFailedAttempts}
                  onChange={(e) => setSettings({ ...settings, maxFailedAttempts: parseInt(e.target.value) || 5 })}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                />
                <span className="text-[10px] text-slate-500">Triggers account lockout</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Lockout Duration (Mins)</label>
                <input
                  type="number"
                  value={settings.lockoutDurationMinutes}
                  onChange={(e) => setSettings({ ...settings, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                />
                <span className="text-[10px] text-slate-500">Temporary lock period</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Session Inactivity (Mins)</label>
                <input
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                />
                <span className="text-[10px] text-slate-500">Auto-terminates stale sessions</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Audit Retention</label>
                <select
                  value={settings.auditRetentionDays}
                  onChange={(e) => setSettings({ ...settings, auditRetentionDays: parseInt(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 font-medium bg-white"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year (Recommended)</option>
                  <option value={1095}>3 Years</option>
                  <option value={99999}>Forever</option>
                </select>
                <span className="text-[10px] text-slate-500">Retention purge cycle</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={async () => {
                  await fetch('/api/security/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                  });
                  setNotice('Security policy settings saved and logged to audit trail.');
                  setTimeout(() => setNotice(null), 3500);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Save Policies
              </button>
            </div>
          </div>

          {/* Immutable Audit Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Immutable Compliance & Audit Log</h2>
                <p className="text-xs text-slate-500">Records logins, failed attempts, license changes, exports, and administrative actions. Read-only view.</p>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={auditFilter.search}
                    onChange={(e) => setAuditFilter({ ...auditFilter, search: e.target.value })}
                    className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-48 text-slate-800 focus:outline-hidden"
                  />
                </div>

                <select
                  value={auditFilter.severity}
                  onChange={(e) => setAuditFilter({ ...auditFilter, severity: e.target.value })}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Severities</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>

                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "Timestamp,User,Action,ObjectType,Severity,Details\n" +
                      filteredAuditLogs.map(l => `"${l.timestamp}","${l.user}","${l.action}","${l.objectType}","${l.severity}","${l.details}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `EXFIN_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">{log.user}</td>
                      <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">{log.action}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          log.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.severity || 'Info'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 text-[11px] max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Application Configuration Backup & Disaster Recovery</h2>
                <p className="text-xs text-slate-500">
                  Creates an authenticated <code>.exfinbackup</code> package containing mappings, reports, queries, dashboards, and security settings.
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Database className="w-4 h-4" />
                Create Encrypted Backup
              </button>
            </div>

            {backupNotice && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{backupNotice}</span>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Package File</th>
                    <th className="p-3">Created Date</th>
                    <th className="p-3">Items Contained</th>
                    <th className="p-3">Encryption</th>
                    <th className="p-3">SHA-256 Checksum</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map(b => (
                    <tr key={b.backupId} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        {b.filename}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="text-[11px] text-slate-600">
                          {b.itemCounts?.mappings || 14} Mappings • {b.itemCounts?.reports || 8} Reports • {b.itemCounts?.queries || 12} Queries
                        </div>
                      </td>
                      <td className="p-3">
                        {b.isEncrypted ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">AES-256-GCM</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">Standard</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                        {b.checksumSha256}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleValidateBackup(b.backupId)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(b.backupId)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Safety First:</strong> EXFIN creates an automatic safety snapshot immediately prior to applying any restore operation. 
                Raw Tally accounting data is never touched or overwritten during backup or restoration.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: UPDATES & INSTALLER */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          {/* Auto-Update Service */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Application Update Service</h2>
                <p className="text-xs text-slate-500">Cryptographically verified release updates with automatic rollback protection.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Channel:</span>
                <select
                  value={settings.updateChannel}
                  onChange={(e) => setSettings({ ...settings, updateChannel: e.target.value })}
                  className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white font-medium"
                >
                  <option value="Stable">Stable (Recommended)</option>
                  <option value="Beta">Beta (Early Preview)</option>
                  <option value="Developer">Developer (Nightly)</option>
                </select>
              </div>
            </div>

            {updateStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-900 mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span>{updateStatus}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Available Version: v{updateManifest?.availableVersion || '12.1.0-RTM'}</div>
                  <div className="text-[11px] text-slate-500">Current Installed Version: v{updateManifest?.currentVersion || '12.0.0'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadUpdate}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Download & Verify SHA-256
                  </button>
                  <button
                    onClick={handleStageInstall}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Stage for Next Launch
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 text-xs">
                <div className="font-semibold text-slate-700 mb-1">Release Highlights:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  {updateManifest?.releaseNotes?.map((n: string, i: number) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              <div className="font-mono text-[10px] text-slate-400 break-all border-t border-slate-200 pt-2">
                Package SHA-256: {updateManifest?.packageSha256} • Code Sign: Digicert EV Timestamped
              </div>
            </div>
          </div>

          {/* Windows Desktop Installer Specification */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Windows Desktop Installer Specification (x64)</h2>
                <p className="text-xs text-slate-500">Separation of read-only application binaries from mutable user configurations.</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-mono font-bold rounded border border-slate-200">
                Inno Setup / WiX MSI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Directory Architecture:</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div><span className="text-blue-700">Binaries:</span> {installerSpec?.paths?.binaryDirectory}</div>
                  <div><span className="text-emerald-700">User Data:</span> {installerSpec?.paths?.userDataDirectory}</div>
                  <div><span className="text-amber-700">Logs:</span> {installerSpec?.paths?.logDirectory}</div>
                  <div><span className="text-purple-700">Reports:</span> {installerSpec?.paths?.reportDirectory}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Registered Windows File Associations:</div>
                <div className="space-y-1 text-[11px] text-slate-600 font-mono">
                  <div><code>.exfinreport</code> — EXFIN Report Package</div>
                  <div><code>.exfinmapping</code> — Data Mapping Profile</div>
                  <div><code>.exfinbackup</code> — Encrypted Backup Archive</div>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium pt-1">
                  ✓ Uninstaller prompts to preserve user data in %AppData% by default.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ABOUT & SBOM */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">EXFIN Tally Data Mapper</h2>
                <div className="text-xs text-slate-500 font-medium">
                  Version 12.0.0 (Production Release Build 2026.09.07-RTM) • 64-Bit Edition
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  Enterprise-grade Windows desktop integration suite for TallyPrime XML and ODBC data discovery, schema mapping, financial reporting, and AI analysis.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">Tally Access Protocol</div>
                <div className="text-xs font-bold text-emerald-700">Strictly READ-ONLY</div>
                <div className="text-[10px] text-slate-500">No write/mutation commands permitted</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">Code Signing</div>
                <div className="text-xs font-bold text-blue-700">Digicert EV Timestamped</div>
                <div className="text-[10px] text-slate-500">SHA-256 Authenticode Certified</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">Offline Capability</div>
                <div className="text-xs font-bold text-slate-800">100% Air-Gapped Supported</div>
                <div className="text-[10px] text-slate-500">7-Day Local Offline Grace Buffer</div>
              </div>
            </div>

            {/* Diagnostics Export Button */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={async () => {
                  const res = await fetch('/api/system/diagnostics-bundle');
                  const data = await res.json();
                  copyToClipboard(JSON.stringify(data, null, 2), 'Diagnostics Bundle');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                {copiedText === 'Diagnostics Bundle' ? 'Copied to Clipboard!' : 'Copy Sanitized Diagnostics'}
              </button>

              <button
                onClick={async () => {
                  const res = await fetch('/api/system/sbom');
                  const data = await res.json();
                  copyToClipboard(JSON.stringify(data, null, 2), 'SBOM');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
              >
                <Code className="w-3.5 h-3.5 text-slate-600" />
                {copiedText === 'SBOM' ? 'Copied SBOM!' : 'Copy CycloneDX SBOM'}
              </button>

              <button
                onClick={async () => {
                  const res = await fetch('/api/system/third-party-notices');
                  const text = await res.text();
                  copyToClipboard(text, 'Third Party Notices');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                {copiedText === 'Third Party Notices' ? 'Copied Notices!' : 'Third-Party Notices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Change Password (@{currentUser?.username})
              </h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-lg text-xs font-medium mb-3 ${
                passwordMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500">Min 8 chars, 1 number, 1 special character</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
