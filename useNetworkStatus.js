import { useState, useEffect, useCallback, useRef } from 'react'
import { getRpcEndpoint } from './config'

const POLL_INTERVAL = 15_000 // 15s

async function fetchSlotHeight() {
  const endpoint = getRpcEndpoint()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [{ commitment: 'confirmed' }] }),
  })
  const json = await res.json()
  return json.result ?? null
}

async function fetchEpochInfo() {
  const endpoint = getRpcEndpoint()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getEpochInfo', params: [] }),
  })
  const json = await res.json()
  return json.result ?? null
}

export function useNetworkStatus() {
  const [slot, setSlot] = useState(null)
  const [latency, setLatency] = useState(null)
  const [healthy, setHealthy] = useState(null) // null = loading, true/false
  const [epoch, setEpoch] = useState(null)
  const timer = useRef(null)

  const poll = useCallback(async () => {
    const t0 = performance.now()
    try {
      const [slotResult, epochResult] = await Promise.all([fetchSlotHeight(), fetchEpochInfo()])
      const ms = Math.round(performance.now() - t0)
      setSlot(slotResult)
      setLatency(ms)
      setHealthy(true)
      if (epochResult) setEpoch(epochResult.epoch)
    } catch {
      setHealthy(false)
      setLatency(null)
    }
  }, [])

  useEffect(() => {
    poll()
    timer.current = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(timer.current)
  }, [poll])

  return { slot, latency, healthy, epoch }
}
