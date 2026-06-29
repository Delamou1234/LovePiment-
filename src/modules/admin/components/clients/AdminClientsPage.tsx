'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useSyncedState } from '@/shared/hooks/useSyncedState';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Copy,
  Eye,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';
import { FilterSearchInput } from '@/shared/components/FilterSearchInput';
import { getShopTelHref, normaliserNumeroAppel } from '@/shared/lib/shop-contact';

type Client = {
  id: string;
  email: string;
  nom: string;
  telephone: string | null;
  viaGoogle: boolean;
  commandes: number;
  montantTotal: number;
  derniereCommande: string | null;
  inscritLe: string;
  pointsFidelite: number;
  adressePreferee: string | null;
  villePreferee: string | null;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function whatsappHref(telephone: string | null, nom: string) {
  if (!telephone?.trim()) return null;
  const num = normaliserNumeroAppel(telephone);
  if (!num) return null;
  const text = `Bonjour ${nom}, `;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function AdminClientsPage({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const filtreUrl = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useSyncedState(filtreUrl);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  const clientsFiltres = useMemo(() => {
    const q = (recherche.trim() || filtreUrl).toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.telephone?.includes(q) ?? false),
    );
  }, [clients, recherche, filtreUrl]);

  const copierEmail = async (client: Client) => {
    try {
      await navigator.clipboard.writeText(client.email);
      setCopiedId(client.id);
      window.setTimeout(() => setCopiedId((id) => (id === client.id ? null : id)), 2000);
    } catch {
      alert('Impossible de copier l\u2019e-mail.');
    }
  };

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
              <Users className="h-6 w-6" />
              Gestion des clients
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {clientsFiltres.length} client{clientsFiltres.length > 1 ? 's' : ''} — comptes inscrits
              avec historique de commandes liées.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {clientsFiltres.length} client{clientsFiltres.length > 1 ? 's' : ''} inscrit
            {clientsFiltres.length > 1 ? 's' : ''} — historique de commandes et fidélité.
          </p>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      )}

      <div className="admin-marketing-toolbar">
        <FilterSearchInput
          value={recherche}
          onChange={setRecherche}
          placeholder="Rechercher par nom, e-mail ou téléphone…"
        />
      </div>

      <div className="admin-marketing-table-card">
        {loading ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : clientsFiltres.length === 0 ? (
          <p className="admin-marketing-empty-text">
            {recherche.trim() || filtreUrl
              ? 'Aucun client ne correspond à cette recherche.'
              : 'Aucun client inscrit pour le moment.'}
          </p>
        ) : (
          <div className="admin-marketing-table-wrap">
            <table className="admin-marketing-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>E-mail</th>
                  <th>Téléphone</th>
                  <th>Commandes</th>
                  <th>Total dépensé</th>
                  <th>Inscription</th>
                  <th>Dernière commande</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clientsFiltres.map((c) => {
                  const wa = whatsappHref(c.telephone, c.nom);
                  const tel = c.telephone ? getShopTelHref(c.telephone) : null;
                  return (
                    <tr key={c.id}>
                      <td>
                        <p className="font-semibold text-zinc-900">{c.nom}</p>
                        {c.viaGoogle && (
                          <span className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            Google
                          </span>
                        )}
                      </td>
                      <td>
                        <a href={`mailto:${c.email}`} className="text-zinc-700 hover:text-olive">
                          {c.email}
                        </a>
                      </td>
                      <td className="text-zinc-600">{c.telephone ?? '—'}</td>
                      <td>
                        <span className="font-semibold text-zinc-900">{c.commandes}</span>
                      </td>
                      <td>
                        <span className="font-semibold text-zinc-900">
                          {c.montantTotal.toLocaleString('fr-FR')} GN
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-zinc-500">{formatDate(c.inscritLe)}</td>
                      <td className="whitespace-nowrap text-zinc-500">
                        {c.derniereCommande ? formatDate(c.derniereCommande) : '—'}
                      </td>
                      <td>
                        <div className="admin-avis-actions">
                          <button
                            type="button"
                            title="Voir le détail"
                            onClick={() => setDetailClient(c)}
                            className="admin-avis-action"
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <Link
                            href={`/admin/commandes?clientId=${c.id}&clientNom=${encodeURIComponent(c.nom)}`}
                            title="Voir les commandes"
                            className="admin-avis-action"
                          >
                            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                          </Link>
                          <a
                            href={`mailto:${c.email}`}
                            title="Envoyer un e-mail"
                            className="admin-avis-action"
                          >
                            <Mail className="h-4 w-4" strokeWidth={1.75} />
                          </a>
                          {tel && tel !== '#' && (
                            <a href={tel} title="Appeler" className="admin-avis-action">
                              <Phone className="h-4 w-4" strokeWidth={1.75} />
                            </a>
                          )}
                          {wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp"
                              className="admin-avis-action"
                            >
                              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                            </a>
                          )}
                          <button
                            type="button"
                            title={copiedId === c.id ? 'E-mail copié' : 'Copier l\u2019e-mail'}
                            onClick={() => void copierEmail(c)}
                            className="admin-avis-action"
                          >
                            <Copy className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailClient && (
        <div
          className="admin-avis-modal-backdrop"
          onClick={() => setDetailClient(null)}
          role="dialog"
          aria-modal
        >
          <div className="admin-avis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-avis-modal-head">
              <div>
                <h2 className="text-base font-bold text-zinc-900">{detailClient.nom}</h2>
                <p className="text-sm text-zinc-500">
                  Client depuis le {formatDate(detailClient.inscritLe)}
                  {detailClient.viaGoogle ? ' · Connexion Google' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailClient(null)}
                className="admin-avis-modal-close"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-avis-modal-body space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">E-mail</p>
                  <a href={`mailto:${detailClient.email}`} className="font-medium text-olive">
                    {detailClient.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Téléphone</p>
                  <p className="font-medium text-zinc-800">{detailClient.telephone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Commandes</p>
                  <p className="font-medium text-zinc-800">{detailClient.commandes}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Total dépensé
                  </p>
                  <p className="font-medium text-zinc-800">
                    {detailClient.montantTotal.toLocaleString('fr-FR')} GN
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Points fidélité
                  </p>
                  <p className="font-medium text-zinc-800">{detailClient.pointsFidelite}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Dernière commande
                  </p>
                  <p className="font-medium text-zinc-800">
                    {detailClient.derniereCommande
                      ? formatDate(detailClient.derniereCommande)
                      : '—'}
                  </p>
                </div>
              </div>
              {(detailClient.adressePreferee || detailClient.villePreferee) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Adresse</p>
                  <p className="font-medium text-zinc-800">
                    {[detailClient.adressePreferee, detailClient.villePreferee]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              )}
            </div>
            <div className="admin-avis-modal-actions">
              <Link
                href={`/admin/commandes?clientId=${detailClient.id}&clientNom=${encodeURIComponent(detailClient.nom)}`}
                onClick={() => setDetailClient(null)}
                className={ADMIN_BTN_PRIMARY}
              >
                <ShoppingBag className="h-4 w-4" />
                Voir les commandes
              </Link>
              <a href={`mailto:${detailClient.email}`} className="admin-avis-modal-btn">
                <Mail className="h-4 w-4" />
                E-mail
              </a>
              {whatsappHref(detailClient.telephone, detailClient.nom) && (
                <a
                  href={whatsappHref(detailClient.telephone, detailClient.nom)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-avis-modal-btn"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
