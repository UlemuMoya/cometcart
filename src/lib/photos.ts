import { supabaseUrl } from "./supabase/config";

export const PHOTO_BUCKET = "product-photos";

/**
 * Whether Next.js may resize this photo: our own files and uploads only. Photos from
 * shop feeds stay on the shop's website and are shown as they are (`unoptimized`).
 */
export function isOwnPhoto(src: string) {
  return src.startsWith("/") || (!!supabaseUrl && src.startsWith(`${supabaseUrl}/storage/v1/object/public/`));
}

/** The storage path of a photo this person uploaded, from its public URL; null for any other image. */
export function ownPhotoPath(url: string | null | undefined, userId: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`;
  if (!url || !url.includes(`${marker}${userId}/`)) return null;
  return url.slice(url.indexOf(marker) + marker.length);
}
