import express from 'express';
import crypto from 'crypto';

export const centralApiRouter = express.Router();

// Central Server State Simulation
let outageSimulationMode: 'normal' | 'service_unavailable' | 'rate_limited' = 'normal';

// Rate Limiting Tracking
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 120; // 120 requests per minute

// Rate Limiter Middleware
centralApiRouter.use((req, res, next) => {
  if (outageSimulationMode === 'service_unavailable') {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'EXFIN Central Services is temporarily unavailable for scheduled maintenance.',
      retryAfterSeconds: 30,
      timestamp: new Date().toISOString()
    });
  }

  if (outageSimulationMode === 'rate_limited') {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests sent to Central Licensing Gateway. Backoff and retry.',
      retryAfterSeconds: 15,
      timestamp: new Date().toISOString()
    });
  }

  const clientIp = req.ip || '127.0.0.1';
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for IP. Please wait before retrying.',
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000)
      });
    }
  }

  next();
});

// Admin Users & RBAC
export interface CentralAdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'Super Administrator' | 'License Administrator' | 'Support Administrator' | 'Release Administrator' | 'Read-only Administrator';
  isMfaEnabled: boolean;
  lastLoginAt: string;
}

const adminUsersDb: CentralAdminUser[] = [
  {
    id: 'ADM_001',
    username: 'elena.vance',
    email: 'elena.vance@exfin-central.net',
    displayName: 'Elena Vance (Super Admin)',
    role: 'Super Administrator',
    isMfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ADM_002',
    username: 'marcus.lic',
    email: 'marcus.reed@exfin-central.net',
    displayName: 'Marcus Reed (License Ops)',
    role: 'License Administrator',
    isMfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'ADM_003',
    username: 'priya.support',
    email: 'priya.sharma@exfin-central.net',
    displayName: 'Priya Sharma (Support Lead)',
    role: 'Support Administrator',
    isMfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 28800000).toISOString()
  },
  {
    id: 'ADM_004',
    username: 'david.release',
    email: 'david.chen@exfin-central.net',
    displayName: 'David Chen (DevOps / Release)',
    role: 'Release Administrator',
    isMfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'ADM_005',
    username: 'auditor.read',
    email: 'sarah.connor@audit-partner.com',
    displayName: 'Sarah Connor (Compliance Auditor)',
    role: 'Read-only Administrator',
    isMfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 172800000).toISOString()
  }
];

let currentAdminUser = adminUsersDb[0];

// Customers & Organizations Database
export interface CustomerRecord {
  id: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Suspended' | 'PendingActivation';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRecord {
  id: string;
  customerId: string;
  name: string;
  status: 'Active' | 'Inactive';
  region: string;
  createdAt: string;
}

const customersDb: CustomerRecord[] = [
  {
    id: 'CUST_001',
    customerCode: 'APEX-FIN',
    name: 'Apex Global Financial Services Ltd.',
    email: 'licenses@apex-financial.com',
    phone: '+1 (555) 234-8900',
    status: 'Active',
    notes: 'Enterprise account with 5 production server nodes and multi-branch accounting.',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2026-08-20T11:30:00Z'
  },
  {
    id: 'CUST_002',
    customerCode: 'METRO-LOG',
    name: 'Metro Freight Logistics International',
    email: 'it.director@metro-logistics.in',
    phone: '+91 (22) 4981-2200',
    status: 'Active',
    notes: 'High volume logistics with daily automated sales & inventory ledger export.',
    createdAt: '2025-04-10T10:15:00Z',
    updatedAt: '2026-09-01T14:20:00Z'
  },
  {
    id: 'CUST_003',
    customerCode: 'STERLING-RET',
    name: 'Sterling Consumer Retail Stores Ltd.',
    email: 'cfo@sterlingretail.co.uk',
    phone: '+44 (20) 7946-0912',
    status: 'Active',
    notes: 'Retail chain operating 45 outlets with TallyPrime consolidation.',
    createdAt: '2025-07-22T09:00:00Z',
    updatedAt: '2026-08-15T16:00:00Z'
  },
  {
    id: 'CUST_004',
    customerCode: 'VANGUARD-MFG',
    name: 'Vanguard Precision Manufacturing LLC',
    email: 'finance@vanguardmfg.de',
    phone: '+49 (89) 636-48000',
    status: 'Active',
    notes: 'Manufacturing plant with job-costing and multi-currency ledgers.',
    createdAt: '2025-11-05T13:45:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'CUST_005',
    customerCode: 'HORIZON-ADV',
    name: 'Horizon Capital & Advisory Partners',
    email: 'compliance@horizoncap.sg',
    phone: '+65 6789-0123',
    status: 'Suspended',
    notes: 'Commercial renewal overdue; suspended pending billing reconciliation.',
    createdAt: '2025-02-18T15:20:00Z',
    updatedAt: '2026-09-05T12:00:00Z'
  }
];

const organizationsDb: OrganizationRecord[] = [
  { id: 'ORG_001_HQ', customerId: 'CUST_001', name: 'Apex Corporate Headquarters', status: 'Active', region: 'North America', createdAt: '2025-01-15T08:00:00Z' },
  { id: 'ORG_001_EMEA', customerId: 'CUST_001', name: 'Apex Europe Shared Services', status: 'Active', region: 'Europe', createdAt: '2025-03-10T09:30:00Z' },
  { id: 'ORG_002_MUM', customerId: 'CUST_002', name: 'Metro Mumbai Hub & Depot', status: 'Active', region: 'India West', createdAt: '2025-04-10T10:15:00Z' },
  { id: 'ORG_003_LDN', customerId: 'CUST_003', name: 'Sterling London Central Flagship', status: 'Active', region: 'United Kingdom', createdAt: '2025-07-22T09:00:00Z' },
  { id: 'ORG_004_MUN', customerId: 'CUST_004', name: 'Vanguard Munich Plant 1', status: 'Active', region: 'Germany', createdAt: '2025-11-05T13:45:00Z' },
  { id: 'ORG_005_SG', customerId: 'CUST_005', name: 'Horizon Singapore Advisory', status: 'Active', region: 'Asia-Pacific', createdAt: '2025-02-18T15:20:00Z' }
];

