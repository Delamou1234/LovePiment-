import { adminStatsService } from '@/modules/admin/services/admin-stats.service';
import { AdminDashboardLive } from '@/modules/admin/components/AdminDashboardLive';

export default async function AdminDashboardPage() {
  const stats = await adminStatsService.obtenirDashboard();
  return <AdminDashboardLive initialStats={stats} />;
}
