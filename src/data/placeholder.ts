// Step 1 placeholder content for the home screen.
// Products, shops and prices here are made up. They are replaced by real
// catalogue data in step 5. Photos are owner-supplied; see public/images/LICENCES.md.

export type Offer = {
  shop: string;
  priceZar: number;
  checkedOn: string; // date the price was checked, shown next to every price
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  image: string;
  offers: Offer[];
};

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

export type Category = (typeof CATEGORIES)[number];

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

const CHECKED = "1 Nov 2026";

export const TRENDING: Product[] = [
  {
    id: "sample-headphones",
    name: "Wireless over-ear headphones",
    category: "Headphones",
    image: "/images/headphones-phone.jpg",
    offers: [
      { shop: "Nova Mart", priceZar: 1299, checkedOn: CHECKED },
      { shop: "Circuit Hub", priceZar: 1399, checkedOn: CHECKED },
    ],
  },
  {
    id: "sample-serum",
    name: "Face serum (30 ml)",
    category: "Skincare",
    image: "/images/serum.jpg",
    offers: [
      { shop: "Glow Counter", priceZar: 449, checkedOn: CHECKED },
      { shop: "Lumi Store", priceZar: 479, checkedOn: CHECKED },
    ],
  },
  {
    id: "sample-coffee",
    name: "Coffee machine for small spaces",
    category: "Appliances",
    image: "/images/coffee-machine.jpg",
    offers: [
      { shop: "Haven Home", priceZar: 1799, checkedOn: CHECKED },
      { shop: "Nova Mart", priceZar: 1899, checkedOn: CHECKED },
    ],
  },
  {
    id: "sample-robovac",
    name: "Robot vacuum cleaner",
    category: "Appliances",
    image: "/images/robot-vacuum.jpg",
    offers: [
      { shop: "Circuit Hub", priceZar: 2999, checkedOn: CHECKED },
      { shop: "Haven Home", priceZar: 3199, checkedOn: CHECKED },
    ],
  },
  {
    id: "sample-blender",
    name: "Countertop blender",
    category: "Appliances",
    image: "/images/blender.jpg",
    offers: [
      { shop: "Haven Home", priceZar: 899, checkedOn: CHECKED },
      { shop: "Nova Mart", priceZar: 949, checkedOn: CHECKED },
    ],
  },
  {
    id: "sample-perfume",
    name: "Eau de parfum (50 ml)",
    category: "Fragrance",
    image: "/images/perfume.jpg",
    offers: [
      { shop: "Glow Counter", priceZar: 1299, checkedOn: CHECKED },
      { shop: "Lumi Store", priceZar: 1399, checkedOn: CHECKED },
    ],
  },
];
