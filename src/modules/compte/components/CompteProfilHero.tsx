'use client';

import Link from 'next/link';
import { Calendar, Mail, Sparkles } from 'lucide-react';
import { CompteAvatar } from './CompteAvatar';
import { CompteAvatarUpload } from './CompteAvatarUpload';
import { formaterPrixGN } from '@/shared/lib/shipping';
import type { CustomerProfile } from '@/modules/compte/types';
import { prenomClient } from './compte-ui';

type Props = {
  profil: CustomerProfile;
  onProfilUpdate: (p: CustomerProfile) => void;
};

function formatInscription(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function OAuthBadges({ profil }: { profil: CustomerProfile }) {
  const providers: string[] = [];
  if (profil.viaGoogle) providers.push('Google');
  if (profil.viaFacebook) providers.push('Facebook');
  if (profil.viaApple) providers.push('Apple');
  if (providers.length === 0) return null;

  return (
    <p className="compte-profil-oauth">
      Connexion via {providers.join(' · ')}
    </p>
  );
}

export function CompteProfilHero({ profil, onProfilUpdate }: Props) {
  const prenom = prenomClient(profil.nom);

  return (
    <section className="compte-profil-hero">
      <div className="compte-profil-hero-glow" aria-hidden />

      <div className="compte-profil-hero-main">
        <div className="compte-profil-hero-avatar">
          <div className="compte-profil-hero-avatar-ring">
            <CompteAvatar profil={profil} size="xl" />
          </div>
          <div className="compte-profil-hero-upload">
            <CompteAvatarUpload
              profil={profil}
              onProfilUpdate={onProfilUpdate}
              size="md"
              variant="compact"
            />
          </div>
        </div>

        <div className="compte-profil-hero-copy">
          <p className="compte-profil-hero-kicker">Mon profil</p>
          <h1 className="compte-profil-hero-name">{profil.nom}</h1>
          <p className="compte-profil-hero-greeting">
            Bonjour {prenom}, gérez vos informations et la sécurité de votre compte.
          </p>

          <div className="compte-profil-hero-meta">
            <span className="compte-profil-meta-pill">
              <Mail className="h-3.5 w-3.5" />
              {profil.email}
            </span>
            {profil.inscritLe ? (
              <span className="compte-profil-meta-pill">
                <Calendar className="h-3.5 w-3.5" />
                Membre depuis {formatInscription(profil.inscritLe)}
              </span>
            ) : null}
          </div>

          <OAuthBadges profil={profil} />
        </div>
      </div>

      <ul className="compte-profil-stats">
        <li className="compte-profil-stat">
          <span className="compte-profil-stat-value">{profil.stats.commandes}</span>
          <span className="compte-profil-stat-label">Commandes</span>
        </li>
        <li className="compte-profil-stat">
          <span className="compte-profil-stat-value">
            {formaterPrixGN(profil.stats.totalDepense)}
          </span>
          <span className="compte-profil-stat-label">Total dépensé</span>
        </li>
        <li className="compte-profil-stat">
          <span className="compte-profil-stat-value">{profil.pointsFidelite}</span>
          <span className="compte-profil-stat-label">Points fidélité</span>
        </li>
      </ul>

      <div className="compte-profil-quicklinks">
        <Link href="/compte?section=adresses" className="compte-profil-quicklink">
          Mes adresses
        </Link>
        <Link href="/profil-beaute" className="compte-profil-quicklink">
          <Sparkles className="h-3.5 w-3.5" />
          Profil beauté
        </Link>
        <Link href="/compte?section=fidelite" className="compte-profil-quicklink">
          Mes offres & bons
        </Link>
      </div>
    </section>
  );
}
