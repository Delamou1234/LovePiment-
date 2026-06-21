'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, Camera, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';

type Props = {
  productId: string;
  orderId: string;
  productNom: string;
  onSuccess?: () => void;
  compact?: boolean;
};

export function ReviewForm({
  productId,
  orderId,
  productNom,
  onSuccess,
  compact = false,
}: Props) {
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const uploadPhoto = async (file: File) => {
    if (photos.length >= 3) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/avis/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPhotos((prev) => [...prev, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, note, commentaire, photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Merci ! Votre avis vérifié sur « {productNom} » a été publié.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#ebe4d8] bg-white ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      {!compact && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#4a5240] mb-1">
            Laisser un avis
          </p>
          <h3 className="font-bold text-zinc-900">{productNom}</h3>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
            Achat vérifié — commande livrée
          </p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-zinc-600 mb-2">Votre note</p>
        <StarRating value={note} onChange={setNote} size="lg" />
      </div>

      <div>
        <label className="text-xs font-semibold text-zinc-600">Commentaire</label>
        <textarea
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={compact ? 3 : 4}
          maxLength={2000}
          placeholder="Qualité, parfum, texture, emballage…"
          className="mt-1.5 w-full rounded-xl border border-[#ebe4d8] bg-[#faf7f2] px-4 py-3 text-sm outline-none focus:border-[#4a5240]"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-600 mb-2">
          Photos (optionnel, max 3)
        </p>
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative h-16 w-16 rounded-lg overflow-hidden border border-[#ebe4d8]">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white text-xs"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#ebe4d8] bg-[#faf7f2] hover:border-[#4a5240] transition">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              ) : (
                <Camera className="h-5 w-5 text-zinc-400" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="button"
        onClick={submit}
        disabled={loading || commentaire.trim().length < 10}
        className="rounded-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Publier mon avis
      </Button>
    </div>
  );
}
