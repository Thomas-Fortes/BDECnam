import imageCompression from "browser-image-compression";

const TARGET_SIZE = 400;

/**
 * Recadre l'image au centre en carré, la redimensionne à 400x400 puis la
 * compresse en WebP (< ~100 Ko visé) — le tout côté client pour économiser
 * le réseau, souvent faible sur le lieu du WEI.
 */
export async function prepareAvatarFile(file: File): Promise<File> {
  const cropped = await centerCropSquare(file, TARGET_SIZE);
  return imageCompression(cropped, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: TARGET_SIZE,
    fileType: "image/webp",
    initialQuality: 0.8,
    useWebWorker: true,
  });
}

/** Compression pour les photos de défis (pas de recadrage carré, juste compression). */
export async function prepareChallengePhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1280,
    fileType: "image/webp",
    initialQuality: 0.8,
    useWebWorker: true,
  });
}

function centerCropSquare(file: File, size: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible de préparer l'image."));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Impossible de préparer l'image."));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" }));
        },
        "image/webp",
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };

    img.src = url;
  });
}
