import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDownToLine, CheckCircle, ExternalLink, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { SOLANA_EXPLORER } from '../config'
import clsx from 'clsx'

const QUICK_AMOUNTS = [100, 500, 1000, 5000]

const STEPS = ['confirm', 'signing', 'success', 'error']

export default function DepositModal({ vault, onClose }) {
  const { connected, usdcBalance, simulateDeposit } = useWallet()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState('confirm')
  const [txSig, setTxSig] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const parsedAmount = parseFloat(amount) || 0
  const isValid = parsedAmount > 0 && parsedAmount <= (usdcBalance || 0)
  const estimatedAnnual = parsedAmount * (vault.apy / 100)
  const estimatedDaily = estimatedAnnual / 365

  const handleMax = () => {
    if (usdcBalance) setAmount(usdcBalance.toFixed(2))
  }

  const handleDeposit = useCallback(async () => {
    if (!isValid) return
    setStep('signing')
    try {
      const sig = await simulateDeposit(parsedAmount, vault.name, vault.apy)
      setTxSig(sig)
      setStep('success')
    } catch (err) {
      setErrorMsg(err.message || 'Transaction failed')
      setStep('error')
    }
  }, [isValid, parsedAmount, vault, simulateDeposit])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-2xl border border-white/[0.1] shadow-card-hover overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
            <div>
              <h2 className="text-base font-bold text-ink-100">Deposit to Vault</h2>
              <p className="text-xs text-ink-300">{vault.name} · {vault.dex}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-ink-300 hover:text-ink-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* CONFIRM STEP */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {/* Vault APY badge */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-brand-faint border border-brand/20 mb-5">
                    <div>
                      <div className="text-xs text-ink-300 mb-0.5">Current APY</div>
                      <div className="text-3xl font-extrabold text-gradient-brand font-mono">
                        {vault.apy.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ink-300 mb-0.5">Strategy</div>
                      <div className="text-sm font-semibold text-ink-100">{vault.strategy}</div>
                      <div className="text-xs text-ink-400">{vault.dex} Protocol</div>
                    </div>
                  </div>

                  {/* Amount input */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-ink-300 uppercase tracking-wider">Amount</label>
                      <button onClick={handleMax} className="text-xs text-brand hover:text-brand-dim font-semibold transition-colors">
                        MAX {connected ? `($${usdcBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ''}
                      </button>
                    </div>
                    <div className={clsx(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-surface-700/50 transition-all',
                      parsedAmount > (usdcBalance || 0)
                        ? 'border-red-400/50 focus-within:border-red-400'
                        : 'border-white/[0.08] focus-within:border-brand/50'
                    )}>
                      <span className="text-sm font-bold text-usdc">USDC</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-right text-xl font-bold text-ink-100 outline-none placeholder-ink-400 font-mono"
                      />
                    </div>
                    {parsedAmount > (usdcBalance || 0) && (
                      <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Insufficient USDC balance
                      </p>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2 mb-5">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmount(a.toString())}
                        className={clsx(
                          'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                          parsedAmount === a
                            ? 'bg-brand/20 border-brand/40 text-brand'
                            : 'border-white/[0.06] text-ink-300 hover:border-brand/30 hover:text-brand'
                        )}
                      >
                        ${a >= 1000 ? `${a / 1000}K` : a}
                      </button>
                    ))}
                  </div>

                  {/* Yield estimate */}
                  {parsedAmount > 0 && isValid && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-xl bg-surface-600/30 border border-white/[0.05] p-4 mb-5 space-y-2"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-300 mb-2">
                        <Info className="w-3.5 h-3.5" />
                        Estimated Returns
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-400">Daily</span>
                        <span className="font-mono text-brand">+${estimatedDaily.toFixed(4)} USDC</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-400">Monthly</span>
                        <span className="font-mono text-brand">+${(estimatedDaily * 30).toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-400">Annual (est.)</span>
                        <span className="font-mono font-bold text-brand">+${estimatedAnnual.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-white/[0.05]">
                        <span className="text-ink-400">Total after 1 year</span>
                        <span className="font-mono font-bold text-ink-100">${(parsedAmount + estimatedAnnual).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Wallet not connected */}
                  {!connected && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 mb-4 text-xs text-yellow-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Connect your wallet to deposit
                    </div>
                  )}

                  {/* CTA */}
                  <motion.button
                    whileHover={isValid && connected ? { scale: 1.02 } : {}}
                    whileTap={isValid && connected ? { scale: 0.98 } : {}}
                    onClick={handleDeposit}
                    disabled={!isValid || !connected}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all',
                      isValid && connected
                        ? 'bg-brand text-surface-900 shadow-brand-md hover:shadow-brand-lg hover:bg-brand-dim cursor-pointer'
                        : 'bg-surface-600 text-ink-400 cursor-not-allowed'
                    )}
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    One-Click Deposit
                    {parsedAmount > 0 && isValid && (
                      <span className="font-mono ml-1">
                        ${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </motion.button>

                  <p className="text-[11px] text-ink-400 text-center mt-3">
                    Deposits are simulated for this hackathon demo. No real funds are moved.
                  </p>
                </motion.div>
              )}

              {/* SIGNING STEP */}
              {step === 'signing' && (
                <motion.div
                  key="signing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-brand/10 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-ink-100 mb-2">Signing Transaction</h3>
                  <p className="text-sm text-ink-300 mb-1">Confirm in your Solflare wallet</p>
                  <p className="text-xs text-ink-400">
                    Depositing{' '}
                    <span className="font-mono text-brand font-semibold">
                      ${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                    </span>{' '}
                    into {vault.name}
                  </p>

                  {/* Animated steps */}
                  <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
                    {[
                      'Preparing transaction...',
                      'Requesting wallet signature...',
                      'Broadcasting to Solana...',
                    ].map((label, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.5 }}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Loader2 className="w-3.5 h-3.5 text-brand animate-spin flex-shrink-0" />
                        <span className="text-ink-300">{label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SUCCESS STEP */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center mx-auto mb-5 shadow-brand-md"
                  >
                    <CheckCircle className="w-10 h-10 text-brand" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-ink-100 mb-1">Deposit Confirmed!</h3>
                  <p className="text-sm text-ink-300 mb-5">
                    <span className="font-mono text-brand font-bold">
                      ${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                    </span>{' '}
                    is now earning in {vault.name}
                  </p>

                  <div className="bg-surface-600/30 rounded-xl border border-white/[0.05] p-4 mb-5 space-y-2 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-ink-400">Vault</span>
                      <span className="font-semibold text-ink-100">{vault.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">Amount</span>
                      <span className="font-mono text-brand font-semibold">
                        ${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">APY</span>
                      <span className="font-mono text-brand font-bold">{vault.apy.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-white/[0.05]">
                      <span className="text-ink-400">Tx Hash</span>
                      <a
                        href={`${SOLANA_EXPLORER}/tx/${txSig}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-brand flex items-center gap-1 hover:text-brand-dim"
                      >
                        {txSig?.slice(0, 8)}...{txSig?.slice(-6)}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-brand text-surface-900 font-bold text-sm hover:bg-brand-dim transition-colors shadow-brand-sm"
                  >
                    Done
                  </button>
                </motion.div>
              )}

              {/* ERROR STEP */}
              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-ink-100 mb-2">Transaction Failed</h3>
                  <p className="text-sm text-red-400 mb-6">{errorMsg}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('confirm')}
                      className="flex-1 py-3 rounded-xl border border-white/[0.1] text-ink-100 font-semibold text-sm hover:bg-white/[0.05] transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-surface-600 text-ink-300 font-semibold text-sm hover:bg-surface-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
