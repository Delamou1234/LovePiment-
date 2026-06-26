import { v2 as cloudinary } from 'cloudinary';
import type { MediaFolder } from '@/shared/lib/media-upload';

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

export type CloudinarySignPayload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
};

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function getFolderPath(folder: MediaFolder): string {
  const prefix = process.env.CLOUDINARY_FOLDER_PREFIX?.trim() || 'lovepimente';
  return `${prefix}/${folder}`;
}

function ensureCloudinaryConfig() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary non configuré — ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env.local',
    );
  }
}

/** Signature pour upload direct navigateur → Cloudinary (plus rapide, sans passer par Next.js). */
export function createDirectUploadSignature(folder: MediaFolder): CloudinarySignPayload {
  ensureCloudinaryConfig();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const folderPath = getFolderPath(folder);
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { folder: folderPath, timestamp },
    apiSecret,
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: folderPath,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

/** Envoie le fichier binaire vers Cloudinary — seule l’URL est stockée en base. */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: MediaFolder,
): Promise<CloudinaryUploadResult> {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: getFolderPath(folder),
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('Échec du téléversement Cloudinary'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );

    stream.end(buffer);
  });
}

/** Supprime une ressource Cloudinary (optionnel — si l’URL est hébergée chez Cloudinary). */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  ensureCloudinaryConfig();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

export function publicIdFromCloudinaryUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match?.[1] ?? null;
}
