export interface PhotoSlotGuidance {
  slot: number;
  title: string;
  guidance: string;
  categoryRelevance: string;
}

export interface VideoGuidance {
  title: string;
  durationSeconds: string; // e.g. "5–15 seconds"
  guidance: string;
}

export interface CategoryMediaPlan {
  categoryName: string;
  photoSlots: PhotoSlotGuidance[];
  videoStrategy: VideoGuidance;
}

const CERAMICS_PLAN: CategoryMediaPlan = {
  categoryName: "Ceramics & Pottery",
  videoStrategy: {
    title: "Pouring & Glaze Luster",
    durationSeconds: "8–12 seconds",
    guidance: "A 360-degree slow spin in natural window light showing glaze shimmer, followed by pouring liquid (tea/coffee) to demonstrate real-life ergonomics and rim drip resistance.",
  },
  photoSlots: [
    { slot: 1, title: "Hero item on neutral stone or linen", guidance: "Eye-level 45° angle showing overall form and primary glaze color against clean linen or warm grey background.", categoryRelevance: "Glaze luster & shape" },
    { slot: 2, title: "In-hand scale & ergonomics", guidance: "Held naturally with two hands to communicate physical volume, grip feel, and actual cup/bowl proportions.", categoryRelevance: "Scale & human touch" },
    { slot: 3, title: "Macro glaze & clay texture", guidance: "Close-up macro lens shot highlighting earthy speckles, reactive glaze breaks, and rim craftsmanship.", categoryRelevance: "Material authenticity" },
    { slot: 4, title: "In-use lifestyle scene", guidance: "Styled on a dining table or kitchen counter alongside a teapot, whisk, or freshly brewed beverage with natural morning light.", categoryRelevance: "Emotional utility" },
    { slot: 5, title: "Interior depth & food-safe glaze", guidance: "Looking directly inside the bowl or mug to show the smooth, clean, food-safe interior finish and depth.", categoryRelevance: "Food-safe hygiene" },
    { slot: 6, title: "Dimensional graphic with volume", guidance: "Infographic with clean typography showing height, rim diameter, base width, and liquid capacity in oz and ml.", categoryRelevance: "No-surprise specs" },
    { slot: 7, title: "Bottom foot ring & maker's mark", guidance: "Clear view of the unglazed foot ring, trimmed clay base, and impressed or carved studio signature stamp.", categoryRelevance: "Authentic pottery proof" },
    { slot: 8, title: "Colorway or glaze variations", guidance: "Side-by-side array of available glaze finishes (e.g. Matte Olive, Speckled Cream, Slate Blue) under uniform lighting.", categoryRelevance: "Variant comparison" },
    { slot: 9, title: "Drop-tested protective packaging", guidance: "Showcases eco-friendly biodegradable bubble wrap, custom tissue wrap, and sturdy corrugated outer box ensuring safe transit.", categoryRelevance: "Breakage reassurance" },
    { slot: 10, title: "Potter's wheel or studio kiln", guidance: "Candid behind-the-scenes shot of clay centering on the pottery wheel or raw greenware drying on studio shelves.", categoryRelevance: "Handmade Etsy ethos" },
  ],
};

const JEWELRY_PLAN: CategoryMediaPlan = {
  categoryName: "Jewelry",
  videoStrategy: {
    title: "Light Catch & Clasp Operation",
    durationSeconds: "6–10 seconds",
    guidance: "Gentle tilting of the jewelry under direct warm light to capture sparkle/polish, ending with one-handed ease of fastening the lobster or spring clasp.",
  },
  photoSlots: [
    { slot: 1, title: "Hero on minimalist stone pedestal", guidance: "Centered top-down or 30° angle on textured travertine or matte ceramic prop, completely free of reflections.", categoryRelevance: "Clean product focus" },
    { slot: 2, title: "On-body scale on collarbone or wrist", guidance: "Worn by a model to clearly show necklace drop length (e.g. 16\", 18\", 20\") or pendant scale against the décolletage.", categoryRelevance: "Drop length clarity" },
    { slot: 3, title: "Macro hallmark & setting detail", guidance: "High-magnification macro focus on stone prongs, metal finish, and 925/14K hallmark stamp.", categoryRelevance: "Metal purity proof" },
    { slot: 4, title: "Clasp, closure & extender chain", guidance: "Crystal clear view of clasp mechanism and extra 2-inch extender loops so buyers understand adjustability.", categoryRelevance: "Fit reassurance" },
    { slot: 5, title: "Layering inspiration", guidance: "Styled alongside 1–2 complementary chains or rings to inspire multiple purchases and show stacking possibilities.", categoryRelevance: "Upsell & styling" },
    { slot: 6, title: "Annotated sizing infographic", guidance: "Pendant next to a US quarter / 1 Euro coin or metric ruler showing exact millimeters.", categoryRelevance: "Zero-misunderstanding size" },
    { slot: 7, title: "Personalization font options", guidance: "Clear graphic display showing custom engraving fonts, letter stamping styles, or birthstone options.", categoryRelevance: "Customization accuracy" },
    { slot: 8, title: "Gift box & unboxing presentation", guidance: "Foil-stamped jewelry gift box, velvet pouch, anti-tarnish polishing cloth, and blank gift note card.", categoryRelevance: "Gifting appeal" },
    { slot: 9, title: "Metal finishes side-by-side", guidance: "Silver, yellow gold, and rose gold variants laid side-by-side on uniform neutral slate.", categoryRelevance: "Finish decision" },
    { slot: 10, title: "Jeweler workbench or torch soldering", guidance: "Hand tools, bench peg, or polishing wheel shot celebrating bench jeweler craftsmanship.", categoryRelevance: "Handcrafted trust" },
  ],
};

