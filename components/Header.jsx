import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ChevronDown, ExternalLink, Copy, LogOut, Wallet, CheckCircle } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { SOLANA_EXPLORER } from '../config'
import clsx from 'clsx'

function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export default function Header() {
  const { connected, connecting, publicKey, usdcBalance, solBalance, connect, disconnect } = useWallet()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnect = async (type) => {
    setShowWalletModal(false)
    await connect(type)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-brand-sm">
                <Zap className="w-4 h-4 text-surface-900" fill="currentColor" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand animate-pulse-slow border-2 border-surface-900" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-ink-100">
                Smart<span className="text-gradient-brand">Yield</span>
              </div>
              <div className="text-[10px] font-medium text-ink-300 tracking-widest uppercase leading-none">
                Frontier Hackathon
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#dashboard" className="text-brand font-medium">Dashboard</a>
            <a href="#vaults" className="text-ink-300 hover:text-ink-100 transition-colors">Vaults</a>
            <a href="#activity" className="text-ink-300 hover:text-ink-100 transition-colors">Activity</a>
            <a
              href="https://app.kamino.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-300 hover:text-ink-100 transition-colors flex items-center gap-1"
            >
              Kamino <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Wallet */}
          <div className="relative">
            {!connected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWalletModal(true)}
                disabled={connecting}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  'bg-brand text-surface-900 shadow-brand-sm hover:shadow-brand-md hover:bg-brand-dim',
                  connecting && 'opacity-70 cursor-not-allowed'
                )}
              >
                {connecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-surface-900/30 border-t-surface-900 rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </>
                )}
              </motion.button>
            ) : (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setShowDropdown((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand/30 bg-brand-faint hover:bg-brand/10 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-usdc flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {publicKey?.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-ink-100">{shortenAddress(publicKey)}</div>
                    <div className="text-[10px] text-brand font-mono">
                      {usdcBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                    </div>
                  </div>
                  <ChevronDown className={clsx('w-3.5 h-3.5 text-ink-300 transition-transform', showDropdown && 'rotate-180')} />
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border border-white/[0.08] shadow-card overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-usdc flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {publicKey?.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink-100">{shortenAddress(publicKey)}</div>
                            <div className="text-xs text-brand">Solflare</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-surface-600/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-ink-300 mb-0.5">USDC</div>
                            <div className="text-sm font-semibold font-mono text-ink-100">
                              ${usdcBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="bg-surface-600/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-ink-300 mb-0.5">SOL</div>
                            <div className="text-sm font-semibold font-mono text-ink-100">
                              {solBalance?.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleCopy}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-sm text-ink-200"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4 text-ink-300" />}
                          {copied ? 'Copied!' : 'Copy Address'}
                        </button>
                        <a
                          href={`${SOLANA_EXPLORER}/account/${publicKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-sm text-ink-200"
                        >
                          <ExternalLink className="w-4 h-4 text-ink-300" />
                          View on Solscan
                        </a>
                        <button
                          onClick={() => { disconnect(); setShowDropdown(false) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-sm text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Wallet Selection Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowWalletModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm glass-card rounded-2xl border border-white/[0.1] shadow-card-hover p-6"
            >
              <h3 className="text-lg font-bold text-ink-100 mb-1">Connect Wallet</h3>
              <p className="text-sm text-ink-300 mb-6">Choose your Solana wallet to start earning yield</p>

              <div className="space-y-2">
                {[
                  { id: 'solflare', name: 'Solflare', desc: 'Recommended for DeFi', gradient: 'from-orange-500 to-amber-400', letter: 'SF' },
                  { id: 'phantom', name: 'Phantom', desc: 'Most popular wallet', gradient: 'from-purple-500 to-violet-400', letter: 'PH' },
                  { id: 'backpack', name: 'Backpack', desc: 'xNFT wallet', gradient: 'from-blue-500 to-cyan-400', letter: 'BP' },
                ].map((wallet) => (
                  <motion.button
                    key={wallet.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleConnect(wallet.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] hover:border-brand/40 hover:bg-brand-faint transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${wallet.gradient} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-white">{wallet.letter}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-ink-100 group-hover:text-brand transition-colors">{wallet.name}</div>
                      <div className="text-xs text-ink-300">{wallet.desc}</div>
                    </div>
                    {wallet.id === 'solflare' && (
                      <span className="ml-auto text-[10px] font-semibold text-brand bg-brand-faint border border-brand/20 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              <p className="text-[11px] text-ink-400 text-center mt-4">
                By connecting, you agree to the terms of use. This is a hackathon demo.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </>
  )
}
