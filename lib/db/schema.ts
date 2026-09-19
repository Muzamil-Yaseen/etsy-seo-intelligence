import { pgTable, text, timestamp, integer, numeric, boolean, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Workspaces & Authentication
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("owner").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Projects & Products
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  targetMarket: text("target_market").default("US").notNull(),
  language: text("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("projects_workspace_idx").on(table.workspaceId),
]);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  etsyTaxonomyId: text("etsy_taxonomy_id"),
  materials: text("materials"), // Comma-separated or JSON string
  colors: text("colors"),
  sizes: text("sizes"),
  styles: text("styles"),
  features: text("features"),
  personalization: text("personalization"),
  recipient: text("recipient"),
  occasion: text("occasion"),
  useCases: text("use_cases"),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD").notNull(),
  currentTitle: text("current_title"),
  currentTags: text("current_tags"), // JSON array string
  currentDescription: text("current_description"),
  embeddingJson: text("embedding_json"),
  metadataJson: text("metadata_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("products_project_idx").on(table.projectId),
]);

// 3. Keywords & Normalization
export const keywords = pgTable("keywords", {
  id: text("id").primaryKey(),
  canonicalText: text("canonical_text").notNull().unique(),
  displayText: text("display_text").notNull(),
  language: text("language").default("en").notNull(),
  country: text("country").default("US").notNull(),
  tokenCount: integer("token_count").notNull(),
  characterCount: integer("character_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("keywords_canonical_idx").on(table.canonicalText),
]);

export const keywordAliases = pgTable("keyword_aliases", {
  id: text("id").primaryKey(),
  keywordId: text("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  aliasText: text("alias_text").notNull(),
  normalizedAlias: text("normalized_alias").notNull(),
  aliasType: text("alias_type").notNull(), // SPELLING_VARIANT, PLURAL_VARIANT, WORD_ORDER_VARIANT, SYNONYM, USER_ALIAS
}, (table) => [
  index("keyword_aliases_keyword_idx").on(table.keywordId),
  index("keyword_aliases_normalized_idx").on(table.normalizedAlias),
]);

export const keywordRelations = pgTable("keyword_relations", {
  id: text("id").primaryKey(),
  sourceKeywordId: text("source_keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  targetKeywordId: text("target_keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(), // VARIANT, RELATED, BROADER, NARROWER
  similarityScore: numeric("similarity_score", { precision: 5, scale: 4 }),
});

// 4. Clusters
export const keywordClusters = pgTable("keyword_clusters", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  clusterType: text("cluster_type").notNull(), // CORE_PRODUCT, MATERIAL, PERSONALIZATION, RECIPIENT, OCCASION, STYLE, FEATURE, USE_CASE, COLOR, SIZE, AESTHETIC, SEASONAL, PROBLEM_SOLUTION
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("keyword_clusters_project_idx").on(table.projectId),
]);

export const keywordClusterMembers = pgTable("keyword_cluster_members", {
  id: text("id").primaryKey(),
  clusterId: text("cluster_id").notNull().references(() => keywordClusters.id, { onDelete: "cascade" }),
  keywordId: text("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(true).notNull(),
}, (table) => [
  index("cluster_members_cluster_idx").on(table.clusterId),
  index("cluster_members_keyword_idx").on(table.keywordId),
]);

// 5. Data Sources & Observations (Provenance)
export const keywordSources = pgTable("keyword_sources", {
  id: text("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  sourceType: text("source_type").notNull(), // ETSY_MARKETPLACE_INSIGHTS, ETSY_OPEN_API, SHOP_ANALYTICS, THIRD_PARTY, AI_GENERATED, SYNTHETIC_DEMO
  qualityLevel: integer("quality_level").notNull(), // 1 (highest) to 6 (synthetic)
  documentationUrl: text("documentation_url"),
  isDirect: boolean("is_direct").default(false).notNull(),
  isEstimated: boolean("is_estimated").default(false).notNull(),
  isAi: boolean("is_ai").default(false).notNull(),
  isSynthetic: boolean("is_synthetic").default(false).notNull(),
});

export const keywordObservations = pgTable("keyword_observations", {
  id: text("id").primaryKey(),
  keywordId: text("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => keywordSources.id, { onDelete: "cascade" }),
  metricType: text("metric_type").notNull(), // SEARCHES_30D, LISTING_COUNT, TREND_MOMENTUM, RELEVANT_LISTING_RATIO, CLICK_ESTIMATE, CTR_ESTIMATE
  rawValue: numeric("raw_value", { precision: 12, scale: 2 }).notNull(),
  normalizedValue: numeric("normalized_value", { precision: 8, scale: 4 }),
  unit: text("unit").default("count").notNull(),
  observedAt: timestamp("observed_at").notNull(),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  confidence: integer("confidence").default(100).notNull(), // 0 to 100
  metadataJson: text("metadata_json"),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  shopId: text("shop_id"),
}, (table) => [
  index("observations_keyword_idx").on(table.keywordId),
  index("observations_source_idx").on(table.sourceId),
  index("observations_type_idx").on(table.metricType),
  index("observations_observed_at_idx").on(table.observedAt),
]);

// 6. Keyword Scores (Versioned and Transparent)
export const keywordScores = pgTable("keyword_scores", {
  id: text("id").primaryKey(),
  keywordId: text("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  demandScore: numeric("demand_score", { precision: 5, scale: 2 }), // 0-100 or null if unavailable
  competitionScore: numeric("competition_score", { precision: 5, scale: 2 }), // 0-100 or null
  relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }), // 0-100
  intentScore: numeric("intent_score", { precision: 5, scale: 2 }), // 0-100
  trendScore: numeric("trend_score", { precision: 5, scale: 2 }), // 0-100 or null
  serpScore: numeric("serp_score", { precision: 5, scale: 2 }), // 0-100 or null
  sellerFitScore: numeric("seller_fit_score", { precision: 5, scale: 2 }), // 0-100 or null
  opportunityScore: numeric("opportunity_score", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }).notNull(),
  confidenceLevel: text("confidence_level").notNull(), // VERY_HIGH, HIGH, MEDIUM, LOW, VERY_LOW
  relevanceState: text("relevance_state").default("RELEVANT").notNull(), // HIGHLY_RELEVANT, RELEVANT, WEAK, QUESTIONABLE, CONTRADICTORY, BLOCKED
  intentType: text("intent_type").default("PRODUCT_SEARCH").notNull(),
  scoringVersion: text("scoring_version").default("v1.0.0").notNull(),
  weightsJson: text("weights_json").notNull(), // Weights utilized for normalization
  explanationJson: text("explanation_json").notNull(), // Structured breakdown
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
}, (table) => [
  index("scores_project_keyword_idx").on(table.projectId, table.keywordId),
  index("scores_opportunity_idx").on(table.opportunityScore),
]);

// 7. Project Keywords (User Research State)
export const projectKeywords = pgTable("project_keywords", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keywordId: text("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  isSelected: boolean("is_selected").default(false).notNull(),
  isRejected: boolean("is_rejected").default(false).notNull(),
  rejectionReason: text("rejection_reason"), // IRRELEVANT, MISLEADING, TOO_COMPETITIVE, WEAK_DEMAND, LOW_CONFIDENCE, NOT_APPLICABLE
  userNotes: text("user_notes"),
  tagsJson: text("tags_json"), // user custom tags
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("project_keywords_project_idx").on(table.projectId),
  index("project_keywords_keyword_idx").on(table.keywordId),
]);

// 8. Connected Shops & Etsy OAuth
export const shops = pgTable("shops", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  etsyShopId: text("etsy_shop_id").notNull().unique(),
  shopName: text("shop_name").notNull(),
  currencyCode: text("currency_code").default("USD").notNull(),
  url: text("url"),
  listingActiveCount: integer("listing_active_count").default(0).notNull(),
  isVacation: boolean("is_vacation").default(false).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("shops_workspace_idx").on(table.workspaceId),
]);

export const etsyConnections = pgTable("etsy_connections", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  etsyUserId: text("etsy_user_id").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  scopes: text("scopes").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("idle").notNull(),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Listings & Historical Snapshots
export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  etsyListingId: text("etsy_listing_id").unique(),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  state: text("state").default("active").notNull(),
  taxonomyId: text("taxonomy_id"),
  tagsJson: text("tags_json").notNull(), // JSON string array of tags
  materialsJson: text("materials_json"),
  priceAmount: numeric("price_amount", { precision: 10, scale: 2 }),
  priceCurrency: text("price_currency").default("USD").notNull(),
  views: integer("views").default(0),
  favorites: integer("favorites").default(0),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("listings_shop_idx").on(table.shopId),
  index("listings_etsy_id_idx").on(table.etsyListingId),
]);

export const listingSnapshots = pgTable("listing_snapshots", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tagsJson: text("tags_json").notNull(),
  attributesJson: text("attributes_json"),
  priceAmount: numeric("price_amount", { precision: 10, scale: 2 }),
  views: integer("views"),
  favorites: integer("favorites"),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  source: text("source").default("OPTIMIZATION_BASELINE").notNull(),
}, (table) => [
  index("listing_snapshots_listing_idx").on(table.listingId),
  index("listing_snapshots_captured_at_idx").on(table.capturedAt),
]);

