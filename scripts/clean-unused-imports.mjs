import fs from 'fs';

const files = [
  'src/app/admin/bi/page.tsx',
  'src/app/admin/categories/page.tsx',
  'src/app/admin/parametres/page.tsx',
  'src/app/admin/trafic/page.tsx',
  'src/modules/admin/components/avis/AdminAvisPage.tsx',
  'src/modules/admin/components/clients/AdminClientsPage.tsx',
  'src/modules/admin/components/commandes/AdminAssignCourier.tsx',
  'src/modules/admin/components/commandes/AdminCommandesPage.tsx',
  'src/modules/admin/components/commandes/AdminDeliverySharePanel.tsx',
  'src/modules/admin/components/commandes/AdminGeoGroupsPanel.tsx',
  'src/modules/admin/components/commandes/AdminTourneesMontants.tsx',
  'src/modules/admin/components/contact/AdminContactPage.tsx',
  'src/modules/admin/components/dashboard/AdminGa4Section.tsx',
  'src/modules/admin/components/layout/AdminStockAlertModal.tsx',
  'src/modules/admin/components/livreurs/AdminLivreursPage.tsx',
  'src/modules/admin/components/promotions/AdminPromoCouponsSection.tsx',
  'src/modules/admin/components/promotions/AdminPromoFlashSection.tsx',
  'src/modules/admin/components/promotions/AdminPromoProductsSection.tsx',
  'src/modules/avis/components/CompteAvisSection.tsx',
  'src/modules/avis/components/ProductReviewsSection.tsx',
  'src/modules/compte/components/CompteAdressesSection.tsx',
  'src/modules/livraison/components/CourierPageContent.tsx',
  'src/modules/marketing/components/CompteFideliteSection.tsx',
  'src/modules/messagerie/components/ChatWidget.tsx',
  'src/app/(boutique)/panier/page.tsx',
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/, useEffect/g, '').replace(/useEffect, /g, '');
  if (file.includes('panier')) {
    c = c.replace(/, useState/g, '').replace(/useState, /g, '');
    c = c.replace("import React from 'react'", "import React from 'react'");
  }
  if (file.includes('ChatWidget')) {
    c = c.replace(/, useEffect/g, '').replace(/useEffect, /g, '');
  }
  fs.writeFileSync(file, c);
  console.log('cleaned', file);
}
