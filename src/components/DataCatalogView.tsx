import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Radio,
  BarChart3,
  Bot,
  Brain,
  Package,
  Users,
  Percent,
  FolderTree,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Tag,
  GitBranch,
  RefreshCw,
  Sliders,
  Play,
  Key,
  Link,
  Plus,
  ArrowLeftRight,
  FileCode,
  Archive,
  Compass,
  Boxes,
  Zap
} from 'lucide-react';
import { Phase32CDomainsView } from './Phase32CDomainsView';
import { Phase32DWarehouseView } from './Phase32DWarehouseView';
import { Phase32ESyncCenterView } from './Phase32ESyncCenterView';
import { Phase32FDataQualityCenterView } from './Phase32FDataQualityCenterView';
import { Phase32GUnifiedQueryCenterView } from './Phase32GUnifiedQueryCenterView';
import {
  DatasetMetadata,
  DatasetCategory,
  DatasetStatus,
  SchemaRegistryItem,
  SchemaFieldDefinition,
  SchemaRelationshipDefinition,
  SchemaStatus,
  SchemaComparisonResult,
  FieldCatalogItem,
  CanonicalRecord,
  RawSourceMetadata,
  CanonicalGroup,
  CanonicalLedger,
  CanonicalParty,
  CanonicalVoucher,
  CanonicalVoucherLine,
  HierarchyIntegrityIssue,
  DatasetNormalizationState
} from '../types/phase32UniversalModel';

type CatalogTab =
  | 'Unified Query Engine (Phase 32G)'
  | 'Data Quality & Validation (Phase 32F)'
  | 'Sync Center (Phase 32E)'
  | 'Analytical Warehouse (Phase 32D)'
  | 'Datasets'
  | 'Extended Domains (Phase 32C)'
  | 'Field Catalog'
  | 'Canonical Masters & Vouchers'
  | 'Hierarchy & Integrity Engine'
  | 'Schema Registry'
  | 'Schema Comparator'
  | 'Record Inspector'
  | 'Raw Metadata Layer';