// 10. Optimization Runs & Outputs
export const optimizationRuns = pgTable("optimization_runs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  listingId: text("listing_id").references(() => listings.id, { onDelete: "set null" }),
  scoringVersion: text("scoring_version").default("v1.0.0").notNull(),
  inputSnapshotId: text("input_snapshot_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
});

export const optimizationOutputs = pgTable("optimization_outputs", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull().references(() => optimizationRuns.id, { onDelete: "cascade" }),
  primaryKeyword: text("primary_keyword").notNull(),
  supportingKeywordsJson: text("supporting_keywords_json").notNull(),
  suggestedTitle: text("suggested_title").notNull(),
  suggestedTagsJson: text("suggested_tags_json").notNull(), // JSON array of 13 tags
  suggestedDescription: text("suggested_description").notNull(),
  suggestedAttributesJson: text("suggested_attributes_json").notNull(),
  warningsJson: text("warnings_json"),
  explanationText: text("explanation_text").notNull(),
  marginalUtilityJson: text("marginal_utility_json"),
  aiModel: text("ai_model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Experiments
export const experiments = pgTable("experiments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  changesJson: text("changes_json").notNull(), // { titleChanged, tagsChanged, descriptionChanged }
  baselineSnapshotId: text("baseline_snapshot_id").references(() => listingSnapshots.id),
  postSnapshotId: text("post_snapshot_id").references(() => listingSnapshots.id),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  status: text("status").default("active").notNull(), // active, completed, cancelled
  viewsBefore: integer("views_before"),
  viewsAfter: integer("views_after"),
  ordersBefore: integer("orders_before"),
  ordersAfter: integer("orders_after"),
  revenueBefore: numeric("revenue_before", { precision: 10, scale: 2 }),
  revenueAfter: numeric("revenue_after", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Imports
export const imports = pgTable("imports", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  importType: text("import_type").notNull(), // MARKETPLACE_INSIGHTS, LISTING_CSV, KEYWORD_CSV
  filename: text("filename").notNull(),
  sourceName: text("source_name").notNull(),
  rowCount: integer("row_count").default(0).notNull(),
  importedCount: integer("imported_count").default(0).notNull(),
  errorCount: integer("error_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const importRows = pgTable("import_rows", {
  id: text("id").primaryKey(),
  importId: text("import_id").notNull().references(() => imports.id, { onDelete: "cascade" }),
  rowNumber: integer("row_number").notNull(),
  rawContentJson: text("raw_content_json").notNull(),
  status: text("status").default("pending").notNull(), // success, error, duplicate
  errorMessage: text("error_message"),
});

// Relations
export const projectRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  products: many(products),
  clusters: many(keywordClusters),
  projectKeywords: many(projectKeywords),
  scores: many(keywordScores),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  project: one(projects, { fields: [products.projectId], references: [projects.id] }),
  scores: many(keywordScores),
  listings: many(listings),
}));

export const keywordRelationsDef = relations(keywords, ({ many }) => ({
  aliases: many(keywordAliases),
  observations: many(keywordObservations),
  scores: many(keywordScores),
  clusterMembers: many(keywordClusterMembers),
  projectKeywords: many(projectKeywords),
}));
