/**
 * Phase 32N: Secure Multi-Company, Multi-User Workspace Architecture Types
 */

export type WorkspaceType = 'Personal' | 'Team' | 'Organization';
export type WorkspaceRole = 'Owner' | 'Administrator' | 'Analyst' | 'Viewer';
export type WorkspacePlan = 'Trial' | 'Professional' | 'Business' | 'Enterprise';
export type LicenseStatusState = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'INVALID';
export type SyncMode = 'Local Only' | 'Metadata Sync' | 'Result Sync' | 'Central Data Workspace';

export interface Workspace {
  workspaceId: string;
  name: string;
  ownerId: string;
  status: 'Active' | 'Suspended' | 'Deleted';
  plan: WorkspacePlan;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceCompany {
  companyId: string;
  workspaceId: string;
  companyName: string;
  source: string;
  schemaVersion: string;
  financialYear: string;
  status: 'Linked' | 'Unlinked';
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: 'Active' | 'Inactive';
  joinedAt: string;
  lastActiveAt: string;
}

export interface WorkspaceInvitation {
  invitationId: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  expiration: string;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
}

export interface UserSession {
  sessionId: string;
  userId: string;
  workspaceId: string;
  createdAt: string;
  lastActivity: string;
  expiration: string;
  revoked: boolean;
}

export interface DeviceInstallation {
  installationId: string;
  userId: string;
  workspaceId: string;
  applicationVersion: string;
  os: string;
  lastSeen: string;
  status: 'Active' | 'Deactivated';
}

export interface CentralLicense {
  licenseId: string;
  customerId: string;
  plan: WorkspacePlan;
  status: LicenseStatusState;
  issuedAt: string;
  startDate: string;
  expiryDate: string;
  seatLimit: number;
  deviceLimit: number;
  featureEntitlements: {
    multiCompany: boolean;
    multiUser: boolean;
    advancedReports: boolean;
    dashboards: boolean;
    advancedMapping: boolean;
    liveTally: boolean;
    remoteWorkspace: boolean;
    exports: boolean;
    advancedAnalytics: boolean;
  };
  signature: string;
}

export interface WorkspaceAudit {
  auditId: string;
  userId: string;
  userEmail: string;
  workspaceId: string;
  companyId?: string;
  action: string;
  resource: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  category: 'Invitation' | 'MappingReview' | 'LicenseExpiry' | 'SyncFailure' | 'ReportPublication' | 'SecurityEvent';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
