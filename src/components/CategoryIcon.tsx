// A simple line icon per category, shown when a product has no photo yet (instead of a
// stock photo that might not be the actual product). Icons: Lucide (ISC licence).
import {
  Armchair,
  BedDouble,
  Brush,
  CookingPot,
  Droplets,
  Footprints,
  Handbag,
  Headphones,
  Lamp,
  Laptop,
  type LucideProps,
  Microwave,
  Shirt,
  SprayCan,
  Tv,
  Watch,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Category } from "@/lib/types";

/** Lucide has no trousers icon, so this one is drawn in the same style. */
function Pants(props: LucideProps) {
  const { size = 24, strokeWidth = 2, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M7 2h10l1.5 20h-4.5l-2-12-2 12H5.5L7 2z" />
      <path d="M7 6h10" />
    </svg>
  );
}

const ICONS: Record<Category, ComponentType<LucideProps>> = {
  Tops: Shirt,
  Pants,
  Shoes: Footprints,
  Bags: Handbag,
  Furniture: Armchair,
  Bedding: BedDouble,
  Lighting: Lamp,
  Kitchen: CookingPot,
  Makeup: Brush,
  Skincare: Droplets,
  Fragrance: SprayCan,
  Headphones,
  Laptops: Laptop,
  TVs: Tv,
  Watches: Watch,
  Appliances: Microwave,
};

/** The gradient tile with the category's icon and name, filling its (relative) parent. */
export function CategoryTile({ category, size = "large" }: { category: Category; size?: "large" | "small" }) {
  const Icon = ICONS[category] ?? Shirt;
  if (size === "small") return <Icon aria-hidden="true" className="h-5 w-5 text-white/85" strokeWidth={1.5} />;
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white/85">
      <Icon aria-hidden="true" className="h-14 w-14" strokeWidth={1.25} />
      <span className="font-display text-xl">{category}</span>
    </span>
  );
}
