// Async database layer for SahAI.
// Production: Supabase PostgreSQL when DATABASE_URL (or SUPABASE_DB_URL) exists.
// Development: Node's built-in SQLite when no PostgreSQL URL is configured.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const seed = require('./seed-data');

const POSTGRES_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
const provider = POSTGRES_URL ? 'supabase-postgres' : 'sqlite';

const columnNames = {
  userid: 'userId', vendorid: 'vendorId', upiid: 'upiId', offerprice: 'offerPrice',
  createdat: 'createdAt', joinedat: 'joinedAt', applyurl: 'applyUrl',
  schemeid: 'schemeId', sortorder: 'sortOrder', sizebytes: 'sizeBytes',
  storageprovider: 'storageProvider', publicid: 'publicId', relpath: 'relPath',
  ownerid: 'ownerId', passwordhash: 'passwordHash', passwordsalt: 'passwordSalt',
};
function normalizeRow(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const mapped = columnNames[key] || key;
    out[mapped] = ['c', 'm', 's'].includes(mapped) && typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)
      ? Number(value) : value;
  }
  return out;
}

function postgresSql(sql) {
  let index = 0;
  let out = sql.replace(/\?/g, () => '$' + (++index));
  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO/i.test(out)) {
    out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
    out = out.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
  }
  return out;
}

function createPostgresAdapter() {
  // Loaded only in production mode, allowing zero-dependency SQLite development.
  let Pool;
  try { ({ Pool } = require('pg')); }
  catch (_) { throw new Error('DATABASE_URL is configured but the pg package is missing. Run npm install in server/.'); }
  const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
  const pool = new Pool({ connectionString: POSTGRES_URL, ssl, max: Number(process.env.DATABASE_POOL_SIZE || 5) });
  return {
    exec: async (sql) => { await pool.query(sql); },
    prepare: (sql) => ({
      get: async (...params) => normalizeRow((await pool.query(postgresSql(sql), params)).rows[0]),
      all: async (...params) => (await pool.query(postgresSql(sql), params)).rows.map(normalizeRow),
      run: async (...params) => ({ changes: (await pool.query(postgresSql(sql), params)).rowCount || 0 }),
    }),
    close: async () => pool.end(),
  };
}

function createSqliteAdapter() {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = process.env.SAHAI_DB || path.join(__dirname, 'sahai.db');
  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  return {
    exec: async (sql) => sqlite.exec(sql),
    prepare: (sql) => {
      const statement = sqlite.prepare(sql);
      return {
        get: async (...params) => statement.get(...params),
        all: async (...params) => statement.all(...params),
        run: async (...params) => statement.run(...params),
      };
    },
    close: async () => sqlite.close(),
  };
}

const db = POSTGRES_URL ? createPostgresAdapter() : createSqliteAdapter();

