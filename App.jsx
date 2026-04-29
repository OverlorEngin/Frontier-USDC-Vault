import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, BarChart2, Terminal, RefreshCw, Activity, ShieldCheck, Zap } from 'lucide-react'
import { WalletProvider, useWallet } from './WalletContext'
import { useKamino } from './useKamino'
import { TxSimulator } from './components/TxSimulator' 

const fmt = {
  usd: (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${Number(n).toFixed(2)}`,
  pct: (n) => `${Number(n).toFixed(2)}%`,
}

function VaultRow({ vault }) {
  const { wallet, usdcBalance } = useWallet()
  const [simOpen, setSimOpen] = useState(false)
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-white/5 border-l-2 border-transparent hover:border-emerald-500 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px] border border-emerald-500/20">USDC</div>
        <div>
          <p className="text-xs font-bold text-white tracking-wider">{vault.name}</p>
          <p className="text-[9px] text-gray-500 uppercase flex items-center gap-1"><ShieldCheck size={10} /> {vault.risk} RISK</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-400">{fmt.pct(vault.apy)}</p>
          <p className="text-[9px] text-gray-500 font-mono">LIVE APY</p>
        </div>
        <button onClick={() => wallet && setSimOpen(true)} className="px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/40 text-emerald-500 text-[10px] font-black hover:bg-emerald-500 hover:text-black transition-all uppercase tracking-tighter">
          Simulate Vault
        </button>
      </div>
      {simOpen && <TxSimulator vault={vault} wallet={wallet} usdcBalance={usdcBalance} onClose={() => setSimOpen(false)} />}
    </div>
  )
}

function Dashboard() {
  const { vaults, loading, totalTvl, bestApy, refresh } = useKamino()
  const { wallet, usdcBalance } = useWallet()
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Yield Command Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] text-emerald-500 font-mono font-bold tracking-widest">SOLANA MAINNET // LIVE_SYNC_ACTIVE</p>
          </div>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-1 bg-white/5 text-gray-400 hover:text-white border border-white/10 text-[10px] font-bold">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> REFRESH_NODE
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-900 border border-white/5 hover:border-emerald-500/30 transition-all">
          <p className="text-[10px] text-gray-500 uppercase font-black">Institutional TVL</p>
          <p className="text-3xl font-bold text-white tracking-tighter">${fmt.usd(totalTvl)}</p>
        </div>
        <div className="p-4 bg-gray-900 border border-emerald-500/40 relative overflow-hidden">
          <p className="text-[10px] text-emerald-500 uppercase font-black">Target Alpha (APY)</p>
          <p className="text-3xl font-bold text-emerald-400 tracking-tighter">{fmt.pct(bestApy)}</p>
        </div>
        <div className="p-4 bg-gray-900 border border-white/5 hover:border-emerald-500/30 transition-all">
          <p className="text-[10px] text-gray-500 uppercase font-black">Available Liquidity</p>
          <p className="text-3xl font-bold text-white tracking-tighter">{wallet ? usdcBalance : '0.00'}</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-white/5">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-emerald-500" /> Active Yield Opportunities</h2>
          <span className="text-[9px] text-gray-500 font-mono font-bold uppercase">Source: Kamino Finance SDK</span>
        </div>
        <div className="divide-y divide-white/5">
          {!loading && vaults.slice(0, 5).map(v => <VaultRow key={v.id} vault={v} />)}
        </div>
      </div>
      <footer className="flex justify-between items-center text-[9px] text-gray-600 font-mono pt-4 border-t border-white/5">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> QUICKNODE_HEALTHY: 156ms</span>
        </div>
        <span>SMARTYIELD_V2.0 // SOLANA_FRONTIER_2026</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="min-h-screen bg-black text-gray-300 font-mono flex">
          <aside className="w-56 bg-gray-900 border-r border-white/5 p-6 flex flex-col justify-between">
            <div className="space-y-10">
              <div className="flex items-center gap-2 group">
                <div className="p-2 bg-emerald-500 text-black rounded-sm"><Terminal size={20} strokeWidth={3} /></div>
                <div className="flex flex-col"><span className="text-xs font-black text-white leading-none">SY_TERMINAL</span></div>
              </div>
              <nav className="flex flex-col gap-1">
                <NavLink to="/" className="text-[10px] font-black p-3 hover:bg-white/5 rounded-sm flex items-center gap-3 transition-all"><LayoutDashboard size={14} /> DASHBOARD</NavLink>
                <NavLink to="/vaults" className="text-[10px] font-black p-3 hover:bg-white/5 rounded-sm flex items-center gap-3 transition-all"><BarChart2 size={14} /> VAULTS</NavLink>
              </nav>
            </div>
          </aside>
          <main className="flex-1 p-10 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vaults" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </WalletProvider>
    </BrowserRouter>
  )
}