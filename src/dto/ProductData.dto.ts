// src/dto/ProductData.dto.ts
// NEW FILE: Define the structure for single product info

export interface ProductSpecification {
  label: string; // e.g., "Screen Size", "RAM"
  value: string; // e.g., "15 inches", "16GB"
}

export interface ProductDataDto {
  // Optional introductory text from the bot
  intro?: string;
  // Core product details
  name: string;
  sku?: string; // Stock Keeping Unit
  category?: string;
  manufacturer?: string;
  shortDescription?: string;
  specifications?: ProductSpecification[];
  price?: number; // Numeric price if available
  priceString?: string; // Formatted price string (e.g., "1.200.000₫", "Liên hệ")
  promotion?: string; // Description of promotion
  stockStatus?: string; // e.g., "Còn hàng", "Hết hàng", "Sắp về"
  warranty?: string; // e.g., "12 tháng"
  imageUrl?: string; // Optional URL for product image
  // Optional concluding text from the bot
  comment?: string;
}

// src/dto/ProductComparisonData.dto.ts
// NEW FILE: Define the structure for product comparison
