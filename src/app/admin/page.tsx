import { dashboardOverviewService } from '@/modules/admin/services/dashboard-overview.service';
import { AdminDashboardLive } from '@/modules/admin/components/dashboard/AdminDashboardLive';

export default async function AdminDashboardPage() {
  const initialOverview = await dashboardOverviewService.obtenir('7j');
  return <AdminDashboardLive initialOverview={initialOverview} />;
}
