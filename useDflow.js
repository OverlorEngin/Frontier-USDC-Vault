import { useState, useEffect } from 'react'
import { PROXY_API } from './config'

const FALLBACK_ANALYSIS = {
  status: 'MEV PROTECTED',
  activeRoutes: 4,
  avgSavings: 0.12,
  maxSlippage: 0.5,
  latency: 220,
  lastUpdated: null,
  notes: 'DFlow analysis enabled for MEV-safe execution paths on Solana Mainnet.',
}

const FALLBACK_OPPORTUNITIES = [
  { label: 'USDC → SOL deposit', savings: 0.08, path: 'DFlow guarded route', status: 'Verified' },
  { label: 'USDC single-sided deposit', savings: 0.04, path: 'MEV shielded swap', status: 'Live' },
  { label: 'USDC-SOL auto-liquidity', savings: 0.13, path: 'Protected routing', status: 'Ready' },
]

export function useDflow() {
  const [data, setData] = useState(FALLBACK_ANALYSIS)
  const [opportunities, setOpportunities] = useState(FALLBACK_OPPORTUNITIES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const fetchAnalysis = async () => {
      try {
        const endpoint = 'https://api.dflow.xyz/v1/summary?network=mainnet-beta'
        const res = await fetch(PROXY_API(endpoint), { signal: AbortSignal.timeout(7000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!active) return
        const summary = json?.data ?? json ?? {}
        setData({
          status: summary.status || FALLBACK_ANALYSIS.status,
          activeRoutes: summary.activeRoutes ?? summary.route_count ?? FALLBACK_ANALYSIS.activeRoutes,
          avgSavings: summary.avgSavings ?? summary.savings ?? FALLBACK_ANALYSIS.avgSavings,
          maxSlippage: summary.maxSlippage ?? FALLBACK_ANALYSIS.maxSlippage,
          latency: summary.latency ?? FALLBACK_ANALYSIS.latency,
          lastUpdated: new Date(),
          notes: summary.notes || FALLBACK_ANALYSIS.notes,
        })
        setOpportunities(
          (summary.opportunities || FALLBACK_OPPORTUNITIES).slice(0, 3).map((item, idx) => ({
            label: item.label || `Opportunity ${idx + 1}`,
            savings: Number(item.savings ?? item.avgSavings ?? FALLBACK_OPPORTUNITIES[idx]?.savings ?? 0),
            path: item.path || item.route || 'DFlow route',
            status: item.status || 'Live',
          }))
        )
      } catch (err) {
        if (!active) return
        setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAnalysis()
    const interval = setInterval(fetchAnalysis, 30_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return { data, opportunities, loading, error, refresh: () => null }
}
