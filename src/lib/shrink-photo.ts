/**
 * Shrinks a photo in the browser to at most 1200px and re-saves it as JPEG. This keeps
 * uploads small and drops hidden data such as the GPS location some phones add (POPIA).
 */
export async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** Swaps the file chosen in a file input for its shrunk copy; returns a preview URL. */
export async function shrinkInputPhoto(input: HTMLInputElement): Promise<string | null> {
  const file = input.files?.[0];
  if (!file) return null;
  try {
    const small = await shrinkPhoto(file);
    const list = new DataTransfer();
    list.items.add(small);
    input.files = list.files;
    return URL.createObjectURL(small);
  } catch {
    return URL.createObjectURL(file); // couldn't shrink; the server still checks the size
  }
}
