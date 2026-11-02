export const PHOTO_BUCKET = "product-photos";

/** The storage path of a photo this person uploaded, from its public URL; null for any other image. */
export function ownPhotoPath(url: string | null | undefined, userId: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`;
  if (!url || !url.includes(`${marker}${userId}/`)) return null;
  return url.slice(url.indexOf(marker) + marker.length);
}
