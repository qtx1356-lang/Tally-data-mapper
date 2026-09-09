import { Router } from "express";
import { 
  RegisteredCompany, 
  CompanyGroup, 
  ConsolidationProfile, 
  GroupKpi, 
  ConsolidatedReportLine,
  EliminationEntry
} from "../types/phase32XConsolidation";

export const phase32xRouter = Router();

// Mock Data
const MOCK_COMPANIES: RegisteredCompany[] = [
  {
    companyId: 'comp_001',
    companyName: 'EXFIN Global - US',
    tallyVersion: 'TallyPrime 4.0',
    connection: 'Direct',
    mappingVersion: 'v1.4',
    schemaVersion: 's_09',
    status: 'CONNECTED',
    baseCurrency: 'USD',
    fiscalYearStart: '2026-01-01',
    lastRefresh: new Date().toISOString(),
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    companyId: 'comp_002',
    companyName: 'EXFIN Europe - UK',
    tallyVersion: 'TallyPrime 3.0',
    connection: 'Gateway',
    mappingVersion: 'v1.4',
    schemaVersion: 's_09',
    status: 'CONNECTED',
    baseCurrency: 'GBP',
    fiscalYearStart: '2026-04-01',
    lastRefresh: new Date().toISOString(),
    createdAt: '2023-02-15T00:00:00Z'
  },
  {
    companyId: 'comp_003',
    companyName: 'EXFIN APAC - SG',
    tallyVersion: 'TallyPrime 4.0',
    connection: 'Direct',
    mappingVersion: 'v1.2',
    schemaVersion: 's_08',
    status: 'MAPPING_REQUIRED',
    baseCurrency: 'SGD',
    fiscalYearStart: '2026-01-01',
    lastRefresh: new Date().toISOString(),
    createdAt: '2024-01-10T00:00:00Z'
  }
];

const MOCK_GROUPS: CompanyGroup[] = [
  {
    groupId: 'grp_01',
    name: 'EXFIN Global Consolidated',
    description: 'Worldwide management reporting group',
    companies: ['comp_001', 'comp_002', 'comp_003'],
    baseCurrency: 'USD',
    fiscalYear: 'CY2026',
    status: 'ACTIVE',
    createdBy: 'admin_1',
    createdAt: '2025-01-01T00:00:00Z',
    version: '1.0'
  }
];

const MOCK_KPIS: GroupKpi[] = [
  {
    id: 'kpi_rev',
    name: 'Consolidated Revenue',
    value: 12500000.00,
    currency: 'USD',
    companiesIncluded: 2,
    companiesExcluded: 1,
    dataStatus: 'INCOMPLETE' // because comp_003 is mapping_required
  },
  {
    id: 'kpi_prof',
    name: 'Net Profit',
    value: 3450000.00,
    currency: 'USD',
    companiesIncluded: 2,
    companiesExcluded: 1,
    dataStatus: 'INCOMPLETE'
  },
  {
    id: 'kpi_ar',
    name: 'Accounts Receivable',
    value: 1850000.00,
    currency: 'USD',
    companiesIncluded: 2,
    companiesExcluded: 1,
    dataStatus: 'INCOMPLETE'
  }
];

const MOCK_ELIMINATIONS: EliminationEntry[] = [
  {
    eliminationId: 'elim_01',
    groupId: 'grp_01',
    type: 'Inter-company Sales',
    sourceCompanyId: 'comp_001',
    sourceTransaction: 'VCH-10045',
    targetCompanyId: 'comp_002',
    targetTransaction: 'PUR-9901',
    ruleId: 'rule_ic_sales',
    eliminatedAmount: 150000,
    status: 'PROPOSED',
    matchConfidence: 'HIGH'
  }
];

const MOCK_REPORT_LINES: ConsolidatedReportLine[] = [
  {
    groupAccount: 'GROUP_REVENUE',
    companyId: 'comp_001',
    companyName: 'EXFIN Global - US',
    originalCurrency: 'USD',
    exchangeRate: 1.0,
    debit: 0,
    credit: 8000000,
    adjustedDebit: 0,
    adjustedCredit: 7850000, // 150k elimination
    isEliminated: true
  },
  {
    groupAccount: 'GROUP_REVENUE',
    companyId: 'comp_002',
    companyName: 'EXFIN Europe - UK',
    originalCurrency: 'GBP',
    exchangeRate: 1.25,
    debit: 0,
    credit: 3600000, // 4.5M USD
    adjustedDebit: 0,
    adjustedCredit: 4500000, 
    isEliminated: false
  }
];

phase32xRouter.get("/companies", (req, res) => {
  res.json(MOCK_COMPANIES);
});

phase32xRouter.get("/groups", (req, res) => {
  res.json(MOCK_GROUPS);
});

phase32xRouter.get("/dashboard/kpis", (req, res) => {
  res.json(MOCK_KPIS);
});

phase32xRouter.get("/eliminations", (req, res) => {
  res.json(MOCK_ELIMINATIONS);
});

phase32xRouter.get("/reports/trial-balance", (req, res) => {
  res.json(MOCK_REPORT_LINES);
});
