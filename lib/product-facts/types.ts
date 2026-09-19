export type ProductType = "physical" | "digital";

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: "in" | "cm" | "mm";
}

export interface ProductWeight {
  value: number;
  unit: "oz" | "lbs" | "g" | "kg";
}

export interface PersonalizationConfig {
  isOffered: boolean;
  instructions?: string;
  maxCharacters?: number;
  allowedPlacements?: string[]; // e.g. "Front cover", "Inside flap"
}

export interface ProductFacts {
  // Core Identity
  productType: ProductType;
  productNoun: string; // e.g. "Matcha Bowl", "Leather Tote Bag", "Wedding Planner"
  category: string; // e.g. "Home & Living > Kitchen & Dining > Drinkware > Bowls"
  
  // Materials & Construction
  primaryMaterial: string; // e.g. "Ceramic stoneware", "Full-grain vegetable-tanned leather"
  secondaryMaterials?: string[]; // e.g. ["Food-safe glaze"], ["Solid brass rivets"]
  colors?: string[]; // e.g. ["Forest Green", "Sand Beige"]
  
  // Sizing & Specs
  dimensions?: ProductDimensions;
  weight?: ProductWeight;
  capacity?: string; // e.g. "12 oz (350 ml)"
  
  // Personalization & Customization
  personalization?: PersonalizationConfig;
  
  // Production, Care & Policies
  careInstructions?: string;
  shippingOrigin?: string; // e.g. "United States", "United Kingdom"
  processingTimeDays?: string; // e.g. "1-2 business days"
  
  // Context & Targeting
  targetAudience?: string; // e.g. "Matcha tea lovers, Japanese pottery collectors"
  occasion?: string; // e.g. "Housewarming, Wedding, Holiday Gift"
  
  // Economics & Pricing
  cogs?: number; // Cost of Goods Sold (materials + production cost)
  targetPrice?: number;
  currency?: string; // USD, GBP, CAD, EUR, AUD
  
  // Whitelist constraints
  forbiddenClaims?: string[]; // e.g. ["cowhide", "genuine leather", "waterproof", "diamond"]
  confirmedClaims?: string[]; // Whitelisted claims confirmed by seller
}

export interface ClaimValidationIssue {
  type: "unsupported_material" | "unsupported_personalization" | "unsupported_dimension" | "unsupported_certification" | "forbidden_term";
  term: string;
  location: "title" | "tags" | "description" | "attributes";
  message: string;
  severity: "error" | "warning";
}

export interface ClaimValidationResult {
  isValid: boolean;
  issues: ClaimValidationIssue[];
  sanitizedTitle?: string;
  sanitizedTags?: string[];
  sanitizedDescription?: string;
}
