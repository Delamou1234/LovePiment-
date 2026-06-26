'use client';

import { useRef, useState } from 'react';
import { useCloudinaryUpload } from '@/shared/hooks/useCloudinaryUpload';
import type { MediaFolder } from '@/shared/lib/media-upload';
import { validateImageUpload } from '@/shared/lib/media-upload';

type CloudinaryImageFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: MediaFolder;
  hint?: string;
  placeholder?: string;
  previewAspect?: 'square' | 'video' | 'wide';
};

const previewSizes = {
  square: 'h-20 w-20',
  video: 'h-20 w-36',
  wide: 'h-16 w-28',
};

export function CloudinaryImageField({
  label,
  value,
  onChange,
  folder,
  hint,
  placeholder = 'https://res.cloudinary.com/...',
  previewAspect = 'video',
}: CloudinaryImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, previewUrl, error, clearError } =
    useCloudinaryUpload(folder);
  const [localError, setLocalError] = useState<string | null>(null);

  const displaySrc = previewUrl || value;
  const displayError = localError ?? error;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateImageUpload(file);
    if (validationError) {
      setLocalError(validationError);
      clearError();
      return;
    }

    setLocalError(null);
    clearError();

    const result = await upload(file);
    if (result?.url) {
      onChange(result.url);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex flex-wrap items-start gap-3">
        {displaySrc ? (
          <div
            className={`relative shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${previewSizes[previewAspect]}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displaySrc} alt="" className="h-full w-full object-cover" />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                {progress}%
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 ${previewSizes[previewAspect]}`}
          >
            Aperçu
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />

          {uploading ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-rose-600 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {uploading ? `Envoi ${progress}%…` : 'Téléverser'}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Effacer
              </button>
            ) : null}
          </div>

          {displayError ? <p className="text-sm text-red-600">{displayError}</p> : null}
          {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
          <p className="text-xs text-gray-400">
            Compression automatique + envoi direct Cloudinary — seul le lien est enregistré en base.
          </p>
        </div>
      </div>
    </div>
  );
}

type CloudinaryUploadButtonProps = {
  folder: MediaFolder;
  onUploaded: (url: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/** Bouton compact pour ajouter une image (ex. galerie produit). */
export function CloudinaryUploadButton({
  folder,
  onUploaded,
  label = 'Téléverser',
  disabled,
  className = '',
}: CloudinaryUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error } = useCloudinaryUpload(folder);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateImageUpload(file);
    if (validationError) return;

    const result = await upload(file);
    if (result?.url) {
      onUploaded(result.url);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className={
          className ||
          'rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60'
        }
      >
        {uploading ? `${progress}%` : label}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
