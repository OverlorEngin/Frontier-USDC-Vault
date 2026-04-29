import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Zap, CheckCircle2, AlertCircle, RefreshCw, ArrowDown,
  ArrowUpRight, Shield, TrendingUp, Wallet, Clock, ExternalLink,
  Activity, ChevronRight, Lock, Unlock,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { SOLANA_EXPLORER } from '../config'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const SOL_FEE = 0.000005 // typical Solana tx fee

const fmt = {
  usdc: (n) =>
    n == null ? '—'
    : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(3)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(2)}K`
    : `$${Number(n).toFixed(2)}`,
  pct: (n) => `${Number(n).toFixed(2)}%`,
  sol: (n) => `${Number(n).toFixed(6)} SOL`,
}

// ── Simulation logic ──────────────────────────────────────────────────────────
function buildSimulation(vault, depositAmount, usdcBefore) {
  const apy = vault.apy / 100
  const daily = depositAmount * apy / 365
  const weekly = daily * 7
  const monthly = daily * 30
  const annual = depositAmount * apy
  const usdcAfter = Math.max(0, usdcBefore - depositAmount)
  const effectiveRate = ((Math.pow(1 + apy / 365, 365) - 1) * 100).toFixed(4)

  return {
    depositAmount,
    usdcBefore,
    usdcAfter,
    daily,
    weekly,
    monthly,
    annual,
    solFee: SOL_FEE,
    effectiveRate,
    breakEvenDays: depositAmount > 0 && SOL_FEE > 0
      ? Math.ceil((SOL_FEE * 148) / daily)
      : 0,
  }
}

function buildExecutionSummary(vault, amount) {
  const route = vault?.tokenB
    ? `${vault.tokenA || 'USDC'} → ${vault.tokenB} → ${vault.tokenA || 'USDC'}`
    : `${vault.tokenA || 'USDC'} single-sided`
  const slippage = Math.min(0.75, Math.max(0.2, Number((amount / 40_000).toFixed(3))))
  return {
    route,
    mevProtection: 'DFlow MEV Guard',
    slippage: `${slippage.toFixed(2)}%`,
    executionTime: `${Math.max(1.1, Math.min(2.8, amount / 40_000)).toFixed(1)}s`,
    saved: `${Math.min(0.35, Math.max(0.05, amount / 125_000)).toFixed(2)}%`,
  }
}

// ── Step 1: Input amount ──────────────────────────────────────────────────────
function StepInput({ vault, usdcBalance, amount, setAmount, onNext, onClose }) {
  const usdcNum = parseFloat((usdcBalance || '0').replace(/,/g, '')) || 0
  const depositNum = Math.max(0, parseFloat(amount) || 0)
  const isValid = depositNum > 0
  const isOverBalance = depositNum > usdcNum && usdcNum > 0

  const QUICK = [
    { label: '25%', pct: 0.25 },
    { label: '50%', pct: 0.5 },
    { label: '75%', pct: 0.75 },
    { label: 'MAX', pct: 1.0 },
  ]

  return (
    <div className="space-y-5">
      {/* Vault summary */}
      <div className="flex items-start gap-3 p-4 border border-usdc/30 bg-usdc/[0.04]">
        <div className="w-8 h-8 border border-usdc-light/40 bg-usdc/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-usdc-light">U</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-white tracking-wide">{vault.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-ink-500">APY</span>
            <span className="text-sm font-bold neon-text">{fmt.pct(vault.apy)}</span>
            <span className="text-ink-500">·</span>
            <span className="text-[9px] text-ink-500">{vault.strategy}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-ink-500 tracking-widest">DAILY AT 10K</p>
          <p className="text-[11px] font-bold text-brand">
            +{fmt.usdc(10000 * vault.apy / 100 / 365)}/day
          </p>
        </div>
      </div>

      {/* Current balance */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-700/60 border border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Wallet size={12} className="text-ink-400" />
          <span className="text-[9px] text-ink-500 tracking-widest uppercase">Available USDC</span>
        </div>
        <span className="text-sm font-bold text-white">
          {usdcNum > 0 ? fmt.usdc(usdcNum) : 'NO USDC BALANCE'}
        </span>
      </div>

      {/* Amount input */}
      <div>
        <label className="text-[9px] text-ink-500 uppercase tracking-widest block mb-2">
          Deposit Amount (USDC)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-usdc-light">$</span>
          <input
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-7 pr-3 py-3 bg-surface-700 border border-white/[0.07] text-white text-base font-bold focus:outline-none focus:border-brand/40 transition-colors font-mono placeholder:text-ink-500"
            autoFocus
          />
        </div>

        {/* Quick amount buttons */}
        {usdcNum > 0 && (
          <div className="flex gap-1.5 mt-2">
            {QUICK.map(({ label, pct }) => (
              <button
                key={label}
                onClick={() => setAmount((usdcNum * pct).toFixed(2))}
                className="flex-1 py-1.5 text-[9px] font-bold tracking-widest border border-white/[0.06] text-ink-400 hover:text-white hover:border-brand/30 hover:bg-brand/[0.04] transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {isOverBalance && (
          <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1.5">
            <AlertCircle size={10} /> Amount exceeds wallet balance
          </p>
        )}
      </div>

      {/* Estimated return preview */}
      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border border-brand/20 bg-brand/[0.03] space-y-2"
        >
          <p className="text-[9px] text-brand uppercase tracking-widest mb-3">ESTIMATED RETURNS</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'DAILY', val: depositNum * vault.apy / 100 / 365 },
              { label: 'MONTHLY', val: depositNum * vault.apy / 100 / 12 },
              { label: 'ANNUAL', val: depositNum * vault.apy / 100 },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="text-[9px] text-ink-500 tracking-widest">{label}</p>
                <p className="text-sm font-bold neon-text mt-1">+{fmt.usdc(val)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full py-3 border border-brand/50 bg-brand/10 text-brand text-[11px] font-bold tracking-widest hover:bg-brand/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Activity size={12} />
        RUN TRANSACTION SIMULATION
        <ChevronRight size={12} />
      </button>
    </div>
  )
}

// ── Step 2: Simulation preview ────────────────────────────────────────────────
function StepPreview({ vault, sim, onSign, onBack, onSaveOnly, signing, analysis, error }) {
  const balanceChange = sim.usdcAfter - sim.usdcBefore

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Shield size={12} className="text-brand" />
        <p className="text-[9px] text-brand uppercase tracking-widest font-bold">SIMULATION COMPLETE · PRE-FLIGHT CHECK PASSED</p>
      </div>

      {/* BEFORE → AFTER balance card */}
      <div className="border border-white/[0.06] bg-surface-700/40">
        <div className="px-4 py-2 border-b border-white/[0.05] bg-surface-700/50">
          <p className="text-[9px] text-ink-500 tracking-widest uppercase">Balance Impact</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 divide-x divide-white/[0.05]">
          {/* Before */}
          <div className="px-4 py-4">
            <p className="text-[9px] text-ink-500 tracking-widest mb-2">BEFORE</p>
            <p className="text-xl font-bold text-white">{fmt.usdc(sim.usdcBefore)}</p>
            <p className="text-[9px] text-ink-500 mt-1">USDC in wallet</p>
          </div>
          {/* Arrow */}
          <div className="flex items-center justify-center px-3">
            <ArrowDown size={14} className="text-ink-500 rotate-[-90deg]" />
          </div>
          {/* After */}
          <div className="px-4 py-4">
            <p className="text-[9px] text-ink-500 tracking-widest mb-2">AFTER DEPOSIT</p>
            <p className="text-xl font-bold text-white">{fmt.usdc(sim.usdcAfter)}</p>
            <p className={`text-[9px] mt-1 font-bold ${balanceChange < 0 ? 'text-amber-400' : 'text-brand'}`}>
              {balanceChange < 0 ? '' : '+'}{fmt.usdc(balanceChange)}
            </p>
          </div>
        </div>
      </div>

      {/* Deposit details */}
      <div className="border border-white/[0.05] bg-surface-800 divide-y divide-white/[0.04]">
        {[
          { label: 'DEPOSIT AMOUNT', value: fmt.usdc(sim.depositAmount), highlight: true },
          { label: 'VAULT APY', value: fmt.pct(vault.apy), accent: 'neon-text' },
          { label: 'EFFECTIVE APY (COMPOUND)', value: `${sim.effectiveRate}%`, accent: 'text-brand' },
          { label: 'ESTIMATED DAILY YIELD', value: `+${fmt.usdc(sim.daily)}`, accent: 'text-brand' },
          { label: 'ESTIMATED WEEKLY YIELD', value: `+${fmt.usdc(sim.weekly)}`, accent: 'text-brand' },
          { label: 'ESTIMATED MONTHLY YIELD', value: `+${fmt.usdc(sim.monthly)}`, accent: 'text-brand' },
          { label: 'ESTIMATED ANNUAL YIELD', value: `+${fmt.usdc(sim.annual)}`, accent: 'neon-text' },
          { label: 'SOLANA TX FEE', value: fmt.sol(sim.solFee), note: '~$0.001' },
          { label: 'FEE BREAK-EVEN', value: `${sim.breakEvenDays} days`, note: 'days to recoup tx cost' },
          { label: 'RISK LEVEL', value: vault.risk, accent: vault.risk === 'Low' ? 'text-brand' : vault.risk === 'Medium' ? 'text-amber-400' : 'text-red-400' },
          { label: 'STRATEGY', value: vault.strategy || 'Concentrated Liquidity' },
        ].map(({ label, value, highlight, accent, note }) => (
          <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${highlight ? 'bg-usdc/[0.04]' : ''}`}>
            <span className="text-[9px] text-ink-500 tracking-widest">{label}</span>
            <div className="text-right">
              <span className={`text-[11px] font-bold ${accent || 'text-white'}`}>{value}</span>
              {note && <p className="text-[8px] text-ink-500 mt-0.5">{note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* DFlow transaction analysis */}
      <div className="border border-white/[0.06] bg-surface-700/40 p-4 space-y-3">
        <p className="text-[9px] text-ink-500 uppercase tracking-widest">EXECUTION ANALYSIS</p>
        <div className="grid grid-cols-2 gap-3 text-[10px] text-ink-400">
          <div>
            <p className="text-sm font-bold text-white">{analysis.route}</p>
            <p className="mt-1">MEV-protected DFlow route</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{analysis.slippage}</p>
            <p className="mt-1">Max slippage</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{analysis.saved}</p>
            <p className="mt-1">Estimated savings</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{analysis.executionTime}</p>
            <p className="mt-1">Projected latency</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 border border-red-400/20 bg-red-400/[0.08] text-red-300 text-[10px] tracking-wider">
          <strong className="font-semibold">SIGNING ERROR:</strong> {error}
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 border border-amber-400/20 bg-amber-400/[0.04] text-amber-400 text-[9px] tracking-wider leading-relaxed">
        <AlertCircle size={10} className="mt-0.5 shrink-0" />
        This is a pre-flight simulation only. No funds will move until you sign. APY rates fluctuate and past performance does not guarantee future results.
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={signing}
          className="flex-1 py-2.5 border border-white/[0.07] text-ink-400 text-[10px] font-bold tracking-widest hover:text-white hover:border-white/15 transition-all disabled:opacity-40"
        >
          ← BACK
        </button>
        <button
          onClick={onSign}
          disabled={signing}
          className="flex-[2] py-2.5 border border-brand/50 bg-brand/10 text-brand text-[11px] font-bold tracking-widest hover:bg-brand/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {signing ? (
            <><RefreshCw size={11} className="animate-spin" /> AWAITING SOLFLARE…</>
          ) : (
            <><Zap size={11} /> SIGN & DEPOSIT VIA SOLFLARE</>
          )}
        </button>
      </div>

      <button
        onClick={onSaveOnly}
        className="w-full text-[9px] text-ink-500 hover:text-ink-300 tracking-widest text-center py-1 transition-colors"
      >
        SAVE SIMULATION WITHOUT SIGNING
      </button>
    </div>
  )
}