// Product, Editions, and Features
export interface FeatureRecord {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface EditionRecord {
  id: string;
  name: string;
  maxDevices: number;
  pricePerYearUsd: number;
  features: string[];
}

const featuresCatalogDb: FeatureRecord[] = [
  { id: 'BASIC_DISCOVERY', name: 'Universal Schema Discovery', category: 'Core', description: 'Live XML/ODBC discovery of Tally masters, ledgers, and voucher schemas.' },
  { id: 'CSV_EXPORT', name: 'CSV & Delimited Export', category: 'Export', description: 'Export Tally records to flat CSV, TSV, and delimited files.' },
  { id: 'JSON_XLSX_EXPORT', name: 'Excel & JSON Serialization', category: 'Export', description: 'Native multi-tab XLSX workbooks and structured hierarchical JSON.' },
  { id: 'ADVANCED_MAPPING', name: 'Visual Mapping & Formula Engine', category: 'Transformation', description: 'Complex field transformation, regex replacements, and math arithmetic.' },
  { id: 'PDF_EXPORT', name: 'Custom PDF Document Engine', category: 'Reporting', description: 'Pixel-perfect PDF vouchers, invoices, and ledger confirmation statements.' },
  { id: 'SCHEDULED_REPORTS', name: 'Background Cron Scheduler', category: 'Automation', description: 'Automated background execution with Windows task daemon.' },
  { id: 'EMAIL_DELIVERY', name: 'Secure SMTP & Outlook Delivery', category: 'Automation', description: 'Automated email distribution with encrypted TLS attachments.' },
  { id: 'COPILOT_INTELLIGENCE', name: 'Tally Intelligence Copilot', category: 'AI', description: 'Natural language analytical querying and automated error diagnosis.' },
  { id: 'MULTI_USER_RBAC', name: 'Enterprise Multi-User RBAC', category: 'Security', description: 'Salted PBKDF2 authentication, company boundaries, and audit logging.' },
  { id: 'REST_WEBHOOKS', name: 'Outbound REST Webhooks', category: 'Integration', description: 'Real-time HTTP JSON webhooks to ERP, CRM, and cloud data warehouses.' },
  { id: 'ODBC_CONNECTOR', name: 'Direct Windows ODBC Driver', category: 'Integration', description: 'Bypasses XML parsing using high-throughput 64-bit ODBC streaming.' },
  { id: 'OFFLINE_AIRGAP', name: 'Air-Gapped Offline Operation', category: 'Compliance', description: 'Guaranteed 100% functionality without outbound internet connectivity.' }
];

const editionsDb: EditionRecord[] = [
  {
    id: 'ED_FREE',
    name: 'Free / Community',
    maxDevices: 1,
    pricePerYearUsd: 0,
    features: ['BASIC_DISCOVERY', 'CSV_EXPORT', 'OFFLINE_AIRGAP']
  },
  {
    id: 'ED_PRO',
    name: 'Professional',
    maxDevices: 1,
    pricePerYearUsd: 499,
    features: ['BASIC_DISCOVERY', 'CSV_EXPORT', 'JSON_XLSX_EXPORT', 'ADVANCED_MAPPING', 'OFFLINE_AIRGAP']
  },
  {
    id: 'ED_BIZ',
    name: 'Business',
    maxDevices: 3,
    pricePerYearUsd: 1199,
    features: ['BASIC_DISCOVERY', 'CSV_EXPORT', 'JSON_XLSX_EXPORT', 'ADVANCED_MAPPING', 'PDF_EXPORT', 'SCHEDULED_REPORTS', 'OFFLINE_AIRGAP']
  },
  {
    id: 'ED_ENTP',
    name: 'Enterprise',
    maxDevices: 10,
    pricePerYearUsd: 2999,
    features: [
      'BASIC_DISCOVERY',
      'CSV_EXPORT',
      'JSON_XLSX_EXPORT',
      'ADVANCED_MAPPING',
      'PDF_EXPORT',
      'SCHEDULED_REPORTS',
      'EMAIL_DELIVERY',
      'COPILOT_INTELLIGENCE',
      'MULTI_USER_RBAC',
      'REST_WEBHOOKS',
      'ODBC_CONNECTOR',
      'OFFLINE_AIRGAP'
    ]
  }
];

// Central Licenses Database
export interface CentralLicenseRecord {
  id: string;
  licenseKeyId: string;
  customerId: string;
  customerName: string;
  organizationId: string;
  productId: string;
  editionId: string;
  editionName: string;
  status: 'Active' | 'ExpiringSoon' | 'Expired' | 'Suspended' | 'Revoked';
  issuedAt: string;
  startsAt: string;
  expiresAt: string;
  maxDevices: number;
  entitledFeatures: string[];
  signature: string;
  publicKeyFingerprint: string;
  createdAt: string;
  updatedAt: string;
  revocationReason?: string;
}

// Server-side Asymmetric Signing Simulation (Ed25519 style)
const SERVER_PRIVATE_SIGNING_KEY_FP = 'ED25519-PRIV-EXFIN-ROOT-AUTHORITY-2026';
const SERVER_PUBLIC_VERIFICATION_KEY_FP = 'SHA256:7f49c0d1283e18a9e6b472e391cb09f8931a29f8d1c7a84092b1f83c1809d44e';

function generateSignedLicenseToken(payload: any): string {
  const serialized = JSON.stringify({
    licenseId: payload.id,
    licenseKeyId: payload.licenseKeyId,
    customerId: payload.customerId,
    editionId: payload.editionId,
    startsAt: payload.startsAt,
    expiresAt: payload.expiresAt,
    maxDevices: payload.maxDevices,
    features: payload.entitledFeatures
  });
  const hash = crypto.createHmac('sha256', SERVER_PRIVATE_SIGNING_KEY_FP).update(serialized).digest('hex');
  return `SIG-ED25519-${hash.substring(0, 48).toUpperCase()}`;
}

const centralLicensesDb: CentralLicenseRecord[] = [
  {
    id: 'LIC_001_ENTP',
    licenseKeyId: 'EXFIN-ENTP-98A4-2C7F-6B1E-77D0-SIGNED-ED25519',
    customerId: 'CUST_001',
    customerName: 'Apex Global Financial Services Ltd.',
    organizationId: 'ORG_001_HQ',
    productId: 'PROD_TALLY_MAPPER',
    editionId: 'ED_ENTP',
    editionName: 'Enterprise',
    status: 'Active',
    issuedAt: '2026-01-01T00:00:00Z',
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-03-31T23:59:59Z', // Expiring in ~205 days
    maxDevices: 10,
    entitledFeatures: [...editionsDb[3].features],
    signature: '',
    publicKeyFingerprint: SERVER_PUBLIC_VERIFICATION_KEY_FP,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z'
  },
  {
    id: 'LIC_002_BIZ',
    licenseKeyId: 'EXFIN-BIZ-7712-99AC-44F1-5582-SIGNED-ED25519',
    customerId: 'CUST_002',
    customerName: 'Metro Freight Logistics International',
    organizationId: 'ORG_002_MUM',
    productId: 'PROD_TALLY_MAPPER',
    editionId: 'ED_BIZ',
    editionName: 'Business',
    status: 'Active',
    issuedAt: '2025-10-01T00:00:00Z',
    startsAt: '2025-10-01T00:00:00Z',
    expiresAt: '2026-09-22T23:59:59Z', // Expiring in ~15 days (triggers 30-day alert)
    maxDevices: 3,
    entitledFeatures: [...editionsDb[2].features],
    signature: '',
    publicKeyFingerprint: SERVER_PUBLIC_VERIFICATION_KEY_FP,
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2026-08-30T09:00:00Z'
  },
  {
    id: 'LIC_003_PRO',
    licenseKeyId: 'EXFIN-PRO-44B1-88F2-11C9-33A5-SIGNED-ED25519',
    customerId: 'CUST_003',
    customerName: 'Sterling Consumer Retail Stores Ltd.',
    organizationId: 'ORG_003_LDN',
    productId: 'PROD_TALLY_MAPPER',
    editionId: 'ED_PRO',
    editionName: 'Professional',
    status: 'ExpiringSoon',
    issuedAt: '2025-09-15T00:00:00Z',
    startsAt: '2025-09-15T00:00:00Z',
    expiresAt: '2026-09-12T23:59:59Z', // Expiring in ~5 days (triggers 7-day alert)
    maxDevices: 1,
    entitledFeatures: [...editionsDb[1].features],
    signature: '',
    publicKeyFingerprint: SERVER_PUBLIC_VERIFICATION_KEY_FP,
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2026-09-05T08:00:00Z'
  },
  {
    id: 'LIC_004_EXP',
    licenseKeyId: 'EXFIN-PRO-0091-2244-6688-99AA-SIGNED-ED25519',
    customerId: 'CUST_004',
    customerName: 'Vanguard Precision Manufacturing LLC',
    organizationId: 'ORG_004_MUN',
    productId: 'PROD_TALLY_MAPPER',
    editionId: 'ED_PRO',
    editionName: 'Professional',
    status: 'Expired',
    issuedAt: '2025-08-01T00:00:00Z',
    startsAt: '2025-08-01T00:00:00Z',
    expiresAt: '2026-08-31T23:59:59Z', // Expired 7 days ago
    maxDevices: 1,
    entitledFeatures: [...editionsDb[1].features],
    signature: '',
    publicKeyFingerprint: SERVER_PUBLIC_VERIFICATION_KEY_FP,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'LIC_005_SUSP',
    licenseKeyId: 'EXFIN-ENTP-5599-7711-33DD-44EE-SIGNED-ED25519',
    customerId: 'CUST_005',
    customerName: 'Horizon Capital & Advisory Partners',
    organizationId: 'ORG_005_SG',
    productId: 'PROD_TALLY_MAPPER',
    editionId: 'ED_ENTP',
    editionName: 'Enterprise',
    status: 'Suspended',
    issuedAt: '2025-02-18T00:00:00Z',
    startsAt: '2025-02-18T00:00:00Z',
    expiresAt: '2027-02-18T23:59:59Z',
    maxDevices: 5,
    entitledFeatures: [...editionsDb[3].features],
    signature: '',
    publicKeyFingerprint: SERVER_PUBLIC_VERIFICATION_KEY_FP,
    createdAt: '2025-02-18T00:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z',
    revocationReason: 'Payment delinquent: Invoice INV-2026-8802 overdue by 45 days.'
  }
];

// Initialize Signatures for seed licenses
centralLicensesDb.forEach(lic => {
  lic.signature = generateSignedLicenseToken(lic);
});

// Central Devices Database
export interface CentralDeviceRecord {
  id: string;
  licenseId: string;
  customerName: string;
  deviceFingerprint: string;
  friendlyName: string;
  platform: string;
  applicationVersion: string;
  firstSeen: string;
  lastSeen: string;
  status: 'Active' | 'Deactivated';
}

const centralDevicesDb: CentralDeviceRecord[] = [
  {
    id: 'DEV_001_MUM',
    licenseId: 'LIC_001_ENTP',
    customerName: 'Apex Global Financial Services Ltd.',
    deviceFingerprint: 'FPR-A491-B720-D911-3E2A',
    friendlyName: 'APEX-FIN-DESKTOP-01 (Main Server)',
    platform: 'Windows 11 Pro 64-bit (Build 22631)',
    applicationVersion: '12.0.0',
    firstSeen: '2026-01-05T10:00:00Z',
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    status: 'Active'
  },
  {
    id: 'DEV_002_NY',
    licenseId: 'LIC_001_ENTP',
    customerName: 'Apex Global Financial Services Ltd.',
    deviceFingerprint: 'FPR-B882-C339-E441-7A90',
    friendlyName: 'APEX-AUDIT-STATION-02',
    platform: 'Windows 10 Enterprise (Build 19045)',
    applicationVersion: '12.0.0',
    firstSeen: '2026-02-14T11:20:00Z',
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    status: 'Active'
  },
  {
    id: 'DEV_003_LOG',
    licenseId: 'LIC_002_BIZ',
    customerName: 'Metro Freight Logistics International',
    deviceFingerprint: 'FPR-C119-D990-F223-8B44',
    friendlyName: 'METRO-DISPATCH-WS3',
    platform: 'Windows 11 Pro 64-bit (Build 22631)',
    applicationVersion: '12.0.0',
    firstSeen: '2025-10-05T08:30:00Z',
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    status: 'Active'
  },
  {
    id: 'DEV_004_RET',
    licenseId: 'LIC_003_PRO',
    customerName: 'Sterling Consumer Retail Stores Ltd.',
    deviceFingerprint: 'FPR-D442-E771-A559-9C11',
    friendlyName: 'STERLING-ACCOUNTING-01',
    platform: 'Windows 11 Home (Build 22631)',
    applicationVersion: '11.8.2',
    firstSeen: '2025-09-20T14:15:00Z',
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    status: 'Active'
  },
  {
    id: 'DEV_005_OLD',
    licenseId: 'LIC_001_ENTP',
    customerName: 'Apex Global Financial Services Ltd.',
    deviceFingerprint: 'FPR-X999-Y888-Z777-0000',
    friendlyName: 'RETIRED-LAPTOP-DELL',
    platform: 'Windows 10 Pro',
    applicationVersion: '11.4.0',
    firstSeen: '2025-01-10T12:00:00Z',
    lastSeen: '2025-12-20T16:00:00Z',
    status: 'Deactivated'
  }
];

// Releases Database
export interface ReleaseRecord {
  version: string;
  channel: 'Stable' | 'Beta' | 'Developer';
  releaseDate: string;
  minimumVersion: string;
  downloadReference: string;
  packageSha256: string;
  signature: string;
  stagedRolloutPercent: number;
  isCriticalSecurityUpdate: boolean;
  isPublished: boolean;
  releaseNotes: {
    whatsNew: string[];
    bugFixes: string[];
    security: string[];
    compatibility: string;
    migrationNotes: string;
  };
}

const releasesDb: ReleaseRecord[] = [
  {
    version: '12.0.0',
    channel: 'Stable',
    releaseDate: '2026-09-01T00:00:00Z',
    minimumVersion: '11.0.0',
    downloadReference: 'https://releases.exfin.com/packages/EXFIN_TallyMapper_v12.0.0_x64.exe',
    packageSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    signature: 'SIG-ED25519-RTM-12.0.0-9941BA-CERT-EXFIN-2026',
    stagedRolloutPercent: 100,
    isCriticalSecurityUpdate: false,
    isPublished: true,
    releaseNotes: {
      whatsNew: [
        'Universal Tally Schema Discovery Engine with deep nested Collection and Object tree parsing.',
        'Enterprise Security with Salted PBKDF2 local password authentication and RBAC permissions.',
        'Encrypted .exfinbackup archive creation with SHA-256 pre-restore integrity verification.',
        'Zero-touch Tally read-only safety assurance.'
      ],
      bugFixes: [
        'Resolved XML parser buffering error when handling over 100,000 ledger voucher transactions.',
        'Fixed ODBC driver 32-bit vs 64-bit connection string fallback on Windows 11.'
      ],
      security: [
        'Enforced strict rejection of any write XML tags (<IMPORTDATA>, <MODIFY>, <CREATE>).',
        'Implemented automatic account lockout after 5 consecutive failed login attempts.'
      ],
      compatibility: 'Compatible with Tally.ERP 9 Series A (v6.0+), TallyPrime 1.x, 2.x, 3.x, and TallyPrime 4.x.',
      migrationNotes: 'Automatic schema upgrade from v11.x to v12.x SQLite local database.'
    }
  },
  {
    version: '12.1.0-RC1',
    channel: 'Beta',
    releaseDate: '2026-09-06T12:00:00Z',
    minimumVersion: '12.0.0',
    downloadReference: 'https://releases.exfin.com/packages/EXFIN_TallyMapper_v12.1.0_RC1_x64.exe',
    packageSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    signature: 'SIG-ED25519-BETA-12.1.0-8801CC-CERT-EXFIN-2026',
    stagedRolloutPercent: 50,
    isCriticalSecurityUpdate: false,
    isPublished: true,
    releaseNotes: {
      whatsNew: [
        'Central Cloud License verification client with offline grace caching.',
        'Sanitized technical health heartbeat reporting with customer transparency controls.',
        'Self-service customer support ticket launcher with optional diagnostic attachment.'
      ],
      bugFixes: [
        'Optimized PDF document renderer font embedding for international currency symbols.'
      ],
      security: [
        'Added asymmetric Ed25519 digital signature validation for central licenses.'
      ],
      compatibility: 'TallyPrime 3.0+ recommended.',
      migrationNotes: 'Non-breaking incremental release.'
    }
  },
  {
    version: '12.0.1-HOTFIX',
    channel: 'Stable',
    releaseDate: '2026-09-04T18:00:00Z',
    minimumVersion: '11.5.0',
    downloadReference: 'https://releases.exfin.com/packages/EXFIN_TallyMapper_v12.0.1_Hotfix_x64.exe',
    packageSha256: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    signature: 'SIG-ED25519-HOTFIX-12.0.1-4411FA-CERT-EXFIN-2026',
    stagedRolloutPercent: 100,
    isCriticalSecurityUpdate: true,
    isPublished: true,
    releaseNotes: {
      whatsNew: ['Critical security patch addressing TLS certificate revocation caching.'],
      bugFixes: ['Fixed occasional timeout during simultaneous high-volume PDF exports.'],
      security: ['Updated internal crypto library dependencies to patch CVE-2026-8812.'],
      compatibility: 'All supported Windows and Tally environments.',
      migrationNotes: 'Zero-downtime hotfix patch.'
    }
  }
];

// Installation Health Telemetry Database
// STRICT RULE: Only technical metadata allowed! No customer vouchers, ledgers, or financial figures.
export interface HealthTelemetryRecord {
  id: string;
  licenseId: string;
  customerName: string;
  deviceFingerprint: string;
  applicationVersion: string;
  osVersion: string;
  tallyVersion: string;
  connectionStatus: 'Connected (Read-Only)' | 'Tally Offline' | 'Protocol Mismatch';
  lastSuccessfulReportExecution: string | null;
  lastErrorCategory: 'None' | 'TallyConnectionTimeout' | 'OdbcDriverNotFound' | 'PdfRenderMemoryPressure';
  status: 'Healthy' | 'Warning' | 'Offline' | 'Error';
  lastSeenAt: string;
  averageReportLatencyMs: number;
}

const healthTelemetryDb: HealthTelemetryRecord[] = [
  {
    id: 'HLT_001',
    licenseId: 'LIC_001_ENTP',
    customerName: 'Apex Global Financial Services Ltd.',
    deviceFingerprint: 'FPR-A491-B720-D911-3E2A',
    applicationVersion: '12.0.0',
    osVersion: 'Windows 11 Pro 23H2 (x64)',
    tallyVersion: 'TallyPrime 4.1 (64-bit)',
    connectionStatus: 'Connected (Read-Only)',
    lastSuccessfulReportExecution: new Date(Date.now() - 900000).toISOString(),
    lastErrorCategory: 'None',
    status: 'Healthy',
    lastSeenAt: new Date(Date.now() - 300000).toISOString(),
    averageReportLatencyMs: 142
  },
  {
    id: 'HLT_002',
    licenseId: 'LIC_001_ENTP',
    customerName: 'Apex Global Financial Services Ltd.',
    deviceFingerprint: 'FPR-B882-C339-E441-7A90',
    applicationVersion: '12.0.0',
    osVersion: 'Windows 10 Enterprise (x64)',
    tallyVersion: 'TallyPrime 3.0.1 (64-bit)',
    connectionStatus: 'Connected (Read-Only)',
    lastSuccessfulReportExecution: new Date(Date.now() - 14400000).toISOString(),
    lastErrorCategory: 'None',
    status: 'Healthy',
    lastSeenAt: new Date(Date.now() - 7200000).toISOString(),
    averageReportLatencyMs: 215
  },
  {
    id: 'HLT_003',
    licenseId: 'LIC_002_BIZ',
    customerName: 'Metro Freight Logistics International',
    deviceFingerprint: 'FPR-C119-D990-F223-8B44',
    applicationVersion: '12.0.0',
    osVersion: 'Windows 11 Pro 23H2 (x64)',
    tallyVersion: 'TallyPrime 4.0 (64-bit)',
    connectionStatus: 'Connected (Read-Only)',
    lastSuccessfulReportExecution: new Date(Date.now() - 3600000).toISOString(),
    lastErrorCategory: 'None',
    status: 'Healthy',
    lastSeenAt: new Date(Date.now() - 1800000).toISOString(),
    averageReportLatencyMs: 188
  },
  {
    id: 'HLT_004',
    licenseId: 'LIC_003_PRO',
    customerName: 'Sterling Consumer Retail Stores Ltd.',
    deviceFingerprint: 'FPR-D442-E771-A559-9C11',
    applicationVersion: '11.8.2',
    osVersion: 'Windows 11 Home (x64)',
    tallyVersion: 'Tally.ERP 9 Release 6.6',
    connectionStatus: 'Connected (Read-Only)',
    lastSuccessfulReportExecution: new Date(Date.now() - 86400000).toISOString(),
    lastErrorCategory: 'None',
    status: 'Warning', // Due to older application version
    lastSeenAt: new Date(Date.now() - 86400000).toISOString(),
    averageReportLatencyMs: 380
  },
  {
    id: 'HLT_005',
    licenseId: 'LIC_004_EXP',
    customerName: 'Vanguard Precision Manufacturing LLC',
    deviceFingerprint: 'FPR-E552-F881-B660-0D22',
    applicationVersion: '12.0.0',
    osVersion: 'Windows 10 Pro (x64)',
    tallyVersion: 'TallyPrime 2.1 (64-bit)',
    connectionStatus: 'Tally Offline',
    lastSuccessfulReportExecution: '2026-08-30T15:00:00Z',
    lastErrorCategory: 'TallyConnectionTimeout',
    status: 'Offline',
    lastSeenAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    averageReportLatencyMs: 0
  }
];

// Support Tickets Database
export interface SupportTicketRecord {
  id: string;
  customerId: string;
  customerName: string;
  licenseId: string;
  subject: string;
  description: string;
  status: 'Open' | 'InProgress' | 'WaitingOnCustomer' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  diagnosticsAttached: boolean;
  sanitizedDiagnosticsSummary?: string;
  createdAt: string;
  updatedAt: string;
}

const supportTicketsDb: SupportTicketRecord[] = [
  {
    id: 'TICK_1001',
    customerId: 'CUST_001',
    customerName: 'Apex Global Financial Services Ltd.',
    licenseId: 'LIC_001_ENTP',
    subject: 'Request assistance with custom multi-currency ledger PDF template',
    description: 'We need guidance styling the subtotal currency symbols for cross-border EUR and USD transactions.',
    status: 'InProgress',
    priority: 'Medium',
    diagnosticsAttached: true,
    sanitizedDiagnosticsSummary: 'App: v12.0.0, OS: Win11, Tally: Prime 4.1, Mode: Read-Only, No financial figures included.',
    createdAt: '2026-09-05T14:30:00Z',
    updatedAt: '2026-09-06T09:15:00Z'
  },
  {
    id: 'TICK_1002',
    customerId: 'CUST_002',
    customerName: 'Metro Freight Logistics International',
    licenseId: 'LIC_002_BIZ',
    subject: 'ODBC Driver 64-bit configuration query on Windows Server 2022',
    description: 'Verifying registry key settings for unattended background batch runner service.',
    status: 'Open',
    priority: 'High',
    diagnosticsAttached: true,
    sanitizedDiagnosticsSummary: 'App: v12.0.0, OS: WinServer 2022, Tally: Prime 4.0, ODBC Driver: EXFIN 64-bit.',
    createdAt: '2026-09-06T16:45:00Z',
    updatedAt: '2026-09-06T16:45:00Z'
  },
  {
    id: 'TICK_1003',
    customerId: 'CUST_003',
    customerName: 'Sterling Consumer Retail Stores Ltd.',
    licenseId: 'LIC_003_PRO',
    subject: 'Renewal notification query & invoice receipt request',
    description: 'Confirming wire transfer payment instructions for 2-year Enterprise upgrade.',
    status: 'WaitingOnCustomer',
    priority: 'Low',
    diagnosticsAttached: false,
    createdAt: '2026-09-04T10:00:00Z',
    updatedAt: '2026-09-05T11:00:00Z'
  }
];

// Central Administrative Audit Log (Append-Only)
export interface CentralAuditLogEntry {
  id: string;
  timestamp: string;
  adminUsername: string;
  action: string;
  targetType: 'Customer' | 'License' | 'Device' | 'Release' | 'Security' | 'Support';
  targetId: string;
  details: string;
  ipAddress: string;
}

const centralAuditLogsDb: CentralAuditLogEntry[] = [
  {
    id: 'AUD_001',
    timestamp: '2026-09-01T08:00:00Z',
    adminUsername: 'elena.vance',
    action: 'RELEASE_PUBLISHED',
    targetType: 'Release',
    targetId: 'v12.0.0',
    details: 'Published official v12.0.0 Stable release to 100% rollout tier with signed manifest.',
    ipAddress: '192.168.1.50'
  },
  {
    id: 'AUD_002',
    timestamp: '2026-09-02T11:15:00Z',
    adminUsername: 'marcus.lic',
    action: 'LICENSE_CREATED',
    targetType: 'License',
    targetId: 'LIC_001_ENTP',
    details: 'Provisioned Enterprise license for Apex Global Financial Services (10 devices, Ed25519 signed).',
    ipAddress: '192.168.1.52'
  },
  {
    id: 'AUD_003',
    timestamp: '2026-09-03T14:40:00Z',
    adminUsername: 'marcus.lic',
    action: 'DEVICE_DEACTIVATED',
    targetType: 'Device',
    targetId: 'DEV_005_OLD',
    details: 'Deactivated retired workstation RETIRED-LAPTOP-DELL upon customer request.',
    ipAddress: '192.168.1.52'
  },
  {
    id: 'AUD_004',
    timestamp: '2026-09-04T18:10:00Z',
    adminUsername: 'david.release',
    action: 'SECURITY_HOTFIX_PUBLISHED',
    targetType: 'Release',
    targetId: 'v12.0.1-HOTFIX',
    details: 'Published emergency critical security update v12.0.1-HOTFIX with mandatory policy flag.',
    ipAddress: '192.168.1.55'
  },
  {
    id: 'AUD_005',
    timestamp: '2026-09-05T12:00:00Z',
    adminUsername: 'elena.vance',
    action: 'LICENSE_SUSPENDED',
    targetType: 'License',
    targetId: 'LIC_005_SUSP',
    details: 'Suspended license LIC_005_SUSP due to 45-day overdue billing delinquency.',
    ipAddress: '192.168.1.50'
  }
];

function logCentralAudit(action: string, targetType: CentralAuditLogEntry['targetType'], targetId: string, details: string) {
  centralAuditLogsDb.unshift({
    id: `AUD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    adminUsername: currentAdminUser.username,
    action,
    targetType,
    targetId,
    details,
    ipAddress: '127.0.0.1'
  });
}

// Subscriptions & Billing
export interface SubscriptionRecord {
  id: string;
  customerId: string;
  customerName: string;
  licenseId: string;
  plan: string;
  startDate: string;
  renewalDate: string;
  status: 'Active' | 'PastDue' | 'Suspended';
  billingProvider: string;
  amountUsd: number;
}

const subscriptionsDb: SubscriptionRecord[] = [
  {
    id: 'SUB_001',
    customerId: 'CUST_001',
    customerName: 'Apex Global Financial Services Ltd.',
    licenseId: 'LIC_001_ENTP',
    plan: 'Enterprise Annual (10 Seats)',
    startDate: '2026-01-01T00:00:00Z',
    renewalDate: '2027-01-01T00:00:00Z',
    status: 'Active',
    billingProvider: 'Corporate Invoicing (Net-30)',
    amountUsd: 2999
  },
  {
    id: 'SUB_002',
    customerId: 'CUST_002',
    customerName: 'Metro Freight Logistics International',
    licenseId: 'LIC_002_BIZ',
    plan: 'Business Annual (3 Seats)',
    startDate: '2025-10-01T00:00:00Z',
    renewalDate: '2026-10-01T00:00:00Z',
    status: 'Active',
    billingProvider: 'Stripe Direct Debit',
    amountUsd: 1199
  },
  {
    id: 'SUB_003',
    customerId: 'CUST_003',
    customerName: 'Sterling Consumer Retail Stores Ltd.',
    licenseId: 'LIC_003_PRO',
    plan: 'Professional Annual (1 Seat)',
    startDate: '2025-09-15T00:00:00Z',
    renewalDate: '2026-09-15T00:00:00Z',
    status: 'Active',
    billingProvider: 'Stripe Credit Card',
    amountUsd: 499
  },
  {
    id: 'SUB_005',
    customerId: 'CUST_005',
    customerName: 'Horizon Capital & Advisory Partners',
    licenseId: 'LIC_005_SUSP',
    plan: 'Enterprise Annual',
    startDate: '2025-02-18T00:00:00Z',
    renewalDate: '2026-02-18T00:00:00Z',
    status: 'PastDue',
    billingProvider: 'Corporate Invoicing',
    amountUsd: 2999
  }
];

// ==========================================
// 1. ADMIN AUTHENTICATION & RBAC ENDPOINTS
// ==========================================

centralApiRouter.get('/admin/auth/me', (req, res) => {
  res.json({
    admin: currentAdminUser,
    availableAdmins: adminUsersDb
  });
});

centralApiRouter.post('/admin/auth/switch-user', (req, res) => {
  const { adminId } = req.body;
  const target = adminUsersDb.find(a => a.id === adminId);
  if (target) {
    currentAdminUser = target;
    logCentralAudit('ADMIN_ROLE_SWITCH', 'Security', target.id, `Switched active admin session to ${target.username} (${target.role})`);
    return res.json({ success: true, activeAdmin: currentAdminUser });
  }
  res.status(404).json({ error: 'Admin user not found' });
});

centralApiRouter.post('/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  const admin = adminUsersDb.find(a => a.username === username || a.email === username);
  if (admin) {
    currentAdminUser = admin;
    logCentralAudit('ADMIN_LOGIN_SUCCESS', 'Security', admin.id, `Authenticated via MFA: ${admin.username}`);
    return res.json({
      success: true,
      token: `EXFIN_ADMIN_JWT_${Buffer.from(admin.id + ':' + Date.now()).toString('base64')}`,
      admin
    });
  }
  logCentralAudit('ADMIN_LOGIN_FAILURE', 'Security', 'UNKNOWN', `Failed login attempt for username: ${username}`);
  res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Authentication failed. Please verify credentials and MFA.' });
});

// Outage Simulator toggle
centralApiRouter.post('/admin/simulate-outage', (req, res) => {
  const { mode } = req.body; // 'normal' | 'service_unavailable' | 'rate_limited'
  outageSimulationMode = mode || 'normal';
  logCentralAudit('NETWORK_OUTAGE_SIMULATION_CHANGED', 'Security', 'GATEWAY', `Central Gateway state changed to: ${outageSimulationMode}`);
  res.json({ success: true, currentMode: outageSimulationMode });
});

centralApiRouter.get('/admin/simulate-outage', (req, res) => {
  res.json({ currentMode: outageSimulationMode });
});

// ==========================================
// 2. CUSTOMERS & ORGANIZATIONS ENDPOINTS
// ==========================================

centralApiRouter.get('/customers', (req, res) => {
  const { search, status } = req.query;
  let results = [...customersDb];
  if (status && status !== 'All') {
    results = results.filter(c => c.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(c => c.name.toLowerCase().includes(q) || c.customerCode.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }
  res.json(results);
});

centralApiRouter.post('/customers', (req, res) => {
  const { name, customerCode, email, phone, notes } = req.body;
  if (!name || !customerCode || !email) {
    return res.status(400).json({ error: 'Name, CustomerCode, and Email are required' });
  }
  const newCust: CustomerRecord = {
    id: `CUST_${Date.now().toString().slice(-4)}`,
    customerCode: customerCode.toUpperCase(),
    name,
    email,
    phone: phone || '',
    status: 'Active',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  customersDb.push(newCust);
  logCentralAudit('CUSTOMER_CREATED', 'Customer', newCust.id, `Created customer: ${newCust.name} (${newCust.customerCode})`);
  res.status(201).json(newCust);
});

centralApiRouter.get('/customers/:id', (req, res) => {
  const customer = customersDb.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const orgs = organizationsDb.filter(o => o.customerId === customer.id);
  const licenses = centralLicensesDb.filter(l => l.customerId === customer.id);
  const devices = centralDevicesDb.filter(d => licenses.some(l => l.id === d.licenseId));
  res.json({ customer, organizations: orgs, licenses, devices });
});

centralApiRouter.get('/organizations', (req, res) => {
  const { customerId } = req.query;
  let results = [...organizationsDb];
  if (customerId) {
    results = results.filter(o => o.customerId === customerId);
  }
  res.json(results);
});

centralApiRouter.post('/organizations', (req, res) => {
  const { customerId, name, region } = req.body;
  if (!customerId || !name) {
    return res.status(400).json({ error: 'customerId and name required' });
  }
  const newOrg: OrganizationRecord = {
    id: `ORG_${Date.now().toString().slice(-4)}`,
    customerId,
    name,
    status: 'Active',
    region: region || 'Global',
    createdAt: new Date().toISOString()
  };
  organizationsDb.push(newOrg);
  logCentralAudit('ORGANIZATION_CREATED', 'Customer', newOrg.id, `Created organization ${newOrg.name} under customer ${customerId}`);
  res.status(201).json(newOrg);
});

// ==========================================
// 3. CENTRAL LICENSES ENDPOINTS
// ==========================================

centralApiRouter.get('/licenses', (req, res) => {
  const { status, customerId, edition, search, expiryAlert } = req.query;
  let results = [...centralLicensesDb];

  if (status && status !== 'All') {
    results = results.filter(l => l.status === status);
  }
  if (customerId) {
    results = results.filter(l => l.customerId === customerId);
  }
  if (edition && edition !== 'All') {
    results = results.filter(l => l.editionName === edition);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(l =>
      l.licenseKeyId.toLowerCase().includes(q) ||
      l.customerName.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q)
    );
  }

  // Expiry Alert filters (Requirement 16)
  if (expiryAlert === '30days') {
    const now = Date.now();
    const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
    results = results.filter(l => {
      const exp = new Date(l.expiresAt).getTime();
      return exp > now && exp <= thirtyDays && l.status !== 'Suspended' && l.status !== 'Revoked';
    });
  } else if (expiryAlert === '7days') {
    const now = Date.now();
    const sevenDays = now + 7 * 24 * 60 * 60 * 1000;
    results = results.filter(l => {
      const exp = new Date(l.expiresAt).getTime();
      return exp > now && exp <= sevenDays && l.status !== 'Suspended' && l.status !== 'Revoked';
    });
  } else if (expiryAlert === 'expired') {
    const now = Date.now();
    results = results.filter(l => new Date(l.expiresAt).getTime() <= now || l.status === 'Expired');
  }

  res.json(results);
});

centralApiRouter.get('/licenses/:id', (req, res) => {
  const license = centralLicensesDb.find(l => l.id === req.params.id);
  if (!license) return res.status(404).json({ error: 'License not found' });
  const devices = centralDevicesDb.filter(d => d.licenseId === license.id);
  res.json({ license, devices });
});

// Create License (Requirement 11)
centralApiRouter.post('/licenses', (req, res) => {
  const { customerId, organizationId, productId = 'PROD_TALLY_MAPPER', editionId, startsAt, expiresAt, maxDevices, features } = req.body;
  const customer = customersDb.find(c => c.id === customerId);
  if (!customer) return res.status(400).json({ error: 'Valid customerId is required' });

  const edition = editionsDb.find(e => e.id === editionId) || editionsDb[3];
  const licenseId = `LIC_${Date.now().toString().slice(-4)}_${edition.name.substring(0, 4).toUpperCase()}`;
  const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  const licenseKeyId = `EXFIN-${edition.name.substring(0, 4).toUpperCase()}-${randomHex.substring(0, 4)}-${randomHex.substring(4, 8)}-SIGNED-ED25519`;

  const newLicense: CentralLicenseRecord = {
    id: licenseId,
    licenseKeyId,
    customerId: customer.id,
    customerName: customer.name,
    organizationId: organizationId || (organizationsDb.find(o => o.customerId === customer.id)?.id || 'ORG_DEFAULT'),
    productId,
    editionId: edition.id,
    editionName: edition.name,
    status: 'Active',
    issuedAt: new Date().toISOString(),
    startsAt: startsAt || new Date().toISOString(),
    expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    maxDevices: maxDevices || edition.maxDevices,
    entitledFeatures: features && Array.isArray(features) ? features : [...edition.features],
    signature: '',
    publicKeyFingerprint: SERVER_PUBLIC_VERIFICATION_KEY_FP,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  newLicense.signature = generateSignedLicenseToken(newLicense);
  centralLicensesDb.unshift(newLicense);

  logCentralAudit('LICENSE_ISSUED', 'License', newLicense.id, `Issued ${newLicense.editionName} license for ${customer.name} (Devices: ${newLicense.maxDevices})`);
  res.status(201).json(newLicense);
});

// Suspend License (Requirement 13)
centralApiRouter.post('/licenses/:id/suspend', (req, res) => {
  const license = centralLicensesDb.find(l => l.id === req.params.id);
  if (!license) return res.status(404).json({ error: 'License not found' });
  const { reason = 'Administrative suspension' } = req.body;

  license.status = 'Suspended';
  license.revocationReason = reason;
  license.updatedAt = new Date().toISOString();

  logCentralAudit('LICENSE_SUSPENDED', 'License', license.id, `Suspended license: ${license.licenseKeyId}. Reason: ${reason}`);
  res.json({
    success: true,
    message: `License ${license.id} suspended. Online client heartbeats and activations will be rejected.`,
    license
  });
});

// Revoke License (Requirement 13)
centralApiRouter.post('/licenses/:id/revoke', (req, res) => {
  const license = centralLicensesDb.find(l => l.id === req.params.id);
  if (!license) return res.status(404).json({ error: 'License not found' });
  const { reason = 'Revoked by licensing authority' } = req.body;

  license.status = 'Revoked';
  license.revocationReason = reason;
  license.updatedAt = new Date().toISOString();

  logCentralAudit('LICENSE_REVOKED', 'License', license.id, `PERMANENT REVOCATION of license: ${license.licenseKeyId}. Reason: ${reason}`);
  res.json({
    success: true,
    consequences: 'All associated device activations terminated. Future verification and update requests will be denied.',
    license
  });
});

// Reactivate License (Requirement 13)
centralApiRouter.post('/licenses/:id/reactivate', (req, res) => {
  const license = centralLicensesDb.find(l => l.id === req.params.id);
  if (!license) return res.status(404).json({ error: 'License not found' });

  license.status = 'Active';
  delete license.revocationReason;
  license.updatedAt = new Date().toISOString();

  logCentralAudit('LICENSE_REACTIVATED', 'License', license.id, `Reactivated license: ${license.licenseKeyId}`);
  res.json({ success: true, message: `License ${license.id} restored to Active status.`, license });
});

// Generate Offline License File (Requirement 22)
centralApiRouter.post('/licenses/:id/export-offline', (req, res) => {
  const license = centralLicensesDb.find(l => l.id === req.params.id);
  if (!license) return res.status(404).json({ error: 'License not found' });

  const offlinePayload = {
    licenseFormat: 'EXFIN_OFFLINE_ED25519_V1',
    licenseId: license.id,
    licenseKeyId: license.licenseKeyId,
    customer: license.customerName,
    edition: license.editionName,
    startsAt: license.startsAt,
    expiresAt: license.expiresAt,
    maxDevices: license.maxDevices,
    entitledFeatures: license.entitledFeatures,
    serverTimestamp: new Date().toISOString(),
    signature: license.signature,
    publicKeyFingerprint: license.publicKeyFingerprint,
    complianceNotice: 'Offline installations cannot receive instantaneous revocation updates until next online reconciliation or key expiry.'
  };

  logCentralAudit('OFFLINE_LICENSE_EXPORTED', 'License', license.id, `Generated signed offline .exfinlic file for ${license.customerName}`);
  res.json({
    filename: `EXFIN_${license.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${license.id}.exfinlic`,
    fileContent: JSON.stringify(offlinePayload, null, 2)
  });
});

// ==========================================
// 4. DESKTOP VERIFICATION & CLIENT ENDPOINTS
// ==========================================

// Validate License Request from Desktop
centralApiRouter.post('/licenses/validate', (req, res) => {
  const { licenseKeyId, deviceFingerprint, appVersion } = req.body;
  if (!licenseKeyId || !deviceFingerprint) {
    return res.status(400).json({ error: 'licenseKeyId and deviceFingerprint are required' });
  }

  const license = centralLicensesDb.find(l => l.licenseKeyId.trim() === licenseKeyId.trim());
  if (!license) {
    return res.status(404).json({
      valid: false,
      error: 'LICENSE_NOT_FOUND',
      message: 'The requested license key does not exist on EXFIN Central Licensing Gateway.'
    });
  }

  if (license.status === 'Suspended') {
    return res.status(403).json({
      valid: false,
      error: 'LICENSE_SUSPENDED',
      message: `License is suspended: ${license.revocationReason || 'Contact support'}`
    });
  }

  if (license.status === 'Revoked') {
    return res.status(403).json({
      valid: false,
      error: 'LICENSE_REVOKED',
      message: `License has been revoked: ${license.revocationReason || 'Terminated'}`
    });
  }

  const now = Date.now();
  const exp = new Date(license.expiresAt).getTime();
  if (exp <= now) {
    return res.status(403).json({
      valid: false,
      error: 'LICENSE_EXPIRED',
      message: 'This commercial subscription has expired. Please renew.'
    });
  }

  // Check device registration
  let device = centralDevicesDb.find(d => d.licenseId === license.id && d.deviceFingerprint === deviceFingerprint);
  const activeDeviceCount = centralDevicesDb.filter(d => d.licenseId === license.id && d.status === 'Active').length;

  if (!device) {
    // Attempt auto-registration if within limit
    if (activeDeviceCount >= license.maxDevices) {
      return res.status(403).json({
        valid: false,
        error: 'MAX_DEVICES_EXCEEDED',
        message: `Active device limit (${license.maxDevices}) reached for this license. Deactivate an older device first.`
      });
    }

    device = {
      id: `DEV_${Date.now().toString().slice(-4)}`,
      licenseId: license.id,
      customerName: license.customerName,
      deviceFingerprint,
      friendlyName: req.body.friendlyName || 'Workstation',
      platform: req.body.platform || 'Windows 11 x64',
      applicationVersion: appVersion || '12.0.0',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: 'Active'
    };
    centralDevicesDb.push(device);
    logCentralAudit('DEVICE_AUTO_REGISTERED', 'Device', device.id, `Device ${device.friendlyName} registered to license ${license.id}`);
  } else {
    device.lastSeen = new Date().toISOString();
    device.applicationVersion = appVersion || device.applicationVersion;
  }

  res.json({
    valid: true,
    serverTime: new Date().toISOString(),
    license: {
      licenseId: license.id,
      licenseKeyId: license.licenseKeyId,
      customer: license.customerName,
      edition: license.editionName,
      status: license.status,
      expiresAt: license.expiresAt,
      maxDevices: license.maxDevices,
      activeDevices: centralDevicesDb.filter(d => d.licenseId === license.id && d.status === 'Active').length,
      features: license.entitledFeatures,
      signature: license.signature,
      publicKeyFingerprint: license.publicKeyFingerprint
    }
  });
});

// Refresh License Entitlement (Requirement 29)
centralApiRouter.post('/licenses/refresh', (req, res) => {
  const { licenseId, licenseKeyId } = req.body;
  const license = centralLicensesDb.find(l => l.id === licenseId || l.licenseKeyId === licenseKeyId);
  if (!license) return res.status(404).json({ error: 'License record not found' });

  // Re-sign in case features changed
  license.signature = generateSignedLicenseToken(license);

  res.json({
    refreshed: true,
    serverTime: new Date().toISOString(),
    license: {
      licenseId: license.id,
      customer: license.customerName,
      edition: license.editionName,
      status: license.status,
      expiresAt: license.expiresAt,
      maxDevices: license.maxDevices,
      features: license.entitledFeatures,
      signature: license.signature,
      publicKeyFingerprint: license.publicKeyFingerprint
    }
  });
});

// ==========================================
// 5. DEVICE FLEET MANAGEMENT
// ==========================================

centralApiRouter.get('/devices', (req, res) => {
  const { licenseId, status } = req.query;
  let results = [...centralDevicesDb];
  if (licenseId) {
    results = results.filter(d => d.licenseId === licenseId);
  }
  if (status && status !== 'All') {
    results = results.filter(d => d.status === status);
  }
  res.json(results);
});

// Deactivate Device (Requirement 20)
centralApiRouter.post('/devices/deactivate', (req, res) => {
  const { deviceId, deviceFingerprint, licenseId } = req.body;
  const device = centralDevicesDb.find(d =>
    (deviceId && d.id === deviceId) ||
    (deviceFingerprint && d.deviceFingerprint === deviceFingerprint && (!licenseId || d.licenseId === licenseId))
  );

  if (!device) return res.status(404).json({ error: 'Device not found' });

  device.status = 'Deactivated';
  device.lastSeen = new Date().toISOString();

  logCentralAudit('DEVICE_DEACTIVATED', 'Device', device.id, `Deactivated device: ${device.friendlyName} (${device.deviceFingerprint})`);
  res.json({ success: true, message: `Device '${device.friendlyName}' deactivated successfully.`, device });
});

// ==========================================
// 6. PRODUCTS, EDITIONS & FEATURE MATRIX
// ==========================================

centralApiRouter.get('/products', (req, res) => {
  res.json([
    {
      id: 'PROD_TALLY_MAPPER',
      name: 'EXFIN Tally Data Mapper',
      versionPolicy: 'SemVer 2.0.0',
      status: 'Active',
      description: 'Production TallyPrime schema discovery, relational transformation, and automated reporting system.'
    }
  ]);
});

centralApiRouter.get('/features', (req, res) => {
  res.json(featuresCatalogDb);
});

centralApiRouter.get('/editions', (req, res) => {
  res.json(editionsDb);
});

// Update Edition Feature Matrix (Requirement 28)
centralApiRouter.put('/editions/:id/features', (req, res) => {
  const edition = editionsDb.find(e => e.id === req.params.id);
  if (!edition) return res.status(404).json({ error: 'Edition not found' });
  const { features } = req.body;
  if (!Array.isArray(features)) return res.status(400).json({ error: 'features array required' });

  edition.features = features;
  logCentralAudit('EDITION_FEATURES_MODIFIED', 'Security', edition.id, `Updated feature entitlements for edition: ${edition.name}`);
  res.json({ success: true, edition });
});

// ==========================================
// 7. RELEASES & UPDATE MANIFEST
// ==========================================

centralApiRouter.get('/releases', (req, res) => {
  res.json(releasesDb);
});

centralApiRouter.post('/releases', (req, res) => {
  const { version, channel = 'Stable', minimumVersion = '11.0.0', releaseNotes, stagedRolloutPercent = 100, isCriticalSecurityUpdate = false } = req.body;
  if (!version) return res.status(400).json({ error: 'version is required' });

  const newRelease: ReleaseRecord = {
    version,
    channel,
    releaseDate: new Date().toISOString(),
    minimumVersion,
    downloadReference: `https://releases.exfin.com/packages/EXFIN_TallyMapper_v${version}_x64.exe`,
    packageSha256: crypto.createHash('sha256').update(version + Date.now()).digest('hex'),
    signature: `SIG-ED25519-REL-${version}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    stagedRolloutPercent: Number(stagedRolloutPercent) || 100,
    isCriticalSecurityUpdate: !!isCriticalSecurityUpdate,
    isPublished: true,
    releaseNotes: releaseNotes || {
      whatsNew: ['General stability enhancements and performance updates.'],
      bugFixes: ['Addressed minor schema indexing edge case.'],
      security: ['Upgraded internal TLS crypto validation.'],
      compatibility: 'TallyPrime 2.x, 3.x, and 4.x.',
      migrationNotes: 'Automatic migration upon launch.'
    }
  };

  releasesDb.unshift(newRelease);
  logCentralAudit('RELEASE_CREATED', 'Release', newRelease.version, `Created and published release ${newRelease.version} (${newRelease.channel}, Rollout: ${newRelease.stagedRolloutPercent}%)`);
  res.status(201).json(newRelease);
});

// Check for updates (Requirement 48 & 91)
centralApiRouter.get('/releases/check-update', (req, res) => {
  const { channel = 'Stable', currentVersion = '12.0.0' } = req.query;
  const channelMatches = releasesDb.filter(r => r.isPublished && (channel === 'Developer' ? true : channel === 'Beta' ? r.channel !== 'Developer' : r.channel === 'Stable'));

  const latest = channelMatches[0];
  const updateAvailable = latest && latest.version !== currentVersion;

  res.json({
    updateAvailable,
    currentVersion,
    latestRelease: latest || null,
    serverTime: new Date().toISOString()
  });
});

// ==========================================
// 8. HEALTH TELEMETRY & MONITORING
// ==========================================

// STRICT PRIVACY PROTECTION: Reject any payload containing financial keywords!
centralApiRouter.post('/health/heartbeat', (req, res) => {
  const payload = req.body;
  const serialized = JSON.stringify(payload).toLowerCase();

  // Audit against accidental financial data leakage (Requirement 37 & 38)
  const forbiddenFinancialKeywords = ['voucher', 'ledger_balance', 'gstin_number', 'bank_account', 'debit_amount', 'credit_amount', 'pan_card'];
  for (const kw of forbiddenFinancialKeywords) {
    if (serialized.includes(kw)) {
      logCentralAudit('PRIVACY_VIOLATION_BLOCKED', 'Security', 'HEARTBEAT', `Rejected heartbeat containing financial keyword: '${kw}'.`);
      return res.status(400).json({
        error: 'PRIVACY_VIOLATION',
        message: 'Central telemetry rejects payloads containing financial ledgers, vouchers, or transactional details.'
      });
    }
  }

  const { licenseId, deviceFingerprint, applicationVersion, osVersion, tallyVersion, connectionStatus, lastErrorCategory } = payload;

  let existing = healthTelemetryDb.find(h => h.deviceFingerprint === deviceFingerprint);
  if (!existing) {
    existing = {
      id: `HLT_${Date.now().toString().slice(-4)}`,
      licenseId: licenseId || 'UNKNOWN',
      customerName: payload.customerName || 'Workstation Node',
      deviceFingerprint: deviceFingerprint || `FPR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      applicationVersion: applicationVersion || '12.0.0',
      osVersion: osVersion || 'Windows 11 x64',
      tallyVersion: tallyVersion || 'TallyPrime 4.x',
      connectionStatus: connectionStatus || 'Connected (Read-Only)',
      lastSuccessfulReportExecution: new Date().toISOString(),
      lastErrorCategory: lastErrorCategory || 'None',
      status: 'Healthy',
      lastSeenAt: new Date().toISOString(),
      averageReportLatencyMs: Math.floor(Math.random() * 80) + 120
    };
    healthTelemetryDb.push(existing);
  } else {
    existing.lastSeenAt = new Date().toISOString();
    existing.applicationVersion = applicationVersion || existing.applicationVersion;
    existing.connectionStatus = connectionStatus || existing.connectionStatus;
    existing.lastErrorCategory = lastErrorCategory || existing.lastErrorCategory;
    existing.status = connectionStatus === 'Tally Offline' ? 'Warning' : 'Healthy';
  }

  res.json({
    acknowledged: true,
    serverTime: new Date().toISOString()
  });
});

centralApiRouter.get('/health/dashboard', (req, res) => {
  const total = healthTelemetryDb.length;
  const healthy = healthTelemetryDb.filter(h => h.status === 'Healthy').length;
  const warning = healthTelemetryDb.filter(h => h.status === 'Warning').length;
  const offline = healthTelemetryDb.filter(h => h.status === 'Offline').length;
  const error = healthTelemetryDb.filter(h => h.status === 'Error').length;

  // Version distribution
  const versionMap: Record<string, number> = {};
  healthTelemetryDb.forEach(h => {
    versionMap[h.applicationVersion] = (versionMap[h.applicationVersion] || 0) + 1;
  });

  res.json({
    summary: { total, healthy, warning, offline, error },
    versionDistribution: Object.entries(versionMap).map(([version, count]) => ({ version, count })),
    fleet: healthTelemetryDb
  });
});

// ==========================================
// 9. SUPPORT TICKETS
// ==========================================

centralApiRouter.get('/support/tickets', (req, res) => {
  const { customerId, status } = req.query;
  let results = [...supportTicketsDb];
  if (customerId) results = results.filter(t => t.customerId === customerId);
  if (status && status !== 'All') results = results.filter(t => t.status === status);
  res.json(results);
});

centralApiRouter.post('/support/tickets', (req, res) => {
  const { customerId, subject, description, priority = 'Medium', diagnosticsAttached, sanitizedDiagnosticsSummary } = req.body;
  if (!customerId || !subject || !description) {
    return res.status(400).json({ error: 'customerId, subject, and description are required' });
  }

  const customer = customersDb.find(c => c.id === customerId);
  const newTicket: SupportTicketRecord = {
    id: `TICK_${Date.now().toString().slice(-4)}`,
    customerId,
    customerName: customer ? customer.name : 'Unknown Customer',
    licenseId: req.body.licenseId || 'N/A',
    subject,
    description,
    status: 'Open',
    priority,
    diagnosticsAttached: !!diagnosticsAttached,
    sanitizedDiagnosticsSummary: sanitizedDiagnosticsSummary || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  supportTicketsDb.unshift(newTicket);
  logCentralAudit('SUPPORT_TICKET_SUBMITTED', 'Support', newTicket.id, `Ticket '${newTicket.subject}' submitted by ${newTicket.customerName}`);
  res.status(201).json(newTicket);
});

centralApiRouter.put('/support/tickets/:id/status', (req, res) => {
  const ticket = supportTicketsDb.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const { status } = req.body;

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  logCentralAudit('SUPPORT_TICKET_UPDATED', 'Support', ticket.id, `Status set to ${status}`);
  res.json({ success: true, ticket });
});

// ==========================================
// 10. CENTRAL AUDIT LOGS & BILLING
// ==========================================

centralApiRouter.get('/admin/audit', (req, res) => {
  const { targetType, search } = req.query;
  let results = [...centralAuditLogsDb];
  if (targetType && targetType !== 'All') {
    results = results.filter(a => a.targetType === targetType);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(a =>
      a.action.toLowerCase().includes(q) ||
      a.details.toLowerCase().includes(q) ||
      a.adminUsername.toLowerCase().includes(q)
    );
  }
  res.json(results);
});

centralApiRouter.get('/subscriptions', (req, res) => {
  res.json(subscriptionsDb);
});

// ==========================================
// 11. CENTRAL ANALYTICS STATS (Requirement 88)
// ==========================================

centralApiRouter.get('/admin/stats', (req, res) => {
  const totalLicenses = centralLicensesDb.length;
  const activeLicenses = centralLicensesDb.filter(l => l.status === 'Active').length;
  const expiringLicenses = centralLicensesDb.filter(l => {
    const now = Date.now();
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp <= now + 30 * 24 * 60 * 60 * 1000 && l.status === 'Active';
  }).length;
  const expiredLicenses = centralLicensesDb.filter(l => l.status === 'Expired' || new Date(l.expiresAt).getTime() <= Date.now()).length;
  const suspendedLicenses = centralLicensesDb.filter(l => l.status === 'Suspended').length;

  const totalDevices = centralDevicesDb.length;
  const activeDevices = centralDevicesDb.filter(d => d.status === 'Active').length;

  const healthTotal = healthTelemetryDb.length;
  const healthyCount = healthTelemetryDb.filter(h => h.status === 'Healthy').length;
  const warningCount = healthTelemetryDb.filter(h => h.status === 'Warning').length;
  const offlineCount = healthTelemetryDb.filter(h => h.status === 'Offline').length;

  res.json({
    licenses: {
      total: totalLicenses,
      active: activeLicenses,
      expiring: expiringLicenses,
      expired: expiredLicenses,
      suspended: suspendedLicenses
    },
    devices: {
      total: totalDevices,
      active: activeDevices
    },
    health: {
      total: healthTotal,
      healthy: healthyCount,
      warning: warningCount,
      offline: offlineCount
    },
    customersCount: customersDb.length,
    openTicketsCount: supportTicketsDb.filter(t => t.status === 'Open' || t.status === 'InProgress').length
  });
});

// ==========================================
// 12. OPENAPI 3.0 SPECIFICATION (Requirement 94)
// ==========================================

centralApiRouter.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'EXFIN Central Licensing & Administration API',
      version: '1.0.0',
      description: 'Versioned REST API for commercial customer management, asymmetric license issuance, hardware device activation, signed update releases, and sanitized health telemetry.'
    },
    servers: [{ url: '/api/v1', description: 'Central Administration Gateway' }],
    paths: {
      '/licenses/validate': {
        post: {
          summary: 'Validate license and hardware activation',
          description: 'Client desktop verifies license state and hardware binding without transmitting private keys.'
        }
      },
      '/licenses/refresh': {
        post: {
          summary: 'Refresh license entitlement payload',
          description: 'Refreshes entitled features and expiry dates with digital signature verification.'
        }
      },
      '/health/heartbeat': {
        post: {
          summary: 'Send low-frequency technical health telemetry',
          description: 'Strictly restricted to technical diagnostics. Financial vouchers and ledgers are prohibited.'
        }
      },
      '/releases/check-update': {
        get: {
          summary: 'Query update manifest by release channel and staged rollout percent'
        }
      },
      '/devices/deactivate': {
        post: {
          summary: 'Deactivate registered device slot'
        }
      }
    }
  });
});
