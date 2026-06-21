import Link from 'next/link';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';

const LOGIN_IMAGE =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=85&auto=format&fit=crop';

type AuthSplitLayoutProps = {
  panelTitle: string;
  panelSubtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  trustPoints?: { icon: LucideIcon; label: string }[];
};

export function AuthSplitLayout({
  panelTitle,
  panelSubtitle,
  children,
  footer,
  trustPoints = [],
}: AuthSplitLayoutProps) {
  return (
    <div className="h-screen overflow-hidden lg:grid lg:grid-cols-2">
      {/* Panneau visuel — desktop uniquement */}
      <div className="relative hidden lg:block h-full">
        <Image
          src={LOGIN_IMAGE}
          alt="KabiShop"
          fill
          priority
          sizes="50vw"
          className="object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/45 to-[#4a5240]/55" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 xl:p-14">
          <Link href="/" className="font-serif text-2xl font-bold text-white tracking-tight w-fit">
            KabiShop
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55 mb-3">
              Parfums & huiles · Conakry
            </p>
            <h2 className="font-serif text-3xl xl:text-[2rem] font-bold text-white leading-tight max-w-md">
              {panelTitle}
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">{panelSubtitle}</p>
            {trustPoints.length > 0 && (
              <ul className="mt-8 space-y-2.5">
                {trustPoints.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire — plein écran, sans scroll */}
      <div className="flex h-full flex-col overflow-hidden bg-[#faf7f2]">
        <div className="shrink-0 flex items-center justify-between px-8 pt-6 lg:px-12">
          <Link
            href="/"
            className="font-serif text-xl font-bold text-zinc-900 tracking-tight lg:invisible"
          >
            KabiShop
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition ml-auto"
          >
            ← Boutique
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center px-8 sm:px-12 lg:px-14 xl:px-16 overflow-hidden">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        {footer && (
          <div className="shrink-0 px-8 pb-6 lg:px-12 text-center">{footer}</div>
        )}
      </div>
    </div>
  );
}
