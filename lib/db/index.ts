import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Global singleton pattern to prevent multiple instances during Next.js hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var __etsy_drizzle_db: any;
  // eslint-disable-next-line no-var
  var __etsy_pglite_instance: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __etsy_pg_pool: pg.Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

export function getDb() {
  if (global.__etsy_drizzle_db) {
    return global.__etsy_drizzle_db;
  }

  if (databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
    const pool = global.__etsy_pg_pool || new pg.Pool({ connectionString: databaseUrl });
    global.__etsy_pg_pool = pool;
    const db = drizzlePg(pool, { schema });
    global.__etsy_drizzle_db = db;
    return db;
  }

  // Fallback to local PGlite (Real WASM Postgres)
  let pglite = global.__etsy_pglite_instance;
  if (!pglite) {
    try {
      const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const dataDir = isVercel
        ? path.join("/tmp", "etsy_seo_pglite")
        : path.join(process.cwd(), "data", "etsy_seo_pglite");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      pglite = new PGlite(dataDir);
    } catch {
      pglite = new PGlite();
    }
    global.__etsy_pglite_instance = pglite;
  }

  const db = drizzlePglite(pglite, { schema });
  global.__etsy_drizzle_db = db;
  return db;
}

export const db = getDb();

/**
 * Initializes database tables using DDL.
 * Safe to execute multiple times (uses CREATE TABLE IF NOT EXISTS).
 */