export const DataCatalogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogTab>('Datasets');
  const [companyId, setCompanyId] = useState<string>('CMP-001');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core Data
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetMetadata | null>(null);
  const [activeSchema, setActiveSchema] = useState<SchemaRegistryItem | null>(null);
  const [schemas, setSchemas] = useState<SchemaRegistryItem[]>([]);
  const [fieldCatalog, setFieldCatalog] = useState<FieldCatalogItem[]>([]);
  const [canonicalRecords, setCanonicalRecords] = useState<CanonicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CanonicalRecord | null>(null);

  // Phase 32B Canonical Entities State
  const [canonicalGroups, setCanonicalGroups] = useState<CanonicalGroup[]>([]);
  const [canonicalLedgers, setCanonicalLedgers] = useState<CanonicalLedger[]>([]);
  const [canonicalParties, setCanonicalParties] = useState<CanonicalParty[]>([]);
  const [canonicalVouchers, setCanonicalVouchers] = useState<CanonicalVoucher[]>([]);
  const [canonicalVoucherLines, setCanonicalVoucherLines] = useState<CanonicalVoucherLine[]>([]);
  const [hierarchyIssues, setHierarchyIssues] = useState<HierarchyIntegrityIssue[]>([]);
  const [normalizationStates, setNormalizationStates] = useState<Record<string, DatasetNormalizationState>>({});
  const [activeCanonicalSubTab, setActiveCanonicalSubTab] = useState<'Groups' | 'Ledgers' | 'Parties' | 'Vouchers' | 'Voucher Lines'>('Groups');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [isSyncingGraph, setIsSyncingGraph] = useState<boolean>(false);
  const [canonicalSearchTerm, setCanonicalSearchTerm] = useState<string>('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [datasetSearchTerm, setDatasetSearchTerm] = useState<string>('');
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>('');
  const [schemaDatasetFilter, setSchemaDatasetFilter] = useState<string>('All');

  // Schema Comparator State
  const [compareSchemaAId, setCompareSchemaAId] = useState<string>('');
  const [compareSchemaBId, setCompareSchemaBId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<SchemaComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Propose Schema Modal / State
  const [isProposeModalOpen, setIsProposeModalOpen] = useState<boolean>(false);
  const [proposeDatasetId, setProposeDatasetId] = useState<string>('ds-ledgers');
  const [proposeGrain, setProposeGrain] = useState<string>('Ledger');
  const [proposeFieldCount, setProposeFieldCount] = useState<number>(7);

  // Ingestion Simulator State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [ingestPayloadText, setIngestPayloadText] = useState<string>(
    JSON.stringify(
      {
        ledgerId: 'LED-CUSTOM-NEW-01',
        name: 'Nexus Tech Global Ltd',
        parentGroup: 'Sundry Debtors',
        openingBalance: 150000,
        closingBalance: 720000,
        // Unknown source fields to test controlled preservation:
        NATIVE_ERP_TENANT_KEY: 'TN-9921',
        CUSTOM_PAN_NUMBER: 'AAACN9921L',
        CREDIT_SCORE_EXTERNAL: 820,
        RISK_CATEGORY_FLAG: 'LOW'
      },
      null,
      2
    )
  );

  useEffect(() => {
    fetchInitialCatalogData();
  }, [companyId]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInitialCatalogData = async () => {
    setIsLoading(true);
    try {
      const [resDs, resSch, resFields, resGroups, resLedgers, resParties, resVouchers, resLines, resIssues, resStates] = await Promise.all([
        fetch(`/api/universal-data/datasets?companyId=${companyId}`),
        fetch(`/api/universal-data/schemas`),
        fetch(`/api/universal-data/fields?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/groups?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/ledgers?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/parties?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/vouchers?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/voucher-lines?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/hierarchy-issues?companyId=${companyId}`),
        fetch(`/api/universal-data/canonical/normalization-states?companyId=${companyId}`)
      ]);

      const dataDs = await resDs.json();
      const dataSch = await resSch.json();
      const dataFields = await resFields.json();
      const dataGroups = await resGroups.json();
      const dataLedgers = await resLedgers.json();
      const dataParties = await resParties.json();
      const dataVouchers = await resVouchers.json();
      const dataLines = await resLines.json();
      const dataIssues = await resIssues.json();
      const dataStates = await resStates.json();

      if (dataDs.success) {
        setDatasets(dataDs.data);
        if (dataDs.data.length > 0 && !selectedDataset) {
          handleSelectDataset(dataDs.data[0]);
        }
      }
      if (dataSch.success) {
        setSchemas(dataSch.data);
        if (dataSch.data.length >= 2 && !compareSchemaAId) {
          setCompareSchemaAId(dataSch.data[0].schemaId);
          setCompareSchemaBId(dataSch.data[1].schemaId);
        }
      }
      if (dataFields.success) {
        setFieldCatalog(dataFields.data);
      }
      if (dataGroups.success) setCanonicalGroups(dataGroups.data);
      if (dataLedgers.success) setCanonicalLedgers(dataLedgers.data);
      if (dataParties.success) setCanonicalParties(dataParties.data);
      if (dataVouchers.success) setCanonicalVouchers(dataVouchers.data);
      if (dataLines.success) setCanonicalVoucherLines(dataLines.data);
      if (dataIssues.success) setHierarchyIssues(dataIssues.data);
      if (dataStates.success) setNormalizationStates(dataStates.data);
    } catch (err: any) {
      console.error('Failed to load universal catalog data', err);
      showNotification('error', 'Failed to fetch catalog datasets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncWithGraph = async () => {
    setIsSyncingGraph(true);
    try {
      const res = await fetch('/api/universal-data/canonical/sync-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'Successfully synchronized with Phase 31 Graph.');
      } else {
        showNotification('error', data.error || 'Failed to sync with graph.');
      }
    } catch (err) {
      showNotification('error', 'Network error while syncing graph.');
    } finally {
      setIsSyncingGraph(false);
    }
  };

  const handleSelectDataset = async (ds: DatasetMetadata) => {
    setSelectedDataset(ds);
    try {
      const [resDsDetail, resRecords] = await Promise.all([
        fetch(`/api/universal-data/datasets/${ds.datasetId}?companyId=${companyId}`),
        fetch(`/api/universal-data/records/${ds.datasetId}?companyId=${companyId}&includeHistorical=true`)
      ]);

      const dataDetail = await resDsDetail.json();
      const dataRecords = await resRecords.json();

      if (dataDetail.success) {
        setActiveSchema(dataDetail.data.activeSchema || null);
      }
      if (dataRecords.success) {
        setCanonicalRecords(dataRecords.data);
        if (dataRecords.data.length > 0) {
          setSelectedRecord(dataRecords.data[0]);
        } else {
          setSelectedRecord(null);
        }
      }
    } catch (err) {
      console.error('Failed to load dataset details', err);
    }
  };

  const handleCompareSchemas = async () => {
    if (!compareSchemaAId || !compareSchemaBId) return;
    setIsComparing(true);
    try {
      const res = await fetch('/api/universal-data/schemas/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaAId: compareSchemaAId, schemaBId: compareSchemaBId })
      });
      const data = await res.json();
      if (data.success) {
        setComparisonResult(data.data);
        showNotification('info', `Schema comparison evaluated: ${data.data.compatibility}`);
      } else {
        showNotification('error', data.error || 'Comparison failed');
      }
    } catch (err: any) {
      showNotification('error', 'Failed to compare schemas');
    } finally {
      setIsComparing(false);
    }
  };

  const handleProposeSchema = async () => {
    try {
      const discoveredSampleFields = [
        { name: 'ledgerId', type: 'String', path: 'LEDGER.GUID', nullable: 'Required', source: 'Phase 29 Harvester' },
        { name: 'name', type: 'String', path: 'LEDGER.NAME', nullable: 'Required', source: 'Phase 29 Harvester' },
        { name: 'parentGroup', type: 'String', path: 'LEDGER.PARENT', nullable: 'Required', source: 'Phase 29 Harvester' },
        { name: 'openingBalance', type: 'Decimal', path: 'LEDGER.OPENINGBALANCE', nullable: 'Required', source: 'Phase 29 Harvester' },
        { name: 'closingBalance', type: 'Decimal', path: 'LEDGER.CLOSINGBALANCE', nullable: 'Required', source: 'Phase 29 Harvester' },
        { name: 'status', type: 'String', path: 'LEDGER.STATUS', nullable: 'Optional', source: 'Phase 29 Harvester' },
        { name: 'creditLimit', type: 'Decimal', path: 'LEDGER.CREDITLIMIT', nullable: 'Optional', source: 'Phase 29 Harvester' }
      ];

      const res = await fetch('/api/universal-data/schemas/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: proposeDatasetId,
          discoveredFields: discoveredSampleFields,
          grain: proposeGrain,
          relationships: [
            { relationshipId: 'rel-prop-01', targetDatasetId: 'ds-groups', type: 'N:1', sourceField: 'parentGroup', targetField: 'name', confidence: 'High' }
          ]
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Schema proposal generated in Review state.');
        setIsProposeModalOpen(false);
        fetchInitialCatalogData();
      } else {
        showNotification('error', data.error);
      }
    } catch (err) {
      showNotification('error', 'Failed to propose schema');
    }
  };

  const handleUpdateSchemaStatus = async (schemaId: string, status: SchemaStatus) => {
    try {
      const res = await fetch(`/api/universal-data/schemas/${schemaId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actor: 'Controller Arjun (UI)' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Schema ${schemaId} transitioned to ${status}.`);
        fetchInitialCatalogData();
        if (selectedDataset) {
          handleSelectDataset(selectedDataset);
        }
      } else {
        showNotification('error', data.error);
      }
    } catch (err) {
      showNotification('error', 'Failed to update schema status');
    }
  };

  const handleIngestCustomPayload = async () => {
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(ingestPayloadText);
      } catch (e) {
        showNotification('error', 'Invalid JSON payload');
        return;
      }

      if (!selectedDataset) return;

      const res = await fetch(`/api/universal-data/records/${selectedDataset.datasetId}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          sourceRecordId: parsed.ledgerId || parsed.voucherId || parsed.itemId || `REC-${Date.now()}`,
          sourceSystem: 'Tally Ingestion Gateway',
          sourceObject: selectedDataset.sourceObject,
          rawPayload: parsed,
          sourceReport: 'Interactive Ingestion Simulator'
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        setIsIngestModalOpen(false);
        handleSelectDataset(selectedDataset);
      } else {
        showNotification('error', data.error);
      }
    } catch (err) {
      showNotification('error', 'Ingestion failed');
    }
  };

  // Filtered Datasets
  const filteredDatasets = datasets.filter((ds) => {
    const matchesCat = categoryFilter === 'All' || ds.category === categoryFilter;
    const matchesSearch =
      ds.name.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
      ds.displayName.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
      ds.datasetId.toLowerCase().includes(datasetSearchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filtered Field Catalog
  const filteredFields = fieldCatalog.filter((f) => {
    return (
      f.fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
      f.datasetName.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
      f.semanticMeaning.toLowerCase().includes(fieldSearchTerm.toLowerCase())
    );
  });

  // Filtered Schemas for Registry
  const filteredSchemas = schemas.filter((s) => {
    return schemaDatasetFilter === 'All' || s.datasetId === schemaDatasetFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Universal Tally Data Model & Schema Registry</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  PHASE 32A
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>UNKNOWN FIELD EXTENSION GUARD ACTIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Datasets • Controlled Extension Fields • Schema Registry & Lifecycle • Change Detection • Data Catalog • Company Isolation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Company Selector */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none"
              >
                <option value="CMP-001" className="bg-slate-900">Acme Enterprise Ltd (CMP-001)</option>
                <option value="CMP-002" className="bg-slate-900">Zenith Global Subsidiary (CMP-002)</option>
              </select>
            </div>

            <button
              onClick={() => setIsProposeModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-md text-xs shadow flex items-center space-x-1.5 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Propose Schema</span>
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'Unified Query Engine (Phase 32G)', label: '⚡ Unified Query & Index Engine (Phase 32G)', icon: Zap },
            { id: 'Data Quality & Validation (Phase 32F)', label: '🛡️ Data Quality & Validation (Phase 32F)', icon: ShieldCheck },
            { id: 'Sync Center (Phase 32E)', label: '🔄 Sync Center (Phase 32E)', icon: RefreshCw },
            { id: 'Analytical Warehouse (Phase 32D)', label: '⚡ Analytical Warehouse (Phase 32D)', icon: Database },
            { id: 'Datasets', label: `Datasets Catalog (${datasets.length})`, icon: Database },
            { id: 'Extended Domains (Phase 32C)', label: 'Extended Domains (Inventory, Tax, CC, Payroll, Banking)', icon: Boxes },
            { id: 'Canonical Masters & Vouchers', label: `Canonical Masters & Vouchers (${canonicalGroups.length + canonicalLedgers.length + canonicalVouchers.length})`, icon: Layers },
            { id: 'Hierarchy & Integrity Engine', label: `Hierarchy & Integrity (${hierarchyIssues.length} issues)`, icon: FolderTree },
            { id: 'Field Catalog', label: `Field Catalog (${fieldCatalog.length})`, icon: Tag },
            { id: 'Schema Registry', label: `Schema Registry (${schemas.length})`, icon: FileCode },
            { id: 'Schema Comparator', label: 'Schema Comparator & Diff', icon: ArrowLeftRight },
            { id: 'Record Inspector', label: 'Canonical Record Inspector', icon: Layers },
            { id: 'Raw Metadata Layer', label: 'Raw Source Metadata', icon: Archive }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CatalogTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-md font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================================================= */}
        {/* TAB -3: UNIFIED QUERY & INDEX ENGINE (PHASE 32G)                          */}
        {/* ========================================================================= */}
        {activeTab === 'Unified Query Engine (Phase 32G)' && (
          <div className="text-slate-900">
            <Phase32GUnifiedQueryCenterView />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB -2: DATA QUALITY & VALIDATION (PHASE 32F)                            */}
        {/* ========================================================================= */}
        {activeTab === 'Data Quality & Validation (Phase 32F)' && (
          <div className="text-slate-200">
            <Phase32FDataQualityCenterView />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB -1: SYNC CENTER (PHASE 32E)                                          */}
        {/* ========================================================================= */}
        {activeTab === 'Sync Center (Phase 32E)' && (
          <div className="text-slate-200">
            <Phase32ESyncCenterView />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 0: ANALYTICAL WAREHOUSE (PHASE 32D)                                  */}
        {/* ========================================================================= */}
        {activeTab === 'Analytical Warehouse (Phase 32D)' && (
          <div className="text-slate-900">
            <Phase32DWarehouseView />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: DATASETS CATALOG                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'Datasets' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search datasets by name, category, or grain..."
                  value={datasetSearchTerm}
                  onChange={(e) => setDatasetSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto">
                {['All', 'Master', 'Transaction', 'Inventory', 'Tax', 'Payroll', 'Banking', 'CostCentre'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Datasets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDatasets.map((ds) => {
                const isSelected = selectedDataset?.datasetId === ds.datasetId;
                return (
                  <div
                    key={ds.datasetId}
                    onClick={() => handleSelectDataset(ds)}
                    className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-slate-900 border-blue-500 shadow-xl'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          {ds.category.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            ds.status === 'Active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {ds.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{ds.displayName}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{ds.description || 'Normalized Tally dataset.'}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                        <div><span className="text-slate-500">Grain:</span> <strong>{ds.grain}</strong></div>
                        <div><span className="text-slate-500">Schema:</span> <strong>v{ds.schemaVersion}</strong></div>
                        <div><span className="text-slate-500">Records:</span> <strong className="text-emerald-400">{ds.recordCount || 0}</strong></div>
                        <div><span className="text-slate-500">Ext Fields:</span> <strong className="text-amber-400">{ds.extensionFieldCount || 0}</strong></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span className="truncate max-w-[180px]">Source: {ds.source}</span>
                        <span className="text-blue-400 font-semibold flex items-center space-x-1">
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Dataset Inspection Detail Drawer */}
            {selectedDataset && (
              <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-white">{selectedDataset.displayName}</h2>
                      <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                        {selectedDataset.datasetId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedDataset.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsIngestModalOpen(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs flex items-center space-x-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ingest Test Payload</span>
                    </button>
                  </div>
                </div>

                {/* Active Schema Fields Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <span>Active Schema Fields (v{selectedDataset.schemaVersion})</span>
                    </h4>
                    <span className="text-xs text-slate-400">
                      Fingerprint: <strong className="font-mono text-purple-300">{activeSchema?.fingerprint || 'FP-N/A'}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Field Name</th>
                          <th className="px-4 py-3">Data Type</th>
                          <th className="px-4 py-3">Constraint</th>
                          <th className="px-4 py-3">Key Type</th>
                          <th className="px-4 py-3">Tally Path</th>
                          <th className="px-4 py-3">Semantic Meaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {activeSchema?.fields.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/60">
                            <td className="px-4 py-2.5 font-bold text-white font-mono">{f.name}</td>
                            <td className="px-4 py-2.5 font-mono text-blue-300">{f.type}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                  f.nullable === 'Required'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {f.nullable}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {f.isPrimary && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded flex items-center w-max space-x-1">
                                  <Key className="w-2.5 h-2.5" />
                                  <span>PK</span>
                                </span>
                              )}
                              {f.isForeignKey && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800 rounded flex items-center w-max space-x-1">
                                  <Link className="w-2.5 h-2.5" />
                                  <span>FK → {f.foreignKeyTarget}</span>
                                </span>
                              )}
                              {!f.isPrimary && !f.isForeignKey && <span className="text-slate-500">—</span>}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">{f.path}</td>
                            <td className="px-4 py-2.5 text-slate-300 text-[11px]">{f.semanticMeaning || f.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: CANONICAL MASTERS & VOUCHERS (PHASE 32B)                             */}
        {/* ========================================================================= */}
        {activeTab === 'Canonical Masters & Vouchers' && (
          <div className="space-y-6">
            {/* Header / Summary Bar */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Canonical Accounting Normalization Layer</h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                    Phase 32B Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Normalized Groups, Ledgers, Parties, Vouchers, and Voucher Lines with immutable source lineage, unknown field preservation, and strict date fidelity.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchInitialCatalogData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center space-x-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Entities</span>
                </button>
                <button
                  onClick={handleSyncWithGraph}
                  disabled={isSyncingGraph}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>{isSyncingGraph ? 'Syncing...' : 'Sync Phase 31 Graph'}</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div
                onClick={() => setActiveCanonicalSubTab('Groups')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  activeCanonicalSubTab === 'Groups'
                    ? 'bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-slate-400 font-medium">Canonical Groups</div>
                <div className="text-xl font-bold text-white mt-1">{canonicalGroups.length}</div>
                <div className="text-[10px] text-blue-400 mt-0.5">
                  {canonicalGroups.filter(g => g.nature === 'Unknown').length > 0
                    ? `${canonicalGroups.filter(g => g.nature === 'Unknown').length} Unknown Nature`
                    : '100% Nature Classified'}
                </div>
              </div>

              <div
                onClick={() => setActiveCanonicalSubTab('Ledgers')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  activeCanonicalSubTab === 'Ledgers'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-slate-400 font-medium">Canonical Ledgers</div>
                <div className="text-xl font-bold text-white mt-1">{canonicalLedgers.length}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  {canonicalLedgers.filter(l => l.isPartyAccount).length} Party Ledgers
                </div>
              </div>

              <div
                onClick={() => setActiveCanonicalSubTab('Parties')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  activeCanonicalSubTab === 'Parties'
                    ? 'bg-purple-950/40 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-slate-400 font-medium">Discovered Parties</div>
                <div className="text-xl font-bold text-white mt-1">{canonicalParties.length}</div>
                <div className="text-[10px] text-purple-400 mt-0.5">
                  Evidence-based types
                </div>
              </div>

              <div
                onClick={() => setActiveCanonicalSubTab('Vouchers')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  activeCanonicalSubTab === 'Vouchers'
                    ? 'bg-amber-950/40 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-slate-400 font-medium">Canonical Vouchers</div>
                <div className="text-xl font-bold text-white mt-1">{canonicalVouchers.length}</div>
                <div className="text-[10px] text-amber-400 mt-0.5">
                  Date fidelity preserved
                </div>
              </div>

              <div
                onClick={() => setActiveCanonicalSubTab('Voucher Lines')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  activeCanonicalSubTab === 'Voucher Lines'
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-slate-400 font-medium">Voucher Lines (Debits/Credits)</div>
                <div className="text-xl font-bold text-white mt-1">{canonicalVoucherLines.length}</div>
                <div className="text-[10px] text-cyan-400 mt-0.5">
                  Foreign key validated
                </div>
              </div>
            </div>

            {/* Sub-Tabs Selector & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {(['Groups', 'Ledgers', 'Parties', 'Vouchers', 'Voucher Lines'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCanonicalSubTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      activeCanonicalSubTab === tab
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${activeCanonicalSubTab.toLowerCase()}...`}
                  value={canonicalSearchTerm}
                  onChange={(e) => setCanonicalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* SUB-TAB 1: GROUPS TABLE */}
            {activeCanonicalSubTab === 'Groups' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Group ID</th>
                        <th className="px-4 py-3">Group Name</th>
                        <th className="px-4 py-3">Parent Group ID</th>
                        <th className="px-4 py-3">Nature / Classification</th>
                        <th className="px-4 py-3">Primary</th>
                        <th className="px-4 py-3">Source & ID</th>
                        <th className="px-4 py-3">Extension Fields</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {canonicalGroups
                        .filter(
                          (g) =>
                            g.name.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            g.groupId.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            (g.parentGroupId || '').toLowerCase().includes(canonicalSearchTerm.toLowerCase())
                        )
                        .map((g) => (
                          <tr key={g.groupId} className="hover:bg-slate-800/60 transition">
                            <td className="px-4 py-2.5 font-mono font-bold text-blue-300">{g.groupId}</td>
                            <td className="px-4 py-2.5 font-bold text-white">{g.name}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">
                              {g.parentGroupId ? (
                                <span className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800">
                                  {g.parentGroupId}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">None (Root)</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  g.nature === 'Assets'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : g.nature === 'Liabilities'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : g.nature === 'Income'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : g.nature === 'Expenses'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {g.nature}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {g.isPrimaryGroup ? (
                                <span className="text-emerald-400 font-bold">Yes</span>
                              ) : (
                                <span className="text-slate-500">No</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-[11px] text-slate-400">
                              <span className="font-mono">{g.sourceId}</span>
                              <span className="block text-[9px] text-slate-500">{g.source}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              {Object.keys(g.unknownFields || {}).length > 0 ? (
                                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[10px] font-bold">
                                  +{Object.keys(g.unknownFields || {}).length} Preserved
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: LEDGERS TABLE */}
            {activeCanonicalSubTab === 'Ledgers' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Ledger ID</th>
                        <th className="px-4 py-3">Ledger Name</th>
                        <th className="px-4 py-3">Group (FK) / Hierarchy Path</th>
                        <th className="px-4 py-3">Nature</th>
                        <th className="px-4 py-3">Party Flag</th>
                        <th className="px-4 py-3">Closing Balance</th>
                        <th className="px-4 py-3">Currency</th>
                        <th className="px-4 py-3">Extension Fields</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {canonicalLedgers
                        .filter(
                          (l) =>
                            l.name.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            l.ledgerId.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            (l.parentGroupPath || '').toLowerCase().includes(canonicalSearchTerm.toLowerCase())
                        )
                        .map((l) => (
                          <tr key={l.ledgerId} className="hover:bg-slate-800/60 transition">
                            <td className="px-4 py-2.5 font-mono font-bold text-emerald-300">{l.ledgerId}</td>
                            <td className="px-4 py-2.5 font-bold text-white">{l.name}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">
                              <span className="text-purple-300 font-bold">{l.groupId || 'Unassigned'}</span>
                              {l.parentGroupPath && (
                                <span className="block text-[10px] text-slate-500 font-sans">{l.parentGroupPath}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                                {l.nature || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {l.isPartyAccount ? (
                                <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[10px] font-bold">
                                  Party Ledger
                                </span>
                              ) : (
                                <span className="text-slate-500">General</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                              {l.closingBalance !== undefined ? l.closingBalance.toLocaleString('en-IN') : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">{l.currency || 'INR'}</td>
                            <td className="px-4 py-2.5">
                              {Object.keys(l.unknownFields || {}).length > 0 ? (
                                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[10px] font-bold">
                                  +{Object.keys(l.unknownFields || {}).length} Preserved
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: PARTIES TABLE */}
            {activeCanonicalSubTab === 'Parties' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Party ID</th>
                        <th className="px-4 py-3">Party Name</th>
                        <th className="px-4 py-3">Discovered Type</th>
                        <th className="px-4 py-3">Ledger ID (FK)</th>
                        <th className="px-4 py-3">GSTIN</th>
                        <th className="px-4 py-3">PAN</th>
                        <th className="px-4 py-3">State</th>
                        <th className="px-4 py-3">Currency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {canonicalParties
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            p.partyId.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            (p.gstin || '').toLowerCase().includes(canonicalSearchTerm.toLowerCase())
                        )
                        .map((p) => (
                          <tr key={p.partyId} className="hover:bg-slate-800/60 transition">
                            <td className="px-4 py-2.5 font-mono font-bold text-purple-300">{p.partyId}</td>
                            <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  p.partyType === 'Sundry Debtor'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : p.partyType === 'Sundry Creditor'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {p.partyType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-emerald-400">{p.ledgerId || '—'}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-300">{p.gstin || '—'}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">{p.pan || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-300">{p.stateName || '—'}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">{p.currency || 'INR'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: VOUCHERS TABLE */}
            {activeCanonicalSubTab === 'Vouchers' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Voucher ID</th>
                        <th className="px-4 py-3">Voucher Number</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Normalized Date (ISO)</th>
                        <th className="px-4 py-3">Original Date (Raw)</th>
                        <th className="px-4 py-3">Party (FK)</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Currency</th>
                        <th className="px-4 py-3">Lines</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {canonicalVouchers
                        .filter(
                          (v) =>
                            v.voucherId.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            (v.voucherNumber || '').toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            v.voucherType.toLowerCase().includes(canonicalSearchTerm.toLowerCase())
                        )
                        .map((v) => (
                          <tr
                            key={v.voucherId}
                            onClick={() => {
                              setSelectedVoucherId(v.voucherId);
                              setActiveCanonicalSubTab('Voucher Lines');
                            }}
                            className="hover:bg-slate-800/60 transition cursor-pointer"
                          >
                            <td className="px-4 py-2.5 font-mono font-bold text-amber-300">{v.voucherId}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-white">{v.voucherNumber || '—'}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded">
                                {v.voucherType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-emerald-300 font-semibold">{v.voucherDate}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">{v.originalDate}</td>
                            <td className="px-4 py-2.5 font-mono text-purple-300">{v.partyId || '—'}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-white">
                              {v.totalAmount !== undefined ? v.totalAmount.toLocaleString('en-IN') : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">{v.currency || 'INR'}</td>
                            <td className="px-4 py-2.5 font-mono text-cyan-400 font-bold">
                              {canonicalVoucherLines.filter(l => l.voucherId === v.voucherId).length} Lines →
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: VOUCHER LINES TABLE */}
            {activeCanonicalSubTab === 'Voucher Lines' && (
              <div className="space-y-4">
                {selectedVoucherId && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-200">
                      Filtering lines for Voucher: <strong className="font-mono">{selectedVoucherId}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedVoucherId(null)}
                      className="text-slate-400 hover:text-white font-bold"
                    >
                      Clear Filter (Show All Lines)
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Line ID</th>
                        <th className="px-4 py-3">Voucher ID (FK)</th>
                        <th className="px-4 py-3">Line #</th>
                        <th className="px-4 py-3">Ledger ID (FK)</th>
                        <th className="px-4 py-3">Direction</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Qty / Rate</th>
                        <th className="px-4 py-3">Party ID</th>
                        <th className="px-4 py-3">Narration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {canonicalVoucherLines
                        .filter((l) => (selectedVoucherId ? l.voucherId === selectedVoucherId : true))
                        .filter(
                          (l) =>
                            l.voucherLineId.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            l.voucherId.toLowerCase().includes(canonicalSearchTerm.toLowerCase()) ||
                            (l.ledgerId || '').toLowerCase().includes(canonicalSearchTerm.toLowerCase())
                        )
                        .map((l) => (
                          <tr key={l.voucherLineId} className="hover:bg-slate-800/60 transition">
                            <td className="px-4 py-2.5 font-mono text-cyan-300 font-bold">{l.voucherLineId}</td>
                            <td className="px-4 py-2.5 font-mono text-amber-300">{l.voucherId}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">{l.lineNumber}</td>
                            <td className="px-4 py-2.5 font-mono text-emerald-400 font-bold">{l.ledgerId || '—'}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  l.direction === 'Debit'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {l.direction}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-white">
                              {l.amount !== undefined ? l.amount.toLocaleString('en-IN') : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 text-[11px] font-mono">
                              {l.quantity ? `${l.quantity} @ ${l.rate || 0}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-purple-300">{l.partyId || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-[11px] max-w-xs truncate">{l.narration || '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: HIERARCHY & INTEGRITY ENGINE (PHASE 32B)                              */}
        {/* ========================================================================= */}
        {activeTab === 'Hierarchy & Integrity Engine' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Accounting Hierarchy & Graph Integrity Engine</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Validates parent-child relationships, detects circular references, orphan groups, missing parent groups, and duplicate ledger names.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchInitialCatalogData}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center space-x-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check Integrity</span>
                </button>
              </div>
            </div>

            {/* Integrity Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400 font-semibold">Hierarchy Issue Count</div>
                <div className="text-2xl font-bold text-white flex items-center space-x-2">
                  <span>{hierarchyIssues.length}</span>
                  {hierarchyIssues.length === 0 ? (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">Clean</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded">Requires Review</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {hierarchyIssues.filter(i => i.severity === 'Error').length} Errors • {hierarchyIssues.filter(i => i.severity === 'Warning').length} Warnings
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400 font-semibold">Group Nodes Registered</div>
                <div className="text-2xl font-bold text-blue-400">{canonicalGroups.length}</div>
                <p className="text-[11px] text-slate-500">
                  {canonicalGroups.filter(g => g.isPrimaryGroup).length} Primary Root Groups
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400 font-semibold">Phase 31 Graph Sync Status</div>
                <div className="text-2xl font-bold text-emerald-400">Ready</div>
                <p className="text-[11px] text-slate-500">
                  Unified accounting topology synchronized
                </p>
              </div>
            </div>

            {/* Integrity Issues Log Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Detected Integrity & Hierarchy Issues</h3>
              {hierarchyIssues.length === 0 ? (
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="font-bold text-slate-200">No Accounting Hierarchy Issues Detected</div>
                  <div>All groups resolve to legitimate primary roots without circular references.</div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Issue Code</th>
                        <th className="px-4 py-3">Entity Type</th>
                        <th className="px-4 py-3">Entity ID</th>
                        <th className="px-4 py-3">Issue Message</th>
                        <th className="px-4 py-3">Details / Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {hierarchyIssues.map((issue, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/60 transition">
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                issue.severity === 'Error'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : issue.severity === 'Warning'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-white">{issue.code}</td>
                          <td className="px-4 py-2.5 text-slate-300">{issue.entityType}</td>
                          <td className="px-4 py-2.5 font-mono text-purple-300 font-bold">{issue.entityId}</td>
                          <td className="px-4 py-2.5 text-slate-200">{issue.message}</td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono">
                            {JSON.stringify(issue.details || {})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Hierarchical Group Tree Preview */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Accounting Group Hierarchy Tree</h3>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                {canonicalGroups
                  .filter((g) => g.isPrimaryGroup || !g.parentGroupId)
                  .map((rootGroup) => {
                    const childGroups = canonicalGroups.filter((g) => g.parentGroupId === rootGroup.groupId);
                    const childLedgers = canonicalLedgers.filter((l) => l.groupId === rootGroup.groupId);
                    return (
                      <div key={rootGroup.groupId} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FolderTree className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white">{rootGroup.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">({rootGroup.groupId})</span>
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded">
                              {rootGroup.nature}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {childGroups.length} Sub-groups • {childLedgers.length} Direct Ledgers
                          </span>
                        </div>

                        {/* Children */}
                        {(childGroups.length > 0 || childLedgers.length > 0) && (
                          <div className="pl-6 border-l border-slate-800 space-y-1.5 pt-1">
                            {childGroups.map((sub) => {
                              const subLedgers = canonicalLedgers.filter((l) => l.groupId === sub.groupId);
                              return (
                                <div key={sub.groupId} className="flex items-center justify-between text-[11px] text-slate-300">
                                  <div className="flex items-center space-x-1.5">
                                    <ChevronRight className="w-3 h-3 text-slate-500" />
                                    <span className="font-semibold text-slate-200">{sub.name}</span>
                                    <span className="font-mono text-[9px] text-slate-500">({sub.groupId})</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500">{subLedgers.length} Ledgers</span>
                                </div>
                              );
                            })}

                            {childLedgers.map((led) => (
                              <div key={led.ledgerId} className="flex items-center justify-between text-[11px] text-emerald-300 pl-4">
                                <div className="flex items-center space-x-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span>{led.name}</span>
                                  <span className="font-mono text-[9px] text-slate-500">({led.ledgerId})</span>
                                </div>
                                <span className="font-mono text-slate-300">
                                  {led.closingBalance !== undefined ? `₹${led.closingBalance.toLocaleString('en-IN')}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FIELD CATALOG                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'Field Catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search fields across all datasets..."
                  value={fieldSearchTerm}
                  onChange={(e) => setFieldSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-slate-400 text-xs">{filteredFields.length} Registered Fields</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Field Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dataset</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Key Constraint</th>
                    <th className="px-4 py-3">Semantic Meaning</th>
                    <th className="px-4 py-3">Source & Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {filteredFields.map((f) => (
                    <tr key={f.fieldId} className="hover:bg-slate-800/60">
                      <td className="px-4 py-2.5 font-bold text-white font-mono">{f.fieldName}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-300">{f.type}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-200">{f.datasetName}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          {f.datasetCategory}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {f.isPrimary && <span className="text-amber-400 font-bold">Primary Key</span>}
                        {f.isForeignKey && <span className="text-purple-400 font-bold">FK: {f.foreignKeyTarget}</span>}
                        {!f.isPrimary && !f.isForeignKey && <span className="text-slate-500">{f.nullable}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{f.semanticMeaning}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold">
                          {f.confidence} Confidence
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCHEMA REGISTRY & LIFECYCLE                                        */}
        {/* ========================================================================= */}
        {activeTab === 'Schema Registry' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h3 className="text-base font-bold text-white">Schema Registry & Governance Lifecycle</h3>
                <p className="text-slate-400 mt-0.5">
                  Governed lifecycle state machine: <strong>Draft → Review → Approved → Deprecated</strong>. Proposals never auto-replace active schemas.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-xs">Filter Dataset:</span>
                <select
                  value={schemaDatasetFilter}
                  onChange={(e) => setSchemaDatasetFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs"
                >
                  <option value="All">All Datasets</option>
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>{d.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSchemas.map((sch) => (
                <div key={sch.schemaId} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white text-sm">{sch.schemaId}</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 rounded">
                        v{sch.version}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          sch.status === 'Approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : sch.status === 'Review'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : sch.status === 'Draft'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {sch.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Lifecycle Actions */}
                    <div className="flex items-center space-x-2">
                      {sch.status === 'Review' && (
                        <>
                          <button
                            onClick={() => handleUpdateSchemaStatus(sch.schemaId, 'Approved')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve Version</span>
                          </button>
                          <button
                            onClick={() => handleUpdateSchemaStatus(sch.schemaId, 'Draft')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                          >
                            Move to Draft
                          </button>
                        </>
                      )}

                      {sch.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateSchemaStatus(sch.schemaId, 'Deprecated')}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs"
                        >
                          Deprecate
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 font-mono">
                    <div><span className="text-slate-500">Dataset:</span> <strong>{sch.datasetId}</strong></div>
                    <div><span className="text-slate-500">Grain:</span> <strong>{sch.grain}</strong></div>
                    <div><span className="text-slate-500">Fields:</span> <strong>{sch.fields.length}</strong></div>
                    <div><span className="text-slate-500">Fingerprint:</span> <strong className="text-purple-300">{sch.fingerprint}</strong></div>
                  </div>

                  {sch.notes && (
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-slate-400">
                      <strong>Notes:</strong> {sch.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SCHEMA COMPARATOR & DIFF TOOL                                      */}
        {/* ========================================================================= */}
        {activeTab === 'Schema Comparator' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5 text-xs">
              <div>
                <h3 className="text-base font-bold text-white">Schema Comparator & Breaking Change Detector</h3>
                <p className="text-slate-400 mt-0.5">
                  Side-by-side AST diff engine evaluating compatibility (Compatible, Compatible With Migration, Breaking) with automatic migration suggestions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Base Schema (A)</label>
                  <select
                    value={compareSchemaAId}
                    onChange={(e) => setCompareSchemaAId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  >
                    {schemas.map((s) => (
                      <option key={s.schemaId} value={s.schemaId}>
                        {s.schemaId} (v{s.version} - {s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target / Proposed Schema (B)</label>
                  <select
                    value={compareSchemaBId}
                    onChange={(e) => setCompareSchemaBId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  >
                    {schemas.map((s) => (
                      <option key={s.schemaId} value={s.schemaId}>
                        {s.schemaId} (v{s.version} - {s.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCompareSchemas}
                disabled={isComparing || !compareSchemaAId || !compareSchemaBId}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center space-x-2 shadow"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{isComparing ? 'Comparing Schemas...' : 'Run Schema Compatibility Analysis'}</span>
              </button>

              {/* Comparison Results */}
              {comparisonResult && (
                <div className="mt-5 p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-white text-sm">Comparison Outcome</span>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        comparisonResult.compatibility === 'Compatible'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : comparisonResult.compatibility === 'Compatible With Migration'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {comparisonResult.compatibility.toUpperCase()}
                    </span>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Added Fields</span>
                      <span className="text-emerald-400 font-bold">+{comparisonResult.summary.addedFieldsCount}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Removed Fields</span>
                      <span className="text-rose-400 font-bold">-{comparisonResult.summary.removedFieldsCount}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Type Changes</span>
                      <span className="text-amber-400 font-bold">{comparisonResult.summary.modifiedFieldsCount}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Breaking Issues</span>
                      <span className="text-rose-400 font-bold">{comparisonResult.summary.breakingChangesCount}</span>
                    </div>
                  </div>

                  {/* Breaking Reasons */}
                  {comparisonResult.breakingReasons.length > 0 && (
                    <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-lg space-y-1.5">
                      <div className="font-bold text-rose-300 flex items-center space-x-1.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Breaking Changes Detected:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200">
                        {comparisonResult.breakingReasons.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Migration Suggestions */}
                  {comparisonResult.migrationSuggestions.length > 0 && (
                    <div className="p-3.5 bg-amber-950/60 border border-amber-500/40 rounded-lg space-y-1.5">
                      <div className="font-bold text-amber-300 flex items-center space-x-1.5 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Recommended Migration Strategy:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200">
                        {comparisonResult.migrationSuggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detailed Field Diffs */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-300 block text-xs">Field Diff Details:</span>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {comparisonResult.fieldDiffs.map((d, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-white font-mono">{d.fieldName}</strong>
                            <p className="text-[11px] text-slate-400">{d.details}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                              d.impact === 'Breaking'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : d.impact === 'MigrationRequired'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {d.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CANONICAL RECORD INSPECTOR                                         */}
        {/* ========================================================================= */}
        {activeTab === 'Record Inspector' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h3 className="text-base font-bold text-white">Canonical Record & Unknown Fields Inspector</h3>
                <p className="text-slate-400 mt-0.5">
                  Inspect normalized records, historical version retention, and controlled extension fields preserved from Tally raw XML.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-xs">Dataset:</span>
                <select
                  value={selectedDataset?.datasetId}
                  onChange={(e) => {
                    const ds = datasets.find((d) => d.datasetId === e.target.value);
                    if (ds) handleSelectDataset(ds);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs"
                >
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>{d.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Record List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Records in {selectedDataset?.displayName} ({canonicalRecords.length})
                </span>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {canonicalRecords.map((r) => {
                    const isSelected = selectedRecord?.canonicalRecordId === r.canonicalRecordId;
                    return (
                      <div
                        key={r.canonicalRecordId}
                        onClick={() => setSelectedRecord(r)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-slate-900 border-blue-500 shadow-xl'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-white font-bold text-xs">{r.sourceRecordId}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              r.isCurrent
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {r.isCurrent ? 'CURRENT' : 'HISTORICAL'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 mt-1 truncate">
                          {r.fields.name || r.fields.ledgerName || r.fields.voucherNumber || r.sourceRecordId}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                          <span>Schema: v{r.schemaVersion}</span>
                          <span className="text-amber-400 font-semibold">{r.extensionFields?.length || 0} Ext Fields</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Record Detail & Extension Fields */}
              <div className="lg:col-span-2 space-y-4">
                {selectedRecord ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-bold text-white">{selectedRecord.sourceRecordId}</h2>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                            v{selectedRecord.schemaVersion}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">ID: {selectedRecord.canonicalRecordId}</p>
                      </div>

                      <span className="text-xs text-slate-400 font-mono">
                        Valid: {new Date(selectedRecord.validFrom).toLocaleDateString()} → {selectedRecord.validTo ? new Date(selectedRecord.validTo).toLocaleDateString() : 'Present'}
                      </span>
                    </div>

                    {/* Standard Known Schema Fields */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-300 text-xs flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Known Schema Fields (Normalized)</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                        {Object.entries(selectedRecord.fields || {}).map(([k, v], idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">{k}</span>
                            <span className="text-white font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preserved Unknown Extension Fields */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-xs flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Preserved Unknown Extension Fields ({selectedRecord.extensionFields.length})</span>
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded">
                          Controlled Extension Layer
                        </span>
                      </div>

                      {selectedRecord.extensionFields.length > 0 ? (
                        <div className="space-y-2">
                          {selectedRecord.extensionFields.map((ext, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-amber-200">{ext.name}</span>
                                <span className="px-1.5 py-0.5 text-[9px] bg-slate-900 text-slate-400 rounded">
                                  Type: {ext.type} • Confidence: {ext.confidence}
                                </span>
                              </div>
                              <div className="text-slate-200 font-mono bg-slate-900 p-2 rounded text-[11px]">
                                <strong>Value:</strong> {typeof ext.value === 'object' ? JSON.stringify(ext.value) : String(ext.value)}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Path: {ext.path}</span>
                                <span>Semantic: {ext.semanticMeaning}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                          No unknown extension fields on this record.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 text-xs">
                    Select a record to inspect canonical fields and preserved extensions.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: RAW METADATA LAYER                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'Raw Metadata Layer' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
              <div>
                <h3 className="text-base font-bold text-white">Raw Source Metadata Layer</h3>
                <p className="text-slate-400 mt-0.5">
                  Immutable audit metadata capturing RawRecordId, CompanyId, SourceReport, CapturedAt, PayloadReference, and SHA-256 Fingerprint.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Company ID:</span> <strong className="text-white">{companyId}</strong></div>
                  <div><span className="text-slate-500">Source Protocol:</span> <strong className="text-blue-400">Tally XML Port 9000</strong></div>
                  <div><span className="text-slate-500">Extraction ID:</span> <strong className="text-purple-400">EXT-AUTOMATION-01</strong></div>
                  <div><span className="text-slate-500">Storage Vault:</span> <strong className="text-emerald-400">s3://exfin-vault/raw/{companyId}/</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: EXTENDED DOMAINS (PHASE 32C)                                         */}
        {/* ========================================================================= */}
        {activeTab === 'Extended Domains (Phase 32C)' && (
          <Phase32CDomainsView companyId={companyId} />
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROPOSE SCHEMA FROM PHASE 29/31 DISCOVERY                       */}
      {/* ========================================================================= */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Propose Schema from Discovery</h3>
              </div>
              <button onClick={() => setIsProposeModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Generates a new schema proposal from Phase 29 Harvester discovered fields in the <strong>Review</strong> state. The active schema will remain unaffected until explicitly approved.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Dataset</label>
                <select
                  value={proposeDatasetId}
                  onChange={(e) => setProposeDatasetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                >
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>{d.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Grain Level</label>
                <input
                  type="text"
                  value={proposeGrain}
                  onChange={(e) => setProposeGrain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsProposeModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleProposeSchema}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
              >
                Generate Proposal (v+1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INGESTION SIMULATOR                                              */}
      {/* ========================================================================= */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Ingest Test Raw Payload</h3>
              </div>
              <button onClick={() => setIsIngestModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Test ingestion against dataset <strong>{selectedDataset?.displayName}</strong>. Known schema fields are normalized, while unrecognized fields are preserved in the controlled extension layer.
            </p>

            <textarea
              value={ingestPayloadText}
              onChange={(e) => setIngestPayloadText(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleIngestCustomPayload}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
              >
                Ingest & Normalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
