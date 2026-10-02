const DEFAULT_OUTPUT_SIZE = 512;
const DEFAULT_JPEG_QUALITY = 0.9;

/**
 * Load, center-crop to square, and resize an image file.
 * Output is always a square JPEG at `size` × `size`, suitable for avatar upload.
 * No UI — produces the result silently.
 */
export async function cropImageToSquareFile(
  file: File,
  size: number = DEFAULT_OUTPUT_SIZE,
  quality: number = DEFAULT_JPEG_QUALITY,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;

    ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
        'image/jpeg',
        quality,
      );
    });
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}