export async function initializeDatabase() {
  const initSql = `
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'owner' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      target_market TEXT DEFAULT 'US' NOT NULL,
      language TEXT DEFAULT 'en' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      etsy_taxonomy_id TEXT,
      materials TEXT,
      colors TEXT,
      sizes TEXT,
      styles TEXT,
      features TEXT,
      personalization TEXT,
      recipient TEXT,
      occasion TEXT,
      use_cases TEXT,
      price NUMERIC(10, 2),
      currency TEXT DEFAULT 'USD' NOT NULL,
      current_title TEXT,
      current_tags TEXT,
      current_description TEXT,
      embedding_json TEXT,
      metadata_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      canonical_text TEXT NOT NULL UNIQUE,
      display_text TEXT NOT NULL,
      language TEXT DEFAULT 'en' NOT NULL,
      country TEXT DEFAULT 'US' NOT NULL,
      token_count INTEGER NOT NULL,
      character_count INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keyword_aliases (
      id TEXT PRIMARY KEY,
      keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      alias_text TEXT NOT NULL,
      normalized_alias TEXT NOT NULL,
      alias_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keyword_relations (
      id TEXT PRIMARY KEY,
      source_keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      target_keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL,
      similarity_score NUMERIC(5, 4)
    );

    CREATE TABLE IF NOT EXISTS keyword_clusters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      cluster_type TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keyword_cluster_members (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL REFERENCES keyword_clusters(id) ON DELETE CASCADE,
      keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      is_primary BOOLEAN DEFAULT TRUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keyword_sources (
      id TEXT PRIMARY KEY,
      provider_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      quality_level INTEGER NOT NULL,
      documentation_url TEXT,
      is_direct BOOLEAN DEFAULT FALSE NOT NULL,
      is_estimated BOOLEAN DEFAULT FALSE NOT NULL,
      is_ai BOOLEAN DEFAULT FALSE NOT NULL,
      is_synthetic BOOLEAN DEFAULT FALSE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keyword_observations (
      id TEXT PRIMARY KEY,
      keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL REFERENCES keyword_sources(id) ON DELETE CASCADE,
      metric_type TEXT NOT NULL,
      raw_value NUMERIC(12, 2) NOT NULL,
      normalized_value NUMERIC(8, 4),
      unit TEXT DEFAULT 'count' NOT NULL,
      observed_at TIMESTAMP NOT NULL,
      imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      confidence INTEGER DEFAULT 100 NOT NULL,
      metadata_json TEXT,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      shop_id TEXT
    );

    CREATE TABLE IF NOT EXISTS keyword_scores (
      id TEXT PRIMARY KEY,
      keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      demand_score NUMERIC(5, 2),
      competition_score NUMERIC(5, 2),
      relevance_score NUMERIC(5, 2),
      intent_score NUMERIC(5, 2),
      trend_score NUMERIC(5, 2),
      serp_score NUMERIC(5, 2),
      seller_fit_score NUMERIC(5, 2),
      opportunity_score NUMERIC(5, 2) NOT NULL,
      confidence_score NUMERIC(5, 2) NOT NULL,
      confidence_level TEXT NOT NULL,
      relevance_state TEXT DEFAULT 'RELEVANT' NOT NULL,
      intent_type TEXT DEFAULT 'PRODUCT_SEARCH' NOT NULL,
      scoring_version TEXT DEFAULT 'v1.0.0' NOT NULL,
      weights_json TEXT NOT NULL,
      explanation_json TEXT NOT NULL,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_keywords (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      is_selected BOOLEAN DEFAULT FALSE NOT NULL,
      is_rejected BOOLEAN DEFAULT FALSE NOT NULL,
      rejection_reason TEXT,
      user_notes TEXT,
      tags_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      etsy_shop_id TEXT NOT NULL UNIQUE,
      shop_name TEXT NOT NULL,
      currency_code TEXT DEFAULT 'USD' NOT NULL,
      url TEXT,
      listing_active_count INTEGER DEFAULT 0 NOT NULL,
      is_vacation BOOLEAN DEFAULT FALSE NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS etsy_connections (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      etsy_user_id TEXT NOT NULL,
      access_token_encrypted TEXT NOT NULL,
      refresh_token_encrypted TEXT NOT NULL,
      token_expires_at TIMESTAMP NOT NULL,
      scopes TEXT NOT NULL,
      last_sync_at TIMESTAMP,
      sync_status TEXT DEFAULT 'idle' NOT NULL,
      sync_error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      etsy_listing_id TEXT UNIQUE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      state TEXT DEFAULT 'active' NOT NULL,
      taxonomy_id TEXT,
      tags_json TEXT NOT NULL,
      materials_json TEXT,
      price_amount NUMERIC(10, 2),
      price_currency TEXT DEFAULT 'USD' NOT NULL,
      views INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listing_snapshots (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      attributes_json TEXT,
      price_amount NUMERIC(10, 2),
      views INTEGER,
      favorites INTEGER,
      captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      source TEXT DEFAULT 'OPTIMIZATION_BASELINE' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS optimization_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
      scoring_version TEXT DEFAULT 'v1.0.0' NOT NULL,
      input_snapshot_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS optimization_outputs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
      primary_keyword TEXT NOT NULL,
      supporting_keywords_json TEXT NOT NULL,
      suggested_title TEXT NOT NULL,
      suggested_tags_json TEXT NOT NULL,
      suggested_description TEXT NOT NULL,
      suggested_attributes_json TEXT NOT NULL,
      warnings_json TEXT,
      explanation_text TEXT NOT NULL,
      marginal_utility_json TEXT,
      ai_model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      hypothesis TEXT,
      changes_json TEXT NOT NULL,
      baseline_snapshot_id TEXT REFERENCES listing_snapshots(id),
      post_snapshot_id TEXT REFERENCES listing_snapshots(id),
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      status TEXT DEFAULT 'active' NOT NULL,
      views_before INTEGER,
      views_after INTEGER,
      orders_before INTEGER,
      orders_after INTEGER,
      revenue_before NUMERIC(10, 2),
      revenue_after NUMERIC(10, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imports (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      import_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      source_name TEXT NOT NULL,
      row_count INTEGER DEFAULT 0 NOT NULL,
      imported_count INTEGER DEFAULT 0 NOT NULL,
      error_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_rows (
      id TEXT PRIMARY KEY,
      import_id TEXT NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
      row_number INTEGER NOT NULL,
      raw_content_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      error_message TEXT
    );
  `;

  try {
    if (global.__etsy_pglite_instance) {
      await global.__etsy_pglite_instance.waitReady;
      await global.__etsy_pglite_instance.exec(initSql);
    } else if (global.__etsy_pg_pool) {
      await global.__etsy_pg_pool.query(initSql);
    }
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
}
