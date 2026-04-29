import React from 'react'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Clock } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { SOLANA_EXPLORER } from '../config'
import clsx from 'clsx'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  if (hr > 0) return `${hr}h ago`
  if (min > 0) return `${min}m ago`
  return 'just now'
}

function TxRow({ tx, index }) {
  const isDeposit = tx.type === 'Deposit'
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
    >
      <div className={clsx(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        isDeposit ? 'bg-brand/15 text-brand' : 'bg-red-400/15 text-red-400'
      )}>
        {isDeposit
          ? <ArrowDownToLine className="w-4 h-4" />
          : <ArrowUpFromLine className="w-4 h-4" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-100">{tx.type}</span>
          <span className="text-xs text-ink-400">{tx.vault}</span>
          {tx.apy && (
            <span className="text-[10px] font-semibold text-brand bg-brand-faint border border-brand/20 px-1.5 py-0.5 rounded-full">
              {tx.apy}% APY
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="w-2.5 h-2.5 text-ink-400" />
          <span className="text-[11px] text-ink-400">{timeAgo(tx.timestamp)}</span>
          <span className="text-[11px] text-ink-500">·</span>
          <a
            href={`${SOLANA_EXPLORER}/tx/${tx.sig}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-ink-400 hover:text-brand transition-colors flex items-center gap-0.5"
          >
            {tx.sig.slice(0, 6)}...{tx.sig.slice(-4)}
            <ExternalLink className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>

      <div className={clsx('text-sm font-bold font-mono', isDeposit ? 'text-brand' : 'text-red-400')}>
        {isDeposit ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </motion.div>
  )
}

export default function ActivityFeed() {
  const { connected, transactions, publicKey } = useWallet()

  return (
    <section id="activity" className="px-4 sm:px-6 max-w-7xl mx-auto pb-16">
      <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
          <div>
            <h2 className="text-base font-bold text-ink-100">Transaction Activity</h2>
            <p className="text-xs text-ink-300">
              {connected
                ? `${publicKey?.slice(0, 6)}...${publicKey?.slice(-4)} · ${transactions.length} transactions`
                : 'Connect wallet to view activity'}
            </p>
          </div>
          {transactions.length > 0 && (
            <div className="text-xs font-mono text-brand">
              {transactions.length} txns
            </div>
          )}
        </div>

        <div className="p-3">
          {!connected ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-surface-600/50 border border-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-ink-400" />
              </div>
              <div className="text-sm font-medium text-ink-300 mb-1">No activity yet</div>
              <div className="text-xs text-ink-400">Connect your wallet to start earning</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-surface-600/50 border border-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <ArrowDownToLine className="w-5 h-5 text-ink-400" />
              </div>
              <div className="text-sm font-medium text-ink-300 mb-1">No transactions yet</div>
              <div className="text-xs text-ink-400">Deposit into a vault to see activity here</div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {transactions.map((tx, i) => (
                <TxRow key={tx.sig} tx={tx} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