const DIGITAL_PLAN: CategoryMediaPlan = {
  categoryName: "Digital Downloads & Printables",
  videoStrategy: {
    title: "Clickable PDF or App Walkthrough",
    durationSeconds: "10–15 seconds",
    guidance: "Screen recording flipping smoothly through interactive hyperlinked tabs on an iPad GoodNotes/Notability app or desktop PDF viewer.",
  },
  photoSlots: [
    { slot: 1, title: "High-converting multi-device hero", guidance: "Digital product displayed on an iPad Pro with Apple Pencil and desktop monitor mockup in a warm home office setting.", categoryRelevance: "Modern digital mockup" },
    { slot: 2, title: "What's included bundle graphic", guidance: "Flat lay breakdown listing all file formats included: PDF, GoodNotes, PNG stickers, Canva template link, or SVG files.", categoryRelevance: "Deliverables clarity" },
    { slot: 3, title: "Page layout & spreads preview", guidance: "Clean grid showing key planner spreads, daily pages, budget trackers, or template layouts.", categoryRelevance: "Feature overview" },
    { slot: 4, title: "Hyperlink index navigation map", guidance: "Close-up annotation showing how clickable index tabs allow instant 1-second jumping between sections.", categoryRelevance: "Ease of navigation" },
    { slot: 5, title: "Printing size guide", guidance: "Visual matrix showing supported print ratios: US Letter (8.5x11), A4, A5, and poster scaling instructions without pixelation.", categoryRelevance: "Print specs" },
    { slot: 6, title: "Device & app compatibility chart", guidance: "Logos of supported apps: GoodNotes, Notability, Samsung Notes, Xodo, Acrobat, Canva.", categoryRelevance: "Tech compatibility" },
    { slot: 7, title: "Step-by-step 'How to Download' graphic", guidance: "Simple 3-step visual: 1. Purchase on Etsy, 2. Open Etsy Purchases tab, 3. Download & import to device in 60 seconds.", categoryRelevance: "Prevents 'where is my item' disputes" },
    { slot: 8, title: "Digital stickers or bonus assets", guidance: "Preview of matching freebie bonus assets, sticker sheets, or color palettes included in the download folder.", categoryRelevance: "Perceived value bonus" },
    { slot: 9, title: "Printed test output sample", guidance: "High-resolution photo of the pages actually printed on heavy 32lb paper showing crisp typography and no color bleed.", categoryRelevance: "Print quality proof" },
    { slot: 10, title: "Instant Access guarantee badge", guidance: "Clear guarantee badge: 'Instant Download 24/7 • Lifetime Access • Re-download Anytime'.", categoryRelevance: "Confidence reassurance" },
  ],
};

