import React, { useState, useEffect } from 'react';
import {
  Share2,
  GitFork,
  Layers,
  Database,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
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
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Tag,
  GitBranch,
  RefreshCw,
  Sliders,
  Play
} from 'lucide-react';
import {
  IAccountingGraph,
  GraphNode,
  GraphEdge,
  GroupHierarchyNode,
  GraphIntegrityIssue,
  SemanticMeasure,
  SemanticDimension,
  SemanticJoinPath,
  DeepDrillDownResult,
  GraphSnapshotDiff,
  AIGraphGroundingResponse,
  GraphAuditItem,
  NodeType,
  RelationshipType
} from '../types/phase31ObjectGraph';

type GraphSection =
  | 'Overview'
  | 'Companies'
  | 'Masters'
  | 'Groups'
  | 'Ledgers'
  | 'Vouchers'
  | 'Inventory'
  | 'Parties'
  | 'Tax'
  | 'Cost Centres'
  | 'Relationships'
  | 'Graph Explorer'
  | 'Integrity'
  | 'History';

export const ObjectGraphCenterView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<GraphSection>('Overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core Graph State
  const [graphData, setGraphData] = useState<IAccountingGraph | null>(null);
  const [groupTree, setGroupTree] = useState<GroupHierarchyNode[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [integrityIssues, setIntegrityIssues] = useState<GraphIntegrityIssue[]>([]);
  const [measures, setMeasures] = useState<SemanticMeasure[]>([]);
  const [dimensions, setDimensions] = useState<SemanticDimension[]>([]);
  const [snapshotDiff, setSnapshotDiff] = useState<GraphSnapshotDiff | null>(null);
  const [auditLogs, setAuditLogs] = useState<GraphAuditItem[]>([]);

  // Explorer Selection
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [explorerFilterType, setExplorerFilterType] = useState<string>('All');
  const [nodeSearchTerm, setNodeSearchTerm] = useState<string>('');

  // Semantic Join Tester
  const [joinSource, setJoinSource] = useState<string>('Sales Voucher');
  const [joinTarget, setJoinTarget] = useState<string>('Party Customer Master');
  const [joinResult, setJoinResult] = useState<SemanticJoinPath | null>(null);

  // Deep Drill-Down Drawer
  const [drillDownResult, setDrillDownResult] = useState<DeepDrillDownResult | null>(null);
  const [isDrillingDown, setIsDrillingDown] = useState<boolean>(false);

  // AI Grounded Assistant
  const [aiQuestion, setAiQuestion] = useState<string>('Which customers bought Enterprise Cloud Server Rack 200X?');
  const [aiResponse, setAiResponse] = useState<AIGraphGroundingResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialGraphData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInitialGraphData = async () => {
    setIsLoading(true);
    try {
      const [resGraph, resGroups, resSum, resInt, resMeas, resDim, resDiff, resAudit] = await Promise.all([
        fetch('/api/object-graph'),
        fetch('/api/object-graph/hierarchy/groups'),
        fetch('/api/object-graph/intelligence/summary'),
        fetch('/api/object-graph/integrity/issues'),
        fetch('/api/object-graph/measures'),
        fetch('/api/object-graph/dimensions'),
        fetch('/api/object-graph/snapshots/compare'),
        fetch('/api/object-graph/audit')
      ]);

      const dataGraph = await resGraph.json();
      const dataGroups = await resGroups.json();
      const dataSum = await resSum.json();
      const dataInt = await resInt.json();
      const dataMeas = await resMeas.json();
      const dataDim = await resDim.json();
      const dataDiff = await resDiff.json();
      const dataAudit = await resAudit.json();

      if (dataGraph.success) {
        setGraphData(dataGraph.data);
        if (dataGraph.data.nodes.length > 0) {
          setSelectedNode(dataGraph.data.nodes[0]);
        }
      }
      if (dataGroups.success) setGroupTree(dataGroups.data);
      if (dataSum.success) setSummaryData(dataSum.data);
      if (dataInt.success) setIntegrityIssues(dataInt.data);
      if (dataMeas.success) setMeasures(dataMeas.data);
      if (dataDim.success) setDimensions(dataDim.data);
      if (dataDiff.success) setSnapshotDiff(dataDiff.data);
      if (dataAudit.success) setAuditLogs(dataAudit.data);
    } catch (err) {
      console.error('Failed to load accounting graph data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSemanticJoin = async () => {
    try {
      const res = await fetch('/api/object-graph/semantic-join/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceObject: joinSource, targetObject: joinTarget })
      });
      const data = await res.json();
      if (data.success) {
        setJoinResult(data.data);
        showNotification('info', 'Semantic join path evaluated successfully.');
      }
    } catch (err) {
      showNotification('error', 'Join evaluation failed');
    }
  };

  const handleDeepDrillDown = async (nodeId: string, nodeName: string, nodeType: string) => {
    setIsDrillingDown(true);
    try {
      const res = await fetch('/api/object-graph/drill-down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, filterValue: nodeName, nodeType })
      });
      const data = await res.json();
      if (data.success) {
        setDrillDownResult(data.data);
        showNotification('success', `Drill-down path resolved for ${nodeName}`);
      }
    } catch (err) {
      showNotification('error', 'Failed to resolve deep drill-down');
    } finally {
      setIsDrillingDown(false);
    }
  };

  const handleAskAIAssistant = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/object-graph/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiQuestion })
      });
      const data = await res.json();
      if (data.success) {
        setAiResponse(data.data);
      }
    } catch (err) {
      showNotification('error', 'AI Graph Grounding request failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApproveEdge = async (edgeId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/object-graph/edges/${edgeId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback: status === 'Approved' ? 'Correct' : 'Incorrect' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Relationship ${status.toLowerCase()} successfully.`);
        fetchInitialGraphData();
      }
    } catch (err) {
      showNotification('error', 'Approval update failed');
    }
  };

  // Filtered nodes
  const filteredNodes = (graphData?.nodes || []).filter((n) => {
    const matchesType = explorerFilterType === 'All' || n.nodeType === explorerFilterType;
    const matchesSearch =
      n.name.toLowerCase().includes(nodeSearchTerm.toLowerCase()) ||
      n.displayName.toLowerCase().includes(nodeSearchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Selected node edges
  const selectedNodeEdges = (graphData?.edges || []).filter(
    (e) => e.fromNode === selectedNode?.nodeId || e.toNode === selectedNode?.nodeId
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Accounting Object Graph & Semantic Engine</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  PHASE 31 OBJECT GRAPH
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>READ-ONLY TALLY GUARD ACTIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Semantic Relationship Layer • Master Intelligence • Group Hierarchies • Grain Engine • Deep Drill-Down • AI Graph Grounding
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-200 font-medium">Acme Enterprise Ltd (HO) [Root Node]</span>
            </div>

            <button
              onClick={() => {
                setActiveSection('Graph Explorer');
                showNotification('info', 'Interactive neighborhood explorer activated.');
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-md text-xs shadow flex items-center space-x-1.5 transition"
            >
              <GitBranch className="w-4 h-4" />
              <span>Explore Graph</span>
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

        {/* Navigation Sections */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'Overview', label: 'Overview', icon: BarChart3 },
            { id: 'Companies', label: 'Companies (Root)', icon: Building2 },
            { id: 'Masters', label: 'Master Intelligence', icon: Sparkles },
            { id: 'Groups', label: 'Group Hierarchy Tree', icon: FolderTree },
            { id: 'Ledgers', label: 'Ledgers', icon: FileSpreadsheet },
            { id: 'Vouchers', label: 'Vouchers & Lines', icon: Layers },
            { id: 'Inventory', label: 'Inventory & Stock', icon: Package },
            { id: 'Parties', label: 'Parties (Debtors/Creditors)', icon: Users },
            { id: 'Tax', label: 'Tax Graph', icon: Percent },
            { id: 'Cost Centres', label: 'Cost Centres', icon: Tag },
            { id: 'Relationships', label: `Relationships (${graphData?.edges.length || 0})`, icon: Share2 },
            { id: 'Graph Explorer', label: 'Interactive Explorer', icon: GitFork },
            { id: 'Integrity', label: `Integrity (${integrityIssues.length})`, icon: ShieldCheck },
            { id: 'History', label: 'Snapshot History & Audit', icon: Clock }
          ].map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as GraphSection)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-t-md font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-800 text-purple-400 border-t-2 border-purple-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* SECTION 1: OVERVIEW & MASTER INTELLIGENCE */}
        {/* ========================================== */}
        {activeSection === 'Overview' && summaryData && (
          <div className="space-y-6">
            {/* Top Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Total Ledgers</span>
                <span className="text-xl font-bold text-white font-mono">{summaryData.totalLedgers}</span>
                <span className="text-[10px] text-emerald-400 font-bold block">{summaryData.activeLedgerRate} Active</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Groups & Subgroups</span>
                <span className="text-xl font-bold text-purple-400 font-mono">{summaryData.totalGroups}</span>
                <span className="text-[10px] text-slate-400 block">Depth: 2 Levels</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Daybook Vouchers</span>
                <span className="text-xl font-bold text-blue-400 font-mono">{summaryData.totalVouchers}</span>
                <span className="text-[10px] text-emerald-400 block">100% Balanced</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Stock SKUs & Groups</span>
                <span className="text-xl font-bold text-amber-400 font-mono">{summaryData.totalStockItems}</span>
                <span className="text-[10px] text-slate-400 block">Reconciled</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Parties (Debtors/Creditors)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{summaryData.totalParties}</span>
                <span className="text-[10px] text-purple-400 block">GSTIN Mapped</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Semantic Edges</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">{summaryData.totalRelationships}</span>
                <span className="text-[10px] text-emerald-400 block">92% High Confidence</span>
              </div>
            </div>

            {/* AI Graph Grounded Assistant Prompt Box */}
            <div className="p-5 bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-slate-900 border border-purple-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">AI Graph Grounding & Relationship Assistant</h3>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  STRICT FACTUAL GROUNDING ONLY
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ask natural questions regarding accounting relationships. Responses are verified exclusively against the validated object graph with traceable evidence paths.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="e.g. Which customers bought Enterprise Cloud Server Rack 200X?"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAskAIAssistant}
                  disabled={isAiLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiLoading ? 'Traversing Graph...' : 'Ask Graph AI'}</span>
                </button>
              </div>

              {/* AI Grounded Result */}
              {aiResponse && (
                <div className="mt-3 p-4 bg-slate-950 border border-purple-500/40 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Grounded Accounting Fact</span>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                      Confidence: {aiResponse.confidence}
                    </span>
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans">{aiResponse.answer}</p>

                  {/* Relationship Path Trail */}
                  {aiResponse.relationshipPath?.length > 0 && (
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-purple-300 block">Validated Relationship Traversal Path:</span>
                      <div className="space-y-1 font-mono text-[11px] text-slate-300">
                        {aiResponse.relationshipPath.map((step, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span className="text-purple-400">Step {idx + 1}:</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Concentration & Active Masters Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Top Ledgers by Volume */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span>Master Ledger Activity & Turnover</span>
                  </h3>
                  <span className="text-slate-400 text-[11px]">Top 3 Leaders</span>
                </div>

                <div className="space-y-2">
                  {summaryData.topLedgersByVolume?.map((led: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200">{led.name}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {led.vouchers} Vouchers Posted • Contribution: <strong className="text-blue-400">{led.contribution}</strong>
                        </div>
                      </div>
                      <span className="font-mono text-white font-bold text-sm">₹ {Number(led.volume).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debtor Concentration & Risk */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Debtor Party Outstanding Concentration</span>
                  </h3>
                  <span className="text-slate-400 text-[11px]">Credit Exposure</span>
                </div>

                <div className="space-y-2">
                  {summaryData.topDebtorsConcentration?.map((deb: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200">{deb.name}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Overdue: <strong className="text-amber-400">{deb.overdueDays} Days</strong> • Risk Profile: <strong className="text-emerald-400">{deb.risk}</strong>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        ₹ {Number(deb.outstanding).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 2: INTERACTIVE GROUP HIERARCHY */}
        {/* ========================================== */}
        {activeSection === 'Groups' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Interactive Chart of Accounts Group Hierarchy</h3>
              <p className="text-xs text-slate-400 mt-1">
                Resolved Primary → Group → Subgroup → Ledger structure with automated depth calculation and cycle/orphan detection.
              </p>
            </div>

            <div className="space-y-4">
              {groupTree.map((primaryGrp) => (
                <div key={primaryGrp.groupId} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <FolderTree className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-sm">{primaryGrp.name}</span>
                      <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold">
                        Level: {primaryGrp.level} (Depth: {primaryGrp.depth})
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {primaryGrp.subgroups.length} Subgroups • {primaryGrp.ledgers.length} Direct Ledgers
                    </span>
                  </div>

                  {/* Direct Ledgers */}
                  {primaryGrp.ledgers.length > 0 && (
                    <div className="space-y-1.5 pl-4 border-l-2 border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400 block">Direct Ledgers:</span>
                      {primaryGrp.ledgers.map((led) => (
                        <div key={led.ledgerId} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-medium text-slate-200">{led.name}</span>
                          </div>
                          <div className="flex items-center space-x-3 font-mono">
                            <span className="text-slate-400 text-[11px]">Closing:</span>
                            <span className="text-white font-bold">₹ {led.closingBalance.toLocaleString('en-IN')}</span>
                            <button
                              onClick={() => handleDeepDrillDown(led.ledgerId, led.name, 'Ledger')}
                              className="px-2 py-0.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white rounded border border-blue-500/30 text-[10px] transition"
                            >
                              Drill-Down →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subgroups */}
                  {primaryGrp.subgroups.map((subgrp) => (
                    <div key={subgrp.groupId} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-bold text-purple-200">{subgrp.name}</span>
                          <span className="px-1.5 py-0.5 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 rounded">
                            Depth {subgrp.depth}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{subgrp.ledgers.length} Ledgers Attached</span>
                      </div>

                      {/* Subgroup Ledgers */}
                      <div className="space-y-1.5 pl-3 border-l-2 border-purple-500/20">
                        {subgrp.ledgers.map((led) => (
                          <div key={led.ledgerId} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/60 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-medium text-slate-200">{led.name}</span>
                            </div>
                            <div className="flex items-center space-x-3 font-mono">
                              <span className="text-slate-400 text-[11px]">Closing:</span>
                              <span className="text-emerald-400 font-bold">₹ {led.closingBalance.toLocaleString('en-IN')}</span>
                              <button
                                onClick={() => handleDeepDrillDown(led.ledgerId, led.name, 'Ledger')}
                                className="px-2 py-0.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white rounded border border-purple-500/30 text-[10px] transition"
                              >
                                Drill-Down →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 3: GRAPH EXPLORER (NODE-LINK NEIGHBORHOOD) */}
        {/* ========================================== */}
        {activeSection === 'Graph Explorer' && (
          <div className="space-y-6">
            {/* Explorer Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search accounting graph nodes (Ledger, Voucher, Item, Party)..."
                  value={nodeSearchTerm}
                  onChange={(e) => setNodeSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto">
                {['All', 'Company', 'Group', 'Ledger', 'Voucher', 'StockItem', 'Party', 'Tax', 'CostCentre'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setExplorerFilterType(t)}
                    className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                      explorerFilterType === t
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Nodes List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Discovered Graph Nodes ({filteredNodes.length})
                </h3>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredNodes.map((n) => {
                    const isSelected = selectedNode?.nodeId === n.nodeId;
                    return (
                      <div
                        key={n.nodeId}
                        onClick={() => setSelectedNode(n)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-slate-900 border-purple-500 shadow-xl'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                            {n.nodeType}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{n.sourceId}</span>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-1.5">{n.displayName}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Source: {n.source}</p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                          <span>FY: {n.financialYear}</span>
                          <span className="text-purple-400 font-semibold">Inspect Neighborhood →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Neighborhood Inspector & Edge Viewer */}
              <div className="lg:col-span-2 space-y-4">
                {selectedNode ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-bold text-white">{selectedNode.displayName}</h2>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                            {selectedNode.nodeType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Node ID: {selectedNode.nodeId} • Snapshot: {selectedNode.snapshotId}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeepDrillDown(selectedNode.nodeId, selectedNode.displayName, selectedNode.nodeType)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs flex items-center space-x-1.5 transition"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Deep Drill-Down</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <span className="font-bold text-slate-300 block">Node Metadata & Accounting Attributes:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                        {Object.entries(selectedNode.metadata || {}).map(([k, v], idx) => (
                          <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">{k}</span>
                            <span className="text-white font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Immediate Neighborhood Edges */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                        <Share2 className="w-4 h-4 text-purple-400" />
                        <span>Immediate Connected Edges ({selectedNodeEdges.length})</span>
                      </h4>

                      <div className="space-y-2">
                        {selectedNodeEdges.map((edge) => {
                          const isFrom = edge.fromNode === selectedNode.nodeId;
                          const otherNodeId = isFrom ? edge.toNode : edge.fromNode;
                          const otherNode = graphData?.nodes.find((n) => n.nodeId === otherNodeId);

                          return (
                            <div key={edge.edgeId} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900 border border-slate-700 text-purple-300 rounded font-mono">
                                    {edge.relationshipType}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                      edge.origin === 'Direct'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                                    }`}
                                  >
                                    {edge.origin.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Confidence: <strong className="text-white">{Math.round(edge.confidenceScore * 100)}%</strong>
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => handleApproveEdge(edge.edgeId, 'Approved')}
                                    className="p-1 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 rounded text-[10px] font-bold"
                                    title="Approve Relationship"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveEdge(edge.edgeId, 'Rejected')}
                                    className="p-1 bg-rose-950 hover:bg-rose-800 text-rose-300 border border-rose-700 rounded text-[10px] font-bold"
                                    title="Reject Inferred Relationship"
                                  >
                                    ✕ Override
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 text-slate-200">
                                <span className="font-bold text-white">{selectedNode.displayName}</span>
                                <span className="text-purple-400 font-mono">──[{edge.relationshipType}]──▶</span>
                                <span className="font-bold text-white">{otherNode?.displayName || otherNodeId}</span>
                              </div>

                              {/* Evidence Lineage */}
                              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                                <div><strong>Evidence Source:</strong> {edge.evidence.sourceReport} ({edge.evidence.sourceField})</div>
                                <div><strong>Reason:</strong> {edge.evidence.reason}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400">
                    <GitFork className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs">Select any node to inspect connected relationships and evidence.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 4: RELATIONSHIPS & SEMANTIC JOIN ENGINE */}
        {/* ========================================== */}
        {activeSection === 'Relationships' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Semantic Join Evaluator */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Semantic Join Suggestion Engine (ISemanticJoinEngine)</h3>
                  <p className="text-slate-400 mt-0.5">
                    Test accounting joins across entities with grain compatibility check, loop protection, and double-counting warnings.
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                  Double-Counting Guard: Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Source Entity</label>
                  <select
                    value={joinSource}
                    onChange={(e) => setJoinSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  >
                    <option value="Sales Voucher">Sales Voucher (Grain: VoucherLine)</option>
                    <option value="Expense Ledger">Expense Ledger (Grain: Ledger)</option>
                    <option value="Stock Item">Stock Item (Grain: Item)</option>
                    <option value="Customer Master">Customer Master (Grain: Party)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Dimension</label>
                  <select
                    value={joinTarget}
                    onChange={(e) => setJoinTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  >
                    <option value="Party Customer Master">Party Customer Master (Grain: Party)</option>
                    <option value="Stock Item">Stock Item (Grain: Item)</option>
                    <option value="Group Hierarchy">Group Hierarchy (Grain: Group)</option>
                    <option value="Cost Centre">Cost Centre (Grain: CostCentre)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleTestSemanticJoin}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Evaluate Semantic Join Path</span>
              </button>

              {joinResult && (
                <div className="mt-4 p-4 bg-slate-950 border border-purple-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Valid Semantic Join Path Resolved</span>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 rounded">
                      Cardinality: {joinResult.cardinality}
                    </span>
                  </div>

                  {joinResult.doubleCountingWarning && (
                    <div className="p-3 bg-amber-950/80 border border-amber-500/40 text-amber-200 rounded flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Double-counting warning: Many-to-many relationship requires pre-aggregation at intermediate grain.</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="text-purple-300 font-bold">Join Path Steps:</div>
                    {joinResult.joinSteps.map((step, idx) => (
                      <div key={idx} className="text-slate-300">
                        {idx + 1}. {step}
                      </div>
                    ))}
                  </div>

                  <p className="text-slate-300">{joinResult.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 5: INTEGRITY ISSUES */}
        {/* ========================================== */}
        {activeSection === 'Integrity' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Graph Integrity Engine (IGraphIntegrityEngine)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Continuous automated audit detecting orphan ledgers, broken voucher references, missing groups, and duplicate masters.
              </p>
            </div>

            <div className="space-y-3">
              {integrityIssues.map((iss) => (
                <div key={iss.issueId} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded">
                        {iss.severity.toUpperCase()}
                      </span>
                      <span className="font-bold text-white">{iss.rule}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{iss.issueId}</span>
                  </div>

                  <p className="text-slate-300">{iss.description}</p>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-purple-300">
                    <strong>Remediation Suggestion:</strong> {iss.remediationSuggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 6: SNAPSHOT HISTORY & AUDIT */}
        {/* ========================================== */}
        {activeSection === 'History' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Object Graph Snapshot Comparison & Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-1">
                Compare point-in-time graph states to track newly added, modified, or discontinued master nodes and relationships.
              </p>
            </div>

            {snapshotDiff && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-white">
                    Comparison: <strong className="text-purple-400">{snapshotDiff.snapshotA}</strong> vs{' '}
                    <strong className="text-emerald-400">{snapshotDiff.snapshotB}</strong>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Added Nodes: +{snapshotDiff.summary.nodeDelta} • Added Edges: +{snapshotDiff.summary.edgeDelta}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-300">Newly Added Masters:</span>
                  {snapshotDiff.addedNodes.map((n) => (
                    <div key={n.nodeId} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 rounded font-mono">+ ADDED</span>
                        <span className="font-bold text-white">{n.displayName}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{n.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
              <span className="font-bold text-white">Immutable Graph Operations Audit Trail:</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Audit ID</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Target</th>
                      <th className="p-2.5">Details</th>
                      <th className="p-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.auditId} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-purple-400">{log.auditId}</td>
                        <td className="p-2.5 font-bold text-slate-200">{log.action}</td>
                        <td className="p-2.5 text-slate-300">{log.user}</td>
                        <td className="p-2.5 text-slate-400">{log.targetId}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{log.details}</td>
                        <td className="p-2.5 text-slate-400">{log.timestamp.slice(0, 19).replace('T', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deep Drill-Down Modal / Drawer */}
        {drillDownResult && (
          <div className="p-5 bg-slate-950 border border-purple-500/40 rounded-2xl space-y-4 text-xs mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white">Deep Object Graph Accounting Trace (IDeepDrillDownEngine)</h4>
              </div>
              <button onClick={() => setDrillDownResult(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Path */}
            <div className="flex items-center space-x-2 text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto">
              {drillDownResult.path.map((p, idx) => (
                <React.Fragment key={idx}>
                  <span className="font-semibold text-purple-400 whitespace-nowrap">
                    {p.level}: {p.displayName} ({p.value})
                  </span>
                  {idx < drillDownResult.path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {/* Vouchers */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 block">Underlying Source Vouchers ({drillDownResult.underlyingVouchers.length}):</span>
              {drillDownResult.underlyingVouchers.map((vch) => (
                <div key={vch.voucherId} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-purple-300 font-mono text-sm">{vch.voucherNumber}</span>
                      <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">{vch.voucherType}</span>
                      <span className="text-slate-400 text-[11px]">{vch.date}</span>
                    </div>
                    <span className="font-mono font-bold text-white">Total: ₹ {vch.totalDebit.toLocaleString('en-IN')}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">Narration: "{vch.narration}"</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border border-slate-800 rounded">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="p-2 text-left">Ledger</th>
                          <th className="p-2 text-left">Inventory Item Allocation</th>
                          <th className="p-2 text-right">Debit</th>
                          <th className="p-2 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {vch.lines.map((line, lIdx) => (
                          <tr key={lIdx}>
                            <td className="p-2 text-slate-200">{line.ledgerName}</td>
                            <td className="p-2 text-purple-300">{line.itemName ? `${line.itemName} (Qty: ${line.quantity})` : '-'}</td>
                            <td className="p-2 text-right text-emerald-400">{line.isDebit ? `₹ ${line.amount.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-2 text-right text-blue-400">{!line.isDebit ? `₹ ${line.amount.toLocaleString('en-IN')}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
