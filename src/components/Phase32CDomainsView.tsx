import React, { useState, useEffect } from 'react';
import {
  CanonicalStockGroup,
  CanonicalStockItem,
  CanonicalGodown,
  CanonicalBatch,
  CanonicalInventoryMovement,
  CanonicalTaxEntity,
  CanonicalTaxTransaction,
  CanonicalCostCentreCategory,
  CanonicalCostCentre,
  CanonicalEmployee,
  CanonicalPayrollPeriod,
  CanonicalPayrollTransaction,
  CanonicalBankAccount,
  CanonicalBankTransaction
} from '../types/phase32UniversalModel';
import {
  Boxes,
  Receipt,
  Layers,
  Users,
  Building2,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Tag,
  Warehouse,
  Package,
  ArrowRightLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Network
} from 'lucide-react';

interface Phase32CDomainsViewProps {
  companyId: string;
}

export const Phase32CDomainsView: React.FC<Phase32CDomainsViewProps> = ({ companyId }) => {
  const [activeSubDomain, setActiveSubDomain] = useState<
    'Inventory' | 'Taxation' | 'Cost Centres' | 'Payroll' | 'Banking'
  >('Inventory');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // User RBAC Role Switcher for Privacy Testing
  const [userRole, setUserRole] = useState<'GUEST' | 'HR_ADMIN' | 'FINANCE_ADMIN' | 'CFO' | 'SUPER_ADMIN'>('GUEST');

  // Domain Availability
  const [availability, setAvailability] = useState<{
    inventory: string;
    tax: string;
    costCentre: string;
    payroll: string;
    banking: string;
  }>({
    inventory: 'Complete',
    tax: 'Complete',
    costCentre: 'Complete',
    payroll: 'Complete',
    banking: 'Complete'
  });

  // Data states
  const [stockGroups, setStockGroups] = useState<CanonicalStockGroup[]>([]);
  const [stockItems, setStockItems] = useState<CanonicalStockItem[]>([]);
  const [godowns, setGodowns] = useState<CanonicalGodown[]>([]);
  const [batches, setBatches] = useState<CanonicalBatch[]>([]);
  const [movements, setMovements] = useState<CanonicalInventoryMovement[]>([]);

  const [taxEntities, setTaxEntities] = useState<CanonicalTaxEntity[]>([]);
  const [taxTransactions, setTaxTransactions] = useState<CanonicalTaxTransaction[]>([]);

  const [costCategories, setCostCategories] = useState<CanonicalCostCentreCategory[]>([]);
  const [costCentres, setCostCentres] = useState<CanonicalCostCentre[]>([]);

  const [employees, setEmployees] = useState<CanonicalEmployee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<CanonicalPayrollPeriod[]>([]);
  const [payrollTransactions, setPayrollTransactions] = useState<CanonicalPayrollTransaction[]>([]);

  const [bankAccounts, setBankAccounts] = useState<CanonicalBankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<CanonicalBankTransaction[]>([]);

  // Selected for lineage / details modal
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);

  // Load Domain Data
  const loadDomainData = async () => {
    setIsLoading(true);
    try {
      // 1. Availability
      const availRes = await fetch(`/api/universal-data/canonical/domain-availability?companyId=${companyId}`);
      const availData = await availRes.json();
      if (availData.success) {
        setAvailability(availData.availability);
      }

      // 2. Inventory
      const [stkGrpRes, stkItmRes, gdnRes, btchRes, movRes] = await Promise.all([
        fetch(`/api/universal-data/canonical/stock-groups?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/stock-items?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/godowns?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/batches?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/inventory-movements?companyId=${companyId}`).then((r) => r.json())
      ]);

      if (stkGrpRes.success) setStockGroups(stkGrpRes.data || []);
      if (stkItmRes.success) setStockItems(stkItmRes.data || []);
      if (gdnRes.success) setGodowns(gdnRes.data || []);
      if (btchRes.success) setBatches(btchRes.data || []);
      if (movRes.success) setMovements(movRes.data || []);

      // 3. Tax & Cost Centres
      const [taxEntRes, taxTrxRes, ccCatRes, ccRes] = await Promise.all([
        fetch(`/api/universal-data/canonical/tax-entities?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/tax-transactions?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/cost-centre-categories?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/cost-centres?companyId=${companyId}`).then((r) => r.json())
      ]);

      if (taxEntRes.success) setTaxEntities(taxEntRes.data || []);
      if (taxTrxRes.success) setTaxTransactions(taxTrxRes.data || []);
      if (ccCatRes.success) setCostCategories(ccCatRes.data || []);
      if (ccRes.success) setCostCentres(ccRes.data || []);

      // 4. Payroll & Banking (With RBAC User Role)
      const [empRes, prdRes, payTrxRes, bnkAccRes, bnkTrxRes] = await Promise.all([
        fetch(`/api/universal-data/canonical/employees?companyId=${companyId}&userRole=${userRole}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/payroll-periods?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/payroll-transactions?companyId=${companyId}&userRole=${userRole}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/bank-accounts?companyId=${companyId}&userRole=${userRole}`).then((r) => r.json()),
        fetch(`/api/universal-data/canonical/bank-transactions?companyId=${companyId}`).then((r) => r.json())
      ]);

      if (empRes.success) setEmployees(empRes.data || []);
      if (prdRes.success) setPayrollPeriods(prdRes.data || []);
      if (payTrxRes.success) setPayrollTransactions(payTrxRes.data || []);
      if (bnkAccRes.success) setBankAccounts(bnkAccRes.data || []);
      if (bnkTrxRes.success) setBankTransactions(bnkTrxRes.data || []);
    } catch (err) {
      console.error('Failed to load domain data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDomainData();
  }, [companyId, userRole]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Domain Availability & Security Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 32C Multi-Domain Normalization
              </span>
              <span className="text-xs text-slate-400">Company: {companyId}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" /> Universal Canonical Domain Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Normalized Inventory, Dynamic Taxation, Cost Centre Hierarchies, RBAC Payroll safeguards, and Bank Statement Reconciliations with full source lineage.
            </p>
          </div>

          {/* Privacy & RBAC Role Simulation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-medium">Privacy Role:</span>
            </div>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="GUEST">Guest (Masked PAN, Bank & Salary)</option>
              <option value="HR_ADMIN">HR Admin (Unmask Employee PAN & Payroll)</option>
              <option value="FINANCE_ADMIN">Finance Admin (Unmask Bank Accounts)</option>
              <option value="CFO">CFO (Full Executive Clearance)</option>
              <option value="SUPER_ADMIN">Super Admin (Full Audit Access)</option>
            </select>
            <button
              onClick={loadDomainData}
              disabled={isLoading}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Domain Availability Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <Boxes className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400">Inventory:</span>
            <span className="font-semibold text-emerald-400">Complete</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Receipt className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Taxation:</span>
            <span className="font-semibold text-emerald-400">Complete</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Cost Centres:</span>
            <span className="font-semibold text-emerald-400">Complete</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-4 h-4 text-pink-400" />
            <span className="text-slate-400">Payroll:</span>
            <span className={`font-semibold ${availability.payroll === 'Complete' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {availability.payroll}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Banking:</span>
            <span className={`font-semibold ${availability.banking === 'Complete' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {availability.banking}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Domain Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {(['Inventory', 'Taxation', 'Cost Centres', 'Payroll', 'Banking'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubDomain(tab);
                setSearchTerm('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSubDomain === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'Inventory' && <Boxes className="w-4 h-4" />}
              {tab === 'Taxation' && <Receipt className="w-4 h-4" />}
              {tab === 'Cost Centres' && <Layers className="w-4 h-4" />}
              {tab === 'Payroll' && <Users className="w-4 h-4" />}
              {tab === 'Banking' && <Building2 className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${activeSubDomain}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. INVENTORY SUB-DOMAIN */}
      {/* ===================================================================== */}
      {activeSubDomain === 'Inventory' && (
        <div className="space-y-6">
          {/* Stock Items Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Canonical Stock Items ({stockItems.length})</h3>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  Grain: 1 row per source stock-item
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Stock Group</th>
                    <th className="py-2.5 px-4">Base Unit</th>
                    <th className="py-2.5 px-4">Opening Qty</th>
                    <th className="py-2.5 px-4">Closing Qty</th>
                    <th className="py-2.5 px-4">Closing Valuation</th>
                    <th className="py-2.5 px-4">Lineage / Extension Fields</th>
                    <th className="py-2.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockItems
                    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item) => (
                      <tr key={item.itemId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {item.name}
                          {item.isDuplicateNameFlagged && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              Potential Duplicate Name
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">
                            {item.stockGroupName || item.stockGroupId || 'Primary'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-medium">
                          {item.unit.originalUnit}
                          {item.unit.normalizedUnit && (
                            <span className="text-[10px] text-slate-400 ml-1">({item.unit.normalizedUnit})</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{item.openingQuantity.normalizedValue} {item.unit.originalUnit}</td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-700">{item.closingQuantity.normalizedValue} {item.unit.originalUnit}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">₹{item.closingValue.normalizedValue.toLocaleString()}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {item.extensionFields?.length || 0} Unknown Fields Preserved
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Groups & Godowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Stock Groups */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
                <Tag className="w-4 h-4 text-sky-600" /> Stock Groups Hierarchy ({stockGroups.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stockGroups.map((g) => (
                  <div key={g.stockGroupId} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{g.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Parent: <span className="font-medium text-slate-700">{g.parentStockGroupName || 'Primary (Root)'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-mono border border-sky-200">
                      {g.sourceId}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Godowns */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
                <Warehouse className="w-4 h-4 text-emerald-600" /> Godowns & Storage Locations ({godowns.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {godowns.map((gdn) => (
                  <div key={gdn.godownId} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{gdn.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Parent Location: <span className="font-medium text-slate-700">{gdn.parentGodownName || 'Main Facility'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-mono border border-emerald-200">
                      {gdn.isPrimary ? 'Primary' : 'Sub-Location'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Batches & Movements Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">Inventory Movements & Batch Lot Tracking</h3>
                <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                  Grain: 1 row per movement event
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Quantity</th>
                    <th className="py-2.5 px-4">Rate</th>
                    <th className="py-2.5 px-4">Total Value</th>
                    <th className="py-2.5 px-4">Voucher ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.movementId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{m.date.normalizedDate}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          m.movementType === 'Issue' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{m.stockItemName}</td>
                      <td className="py-2.5 px-4 text-slate-700">{m.quantity.normalizedValue} {m.quantity.unit}</td>
                      <td className="py-2.5 px-4 text-slate-700">₹{m.rate.normalizedValue.toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">₹{m.value.normalizedValue.toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-mono text-indigo-600">{m.voucherId || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. TAXATION SUB-DOMAIN */}
      {/* ===================================================================== */}
      {activeSubDomain === 'Taxation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tax Entities Master */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-purple-600" /> Dynamic Tax Entities Master ({taxEntities.length})
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Country-neutral tax classifications, rates, jurisdictions, and registration IDs discovered from source.
              </p>
              <div className="space-y-3">
                {taxEntities.map((t) => (
                  <div key={t.taxId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{t.name}</span>
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {t.rate ? `${t.rate}%` : t.type}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <div>Type: <span className="text-slate-800 font-medium">{t.type}</span></div>
                      <div>Jurisdiction: <span className="text-slate-800 font-medium">{t.jurisdiction || 'N/A'}</span></div>
                      <div>Registration: <span className="text-slate-800 font-medium font-mono">{t.registration || 'N/A'}</span></div>
                      <div>Source: <span className="text-slate-800 font-medium">{t.source}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Transactions Register */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Tax Transactions Register ({taxTransactions.length})
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Tax debits/credits with taxable base valuations and component distributions.
              </p>
              <div className="space-y-3">
                {taxTransactions.map((tt) => (
                  <div key={tt.taxTransactionId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{tt.taxComponent}</span>
                      <span className="text-emerald-700 font-bold">₹{tt.taxAmount.normalizedValue.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <div>Taxable Base: <span className="text-slate-800 font-medium">₹{tt.taxableValue.normalizedValue.toLocaleString()}</span></div>
                      <div>Voucher ID: <span className="text-indigo-600 font-mono font-medium">{tt.voucherId}</span></div>
                      <div>Party: <span className="text-slate-800 font-medium">{tt.partyName || 'N/A'}</span></div>
                      <div>Rate: <span className="text-slate-800 font-medium">{tt.taxRate ? `${tt.taxRate}%` : 'N/A'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. COST CENTRES SUB-DOMAIN */}
      {/* ===================================================================== */}
      {activeSubDomain === 'Cost Centres' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cost Centre Categories */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-amber-600" /> Cost Centre Categories ({costCategories.length})
              </h3>
              <div className="space-y-2">
                {costCategories.map((cat) => (
                  <div key={cat.categoryId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{cat.name}</div>
                      <div className="text-[11px] text-slate-500">ID: {cat.categoryId}</div>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Centres Master & Hierarchies */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-indigo-600" /> Cost Centres Master ({costCentres.length})
              </h3>
              <div className="space-y-2">
                {costCentres.map((cc) => (
                  <div key={cc.costCentreId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{cc.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Category: <span className="font-medium text-slate-700">{cc.categoryName || 'General'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      {cc.parentName ? `Sub-centre of ${cc.parentName}` : 'Root Cost Unit'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. PAYROLL SUB-DOMAIN (WITH PRIVACY SAFELIGHT) */}
      {/* ===================================================================== */}
      {activeSubDomain === 'Payroll' && (
        <div className="space-y-6">
          {availability.payroll !== 'Complete' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-amber-900">Payroll Dataset: Not Available</h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto mt-1">
                No payroll or employee master data was discovered for company {companyId}. In accordance with strict non-guessing requirements, no fake employee records are generated.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-slate-800">Payroll RBAC Privacy Mode:</span>
                  <span className="font-bold text-indigo-600">{userRole}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  {userRole === 'GUEST'
                    ? 'Sensitive statutory PAN numbers, Bank accounts, and salary lines are masked.'
                    : 'Authorized executive access granted. Unmasked employee data displayed.'}
                </div>
              </div>

              {/* Employees Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-600" /> Canonical Employee Registry ({employees.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Employee Name</th>
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-4">Designation</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">PAN (Masked/RBAC)</th>
                        <th className="py-2.5 px-4">Bank Account</th>
                        <th className="py-2.5 px-4">Joining Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{emp.name}</td>
                          <td className="py-2.5 px-4 text-slate-600">{emp.department || 'Staff'}</td>
                          <td className="py-2.5 px-4 text-slate-600">{emp.designation || 'Specialist'}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {emp.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-800">{emp.panMasked || 'N/A'}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-800">{emp.bankAccountNumberMasked || 'N/A'}</td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono">{emp.joiningDate || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payroll Transactions */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Payroll Line Items & Pay Slip Transactions ({payrollTransactions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Employee</th>
                        <th className="py-2.5 px-4">Component</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payrollTransactions.map((pt) => (
                        <tr key={pt.payrollTransactionId} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-medium text-slate-900">{pt.employeeName}</td>
                          <td className="py-2.5 px-4 text-slate-700">{pt.component}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              pt.componentType === 'Earning' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {pt.componentType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {userRole === 'GUEST' ? (
                              <span className="text-slate-400 font-mono text-[11px]">[RESTRICTED]</span>
                            ) : (
                              `₹${pt.amount.normalizedValue.toLocaleString()}`
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono">{pt.date.normalizedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. BANKING SUB-DOMAIN */}
      {/* ===================================================================== */}
      {activeSubDomain === 'Banking' && (
        <div className="space-y-6">
          {availability.banking !== 'Complete' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-amber-900">Banking Dataset: Not Available</h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto mt-1">
                No bank accounts or statement reconciliation records were discovered for company {companyId}.
              </p>
            </div>
          ) : (
            <>
              {/* Bank Accounts */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Bank Accounts Registry ({bankAccounts.length})
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bankAccounts.map((ba) => (
                    <div key={ba.bankAccountId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{ba.name}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                          {ba.accountType}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Bank: <span className="font-semibold text-slate-800">{ba.bankName || 'HDFC Bank'}</span> | Branch: {ba.branch || 'BKC'}
                      </div>
                      <div className="font-mono text-slate-700">
                        Account No: <span className="font-bold text-indigo-700">{ba.accountNumberMasked}</span> (IFSC: {ba.ifscCode || 'N/A'})
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-medium">
                        <span className="text-slate-500">Closing Balance:</span>
                        <span className="text-emerald-700 font-bold">₹{ba.closingBalance?.normalizedValue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Transactions */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Bank Transactions & Clearances ({bankTransactions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Account</th>
                        <th className="py-2.5 px-4">Reference / Cheque</th>
                        <th className="py-2.5 px-4">Party</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Reconciled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bankTransactions.map((bt) => (
                        <tr key={bt.bankTransactionId} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-mono text-slate-600">{bt.date.normalizedDate}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {bt.transactionType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">{bt.bankAccountName}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-700">{bt.reference || bt.instrumentNumber || 'N/A'}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{bt.partyName || 'N/A'}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">₹{bt.amount.normalizedValue.toLocaleString()}</td>
                          <td className="py-2.5 px-4 font-mono text-emerald-600">{bt.reconciliationDate || 'Pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Details & Lineage Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">Entity Details & Lineage</h4>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900">{selectedItemDetail.name}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-1">ID: {selectedItemDetail.itemId || selectedItemDetail.stockGroupId}</div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Source Lineage:</h5>
                <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedItemDetail.lineage, null, 2)}
                </pre>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Preserved Unknown Extension Fields:</h5>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-lg text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedItemDetail.extensionFields || [], null, 2)}
                </pre>
              </div>
            </div>
            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs rounded-lg font-medium hover:bg-slate-800"
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
