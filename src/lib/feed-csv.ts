// Reads a shop's product feed sent as a CSV spreadsheet (see public/feed-template.csv).
// Columns: name, category, price, url, image (image optional). Header names are case-insensitive.
import { CATEGORIES } from "./categories.ts";
import { guessCategory } from "./link-guess.ts";
import type { Category } from "./types";

export type FeedRow = { name: string; category: Category; price: number; url: string; image: string };
export type FeedProblem = { line: number; reason: string };

/** Splits CSV text into rows of cells, handling quoted cells with commas, quotes and line breaks. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === "," || c === ";") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const HEADERS: Record<string, keyof FeedRow> = {
  name: "name",
  title: "name",
  product: "name",
  category: "category",
  price: "price",
  url: "url",
  link: "url",
  image: "image",
  photo: "image",
  image_url: "image",
};

function webUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, "");

/**
 * Checks every row. Links must be on the shop's own website, so a shop can only
 * list its own products. Unknown categories are guessed from the product name.
 */
export function readFeed(text: string, shopWebsite: string): { rows: FeedRow[]; problems: FeedProblem[] } {
  const [header, ...lines] = parseCsv(text.replace(/^﻿/, ""));
  const problems: FeedProblem[] = [];
  if (!header) return { rows: [], problems: [{ line: 1, reason: "The file is empty." }] };

  const cols = header.map((h) => HEADERS[h.trim().toLowerCase()]);
  for (const need of ["name", "price", "url"] as const)
    if (!cols.includes(need)) problems.push({ line: 1, reason: `Missing a “${need}” column.` });
  if (problems.length) return { rows: [], problems };

  const shopHost = bareHost(webUrl(shopWebsite)?.hostname ?? shopWebsite);
  const rows: FeedRow[] = [];
  lines.slice(0, 2000).forEach((cells, i) => {
    const line = i + 2;
    const get = (k: keyof FeedRow) => (cells[cols.indexOf(k)] ?? "").trim();
    const name = get("name").slice(0, 120);
    // "R1 299,99" (comma for cents, common in SA spreadsheets) and "1,299.99" both mean 1299.99.
    const rawPrice = get("price").replace(/[^\d.,]/g, "");
    const price = Number(/,\d{1,2}$/.test(rawPrice) ? rawPrice.replace(/\./g, "").replace(",", ".") : rawPrice.replace(/,/g, ""));
    const url = webUrl(get("url"));
    const typed = get("category").toLowerCase();
    const category =
      (CATEGORIES as readonly string[]).find((c) => c.toLowerCase() === typed) ?? guessCategory(name);
    const image = webUrl(get("image"));

    if (!name) return problems.push({ line, reason: "No product name." });
    if (!Number.isFinite(price) || price <= 0) return problems.push({ line, reason: `“${name}”: no valid price.` });
    if (!url) return problems.push({ line, reason: `“${name}”: no valid link.` });
    const host = bareHost(url.hostname);
    if (host !== shopHost && !host.endsWith(`.${shopHost}`))
      return problems.push({ line, reason: `“${name}”: the link isn’t on ${shopHost}.` });
    if (!category) return problems.push({ line, reason: `“${name}”: couldn’t tell the category.` });
    rows.push({
      name,
      category: category as Category,
      price,
      url: url.toString(),
      image: image?.protocol === "https:" ? image.toString() : "",
    });
  });
  if (lines.length > 2000) problems.push({ line: 2002, reason: "Only the first 2 000 products were read." });
  return { rows, problems };
}