async function initializeSchema() {
  if (POSTGRES_URL) {
    await db.exec(fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf8'));
    return;
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT UNIQUE, role TEXT, avatar TEXT, vendorId TEXT, passwordHash TEXT, passwordSalt TEXT);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, name TEXT, owner TEXT, phone TEXT, upiId TEXT, category TEXT, location TEXT, hours TEXT, logo TEXT, photo TEXT, rating REAL, joinedAt TEXT, status TEXT, description TEXT);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, vendorId TEXT, name TEXT, category TEXT, price REAL, offerPrice REAL, stock INTEGER, available INTEGER, description TEXT, image TEXT, popular INTEGER, discount REAL, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, vendorId TEXT, vendor TEXT, amount REAL, method TEXT, status TEXT, date TEXT);
    CREATE TABLE IF NOT EXISTS schemes (id TEXT PRIMARY KEY, name TEXT, ministry TEXT, category TEXT, eligibility TEXT, documents TEXT, benefits TEXT, applyUrl TEXT);
    CREATE TABLE IF NOT EXISTS scheme_bookmarks (userId TEXT, schemeId TEXT, PRIMARY KEY (userId, schemeId));
    CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, vendorId TEXT, author TEXT, rating INTEGER, comment TEXT, date TEXT);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, userId TEXT, type TEXT, title TEXT, description TEXT, time TEXT, read INTEGER, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, user TEXT, issue TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS kv (scope TEXT, key TEXT, value TEXT, PRIMARY KEY (scope, key));
    CREATE TABLE IF NOT EXISTS gallery_images (id TEXT PRIMARY KEY, vendorId TEXT NOT NULL, url TEXT NOT NULL, caption TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS uploaded_files (id TEXT PRIMARY KEY, ownerId TEXT, relPath TEXT NOT NULL, mime TEXT, sizeBytes INTEGER, createdAt TEXT, storageProvider TEXT DEFAULT 'local', publicId TEXT);
  `);
  const userCols = (await db.prepare('PRAGMA table_info(users)').all()).map((c) => c.name);
  if (!userCols.includes('passwordHash')) await db.exec('ALTER TABLE users ADD COLUMN passwordHash TEXT;');
  if (!userCols.includes('passwordSalt')) await db.exec('ALTER TABLE users ADD COLUMN passwordSalt TEXT;');
  const uploadCols = (await db.prepare('PRAGMA table_info(uploaded_files)').all()).map((c) => c.name);
  if (!uploadCols.includes('storageProvider')) await db.exec("ALTER TABLE uploaded_files ADD COLUMN storageProvider TEXT DEFAULT 'local';");
  if (!uploadCols.includes('publicId')) await db.exec('ALTER TABLE uploaded_files ADD COLUMN publicId TEXT;');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  const test = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(test, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function kvGet(scope, key, fallback) {
  const row = await db.prepare('SELECT value FROM kv WHERE scope = ? AND key = ?').get(scope, key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return fallback; }
}
async function kvSet(scope, key, value) {
  await db.prepare('INSERT INTO kv (scope, key, value) VALUES (?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value').run(scope, key, JSON.stringify(value));
  return value;
}

async function seedIfEmpty() {
  const count = (await db.prepare('SELECT COUNT(*) AS c FROM vendors').get()).c;
  if (Number(count) > 0 || process.env.SEED_DEMO_DATA === 'false') return;
  const now = new Date().toISOString();
  for (const u of seed.USERS) await db.prepare('INSERT INTO users (id,name,phone,email,role,avatar,vendorId) VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(u.id,u.name,u.phone,u.email,u.role,u.avatar||null,u.vendorId);
  for (const v of seed.VENDORS) await db.prepare('INSERT INTO vendors (id,name,owner,phone,upiId,category,location,hours,logo,photo,rating,joinedAt,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(v.id,v.name,v.owner,v.phone,v.upiId,v.category,v.location,v.hours,v.logo||null,v.photo||null,v.rating,v.joinedAt,v.status,v.description);
  for (const p of seed.PRODUCTS) await db.prepare('INSERT INTO products (id,vendorId,name,category,price,offerPrice,stock,available,description,image,popular,discount,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(p.id,p.vendorId,p.name,p.category,p.price,p.offerPrice,p.stock,p.available?1:0,p.description,p.image,p.popular?1:0,p.discount,now);
  for (const t of seed.TRANSACTIONS) await db.prepare('INSERT INTO transactions (id,vendorId,vendor,amount,method,status,date) VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(t.id,t.vendorId,t.vendor,t.amount,t.method,t.status,t.date);
  for (const s of seed.SCHEMES) await db.prepare('INSERT INTO schemes (id,name,ministry,category,eligibility,documents,benefits,applyUrl) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(s.id,s.name,s.ministry,s.category,JSON.stringify(s.eligibility),JSON.stringify(s.documents),s.benefits,s.applyUrl);
  for (const r of seed.REVIEWS) await db.prepare('INSERT INTO reviews (id,vendorId,author,rating,comment,date) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(r.id,r.vendorId,r.author,r.rating,r.comment,r.date);
  for (const n of seed.NOTIFICATIONS) await db.prepare('INSERT INTO notifications (id,userId,type,title,description,time,read,createdAt) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(n.id,'u_vendor',n.type,n.title,n.description,n.time,n.read?1:0,now);
  for (const r of seed.REPORTS) await db.prepare('INSERT INTO reports (id,"user",issue,status) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').run(r.id,r.user,r.issue,r.status);
  const starter=[918643,2872755,533280,1638280];
  for (let i=0;i<starter.length;i++) { const id=starter[i]; await db.prepare('INSERT INTO gallery_images (id,vendorId,url,caption,sortOrder,createdAt) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(`g_${id}`,'v1','https:'+'//images.pexels.com/photos/'+id+'/pexels-photo-'+id+'.jpeg?auto=compress&w=800','',i,now); }
  await kvSet('vendor:v1','analytics',seed.ANALYTICS);
  await kvSet('vendor:v1','seo',seed.SEO);
  await kvSet('vendor:v1','website',seed.WEBSITE);
  await kvSet('vendor:v1','qr',seed.QR);
  await kvSet('user:u_vendor','settings',seed.SETTINGS);
  await kvSet('global','marketing',seed.MARKETING);
}

async function ensureConfiguredAdmin() {
  const email = String(process.env.APP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.APP_ADMIN_PASSWORD || '');
  if (!email && !password) return;
  if (!email || password.length < 10) {
    throw new Error('APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD (minimum 10 characters) must both be configured');
  }
  const existing = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const { hash, salt } = hashPassword(password);
  if (existing) {
    await db.prepare('UPDATE users SET name=?, role=?, passwordHash=?, passwordSalt=? WHERE id=?')
      .run(process.env.APP_ADMIN_NAME || existing.name || 'SahAI Admin', 'admin', hash, salt, existing.id);
  } else {
    await db.prepare('INSERT INTO users (id,name,phone,email,role,avatar,vendorId,passwordHash,passwordSalt) VALUES (?,?,?,?,?,?,?,?,?)')
      .run('u_admin_' + crypto.randomBytes(6).toString('hex'), process.env.APP_ADMIN_NAME || 'SahAI Admin', '', email, 'admin', null, null, hash, salt);
  }
}

const ready = (async () => {
  await initializeSchema();
  await seedIfEmpty();
  await ensureConfiguredAdmin();
})();
module.exports = { db, kvGet, kvSet, seed, hashPassword, verifyPassword, ready, provider };
