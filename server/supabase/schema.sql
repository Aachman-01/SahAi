-- SahAI PostgreSQL schema for Supabase.
-- Safe to run repeatedly in Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, name text, phone text, email text UNIQUE,
  role text, avatar text, vendorid text,
  passwordhash text, passwordsalt text
);
CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY, userid text NOT NULL, createdat text NOT NULL
);
CREATE TABLE IF NOT EXISTS vendors (
  id text PRIMARY KEY, name text, owner text, phone text, upiid text,
  category text, location text, hours text, logo text, photo text,
  rating double precision, joinedat text, status text, description text
);
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY, vendorid text NOT NULL, name text, category text,
  price double precision, offerprice double precision, stock integer,
  available integer, description text, image text, popular integer,
  discount double precision, createdat text
);
CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY, vendorid text NOT NULL, vendor text,
  amount double precision, method text, status text, date text
);
CREATE TABLE IF NOT EXISTS schemes (
  id text PRIMARY KEY, name text, ministry text, category text,
  eligibility text, documents text, benefits text, applyurl text
);
CREATE TABLE IF NOT EXISTS scheme_bookmarks (
  userid text NOT NULL, schemeid text NOT NULL, PRIMARY KEY (userid, schemeid)
);
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY, vendorid text NOT NULL, author text,
  rating integer, comment text, date text
);
CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY, userid text NOT NULL, type text, title text,
  description text, time text, read integer, createdat text
);
CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY, "user" text, issue text, status text
);
CREATE TABLE IF NOT EXISTS kv (
  scope text NOT NULL, key text NOT NULL, value text,
  PRIMARY KEY (scope, key)
);
CREATE TABLE IF NOT EXISTS gallery_images (
  id text PRIMARY KEY, vendorid text NOT NULL, url text NOT NULL,
  caption text, sortorder integer DEFAULT 0, createdat text
);
CREATE TABLE IF NOT EXISTS uploaded_files (
  id text PRIMARY KEY, ownerid text, relpath text NOT NULL, mime text,
  sizebytes integer, createdat text, storageprovider text DEFAULT 'local',
  publicid text
);
CREATE INDEX IF NOT EXISTS idx_sessions_userid ON sessions(userid);
CREATE INDEX IF NOT EXISTS idx_products_vendorid ON products(vendorid);
CREATE INDEX IF NOT EXISTS idx_transactions_vendorid ON transactions(vendorid);
CREATE INDEX IF NOT EXISTS idx_reviews_vendorid ON reviews(vendorid);
CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications(userid);
CREATE INDEX IF NOT EXISTS idx_gallery_vendorid ON gallery_images(vendorid);
CREATE INDEX IF NOT EXISTS idx_uploads_ownerid ON uploaded_files(ownerid);
CREATE INDEX IF NOT EXISTS idx_uploads_relpath ON uploaded_files(relpath);

-- The browser must not query these tables directly. The Render backend connects
-- with Supabase's server-side database connection and remains the security layer.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
