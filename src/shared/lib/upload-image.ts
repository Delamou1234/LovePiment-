export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';
export type ImageExt = 'jpg' | 'png' | 'webp';

export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

const MIME_ALIASES: Record<string, ImageMime> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/x-png': 'image/png',
  'image/webp': 'image/webp',
};

const EXT_TO_MIME: Record<string, ImageMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function mimeToExt(mime: ImageMime): ImageExt {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export function isFormDataUpload(entry: FormDataEntryValue | null): entry is Blob {
  return (
    entry !== null &&
    typeof entry === 'object' &&
    typeof (entry as Blob).arrayBuffer === 'function'
  );
}

export function resolveImageMime(type: string, filename = ''): ImageMime | null {
  const fromType = MIME_ALIASES[type.toLowerCase()];
  if (fromType) return fromType;

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? null;
}

export function parseUploadedImage(
  entry: FormDataEntryValue | null,
  maxBytes = IMAGE_UPLOAD_MAX_BYTES,
):
  | { ok: true; blob: Blob; mime: ImageMime; ext: ImageExt; size: number }
  | { ok: false; message: string } {
  if (!isFormDataUpload(entry)) {
    return { ok: false, message: 'Fichier requis' };
  }

  const filename = 'name' in entry && typeof entry.name === 'string' ? entry.name : '';
  const mime = resolveImageMime(entry.type ?? '', filename);
  if (!mime) {
    return { ok: false, message: 'Format JPG, PNG ou WebP uniquement' };
  }

  const size = entry.size;
  if (size > maxBytes) {
    return { ok: false, message: 'Image trop lourde (max 2 Mo)' };
  }

  if (size <= 0) {
    return { ok: false, message: 'Fichier vide ou illisible' };
  }

  return { ok: true, blob: entry, mime, ext: mimeToExt(mime), size };
}

export function validateClientImageFile(file: File, maxBytes = IMAGE_UPLOAD_MAX_BYTES): string | null {
  const mime = resolveImageMime(file.type, file.name);
  if (!mime) {
    return 'Format JPG, PNG ou WebP uniquement';
  }
  if (file.size > maxBytes) {
    return 'Image trop lourde (max 2 Mo)';
  }
  if (file.size <= 0) {
    return 'Fichier vide ou illisible';
  }
  return null;
}
