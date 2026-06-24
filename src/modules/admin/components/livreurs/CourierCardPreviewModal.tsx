'use client';

import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';
import { CourierIdCard } from './CourierIdCard';
import { CourierPhotoUpload } from './CourierPhotoUpload';
import { type CourierCardData } from './courier-card.utils';
import { triggerCourierCardPrint } from './print-courier-card';

type Props = {
  livreur: CourierCardData;
  onClose: () => void;
  onPhotoChange: (url: string | null) => void;
};

export function CourierCardPreviewModal({ livreur, onClose, onPhotoChange }: Props) {
  const imprimer = () => {
    triggerCourierCardPrint();
  };

  return (
    <div
      className="admin-avis-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="Aperçu carte livreur"
    >
      <div className="courier-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="courier-card-modal__head">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Carte livreur</h2>
            <p className="text-sm text-zinc-500">{livreur.nom}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-avis-modal-close"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="courier-card-modal__photo-row">
          <CourierPhotoUpload
            livreurId={livreur.id}
            nom={livreur.nom}
            photoUrl={livreur.photoUrl}
            size="lg"
            onPhotoChange={onPhotoChange}
          />
          <p className="text-xs text-zinc-500">
            Ajoutez une photo du livreur — elle apparaîtra sur la carte imprimée.
            Activez « Graphiques d&apos;arrière-plan » dans la fenêtre d&apos;impression si les couleurs ne
            s&apos;affichent pas.
          </p>
        </div>

        <div className="courier-card-modal__preview">
          <CourierIdCard livreur={livreur} />
        </div>

        <div className="courier-card-modal__actions">
          <Button type="button" onClick={imprimer} className={ADMIN_BTN_PRIMARY}>
            <Printer className="h-4 w-4" />
            Imprimer cette carte
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
