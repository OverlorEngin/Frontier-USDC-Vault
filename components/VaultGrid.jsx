import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, TrendingUp, Shield, Flame } from 'lucide-react'
import VaultCard from './VaultCard'
import clsx from 'clsx'

const SORT_OPTIONS = [
  { id: 'apy', label: 'Highest APY', icon: TrendingUp },
  { id: 'tvl', label: 'Highest TVL', icon: Shield },
  { id: 'risk_low', label: 'Lowest Risk', icon: Shield },
]

const RISK_FILTERS = ['all', 'low', 'medium', 'high']

export default function VaultGrid({ vaults, loading, onDeposit }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('apy')
  const [riskFilter, setRiskFilter] = useState('all')

  const filteredVaults = useMemo(() => {
    let list = vaults.filter((v) => {
      const q = search.toLowerCase()
      return (
        v.name.toLowerCase().includes(q) ||
        v.tokenA.toLowerCase().includes(q) ||
        v.tokenB.toLowerCase().includes(q) ||
        v.dex.toLowerCase().includes(q)
      )
    })

    if (riskFilter !== 'all') {
      list = list.filter((v) => v.risk === riskFilter)
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy
      if (sortBy === 'tvl') return b.tvl - a.tvl
      if (sortBy === 'risk_low') {
        const order = { low: 0, medium: 1, high: 2 }
        return order[a.risk] - order[b.risk]
      }
      return 0
    })

    return list
  }, [vaults, search, sortBy, riskFilter])

  return (
    <section id="vaults" className="px-4 sm:px-6 max-w-7xl mx-auto pb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-ink-100">USDC Yield Vaults</h2>
          <p className="text-sm text-ink-300">Kamino Finance strategies — real-time APY data</p>
        </div>
        <div className="text-sm font-mono text-ink-300">
          {filteredVaults.length} <span className="text-ink-400">vaults</span>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vaults, tokens, DEX..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-700/60 border border-white/[0.07] text-sm text-ink-100 placeholder-ink-400 outline-none focus:border-brand/40 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-ink-400 hidden sm:block" />
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap',
                sortBy === opt.id
                  ? 'bg-brand/15 border-brand/30 text-brand'
                  : 'border-white/[0.06] text-ink-300 hover:border-brand/20 hover:text-ink-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Risk filter pills */}
      <div className="flex gap-2 mb-6">
        {RISK_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRiskFilter(r)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border',
              riskFilter === r
                ? r === 'all'
                  ? 'bg-brand/15 border-brand/30 text-brand'
                  : r === 'low'
                  ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400'
                  : r === 'medium'
                  ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400'
                  : 'bg-red-400/15 border-red-400/30 text-red-400'
                : 'border-white/[0.06] text-ink-400 hover:text-ink-100 hover:border-white/[0.12]'
            )}
          >
            {r === 'all' ? 'All Vaults' : r + ' risk'}
          </button>
        ))}
      </div>

      {/* Vault cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl glass-card border border-white/[0.06] shimmer-bg" />
          ))}
        </div>
      ) : filteredVaults.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-ink-300 font-medium">No vaults match your filters</div>
          <button
            onClick={() => { setSearch(''); setRiskFilter('all') }}
            className="mt-3 text-xs text-brand hover:text-brand-dim transition-colors"
          >
            Clear filters
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVaults.map((vault, i) => (
            <div key={vault.id} className="relative">
              <VaultCard
                vault={vault}
                onDeposit={onDeposit}
                rank={i + 1}
                delay={i * 0.05}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
