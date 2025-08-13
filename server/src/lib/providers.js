// Lightweight data providers: Yahoo (chart) primary, Stooq (CSV) fallback
// Returns array of { date: 'YYYY-MM-DD', open, high, low, close, volume }

function rangeToDays(range) {
  switch (range) {
    case '1mo': return 31;
    case '3mo': return 93;
    case '6mo': return 186;
    case '1y': return 370;
    default: return 186;
  }
}

export async function fetchFromYahoo(symbol, { range = '6mo', interval = '1d' } = {}) {
  const { default: yahooFinance } = await import('yahoo-finance2');
  // Silence deprecation chatter if any
  if (typeof yahooFinance.suppressNotices === 'function') {
    try { yahooFinance.suppressNotices(['ripHistorical']); } catch {}
  }
  const days = rangeToDays(range);
  const period2 = new Date();
  const period1 = new Date(period2.getTime() - days * 24 * 60 * 60 * 1000);
  const chart = await yahooFinance.chart(symbol, { interval, period1, period2 });
  const ts = chart?.timestamp || [];
  const q = chart?.indicators?.quote?.[0] || {};
  const data = ts.map((t, i) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10),
    open: q.open?.[i] ?? null,
    high: q.high?.[i] ?? null,
    low: q.low?.[i] ?? null,
    close: q.close?.[i] ?? null,
    volume: q.volume?.[i] ?? null,
  })).filter(d => d.close != null);
  if (!data.length) throw new Error('Yahoo returned no data');
  return { source: 'yahoo', data };
}

export async function fetchFromStooq(symbol, { range = '6mo' } = {}) {
  // Stooq CSV daily: https://stooq.com/q/d/l/?s=aapl.us&i=d
  // Columns: Date,Open,High,Low,Close,Volume
  const ds = rangeToDays(range);
  const s = `${String(symbol).toLowerCase()}.us`;
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Stooq fetch failed: ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header || !header.toLowerCase().startsWith('date,')) throw new Error('Unexpected Stooq CSV');
  const rows = lines.map((ln) => {
    const [date, open, high, low, close, volume] = ln.split(',');
    return {
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    };
  }).filter(r => !Number.isNaN(r.close));
  const sliced = rows.slice(-ds);
  if (!sliced.length) throw new Error('Stooq returned no data');
  return { source: 'stooq', data: sliced };
}

export async function getHistorical(symbol, opts) {
  try {
    const y = await fetchFromYahoo(symbol, opts);
    if (y?.data?.length) return y;
  } catch {}
  try {
    const s = await fetchFromStooq(symbol, opts);
    if (s?.data?.length) return s;
  } catch {}
  throw new Error('No live data from providers');
}