const LEATHER_PLAN: CategoryMediaPlan = {
  categoryName: "Leather Goods",
  videoStrategy: {
    title: "Supple Flex & Patina Texture",
    durationSeconds: "8–12 seconds",
    guidance: "Hands flexing the leather to show grain temper and natural pull-up color burst, testing brass snap/zipper glide, and sliding credit cards into slots.",
  },
  photoSlots: [
    { slot: 1, title: "Hero front view on dark oak or concrete", guidance: "Centered angle showcasing the clean silhouette and rich natural leather hue.", categoryRelevance: "Silhouette & tone" },
    { slot: 2, title: "Open interior layout & card slot capacity", guidance: "Fully opened wallet or bag displaying all interior sleeves, cash flap, and lining.", categoryRelevance: "Internal utility" },
    { slot: 3, title: "In-hand scale & pocket profile", guidance: "Sliding effortlessly into a denim pocket or held in hand to prove slim, non-bulky thickness.", categoryRelevance: "Everyday carry slimness" },
    { slot: 4, title: "Macro saddle stitching & bevelled edge", guidance: "High-detail macro focus showing waxed thread saddle stitching and hand-burnished beeswax edges.", categoryRelevance: "Artisan longevity" },
    { slot: 5, title: "Dimensional callout graphic", guidance: "Annotated image showing exact closed & open measurements (inches and cm) and empty weight in ounces.", categoryRelevance: "Precise dimensions" },
    { slot: 6, title: "Full load capacity test", guidance: "Filled with 8 cards, folded bills, and ID card to demonstrate true capacity without distortion.", categoryRelevance: "Real-life function" },
    { slot: 7, title: "Custom monogram & engraving font options", guidance: "Clear examples of heat-debossed foil, laser engraved initials, or brass stamped monograms.", categoryRelevance: "Personalization choices" },
    { slot: 8, title: "Leather color swatches", guidance: "Tan, Chestnut, Dark Brown, and Matte Black swatches side-by-side in balanced daylight.", categoryRelevance: "Colorway selection" },
    { slot: 9, title: "Rustic kraft gift packaging", guidance: "Wrapped in unbleached tissue paper, tied with natural jute twine, and packed in heavy gift box with maker card.", categoryRelevance: "Gift ready" },
    { slot: 10, title: "Leather workshop workbench", guidance: "Beveler, pricking irons, wooden slicker, and leather hide roll in authentic workshop background.", categoryRelevance: "Traditional handcraft" },
  ],
};

const WOOD_PLAN: CategoryMediaPlan = {
  categoryName: "Woodworking",
  videoStrategy: {
    title: "Juice Groove & Knife Bevel",
    durationSeconds: "8–12 seconds",
    guidance: "Gliding fingers across the silky beeswax-conditioned surface, followed by slicing an apple or pouring water into the juice groove to prove depth.",
  },
  photoSlots: [
    { slot: 1, title: "Hero board angled on kitchen island", guidance: "30° perspective displaying rich end-grain or edge-grain patterns on light kitchen countertop.", categoryRelevance: "Grain beauty" },
    { slot: 2, title: "Board with food styling", guidance: "Artfully styled charcuterie spread with cheeses, figs, bread, and grapes to showcase entertaining capacity.", categoryRelevance: "Lifestyle inspiration" },
    { slot: 3, title: "Scale with kitchen knife & hands", guidance: "Chef's knife resting on the cutting surface with hands nearby for immediate scale comprehension.", categoryRelevance: "Cutting area scale" },
    { slot: 4, title: "Macro end-grain & wood joint detail", guidance: "Macro close-up showing tight glue joints, smoothed chamfer edges, and natural grain pores.", categoryRelevance: "Joinery excellence" },
    { slot: 5, title: "Deep juice groove & undercut handles", guidance: "Detailed view of routered juice perimeter and recessed finger grip handles on underside.", categoryRelevance: "Functional features" },
    { slot: 6, title: "Thickness & dimensional specs", guidance: "Side profile showing board thickness (e.g. 1.25\" to 1.75\") with metric and imperial measurements.", categoryRelevance: "Heft and durability" },
    { slot: 7, title: "Custom engraved wedding/family crest", guidance: "Sample engravings of last names, dates, or custom quotes showing crisp laser detail.", categoryRelevance: "Engraving clarity" },
    { slot: 8, title: "Wood species comparison", guidance: "Black Walnut, Hard Maple, and White Oak side-by-side with distinct natural grain variations.", categoryRelevance: "Species choice" },
    { slot: 9, title: "Board care wax tin & packaging", guidance: "Includes complementary tin of food-grade organic mineral oil/beeswax butter and care card.", categoryRelevance: "Added-value care" },
    { slot: 10, title: "Wood planer & workshop shavings", guidance: "Hardwood lumber boards, hand plane, and workshop atmosphere proving true carpenter craft.", categoryRelevance: "Carpenter provenance" },
  ],
};

