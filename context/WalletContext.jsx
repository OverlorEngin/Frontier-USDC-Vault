import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const WalletContext = createContext(null)

// Simulated wallet addresses for demo
const DEMO_ADDRESSES = [
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
]

export function WalletProvider({ children }) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [publicKey, setPublicKey] = useState(null)
  const [usdcBalance, setUsdcBalance] = useState(null)
  const [solBalance, setSolBalance] = useState(null)
  const [depositedAmount, setDepositedAmount] = useState(0)
  const [transactions, setTransactions] = useState([])

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('syield_wallet')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setConnected(true)
        setPublicKey(data.publicKey)
        setUsdcBalance(data.usdcBalance)
        setSolBalance(data.solBalance)
        setDepositedAmount(data.depositedAmount || 0)
        setTransactions(data.transactions || [])
      } catch (e) {
        localStorage.removeItem('syield_wallet')
      }
    }
  }, [])

  const connect = useCallback(async (walletType = 'solflare') => {
    setConnecting(true)
    // Simulate wallet connection handshake
    await new Promise((r) => setTimeout(r, 1200))

    const address = DEMO_ADDRESSES[Math.floor(Math.random() * DEMO_ADDRESSES.length)]
    const usdc = parseFloat((Math.random() * 9800 + 200).toFixed(2))
    const sol = parseFloat((Math.random() * 12 + 0.5).toFixed(4))

    setPublicKey(address)
    setUsdcBalance(usdc)
    setSolBalance(sol)
    setConnected(true)
    setConnecting(false)

    localStorage.setItem(
      'syield_wallet',
      JSON.stringify({
        publicKey: address,
        usdcBalance: usdc,
        solBalance: sol,
        depositedAmount: 0,
        transactions: [],
      })
    )
  }, [])

  const disconnect = useCallback(() => {
    setConnected(false)
    setPublicKey(null)
    setUsdcBalance(null)
    setSolBalance(null)
    setDepositedAmount(0)
    setTransactions([])
    localStorage.removeItem('syield_wallet')
  }, [])

  const simulateDeposit = useCallback(
    async (amount, vaultName, apy) => {
      if (!connected) throw new Error('Wallet not connected')
      if (amount > usdcBalance) throw new Error('Insufficient USDC balance')

      // Simulate TX signing delay
      await new Promise((r) => setTimeout(r, 1800))

      const sig = Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')

      const newBalance = parseFloat((usdcBalance - amount).toFixed(2))
      const newDeposited = parseFloat((depositedAmount + amount).toFixed(2))

      const tx = {
        sig,
        type: 'Deposit',
        amount,
        vault: vaultName,
        apy,
        timestamp: Date.now(),
      }

      setUsdcBalance(newBalance)
      setDepositedAmount(newDeposited)
      setTransactions((prev) => [tx, ...prev].slice(0, 20))

      const saved = JSON.parse(localStorage.getItem('syield_wallet') || '{}')
      localStorage.setItem(
        'syield_wallet',
        JSON.stringify({
          ...saved,
          usdcBalance: newBalance,
          depositedAmount: newDeposited,
          transactions: [tx, ...((saved.transactions) || [])].slice(0, 20),
        })
      )

      return sig
    },
    [connected, usdcBalance, depositedAmount]
  )

  const simulateWithdraw = useCallback(
    async (amount, vaultName) => {
      if (!connected) throw new Error('Wallet not connected')
      await new Promise((r) => setTimeout(r, 1500))

      const sig = Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')

      const newDeposited = Math.max(0, parseFloat((depositedAmount - amount).toFixed(2)))
      const newBalance = parseFloat((usdcBalance + amount).toFixed(2))

      const tx = {
        sig,
        type: 'Withdraw',
        amount,
        vault: vaultName,
        timestamp: Date.now(),
      }

      setUsdcBalance(newBalance)
      setDepositedAmount(newDeposited)
      setTransactions((prev) => [tx, ...prev].slice(0, 20))

      const saved = JSON.parse(localStorage.getItem('syield_wallet') || '{}')
      localStorage.setItem(
        'syield_wallet',
        JSON.stringify({
          ...saved,
          usdcBalance: newBalance,
          depositedAmount: newDeposited,
          transactions: [tx, ...((saved.transactions) || [])].slice(0, 20),
        })
      )

      return sig
    },
    [connected, usdcBalance, depositedAmount]
  )

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        usdcBalance,
        solBalance,
        depositedAmount,
        transactions,
        connect,
        disconnect,
        simulateDeposit,
        simulateWithdraw,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
