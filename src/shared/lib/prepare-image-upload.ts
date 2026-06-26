import { IMAGE_UPLOAD_MAX_BYTES } from '@/shared/lib/media-upload';

/** Redimensionne et compresse côté navigateur avant envoi — upload beaucoup plus rapide. */

const MAX_EDGE_PX = 1920;
const WEBP_QUALITY = 0.82;
const SKIP_COMPRESS_BELOW_BYTES = 280 * 1024;

export type PreparedImage = {
  file: File;
  /** Aperçu local instantané (revoke après usage) */
  previewUrl: string;
  compressed: boolean;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire l’image'));
    };
    img.src = url;
  });
}

function canvasToWebpFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression échouée'));
          return;
        }
        const base = name.replace(/\.[^.]+$/, '') || 'image';
        resolve(new File([blob], `${base}.webp`, { type: 'image/webp' }));
      },
      'image/webp',
      WEBP_QUALITY,
    );
  });
}

/** Prépare le fichier : WebP redimensionné si utile, sinon fichier d’origine. */
export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  if (file.type === 'image/gif') {
    return { file, previewUrl: URL.createObjectURL(file), compressed: false };
  }

  if (file.type === 'image/webp' && file.size <= SKIP_COMPRESS_BELOW_BYTES) {
    return { file, previewUrl: URL.createObjectURL(file), compressed: false };
  }

  try {
    const img = await loadImageFromFile(file);
    const { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    if (scale === 1 && file.type === 'image/webp' && file.size <= IMAGE_UPLOAD_MAX_BYTES) {
      return { file, previewUrl: URL.createObjectURL(file), compressed: false };
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { file, previewUrl: URL.createObjectURL(file), compressed: false };
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const compressedFile = await canvasToWebpFile(canvas, file.name);

    if (compressedFile.size >= file.size && file.size <= IMAGE_UPLOAD_MAX_BYTES) {
      return { file, previewUrl: URL.createObjectURL(file), compressed: false };
    }

    return {
      file: compressedFile,
      previewUrl: URL.createObjectURL(compressedFile),
      compressed: true,
    };
  } catch {
    return { file, previewUrl: URL.createObjectURL(file), compressed: false };
  }
}

export function revokePreparedPreview(previewUrl: string) {
  if (previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
}
