/**
 * Resize and compress an image file on the client side before uploading.
 * Returns a Blob ready to be uploaded.
 */
export async function optimizeImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
  const img = await loadImage(file);
  return resizeAndCompress(img, maxWidth, maxHeight, quality);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function resizeAndCompress(img, maxW, maxH, quality) {
  return new Promise((resolve) => {
    let { naturalWidth: w, naturalHeight: h } = img;

    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    canvas.toBlob(resolve, 'image/webp', quality);
  });
}
