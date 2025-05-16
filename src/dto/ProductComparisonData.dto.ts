// src/dto/ProductComparisonData.dto.ts
// NEW FILE: Define the structure for product comparison

import { ProductDataDto } from './ProductData.dto'; // Adjust path if needed

// Define specific policy structure if needed, otherwise keep as strings
export interface ProductPolicies {
  return?: string;
  shipping?: string;
  payment?: string;
}

// Extend ProductDataDto for comparison specifics if necessary, or use it directly
export interface ComparisonProduct extends ProductDataDto {
  // Add any comparison-specific fields if needed, e.g., unique pros/cons
  policies?: ProductPolicies;
}

export interface ProductComparisonDataDto {
  // Optional introductory text from the bot
  intro?: string;
  // Array of products being compared
  products: ComparisonProduct[];
  // Optional concluding text or summary from the bot
  conclusion?: string;
}
