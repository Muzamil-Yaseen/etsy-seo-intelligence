# Etsy SEO Intelligence SaaS - Specification & Architecture

## Core Philosophy
1. AI generates possibilities.
2. Real data validates them.
3. Algorithms score them.
4. Seller data personalizes them.
5. Historical performance improves them.
6. The system must NEVER invent search-volume, competition, sales, click, conversion, or trend numbers and present them as real.
7. Every numeric marketplace metric must have:
   - Source
   - Collection date
   - Confidence level
   - Data type (direct, derived, estimated, imported, synthetic)

## Legal & Compliance
- **Attribution (Mandatory):** "The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or certified by Etsy."
- **Data Gathering:** Strict adherence to Etsy Open API v3 and Etsy API Terms of Use.
- **Scraping Prohibition:** No automated browser scraping, DOM scraping, CAPTCHA bypassing, or anti-bot bypassing.
- **Marketplace Insights:** Since Marketplace Insights in Shop Manager lacks an official public API, data is ingested legitimately via user-controlled manual entry, bulk paste, or official export imports.

## Scoring System
- **Demand Score (0-100):** Log-transformed percentile: $ln(1 + searches30d)$ ranked against category/project cohort.
- **Competition Opportunity Score (0-100):** $CompetitionOpportunity = 100 - PercentileRank(ln(1 + effectiveCompetition))$, where $effectiveCompetition = rawListingCount \times relevantResultRatio$ (or raw count labeled DIRECT).
- **Product Relevance Score (0-100):** Semantic (55%) + Category (20%) + Attribute (20%) + Lexical (5%) minus contradiction penalties. Contradictions trigger Blocked/Contradictory state.
- **Buyer Intent Score (0-100):** Structured intent classification (Broad Discovery, Category Browsing, Product Search, High Purchase Intent, Recipient Search, Occasion Search, Customization Search).
- **Trend Score (0-100, 50 neutral):** Momentum across historical periods. Explicitly marked UNAVAILABLE when insufficient data exists (never fake 50).
- **SERP Opportunity (0-100):** $100 - SERPStrength$.
- **Seller Fit (0-100):** Personalized alignment with seller's historical success. Marked UNAVAILABLE if seller data is absent.
- **Final Opportunity Score (0-100):** Weighted combination ($0.26 D + 0.17 C + 0.18 R + 0.14 I + 0.10 T + 0.09 S + 0.06 F$), dynamically re-normalizing weights over available signals when metrics are missing. Versioned (`v1.0.0`).
- **Confidence Score (0-100):** Separated from Opportunity: $0.35 SourceQuality + 0.20 Freshness + 0.20 Coverage + 0.15 SampleQuality + 0.10 CrossSourceAgreement$.

## Optimizers
- **13-Tag Optimizer:** Greedy marginal utility selection balancing Opportunity, Relevance, Intent, and Demand while penalizing semantic/lexical redundancy. Strict 20-character Etsy limit.
- **Title Optimizer:** Adheres to current official Etsy guidance (under 140 chars, < 15 words recommended, objective traits first, no keyword stuffing).
- **Description Optimizer:** Compelling opening paragraph, structured sections, natural keyword integration, stuffing checks.
- **Listing Analyzer:** Audits search match readiness, title quality, tag diversity, attribute completeness, and provides actionable warnings.
