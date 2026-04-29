import { useState, useEffect, useRef } from 'react'
import { PROXY_API } from './config'

// SOL mint address (wrapped SOL)
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const CACHE_TTL = 60_000 // 60s cache

// Fallback 7-day SOL price history (approximate, for demo when API unavailable)
function generateFallbackHistory(basePrice = 148, points = 42) {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * 4 * 3600 * 1000
    const noise = (Math.random() - 0.5) * 8
    const trend = (i / points) * 4
    return {
      unixTime: Math.floor(t / 1000),
      value: parseFloat((basePrice + noise + trend).toFixed(2)),
    }
  })
}

const FALLBACK_TRENDING = [
  { address: SOL_MINT, symbol: 'SOL', name: 'Solana', price: 148.42, v24hUSD: 1_240_000_000, priceChange24h: 3.21 },
  { address: USDC_MINT, symbol: 'USDC', name: 'USD Coin', price: 1.0, v24hUSD: 890_000_000, priceChange24h: 0.01 },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', price: 0.72, v24hUSD: 210_000_000, priceChange24h: -1.4 },
  { address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', symbol: 'stSOL', name: 'Lido Staked SOL', price: 162.1, v24hUSD: 88_000_000, priceChange24h: 2.8 },
  { address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'jitoSOL', name: 'Jito Staked SOL', price: 165.3, v24hUSD: 74_000_000, priceChange24h: 3.1 },
  { address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade Staked SOL', price: 163.7, v24hUSD: 52_000_000, priceChange24h: 2.9 },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', price: 0.0000182, v24hUSD: 47_000_000, priceChange24h: 8.4 },
  { address: 'WENWENvqqNya429ubCdR81ZmD69brD69brwQaaBYY6p3LCpk', symbol: 'WEN', name: 'Wen', price: 0.00005, v24hUSD: 31_000_000, priceChange24h: -3.2 },
]

function generateFallbackHistory(basePrice = 1.0, points = 42) {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * 4 * 3600 * 1000
    const noise = (Math.random() - 0.5) * 0.002
    const drift = (i / points) * 0.003
    return {
      unixTime: Math.floor(t / 1000),
      value: parseFloat((basePrice + noise + drift).toFixed(4)),
    }
  })
}

async function fetchWithProxy(url) {
  const res = await fetch(PROXY_API(url), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useBirdeye() {
  const [usdcPrice, setUsdcPrice] = useState(null)
  const [solPrice, setSolPrice] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [trending, setTrending] = useState(FALLBACK_TRENDING)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [priceChange24h, setPriceChange24h] = useState(null)
  const [pegDeviation, setPegDeviation] = useState(null)
  const cache = useRef({})

  const normalizeItems = (items = []) =>
    items.map((item) => ({
      unixTime: item.unixTime || item.timestamp || item.time || 0,
      value: parseFloat(item.value ?? item.price ?? item.close ?? 1) || 1,
    }))

  const fetchAll = async () => {
    const now = Date.now()
    let live = false

    try {
      const priceUrl = `https://public-api.birdeye.so/public/price?address=${USDC_MINT}`
      const priceJson = await fetchWithProxy(priceUrl)
      const currentPrice = priceJson?.data?.value ?? priceJson?.value ?? null
      const numericPrice = currentPrice != null ? parseFloat(currentPrice) : null
      if (numericPrice != null) {
        setUsdcPrice(numericPrice.toFixed(4))
        setPegDeviation((numericPrice - 1) * 100)
        live = true
      }

      const timeFrom = Math.floor((now / 1000) - 7 * 86400)
      const timeTo = Math.floor(now / 1000)
      const histUrl = `https://public-api.birdeye.so/public/history_price?address=${USDC_MINT}&address_type=token&type=4H&time_from=${timeFrom}&time_to=${timeTo}`
      const histJson = await fetchWithProxy(histUrl)
      const items = normalizeItems(histJson?.data?.items ?? histJson?.items ?? [])
      if (items.length >= 3) {
        setPriceHistory(items)
        if (items.length >= 7) {
          const latest = items[items.length - 1]?.value
          const dayAgo = items[items.length - 7]?.value
          if (latest && dayAgo) {
            setPriceChange24h(((latest - dayAgo) / dayAgo) * 100)
          }
        }
      } else {
        setPriceHistory(generateFallbackHistory(numericPrice || 1))
        setPriceChange24h(0)
      }
    } catch {
      setUsdcPrice(1.0.toFixed(4))
      setPegDeviation(0)
      setPriceHistory(generateFallbackHistory(1))
      setPriceChange24h(0)
    }

    try {
      const priceUrl = `https://public-api.birdeye.so/public/price?address=${SOL_MINT}`
      const priceJson = await fetchWithProxy(priceUrl)
      const price = priceJson?.data?.value ?? priceJson?.value ?? null
      if (price) {
        setSolPrice(parseFloat(price).toFixed(2))
        live = true
      }
    } catch {
      // keep previous SOL context if available
    }

    try {
      const trendUrl = `https://public-api.birdeye.so/public/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=10`
      const trendJson = await fetchWithProxy(trendUrl)
      const tokens = trendJson?.data?.tokens ?? trendJson?.tokens ?? []
      if (tokens.length >= 3) {
        setTrending(
          tokens.slice(0, 8).map((t) => ({
            address: t.address,
            symbol: t.symbol || '—',
            name: t.name || t.symbol || '—',
            price: t.price ?? t.value ?? 0,
            v24hUSD: t.v24hUSD ?? t.volume24h ?? 0,
            priceChange24h: t.priceChange24h ?? t.change24h ?? null,
          }))
        )
      }
    } catch {
      // keep fallback trending
    }

    setIsLive(live)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, CACHE_TTL)
    return () => clearInterval(id)
  }, [])

  return { usdcPrice, solPrice, priceHistory, trending, loading, isLive, priceChange24h, pegDeviation, refresh: fetchAll }
}
