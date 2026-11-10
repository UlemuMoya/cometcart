// Hand-picked inspiration tiles for the home screen, one per category.
// Photos are from Pexels, chosen for plain, neutral backgrounds; see public/images/LICENCES.md.
// `focus` is the part of the photo to keep in view when the tile crops it (CSS object-position).

import type { Category } from "@/lib/types";

export const INSPIRATION: { category: Category; image: string; alt: string; focus?: string }[] = [
  { category: "Tops", image: "/images/top.jpg", alt: "Plain white crew-neck T-shirt" },
  { category: "Pants", image: "/images/jeans.jpg", alt: "Folded blue jeans" },
  { category: "Shoes", image: "/images/sneakers.jpg", alt: "Cream leather sneakers", focus: "50% 10%" },
  { category: "Bags", image: "/images/handbag.jpg", alt: "Blue and tan tote bags", focus: "50% 75%" },
  { category: "Furniture", image: "/images/armchair.jpg", alt: "Wooden armchair with grey cushions" },
  { category: "Bedding", image: "/images/bedding.jpg", alt: "White bed linen" },
  { category: "Lighting", image: "/images/lamp.jpg", alt: "White table lamp, switched on", focus: "50% 35%" },
  { category: "Kitchen", image: "/images/dinnerware.jpg", alt: "Cream ceramic tableware", focus: "70% 55%" },
  { category: "Makeup", image: "/images/makeup.jpg", alt: "Makeup laid out on a cream background" },
  { category: "Skincare", image: "/images/skincare.jpg", alt: "Plain skincare tubes on linen" },
  { category: "Fragrance", image: "/images/perfume.jpg", alt: "Glass perfume bottle", focus: "50% 60%" },
  { category: "Headphones", image: "/images/headphones.jpg", alt: "Black headphones on white" },
  { category: "Laptops", image: "/images/laptop.jpg", alt: "Laptop on a white desk", focus: "50% 65%" },
  { category: "TVs", image: "/images/tv-room.jpg", alt: "TV on a white wall", focus: "40% 30%" },
  { category: "Watches", image: "/images/smartwatch.jpg", alt: "Smartwatch with a white strap" },
  // The coffee machine, not the air fryer: no plain-background air fryer photo was available.
  {
    category: "Appliances",
    image: "/images/coffee-machine.jpg",
    alt: "Espresso machine on a white counter",
    focus: "75% 40%",
  },
];

/** The 8 shown on the home page: two strong photos from each group (Fashion, Home, Beauty, Tech),
 *  so Inspiration reads as a mood board rather than a second list of every category. */
const HOME_PICKS: Category[] = ["Bags", "Furniture", "Makeup", "Laptops", "Pants", "Lighting", "Fragrance", "Watches"];
export const HOME_INSPIRATION = HOME_PICKS.map((c) => INSPIRATION.find((t) => t.category === c)!);
