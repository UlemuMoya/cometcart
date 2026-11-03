// Hand-picked inspiration tiles for the home screen, one per category.
// Photos are from Pexels, chosen for plain, neutral backgrounds; see public/images/LICENCES.md.

import type { Category } from "@/lib/types";

export const INSPIRATION: { category: Category; image: string; alt: string }[] = [
  { category: "Tops", image: "/images/top.jpg", alt: "Plain white crew-neck T-shirt" },
  { category: "Pants", image: "/images/jeans.jpg", alt: "Folded blue jeans" },
  { category: "Shoes", image: "/images/sneakers.jpg", alt: "Cream leather sneakers" },
  { category: "Bags", image: "/images/handbag.jpg", alt: "Blue and tan tote bags" },
  { category: "Furniture", image: "/images/armchair.jpg", alt: "Wooden armchair with grey cushions" },
  { category: "Bedding", image: "/images/bedding.jpg", alt: "White bed linen" },
  { category: "Lighting", image: "/images/lamp.jpg", alt: "White table lamp, switched on" },
  { category: "Kitchen", image: "/images/dinnerware.jpg", alt: "Cream ceramic tableware" },
  { category: "Makeup", image: "/images/makeup.jpg", alt: "Makeup laid out on a cream background" },
  { category: "Skincare", image: "/images/skincare.jpg", alt: "Plain skincare tubes on linen" },
  { category: "Fragrance", image: "/images/perfume.jpg", alt: "Glass perfume bottle" },
  { category: "Headphones", image: "/images/headphones.jpg", alt: "Black headphones on white" },
  { category: "Laptops", image: "/images/laptop.jpg", alt: "Laptop on a white desk" },
  { category: "TVs", image: "/images/tv-room.jpg", alt: "TV on a white wall" },
  { category: "Watches", image: "/images/smartwatch.jpg", alt: "Smartwatch with a white strap" },
  // The coffee machine, not the air fryer: no plain-background air fryer photo was available.
  { category: "Appliances", image: "/images/coffee-machine.jpg", alt: "Espresso machine on a white counter" },
];
