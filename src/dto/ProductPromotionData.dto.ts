// src/dto/ProductPromotionData.dto.ts
// NEW FILE: Define the structure for promotion info (Example)

export interface ProductPromotionDataDto {
  // Optional introductory text from the bot
  intro?: string;
  // Promotion details
  promotionName?: string;
  promotionDescription: string;
  discount?: string; // e.g., "10%", "500.000₫"
  applicableProducts?: string; // e.g., "All Laptops", "Product SKU XYZ"
  validFrom?: string; // Optional start date YYYY-MM-DD
  validUntil?: string; // Optional end date YYYY-MM-DD
  couponCode?: string;
  // Optional concluding text from the bot
  comment?: string;
}
