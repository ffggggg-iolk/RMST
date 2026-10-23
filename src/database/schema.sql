-- Universal Quotation System - SQLite & PostgreSQL Schema
-- Migration 001: Initial Complete Schema

CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  bot_name TEXT NOT NULL DEFAULT 'Universal Quotation System',
  brand_accent_color TEXT NOT NULL DEFAULT '#5865F2',
  default_currency TEXT NOT NULL DEFAULT 'USD',
  ticket_category_id TEXT,
  ticket_support_channel_id TEXT,
  footer_text TEXT NOT NULL DEFAULT 'Universal Quotation System • Estimates based on configured catalog rates',
  logo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  product_type TEXT NOT NULL,
  base_price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  is_available INTEGER NOT NULL DEFAULT 1,
  stock_count INTEGER,
  delivery_info TEXT,
  terms TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_guild ON products(guild_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS pricing_rules (
  id TEXT PRIMARY KEY,
  product_id TEXT UNIQUE NOT NULL,
  pricing_model TEXT NOT NULL,
  base_price REAL NOT NULL,
  tiers_json TEXT,
  variable_config_json TEXT,
  subscription_config_json TEXT,
  bundle_config_json TEXT,
  custom_config_json TEXT,
  allowed_currencies_json TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS currency_rates (
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  last_updated TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (from_currency, to_currency)
);

CREATE TABLE IF NOT EXISTS discounts (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  value REAL NOT NULL,
  min_order_subtotal REAL,
  max_discount_amount REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(guild_id, code)
);

CREATE INDEX IF NOT EXISTS idx_discounts_guild_code ON discounts(guild_id, code);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_tag TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 1,
  currency TEXT NOT NULL,
  exchange_rate REAL NOT NULL DEFAULT 1.0,
  raw_subtotal REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0.0,
  discount_code TEXT,
  total_fees REAL NOT NULL DEFAULT 0.0,
  total_tax REAL NOT NULL DEFAULT 0.0,
  final_total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotations_guild ON quotations(guild_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quote_number);

CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY,
  quotation_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  options_json TEXT,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quotation_snapshots (
  id TEXT PRIMARY KEY,
  quotation_id TEXT UNIQUE NOT NULL,
  snapshot_json TEXT NOT NULL,
  frozen_at TEXT NOT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  quotation_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_tag TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  closed_at TEXT,
  transcript_json TEXT,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
CREATE INDEX IF NOT EXISTS idx_tickets_quote ON tickets(quotation_id);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  permission_level TEXT NOT NULL, -- 'admin', 'manager', 'viewer'
  UNIQUE(guild_id, role_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_tag TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_guild ON audit_logs(guild_id);
