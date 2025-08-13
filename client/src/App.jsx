import React, { useEffect, useMemo, useState } from 'react'
import { fetchCompanies, fetchPrices, fetchPrediction } from './api'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, TimeScale)

const ranges = [
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' }
]

export default function App() {
  const [companies, setCompanies] = useState([])
  const [selected, setSelected] = useState(null)
  const [range, setRange] = useState('6mo')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

  useEffect(() => {
    if (!selected && companies.length) {
      setSelected(companies[0].symbol)
    }
  }, [companies, selected])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
  fetchPrices(selected, { range, interval: '1d' })
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  fetchPrediction(selected, 5).then(setPrediction).catch(() => setPrediction(null))
  }, [selected, range])

  const chartData = useMemo(() => {
    if (!data?.data?.length) return null
    const labels = data.data.map(d => d.date)
    const prices = data.data.map(d => d.close)
    const sma = (arr, n) => arr.map((_, i) => i+1 >= n ? (arr.slice(i+1-n, i+1).reduce((a,b)=>a+b,0)/n) : null)
    const sma20 = sma(prices, 20)
    const sma50 = sma(prices, 50)
    return {
      labels,
      datasets: [
        {
          label: `${data.symbol} Close`,
          data: prices,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25,118,210,0.15)',
          fill: true,
          tension: 0.2,
          pointRadius: 0
  },
        {
          label: 'SMA 20',
          data: sma20,
          borderColor: '#ef6c00',
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'SMA 50',
          data: sma50,
          borderColor: '#2e7d32',
          pointRadius: 0,
          tension: 0.2
        }
      ]
    }
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
  }, [companies, query])

  const latest = useMemo(() => {
    if (!data?.data?.length) return null
    const last = data.data[data.data.length - 1]
    return last
  }, [data])

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Companies</h2>
        <input
          className="search"
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <ul className="company-list">
          {filtered.map(c => (
            <li key={c.symbol} className={selected === c.symbol ? 'active' : ''} onClick={() => setSelected(c.symbol)}>
              <strong>{c.symbol}</strong> — {c.name}
            </li>
          ))}
        </ul>
      </aside>
      <main className="main">
        <div className="header">
          <h1>Stock Market Dashboard</h1>
          <div className="controls">
            <label>Range:</label>
            <select value={range} onChange={e => setRange(e.target.value)}>
              {ranges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {latest && (
          <div className="mini">
            <span className="pill">{selected}</span>
            <span className="muted">{latest.date}</span>
            <span className="pill blue">Close: {latest.close}</span>
          </div>
        )}

        <div className="card" style={{ marginTop: 12 }}>
          {!selected && <div>Select a company from the left panel</div>}
          {selected && loading && <div>Loading {selected}…</div>}
          {selected && !loading && chartData && <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: {
              x: { display: true, ticks: { maxTicksLimit: 10 } },
              y: { display: true }
            }
          }} height={360} />}
          {selected && !loading && !chartData && (
            <div style={{ padding: 12, color: '#666' }}>No data available for {selected}.</div>
          )}
        </div>

        {data?.stats && (
          <div className="stats">
            <div className="stat">52W High: <strong>{data.stats.high52 ?? '-'}</strong></div>
            <div className="stat">52W Low: <strong>{data.stats.low52 ?? '-'}</strong></div>
            <div className="stat">Avg Volume: <strong>{data.stats.avgVol?.toLocaleString?.() ?? '-'}</strong></div>
            {prediction && (
              <div className="stat">Pred close: <strong>{prediction.predictedClose ?? '-'}</strong>{typeof prediction.std === 'number' && <span> (±{prediction.std})</span>}</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
