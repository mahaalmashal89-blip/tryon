function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Composites a background-removed subject PNG onto a soft studio background.
 *
 * Fetches the image through our server proxy (avoids CORS canvas taint),
 * draws a warm off-white gradient backdrop with a simulated overhead softbox
 * and a contact shadow under the feet, then layers the subject on top.
 *
 * Returns a local blob URL pointing to the composited JPEG.
 * Caller is responsible for calling URL.revokeObjectURL() on the result.
 */
export async function compositeStudio(resultUrl: string): Promise<string> {
  // Proxy through our server to avoid CORS taint when drawing to canvas
  const proxyRes = await fetch(`/api/tryon/download?url=${encodeURIComponent(resultUrl)}`);
  if (!proxyRes.ok) throw new Error("Could not fetch result image for compositing");

  const imageBlob    = await proxyRes.blob();
  const imageBlobUrl = URL.createObjectURL(imageBlob);

  let img: HTMLImageElement;
  try {
    img = await loadImage(imageBlobUrl);
  } finally {
    URL.revokeObjectURL(imageBlobUrl);
  }

  const W = img.naturalWidth  || 800;
  const H = img.naturalHeight || 1100;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // ── Layer 1: Warm off-white studio gradient ────────────────────────────────
  // Top is brightest (lit by overhead key), base is slightly warmer/darker.
  // Palette: warm ivory → neutral sand → warm taupe — never flat white.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    "#f5f2ee");
  bg.addColorStop(0.45, "#ede9e4");
  bg.addColorStop(1,    "#e6e2dc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Layer 2: Overhead softbox bloom (circular light from top center) ───────
  // Simulates a large diffused studio strobe positioned directly above subject.
  const bloom = ctx.createRadialGradient(
    W * 0.50, -H * 0.08, 0,
    W * 0.50,  H * 0.30, W * 0.80,
  );
  bloom.addColorStop(0, "rgba(255,253,249,0.50)");
  bloom.addColorStop(1, "rgba(255,253,249,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  // ── Layer 3: Contact shadow beneath subject's feet ────────────────────────
  // Elliptical blurred shadow grounds the subject onto the studio floor.
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.filter      = "blur(16px)";
  const shadowGrad = ctx.createRadialGradient(
    W * 0.50, H * 0.968, W * 0.03,
    W * 0.50, H * 0.968, W * 0.28,
  );
  shadowGrad.addColorStop(0,   "rgba(25,18,14,1)");
  shadowGrad.addColorStop(0.45,"rgba(25,18,14,0.45)");
  shadowGrad.addColorStop(1,   "rgba(25,18,14,0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(W * 0.50, H * 0.974, W * 0.27, H * 0.020, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Layer 4: Subject (background-removed transparent PNG) ─────────────────
  ctx.drawImage(img, 0, 0, W, H);

  // ── Layer 5: Subtle vignette (darkens outer frame edges gently) ───────────
  // Keeps the eye focused on the centre / subject.
  const vignette = ctx.createRadialGradient(
    W * 0.50, H * 0.43, H * 0.22,
    W * 0.50, H * 0.43, H * 0.74,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(16,10,8,0.11)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Canvas export failed")); return; }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.93,
    );
  });
}
