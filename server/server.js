// SahAI backend - zero dependency Node HTTP + SQLite REST API.
// Run: node server.js   (needs Node >= 22.5)

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { db, kvGet, kvSet, seed, hashPassword, verifyPassword, ready: databaseReady, provider: databaseProvider } = require('./db');
const cloudinaryStorage = require('./cloudinary');

const PORT = process.env.PORT || 4000;
const ALLOW_DEMO_AUTH = process.env.ALLOW_DEMO_AUTH === 'true' ||
  (databaseProvider === 'sqlite' && process.env.ALLOW_DEMO_AUTH !== 'false');
const uid = (p = 'id') => `${p}_${crypto.randomBytes(6).toString('hex')}`;

// ---------- upload config ----------
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB post client-side compression

function extFromMime(mime) { return MIME_EXT[mime] || 'bin'; }
function publicUrlFor(relPath) { return `/uploads/${relPath}`; }
function absPathFor(relPath) {
  // Guard against path traversal.
  const safe = path.normalize(relPath).replace(/^([/\\])+/, '');
  const full = path.join(UPLOAD_DIR, safe);
  if (!full.startsWith(UPLOAD_DIR)) return null;
  return full;
}

async function deleteUploadIfOwned(url, ownerId) {
  if (!url || typeof url !== 'string') return false;
  const lookup = url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : url;
  const row = await db.prepare('SELECT * FROM uploaded_files WHERE relPath = ?').get(lookup);
  if (!row) return false; // Ignore external/untracked URLs.
  if (ownerId && row.ownerId && row.ownerId !== ownerId) return false;

  if (row.storageProvider === 'cloudinary') {
    if (!cloudinaryStorage.isConfigured()) {
      console.warn('Cloudinary asset could not be deleted because credentials are unavailable:', row.publicId);
      return false;
    }
    try {
      await cloudinaryStorage.deleteImage(row.publicId);
    } catch (err) {
      console.warn('Cloudinary delete failed:', err && err.message ? err.message : err);
      return false;
    }
  } else {
    const abs = absPathFor(row.relPath);
    if (abs && fs.existsSync(abs)) {
      try { fs.unlinkSync(abs); } catch (_) { /* best effort */ }
    }
  }

  await db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(row.id);
  return true;
}

// ---------- helpers ----------
function send(res, status, body) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(data);
}

function readBody(req, { maxBytes = 32 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Payload too large'), { code: 413 }));
        req.destroy();
        return;
      }
      raw += c;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function getUser(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const sess = await db.prepare('SELECT userId FROM sessions WHERE token = ?').get(token);
  if (!sess) return null;
  return await db.prepare('SELECT * FROM users WHERE id = ?').get(sess.userId) || null;
}

// ---------- serializers ----------
const toProduct = (r) => ({
  id: r.id, name: r.name, category: r.category, price: r.price,
  offerPrice: r.offerPrice ?? undefined, stock: r.stock, available: !!r.available,
  description: r.description, image: r.image, popular: !!r.popular,
  discount: r.discount ?? undefined,
});
const toVendor = (r) => ({
  id: r.id, name: r.name, owner: r.owner, phone: r.phone, upiId: r.upiId,
  category: r.category, location: r.location, hours: r.hours, logo: r.logo || undefined,
  photo: r.photo || undefined, rating: r.rating, joinedAt: r.joinedAt, status: r.status,
  description: r.description || '',
});
const toScheme = (r, bookmarked) => ({
  id: r.id, name: r.name, ministry: r.ministry, category: r.category,
  eligibility: JSON.parse(r.eligibility || '[]'), documents: JSON.parse(r.documents || '[]'),
  benefits: r.benefits, applyUrl: r.applyUrl, bookmarked: !!bookmarked,
});
const toReview = (r) => ({ id: r.id, author: r.author, rating: r.rating, comment: r.comment, date: r.date });
const toNotif = (r) => ({ id: r.id, type: r.type, title: r.title, description: r.description, time: r.time, read: !!r.read });
const toGallery = (r) => ({ id: r.id, url: r.url, caption: r.caption || '', sortOrder: r.sortOrder || 0, createdAt: r.createdAt });

function currentVendorId(user) {
  return (user && user.vendorId) || 'v1';
}

// ---------- route handlers ----------
const routes = [];
function route(method, pattern, handler, auth = true) {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ method, regex, keys, handler, auth });
}

// --- Auth ---
route('POST', '/api/auth/otp/send', async (req, res, _p, body) => {
  if (!body.phone || String(body.phone).replace(/\D/g, '').length < 10)
    return send(res, 400, { error: 'Enter a valid phone number' });
  // Demo OTP is always 1234
  send(res, 200, { ok: true, message: 'OTP sent. Use 1234 for demo.' });
}, false);

