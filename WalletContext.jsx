import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getRpcEndpoint, USDC_MINT, SOLANA_EXPLORER } from './config'

const WalletCtx = createContext(null)

// ── helpers ───────────────────────────────────────────────────────────────────
async function rpcPost(method, params) {
  const endpoint = getRpcEndpoint()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = await res.json()
  return json.result
}

async function fetchSolBalance(pubkey) {
  try {
    const result = await rpcPost('getBalance', [pubkey, { commitment: 'confirmed' }])
    return result ? (result.value / 1e9).toFixed(4) : '0.0000'
  } catch {
    return '0.0000'
  }
}

async function fetchUsdcBalance(pubkey) {
  try {
    const result = await rpcPost('getTokenAccountsByOwner', [
      pubkey,
      { mint: USDC_MINT },
      { encoding: 'jsonParsed' },
    ])
    if (!result?.value?.length) return '0.00'
    const amount = result.value[0].account.data.parsed.info.tokenAmount.uiAmount
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch {
    return '0.00'
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null)  // { publicKey, shortKey }
  const [solBalance, setSolBalance] = useState(null)
  const [usdcBalance, setUsdcBalance] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  const loadBalances = useCallback(async (pubkey) => {
    const [sol, usdc] = await Promise.all([
      fetchSolBalance(pubkey),
      fetchUsdcBalance(pubkey),
    ])
    setSolBalance(sol)
    setUsdcBalance(usdc)
  }, [])

  // Re-load balances on a 30s interval when connected
  useEffect(() => {
    if (!wallet) return
    loadBalances(wallet.publicKey)
    const id = setInterval(() => loadBalances(wallet.publicKey), 30_000)
    return () => clearInterval(id)
  }, [wallet, loadBalances])

  const connect = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      // Detect Solflare
      if (typeof window === 'undefined' || !window.solflare) {
        window.open('https://solflare.com', '_blank')
        throw new Error('Solflare not detected — install the extension and refresh.')
      }
      await window.solflare.connect()
      const pubkey = window.solflare.publicKey?.toString()
      if (!pubkey) throw new Error('Connection rejected.')
      const shortKey = pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
      setWallet({ publicKey: pubkey, shortKey })
    } catch (e) {
      setError(e.message || 'Connection failed.')
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    try { await window.solflare?.disconnect() } catch {}
    setWallet(null)
    setSolBalance(null)
    setUsdcBalance(null)
  }, [])

  // Listen for Solflare disconnect events
  useEffect(() => {
    const handler = () => {
      setWallet(null)
      setSolBalance(null)
      setUsdcBalance(null)
    }
    window.solflare?.on?.('disconnect', handler)
    return () => window.solflare?.off?.('disconnect', handler)
  }, [])

  return (
    <WalletCtx.Provider
      value={{
        wallet,
        solBalance,
        usdcBalance,
        connecting,
        error,
        connect,
        disconnect,
        explorer: (addr) => `${SOLANA_EXPLORER}/account/${addr}`,
      }}
    >
      {children}
    </WalletCtx.Provider>
  )
}

export const useWallet = () => useContext(WalletCtx)