const PET_PLAN: CategoryMediaPlan = {
  categoryName: "Pet Supplies",
  videoStrategy: {
    title: "Quick-Release Buckle & Pet Leash Walk",
    durationSeconds: "6–10 seconds",
    guidance: "One-click test of metal quick-release buckle, followed by a happy dog walking naturally on a leash showing collar comfort and non-chafing fit.",
  },
  photoSlots: [
    { slot: 1, title: "Hero collar on neutral background", guidance: "Centered collar curved in round position showing buckle, D-ring, and webbing or leather strap.", categoryRelevance: "Overall hardware design" },
    { slot: 2, title: "On-dog model lifestyle shot", guidance: "Worn naturally by an active dog outdoors in daylight to establish scale and visual aesthetic.", categoryRelevance: "Pet fit and look" },
    { slot: 3, title: "Engraved buckle or metal ID tag macro", guidance: "Super-sharp macro focus on custom engraved pet name and phone number on metal buckle.", categoryRelevance: "Legible emergency info" },
    { slot: 4, title: "Hardware tensile strength & D-ring", guidance: "Heavy-duty cast alloy or solid brass D-ring with reinforced box-X stitching for pull strength.", categoryRelevance: "Safety & durability" },
    { slot: 5, title: "Adjustable sizing guide graphic", guidance: "Diagram showing how to measure dog's neck with 2-finger rule, with XS, S, M, L, XL inch/cm chart.", categoryRelevance: "Prevents return for wrong size" },
    { slot: 6, title: "Inside soft lining or padded comfort", guidance: "View of neoprene or soft leather interior padding protecting sensitive pet neck fur.", categoryRelevance: "Pet comfort" },
    { slot: 7, title: "Matching leash set combo", guidance: "Collar paired with matching 5ft leash, poop bag holder, or bow tie accessory.", categoryRelevance: "Bundle upsell" },
    { slot: 8, title: "Color & pattern variations", guidance: "Full colorway lineup laid out flat under clean natural lighting.", categoryRelevance: "Color selection" },
    { slot: 9, title: "Waterproof / mud-resistant wipe test", guidance: "Demonstrating how easily mud, water, or odor wipes off with a wet cloth.", categoryRelevance: "Easy maintenance" },
    { slot: 10, title: "Pet gift packaging", guidance: "Packaged with pet treat sample and branded backing card ready for pet birthdays or adoption gifts.", categoryRelevance: "Pet parent delight" },
  ],
};

const DEFAULT_PLAN: CategoryMediaPlan = {
  categoryName: "Handmade Products",
  videoStrategy: {
    title: "360-Degree Turn & Touch",
    durationSeconds: "8–12 seconds",
    guidance: "A steady 360-degree rotation showing all product facets in natural light, with human hands interacting to establish genuine scale.",
  },
  photoSlots: [
    { slot: 1, title: "Hero image", guidance: "Clean angle on neutral background showcasing the complete product.", categoryRelevance: "Immediate clarity" },
    { slot: 2, title: "Scale & sizing", guidance: "Shown next to everyday object or held in hand for accurate proportion.", categoryRelevance: "Physical scale" },
    { slot: 3, title: "Detail & texture", guidance: "Macro close-up of materials, stitching, grain, or finish.", categoryRelevance: "Craftsmanship proof" },
    { slot: 4, title: "Lifestyle in-context", guidance: "Product shown in daily use or styled home setting.", categoryRelevance: "Emotional utility" },
    { slot: 5, title: "Features & interior", guidance: "Functional view showing internal compartments, hardware, or closures.", categoryRelevance: "Functionality" },
    { slot: 6, title: "Dimensions graphic", guidance: "Annotated graphic showing height, width, depth, and weight.", categoryRelevance: "Accurate expectations" },
    { slot: 7, title: "Packaging & unboxing", guidance: "Branded gift-ready packaging showing what buyer receives.", categoryRelevance: "Gifting confidence" },
    { slot: 8, title: "Variations & colors", guidance: "Side-by-side view of available colorways, finishes, or styles.", categoryRelevance: "Options comparison" },
    { slot: 9, title: "Personalization guide", guidance: "Visual example of fonts, placement, and character limits.", categoryRelevance: "Custom options" },
    { slot: 10, title: "Trust & craftsmanship", guidance: "Studio or workbench shot reinforcing authentic craftsmanship.", categoryRelevance: "Handmade value" },
  ],
};

/**
 * Resolves category-tailored media guidance based on product category string or noun.
 */
export function getCategoryMediaPlan(categoryOrNoun: string): CategoryMediaPlan {
  const c = (categoryOrNoun || "").toLowerCase();

  if (c.includes("ceramic") || c.includes("pottery") || c.includes("mug") || c.includes("bowl") || c.includes("cup") || c.includes("plate") || c.includes("vase")) {
    return CERAMICS_PLAN;
  }
  if (c.includes("jewelry") || c.includes("necklace") || c.includes("ring") || c.includes("earring") || c.includes("bracelet") || c.includes("pendant")) {
    return JEWELRY_PLAN;
  }
  if (c.includes("digital") || c.includes("download") || c.includes("printable") || c.includes("planner") || c.includes("template") || c.includes("svg")) {
    return DIGITAL_PLAN;
  }
  if (c.includes("leather") || c.includes("wallet") || c.includes("purse") || c.includes("tote") || c.includes("bag") || c.includes("belt")) {
    return LEATHER_PLAN;
  }
  if (c.includes("wood") || c.includes("cutting board") || c.includes("charcuterie") || c.includes("furniture") || c.includes("timber") || c.includes("walnut")) {
    return WOOD_PLAN;
  }
  if (c.includes("pet") || c.includes("dog") || c.includes("cat") || c.includes("collar") || c.includes("leash")) {
    return PET_PLAN;
  }

  return DEFAULT_PLAN;
}
