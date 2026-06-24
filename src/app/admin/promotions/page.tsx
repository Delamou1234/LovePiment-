import { Suspense } from 'react';
import { AdminPromotionsPage } from '@/modules/admin/components/promotions/AdminPromotionsPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminPromotionsPage />
    </Suspense>
  );
}
