/**
 * Client-side image compression.
 *
 * Files already within TARGET_SIZE_BYTES are returned unchanged.
 * Larger files are redrawn on a canvas and re-encoded as JPEG, using a
 * binary-search quality bisect to find the highest quality that still fits.
 * Files over MAX_RAW_BYTES are rejected outright (no attempt to compress).
 *
 * MAX_DIM caps the canvas resolution so a 50-megapixel photo doesn't OOM
 * the browser tab while still keeping enough resolution for FASHN's model.
 */

const TARGET_SIZE_BYTES = 2 * 1024 * 1024;   // 2 MB — target after compression
const MAX_RAW_BYTES     = 20 * 1024 * 1024;  // 20 MB — reject before touching
const MAX_DIM           = 2048;               // max pixel dimension on either axis

export class ImageTooLargeError extends Error {
  constructor(sizeMB: number) {
    super(
      `Photo is ${sizeMB.toFixed(1)} MB — please use one under 20 MB.`
    );
    this.name = "ImageTooLargeError";
  }
}

/**
 * Compress a File to ≤ TARGET_SIZE_BYTES.
 * Returns the original file unchanged if already small enough.
 * Throws ImageTooLargeError for files over MAX_RAW_BYTES.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size > MAX_RAW_BYTES) {
    throw new ImageTooLargeError(file.size / (1024 * 1024));
  }

  if (file.size <= TARGET_SIZE_BYTES) {
    return file;
  }

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
    width  = Math.round(width  * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Binary-search for the highest JPEG quality that still fits the target.
  let lo = 0.1, hi = 0.92;
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const probe = await toBlob(canvas, mid);
    if (probe.size <= TARGET_SIZE_BYTES) lo = mid; else hi = mid;
  }

  const blob = await toBlob(canvas, lo);
  const stem = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${stem}.jpg`, { type: "image/jpeg" });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      quality
    )
  );
}
