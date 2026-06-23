/** Ré-exports pour compatibilité — préférer les sous-dossiers (layout/, commandes/, …). */
export { AdminShell } from './layout/AdminShell';
export { AdminSidebar, AdminMobileNav } from './layout/AdminSidebar';
export { AdminTopBar } from './layout/AdminTopBar';
export { AdminMessagerieProvider, useAdminMessagerieContext } from './layout/AdminMessagerieProvider';
export { AdminNotificationBell } from './layout/AdminNotificationBell';
export { AdminMessagesMenu } from './layout/AdminMessagesMenu';
export { AdminDashboardLive } from './dashboard/AdminDashboardLive';
export { AdminGa4Section } from './dashboard/AdminGa4Section';
export { AdminProductEditor } from './catalogue/AdminProductEditor';
export { AdminLivreursPage } from './livreurs/AdminLivreursPage';
export { AdminAssignCourier } from './commandes/AdminAssignCourier';
export { AdminBatchDelivery } from './commandes/AdminBatchDelivery';
export { AdminGeoGroupsPanel } from './commandes/AdminGeoGroupsPanel';
export { AdminTourneesMontants } from './commandes/AdminTourneesMontants';
export { AdminDeliverySharePanel } from './commandes/AdminDeliverySharePanel';
export { AdminCommandesPage } from './commandes/AdminCommandesPage';
export * from './admin-ui';
