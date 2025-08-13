import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'stocks.sqlite');

let SQL = null;
let db = null;

export async function initDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  SQL = await initSqlJs({
    locateFile: (f) => path.resolve(__dirname, '../../node_modules/sql.js/dist', f),
  });
  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
    db.run(`CREATE TABLE IF NOT EXISTS companies (
      symbol TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );`);
    db.run(`CREATE TABLE IF NOT EXISTS prices (
      symbol TEXT,
      date TEXT,
      open REAL, high REAL, low REAL, close REAL, volume INTEGER,
      PRIMARY KEY (symbol, date)
    );`);
  }
  // Seed companies if empty
  const res = db.exec('SELECT COUNT(*) as c FROM companies');
  const count = res.length ? res[0].values[0][0] : 0;
  if (!count) {
    const companies = [
      ['AAPL', 'Apple Inc.'],
      ['MSFT', 'Microsoft Corporation'],
      ['GOOGL', 'Alphabet Inc. (Class A)'],
      ['AMZN', 'Amazon.com, Inc.'],
      ['META', 'Meta Platforms, Inc.'],
      ['TSLA', 'Tesla, Inc.'],
      ['NVDA', 'NVIDIA Corporation'],
      ['NFLX', 'Netflix, Inc.'],
      ['ADBE', 'Adobe Inc.'],
      ['INTC', 'Intel Corporation'],
      ['AMD', 'Advanced Micro Devices, Inc.']
    ];
    const stmt = db.prepare('INSERT INTO companies (symbol, name) VALUES (?, ?)');
    companies.forEach(([s, n]) => stmt.run([s, n]));
    stmt.free();
    persist();
  }
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function persist() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}
