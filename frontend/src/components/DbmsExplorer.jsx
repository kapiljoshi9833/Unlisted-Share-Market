import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Database, 
  Terminal, 
  FileCode2, 
  Play, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Copy, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  SlidersHorizontal,
  Table as TableIcon,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export default function DbmsExplorer() {
  const [activeSubTab, setActiveSubTab] = useState('views'); // 'views' | 'queries' | 'triggers' | 'terminal'

  // Views state
  const [viewsList, setViewsList] = useState([]);
  const [selectedViewName, setSelectedViewName] = useState('vw_company_securities');
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showViewSql, setShowViewSql] = useState(false);

  // Queries state
  const [queriesList, setQueriesList] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState('Q1');
  const [queryCategoryFilter, setQueryCategoryFilter] = useState('ALL');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Triggers state
  const [triggersList, setTriggersList] = useState([]);
  const [selectedTriggerName, setSelectedTriggerName] = useState('trg_validate_sell_before_insert');

  // Custom SQL Terminal state
  const [customSql, setCustomSql] = useState('SELECT * FROM vw_transaction_history LIMIT 10;');
  const [customResult, setCustomResult] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState(null);

  // Copied indicator
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Load Initial Metadata Catalogs
  useEffect(() => {
    async function initCatalogs() {
      try {
        const [views, triggers, queries] = await Promise.all([
          api.getViewsList().catch(() => []),
          api.getTriggersList().catch(() => []),
          api.getQueriesList().catch(() => [])
        ]);
        if (views.length) setViewsList(views);
        if (triggers.length) setTriggersList(triggers);
        if (queries.length) setQueriesList(queries);
      } catch (err) {
        console.error('Failed to load DBMS catalogs:', err);
      }
    }
    initCatalogs();
  }, []);

  // Fetch View Data when selectedViewName changes
  const loadViewData = async (name) => {
    try {
      setViewLoading(true);
      const data = await api.getViewData(name);
      setViewData(data);
    } catch (err) {
      console.error('Failed to query view:', err);
      setViewData({ error: err.message, rows: [] });
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'views' && selectedViewName) {
      loadViewData(selectedViewName);
    }
  }, [selectedViewName, activeSubTab]);

  // Execute Phase II Query
  const runPhase2Query = async (queryId) => {
    try {
      setQueryLoading(true);
      const res = await api.runQuery(queryId);
      setQueryResult(res);
    } catch (err) {
      console.error('Failed to run query:', err);
      setQueryResult({ error: err.message, rows: [] });
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'queries' && selectedQueryId && !queryResult) {
      runPhase2Query(selectedQueryId);
    }
  }, [selectedQueryId, activeSubTab]);

  // Execute Custom SQL
  const handleRunCustomSql = async () => {
    try {
      setCustomLoading(true);
      setCustomError(null);
      const res = await api.runCustomSql(customSql);
      setCustomResult(res);
    } catch (err) {
      setCustomError(err.message || 'Execution error');
      setCustomResult(null);
    } finally {
      setCustomLoading(false);
    }
  };

  const selectedViewObj = viewsList.find(v => v.name === selectedViewName) || viewsList[0];
  const selectedQueryObj = queriesList.find(q => q.id === selectedQueryId) || queriesList[0];
  const selectedTriggerObj = triggersList.find(t => t.name === selectedTriggerName) || triggersList[0];

  const filteredQueries = queryCategoryFilter === 'ALL'
    ? queriesList
    : queriesList.filter(q => q.category.includes(queryCategoryFilter));

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="p-6 bg-surface border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-accentBright mb-1">
            <Database size={15} />
            <span className="uppercase tracking-wider">DBMS Academic Programming & Verification</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-textMain">Database Engine Explorer</h1>
          <p className="text-xs text-textMuted font-mono mt-1">
            Interactive live demonstration of Phase II Queries (Q1–Q16), Phase III Views (7 Views), and MySQL Triggers (5 Stored Procedures).
          </p>
        </div>

        {/* SUB-TAB NAV */}
        <div className="flex bg-bg border border-border rounded p-1 space-x-1 shrink-0 text-xs font-mono">
          <button 
            onClick={() => setActiveSubTab('views')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeSubTab === 'views' 
                ? 'bg-accentDark/40 text-accentBright border border-accentDark' 
                : 'text-textMuted hover:text-textMain'
            }`}>
            <Layers size={13} />
            <span>Views ({viewsList.length || 7})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('queries')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeSubTab === 'queries' 
                ? 'bg-accentDark/40 text-accentBright border border-accentDark' 
                : 'text-textMuted hover:text-textMain'
            }`}>
            <FileCode2 size={13} />
            <span>Phase II Queries (16)</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('triggers')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeSubTab === 'triggers' 
                ? 'bg-accentDark/40 text-accentBright border border-accentDark' 
                : 'text-textMuted hover:text-textMain'
            }`}>
            <Zap size={13} />
            <span>Triggers ({triggersList.length || 5})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('terminal')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeSubTab === 'terminal' 
                ? 'bg-accentDark/40 text-accentBright border border-accentDark' 
                : 'text-textMuted hover:text-textMain'
            }`}>
            <Terminal size={13} />
            <span>SQL Console</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: PHASE III VIEWS */}
      {/* ========================================================================= */}
      {activeSubTab === 'views' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* VIEWS LIST SIDEBAR */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-[11px] font-mono text-textMuted uppercase tracking-wider px-1">
              Phase III Defined Views
            </div>
            <div className="space-y-1">
              {viewsList.map(v => (
                <button
                  key={v.name}
                  onClick={() => {
                    setSelectedViewName(v.name);
                    loadViewData(v.name);
                  }}
                  className={`w-full text-left p-3 rounded border text-xs font-mono transition ${
                    selectedViewName === v.name
                      ? 'bg-surfaceHover border-accentDark text-accentBright'
                      : 'bg-surface border-border text-textMuted hover:text-textMain hover:bg-surfaceHover/50'
                  }`}>
                  <div className="font-semibold text-textMain">{v.title}</div>
                  <div className="text-[10px] text-textMuted mt-0.5 truncate">{v.name}</div>
                  <div className="text-[9px] text-accentBright/80 mt-1 uppercase">{v.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* VIEW DETAILS & LIVE DATA */}
          <div className="lg:col-span-3 space-y-4">
            {selectedViewObj && (
              <div className="p-6 bg-surface border border-border rounded-lg space-y-4">
                
                {/* VIEW META */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-accentDark text-accentBright bg-accentDark/20 uppercase">
                        SQL VIEW
                      </span>
                      <h2 className="text-lg font-bold text-textMain">{selectedViewObj.title}</h2>
                    </div>
                    <p className="text-xs font-mono text-textMuted mt-1">
                      {selectedViewObj.description}
                    </p>
                    <div className="text-[11px] font-mono text-textMuted mt-2 flex flex-wrap gap-2 items-center">
                      <span className="text-textMain">Base Tables:</span>
                      {selectedViewObj.tables_joined?.map((tbl, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-bg border border-border text-[10px]">
                          {tbl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setShowViewSql(!showViewSql)}
                      className="px-3 py-1.5 rounded border border-border hover:border-textMuted text-xs font-mono text-textMuted hover:text-textMain transition">
                      {showViewSql ? 'Hide SQL Definition' : 'Show CREATE VIEW SQL'}
                    </button>
                    <button
                      onClick={() => loadViewData(selectedViewObj.name)}
                      disabled={viewLoading}
                      className="px-4 py-1.5 rounded bg-accentBright hover:bg-accentLight text-black font-semibold text-xs font-mono flex items-center space-x-1.5 transition">
                      <RefreshCw size={13} className={viewLoading ? "animate-spin" : ""} />
                      <span>{viewLoading ? "Querying..." : "Query Live View"}</span>
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE CREATE VIEW SQL */}
                {showViewSql && (
                  <div className="relative p-4 bg-bg border border-border rounded font-mono text-xs text-textMain">
                    <button
                      onClick={() => copyToClipboard(selectedViewObj.sql, 'viewSql')}
                      className="absolute top-3 right-3 p-1.5 rounded bg-surface hover:bg-surfaceHover text-textMuted hover:text-textMain border border-border text-[10px] flex items-center space-x-1">
                      {copiedKey === 'viewSql' ? <Check size={12} className="text-accentBright" /> : <Copy size={12} />}
                      <span>{copiedKey === 'viewSql' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <pre className="overflow-x-auto whitespace-pre font-mono text-accentBright/90 text-xs">
                      {selectedViewObj.sql}
                    </pre>
                  </div>
                )}

                {/* EXECUTION TIMING STATS */}
                {viewData && (
                  <div className="flex items-center justify-between text-xs font-mono text-textMuted pt-1">
                    <div className="flex items-center space-x-4">
                      <span>Query: <code className="text-textMain">SELECT * FROM {selectedViewObj.name}</code></span>
                      <span className="flex items-center space-x-1 text-accentBright">
                        <Zap size={12} />
                        <span>Duration: {viewData.executionTimeMs} ms</span>
                      </span>
                    </div>
                    <span>Rows Returned: <strong className="text-textMain">{viewData.rowCount || 0}</strong></span>
                  </div>
                )}

                {/* VIEW RESULTS TABLE */}
                <div className="overflow-x-auto border border-border rounded bg-bg max-h-96">
                  {viewLoading ? (
                    <div className="p-12 text-center text-xs font-mono text-textMuted flex flex-col items-center justify-center space-y-2">
                      <RefreshCw size={20} className="animate-spin text-accentBright" />
                      <span>Querying view from MySQL 8.0...</span>
                    </div>
                  ) : viewData?.rows && viewData.rows.length > 0 ? (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-surface border-b border-border text-textMuted uppercase text-[10px] sticky top-0">
                        <tr>
                          {viewData.columns.map(col => (
                            <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {viewData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surfaceHover/30 transition">
                            {viewData.columns.map(col => (
                              <td key={col} className="p-2.5 whitespace-nowrap text-textMain">
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-textMuted italic">NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-xs font-mono text-textMuted">
                      No rows returned by view (Order book / transaction table may be empty or filtered).
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: PHASE II 16 CORE QUERIES */}
      {/* ========================================================================= */}
      {activeSubTab === 'queries' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* QUERY SELECTION SIDEBAR */}
          <div className="lg:col-span-1 space-y-3">
            <div>
              <div className="text-[10px] font-mono text-textMuted uppercase tracking-wider mb-1.5 px-1">
                Filter by Relational Concept
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                {['ALL', 'Joins', 'Aggregates', 'Subqueries'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setQueryCategoryFilter(cat)}
                    className={`py-1 px-2 rounded border text-center transition ${
                      queryCategoryFilter === cat
                        ? 'bg-accentDark/30 text-accentBright border-accentDark font-semibold'
                        : 'bg-surface border-border text-textMuted hover:text-textMain'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {filteredQueries.map(q => (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQueryId(q.id);
                    runPhase2Query(q.id);
                  }}
                  className={`w-full text-left p-2.5 rounded border text-xs font-mono transition ${
                    selectedQueryId === q.id
                      ? 'bg-surfaceHover border-accentDark text-accentBright'
                      : 'bg-surface border-border text-textMuted hover:text-textMain hover:bg-surfaceHover/50'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-accentBright">{q.id}</span>
                    <span className="text-[9px] text-textMuted uppercase">{q.category.split(' ')[0]}</span>
                  </div>
                  <div className="font-medium text-textMain text-xs truncate mt-0.5">{q.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* QUERY EXECUTION & RESULTS */}
          <div className="lg:col-span-3 space-y-4">
            {selectedQueryObj && (
              <div className="p-6 bg-surface border border-border rounded-lg space-y-4">
                
                {/* QUERY HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-accentBright text-black">
                        {selectedQueryObj.id}
                      </span>
                      <h2 className="text-lg font-bold text-textMain">{selectedQueryObj.title}</h2>
                    </div>
                    <div className="mt-2 inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-accentDark/10 border border-accentDark/30 text-xs font-mono text-accentBright">
                      <HelpCircle size={13} />
                      <span><strong>Academic Concept:</strong> {selectedQueryObj.concept}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => runPhase2Query(selectedQueryObj.id)}
                    disabled={queryLoading}
                    className="px-5 py-2 rounded bg-accentBright hover:bg-accentLight text-black font-semibold text-xs font-mono flex items-center space-x-2 transition shrink-0">
                    <Play size={13} className={queryLoading ? "animate-spin" : "fill-black"} />
                    <span>{queryLoading ? "Executing SQL..." : "Execute Query in MySQL"}</span>
                  </button>
                </div>

                {/* SQL CODE VIEWER */}
                <div className="relative p-4 bg-bg border border-border rounded font-mono text-xs">
                  <div className="flex items-center justify-between text-textMuted text-[10px] mb-2 uppercase tracking-wider">
                    <span>SQL Query (Phase II Specification)</span>
                    <button
                      onClick={() => copyToClipboard(selectedQueryObj.sql, 'querySql')}
                      className="p-1 rounded bg-surface hover:bg-surfaceHover text-textMuted hover:text-textMain border border-border flex items-center space-x-1">
                      {copiedKey === 'querySql' ? <Check size={11} className="text-accentBright" /> : <Copy size={11} />}
                      <span>{copiedKey === 'querySql' ? 'Copied' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre font-mono text-textMain/90 text-xs leading-relaxed max-h-48">
                    {selectedQueryObj.sql}
                  </pre>
                </div>

                {/* EXECUTION STATS */}
                {queryResult && (
                  <div className="flex items-center justify-between text-xs font-mono text-textMuted">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1 text-accentBright">
                        <Zap size={12} />
                        <span>Execution Time: {queryResult.executionTimeMs} ms</span>
                      </span>
                      <span>Target Engine: <strong>MySQL 8.0 (InnoDB)</strong></span>
                    </div>
                    <span>Result Set: <strong className="text-textMain">{queryResult.rowCount || 0} rows</strong></span>
                  </div>
                )}

                {/* RESULTS GRID */}
                <div className="overflow-x-auto border border-border rounded bg-bg max-h-96">
                  {queryLoading ? (
                    <div className="p-12 text-center text-xs font-mono text-textMuted flex flex-col items-center justify-center space-y-2">
                      <RefreshCw size={20} className="animate-spin text-accentBright" />
                      <span>Executing query in MySQL InnoDB engine...</span>
                    </div>
                  ) : queryResult?.rows && queryResult.rows.length > 0 ? (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-surface border-b border-border text-textMuted uppercase text-[10px] sticky top-0">
                        <tr>
                          {queryResult.columns.map(col => (
                            <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {queryResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surfaceHover/30 transition">
                            {queryResult.columns.map(col => (
                              <td key={col} className="p-2.5 whitespace-nowrap text-textMain">
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-textMuted italic">NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-xs font-mono text-textMuted">
                      Query returned 0 rows (Empty condition matched or pending counterparty orders).
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: PHASE III TRIGGERS */}
      {/* ========================================================================= */}
      {activeSubTab === 'triggers' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* TRIGGERS LIST */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-[11px] font-mono text-textMuted uppercase tracking-wider px-1">
              Active MySQL Triggers
            </div>
            <div className="space-y-1">
              {triggersList.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTriggerName(t.name)}
                  className={`w-full text-left p-3 rounded border text-xs font-mono transition ${
                    selectedTriggerName === t.name
                      ? 'bg-surfaceHover border-accentDark text-accentBright'
                      : 'bg-surface border-border text-textMuted hover:text-textMain hover:bg-surfaceHover/50'
                  }`}>
                  <div className="font-semibold text-textMain">{t.name}</div>
                  <div className="text-[10px] text-accentBright mt-1 flex items-center space-x-1">
                    <span>{t.timing} {t.event}</span>
                    <span>•</span>
                    <span>ON {t.table}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* QUICK DEMO GUIDE FOR TEACHER */}
            <div className="p-3.5 bg-bg border border-border rounded text-xs font-mono space-y-2 mt-4">
              <div className="font-bold text-accentBright text-[11px] flex items-center space-x-1.5">
                <AlertTriangle size={13} />
                <span>How to Demo Triggers</span>
              </div>
              <p className="text-[10px] text-textMuted leading-relaxed">
                <strong>1. Custody Check:</strong> Try to sell shares you do not own. Trigger <code className="text-textMain">trg_validate_sell_before_insert</code> immediately fires and halts execution with SQLSTATE 45000.
              </p>
              <p className="text-[10px] text-textMuted leading-relaxed">
                <strong>2. State Transition:</strong> When buy/sell order matches completely, <code className="text-textMain">trg_buy_order_status_update</code> detects remaining quantity 0 and automatically updates status to COMPLETED.
              </p>
              <p className="text-[10px] text-textMuted leading-relaxed">
                <strong>3. Price Discovery:</strong> Upon inserting into transactions, <code className="text-textMain">trg_after_transaction_settlement</code> updates the security's market price in the shares table.
              </p>
            </div>
          </div>

          {/* TRIGGER DETAIL & CODE */}
          <div className="lg:col-span-3 space-y-4">
            {selectedTriggerObj && (
              <div className="p-6 bg-surface border border-border rounded-lg space-y-6">
                
                {/* TRIGGER HEADER */}
                <div className="border-b border-border pb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accentDark/30 text-accentBright border border-accentDark">
                      TRIGGER
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surfaceHover border border-border text-textMain">
                      {selectedTriggerObj.timing} {selectedTriggerObj.event}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surfaceHover border border-border text-textMain">
                      ON TABLE: {selectedTriggerObj.table}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono text-textMain">{selectedTriggerObj.name}</h2>
                  <p className="text-xs font-mono text-textMuted mt-1">
                    {selectedTriggerObj.purpose}
                  </p>
                </div>

                {/* ENFORCED RULES */}
                <div>
                  <div className="text-xs font-mono text-accentBright uppercase tracking-wider mb-2 font-semibold">
                    Enforced Business Rules & Invariants:
                  </div>
                  <div className="space-y-1.5">
                    {selectedTriggerObj.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs font-mono text-textMain bg-bg p-2.5 rounded border border-border">
                        <span className="text-accentBright font-bold shrink-0">{idx + 1}.</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNDERLYING SQL TRIGGER CODE */}
                <div className="relative p-4 bg-bg border border-border rounded font-mono text-xs">
                  <div className="flex items-center justify-between text-textMuted text-[10px] mb-2 uppercase tracking-wider">
                    <span>Trigger Definition (MySQL 8.0 DDL)</span>
                    <button
                      onClick={() => copyToClipboard(selectedTriggerObj.sql, 'triggerSql')}
                      className="p-1 rounded bg-surface hover:bg-surfaceHover text-textMuted hover:text-textMain border border-border flex items-center space-x-1">
                      {copiedKey === 'triggerSql' ? <Check size={11} className="text-accentBright" /> : <Copy size={11} />}
                      <span>{copiedKey === 'triggerSql' ? 'Copied' : 'Copy Trigger DDL'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre font-mono text-accentBright/90 text-xs leading-relaxed max-h-80">
                    {selectedTriggerObj.sql}
                  </pre>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: INTERACTIVE SQL CONSOLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'terminal' && (
        <div className="space-y-4">
          <div className="p-6 bg-surface border border-border rounded-lg space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-textMain">Interactive SQL Terminal (Read-Only)</h2>
                <p className="text-xs font-mono text-textMuted mt-0.5">
                  Execute custom SELECT, SHOW, or EXPLAIN statements directly on MySQL to demonstrate schema integrity.
                </p>
              </div>

              {/* QUICK QUERY TEMPLATES */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-textMuted">Templates:</span>
                {[
                  { label: 'All Users', sql: 'SELECT user_id, name, email, role, kyc_status, shares_owned FROM users;' },
                  { label: 'Settled Trades', sql: 'SELECT * FROM vw_transaction_history;' },
                  { label: 'Order Depth', sql: 'SELECT * FROM vw_open_buy_orders;' },
                  { label: 'Market Cap', sql: 'SELECT * FROM vw_company_securities;' }
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomSql(tmpl.sql)}
                    className="px-2 py-1 bg-bg border border-border hover:border-accentDark rounded text-[10px] font-mono text-textMuted hover:text-accentBright transition">
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL EDITOR */}
            <div className="space-y-2">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={4}
                className="w-full p-3 bg-bg border border-border rounded font-mono text-xs text-textMain focus:outline-none focus:border-accentBright resize-y"
                placeholder="Type your SELECT statement here..."
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-textMuted">
                  * Read-only safety guard enforced: DDL/DML write queries disabled in console.
                </span>
                <button
                  onClick={handleRunCustomSql}
                  disabled={customLoading || !customSql.trim()}
                  className="px-6 py-2 bg-accentBright hover:bg-accentLight text-black font-semibold text-xs font-mono rounded flex items-center space-x-2 transition">
                  <Play size={13} className={customLoading ? "animate-spin" : "fill-black"} />
                  <span>{customLoading ? "Running SQL..." : "Run Query in MySQL"}</span>
                </button>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {customError && (
              <div className="p-3 bg-sellRed/10 border border-sellRed/30 rounded text-xs font-mono text-sellRed">
                SQL Execution Error: {customError}
              </div>
            )}

            {/* EXECUTION STATS */}
            {customResult && (
              <div className="flex items-center justify-between text-xs font-mono text-textMuted pt-2 border-t border-border">
                <span className="flex items-center space-x-1 text-accentBright">
                  <Zap size={12} />
                  <span>Executed in: {customResult.executionTimeMs} ms</span>
                </span>
                <span>Rows Returned: <strong className="text-textMain">{customResult.rowCount}</strong></span>
              </div>
            )}

            {/* RESULTS TABLE */}
            {customResult && (
              <div className="overflow-x-auto border border-border rounded bg-bg max-h-96">
                {customResult.rows.length > 0 ? (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-surface border-b border-border text-textMuted uppercase text-[10px] sticky top-0">
                      <tr>
                        {customResult.columns.map(col => (
                          <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {customResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surfaceHover/30 transition">
                          {customResult.columns.map(col => (
                            <td key={col} className="p-2.5 whitespace-nowrap text-textMain">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-textMuted italic">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-textMuted">
                    Query completed successfully (0 rows returned).
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
