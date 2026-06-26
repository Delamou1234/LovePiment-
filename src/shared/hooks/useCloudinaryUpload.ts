'use client';

import { useCallback, useState } from 'react';
import {
  prepareImageForUpload,
  revokePreparedPreview,
} from '@/shared/lib/prepare-image-upload';
import type { MediaFolder } from '@/shared/lib/media-upload';
import { validateImageUpload } from '@/shared/lib/media-upload';

export type CloudinaryUploadResponse = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  message?: string;
};

type CloudinaryDirectResponse = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  error?: { message: string };
};

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
  message?: string;
};

function uploadWithProgress(
  uploadUrl: string,
  formData: FormData,
  onProgress: (pct: number) => void,
): Promise<CloudinaryDirectResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as CloudinaryDirectResponse;
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data);
          return;
        }
        reject(new Error(data.error?.message ?? 'Échec du téléversement'));
      } catch {
        reject(new Error('Réponse Cloudinary invalide'));
      }
    };

    xhr.onerror = () => reject(new Error('Connexion interrompue'));
    xhr.send(formData);
  });
}

export function useCloudinaryUpload(folder: MediaFolder) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<CloudinaryUploadResponse | null> => {
      const validationError = validateImageUpload(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      let localPreview = '';

      try {
        const prepared = await prepareImageForUpload(file);
        localPreview = prepared.previewUrl;
        setPreviewUrl(prepared.previewUrl);
        setProgress(8);

        const signRes = await fetch('/api/admin/media/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder }),
        });
        const sign = (await signRes.json()) as SignResponse;
        if (!signRes.ok) {
          throw new Error(sign.message ?? 'Impossible d’obtenir la signature');
        }

        setProgress(12);

        const formData = new FormData();
        formData.append('file', prepared.file);
        formData.append('api_key', sign.apiKey);
        formData.append('timestamp', String(sign.timestamp));
        formData.append('signature', sign.signature);
        formData.append('folder', sign.folder);

        const result = await uploadWithProgress(sign.uploadUrl, formData, (pct) => {
          setProgress(12 + Math.round(pct * 0.88));
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Échec du téléversement';
        setError(message);
        return null;
      } finally {
        if (localPreview) revokePreparedPreview(localPreview);
        setPreviewUrl(null);
        setUploading(false);
        setProgress(0);
      }
    },
    [folder],
  );

  return {
    upload,
    uploading,
    progress,
    previewUrl,
    error,
    clearError: () => setError(null),
  };
}
