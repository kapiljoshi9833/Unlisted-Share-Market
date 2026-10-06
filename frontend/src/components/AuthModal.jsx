import React, { useState } from 'react';
import { X, CheckCircle2, Lock, Mail, User, Shield } from 'lucide-react';
import { BRAND } from '../data/mockData';

export default function AuthModal({ initialMode = 'signin', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Investor');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide all required fields.");
      return;
    }
    if (mode === 'signup' && !name) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    // Authenticate or register simulated user
    const authenticatedUser = {
      user_id: mode === 'signup' ? Math.floor(Math.random() * 900) + 10 : 1,
      name: mode === 'signup' ? name : 'Kapil Sharma',
      email: email,
      role: role,
      kyc_status: 'VERIFIED',
      share_id: 1,
      shares_owned: 450,
      created_at: new Date().toISOString().substring(0, 10)
    };

    onAuthSuccess(authenticatedUser);
  };

  const handleDemoLogin = (demoRole = 'Investor') => {
    const demoUser = demoRole === 'Investor' 
      ? {
          user_id: 1,
          name: "Kapil Sharma",
          email: "kapil@valence.local",
          role: "Investor",
          kyc_status: "VERIFIED",
          share_id: 1,
          shares_owned: 450,
          created_at: "2026-01-10"
        }
      : {
          user_id: 99,
          name: "Terminal Admin",
          email: "admin@valence.local",
          role: "Admin",
          kyc_status: "VERIFIED",
          share_id: null,
          shares_owned: 0,
          created_at: "2026-01-01"
        };
    
    onAuthSuccess(demoUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-accentBright font-bold font-mono">{BRAND.symbol}</span>
            <span className="font-semibold tracking-wider text-sm text-textMain uppercase">
              {mode === 'signin' ? 'Sign In to Terminal' : 'Create Exchange Account'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-textMuted hover:text-textMain p-1 rounded transition">
            <X size={18} />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 border-b border-border bg-bg text-xs font-mono">
          <button 
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); }}
            className={`py-3 text-center transition ${mode === 'signin' ? 'text-accentBright border-b-2 border-accentBright bg-surface' : 'text-textMuted hover:text-textMain'}`}>
            SIGN IN
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`py-3 text-center transition ${mode === 'signup' ? 'text-accentBright border-b-2 border-accentBright bg-surface' : 'text-textMuted hover:text-textMain'}`}>
            SIGN UP
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded border border-sellRed text-sellRed bg-sellDark/30">
              {errorMsg}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono text-textMuted uppercase mb-1">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-textMuted" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kapil Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded text-sm text-textMain focus:outline-none focus:border-accentDark"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-textMuted uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-textMuted" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@valence.local"
                className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded text-sm text-textMain focus:outline-none focus:border-accentDark font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-textMuted uppercase mb-1">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-textMuted" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded text-sm text-textMain focus:outline-none focus:border-accentDark font-mono"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono text-textMuted uppercase mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setRole('Investor')}
                  className={`py-2 text-xs font-mono rounded border transition ${role === 'Investor' ? 'border-accentDark text-accentBright bg-accentDark/20' : 'border-border text-textMuted bg-bg'}`}>
                  Investor
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('Admin')}
                  className={`py-2 text-xs font-mono rounded border transition ${role === 'Admin' ? 'border-accentDark text-accentBright bg-accentDark/20' : 'border-border text-textMuted bg-bg'}`}>
                  Market Admin
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full mt-2 py-2.5 rounded text-xs font-mono font-semibold bg-accentBright text-bg hover:opacity-90 transition">
            {mode === 'signin' ? 'AUTHENTICATE SESSION' : 'REGISTER TO USERS TABLE'}
          </button>

          {/* Quick Demo Login Option for College Viva Evaluation */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[10px] font-mono text-textMuted uppercase tracking-wider text-center mb-2">
              ⚡ 1-Click Evaluation Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => handleDemoLogin('Investor')}
                className="py-2 px-3 text-xs font-mono border border-border hover:border-accentDark rounded bg-bg text-textMain hover:text-accentBright transition text-center">
                Demo as Kapil
              </button>
              <button 
                type="button"
                onClick={() => handleDemoLogin('Admin')}
                className="py-2 px-3 text-xs font-mono border border-border hover:border-accentDark rounded bg-bg text-textMain hover:text-accentBright transition text-center">
                Demo as Admin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}