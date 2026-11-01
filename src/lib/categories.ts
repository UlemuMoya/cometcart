export const CATEGORIES = [
  "Tops",
  "Pants",
  "Shoes",
  "Bags",
  "Furniture",
  "Bedding",
  "Lighting",
  "Kitchen",
  "Makeup",
  "Skincare",
  "Fragrance",
  "Headphones",
  "Laptops",
  "TVs",
  "Watches",
  "Appliances",
] as const;

/**
 * Everyday words people use for each category, so "handbag" finds Bags and
 * "sneakers" finds Shoes even if the product name doesn't say so.
 */
export const CATEGORY_WORDS: Record<(typeof CATEGORIES)[number], string[]> = {
  Tops: ["top", "shirt", "tee", "t-shirt", "blouse", "knit", "jumper", "sweater"],
  Pants: ["pants", "trousers", "jeans", "denim", "chinos", "leggings", "shorts"],
  Shoes: ["shoes", "sneakers", "trainers", "takkies", "sandals", "boots", "heels", "flats"],
  Bags: ["bag", "handbag", "tote", "crossbody", "shoulder", "backpack", "purse", "clutch"],
  Furniture: ["furniture", "chair", "armchair", "table", "sofa", "couch", "desk", "shelf"],
  Bedding: ["bedding", "duvet", "sheets", "pillow", "pillowcase", "linen", "bed", "blanket"],
  Lighting: ["lighting", "lamp", "light", "pendant", "bulb", "chandelier"],
  Kitchen: ["kitchen", "plates", "dinner", "bowls", "mugs", "glasses", "tumblers", "cutlery", "pots", "pans"],
  Makeup: ["makeup", "cosmetics", "lipstick", "mascara", "foundation", "palette", "eyeshadow"],
  Skincare: ["skincare", "serum", "moisturiser", "moisturizer", "cleanser", "sunscreen", "cream", "face"],
  Fragrance: ["fragrance", "perfume", "parfum", "cologne", "scent"],
  Headphones: ["headphones", "earphones", "earbuds", "audio", "wireless", "bluetooth"],
  Laptops: ["laptop", "notebook", "computer", "macbook", "chromebook"],
  TVs: ["tv", "television", "smart tv", "screen"],
  Watches: ["watch", "smartwatch", "wearable", "fitness"],
  Appliances: ["appliance", "appliances", "air fryer", "blender", "kettle", "toaster", "vacuum", "coffee", "microwave"],
};
