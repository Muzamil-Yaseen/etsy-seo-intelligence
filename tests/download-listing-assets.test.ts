import { describe, it, expect } from "vitest";
import {
  formatTagsText,
  formatListingText,
  toFullResolutionUrl,
  extractFullImageUrls,
} from "../lib/media/download-listing-assets";

describe("Listing Assets Download Utilities", () => {
  it("formats tags into numbered and comma-separated lines", () => {
    const tags = ["handmade bridle", "baroque horse tack", "leather headstall"];
    const text = formatTagsText(tags, "Baroque Bridle");

    expect(text).toContain("ETSY LISTING TAGS (3 / 13)");
    expect(text).toContain("Listing: Baroque Bridle");
    expect(text).toContain("01. handmade bridle");
    expect(text).toContain("02. baroque horse tack");
    expect(text).toContain("03. leather headstall");
    expect(text).toContain("handmade bridle, baroque horse tack, leather headstall");
  });

  it("formats listing text with title, description, and details", () => {
    const text = formatListingText({
      listingId: "4569665503",
      title: "Baroque Horse Bridle, Black Leather",
      price: "799.00",
      currency: "USD",
      shopName: "PLENZIO",
      url: "https://www.etsy.com/listing/4569665503",
      materials: ["Leather", "Gold Tone Metal"],
      tags: ["tag 1", "tag 2"],
      description: "Custom baroque horse bridle crafted in luxury black leather.",
    });

    expect(text).toContain("LISTING TITLE:\nBaroque Horse Bridle, Black Leather");
    expect(text).toContain("Shop Name:    PLENZIO");
    expect(text).toContain("Listing ID:   4569665503");
    expect(text).toContain("Price:        $799.00 USD");
    expect(text).toContain("Materials:    Leather, Gold Tone Metal");
    expect(text).toContain("Custom baroque horse bridle crafted in luxury black leather.");
  });

  it("converts Etsy image URLs to maximum full-resolution il_fullxfull", () => {
    const thumbUrl = "https://i.etsystatic.com/12345/r/il_794xN.4569665503_abcd.jpg";
    const fullUrl = toFullResolutionUrl(thumbUrl);
    expect(fullUrl).toBe("https://i.etsystatic.com/12345/r/il_fullxfull.4569665503_abcd.jpg");
  });

  it("extracts and dedupes all full-resolution image URLs", () => {
    const listing = {
      imageUrl: "https://i.etsystatic.com/12345/r/il_340x270.photo1.jpg",
      images: [
        "https://i.etsystatic.com/12345/r/il_794xN.photo1.jpg",
        "https://i.etsystatic.com/12345/r/il_794xN.photo2.jpg",
        { url: "https://i.etsystatic.com/12345/r/il_570xN.photo3.jpg" },
      ],
    };

    const extracted = extractFullImageUrls(listing);
    expect(extracted).toHaveLength(3);
    expect(extracted[0]).toBe("https://i.etsystatic.com/12345/r/il_fullxfull.photo1.jpg");
    expect(extracted[1]).toBe("https://i.etsystatic.com/12345/r/il_fullxfull.photo2.jpg");
    expect(extracted[2]).toBe("https://i.etsystatic.com/12345/r/il_fullxfull.photo3.jpg");
  });
});
