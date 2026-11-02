// Hand-picked inspiration tiles for the home screen, one per category.
// Photos are owner-supplied; see public/images/LICENCES.md.

import type { Category } from "@/lib/types";

export const INSPIRATION: { category: Category; image: string; alt: string }[] = [
  { category: "Tops", image: "/images/top.jpg", alt: "Cream short-sleeved top" },
  { category: "Pants", image: "/images/jeans.jpg", alt: "Light blue wide-leg jeans" },
  { category: "Shoes", image: "/images/sneakers.jpg", alt: "White leather sneakers" },
  { category: "Bags", image: "/images/handbag.jpg", alt: "Black leather handbag" },
  { category: "Furniture", image: "/images/armchair.jpg", alt: "Wooden armchair with a cream cushion" },
  { category: "Bedding", image: "/images/bedding.jpg", alt: "Bed made with grey linen bedding" },
  { category: "Lighting", image: "/images/lamp.jpg", alt: "White dome table lamp" },
  { category: "Kitchen", image: "/images/dinnerware.jpg", alt: "Cream stoneware plates, bowl and cup" },
  { category: "Makeup", image: "/images/makeup.jpg", alt: "Makeup palette, brushes and lipsticks" },
  { category: "Skincare", image: "/images/skincare.jpg", alt: "Skincare bottles and jars" },
  { category: "Fragrance", image: "/images/perfume.jpg", alt: "Glass perfume bottle" },
  { category: "Headphones", image: "/images/headphones.jpg", alt: "Black over-ear headphones" },
  { category: "Laptops", image: "/images/laptop.jpg", alt: "Slim laptop on a stone block" },
  { category: "TVs", image: "/images/tv-room.jpg", alt: "Large TV in a living room" },
  { category: "Watches", image: "/images/smartwatch.jpg", alt: "Grey smartwatch" },
  { category: "Appliances", image: "/images/air-fryer.jpg", alt: "Black air fryer" },
];
