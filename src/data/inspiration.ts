// Hand-picked inspiration tiles for the home screen, one per category.
// Photos are from Pexels; see public/images/LICENCES.md.

import type { Category } from "@/lib/types";

export const INSPIRATION: { category: Category; image: string; alt: string }[] = [
  { category: "Tops", image: "/images/top.jpg", alt: "White T-shirt on a sunlit wooden floor" },
  { category: "Pants", image: "/images/jeans.jpg", alt: "Stack of folded blue jeans" },
  { category: "Shoes", image: "/images/sneakers.jpg", alt: "White sneakers on red cloth" },
  { category: "Bags", image: "/images/handbag.jpg", alt: "Black leather bag" },
  { category: "Furniture", image: "/images/armchair.jpg", alt: "Wooden armchairs with woven backs" },
  { category: "Bedding", image: "/images/bedding.jpg", alt: "Bed with grey linen bedding" },
  { category: "Lighting", image: "/images/lamp.jpg", alt: "White table lamp, switched on" },
  { category: "Kitchen", image: "/images/dinnerware.jpg", alt: "Ceramic plates and bowls from above" },
  { category: "Makeup", image: "/images/makeup.jpg", alt: "Eyeshadow palette and makeup brushes on marble" },
  { category: "Skincare", image: "/images/skincare.jpg", alt: "Skincare jars with bamboo lids" },
  { category: "Fragrance", image: "/images/perfume.jpg", alt: "Glass perfume bottle" },
  { category: "Headphones", image: "/images/headphones.jpg", alt: "Black over-ear headphones on wood" },
  { category: "Laptops", image: "/images/laptop.jpg", alt: "Laptop on a white table" },
  { category: "TVs", image: "/images/tv-room.jpg", alt: "TV on a living-room wall" },
  { category: "Watches", image: "/images/smartwatch.jpg", alt: "Pink smartwatch" },
  { category: "Appliances", image: "/images/air-fryer.jpg", alt: "Air fryer basket with chicken" },
];
