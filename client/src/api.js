const BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}` : ''

export async function fetchCompanies() {
  const res = await fetch(`${BASE}/api/companies`)
  if (!res.ok) throw new Error('Failed to load companies')
  return res.json()
}

export async function fetchPrices(symbol, opts = {}) {
  const params = new URLSearchParams({ range: '6mo', interval: '1d', ...opts })
  const res = await fetch(`${BASE}/api/prices/${symbol}?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to load prices')
  return res.json()
}

export async function fetchPrediction(symbol, lookback = 5) {
  const res = await fetch(`${BASE}/api/predict/${symbol}?lookback=${lookback}`)
  if (!res.ok) throw new Error('Failed to load prediction')
  return res.json()
}