// Create a session token for a user id.
async function startSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  await db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?,?,?)').run(token, userId, new Date().toISOString());
  return token;
}
function publicUser(user) {
  return { id: user.id, name: user.name, phone: user.phone, email: user.email || undefined, role: user.role, avatar: user.avatar || undefined };
}

async function createVendorRecord(name, phone = '') {
  const vendorId = uid('v');
  await db.prepare('INSERT INTO vendors (id,name,owner,phone,upiId,category,location,hours,logo,photo,rating,joinedAt,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(vendorId, name || 'My Business', name || '', phone, '', 'General', '', '', null, null, 0, new Date().toISOString(), 'active', '');
  return vendorId;
}

async function verifySupabaseAccessToken(accessToken) {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const publishableKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
  if (!supabaseUrl || !publishableKey) {
    const error = new Error('Google authentication is not configured on the backend');
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

// Sign up: creates a real user row with a hashed password.
route('POST', '/api/auth/signup', async (req, res, _p, body) => {
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  // Public signup can only create vendor accounts. Admins are provisioned by
  // backend-only environment variables, never by a browser-supplied role.
  const role = 'vendor';
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: 'Enter a valid email address' });
  if (String(password).length < 6) return send(res, 400, { error: 'Password must be at least 6 characters' });

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return send(res, 409, { error: 'An account with this email already exists' });

  const { hash, salt } = hashPassword(password);
  const userId = uid('u');

  // Give every new VENDOR their own isolated vendor record so their photos,
  // products, UPI/QR, website and analytics are private to their account
  // (and still sync across their own devices). Admins don't own a storefront.
  let vendorId = null;
  if (role === 'vendor') {
    vendorId = uid('v');
    await db.prepare('INSERT INTO vendors (id,name,owner,phone,upiId,category,location,hours,logo,photo,rating,joinedAt,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(vendorId, name || 'My Business', name || '', body.phone || '', '', 'General', '', '', null, null, 0, new Date().toISOString(), 'active', '');
  }

  await db.prepare('INSERT INTO users (id, name, phone, email, role, avatar, vendorId, passwordHash, passwordSalt) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(userId, name, body.phone || '', email, role, null, vendorId, hash, salt);

  const token = await startSession(userId);
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  send(res, 200, { token, user: publicUser(user) });
}, false);

// Exchange a verified Supabase Google session for a SahAI API session.
// Email/name/avatar are read only from Supabase's authenticated user endpoint,
// never trusted from browser-supplied profile fields.
route('POST', '/api/auth/google', async (req, res, _p, body) => {
  const accessToken = body && body.accessToken;
  if (!accessToken || typeof accessToken !== 'string') return send(res, 400, { error: 'Google access token is required' });

  let authUser;
  try {
    authUser = await verifySupabaseAccessToken(accessToken);
  } catch (error) {
    return send(res, error.statusCode || 502, { error: error.message || 'Could not verify Google login' });
  }
  const email = String(authUser && authUser.email || '').trim().toLowerCase();
  if (!authUser || !email) return send(res, 401, { error: 'Google session is invalid or expired' });

  const metadata = authUser.user_metadata || {};
  const googleName = String(metadata.full_name || metadata.name || email.split('@')[0]).trim();
  const googleAvatar = String(metadata.avatar_url || metadata.picture || '').trim() || null;
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    const userId = uid('u');
    const vendorId = await createVendorRecord(googleName, '');
    await db.prepare('INSERT INTO users (id,name,phone,email,role,avatar,vendorId,passwordHash,passwordSalt) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(userId, googleName, '', email, 'vendor', googleAvatar, vendorId, null, null);
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } else {
    const nextName = user.name || googleName;
    const nextAvatar = googleAvatar || user.avatar || null;
    await db.prepare('UPDATE users SET name=?, avatar=? WHERE id=?').run(nextName, nextAvatar, user.id);
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  }

  const token = await startSession(user.id);
  send(res, 200, { token, user: publicUser(user) });
}, false);

// Production-safe guest access. Each guest receives an isolated workspace
// instead of sharing the seeded demo user's business data.
route('POST', '/api/auth/guest', async (_req, res) => {
  const userId = uid('u_guest');
  const guestName = 'Guest';
  const vendorId = await createVendorRecord('Guest Business', '');
  await db.prepare('INSERT INTO users (id,name,phone,email,role,avatar,vendorId,passwordHash,passwordSalt) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(userId, guestName, '', null, 'guest', null, vendorId, null, null);
  const token = await startSession(userId);
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  send(res, 200, { token, user: publicUser(user) });
}, false);

route('POST', '/api/auth/login', async (req, res, _p, body) => {
  // Real email + password login against the database.
  if (body.email && body.password) {
    const email = String(body.email).trim().toLowerCase();
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(body.password, user.passwordHash, user.passwordSalt))
      return send(res, 401, { error: 'Invalid email or password' });
    const token = await startSession(user.id);
    return send(res, 200, { token, user: publicUser(user) });
  }

  // Demo/quick access is enabled locally but disabled by default with PostgreSQL.
  if (!ALLOW_DEMO_AUTH) return send(res, 400, { error: 'Use email and password to sign in' });
  const role = body.role || 'vendor';
  if (role === 'phone' || body.method === 'phone') {
    if (body.otp && body.otp !== '1234') return send(res, 401, { error: 'Invalid OTP. Use 1234' });
  }
  const roleUserMap = { vendor: 'u_vendor', admin: 'u_admin', guest: 'u_guest', phone: 'u_vendor' };
  const userId = roleUserMap[role] || 'u_vendor';
  let user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return send(res, 400, { error: 'Unknown role' });
  if (body.name && role !== 'admin') {
    await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(body.name, userId);
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
  const token = await startSession(userId);
  send(res, 200, { token, user: publicUser(user) });
}, false);

route('GET', '/api/auth/me', async (req, res) => {
  const user = await getUser(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  send(res, 200, { id: user.id, name: user.name, phone: user.phone, email: user.email || undefined, role: user.role, avatar: user.avatar || undefined });
});

route('POST', '/api/auth/logout', async (req, res) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  send(res, 200, { ok: true });
});

// --- Uploads ---
// Accepts JSON: { dataUrl: "data:image/jpeg;base64,...", filename?: string }
// The client is responsible for resizing/compressing before upload.
route('POST', '/api/uploads', async (req, res, _p, body, user) => {
  const dataUrl = body && body.dataUrl;
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return send(res, 400, { error: 'Provide a base64 data URL in "dataUrl"' });
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return send(res, 400, { error: 'Malformed data URL' });
  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return send(res, 415, { error: 'Unsupported image type. Use JPEG, PNG or WebP.' });
  }
  let buf;
  try { buf = Buffer.from(match[2], 'base64'); }
  catch { return send(res, 400, { error: 'Invalid base64 payload' }); }
  if (buf.length === 0) return send(res, 400, { error: 'Empty image' });
  if (buf.length > MAX_UPLOAD_BYTES) {
    return send(res, 413, { error: `Image exceeds ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit` });
  }

  const id = uid('img');

  // Production: persist to Cloudinary when credentials are configured.
  if (cloudinaryStorage.isConfigured()) {
    try {
      const uploaded = await cloudinaryStorage.uploadImage({ buffer: buf, mime, publicId: id });
      await db.prepare('INSERT INTO uploaded_files (id,ownerId,relPath,mime,sizeBytes,createdAt,storageProvider,publicId) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, user.id, uploaded.url, mime, uploaded.bytes || buf.length, new Date().toISOString(), 'cloudinary', uploaded.publicId);
      return send(res, 201, {
        id,
        url: uploaded.url,
        mime,
        sizeBytes: uploaded.bytes || buf.length,
        storageProvider: 'cloudinary',
      });
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return send(res, 502, { error: 'Cloud image upload failed', detail: String(err && err.message || err) });
    }
  }

  // Development fallback: store on the local filesystem.
  const ext = extFromMime(mime);
  const relPath = `${id}.${ext}`;
  const abs = path.join(UPLOAD_DIR, relPath);
  try {
    fs.writeFileSync(abs, buf);
  } catch (err) {
    return send(res, 500, { error: 'Could not save file', detail: String(err.message || err) });
  }
  await db.prepare('INSERT INTO uploaded_files (id,ownerId,relPath,mime,sizeBytes,createdAt,storageProvider,publicId) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, user.id, relPath, mime, buf.length, new Date().toISOString(), 'local', null);
  send(res, 201, {
    id,
    url: publicUrlFor(relPath),
    mime,
    sizeBytes: buf.length,
    storageProvider: 'local',
  });
});

// Delete an uploaded file by URL (only if owned or unowned). Best-effort.
route('DELETE', '/api/uploads', async (req, res, _p, body, user) => {
  const url = body && body.url;
  if (!url) return send(res, 400, { error: 'Provide "url"' });
  await deleteUploadIfOwned(url, user.id);
  send(res, 200, { ok: true });
});

// --- Profile (current vendor) ---
route('GET', '/api/profile', async (req, res, _p, _b, user) => {
  const v = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(currentVendorId(user));
  send(res, 200, toVendor(v));
});
route('PUT', '/api/profile', async (req, res, _p, body, user) => {
  const id = currentVendorId(user);
  const cur = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  // Support explicit null to CLEAR profile picture / photo.
  const nextLogo = Object.prototype.hasOwnProperty.call(body, 'logo') ? (body.logo || null) : cur.logo;
  const nextPhoto = Object.prototype.hasOwnProperty.call(body, 'photo') ? (body.photo || null) : cur.photo;

  // Clean up any orphaned uploaded files being replaced/removed.
  if (cur.logo && cur.logo !== nextLogo) await deleteUploadIfOwned(cur.logo, user.id);
  if (cur.photo && cur.photo !== nextPhoto) await deleteUploadIfOwned(cur.photo, user.id);

  const f = { ...cur, ...body, logo: nextLogo, photo: nextPhoto };
  await db.prepare('UPDATE vendors SET name=?,owner=?,phone=?,upiId=?,category=?,location=?,hours=?,description=?,logo=?,photo=? WHERE id=?')
    .run(f.name, f.owner, f.phone, f.upiId, f.category, f.location, f.hours, f.description, nextLogo, nextPhoto, id);
  send(res, 200, toVendor(await db.prepare('SELECT * FROM vendors WHERE id = ?').get(id)));
});

// Dedicated endpoint: remove the profile picture (logo).
route('DELETE', '/api/profile/picture', async (req, res, _p, _b, user) => {
  const id = currentVendorId(user);
  const cur = await db.prepare('SELECT logo FROM vendors WHERE id = ?').get(id);
  if (cur && cur.logo) await deleteUploadIfOwned(cur.logo, user.id);
  await db.prepare('UPDATE vendors SET logo = NULL WHERE id = ?').run(id);
  send(res, 200, toVendor(await db.prepare('SELECT * FROM vendors WHERE id = ?').get(id)));
});

// --- Business profile: SINGLE SOURCE OF TRUTH for the fields shared by the
// Business Profile and QR Payment pages (UPI ID, Business Name, Phone). Both
// pages read and write here; the vendor record is canonical and metadata is
// stored beside it for last-write-wins conflict detection. ---
route('GET', '/api/business-profile', async (req, res, _p, _body, user) => {
  const id = currentVendorId(user);
  const cur = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  if (!cur) return send(res, 404, { error: 'Vendor not found' });
  const meta = await kvGet('vendor:' + id, 'businessProfileMeta', { updatedAt: null });
  send(res, 200, {
    businessName: cur.name,
    name: cur.name,
    upiId: cur.upiId,
    phone: cur.phone,
    updatedAt: meta.updatedAt || null,
    conflict: false,
  });
});

route('PATCH', '/api/business-profile', async (req, res, _p, body, user) => {
  const id = currentVendorId(user);
  const cur = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  if (!cur) return send(res, 404, { error: 'Vendor not found' });
  const scope = 'vendor:' + id;
  const currentMeta = await kvGet(scope, 'businessProfileMeta', { updatedAt: null });
  const hasBaseVersion = Object.prototype.hasOwnProperty.call(body || {}, 'baseUpdatedAt');
  const baseUpdatedAt = body && body.baseUpdatedAt ? String(body.baseUpdatedAt) : null;
  const conflict = Boolean(hasBaseVersion && currentMeta.updatedAt && baseUpdatedAt !== currentMeta.updatedAt);

  const fields = {};
  const errors = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body || {}, k);

  if (has('businessName') || has('name')) {
    const name = String(body.businessName ?? body.name ?? '').trim();
    if (!name) errors.businessName = 'Business name is required';
    else fields.name = name;
  }
  if (has('upiId')) {
    const upiId = String(body.upiId || '').trim();
    if (!upiId) errors.upiId = 'UPI ID is required';
    else if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) errors.upiId = 'Enter a valid UPI ID (e.g. name@bank)';
    else fields.upiId = upiId;
  }
  if (has('phone')) {
    const digits = String(body.phone || '').replace(/\D/g, '');
    if (!digits) errors.phone = 'Phone number is required';
    else if (digits.length < 10) errors.phone = 'Enter a valid 10-digit phone number';
    else fields.phone = String(body.phone).trim();
  }

  if (Object.keys(errors).length) return send(res, 400, { error: 'Please fix the highlighted fields', fields: errors });
  if (!Object.keys(fields).length) return send(res, 400, { error: 'No valid fields to update' });

  const next = { ...cur, ...fields };
  await db.prepare('UPDATE vendors SET name=?, phone=?, upiId=? WHERE id=?').run(next.name, next.phone, next.upiId, id);

  // Mirror the shared fields into the QR kv document for any legacy readers.
  const qr = await kvGet(scope, 'qr', seed.QR);
  await kvSet(scope, 'qr', { ...qr, upiId: next.upiId, name: next.name, phone: next.phone });

  // Last request received by the server wins. If the client saved against an
  // older timestamp, the write still succeeds but the response warns the UI.
  const updatedAt = new Date().toISOString();
  await kvSet(scope, 'businessProfileMeta', { updatedAt });
  send(res, 200, {
    businessName: next.name,
    name: next.name,
    upiId: next.upiId,
    phone: next.phone,
    updatedAt,
    conflict,
    previousUpdatedAt: conflict ? currentMeta.updatedAt : null,
  });
});

// --- Gallery (business photos) ---
route('GET', '/api/gallery', async (req, res, _p, _b, user) => {
  const vid = currentVendorId(user);
  const rows = await db.prepare('SELECT * FROM gallery_images WHERE vendorId = ? ORDER BY sortOrder ASC, createdAt ASC').all(vid);
  send(res, 200, rows.map(toGallery));
});
route('POST', '/api/gallery', async (req, res, _p, body, user) => {
  if (!body || !body.url) return send(res, 400, { error: '"url" is required' });
  const vid = currentVendorId(user);
  const id = uid('g');
  const nextOrder = ((await db.prepare('SELECT COALESCE(MAX(sortOrder), -1) AS m FROM gallery_images WHERE vendorId = ?').get(vid)).m || 0) + 1;
  await db.prepare('INSERT INTO gallery_images (id,vendorId,url,caption,sortOrder,createdAt) VALUES (?,?,?,?,?,?)')
    .run(id, vid, body.url, body.caption || '', nextOrder, new Date().toISOString());
  send(res, 201, toGallery(await db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(id)));
});
route('PUT', '/api/gallery/:id', async (req, res, p, body, user) => {
  const vid = currentVendorId(user);
  const cur = await db.prepare('SELECT * FROM gallery_images WHERE id = ? AND vendorId = ?').get(p.id, vid);
  if (!cur) return send(res, 404, { error: 'Image not found' });
  const nextUrl = body.url != null ? body.url : cur.url;
  const nextCaption = body.caption != null ? body.caption : cur.caption;
  if (cur.url && nextUrl !== cur.url) await deleteUploadIfOwned(cur.url, user.id);
  await db.prepare('UPDATE gallery_images SET url = ?, caption = ? WHERE id = ?').run(nextUrl, nextCaption, p.id);
  send(res, 200, toGallery(await db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(p.id)));
});
route('DELETE', '/api/gallery/:id', async (req, res, p, _b, user) => {
  const vid = currentVendorId(user);
  const cur = await db.prepare('SELECT * FROM gallery_images WHERE id = ? AND vendorId = ?').get(p.id, vid);
  if (!cur) return send(res, 404, { error: 'Image not found' });
  if (cur.url) await deleteUploadIfOwned(cur.url, user.id);
  await db.prepare('DELETE FROM gallery_images WHERE id = ?').run(p.id);
  send(res, 200, { ok: true, id: p.id });
});

// --- Products ---
route('GET', '/api/products', async (req, res, _p, _b, user) => {
  const rows = await db.prepare('SELECT * FROM products WHERE vendorId = ? ORDER BY createdAt DESC, id DESC').all(currentVendorId(user));
  send(res, 200, rows.map(toProduct));
});
route('POST', '/api/products', async (req, res, _p, body, user) => {
  if (!body.name || body.price === undefined || body.price === '') return send(res, 400, { error: 'Name and price required' });
  const id = uid('p');
  await db.prepare('INSERT INTO products (id,vendorId,name,category,price,offerPrice,stock,available,description,image,popular,discount,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, currentVendorId(user), body.name, body.category || 'General', Number(body.price),
      body.offerPrice != null && body.offerPrice !== '' ? Number(body.offerPrice) : null,
      Number(body.stock) || 0, body.available === false ? 0 : 1, body.description || '',
      body.image || 'https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg?auto=compress&w=600',
      body.popular ? 1 : 0, body.discount != null && body.discount !== '' ? Number(body.discount) : null, new Date().toISOString());
  send(res, 201, toProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(id)));
});
route('PUT', '/api/products/:id', async (req, res, p, body, user) => {
  const cur = await db.prepare('SELECT * FROM products WHERE id = ? AND vendorId = ?').get(p.id, currentVendorId(user));
  if (!cur) return send(res, 404, { error: 'Product not found' });
  const nextImage = Object.prototype.hasOwnProperty.call(body, 'image')
    ? (body.image || 'https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg?auto=compress&w=600')
    : cur.image;
  if (cur.image && cur.image !== nextImage) await deleteUploadIfOwned(cur.image, user.id);
  const f = { ...toProduct(cur), ...body, image: nextImage };
  await db.prepare('UPDATE products SET name=?,category=?,price=?,offerPrice=?,stock=?,available=?,description=?,image=?,popular=?,discount=? WHERE id=?')
    .run(f.name, f.category, Number(f.price), f.offerPrice != null && f.offerPrice !== '' ? Number(f.offerPrice) : null,
      Number(f.stock) || 0, f.available ? 1 : 0, f.description || '', f.image, f.popular ? 1 : 0,
      f.discount != null && f.discount !== '' ? Number(f.discount) : null, p.id);
  send(res, 200, toProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(p.id)));
});
route('DELETE', '/api/products/:id', async (req, res, p, _b, user) => {
  const cur = await db.prepare('SELECT * FROM products WHERE id = ? AND vendorId = ?').get(p.id, currentVendorId(user));
  if (cur && cur.image) await deleteUploadIfOwned(cur.image, user.id);
  await db.prepare('DELETE FROM products WHERE id = ? AND vendorId = ?').run(p.id, currentVendorId(user));
  send(res, 200, { ok: true, id: p.id });
});

// --- Transactions ---
route('GET', '/api/transactions', async (req, res, _p, _b, user) => {
  const rows = await db.prepare('SELECT * FROM transactions WHERE vendorId = ? ORDER BY date DESC').all(currentVendorId(user));
  send(res, 200, rows.map((r) => ({ id: r.id, vendor: r.vendor, amount: r.amount, method: r.method, status: r.status, date: r.date })));
});
route('POST', '/api/transactions', async (req, res, _p, body, user) => {
  const id = uid('t');
  const vid = currentVendorId(user);
  const v = await db.prepare('SELECT name FROM vendors WHERE id = ?').get(vid);
  const now = new Date();
  const date = body.date || `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  await db.prepare('INSERT INTO transactions (id,vendorId,vendor,amount,method,status,date) VALUES (?,?,?,?,?,?,?)')
    .run(id, vid, body.vendor || (v && v.name) || 'Vendor', Number(body.amount) || 0, body.method || 'UPI', body.status || 'success', date);
  send(res, 201, { id, vendor: body.vendor || (v && v.name), amount: Number(body.amount) || 0, method: body.method || 'UPI', status: body.status || 'success', date });
});

// --- Schemes ---
route('GET', '/api/schemes', async (req, res, _p, _b, user) => {
  const rows = await db.prepare('SELECT * FROM schemes').all();
  const marks = new Set((await db.prepare('SELECT schemeId FROM scheme_bookmarks WHERE userId = ?').all(user.id)).map((m) => m.schemeId));
  send(res, 200, rows.map((r) => toScheme(r, marks.has(r.id))));
});
route('POST', '/api/schemes/:id/bookmark', async (req, res, p, body, user) => {
  const on = body.bookmarked;
  if (on) await db.prepare('INSERT INTO scheme_bookmarks (userId, schemeId) VALUES (?,?) ON CONFLICT DO NOTHING').run(user.id, p.id);
  else await db.prepare('DELETE FROM scheme_bookmarks WHERE userId = ? AND schemeId = ?').run(user.id, p.id);
  send(res, 200, { ok: true, id: p.id, bookmarked: !!on });
});

// --- Reviews ---
route('GET', '/api/reviews', async (req, res, _p, _b, user) => {
  const rows = await db.prepare('SELECT * FROM reviews WHERE vendorId = ? ORDER BY date DESC').all(currentVendorId(user));
  send(res, 200, rows.map(toReview));
});
route('POST', '/api/reviews', async (req, res, _p, body, user) => {
  const id = uid('r');
  await db.prepare('INSERT INTO reviews (id,vendorId,author,rating,comment,date) VALUES (?,?,?,?,?,?)')
    .run(id, currentVendorId(user), body.author || 'Anonymous', Number(body.rating) || 5, body.comment || '', body.date || new Date().toISOString().slice(0, 10));
  send(res, 201, toReview(await db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)));
});

// --- Analytics + Dashboard ---
route('GET', '/api/analytics', async (req, res, _p, _b, user) => {
  send(res, 200, await kvGet('vendor:' + currentVendorId(user), 'analytics', seed.ANALYTICS));
});
route('GET', '/api/dashboard', async (req, res, _p, _b, user) => {
  const vid = currentVendorId(user);
  const analytics = await kvGet('vendor:' + vid, 'analytics', seed.ANALYTICS);
  const txRows = await db.prepare('SELECT * FROM transactions WHERE vendorId = ? ORDER BY date DESC').all(vid);
  const schemeRows = await db.prepare('SELECT * FROM schemes').all();
  const products = (await db.prepare('SELECT COUNT(*) AS c FROM products WHERE vendorId = ?').get(vid)).c;
  const today = txRows.filter((t) => t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const last = analytics.sales[analytics.sales.length - 1] || { sales: 0, visitors: 0, scans: 0 };
  send(res, 200, {
    stats: {
      todaysPayments: today,
      orders: txRows.length,
      visitors: last.visitors,
      qrScans: last.scans,
      productViews: analytics.productViews.reduce((s, p) => s + p.views, 0),
      schemes: schemeRows.length,
      products,
    },
    sales: analytics.sales,
    transactions: txRows.slice(0, 5).map((r) => ({ id: r.id, vendor: r.vendor, amount: r.amount, method: r.method, status: r.status, date: r.date })),
    schemes: schemeRows.slice(0, 3).map((r) => toScheme(r, false)),
  });
});

// --- Settings ---
route('GET', '/api/settings', async (req, res, _p, _b, user) => {
  send(res, 200, await kvGet('user:' + user.id, 'settings', seed.SETTINGS));
});
route('PUT', '/api/settings', async (req, res, _p, body, user) => {
  const cur = await kvGet('user:' + user.id, 'settings', seed.SETTINGS);
  const next = { ...cur, ...body, notifications: { ...cur.notifications, ...(body.notifications || {}) } };
  send(res, 200, await kvSet('user:' + user.id, 'settings', next));
});

// --- QR ---
// Shared fields (upiId, name, phone) always come from the vendor record so the
// QR page and Business Profile page stay in sync. Only color/sound live in kv.
route('GET', '/api/qr', async (req, res, _p, _b, user) => {
  const vid = currentVendorId(user);
  const v = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(vid);
  const qr = await kvGet('vendor:' + vid, 'qr', seed.QR);
  send(res, 200, { ...qr, upiId: v ? v.upiId : qr.upiId, name: v ? v.name : qr.name, phone: v ? v.phone : qr.phone });
});
route('PUT', '/api/qr', async (req, res, _p, body, user) => {
  const vid = currentVendorId(user);
  const scope = 'vendor:' + vid;
  // Route shared fields to the canonical vendor record; keep style (color/sound) in kv.
  const { upiId, name, phone, ...rest } = body || {};
  if (upiId !== undefined || name !== undefined || phone !== undefined) {
    const cur = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(vid);
    if (cur) {
      await db.prepare('UPDATE vendors SET name=?, phone=?, upiId=? WHERE id=?')
        .run(name !== undefined ? name : cur.name, phone !== undefined ? phone : cur.phone, upiId !== undefined ? upiId : cur.upiId, vid);
    }
  }
  const merged = await kvSet(scope, 'qr', { ...await kvGet(scope, 'qr', seed.QR), ...rest });
  const v = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(vid);
  send(res, 200, { ...merged, upiId: v ? v.upiId : merged.upiId, name: v ? v.name : merged.name, phone: v ? v.phone : merged.phone });
});

// --- Website ---
route('GET', '/api/website', async (req, res, _p, _b, user) => {
  send(res, 200, await kvGet('vendor:' + currentVendorId(user), 'website', seed.WEBSITE));
});
route('PUT', '/api/website', async (req, res, _p, body, user) => {
  const scope = 'vendor:' + currentVendorId(user);
  send(res, 200, await kvSet(scope, 'website', { ...await kvGet(scope, 'website', seed.WEBSITE), ...body }));
});

// --- SEO ---
route('GET', '/api/seo', async (req, res, _p, _b, user) => {
  send(res, 200, await kvGet('vendor:' + currentVendorId(user), 'seo', seed.SEO));
});
route('PUT', '/api/seo', async (req, res, _p, body, user) => {
  const scope = 'vendor:' + currentVendorId(user);
  send(res, 200, await kvSet(scope, 'seo', { ...await kvGet(scope, 'seo', seed.SEO), ...body }));
});

// --- Marketing ---
route('GET', '/api/marketing', async (req, res) => {
  send(res, 200, await kvGet('global', 'marketing', seed.MARKETING));
});

// --- Notifications ---
route('GET', '/api/notifications', async (req, res, _p, _b, user) => {
  const rows = await db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC, id DESC').all(user.id);
  send(res, 200, rows.map(toNotif));
});
route('POST', '/api/notifications', async (req, res, _p, body, user) => {
  const id = uid('n');
  await db.prepare('INSERT INTO notifications (id,userId,type,title,description,time,read,createdAt) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, user.id, body.type || 'info', body.title || '', body.description || '', body.time || 'just now', 0, new Date().toISOString());
  send(res, 201, toNotif(await db.prepare('SELECT * FROM notifications WHERE id = ?').get(id)));
});
route('PUT', '/api/notifications/:id', async (req, res, p, body, user) => {
  await db.prepare('UPDATE notifications SET read = ? WHERE id = ? AND userId = ?').run(body.read ? 1 : 0, p.id, user.id);
  send(res, 200, { ok: true, id: p.id });
});
route('POST', '/api/notifications/read-all', async (req, res, _p, _b, user) => {
  await db.prepare('UPDATE notifications SET read = 1 WHERE userId = ?').run(user.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/notifications/:id', async (req, res, p, _b, user) => {
  await db.prepare('DELETE FROM notifications WHERE id = ? AND userId = ?').run(p.id, user.id);
  send(res, 200, { ok: true, id: p.id });
});

// --- Admin ---
route('GET', '/api/admin/vendors', async (req, res) => {
  const rows = await db.prepare('SELECT * FROM vendors ORDER BY joinedAt DESC').all();
  send(res, 200, rows.map(toVendor));
});
route('PUT', '/api/admin/vendors/:id', async (req, res, p, body) => {
  const cur = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(p.id);
  if (!cur) return send(res, 404, { error: 'Vendor not found' });
  if (body.status) await db.prepare('UPDATE vendors SET status = ? WHERE id = ?').run(body.status, p.id);
  send(res, 200, toVendor(await db.prepare('SELECT * FROM vendors WHERE id = ?').get(p.id)));
});
route('GET', '/api/admin/stats', async (req, res) => {
  const vendors = (await db.prepare('SELECT COUNT(*) AS c FROM vendors').get()).c;
  const active = (await db.prepare("SELECT COUNT(*) AS c FROM vendors WHERE status = 'active'").get()).c;
  const schemes = (await db.prepare('SELECT COUNT(*) AS c FROM schemes').get()).c;
  const revenue = (await db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE status = 'success'").get()).s;
  send(res, 200, { totalVendors: vendors, activeUsers: active, schemesListed: schemes, revenue, growth: (await kvGet('vendor:v1', 'analytics', seed.ANALYTICS)).sales });
});
route('GET', '/api/admin/schemes', async (req, res) => {
  send(res, 200, (await db.prepare('SELECT * FROM schemes').all()).map((r) => toScheme(r, false)));
});
route('GET', '/api/admin/reports', async (req, res) => {
  send(res, 200, await db.prepare('SELECT * FROM reports').all());
});

// --- Public customer website ---
route('GET', '/api/public/vendor/:slug', async (req, res, p) => {
  let vendorId = 'v1';
  const allVendors = await db.prepare('SELECT id FROM vendors').all();
  for (const v of allVendors) {
    const w = await kvGet('vendor:' + v.id, 'website', null);
    if (w && w.slug === p.slug) { vendorId = v.id; break; }
  }
  const v = await db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId);
  const products = (await db.prepare('SELECT * FROM products WHERE vendorId = ? AND available = 1').all(vendorId)).map(toProduct);
  const reviews = (await db.prepare('SELECT * FROM reviews WHERE vendorId = ?').all(vendorId)).map(toReview);
  const rawQr = await kvGet('vendor:' + vendorId, 'qr', seed.QR);
  const qr = { ...rawQr, upiId: v.upiId, name: v.name, phone: v.phone };
  send(res, 200, { vendor: toVendor(v), products, reviews, qr });
}, false);

route('GET', '/api/health', async (req, res) => send(res, 200, {
  ok: true,
  time: new Date().toISOString(),
  imageStorage: cloudinaryStorage.isConfigured() ? 'cloudinary' : 'local',
  database: databaseProvider,
  googleAuth: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)),
}), false);

// ---------- static file serving for uploads ----------
function serveUpload(req, res, urlPath) {
  const rel = urlPath.replace(/^\/uploads\//, '');
  const abs = absPathFor(rel);
  if (!abs || !fs.existsSync(abs)) {
    res.writeHead(404, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: 'File not found' }));
    return;
  }
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mimeByExt = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const type = mimeByExt[ext] || 'application/octet-stream';
  const stat = fs.statSync(abs);
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Cache-Control': 'public, max-age=604800, immutable',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(abs).pipe(res);
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Serve uploaded files.
  if (req.method === 'GET' && pathname.startsWith('/uploads/')) {
    return serveUpload(req, res, pathname);
  }

  const match = routes.find((r) => r.method === req.method && r.regex.test(pathname));
  if (!match) return send(res, 404, { error: 'Not found', path: pathname });

  const m = pathname.match(match.regex);
  const params = {};
  match.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));

  let user = null;
  if (match.auth) {
    user = await getUser(req);
    if (!user) return send(res, 401, { error: 'Unauthorized' });
    if (pathname.startsWith('/api/admin/') && user.role !== 'admin') {
      return send(res, 403, { error: 'Admin access required' });
    }
  }

  let body = {};
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      body = await readBody(req);
    } catch (err) {
      const code = err && err.code ? err.code : 500;
      return send(res, code, { error: err.message || 'Bad request' });
    }
  }

  try {
    await match.handler(req, res, params, body, user);
  } catch (err) {
    console.error('Handler error:', err);
    send(res, 500, { error: 'Internal server error', detail: String(err && err.message || err) });
  }
});

databaseReady.then(() => {
  server.listen(PORT, () => {
    console.log(`\n  SahAI backend running on http://localhost:${PORT}`);
    console.log(`  Database: ${databaseProvider}`);
    console.log(`  Images:   ${cloudinaryStorage.isConfigured() ? 'Cloudinary' : `Local (${UPLOAD_DIR})`}`);
    console.log(`  Health:   http://localhost:${PORT}/api/health\n`);
  });
}).catch((error) => {
  console.error('Database initialization failed:', error);
  process.exitCode = 1;
});

module.exports = server;
