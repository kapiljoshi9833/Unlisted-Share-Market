import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, 
  ShieldCheck, 
  User, 
  Briefcase, 
  TrendingUp, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2,
  RefreshCw,
  DollarSign
} from 'lucide-react';

export default function UserProfileModal({ userId, onClose, onSelectUser }) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' | 'orders' | 'trades'

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      if (!userId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getUserProfileCard(userId);
        if (isMounted) {
          setProfileData(data);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load participant profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-textMain font-sans">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-border bg-surfaceHover/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full border border-border bg-bg flex items-center justify-center text-accentBright font-bold text-lg font-mono">
              {profileData?.user?.name ? profileData.user.name.charAt(0).toUpperCase() : <User size={20} />}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold tracking-tight text-textMain">
                  {profileData?.user?.name || `Participant #${userId}`}
                </h2>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-mono border border-accentDark text-accentBright bg-accentDark/20">
                  <ShieldCheck size={12} className="mr-1" />
                  {profileData?.user?.kyc_status || 'VERIFIED'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-surfaceHover border border-border text-textMuted uppercase">
                  {profileData?.user?.role || 'Investor'}
                </span>
              </div>
              <div className="text-xs text-textMuted font-mono mt-1 flex items-center space-x-3">
                <span>{profileData?.user?.email}</span>
                <span>•</span>
                <span>User ID: #{profileData?.user?.user_id}</span>
                <span>•</span>
                <span>Joined: {profileData?.user?.created_at ? new Date(profileData.user.created_at).toLocaleDateString() : 'Active'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded hover:bg-surfaceHover text-textMuted hover:text-textMain transition border border-transparent hover:border-border">
            <X size={18} />
          </button>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <RefreshCw size={28} className="animate-spin text-accentBright" />
            <div className="text-sm font-mono text-textMuted">Querying participant dossier from MySQL...</div>
          </div>
        )}

        {error && (
          <div className="p-12 text-center">
            <div className="text-sellRed font-mono mb-2">Error loading dossier: {error}</div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-surfaceHover border border-border rounded text-sm font-mono">
              Close
            </button>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        {!loading && profileData && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* KEY SUMMARY METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-bg border border-border rounded">
                <div className="text-[10px] font-mono text-textMuted uppercase tracking-wider mb-1">Portfolio Valuation</div>
                <div className="text-xl font-bold font-mono text-accentBright">
                  ₹{Number(profileData.summary.total_portfolio_value || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-textMuted font-mono mt-0.5">
                  Across {profileData.holdings.length} security holdings
                </div>
              </div>

              <div className="p-4 bg-bg border border-border rounded">
                <div className="text-[10px] font-mono text-textMuted uppercase tracking-wider mb-1">Settled Trades</div>
                <div className="text-xl font-bold font-mono text-textMain">
                  {profileData.summary.settled_trades_count} Trades
                </div>
                <div className="text-[10px] text-textMuted font-mono mt-0.5">
                  Vol: {Number(profileData.summary.total_traded_volume || 0).toLocaleString('en-IN')} Units
                </div>
              </div>

              <div className="p-4 bg-bg border border-border rounded">
                <div className="text-[10px] font-mono text-textMuted uppercase tracking-wider mb-1">Active Commitments</div>
                <div className="text-xl font-bold font-mono text-textMain">
                  {profileData.summary.open_bids_count} Bids / {profileData.summary.open_asks_count} Asks
                </div>
                <div className="text-[10px] text-textMuted font-mono mt-0.5">
                  Open in Order Book
                </div>
              </div>

              <div className="p-4 bg-bg border border-border rounded">
                <div className="text-[10px] font-mono text-textMuted uppercase tracking-wider mb-1">Total Turnover</div>
                <div className="text-xl font-bold font-mono text-accentBright">
                  ₹{Number(profileData.summary.total_turnover || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-textMuted font-mono mt-0.5">
                  All-time consideration
                </div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-border space-x-2">
              <button 
                onClick={() => setActiveTab('holdings')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition ${
                  activeTab === 'holdings' 
                    ? 'border-accentBright text-accentBright' 
                    : 'border-transparent text-textMuted hover:text-textMain'
                }`}>
                <Briefcase size={14} />
                <span>Custody Holdings ({profileData.holdings.length})</span>
              </button>

              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition ${
                  activeTab === 'orders' 
                    ? 'border-accentBright text-accentBright' 
                    : 'border-transparent text-textMuted hover:text-textMain'
                }`}>
                <TrendingUp size={14} />
                <span>Active Orders ({profileData.open_buy_orders.length + profileData.open_sell_orders.length})</span>
              </button>

              <button 
                onClick={() => setActiveTab('trades')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition ${
                  activeTab === 'trades' 
                    ? 'border-accentBright text-accentBright' 
                    : 'border-transparent text-textMuted hover:text-textMain'
                }`}>
                <FileText size={14} />
                <span>Settled Trades History ({profileData.transactions.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: HOLDINGS */}
            {activeTab === 'holdings' && (
              <div className="space-y-4">
                {profileData.holdings.length === 0 ? (
                  <div className="p-8 text-center bg-bg border border-border rounded font-mono text-xs text-textMuted">
                    No securities currently in custody for this participant.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border rounded bg-bg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-surface border-b border-border text-textMuted uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Company & Security</th>
                          <th className="p-3">Sector</th>
                          <th className="p-3 text-right">Units Held</th>
                          <th className="p-3 text-right">Market Price</th>
                          <th className="p-3 text-right">Total Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profileData.holdings.map((h, i) => (
                          <tr key={i} className="hover:bg-surfaceHover/30 transition">
                            <td className="p-3">
                              <div className="font-semibold text-textMain">{h.company_name}</div>
                              <div className="text-[10px] text-textMuted">{h.share_type} • ID #{h.share_id}</div>
                            </td>
                            <td className="p-3 text-textMuted">{h.sector}</td>
                            <td className="p-3 text-right font-bold text-accentBright">{h.shares_owned.toLocaleString()}</td>
                            <td className="p-3 text-right text-textMain">₹{Number(h.current_price).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-bold text-accentBright">
                              ₹{Number(h.total_value).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ACTIVE ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <ArrowDownLeft size={13} className="text-accentBright" />
                    <span>Active Buy Orders (Bids)</span>
                  </div>
                  {profileData.open_buy_orders.length === 0 ? (
                    <div className="p-4 bg-bg border border-border rounded text-xs font-mono text-textMuted">
                      No active buy orders in book.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded bg-bg">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-surface border-b border-border text-textMuted text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Order ID</th>
                            <th className="p-2.5">Security</th>
                            <th className="p-2.5 text-right">Bid Price</th>
                            <th className="p-2.5 text-right">Remaining Qty</th>
                            <th className="p-2.5 text-right">Commitment</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {profileData.open_buy_orders.map(o => (
                            <tr key={o.buy_id} className="hover:bg-surfaceHover/30">
                              <td className="p-2.5 text-textMuted">#B-{o.buy_id}</td>
                              <td className="p-2.5 font-medium">{o.company_name}</td>
                              <td className="p-2.5 text-right text-accentBright">₹{Number(o.price).toLocaleString()}</td>
                              <td className="p-2.5 text-right">{o.remaining_quantity} / {o.quantity}</td>
                              <td className="p-2.5 text-right">₹{Number(o.commitment_value).toLocaleString()}</td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] border border-border bg-surfaceHover">
                                  {o.buy_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-mono text-textMuted uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <ArrowUpRight size={13} className="text-sellRed" />
                    <span>Active Sell Orders (Asks)</span>
                  </div>
                  {profileData.open_sell_orders.length === 0 ? (
                    <div className="p-4 bg-bg border border-border rounded text-xs font-mono text-textMuted">
                      No active sell orders in book.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded bg-bg">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-surface border-b border-border text-textMuted text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Order ID</th>
                            <th className="p-2.5">Security</th>
                            <th className="p-2.5 text-right">Ask Price</th>
                            <th className="p-2.5 text-right">Remaining Qty</th>
                            <th className="p-2.5 text-right">Offering Value</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {profileData.open_sell_orders.map(o => (
                            <tr key={o.sell_id} className="hover:bg-surfaceHover/30">
                              <td className="p-2.5 text-textMuted">#S-{o.sell_id}</td>
                              <td className="p-2.5 font-medium">{o.company_name}</td>
                              <td className="p-2.5 text-right text-sellRed">₹{Number(o.price).toLocaleString()}</td>
                              <td className="p-2.5 text-right">{o.remaining_quantity} / {o.quantity}</td>
                              <td className="p-2.5 text-right">₹{Number(o.offering_value).toLocaleString()}</td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] border border-border bg-surfaceHover">
                                  {o.sell_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SETTLED TRADES */}
            {activeTab === 'trades' && (
              <div className="space-y-4">
                {profileData.transactions.length === 0 ? (
                  <div className="p-8 text-center bg-bg border border-border rounded font-mono text-xs text-textMuted">
                    No settled trades recorded for this participant yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border rounded bg-bg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-surface border-b border-border text-textMuted uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Trade ID</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Security</th>
                          <th className="p-3">Counterparty</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Total Consideration</th>
                          <th className="p-3">Execution Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profileData.transactions.map(t => (
                          <tr key={t.transaction_id} className="hover:bg-surfaceHover/30">
                            <td className="p-3 text-textMuted">#TX-{t.transaction_id}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.participant_role === 'BUYER' 
                                  ? 'bg-accentDark/20 text-accentBright border border-accentDark' 
                                  : 'bg-sellRed/20 text-sellRed border border-sellRed/30'
                              }`}>
                                {t.participant_role}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-textMain">{t.company_name}</div>
                              <div className="text-[10px] text-textMuted">{t.share_type}</div>
                            </td>
                            <td className="p-3 text-textMain">{t.counterparty_name}</td>
                            <td className="p-3 text-right">{t.quantity.toLocaleString()}</td>
                            <td className="p-3 text-right">₹{Number(t.price).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-accentBright">
                              ₹{Number(t.trade_value).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-textMuted text-[10px]">
                              {new Date(t.transaction_time).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-border bg-surfaceHover/30 flex items-center justify-between text-xs font-mono shrink-0">
          <span className="text-textMuted">VALENCE-X Participant Custody & Compliance Dossier</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-bg border border-border hover:border-accentDark hover:text-accentBright transition">
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
