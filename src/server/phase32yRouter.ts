import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { 
  ApiCredential, 
  WebhookSubscription, 
  ApiGatewayMetrics,
  ApiResponse,
  ApiError
} from "../types/phase32YApiGateway";

export const phase32yRouter = Router();

// Mock Internal State
const MOCK_CREDENTIALS: ApiCredential[] = [
  {
    credentialId: 'cred_8f9a2b',
    name: 'BI Dashboard Sync',
    owner: 'admin_1',
    workspaceId: 'ws_exfin_main',
    scopes: ['company:read', 'ledger:read', 'report:read', 'consolidation:read'],
    allowedCompanies: ['comp_001', 'comp_002'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    maskedKey: 'sk_exfin_...a8b9'
  },
  {
    credentialId: 'cred_2c4d6e',
    name: 'External ERP Integration',
    owner: 'admin_2',
    workspaceId: 'ws_exfin_main',
    scopes: ['voucher:read', 'inventory:read', 'sales:read', 'purchase:read'],
    allowedCompanies: ['*'],
    status: 'REVOKED',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    lastUsedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    maskedKey: 'sk_exfin_...c3d4'
  }
];

const MOCK_WEBHOOKS: WebhookSubscription[] = [
  {
    webhookId: 'wh_91k2j',
    url: 'https://api.external-bi.com/tally-hooks',
    events: ['schema.changed', 'report.completed'],
    status: 'ACTIVE',
    secretMasked: '****',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastFiredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    failureCount: 0
  }
];

const MOCK_METRICS: ApiGatewayMetrics = {
  totalRequests24h: 14520,
  errorRate: 0.04, // 4%
  avgLatencyMs: 145,
  rateLimitEvents: 32,
  activeTokens: 1
};

// Internal Management Routes (for the UI)
phase32yRouter.get("/management/keys", (req, res) => {
  res.json(MOCK_CREDENTIALS);
});

phase32yRouter.get("/management/webhooks", (req, res) => {
  res.json(MOCK_WEBHOOKS);
});

phase32yRouter.get("/management/metrics", (req, res) => {
  res.json(MOCK_METRICS);
});

// Mock External API Gateway Routes (Simulating external access)
// In a real app, these would have a strict API key authentication middleware

phase32yRouter.get("/v1/health", (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

phase32yRouter.post("/v1/query", (req, res) => {
  const correlationId = `req_${uuidv4().substring(0, 8)}`;
  
  // Validate no SQL injection is possible by strictly requiring semantic dataset names
  const { dataset, fields } = req.body;
  
  if (!dataset || !['ledgers', 'vouchers', 'inventory', 'sales'].includes(dataset)) {
    const error: ApiError = {
      code: 'INVALID_DATASET',
      message: 'The requested dataset is not recognized or permitted.',
      correlationId
    };
    return res.status(400).json({ success: false, status: 'LIVE', error });
  }

  // Simulate semantic query resolving
  const mockResponse: ApiResponse<any[]> = {
    success: true,
    data: [
      { id: '1', semantic_value: 1500.00, company_ref: 'comp_001' }
    ],
    metadata: {
      datasetRequested: dataset,
      fieldsResolved: fields
    },
    lineage: {
      source: 'Tally_Direct_Extract'
    },
    status: 'CACHED'
  };

  res.json(mockResponse);
});

phase32yRouter.get("/v1/companies", (req, res) => {
  const correlationId = `req_${uuidv4().substring(0, 8)}`;
  const mockResponse: ApiResponse<any[]> = {
    success: true,
    data: [
      { id: 'comp_001', name: 'EXFIN Global - US' },
      { id: 'comp_002', name: 'EXFIN Europe - UK' }
    ],
    status: 'LIVE'
  };
  res.json(mockResponse);
});
