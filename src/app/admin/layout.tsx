import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  BarChart3,
  Settings,
  MessageSquare,
  Users,
  Tag,
  Megaphone,
  FolderTree,
  Boxes,
  Mail,
  LineChart,
} from 'lucide-react';
import { AdminNotificationBell } from '@/modules/admin/components/AdminNotificationBell';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/produits', label: 'Produits', icon: Package },
  { href: '/admin/categories', label: 'Catégories', icon: FolderTree },
  { href: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/promotions', label: 'Promotions', icon: Tag },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/avis', label: 'Avis clients', icon: MessageSquare },
  { href: '/admin/stocks', label: 'Stocks', icon: Boxes },
  { href: '/admin/messagerie', label: 'Messagerie', icon: MessageSquare },
  { href: '/admin/contact', label: 'Contact', icon: Mail },
  { href: '/admin/bi', label: 'Business Intelligence', icon: LineChart },
  { href: '/admin/trafic', label: 'Rapports trafic', icon: BarChart3 },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-[#3d4534] bg-[#4a5240]">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="font-serif text-xl font-bold text-white">
            KabiShop
          </Link>
          <p className="text-xs text-white/50 mt-1">Back-office</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition"
          >
            <Store className="h-3.5 w-3.5" />
            Voir la boutique
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#ebe4d8] bg-white/80 backdrop-blur-sm px-4 md:px-8">
          <div className="md:hidden">
            <Link href="/admin" className="font-serif text-lg font-bold text-zinc-900">
              KabiShop Admin
            </Link>
          </div>
          <div className="hidden md:block text-sm text-zinc-500">
            Back-office KabiShop
          </div>
          <div className="flex items-center gap-4">
            <AdminNotificationBell />
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
            >
              Boutique
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
