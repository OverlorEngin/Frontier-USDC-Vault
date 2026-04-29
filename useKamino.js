import { useState, useEffect, useRef } from 'react'
import { PROXY_API, KAMINO, USDC_MINT, REFRESH_INTERVAL } from './config'

// Mock fallback vaults in case the API is unavailable or returns empty data
const FALLBACK_VAULTS = [
  {
    id: 'mock-1',
    name: 'USDC-USDT Stable',
    tokenA: 'USDC',
    tokenB: 'USDT',
    apy: 12.84,
    weeklyApy: 12.31,
    tvl: 18_420_000,
    risk: 'Low',
    strategy: 'Concentrated Liquidity',
    status: 'LIVE',
    isMock: true,
  },
  {
    id: 'mock-2',
    name: 'USDC-SOL',
    tokenA: 'USDC',
    tokenB: 'SOL',
    apy: 22.17,
    weeklyApy: 19.88,
    tvl: 9_730_000,
    risk: 'Medium',
    strategy: 'Wide Range',
    status: 'LIVE',
    isMock: true,
  },
  {
    id: 'mock-3',
    name: 'USDC Single-Sided',
    tokenA: 'USDC',
    tokenB: null,
    apy: 8.55,
    weeklyApy: 8.22,
    tvl: 31_650_000,
    risk: 'Low',
    strategy: 'Lending',
    status: 'LIVE',
    isMock: true,
  },
  {
    id: 'mock-4',
    name: 'USDC-JitoSOL',
    tokenA: 'USDC',
    tokenB: 'JitoSOL',
    apy: 31.45,
    weeklyApy: 28.72,
    tvl: 4_210_000,
    risk: 'High',
    strategy: 'Concentrated Liquidity',
    status: 'LIVE',
    isMock: true,
  },
]

function parseVaults(data) {
  if (!Array.isArray(data)) return null
  const usdc = data.filter((v) => {
    const a = v?.tokenAMint || v?.tokenA || ''
    const b = v?.tokenBMint || v?.tokenB || ''
    const name = (v?.strategyName || v?.name || '').toUpperCase()
    return (
      a === USDC_MINT ||
      b === USDC_MINT ||
      name.includes('USDC')
    )
  })
  if (!usdc.length) return null

  return usdc.slice(0, 6).map((v) => {
    const apy =
      Number(v?.apy24h ?? v?.apy ?? v?.averageApy ?? 0) * 100 ||
      Number(v?.lastApy ?? 0) * 100

    const tvl =
      Number(v?.tvl ?? v?.totalValueLocked ?? v?.sharesValueInTokens ?? 0)

    const tokenAName = v?.tokenASymbol || v?.tokenA || 'USDC'
    const tokenBName = v?.tokenBSymbol || v?.tokenB || null

    return {
      id: v?.strategy || v?.address || v?.id || String(Math.random()),
      name: v?.strategyName || v?.name || `${tokenAName}${tokenBName ? '-' + tokenBName : ''}`,
      tokenA: tokenAName,
      tokenB: tokenBName,
      apy: Math.min(apy, 300), // cap outliers
      weeklyApy: Number(v?.apy7d ?? v?.weeklyApy ?? 0) * 100 || Math.min(apy, 300) * 0.93,
      tvl,
      risk: apy > 25 ? 'High' : apy > 15 ? 'Medium' : 'Low',
      strategy: v?.strategyType || v?.type || 'Concentrated Liquidity',
      status: v?.status || 'LIVE',
      isMock: false,
    }
  })
}

export function useKamino() {
  const [vaults, setVaults] = useState(FALLBACK_VAULTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const cache = useRef({ data: null, ts: 0 })

  const fetchVaults = async (force = false) => {
    // Client-side cache: skip if fresher than REFRESH_INTERVAL
    if (!force && cache.current.data && Date.now() - cache.current.ts < REFRESH_INTERVAL) {
      setVaults(cache.current.data)
      setLoading(false)
      return
    }
    try {
      const res = await fetch(PROXY_API(KAMINO.strategies))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      // Kamino may return array directly or { strategies: [] }
      const rawArr = Array.isArray(json) ? json : json?.strategies || json?.data || []
      const parsed = parseVaults(rawArr)
      if (parsed && parsed.length) {
        cache.current = { data: parsed, ts: Date.now() }
        setVaults(parsed)
        setIsLive(true)
      } else {
        setVaults(FALLBACK_VAULTS)
        setIsLive(false)
      }
    } catch (e) {
      setError(e.message)
      setVaults(FALLBACK_VAULTS)
      setIsLive(false)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    fetchVaults(true)
    const id = setInterval(() => fetchVaults(true), REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const bestApy = vaults.reduce((max, v) => (v.apy > max ? v.apy : max), 0)
  const totalTvl = vaults.reduce((sum, v) => sum + (v.tvl || 0), 0)

  return { vaults, loading, error, lastUpdated, isLive, bestApy, totalTvl, refresh: () => fetchVaults(true) }
}
