export default async function spritestack(imageUrl, x, y, z) {
  // Load the image
  const img = await new Promise((resolve, reject) => {
    const i = new window.Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageUrl;
  });

  const slices = [];
  const canvas = document.createElement('canvas');
  canvas.width = y;
  canvas.height = x;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // Prevent blurring

  for (let i = 0; i < z; i++) {
    ctx.clearRect(0, 0, y, x);
    // Draw slices from bottom to top
    ctx.drawImage(
      img,
      0, (z - 1 - i) * x, y, x, // source x, y, w, h
      0, 0, y, x                 // dest x, y, w, h
    );
    slices.push(canvas.toDataURL());
  }
  return slices;
}
