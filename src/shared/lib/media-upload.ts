export const MEDIA_FOLDERS = [
  'apropos',
  'products',
  'categories',
  'newsletter',
  'promotions',
  'couriers',
  'misc',
] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function isMediaFolder(value: string): value is MediaFolder {
  return (MEDIA_FOLDERS as readonly string[]).includes(value);
}

export function validateImageUpload(file: File): string | null {
  if (!IMAGE_UPLOAD_MIME_TYPES.has(file.type)) {
    return 'Format accepté : JPG, PNG, WebP ou GIF';
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return 'Image trop lourde (max 5 Mo)';
  }
  return null;
}

export function isCloudinaryUrl(url: string): boolean {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(url);
}

export function isOptimizableImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  return isCloudinaryUrl(url) || url.startsWith('https://images.unsplash.com/');
}
