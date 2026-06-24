'use client';

import Link from 'next/link';
import { genererMessageGeneral } from '@/modules/messagerie/providers/whatsapp.provider';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  message?: string;
  numero?: string;
  className?: string;
}

/**
 * Bouton WhatsApp flottant — visible sur tout le site.
 * Se positionne en bas à droite avec animation pulse.
 */
export function WhatsAppFloatingButton({
  message,
  numero,
  className,
}: WhatsAppButtonProps) {
  const whatsappNumber = numero ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000';
  const msg = message ?? genererMessageGeneral();
  const numNettoyé = whatsappNumber.replace(/[\s+\-()]/g, '');
  const href = `https://wa.me/${numNettoyé}?text=${encodeURIComponent(msg)}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Love Piment& sur WhatsApp"
      className={`whatsapp-float ${className ?? ''}`}
      id="whatsapp-floating-btn"
    >
      <MessageCircle size={28} color="white" fill="white" />
    </Link>
  );
}
