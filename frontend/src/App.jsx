import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
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
  SlidersHorizontal,
  ChevronRight,
  Terminal,
  LogOut
} from 'lucide-react';

export default function App() {
  // Navigation & View Flow
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'terminal'
  const [authModal, setAuthModal] = useState(null); // null | 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(initialUsers[0]);

  // State mapped strictly to the 8 MySQL Tables
  const [companies] = useState(initialCompanies);
  const [shares] = useState(initialShares);
  const [buyOrders, setBuyOrders] = useState(initialBuyOrders);
  const [sellOrders, setSellOrders] = useState(initialSellOrders);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [esops] = useState(initialESOPs);
  const [debentures] = useState(initialDebentures);

  // Form states for Buy & Sell
  const [selectedShareId, setSelectedShareId] = useState(1);
  const [orderQty, setOrderQty] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);

  // Search filter & Company detail view
  const [searchTerm, setSearchTerm] = useState('');
  const [viewCompany, setViewCompany] = useState(null);

  // Helper getters
  const getCompany = (companyId) => companies.find(c => c.company_id === companyId) || {};
  const getShare = (shareId) => shares.find(s => s.share_id === shareId) || {};

  const activeSelectedShare = getShare(selectedShareId);
  const currentCompany = getCompany(activeSelectedShare.company_id);

  // Order Matching Engine (Viva highlight)
  const executeMatching = () => {
    let pendingBuys = [...buyOrders.filter(b => b.buy_status === 'PENDING' || b.buy_status === 'PARTIAL')];
    let pendingSells = [...sellOrders.filter(s => s.sell_status === 'PENDING' || s.sell_status === 'PARTIAL')];
    let newTransactions = [];

    let updatedBuys = [...buyOrders];
    let updatedSells = [...sellOrders];

    for (let sell of pendingSells) {
      if (sell.remaining_quantity <= 0) continue;

      for (let buy of pendingBuys) {
        if (buy.remaining_quantity <= 0) continue;

        if (buy.share_id === sell.share_id && buy.price >= sell.price) {
          const matchQty = Math.min(buy.remaining_quantity, sell.remaining_quantity);
          const executionPrice = sell.price;

          buy.remaining_quantity -= matchQty;
          sell.remaining_quantity -= matchQty;

          buy.buy_status = buy.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIAL';
          sell.sell_status = sell.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIAL';

          const txn = {
            transaction_id: 5000 + transactions.length + newTransactions.length + 1,
            buy_id: buy.buy_id,
            sell_id: sell.sell_id,
            share_id: buy.share_id,
            quantity: matchQty,
            price: executionPrice,
            transaction_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
          newTransactions.push(txn);

          if (sell.remaining_quantity === 0) break;
        }
      }
    }

    if (newTransactions.length > 0) {
      setTransactions([...newTransactions, ...transactions]);
      setBuyOrders(updatedBuys);
      setSellOrders(updatedSells);
      alert(`MATCH SUCCESS: ${newTransactions.length} transaction(s) executed and settled.`);
    } else {
      alert("No matching bids and asks found at compatible prices.");
    }
  };

  // Order Placements
  const handlePlaceBuy = (e) => {
    e.preventDefault();
    if (!orderQty || !orderPrice) return;
    const newBuy = {
      buy_id: 100 + buyOrders.length + 1,
      user_id: currentUser ? currentUser.user_id : 1,
      share_id: parseInt(selectedShareId),
      quantity: parseInt(orderQty),
      price: parseFloat(orderPrice),
      remaining_quantity: parseInt(orderQty),
      buy_status: 'PENDING',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setBuyOrders([newBuy, ...buyOrders]);
    setOrderSuccessMsg(`Buy order for ${orderQty} units placed on order book.`);
    setOrderQty('');
    setOrderPrice('');
  };

  const handlePlaceSell = (e) => {
    e.preventDefault();
    if (!orderQty || !orderPrice) return;
    const newSell = {
      sell_id: 200 + sellOrders.length + 1,
      user_id: currentUser ? currentUser.user_id : 1,
      share_id: parseInt(selectedShareId),
      quantity: parseInt(orderQty),
      price: parseFloat(orderPrice),
      remaining_quantity: parseInt(orderQty),
      sell_status: 'PENDING',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setSellOrders([newSell, ...sellOrders]);
    setOrderSuccessMsg(`Sell order for ${orderQty} units placed on order book.`);
    setOrderQty('');
    setOrderPrice('');
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
            }}
          />
        )}
      </>
    );
  }

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
                  onClick={() => { setActiveTab('buy'); setOrderSuccessMsg(null); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition ${activeTab === 'buy' ? 'bg-surfaceHover text-accentBright border border-border' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover/50'}`}>
                  <ArrowDownLeft size={16} />
                  <span>Buy Security</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('sell'); setOrderSuccessMsg(null); }}
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
            <div>
              <div className="text-sm font-medium text-textMain">{currentUser?.name || "Kapil Sharma"}</div>
              <div className="text-xs text-textMuted">{currentUser?.role || "Investor"}</div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border border-accentDark text-accentBright bg-accentDark/20">
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
              <span className="w-2 h-2 rounded-full bg-accentBright animate-pulse"></span>
              <span className="text-textMain">MARKET OPEN</span>
            </div>
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
                <p className="text-sm text-textMuted mt-1">Your market activity at a glance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Total Holdings</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">₹4,82,500</div>
                  <div className="text-[11px] font-mono text-accentBright mt-1">450 Shares in custody</div>
                </div>
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Active Buy Orders</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    {String(buyOrders.filter(b => b.buy_status === 'PENDING').length).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-mono text-textMuted mt-1">Open bids awaiting match</div>
                </div>
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Active Sell Orders</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    {String(sellOrders.filter(s => s.sell_status === 'PENDING').length).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-mono text-textMuted mt-1">Open asks on order book</div>
                </div>
                <div className="p-5 border border-border rounded bg-surface">
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider">Transactions</div>
                  <div className="text-2xl font-mono font-semibold text-textMain mt-2">
                    {String(transactions.length).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-mono text-accentBright mt-1">Settled on ledger</div>
                </div>
              </div>

              {/* Market Overview Table */}
              <div className="border border-border rounded bg-surface overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wider text-textMain uppercase">Market Overview</h3>
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
                      <th className="p-4 text-right">Available</th>
                      <th className="p-4 text-right">Change</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {shares.slice(0, 3).map((s) => {
                      const comp = getCompany(s.company_id);
                      return (
                        <tr key={s.share_id} className="hover:bg-surfaceHover transition">
                          <td className="p-4 font-sans font-medium text-textMain">{comp.company_name}</td>
                          <td className="p-4 text-textMuted">{s.share_type}</td>
                          <td className="p-4 text-right font-semibold text-textMain">₹{s.current_price}</td>
                          <td className="p-4 text-right text-textMuted">{s.available_shares.toLocaleString()}</td>
                          <td className={`p-4 text-right ${s.change.startsWith('+') ? 'text-accentBright' : 'text-sellRed'}`}>
                            {s.change}
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
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-semibold tracking-wider text-textMain uppercase">Recent Transactions</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Txn ID</th>
                      <th className="p-4">Company</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {transactions.slice(0, 3).map((t) => {
                      const s = getShare(t.share_id);
                      const comp = getCompany(s.company_id);
                      return (
                        <tr key={t.transaction_id} className="hover:bg-surfaceHover transition">
                          <td className="p-4 text-accentBright">TXN-{t.transaction_id}</td>
                          <td className="p-4 font-sans text-textMain">{comp.company_name}</td>
                          <td className="p-4 text-textMuted">{s.share_type}</td>
                          <td className="p-4 text-right text-textMain">{t.quantity}</td>
                          <td className="p-4 text-right text-textMain">₹{t.price}</td>
                          <td className="p-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] border border-accentDark text-accentBright bg-accentDark/20 font-sans">
                              COMPLETED
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

          {/* MARKET TAB */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Market</h1>
                <p className="text-sm text-textMuted mt-1">Available unlisted securities</p>
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
                      <th className="p-4">Security</th>
                      <th className="p-4 text-right">Current Price</th>
                      <th className="p-4 text-right">Available</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shares
                      .filter(s => {
                        const comp = getCompany(s.company_id);
                        return comp.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               comp.sector.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((s) => {
                        const comp = getCompany(s.company_id);
                        return (
                          <tr key={s.share_id} className="hover:bg-surfaceHover transition">
                            <td className="p-4 font-medium text-textMain">{comp.company_name}</td>
                            <td className="p-4 text-textMuted text-xs">{comp.sector}</td>
                            <td className="p-4 text-textMuted text-xs">{s.share_type}</td>
                            <td className="p-4 text-right font-mono font-semibold text-textMain">₹{s.current_price}</td>
                            <td className="p-4 text-right font-mono text-textMuted">{s.available_shares.toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-border bg-bg text-accentBright">
                                {comp.company_status}
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
                    STATUS: {viewCompany.company_status.toUpperCase()}
                  </span>
                </div>

                {(() => {
                  const s = shares.find(sh => sh.company_id === viewCompany.company_id) || {};
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">CURRENT PRICE</div>
                          <div className="text-2xl font-mono font-semibold text-textMain mt-1">₹{s.current_price}</div>
                        </div>
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">FACE VALUE</div>
                          <div className="text-2xl font-mono font-semibold text-textMain mt-1">₹{s.face_value}</div>
                        </div>
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">AVAILABLE UNITS</div>
                          <div className="text-2xl font-mono font-semibold text-textMain mt-1">{s.available_shares?.toLocaleString()}</div>
                        </div>
                        <div className="p-4 border border-border rounded bg-bg">
                          <div className="text-xs font-mono text-textMuted">SECURITY TYPE</div>
                          <div className="text-sm font-mono font-medium text-textMain mt-2">{s.share_type}</div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="text-xs font-mono text-textMuted uppercase mb-1">Company Description</div>
                        <p className="text-sm text-textMuted leading-relaxed">{viewCompany.description}</p>
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
                <p className="text-sm text-textMuted mt-1">Submit bidding interest to the unlisted order book</p>
              </div>

              {orderSuccessMsg && (
                <div className="p-4 rounded border border-accentDark bg-accentDark/20 text-accentBright text-sm flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>{orderSuccessMsg}</span>
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
                      setOrderPrice(sh.current_price);
                    }}
                    className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-accentDark">
                    {shares.map(s => {
                      const comp = getCompany(s.company_id);
                      return (
                        <option key={s.share_id} value={s.share_id}>
                          {comp.company_name} - {s.share_type} (Market Ref: ₹{s.current_price})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-border rounded bg-bg">
                    <div className="text-[10px] font-mono text-textMuted">AVAILABLE LIQUIDITY</div>
                    <div className="text-base font-mono font-medium text-textMain mt-1">
                      {activeSelectedShare.available_shares?.toLocaleString()} Units
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded bg-bg">
                    <div className="text-[10px] font-mono text-textMuted">FACE VALUE</div>
                    <div className="text-base font-mono font-medium text-textMain mt-1">
                      ₹{activeSelectedShare.face_value}
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
                  className="w-full py-3 rounded text-sm font-semibold bg-accentBright text-bg hover:opacity-90 transition">
                  PLACE BUY ORDER
                </button>
              </form>
            </div>
          )}

          {/* SELL TICKET */}
          {activeTab === 'sell' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">SELL SECURITY</h1>
                <p className="text-sm text-textMuted mt-1">List securities owned in custody onto the book</p>
              </div>

              {orderSuccessMsg && (
                <div className="p-4 rounded border border-border bg-surfaceHover text-textMain text-sm flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-accentBright" />
                  <span>{orderSuccessMsg}</span>
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
                      setOrderPrice(sh.current_price);
                    }}
                    className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-accentDark">
                    {shares.map(s => {
                      const comp = getCompany(s.company_id);
                      return (
                        <option key={s.share_id} value={s.share_id}>
                          {comp.company_name} - {s.share_type}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="p-3 border border-border rounded bg-bg flex justify-between items-center">
                  <div className="text-xs font-mono text-textMuted uppercase">YOUR CUSTODY HOLDING</div>
                  <div className="text-sm font-mono font-semibold text-textMain">{currentUser?.shares_owned || 450} Units</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-textMuted uppercase mb-2">Sell Quantity</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      max={currentUser?.shares_owned || 450}
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
                  className="w-full py-3 rounded text-sm font-semibold border border-sellRed text-sellRed bg-sellDark/30 hover:bg-sellDark/60 transition">
                  PLACE SELL ORDER
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
                  <p className="text-sm text-textMuted mt-1">Live DBMS Buy/Sell clearing and settlement engine</p>
                </div>
                <button 
                  onClick={executeMatching}
                  className="px-6 py-2.5 rounded text-sm font-semibold bg-accentBright text-bg hover:opacity-90 transition font-mono flex items-center space-x-2">
                  <Repeat size={16} />
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
                      {buyOrders.filter(b => b.buy_status === 'PENDING').length} Bids Open
                    </div>
                    <div className="text-[11px] text-textMuted mt-1">Table: Buy (`buy_id`, `price`, `qty`)</div>
                  </div>

                  <div className="text-center font-mono text-accentBright text-sm">
                    ── [ MATCH: share_id & buy.price ≥ sell.price ] ──▶
                  </div>

                  <div className="p-4 border border-border rounded bg-bg text-center">
                    <div className="text-xs font-mono text-textMuted">2. PENDING SELL ORDERS</div>
                    <div className="text-lg font-mono font-semibold text-textMain mt-1">
                      {sellOrders.filter(s => s.sell_status === 'PENDING').length} Asks Open
                    </div>
                    <div className="text-[11px] text-textMuted mt-1">Table: Sell (`sell_id`, `price`, `qty`)</div>
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
                        <th className="p-3">Security</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Rem. Qty</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {buyOrders.map(b => (
                        <tr key={b.buy_id}>
                          <td className="p-3 text-textMuted">#{b.buy_id}</td>
                          <td className="p-3 text-textMain">{getCompany(getShare(b.share_id).company_id).company_name}</td>
                          <td className="p-3 text-right text-accentBright">₹{b.price}</td>
                          <td className="p-3 text-right text-textMain">{b.remaining_quantity}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${b.buy_status === 'COMPLETED' ? 'text-accentBright border border-accentDark' : 'text-textMuted border border-border'}`}>
                              {b.buy_status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
                        <th className="p-3">Security</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Rem. Qty</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sellOrders.map(s => (
                        <tr key={s.sell_id}>
                          <td className="p-3 text-textMuted">#{s.sell_id}</td>
                          <td className="p-3 text-textMain">{getCompany(getShare(s.share_id).company_id).company_name}</td>
                          <td className="p-3 text-right text-sellRed">₹{s.price}</td>
                          <td className="p-3 text-right text-textMain">{s.remaining_quantity}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${s.sell_status === 'COMPLETED' ? 'text-accentBright border border-accentDark' : 'text-textMuted border border-border'}`}>
                              {s.sell_status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Holdings</h1>
                <p className="text-sm text-textMuted mt-1">Beneficiary share position registered under User #{currentUser?.user_id || 1}</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Security</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4 text-right">Current Price</th>
                      <th className="p-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    <tr className="hover:bg-surfaceHover">
                      <td className="p-4 font-sans font-medium text-textMain">NovaTech Systems</td>
                      <td className="p-4 text-textMuted">Equity Share</td>
                      <td className="p-4 text-right text-textMain">300</td>
                      <td className="p-4 text-right text-textMain">₹250</td>
                      <td className="p-4 text-right font-semibold text-accentBright">₹75,000</td>
                    </tr>
                    <tr className="hover:bg-surfaceHover">
                      <td className="p-4 font-sans font-medium text-textMain">FinEdge Networks</td>
                      <td className="p-4 text-textMuted">Equity Share</td>
                      <td className="p-4 text-right text-textMain">150</td>
                      <td className="p-4 text-right text-textMain">₹184</td>
                      <td className="p-4 text-right font-semibold text-accentBright">₹27,600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Transactions</h1>
                <p className="text-sm text-textMuted mt-1">Immutable settlement audit ledger (Table: Transactions)</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-bg text-textMuted text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4 font-sans">Company</th>
                      <th className="p-4">Buy ID</th>
                      <th className="p-4">Sell ID</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4">Settled At</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {transactions.map(t => {
                      const comp = getCompany(getShare(t.share_id).company_id);
                      return (
                        <tr key={t.transaction_id} className="hover:bg-surfaceHover">
                          <td className="p-4 text-accentBright font-semibold">TXN-{t.transaction_id}</td>
                          <td className="p-4 font-sans text-sm text-textMain">{comp.company_name}</td>
                          <td className="p-4 text-textMuted">#{t.buy_id}</td>
                          <td className="p-4 text-textMuted">#{t.sell_id}</td>
                          <td className="p-4 text-right text-textMain font-medium">{t.quantity}</td>
                          <td className="p-4 text-right text-textMain">₹{t.price}</td>
                          <td className="p-4 text-textMuted">{t.transaction_time}</td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] border border-accentDark text-accentBright bg-accentDark/20">
                              COMPLETED
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

          {/* ESOPS TAB */}
          {activeTab === 'esops' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-textMain">ESOPs</h1>
                <p className="text-sm text-textMuted mt-1">Employee Stock Option grants register (Table: ESOPs)</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4 text-right font-mono">Options</th>
                      <th className="p-4 text-right font-mono">Exercise Price</th>
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
                          <td className="p-4 font-medium text-textMain">{comp.company_name}</td>
                          <td className="p-4 text-right font-mono text-textMain">{e.number_of_options}</td>
                          <td className="p-4 text-right font-mono text-accentBright">₹{e.exercise_price}</td>
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
                <h1 className="text-2xl font-bold tracking-tight text-textMain">Debentures</h1>
                <p className="text-sm text-textMuted mt-1">Fixed income & unlisted debt instruments (Table: Debentures)</p>
              </div>

              <div className="border border-border rounded bg-surface overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg text-textMuted font-mono text-xs border-b border-border">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Debenture Name</th>
                      <th className="p-4 text-right font-mono">Face Value</th>
                      <th className="p-4 text-right font-mono">Interest Rate</th>
                      <th className="p-4 text-right font-mono">Issue Qty</th>
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
                          <td className="p-4 font-medium text-textMain">{comp.company_name}</td>
                          <td className="p-4 text-xs text-textMuted font-mono">{d.debenture_name}</td>
                          <td className="p-4 text-right font-mono text-textMain">₹{d.face_value.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-accentBright font-semibold">{d.interest_rate}%</td>
                          <td className="p-4 text-right font-mono text-textMuted">{d.issue_quantity}</td>
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