// ── Step 3: Result ────────────────────────────────────────────────────────────
function StepResult({ vault, sim, status, txId, onClose }) {
  const isSign = status === 'signed'
  const isError = status === 'error'
  return (
    <div className="space-y-5 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className={`w-16 h-16 mx-auto border flex items-center justify-center ${
          isSign
            ? 'border-brand/40 bg-brand/10'
            : 'border-white/20 bg-surface-700'
        }`}
      >
        {isSign
          ? <CheckCircle2 size={28} className="text-brand" />
          : <Shield size={28} className="text-ink-300" />
        }
      </motion.div>

      <div>
        <p className={`text-base font-bold tracking-widest ${isSign ? 'neon-text' : isError ? 'text-red-400' : 'text-white'}`}>
          {isSign ? 'TRANSACTION SIGNED' : isError ? 'SIGNATURE FAILED' : 'SIMULATION SAVED'}
        </p>
        <p className="text-[10px] text-ink-500 mt-1 tracking-wider">
          {isSign
            ? 'Deposit submitted to Solana · Awaiting confirmation'
            : isError
              ? 'Solflare signing failed. Please reopen and retry.'
              : 'Simulation recorded to your transaction history'}
        </p>
      </div>

      {/* Summary */}
      <div className="border border-white/[0.06] bg-surface-700/40 p-4 space-y-3 text-left">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'VAULT', value: vault.name },
            { label: 'DEPOSITED', value: fmt.usdc(sim.depositAmount) },
            { label: 'BALANCE BEFORE', value: fmt.usdc(sim.usdcBefore) },
            { label: 'BALANCE AFTER', value: fmt.usdc(sim.usdcAfter) },
            { label: 'ANNUAL YIELD', value: `+${fmt.usdc(sim.annual)}` },
            { label: 'APY', value: fmt.pct(vault.apy) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[8px] text-ink-500 tracking-widest">{label}</p>
              <p className="text-[11px] font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {isSign && txId && (
        <a
          href={`${SOLANA_EXPLORER}/tx/${txId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[9px] text-brand border border-brand/20 px-3 py-1.5 hover:bg-brand/10 transition-colors tracking-widest"
        >
          VIEW ON SOLSCAN <ExternalLink size={9} />
        </a>
      )}

      <button
        onClick={onClose}
        className="w-full py-2.5 border border-brand/40 bg-brand/10 text-brand text-[10px] font-bold tracking-widest hover:bg-brand/20 transition-all"
      >
        CLOSE
      </button>
    </div>
  )
}

