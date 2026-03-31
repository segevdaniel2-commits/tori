/**
 * SQLite via sql.js (WebAssembly) – zero compilation, works on all platforms
 * Provides a better-sqlite3-compatible synchronous API shim
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './tori.db';
let db = null;

// ─── Persistence helpers ──────────────────────────────────────────────────────
const saveDb = () => {
  if (!db) return;
  const dir = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
};

setInterval(saveDb, 10_000);
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(0); });

// ─── better-sqlite3 compatible API ───────────────────────────────────────────
const getLastInsertRowid = () => {
  const res = db.exec('SELECT last_insert_rowid()');
  return res[0]?.values[0]?.[0] ?? null;
};

const prepare = (sql) => ({
  run: (...args) => {
    const params = Array.isArray(args[0]) ? args[0] : args;
    db.run(sql, params);
    const lastInsertRowid = getLastInsertRowid();
    saveDb();
    return { lastInsertRowid, changes: 1 };
  },
  get: (...args) => {
    const params = Array.isArray(args[0]) ? args[0] : args;
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      if (stmt.step()) return stmt.getAsObject();
      return undefined;
    } finally {
      stmt.free();
    }
  },
  all: (...args) => {
    const params = Array.isArray(args[0]) ? args[0] : args;
    const stmt = db.prepare(sql);
    const rows = [];
    try {
      stmt.bind(params);
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  },
});

const exec = (sql) => {
  db.run(sql);
  saveDb();
};

// ─── The db proxy object (mimics better-sqlite3's db instance) ────────────────
const makeDbProxy = () => ({
  prepare,
  exec,
  pragma: () => {}, // no-op, sql.js uses db.run('PRAGMA ...')
  close: () => { saveDb(); },
});

let dbProxy = null;

// ─── Schema ───────────────────────────────────────────────────────────────────
const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    description TEXT,
    logo_url TEXT,
    google_place_id TEXT,
    plan TEXT DEFAULT 'trial',
    trial_ends_at TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'trialing',
    buffer_minutes INTEGER DEFAULT 15,
    cancellation_hours INTEGER DEFAULT 24,
    terms_text TEXT,
    green_invoice_enabled INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS business_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_open INTEGER DEFAULT 1,
    open_time TEXT DEFAULT '09:00',
    close_time TEXT DEFAULT '20:00',
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE(business_id, day_of_week)
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    color TEXT DEFAULT '#7C3AED',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    staff_id INTEGER,
    name TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    price REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    whatsapp_phone TEXT NOT NULL,
    name TEXT,
    total_visits INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    last_visit_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(business_id, whatsapp_phone),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customer_associations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp_phone TEXT UNIQUE NOT NULL,
    business_id INTEGER NOT NULL,
    locked_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    staff_id INTEGER,
    service_id INTEGER,
    google_event_id TEXT,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    price REAL,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    source TEXT DEFAULT 'whatsapp',
    reminder_24h_sent INTEGER DEFAULT 0,
    reminder_1h_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS blocked_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    staff_id INTEGER,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp_phone TEXT UNIQUE NOT NULL,
    business_id INTEGER,
    stage TEXT DEFAULT 'select_business',
    extracted_data TEXT DEFAULT '{}',
    history TEXT DEFAULT '[]',
    msg_count INTEGER DEFAULT 0,
    greeted INTEGER DEFAULT 0,
    last_message_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER,
    whatsapp_phone TEXT NOT NULL,
    direction TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS trial_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );
`;

// ─── Async init (called once on startup) ─────────────────────────────────────
const init = async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  // Run schema (CREATE IF NOT EXISTS, safe to re-run)
  db.run(SCHEMA);

  // Migrations: add columns that may not exist in older DBs
  const migrations = [
    "ALTER TABLE appointments ADD COLUMN reminder_24h_sent INTEGER DEFAULT 0",
    "ALTER TABLE appointments ADD COLUMN reminder_1h_sent INTEGER DEFAULT 0",
    "ALTER TABLE customer_associations ADD COLUMN staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL",
    "ALTER TABLE businesses ADD COLUMN bot_tone TEXT DEFAULT 'friendly'",
    "ALTER TABLE businesses ADD COLUMN green_invoice_api_key TEXT",
  ];
  for (const m of migrations) {
    try { db.run(m); } catch (_) { /* column already exists */ }
  }

  saveDb();

  dbProxy = makeDbProxy();
  console.log(`[DB] SQLite (sql.js) ready: ${DB_PATH}`);
  return dbProxy;
};

function getDb() {
  if (!dbProxy) throw new Error('Database not initialized. Call init() first.');
  return dbProxy;
}

module.exports = { init, getDb };
