import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Shield, Flame, Zap, ExternalLink, ChevronDown, ChevronUp, ArrowDownToLine } from 'lucide-react'
import clsx from 'clsx'
import { SOLANA_EXPLORER } from '../config'

const RISK_CONFIG = {
  low: { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: Shield },
  medium: { label: 'Med Risk', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Zap },
  high: { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: Flame },
}

const DEX_COLORS = {
  Orca: 'text-pink-400 bg-pink-400/10',
  Raydium: 'text-purple-400 bg-purple-400/10',
  Meteora: 'text-blue-400 bg-blue-400/10',
}

function TokenPair({ a, b }) {
  const colors = {
    USDC: 'bg-usdc',
    USDT: 'bg-emerald-500',
    SOL: 'bg-gradient-to-br from-purple-500 to-violet-400',
    mSOL: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    BONK: 'bg-gradient-to-br from-orange-400 to-amber-300',
    JitoSOL: 'bg-gradient-to-br from-emerald-500 to-teal-400',
  }

  return (
    <div className="flex items-center">
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-surface-800 z-10', colors[a] || 'bg-surface-500')}>
        {a.slice(0, 2)}
      </div>
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-surface-800 -ml-2', colors[b] || 'bg-surface-500')}>
        {b.slice(0, 2)}
      </div>
    </div>
  )
}

function ApyBar({ base, rewards, total }) {
  const baseW = (base / total) * 100
  const rewardsW = (rewards / total) * 100

  return (
    <div className="w-full">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-600 gap-px">
        <div className="bg-usdc rounded-l-full transition-all duration-700" style={{ width: `${baseW}%` }} />
        <div className="bg-brand rounded-r-full transition-all duration-700" style={{ width: `${rewardsW}%` }} />
      </div>
      <div className="flex gap-3 mt-1.5">
        <span className="flex items-center gap-1 text-[10px] text-ink-400">
          <span className="w-1.5 h-1.5 rounded-full bg-usdc inline-block" />
          Base {base.toFixed(1)}%
        </span>
        <span className="flex items-center gap-1 text-[10px] text-ink-400">
          <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
          Rewards {rewards.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export default function VaultCard({ vault, onDeposit, rank, delay = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const riskCfg = RISK_CONFIG[vault.risk] || RISK_CONFIG.medium
  const RiskIcon = riskCfg.icon
  const dexColor = DEX_COLORS[vault.dex] || 'text-ink-300 bg-surface-600'

  const formatTvl = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${n}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={clsx(
        'glass-card rounded-2xl border transition-all duration-300 group',
        vault.apy > 30
          ? 'border-brand/25 hover:border-brand/40'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      )}
    >
      {/* Hot badge */}
      {rank <= 2 && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand text-surface-900 text-[10px] font-bold shadow-brand-sm">
            <TrendingUp className="w-2.5 h-2.5" />
            #{rank} Yield
          </div>
        </div>
      )}

      <div className="p-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <TokenPair a={vault.tokenA} b={vault.tokenB} />
            <div>
              <div className="font-bold text-ink-100 text-sm leading-tight">{vault.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full', dexColor)}>
                  {vault.dex}
                </span>
                <span className="text-[10px] text-ink-400">{vault.strategy}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold text-gradient-brand font-mono leading-tight">
              {vault.apy.toFixed(2)}%
            </div>
            <div className="text-[10px] text-ink-300">APY</div>
          </div>
        </div>

        {/* APY breakdown */}
        <div className="mb-4">
          <ApyBar base={vault.apyBase} rewards={vault.apyRewards} total={vault.apy} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-surface-600/40 rounded-xl p-2.5 text-center">
            <div className="text-xs font-semibold font-mono text-ink-100">{formatTvl(vault.tvl)}</div>
            <div className="text-[10px] text-ink-400 mt-0.5">TVL</div>
          </div>
          <div className="bg-surface-600/40 rounded-xl p-2.5 text-center">
            <div className="text-xs font-semibold font-mono text-ink-100">{formatTvl(vault.volume24h)}</div>
            <div className="text-[10px] text-ink-400 mt-0.5">24h Vol</div>
          </div>
          <div className="bg-surface-600/40 rounded-xl p-2.5 text-center">
            <div className={clsx('text-xs font-semibold px-1.5 py-0.5 rounded-lg border inline-flex items-center gap-0.5', riskCfg.color, riskCfg.bg, riskCfg.border)}>
              <RiskIcon className="w-2.5 h-2.5" />
              {riskCfg.label}
            </div>
            <div className="text-[10px] text-ink-400 mt-0.5">Risk</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {vault.tags?.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-600/50 text-ink-300 border border-white/[0.04]">
              {tag}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDeposit(vault)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
              vault.apy > 30
                ? 'bg-brand text-surface-900 shadow-brand-sm hover:shadow-brand-md hover:bg-brand-dim'
                : 'bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 hover:border-brand/40'
            )}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </motion.button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all text-ink-300 hover:text-ink-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/[0.05] space-y-2"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-400">Daily Fees</span>
              <span className="font-mono text-ink-200">${vault.fees24h?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-400">Vault Address</span>
              <a
                href={`${SOLANA_EXPLORER}/account/${vault.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-brand hover:text-brand-dim flex items-center gap-1"
              >
                {vault.address.slice(0, 8)}...{vault.address.slice(-6)}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-400">Protocol</span>
              <span className="text-ink-200">Kamino Finance</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-400">Strategy Type</span>
              <span className="text-ink-200">{vault.strategy}</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
