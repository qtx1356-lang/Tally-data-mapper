/**
 * Phase 32Y: API Integration Gateway Types
 */

export type CredentialStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'DISABLED';

export type ApiScope = 
  | 'company:read' 
  | 'ledger:read' 
  | 'group:read' 
  | 'voucher:read' 
  | 'inventory:read' 
  | 'sales:read' 
  | 'purchase:read' 
  | 'receivable:read' 
  | 'payable:read' 
  | 'report:read' 
  | 'dashboard:read' 
  | 'analytics:read' 
  | 'exception:read' 
  | 'reconciliation:read' 
  | 'consolidation:read' 
  | 'export:create';

export interface ApiCredential {
  credentialId: string;
  name: string;
  owner: string;
  workspaceId: string;
  scopes: ApiScope[];
  allowedCompanies: string[]; // '*' for all or specific IDs
  status: CredentialStatus;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  maskedKey: string; // e.g. "sk-exfin-...a1b2"
}

export type WebhookEvent = 
  | 'company.status_changed'
  | 'mapping.changed'
  | 'schema.changed'
  | 'report.completed'
  | 'analysis.completed'
  | 'exception.created'
  | 'exception.resolved'
  | 'reconciliation.failed'
  | 'automation.failed'
  | 'snapshot.created';

export interface WebhookSubscription {
  webhookId: string;
  url: string;
  events: WebhookEvent[];
  status: 'ACTIVE' | 'DISABLED' | 'FAILING';
  secretMasked: string; // "****"
  createdAt: string;
  lastFiredAt: string | null;
  failureCount: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  correlationId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  columns?: any[];
  metadata?: any;
  warnings?: string[];
  lineage?: any;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    cursor?: string;
  };
  status: 'LIVE' | 'CACHED' | 'SNAPSHOT';
  error?: ApiError;
}

export interface ApiGatewayMetrics {
  totalRequests24h: number;
  errorRate: number;
  avgLatencyMs: number;
  rateLimitEvents: number;
  activeTokens: number;
}
