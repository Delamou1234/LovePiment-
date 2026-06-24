'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { courierInitials } from './courier-card.utils';

type Props = {
  livreurId: string;
  nom: string;
  photoUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  onPhotoChange: (url: string | null) => void;
};

const SIZES = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-24 w-24 text-lg',
} as const;

export function CourierPhotoUpload({
  livreurId,
  nom,
  photoUrl,
  size = 'md',
  onPhotoChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/admin/livreurs/${livreurId}/photo`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Erreur lors de l\u2019envoi');
        return;
      }
      onPhotoChange(data.url as string);
    } catch {
      setError('Impossible d\u2019envoyer la photo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setError('');
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/livreurs/${livreurId}/photo`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Erreur');
        return;
      }
      onPhotoChange(null);
    } catch {
      setError('Impossible de supprimer la photo');
    } finally {
      setRemoving(false);
    }
  };

  const busy = uploading || removing;
  const sizeClass = SIZES[size];

  return (
    <div className="courier-photo-upload">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`courier-photo-upload__preview ${sizeClass}`}
        title="Changer la photo"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={nom} className="courier-photo-upload__img" />
        ) : (
          <span className="courier-photo-upload__initials">{courierInitials(nom)}</span>
        )}
        <span className="courier-photo-upload__overlay">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </span>
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

      {photoUrl && (
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="courier-photo-upload__remove"
          title="Supprimer la photo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {error && <p className="courier-photo-upload__error">{error}</p>}
    </div>
  );
}

export async function uploadCourierPhoto(livreurId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`/api/admin/livreurs/${livreurId}/photo`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Upload impossible');
  }
  return data.url as string;
}
