import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import api from './services/api';
import { 
  BRAND, 
  initialUsers, 
  initialCompanies, 
  initialShares, 
  initialBuyOrders, 
  initialSellOrders, 
  initialTransactions, 
  initialESOPs, 
  initialDebentures 
} from './data/mockData';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  Layers, 
  ShieldCheck, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  Terminal,
  LogOut,
  RefreshCw,
  Database
} from 'lucide-react';

export default function App() {
  // Navigation & View Flow
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'terminal'
  const [authModal, setAuthModal] = useState(null); // null | 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(initialUsers[0]);

  // State mapped strictly to the 8 MySQL Tables
  const [companies, setCompanies] = useState(initialCompanies);
  const [shares, setShares] = useState(initialShares);
  const [buyOrders, setBuyOrders] = useState(initialBuyOrders);
  const [sellOrders, setSellOrders] = useState(initialSellOrders);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [esops, setESOPs] = useState(initialESOPs);
  const [debentures, setDebentures] = useState(initialDebentures);

  // Loading & status states
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Form states for Buy & Sell
  const [selectedShareId, setSelectedShareId] = useState(1);
  const [orderQty, setOrderQty] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);
  const [orderErrorMsg, setOrderErrorMsg] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Search filter & Company detail view
  const [searchTerm, setSearchTerm] = useState('');
  const [viewCompany, setViewCompany] = useState(null);

  // Helper getters
  const getCompany = (companyId) => companies.find(c => Number(c.company_id) === Number(companyId)) || {};
  const getShare = (shareId) => shares.find(s => Number(s.share_id) === Number(shareId)) || {};

  const activeSelectedShare = getShare(selectedShareId);

  // Centralized Data Fetcher from MySQL Backend
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        companiesRes,
        sharesRes,
        buysRes,
        sellsRes,
        txnsRes,
        esopsRes,
        debRes
      ] = await Promise.all([
        api.getCompanies().catch(() => null),
        api.getShares().catch(() => null),
        api.getBuyOrders().catch(() => null),
        api.getSellOrders().catch(() => null),
        api.getTransactions().catch(() => null),
        api.getESOPs().catch(() => null),
        api.getDebentures().catch(() => null)
      ]);

      if (companiesRes) setCompanies(companiesRes);
      if (sharesRes) setShares(sharesRes);
      if (buysRes) setBuyOrders(buysRes);
      if (sellsRes) setSellOrders(sellsRes);
      if (txnsRes) setTransactions(txnsRes);
      if (esopsRes) setESOPs(esopsRes);
      if (debRes) setDebentures(debRes);

      setDbConnected(Boolean(companiesRes && sharesRes));
      setLastRefreshed(new Date().toLocaleTimeString());

      // Refresh current user holdings if logged in
      if (currentUser?.user_id) {
        const userRes = await api.getUserProfile(currentUser.user_id).catch(() => null);
        if (userRes) {
          setCurrentUser(prev => ({ ...prev, ...userRes }));
        }
      }
    } catch (err) {
      console.warn("Failed to connect to MySQL backend, keeping cached state:", err);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.user_id]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Order Matching Engine (Connected to MySQL ACID Backend)
  const executeMatching = async () => {
    try {
      setLoading(true);
      const result = await api.matchOrders();
      await loadAllData();
      alert(`MATCH SUCCESS: ${result.message}`);
    } catch (err) {
      console.error("Match error:", err);
      alert(`Matching engine message: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Place Buy Order -> MySQL API
  const handlePlaceBuy = async (e) => {
    e.preventDefault();
    setOrderSuccessMsg(null);
    setOrderErrorMsg(null);

    if (!orderQty || !orderPrice) {
      setOrderErrorMsg("Please enter both quantity and price");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await api.placeBuyOrder({
        user_id: currentUser ? currentUser.user_id : 1,
        share_id: parseInt(selectedShareId),
        quantity: parseInt(orderQty),
        price: parseFloat(orderPrice)
      });

      setOrderSuccessMsg(res.message || `Buy order placed successfully (Order #${res.buy_id})`);
      setOrderQty('');
      await loadAllData();
    } catch (err) {
      setOrderErrorMsg(err.message || "Failed to place buy order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Place Sell Order -> MySQL API
  const handlePlaceSell = async (e) => {
    e.preventDefault();
    setOrderSuccessMsg(null);
    setOrderErrorMsg(null);

    if (!orderQty || !orderPrice) {
      setOrderErrorMsg("Please enter both quantity and price");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await api.placeSellOrder({
        user_id: currentUser ? currentUser.user_id : 1,
        share_id: parseInt(selectedShareId),
        quantity: parseInt(orderQty),
        price: parseFloat(orderPrice)
      });

      setOrderSuccessMsg(res.message || `Sell order placed successfully (Order #${res.sell_id})`);
      setOrderQty('');
      await loadAllData();
    } catch (err) {
      setOrderErrorMsg(err.message || "Failed to place sell order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Cancel Buy Order
  const handleCancelBuy = async (userId, buyId) => {
    if (!window.confirm(`Are you sure you want to cancel Buy Order #${buyId}?`)) return;
    try {
      await api.cancelBuyOrder(userId, buyId);
      await loadAllData();
    } catch (err) {
      alert(`Failed to cancel: ${err.message}`);
    }
  };

  // Cancel Sell Order
  const handleCancelSell = async (userId, sellId) => {
    if (!window.confirm(`Are you sure you want to cancel Sell Order #${sellId}?`)) return;
    try {
      await api.cancelSellOrder(userId, sellId);
      await loadAllData();
    } catch (err) {
      alert(`Failed to cancel: ${err.message}`);
    }
  };

  // IF ON HERO LANDING VIEW
  if (activeView === 'landing') {
    return (
      <>
        <LandingPage 
          onOpenAuth={(mode) => setAuthModal(mode)}
          onExploreAsGuest={() => {
            setCurrentUser(initialUsers[0]);
            setActiveView('terminal');
          }}
        />

        {authModal && (
          <AuthModal 
            initialMode={authModal}
            onClose={() => setAuthModal(null)}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              setAuthModal(null);
              setActiveView('terminal');
              loadAllData();
            }}
          />
        )}
      </>
    );
  }

  // Calculate user total portfolio value
  const userShare = shares.find(s => Number(s.share_id) === Number(currentUser?.share_id));
  const userHoldingValue = (currentUser?.shares_owned || 0) * (userShare ? Number(userShare.current_price) : 250);

  // IF INSIDE TRADING TERMINAL VIEW
  return (
    <div className="flex min-h-screen bg-bg text-textMain selection:bg-accentDark selection:text-white">
      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Terminal Name */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded border border-border bg-surfaceHover flex items-center justify-center text-accentBright font-bold text-xl">
                {BRAND.symbol}
              </div>
              <div>
                <div className="font-semibold text-lg tracking-wider text-textMain">{BRAND.name}</div>
                <div className="text-[10px] text-textMuted uppercase tracking-widest">OTC Terminal</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6">
            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold text-textMuted uppercase tracking-wider">Overview</div>
              <div className="space-y-1">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setViewCompany(null); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('market'); setViewCompany(null); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'market' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <TrendingUp size={16} />
                  <span>Market</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('holdings'); setViewCompany(null); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'holdings' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <Briefcase size={16} />
                  <span>Holdings</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold text-textMuted uppercase tracking-wider">Trading</div>
              <div className="space-y-1">
                <button 
                  onClick={() => { setActiveTab('buy'); setOrderSuccessMsg(null); setOrderErrorMsg(null); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'buy' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <ArrowDownLeft size={16} />
                  <span>Buy Security</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('sell'); setOrderSuccessMsg(null); setOrderErrorMsg(null); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'sell' ? 'bg-surfaceHover text-sellRed border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <ArrowUpRight size={16} />
                  <span>Sell Security</span>
                </button>
                <button 
                  onClick={() => setActiveTab('matching')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'matching' ? 'bg-accentDark/40 text-accentBright border border-accentDark' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <Repeat size={16} />
                  <span>Order Matching</span>
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'transactions' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <FileText size={16} />
                  <span>Transactions</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold text-textMuted uppercase tracking-wider">Securities</div>
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('esops')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'esops' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <Layers size={16} />
                  <span>ESOPs</span>
                </button>
                <button 
                  onClick={() => setActiveTab('debentures')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'debentures' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <ShieldCheck size={16} />
                  <span>Debentures</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User Profile & Exit Button */}
        <div className="p-4 border-t border-border bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-sm font-medium text-textMain truncate">{currentUser?.name || "Kapil Sharma"}</div>
              <div className="text-xs text-textMuted">{currentUser?.role || "Investor"} • User #{currentUser?.user_id}</div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border border-accentDark text-accentBright bg-accentDark/20 shrink-0">
              ● {currentUser?.kyc_status || "VERIFIED"}
            </span>
          </div>

          <button 
            onClick={() => setActiveView('landing')}
            className="w-full py-1.5 px-3 rounded border border-border hover:border-sellRed hover:text-sellRed text-xs font-mono text-textMuted flex items-center justify-center space-x-2 transition bg-bg">
            <LogOut size={12} />
            <span>EXIT TERMINAL</span>
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN TERMINAL BODY ----------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-border bg-surface px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-textMuted">TERMINAL // </span>
            <span className="text-xs font-mono text-accentBright tracking-wider uppercase">{activeTab}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono border border-border px-3 py-1 rounded bg-bg">
              <Database size={13} className={dbConnected ? "text-accentBright" : "text-sellRed"} />
              <span className="text-textMuted hidden sm:inline">DATABASE:</span>
              <span className="text-textMain font-semibold">MySQL 8.0</span>
              <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-accentBright" : "bg-sellRed"} animate-pulse`}></span>
            </div>

            <button 
              onClick={loadAllData}
              disabled={loading}
              title="Refresh all data from MySQL"
              className="p-1.5 rounded border border-border hover:border-accentDark hover:text-accentBright transition text-textMuted bg-bg flex items-center space-x-1.5 text-xs font-mono">
              <RefreshCw size={13} className={loading ? "animate-spin text-accentBright" : ""} />
              <span className="hidden sm:inline">{lastRefreshed ? lastRefreshed : "Refresh"}</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">
                  Good evening, {currentUser?.name?.split(' ')[0] || "Kapil"}.
                </h1>
                <p className="text-sm text-textMuted mt-1">Live market overview and portfolio summary</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Total Holdings Value</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    ₹{userHoldingValue.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-mono text-accentBright mt-1">
                    {currentUser?.shares_owned || 0} Shares in custody
                  </div>
                </div>
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Active Buy Orders</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    {String(buyOrders.filter(b => b.buy_status === 'PENDING' || b.buy_status === 'PARTIAL').length).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-mono text-textMuted mt-1">Open bids awaiting match</div>
                </div>
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Active Sell Orders</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    {String(sellOrders.filter(s => s.sell_status === 'PENDING' || s.sell_status === 'PARTIAL').length).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-mono text-textMuted mt-1">Open asks on order book</div>
                </div>
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Settled Transactions</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    {String(transactions.length).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-mono text-accentBright mt-1">Recorded on exchange ledger</div>
                </div>
              </div>

              {/* Market Overview Table */}
              <div className="border border-border rounded bg-surface overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wider text-textMain uppercase">Market Securities Overview</h3>
                  <button onClick={() => setActiveTab('market')} className="text-xs text-textMuted hover:text-accentBright flex items-center space-x-1 font-mono">
                    <span>View all securities</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Security</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-right">Available Shares</th>
                      <th className="p-4 text-right">Market Cap</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {shares.slice(0, 4).map((s) => {
                      const comp = getCompany(s.company_id);
                      return (
                        <tr key={s.share_id} className="hover:bg-surfaceHover transition">
                          <td className="p-4 font-sans font-medium text-textMain">{comp.company_name || `Company #${s.company_id}`}</td>
                          <td className="p-4 text-textMuted">{s.share_type}</td>
                          <td className="p-4 text-right font-semibold text-textMain">₹{Number(s.current_price).toFixed(2)}</td>
                          <td className="p-4 text-right text-textMuted">{Number(s.available_shares).toLocaleString()}</td>
                          <td className="p-4 text-right text-accentBright">
                            ₹{(Number(s.total_shares) * Number(s.current_price)).toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => { setViewCompany(comp); setActiveTab('company'); }}
                              className="px-3 py-1 rounded text-xs border border-border hover:border-accentDark hover:text-accentBright transition font-sans">
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Recent Transactions Table */}
              <div className="border border-border rounded bg-surface overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wider text-textMain uppercase">Recent Transactions</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-xs text-textMuted hover:text-accentBright flex items-center space-x-1 font-mono">
                    <span>Full Ledger</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Txn ID</th>
                      <th className="p-4">Company</th>
                      <th className="p-4">Buyer / Seller</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-right">Value</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {transactions.length > 0 ? (
                      transactions.slice(0, 4).map((t) => {
                        const comp = getCompany(getShare(t.share_id).company_id);
                        return (
                          <tr key={t.transaction_id} className="hover:bg-surfaceHover transition">
                            <td className="p-4 text-accentBright">TXN-{t.transaction_id}</td>
                            <td className="p-4 font-sans text-textMain">{t.company_name || comp.company_name}</td>
                            <td className="p-4 text-textMuted text-xs font-sans">
                              {t.buyer_name || `Buyer #${t.buyer_id}`} ⇄ {t.seller_name || `Seller #${t.seller_id}`}
                            </td>
                            <td className="p-4 text-right text-textMain">{t.quantity}</td>
                            <td className="p-4 text-right text-textMain">₹{Number(t.price).toFixed(2)}</td>
                            <td className="p-4 text-right text-accentBright font-semibold">
                              ₹{(Number(t.quantity) * Number(t.price)).toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] border border-accentDark text-accentBright bg-accentDark/20 font-sans">
                                COMPLETED
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-textMuted font-sans text-xs">
                          No transactions recorded yet. Match buy & sell orders to execute real trades on the ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MARKET TAB */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Market Directory</h1>
                <p className="text-sm text-textMuted mt-1">Available unlisted securities in the MySQL database</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3 top-3 text-textMuted" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search company or sector..."
                    className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded text-sm focus:outline-none focus:border-accentDark text-textMain placeholder:text-textMuted"
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono text-textMuted">
                  <SlidersHorizontal size={14} />
                  <span>TOTAL SECURITIES: {shares.length}</span>
                </div>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Sector</th>
                      <th className="p-4">Security Type</th>
                      <th className="p-4 text-right">Current Price</th>
                      <th className="p-4 text-right">Available Units</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shares
                      .filter(s => {
                        const comp = getCompany(s.company_id);
                        const cName = comp.company_name || s.company_name || '';
                        const cSec = comp.sector || s.sector || '';
                        return cName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               cSec.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((s) => {
                        const comp = getCompany(s.company_id);
                        return (
                          <tr key={s.share_id} className="hover:bg-surfaceHover transition">
                            <td className="p-4 font-medium text-textMain">{comp.company_name || s.company_name}</td>
                            <td className="p-4 text-textMuted text-xs">{comp.sector || s.sector}</td>
                            <td className="p-4 text-textMuted text-xs">{s.share_type}</td>
                            <td className="p-4 text-right font-mono font-semibold text-textMain">₹{Number(s.current_price).toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-textMuted">{Number(s.available_shares).toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-border bg-bg text-accentBright">
                                {comp.company_status || 'Active'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button 
                                onClick={() => { setViewCompany(comp); setActiveTab('company'); }}
                                className="px-2.5 py-1 text-xs border border-border hover:border-textMuted rounded transition">
                                VIEW
                              </button>
                              <button 
                                onClick={() => { setSelectedShareId(s.share_id); setOrderPrice(s.current_price); setActiveTab('buy'); }}
                                className="px-2.5 py-1 text-xs border border-accentDark text-accentBright bg-accentDark/20 hover:bg-accentDark/40 rounded transition">
                                BUY
                              </button>
                              <button 
                                onClick={() => { setSelectedShareId(s.share_id); setOrderPrice(s.current_price); setActiveTab('sell'); }}
                                className="px-2.5 py-1 text-xs border border-sellDark text-sellRed bg-sellDark/20 hover:bg-sellDark/40 rounded transition">
                                SELL
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPANY SPEC TAB */}
          {activeTab === 'company' && viewCompany && (
            <div className="space-y-6 max-w-4xl">
              <button 
                onClick={() => setActiveTab('market')}
                className="text-xs font-mono text-textMuted hover:text-accentBright flex items-center space-x-1">
                <span>← Back to Market</span>
              </button>

              <div className="border border-border rounded bg-surface p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-border pb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-textMain">{viewCompany.company_name}</h1>
                    <div className="text-sm text-textMuted mt-1">{viewCompany.sector} • Founded {viewCompany.founded_year}</div>
                  </div>
                  <span className="px-3 py-1 rounded text-xs font-mono border border-accentDark text-accentBright bg-accentDark/20">
                    STATUS: {(viewCompany.company_status || 'Active').toUpperCase()}
                  </span>
                </div>

                {(() => {
                  const s = shares.find(sh => Number(sh.company_id) === Number(viewCompany.company_id)) || {};
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">CURRENT PRICE</div>
                          <div className="text-2xl font-mono font-semibold text-textMain mt-1">₹{Number(s.current_price || 0).toFixed(2)}</div>
                        </div>
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">FACE VALUE</div>
                          <div className="text-2xl font-mono font-semibold text-textMain mt-1">₹{Number(s.face_value || 10).toFixed(2)}</div>
                        </div>
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">AVAILABLE UNITS</div>
                          <div className="text-2xl font-mono font-semibold text-textMain mt-1">{Number(s.available_shares || 0).toLocaleString()}</div>
                        </div>
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">SECURITY TYPE</div>
                          <div className="text-sm font-mono font-medium text-textMain mt-2">{s.share_type || 'Equity'}</div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="text-xs font-mono text-textMuted uppercase mb-1">Company Description</div>
                        <p className="text-sm text-textMuted leading-relaxed">{viewCompany.description || 'Private securities issuer registered on VALENCE-X terminal.'}</p>
                      </div>

                      <div className="flex space-x-4 pt-4">
                        <button 
                          onClick={() => { setSelectedShareId(s.share_id); setOrderPrice(s.current_price); setActiveTab('buy'); }}
                          className="flex-1 py-3 text-sm font-semibold rounded bg-accentBright text-bg hover:opacity-90 transition font-sans">
                          BUY {viewCompany.company_name}
                        </button>
                        <button 
                          onClick={() => { setSelectedShareId(s.share_id); setOrderPrice(s.current_price); setActiveTab('sell'); }}
                          className="flex-1 py-3 text-sm font-semibold rounded border border-border bg-surfaceHover hover:border-sellRed hover:text-sellRed transition font-sans">
                          SELL {viewCompany.company_name}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* BUY TICKET */}
          {activeTab === 'buy' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">BUY SECURITY</h1>
                <p className="text-sm text-textMuted mt-1">Submit purchase bid to the MySQL `buy` weak entity table</p>
              </div>

              {orderSuccessMsg && (
                <div className="p-4 rounded border border-accentDark bg-accentDark/20 text-accentBright text-sm flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>{orderSuccessMsg}</span>
                </div>
              )}

              {orderErrorMsg && (
                <div className="p-4 rounded border border-sellRed bg-sellDark/30 text-sellRed text-sm flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{orderErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handlePlaceBuy} className="border border-border rounded bg-surface p-6 space-y-5">
                <div>
                  <label className="block text-xs font-mono text-textMuted uppercase mb-2">Company & Security</label>
                  <select 
                    value={selectedShareId} 
                    onChange={(e) => {
                      setSelectedShareId(e.target.value);
                      const sh = getShare(parseInt(e.target.value));
                      if (sh.current_price) setOrderPrice(sh.current_price);
                    }}
                    className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-accentDark">
                    {shares.map(s => {
                      const comp = getCompany(s.company_id);
                      return (
                        <option key={s.share_id} value={s.share_id}>
                          {comp.company_name || s.company_name} - {s.share_type} (Current Price: ₹{s.current_price})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-border rounded bg-bg">
                    <div className="text-[10px] font-mono text-textMuted">AVAILABLE SHARES</div>
                    <div className="text-base font-mono font-medium text-textMain mt-1">
                      {Number(activeSelectedShare.available_shares || 0).toLocaleString()} Units
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded bg-bg">
                    <div className="text-[10px] font-mono text-textMuted">FACE VALUE</div>
                    <div className="text-base font-mono font-medium text-textMain mt-1">
                      ₹{Number(activeSelectedShare.face_value || 10).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-textMuted uppercase mb-2">Quantity (Units)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full bg-bg border border-border rounded px-4 py-2 text-sm font-mono text-textMain focus:outline-none focus:border-accentDark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-textMuted uppercase mb-2">Limit Bid Price (₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      min="1"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full bg-bg border border-border rounded px-4 py-2 text-sm font-mono text-textMain focus:outline-none focus:border-accentDark"
                    />
                  </div>
                </div>

                <div className="p-4 border border-border rounded bg-bg flex justify-between items-center">
                  <span className="text-xs font-mono text-textMuted uppercase">Estimated Consideration</span>
                  <span className="text-xl font-mono font-bold text-accentBright">
                    ₹{((parseInt(orderQty) || 0) * (parseFloat(orderPrice) || 0)).toLocaleString()}
                  </span>
                </div>

                <button 
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3 rounded text-sm font-semibold bg-accentBright text-bg hover:opacity-90 transition disabled:opacity-50 font-mono">
                  {submittingOrder ? "SUBMITTING TO MYSQL..." : "PLACE BUY ORDER"}
                </button>
              </form>
            </div>
          )}

          {/* SELL TICKET */}
          {activeTab === 'sell' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">SELL SECURITY</h1>
                <p className="text-sm text-textMuted mt-1">List securities owned in custody onto the MySQL `sell` table</p>
              </div>

              {orderSuccessMsg && (
                <div className="p-4 rounded border border-border bg-surfaceHover text-textMain text-sm flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-accentBright" />
                  <span>{orderSuccessMsg}</span>
                </div>
              )}

              {orderErrorMsg && (
                <div className="p-4 rounded border border-sellRed bg-sellDark/30 text-sellRed text-sm flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{orderErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handlePlaceSell} className="border border-border rounded bg-surface p-6 space-y-5">
                <div>
                  <label className="block text-xs font-mono text-textMuted uppercase mb-2">Security</label>
                  <select 
                    value={selectedShareId} 
                    onChange={(e) => {
                      setSelectedShareId(e.target.value);
                      const sh = getShare(parseInt(e.target.value));
                      if (sh.current_price) setOrderPrice(sh.current_price);
                    }}
                    className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-accentDark">
                    {shares.map(s => {
                      const comp = getCompany(s.company_id);
                      return (
                        <option key={s.share_id} value={s.share_id}>
                          {comp.company_name || s.company_name} - {s.share_type}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="p-3 border border-border rounded bg-bg flex justify-between items-center">
                  <div className="text-xs font-mono text-textMuted uppercase">YOUR CUSTODY HOLDING</div>
                  <div className="text-sm font-mono font-semibold text-textMain">{currentUser?.shares_owned || 0} Units</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-textMuted uppercase mb-2">Sell Quantity</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-bg border border-border rounded px-4 py-2 text-sm font-mono text-textMain focus:outline-none focus:border-sellRed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-textMuted uppercase mb-2">Target Ask Price (₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      min="1"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full bg-bg border border-border rounded px-4 py-2 text-sm font-mono text-textMain focus:outline-none focus:border-sellRed"
                    />
                  </div>
                </div>

                <div className="p-4 border border-border rounded bg-bg flex justify-between items-center">
                  <span className="text-xs font-mono text-textMuted uppercase">Estimated Liquidation Value</span>
                  <span className="text-xl font-mono font-bold text-textMain">
                    ₹{((parseInt(orderQty) || 0) * (parseFloat(orderPrice) || 0)).toLocaleString()}
                  </span>
                </div>

                <button 
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3 rounded text-sm font-semibold border border-sellRed text-sellRed bg-sellDark/30 hover:bg-sellDark/60 transition disabled:opacity-50 font-mono">
                  {submittingOrder ? "SUBMITTING TO MYSQL..." : "PLACE SELL ORDER"}
                </button>
              </form>
            </div>
          )}

          {/* ORDER MATCHING TAB */}
          {activeTab === 'matching' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-textMain">Order Matching Demonstration</h1>
                  <p className="text-sm text-textMuted mt-1">Live MySQL ACID transaction engine clearing buy/sell orders</p>
                </div>
                <button 
                  onClick={executeMatching}
                  disabled={loading}
                  className="px-6 py-2.5 rounded text-sm font-semibold bg-accentBright text-bg hover:opacity-90 transition font-mono flex items-center space-x-2 disabled:opacity-50">
                  <Repeat size={16} className={loading ? "animate-spin" : ""} />
                  <span>EXECUTE MATCH ENGINE</span>
                </button>
              </div>

              {/* Viva Walkthrough */}
              <div className="p-6 border border-border rounded bg-surface space-y-4">
                <div className="text-xs font-mono text-textMuted uppercase tracking-wider flex items-center space-x-2">
                  <Terminal size={14} className="text-accentBright" />
                  <span>Relational Schema Workflow Walkthrough</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="p-4 border border-border rounded bg-bg text-center">
                    <div className="text-xs font-mono text-textMuted">1. PENDING BUY ORDERS</div>
                    <div className="text-lg font-mono font-semibold text-textMain mt-1">
                      {buyOrders.filter(b => b.buy_status === 'PENDING' || b.buy_status === 'PARTIAL').length} Bids Open
                    </div>
                    <div className="text-[11px] text-textMuted mt-1">Table: buy (`user_id`, `buy_id`, `price`)</div>
                  </div>

                  <div className="text-center font-mono text-accentBright text-sm">
                    ── [ MATCH: share_id & buy.price ≥ sell.price ] ──▶
                  </div>

                  <div className="p-4 border border-border rounded bg-bg text-center">
                    <div className="text-xs font-mono text-textMuted">2. PENDING SELL ORDERS</div>
                    <div className="text-lg font-mono font-semibold text-textMain mt-1">
                      {sellOrders.filter(s => s.sell_status === 'PENDING' || s.sell_status === 'PARTIAL').length} Asks Open
                    </div>
                    <div className="text-[11px] text-textMuted mt-1">Table: sell (`user_id`, `sell_id`, `price`)</div>
                  </div>
                </div>
              </div>

              {/* Order Books */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border rounded bg-surface">
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-mono uppercase text-accentBright font-semibold">BUY ORDER QUEUE (TABLE: BUY)</span>
                    <span className="text-xs font-mono text-textMuted">{buyOrders.length} records</span>
                  </div>
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-bg text-textMuted border-b border-border">
                      <tr>
                        <th className="p-3">Buy ID</th>
                        <th className="p-3">Buyer</th>
                        <th className="p-3">Security</th>
                        <th className="p-3 text-right">Bid Price</th>
                        <th className="p-3 text-right">Rem. Qty</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {buyOrders.length > 0 ? (
                        buyOrders.map(b => (
                          <tr key={`${b.user_id}-${b.buy_id}`}>
                            <td className="p-3 text-textMuted">#{b.buy_id}</td>
                            <td className="p-3 text-textMain font-sans">{b.buyer_name || `User #${b.user_id}`}</td>
                            <td className="p-3 text-textMain font-sans">{b.company_name || getCompany(getShare(b.share_id).company_id).company_name}</td>
                            <td className="p-3 text-right text-accentBright">₹{Number(b.price).toFixed(2)}</td>
                            <td className="p-3 text-right text-textMain">{b.remaining_quantity}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${b.buy_status === 'COMPLETED' ? 'text-accentBright border border-accentDark' : b.buy_status === 'PARTIAL' ? 'text-amber-400 border border-amber-600' : 'text-textMuted border border-border'}`}>
                                {b.buy_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-textMuted font-sans text-xs">
                            No open bids in the buy queue. Submit a Buy order to populate this queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border border-border rounded bg-surface">
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-mono uppercase text-sellRed font-semibold">SELL ORDER QUEUE (TABLE: SELL)</span>
                    <span className="text-xs font-mono text-textMuted">{sellOrders.length} records</span>
                  </div>
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-bg text-textMuted border-b border-border">
                      <tr>
                        <th className="p-3">Sell ID</th>
                        <th className="p-3">Seller</th>
                        <th className="p-3">Security</th>
                        <th className="p-3 text-right">Ask Price</th>
                        <th className="p-3 text-right">Rem. Qty</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sellOrders.length > 0 ? (
                        sellOrders.map(s => (
                          <tr key={`${s.user_id}-${s.sell_id}`}>
                            <td className="p-3 text-textMuted">#{s.sell_id}</td>
                            <td className="p-3 text-textMain font-sans">{s.seller_name || `User #${s.user_id}`}</td>
                            <td className="p-3 text-textMain font-sans">{s.company_name || getCompany(getShare(s.share_id).company_id).company_name}</td>
                            <td className="p-3 text-right text-sellRed">₹{Number(s.price).toFixed(2)}</td>
                            <td className="p-3 text-right text-textMain">{s.remaining_quantity}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${s.sell_status === 'COMPLETED' ? 'text-accentBright border border-accentDark' : s.sell_status === 'PARTIAL' ? 'text-amber-400 border border-amber-600' : 'text-textMuted border border-border'}`}>
                                {s.sell_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-textMuted font-sans text-xs">
                            No open asks in the sell queue. Submit a Sell order to populate this queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HOLDINGS TAB */}
          {activeTab === 'holdings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Custody Holdings</h1>
                <p className="text-sm text-textMuted mt-1">Beneficiary share position registered under User #{currentUser?.user_id || 1} ({currentUser?.name})</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Security Type</th>
                      <th className="p-4 text-right">Quantity Owned</th>
                      <th className="p-4 text-right">Current Price</th>
                      <th className="p-4 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {currentUser?.shares_owned > 0 ? (
                      <tr className="hover:bg-surfaceHover">
                        <td className="p-4 font-sans font-medium text-textMain">{userShare?.company_name || getCompany(userShare?.company_id).company_name || 'NovaTech Innovations'}</td>
                        <td className="p-4 text-textMuted">{userShare?.share_type || 'Equity'}</td>
                        <td className="p-4 text-right text-textMain font-semibold">{currentUser.shares_owned}</td>
                        <td className="p-4 text-right text-textMain">₹{Number(userShare?.current_price || 250).toFixed(2)}</td>
                        <td className="p-4 text-right font-semibold text-accentBright">
                          ₹{userHoldingValue.toLocaleString()}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-textMuted">
                          No shares currently registered in custody for this user. Place a Buy order to acquire shares.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Transaction Ledger</h1>
                <p className="text-sm text-textMuted mt-1">Immutable settlement audit ledger (Table: transactions)</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-bg text-textMuted text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Txn ID</th>
                      <th className="p-4 font-sans">Company</th>
                      <th className="p-4">Buyer (Buy ID)</th>
                      <th className="p-4">Seller (Sell ID)</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4 text-right">Execution Price</th>
                      <th className="p-4 text-right">Total Value</th>
                      <th className="p-4">Settled At</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {transactions.length > 0 ? (
                      transactions.map(t => {
                        const comp = getCompany(getShare(t.share_id).company_id);
                        return (
                          <tr key={t.transaction_id} className="hover:bg-surfaceHover">
                            <td className="p-4 text-accentBright font-semibold">TXN-{t.transaction_id}</td>
                            <td className="p-4 font-sans text-sm text-textMain">{t.company_name || comp.company_name}</td>
                            <td className="p-4 text-textMuted font-sans">
                              {t.buyer_name || `User #${t.buyer_id}`} (#{t.buy_id})
                            </td>
                            <td className="p-4 text-textMuted font-sans">
                              {t.seller_name || `User #${t.seller_id}`} (#{t.sell_id})
                            </td>
                            <td className="p-4 text-right text-textMain font-medium">{t.quantity}</td>
                            <td className="p-4 text-right text-textMain">₹{Number(t.price).toFixed(2)}</td>
                            <td className="p-4 text-right text-accentBright font-semibold">
                              ₹{(Number(t.quantity) * Number(t.price)).toLocaleString()}
                            </td>
                            <td className="p-4 text-textMuted">{t.transaction_time}</td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] border border-accentDark text-accentBright bg-accentDark/20">
                                COMPLETED
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-textMuted font-sans text-xs">
                          No settled trades yet. Once an order match occurs, an immutable transaction record will appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ESOPS TAB */}
          {activeTab === 'esops' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Employee Stock Options (ESOPs)</h1>
                <p className="text-sm text-textMuted mt-1">Corporate option grant register (Table: esops)</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Grant ID</th>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Company</th>
                      <th className="p-4 text-right font-mono">Options</th>
                      <th className="p-4 text-right font-mono">Strike Price</th>
                      <th className="p-4">Vesting Period</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 font-mono">Grant Date</th>
                      <th className="p-4 font-mono">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {esops.map(e => {
                      const comp = getCompany(e.company_id);
                      return (
                        <tr key={e.esop_id} className="hover:bg-surfaceHover">
                          <td className="p-4 font-mono text-xs text-accentBright">ESOP-{e.esop_id}</td>
                          <td className="p-4 text-sm font-medium text-textMain">{e.employee_name || `User #${e.user_id}`}</td>
                          <td className="p-4 text-sm text-textMuted">{e.company_name || comp.company_name}</td>
                          <td className="p-4 text-right font-mono text-textMain">{Number(e.number_of_options).toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-accentBright">₹{Number(e.exercise_price).toFixed(2)}</td>
                          <td className="p-4 text-xs text-textMuted">{e.vesting_period}</td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-border bg-bg text-textMain">
                              {e.exercise_status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-textMuted">{e.grant_date}</td>
                          <td className="p-4 font-mono text-xs text-textMuted">{e.expiry_date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEBENTURES TAB */}
          {activeTab === 'debentures' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Debentures & Debt Instruments</h1>
                <p className="text-sm text-textMuted mt-1">Fixed income corporate bonds (Table: debentures)</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Debenture Name</th>
                      <th className="p-4 text-right font-mono">Face Value</th>
                      <th className="p-4 text-right font-mono">Coupon Rate</th>
                      <th className="p-4 text-right font-mono">Issue Quantity</th>
                      <th className="p-4 font-mono">Issue Date</th>
                      <th className="p-4 font-mono">Maturity Date</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {debentures.map(d => {
                      const comp = getCompany(d.company_id);
                      return (
                        <tr key={d.debenture_id} className="hover:bg-surfaceHover">
                          <td className="p-4 font-medium text-textMain">{d.company_name || comp.company_name}</td>
                          <td className="p-4 text-xs text-textMuted font-mono">{d.debenture_name}</td>
                          <td className="p-4 text-right font-mono text-textMain">₹{Number(d.face_value).toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-accentBright font-semibold">{d.interest_rate}%</td>
                          <td className="p-4 text-right font-mono text-textMuted">{Number(d.issue_quantity).toLocaleString()}</td>
                          <td className="p-4 font-mono text-xs text-textMuted">{d.issue_date}</td>
                          <td className="p-4 font-mono text-xs text-textMuted">{d.maturity_date}</td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-accentDark text-accentBright bg-accentDark/20">
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
