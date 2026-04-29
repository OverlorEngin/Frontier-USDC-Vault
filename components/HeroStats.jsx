import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Activity, Layers, RefreshCw } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import clsx from 'clsx'

function StatCard({ icon: Icon, label, value, sub, accent, delay = 0, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', accent)}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && (
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', trend >= 0 ? 'text-brand bg-brand-faint' : 'text-red-400 bg-red-400/10')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-ink-100 font-mono mb-0.5">{value}</div>
      <div className="text-xs text-ink-300">{label}</div>
      {sub && <div className="text-[11px] text-ink-400 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

function PortfolioCard({ depositedAmount, usdcBalance, connected }) {
  const estimatedDailyYield = depositedAmount * (18.42 / 100 / 365)
  const estimatedAnnualYield = depositedAmount * (18.42 / 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="glass-card rounded-2xl border border-brand/20 bg-brand-faint p-5 col-span-2 lg:col-span-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-semibold text-brand uppercase tracking-widest mb-1">My Portfolio</div>
          <div className="text-2xl font-bold text-ink-100 font-mono">
            ${connected ? depositedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </div>
          <div className="text-xs text-ink-300">Active deposits</div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
          <Layers className="w-4 h-4 text-brand" />
        </div>
      </div>

      {connected ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-300">Wallet USDC</span>
            <span className="font-mono text-ink-100">${usdcBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-300">Daily yield est.</span>
            <span className="font-mono text-brand">+${estimatedDailyYield.toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-300">Annual yield est.</span>
            <span className="font-mono text-brand">+${estimatedAnnualYield.toFixed(2)}</span>
          </div>
          <div className="pt-1 border-t border-white/[0.05] flex justify-between items-center text-xs">
            <span className="text-ink-300">Avg. APY</span>
            <span className="font-mono font-bold text-brand">18.42%</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-ink-400 italic">Connect wallet to view your portfolio</div>
      )}
    </motion.div>
  )
}

export default function HeroStats({ metrics, loading, lastUpdated, dataSource, onRefresh }) {
  const { connected, usdcBalance, depositedAmount } = useWallet()

  const formatTvl = (n) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    return `$${n?.toLocaleString()}`
  }

  const formatVol = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    return `$${n?.toLocaleString()}`
  }

  return (
    <section id="dashboard" className="pt-24 pb-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand-faint text-brand text-xs font-semibold mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          Powered by Kamino Finance + QuickNode
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-ink-100 mb-3 tracking-tight">
          Maximize Your{' '}
          <span className="text-gradient-brand">USDC Yield</span>
          <br />
          on Solana
        </h1>
        <p className="text-ink-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Real-time vault intelligence powered by Kamino Finance. One-click deployment
          into the highest-yielding USDC strategies across Solana DeFi.
        </p>
      </motion.div>

      {/* Data source badge + refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium',
            dataSource === 'live'
              ? 'border-brand/30 bg-brand-faint text-brand'
              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          )}>
            <div className={clsx('w-1.5 h-1.5 rounded-full', dataSource === 'live' ? 'bg-brand animate-pulse' : 'bg-yellow-400')} />
            {dataSource === 'live' ? 'Live Kamino Data' : 'Simulated Data'}
          </div>
          {lastUpdated && (
            <span className="text-[11px] text-ink-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-ink-300 hover:text-brand transition-colors px-2 py-1 rounded-lg hover:bg-brand-faint"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl border border-white/[0.06] p-5 h-28 shimmer-bg" />
          ))
        ) : (
          <>
            <StatCard
              icon={DollarSign}
              label="Total Value Locked"
              value={formatTvl(metrics.totalTvl)}
              sub="Kamino USDC vaults"
              accent="bg-usdc/20 text-usdc"
              delay={0}
              trend={2.4}
            />
            <StatCard
              icon={TrendingUp}
              label="Best USDC APY"
              value={`${metrics.avgApy?.toFixed(2)}%`}
              sub="Avg across vaults"
              accent="bg-brand/20 text-brand"
              delay={0.05}
              trend={0.8}
            />
            <StatCard
              icon={Activity}
              label="24h Volume"
              value={formatVol(metrics.totalVolume24h)}
              sub="Across all strategies"
              accent="bg-purple-500/20 text-purple-400"
              delay={0.1}
            />
            <StatCard
              icon={DollarSign}
              label="SOL Price"
              value={`$${metrics.solPrice?.toFixed(2)}`}
              sub="via QuickNode RPC"
              accent="bg-emerald-500/20 text-emerald-400"
              delay={0.15}
            />
            <PortfolioCard
              depositedAmount={depositedAmount}
              usdcBalance={usdcBalance}
              connected={connected}
            />
          </>
        )}
      </div>
    </section>
  )
}
