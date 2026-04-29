const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eitherway.ai'

export const PROXY_API = (url) =>
  `${API_BASE_URL}/api/proxy-api?url=${encodeURIComponent(url)}`

// Kamino Finance endpoints (api.kamino.finance is in the proxy allow-list)
export const KAMINO = {
  strategies: 'https://api.kamino.finance/strategies/all?env=mainnet-beta&status=LIVE',
  strategyById: (id) => `https://api.kamino.finance/strategies/${id}?env=mainnet-beta`,
  metrics: (id) =>
    `https://api.kamino.finance/strategies/${id}/metrics/history?env=mainnet-beta&period=30d`,
}

// Your specific Kamino vault addresses from the Frontier Hackathon build
export const TARGET_VAULTS = [
  '9tdFE3jRL5aiZVWyVmRCt2BFJJFBT9gJr3cGrBJHyLYf',
  'FqezMiwBBv3RAQHL6TbE3PNKW6qAbAJxerG5V38RUYAQ',
  'Cfuy5T6osdpDMzt2oPbPGHxLZZ8MBGzHBhRmzQMR3Hp',
]

// USDC mint on Solana Mainnet
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// QuickNode RPC — stored in localStorage so users can paste their own SOFT-PURPLE-FLOWER endpoint
export const getRpcEndpoint = () =>
  localStorage.getItem('rpc_endpoint') || 'https://api.mainnet-beta.solana.com'

// QuickNode endpoint name hint for the settings UI
export const QUICKNODE_NAME = 'SOFT-PURPLE-FLOWER'

export const REFRESH_INTERVAL = 30_000 // 30 seconds

export const SOLANA_EXPLORER = 'https://solscan.io'
