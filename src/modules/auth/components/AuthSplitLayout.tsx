import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/shared/ui/BrandLogo';

const LOGIN_IMAGE_DEFAULT = '/images/love-piment-secret.png';
const LOGIN_IMAGE_CONNEXION = '/images/auth-connexion-panel.png';

type AuthSplitLayoutProps = {
  panelTitle: string;
  panelSubtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  trustPoints?: { icon: LucideIcon; label: string; desc?: string }[];
  variant?: 'default' | 'connexion';
  panelAccent?: string;
  compactForm?: boolean;
};

export function AuthSplitLayout({
  panelTitle,
  panelSubtitle,
  children,
  footer,
  trustPoints = [],
  variant = 'default',
  panelAccent,
  compactForm = false,
}: AuthSplitLayoutProps) {
  const isConnexion = variant === 'connexion';
  const loginImage = isConnexion ? LOGIN_IMAGE_CONNEXION : LOGIN_IMAGE_DEFAULT;

  return (
    <div className={`min-h-dvh lg:grid lg:h-dvh lg:grid-cols-2 lg:overflow-hidden ${isConnexion ? 'auth-connexion' : ''}`}>
      {/* Panneau visuel — desktop uniquement */}
      <div className="relative hidden lg:block h-full overflow-hidden">
        {isConnexion ? (
          <>
            <Image
              src={loginImage}
              alt=""
              fill
              priority
              sizes="50vw"
              className="auth-connexion-panel-photo"
            />
            <div className="auth-connexion-panel-overlay" aria-hidden />
          </>
        ) : (
          <>
            <Image
              src={loginImage}
              alt="Love Piment&"
              fill
              priority
              sizes="50vw"
              className="object-cover object-[center_40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/45 to-primary/55" />
          </>
        )}
        <div className="absolute inset-0 z-[2] flex flex-col justify-between p-12 xl:p-14">
          <BrandLogo href="/" size="sm" className="auth-brand-logo" />
          <div className={isConnexion ? 'relative z-10 max-w-md pb-4' : ''}>
            {!isConnexion && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55 mb-3">
                Boutique intime · Conakry
              </p>
            )}
            <h2 className="font-serif text-3xl xl:text-[2.35rem] font-bold text-white leading-tight max-w-md">
              {panelTitle}
              {panelAccent && (
                <>
                  {' '}
                  <span className="auth-connexion-accent">{panelAccent}</span>
                  <Heart className="auth-connexion-accent-heart inline-block h-5 w-5 text-[#f472b6] fill-[#f472b6]/20 ml-1 -mt-1" strokeWidth={1.5} />
                </>
              )}
            </h2>
            <p className={`mt-3 text-sm max-w-sm leading-relaxed ${isConnexion ? 'text-white/80' : 'text-white/70'}`}>
              {panelSubtitle}
            </p>
            {trustPoints.length > 0 && (
              <ul className={`mt-8 space-y-4 ${isConnexion ? 'auth-connexion-trust' : 'space-y-2.5'}`}>
                {trustPoints.map(({ icon: Icon, label, desc }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span
                      className={
                        isConnexion
                          ? 'auth-connexion-trust-icon'
                          : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15'
                      }
                    >
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className={`text-sm font-semibold ${isConnexion ? 'text-white' : 'text-white/90'}`}>
                        {label}
                      </p>
                      {desc && (
                        <p className="mt-0.5 text-xs leading-snug text-white/65">{desc}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div
        className={`flex min-h-dvh flex-col lg:h-full lg:overflow-hidden ${isConnexion ? 'auth-connexion-form-shell' : 'bg-cream'}${compactForm ? ' auth-connexion-form-shell--compact' : ''}`}
      >
        <div className={`shrink-0 flex items-center justify-between px-8 lg:px-12 ${compactForm ? 'pt-4' : 'pt-6'}`}>
          <BrandLogo href="/" size="sm" variant="dark" className="lg:invisible auth-brand-logo" />
          <Link
            href="/"
            className={`text-xs font-medium transition ml-auto ${isConnexion ? 'text-zinc-400 hover:text-[#e91e8c]' : 'text-zinc-400 hover:text-zinc-700'}`}
          >
            ← Boutique
          </Link>
        </div>

        <main
          className={`flex flex-1 items-center justify-center px-6 sm:px-10 lg:px-12 xl:px-14 ${compactForm ? 'overflow-y-auto py-4' : 'overflow-y-auto py-6'}`}
        >
          <div className={`w-full ${isConnexion ? (compactForm ? 'max-w-[480px]' : 'max-w-[420px]') : 'max-w-[400px]'}`}>
            {children}
          </div>
        </main>

        {footer && (
          <div className={`shrink-0 px-6 pb-6 lg:px-10 ${isConnexion ? 'auth-connexion-footer' : 'text-center'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
