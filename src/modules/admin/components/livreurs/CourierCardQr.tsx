'use client';

import { useMemo } from 'react';
import QRCode from 'react-qr-code';
import { courierCardVerifyUrl } from './courier-card.utils';

type Props = {
  livreurId: string;
};

export function CourierCardQr({ livreurId }: Props) {
  const value = useMemo(() => courierCardVerifyUrl(livreurId), [livreurId]);

  return (
    <div className="courier-id-card__qr" aria-label="QR code de vérification">
      <QRCode
        value={value}
        size={56}
        level="M"
        bgColor="#ffffff"
        fgColor="#18181b"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