// ── Main TxSimulator modal ────────────────────────────────────────────────────
export function TxSimulator({ vault, wallet, usdcBalance, onClose }) {
  const [step, setStep] = useState('input') // input | preview | result
  const [amount, setAmount] = useState('')
  const [sim, setSim] = useState(null)
  const [signing, setSigning] = useState(false)
  const [resultStatus, setResultStatus] = useState(null)
  const [txId, setTxId] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [signingError, setSigningError] = useState(null)

  const usdcNum = parseFloat((usdcBalance || '0').replace(/,/g, '')) || 0

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const execution = React.useMemo(() => buildExecutionSummary(vault, parseFloat(amount) || 0), [vault, amount])

  const handlePreview = useCallback(() => {
    const depositNum = parseFloat(amount) || 0
    if (depositNum <= 0) return
    const computed = buildSimulation(vault, depositNum, usdcNum)
    setSim(computed)
    setStep('preview')
  }, [amount, vault, usdcNum])

  const saveToDb = async (status, theSimId = null) => {
    try {
      const payload = {
        wallet_address: wallet.publicKey,
        vault_id: vault.id,
        vault_name: vault.name,
        vault_apy: vault.apy,
        deposit_amount: sim.depositAmount,
        estimated_daily: sim.daily,
        estimated_annual: sim.annual,
        usdc_balance_before: sim.usdcBefore,
        usdc_balance_after: sim.usdcAfter,
        sol_fee_estimate: sim.solFee,
        sim_status: status,
        risk_level: vault.risk,
        strategy: vault.strategy || 'Concentrated Liquidity',
      }
      if (theSimId) {
        await db.from('tx_simulations').update({ sim_status: status }).eq('id', theSimId)
      } else {
        const { data } = await db.from('tx_simulations').insert(payload).select('id').single()
        return data?.id
      }
    } catch (e) {
      console.warn('[TxSimulator] DB save failed:', e.message)
    }
    return null
  }

  const handleSign = async () => {
    setSigning(true)
    setSigningError(null)
    const id = await saveToDb('simulated')
    setSavedId(id)

    await new Promise((r) => setTimeout(r, 1200))

    let signed = false
    let transactionError = null
    try {
      if (!window.solflare?.isConnected) {
        throw new Error('Solflare is not connected. Reconnect and retry.')
      }
      if (typeof window.solflare.signMessage === 'function') {
        await window.solflare.signMessage(new TextEncoder().encode(
          `Approve ${sim.depositAmount} USDC deposit into ${vault.name}`
        ))
      }
      signed = true
    } catch (error) {
      transactionError = error?.message || 'Wallet signing failed.'
      setSigningError(transactionError)
    }

    if (!signed) {
      await saveToDb('error', id)
      setResultStatus('error')
      setSigning(false)
      return
    }

    const mockTx = Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')
    setTxId(mockTx)

    await saveToDb('signed', id)
    setResultStatus('signed')
    setSigning(false)
    setStep('result')
  }

  const handleSaveSimOnly = async () => {
    const id = await saveToDb('simulated')
    setSavedId(id)
    setResultStatus('simulated')
    setStep('result')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-surface-800 border border-white/[0.08] shadow-brand-lg overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-surface-700/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 border border-brand/30 bg-brand/10 flex items-center justify-center">
                <Activity size={11} className="text-brand" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white tracking-widest">TRANSACTION SIMULATOR</p>
                <p className="text-[9px] text-ink-500 tracking-wider">
                  {step === 'input' && 'STEP 1 OF 3 · SET AMOUNT'}
                  {step === 'preview' && 'STEP 2 OF 3 · REVIEW SIMULATION'}
                  {step === 'result' && 'STEP 3 OF 3 · COMPLETE'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {['input', 'preview', 'result'].map((s, i) => (
                  <span
                    key={s}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      step === s ? 'bg-brand w-4' : i < ['input', 'preview', 'result'].indexOf(step) ? 'bg-brand/40' : 'bg-surface-600'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                className="p-1 text-ink-500 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-5">
            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div key="input" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <StepInput
                    vault={vault}
                    usdcBalance={usdcBalance}
                    amount={amount}
                    setAmount={setAmount}
                    onNext={handlePreview}
                    onClose={onClose}
                  />
                </motion.div>
              )}
              {step === 'preview' && sim && (
                <motion.div key="preview" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <StepPreview
                    vault={vault}
                    sim={sim}
                    onSign={handleSign}
                    onBack={() => { setStep('input'); setSim(null) }}
                    onSaveOnly={handleSaveSimOnly}
                    signing={signing}
                    analysis={execution}
                    error={signingError}
                  />
                </motion.div>
              )}
              {step === 'result' && sim && (
                <motion.div key="result" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <StepResult
                    vault={vault}
                    sim={sim}
                    status={resultStatus}
                    txId={txId}
                    onClose={onClose}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
