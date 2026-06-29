'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { CompteAvatar } from './CompteAvatar';
import { notifyAvatarUpdated } from '@/modules/compte/lib/avatar-events';
import { fetchApi } from '@/shared/lib/client-fetch';
import { validateClientImageFile } from '@/shared/lib/upload-image';
import type { CustomerProfile } from '@/modules/compte/types';

type Props = {
  profil: CustomerProfile;
  onProfilUpdate: (p: CustomerProfile) => void;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  showRemove?: boolean;
  variant?: 'full' | 'compact';
};

function isUploadedAvatar(url: string | null | undefined) {
  return Boolean(url?.startsWith('/uploads/avatars/'));
}

export function CompteAvatarUpload({
  profil,
  onProfilUpdate,
  size = 'xl',
  showRemove = true,
  variant = 'full',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    const validationError = validateClientImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchApi('/api/compte/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Erreur lors de l'envoi");
        return;
      }
      onProfilUpdate(data.profil as CustomerProfile);
      notifyAvatarUpdated((data.profil as CustomerProfile).avatarUrl);
    } catch {
      setError("Impossible d'envoyer la photo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!isUploadedAvatar(profil.avatarUrl)) return;
    setError('');
    setRemoving(true);
    try {
      const res = await fetchApi('/api/compte/avatar', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Erreur');
        return;
      }
      onProfilUpdate(data.profil as CustomerProfile);
      notifyAvatarUpdated((data.profil as CustomerProfile).avatarUrl);
    } catch {
      setError('Impossible de supprimer la photo');
    } finally {
      setRemoving(false);
    }
  };

  const busy = uploading || removing;
  const canRemove = showRemove && isUploadedAvatar(profil.avatarUrl);

  const avatarBlock = (
    <>
      <CompteAvatar profil={profil} size={size} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-olive text-white shadow-md hover:bg-olive-dark transition disabled:opacity-60"
        aria-label="Changer la photo de profil"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </>
  );

  if (variant === 'compact') {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <div className="relative inline-block">{avatarBlock}</div>
        {error && <p className="text-xs text-red-600 max-w-[220px]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <div className="relative inline-block">
        {avatarBlock}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-xs font-semibold text-olive hover:text-olive-dark disabled:opacity-60"
        >
          {profil.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-zinc-400">JPG, PNG ou WebP · max 2 Mo</p>
    </div>
  );
}
