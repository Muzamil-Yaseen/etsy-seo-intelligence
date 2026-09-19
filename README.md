# Etsy SEO Intelligence SaaS - Marketplace Evidence Platform

A production-quality Etsy SEO intelligence SaaS application built on the principle:
> **AI generates possibilities. Real data validates them. Algorithms score them. Seller data personalizes them. Historical performance improves them.**

The system never invents search-volume, competition, sales, click, conversion, or trend numbers. Every marketplace metric maintains strict provenance: **Source, Collection Date, Confidence Level, and Data Type** (direct, derived, estimated, imported, or synthetic).

---

## Trademark & Attribution Notice
> **"The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or certified by Etsy."**

This application strictly adheres to the Etsy API Terms of Use, Etsy Open API v3 guidelines, and excludes automated browser scraping or bot bypassing.

---

## 1. Product Overview & Key Features

* **Seed-to-Universe Pipeline:** Expands a seed keyword (e.g., `personalized leather wallet`) across 9 semantic dimensions (Product, Material, Personalization, Recipient, Occasion, Style, Feature, Use Case, Color).
* **Deterministic Scoring Engine (`v1.0.0`):**
  * **Demand Score (0–100):** Log-transformed $ln(1 + \text{searches}_{30d})$ percentile ranked against cohort.
  * **Competition Opportunity (0–100):** Inverted difficulty ranking; higher score = easier market entry.
  * **Product Relevance (0–100):** Multi-factor analysis + **Contradiction Blocker** (flags mismatches like "vegan" vs genuine leather, unfeatured RFID).
  * **Buyer Intent (0–100):** Classifies purchase readiness and commercial modifiers.
  * **Trend Momentum (0–100, 50 neutral):** Evaluates historical velocity; marked *unavailable* if insufficient history (never fake 50).
  * **Dynamic Re-Weighting:** Missing marketplace signals re-normalize weights to 100% without inserting fake defaults.
  * **Decoupled Confidence Score (0–100):** Measures evidence trustworthiness (source quality, freshness, coverage, sample size).
* **13-Tag Set Marginal Utility Optimizer:**
  * Strict adherence to Etsy's maximum 13 tags and $\le$20 character limit.
  * Constrained greedy optimizer balancing Opportunity, Relevance, Intent, and Demand while penalizing semantic redundancy.
* **2026 Etsy Title Studio & Validator:**
  * Analyzes character count ($\le$140), scannability ($<15$ words recommended), keyword stuffing risk, and front-loaded objective traits.
* **Buyer-First Description Studio:**
  * Compelling first paragraph naturally weaving in primary phrases without keyword dumps.
* **Listing Search Match Readiness Auditor:**
  * Audits title, 13 tags, description, category, and attributes for indexing readiness.
* **Etsy Marketplace Insights Importer (Level 1 Direct Data):**
  * Direct ingestion of official 30-day search volumes and listing counts from Etsy Shop Manager Stats.
* **Connected Shops (Etsy OAuth 2.0 PKCE):**
  * Support for Personal and Commercial access tiers with tokens encrypted at rest.

---

## 2. Architecture & Data Provenance Hierarchy

| Level | Source Name | Type | Quality | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | Etsy Marketplace Insights | `ETSY_MARKETPLACE_INSIGHTS` | Direct (95% Conf) | User-controlled manual/bulk imports of 30-day search volume and listing counts |
| **Level 2** | Etsy Open API v3 | `ETSY_OPEN_API` | Direct (90% Conf) | Official `findAllListingsActive` competition search, taxonomy, and shop listings |
| **Level 3** | Shop Analytics | `SHOP_ANALYTICS` | Direct (95% Conf) | Seller-authorized shop performance data for private Seller Fit personalization |
| **Level 4** | Third-Party Providers | `THIRD_PARTY` | Estimated (60% Conf) | Normalized external estimates |
| **Level 5** | AI Semantic Services | `AI_GENERATED` | Derived (30% Conf) | Candidate generation, clustering, intent, explanations (never numeric stats) |
| **Level 6** | Synthetic Fixtures | `SYNTHETIC_DEMO` | Demo (0% Prod Conf) | Clearly labeled `SYNTHETIC DEMO DATA` for offline testing |

---

## 3. Technology Stack

* **Framework:** Next.js 16 (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS v4, Lucide React icons
* **Database & ORM:** Drizzle ORM with PostgreSQL syntax
  * **Local / Zero-Config Dev:** `@electric-sql/pglite` (embedded in-process WASM Postgres)
  * **Production:** Standard PostgreSQL (Neon, Supabase, Vercel Postgres) via `DATABASE_URL`
* **Testing:** Vitest (20 automated unit tests for scoring formulas, contradiction blocking, and optimizers)

---

## 4. Local Setup & Quickstart

### Prerequisites
* Node.js v20+ or v24+
* npm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd "Etsy Keywords"

# Install dependencies
npm install

# Run database seed (initializes demo workspace, product, and realistic fixtures)
npm run test
```

### Starting the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Variables (`.env.local`)

Copy `.env.example` to `.env.local` to configure production databases and external API keys:

```bash
# Database (Optional for local dev - PGlite embedded Postgres is used if omitted)
DATABASE_URL=postgresql://user:password@localhost:5432/etsy_seo

# Etsy Open API v3 Credentials (from Etsy Developer Portal)
ETSY_API_KEY=your_etsy_keystring
ETSY_SHARED_SECRET=your_etsy_shared_secret
ETSY_REDIRECT_URI=http://localhost:3000/api/etsy/callback

# AI Provider Credentials (Optional - deterministic rule-based generators act as fallback)
OPENAI_API_KEY=your_openai_key
# or GEMINI_API_KEY=your_gemini_key

# Application Secret
APP_SECRET=your_secure_random_session_secret
```

---

## 6. Development & Testing Commands

```bash
# Run unit tests with Vitest
npm test

# Run TypeScript typecheck
npx tsc --noEmit

# Run production build
npm run build

# Start production server
npm start
```

---

## 7. Etsy Developer Portal Setup

1. Log in to the [Etsy Developer Portal](https://developers.etsy.com).
2. Create an App.
3. Select **Personal App** (grants access to up to 5 authorized shops).
4. Set Redirect URL to `https://your-domain.com/api/etsy/callback`.
5. For multi-tenant commercial distribution to other sellers, apply for **Commercial Access**.
6. Ensure the mandatory Etsy trademark attribution statement is kept intact across your deployed application.

---

## 8. Known Limitations & Roadmap

* **Marketplace Insights:** Etsy does not provide a public API for Shop Manager Marketplace Insights; data is ingested legitimately via the user-controlled CSV/bulk import tool.
* **Rate Limits:** Etsy Open API v3 enforces standard per-second/per-day quotas (typically 10 queries/second). Responses are cached in the `keyword_observations` table.
* **Browser Extension:** Companion Chrome extension is designed to interface with this backend SaaS and will be added in Phase 2.
