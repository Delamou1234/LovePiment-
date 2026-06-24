'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
} from 'lucide-react';
import { normaliserNumeroAppel } from '@/shared/lib/shop-contact';
import type { ContactMessageResume, ContactStatusKey } from '@/modules/contact/types';

const STATUT_LABELS: Record<ContactStatusKey, string> = {
  NOUVEAU: 'Nouveau',
  LU: 'Lu',
  TRAITE: 'Traité',
};

type FiltreStatut = '' | ContactStatusKey;

const FILTRES: { id: FiltreStatut; label: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'NOUVEAU', label: 'Nouveaux' },
  { id: 'LU', label: 'Lus' },
  { id: 'TRAITE', label: 'Traités' },
];

function initiales(nom: string) {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function whatsappHref(telephone: string | null, nom: string, sujet: string) {
  if (!telephone?.trim()) return null;
  const num = normaliserNumeroAppel(telephone);
  if (!num) return null;
  const text = `Bonjour ${nom}, concernant votre message « ${sujet} » — `;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessageResume[]>([]);
  const [nonLus, setNonLus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<FiltreStatut>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contact');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setNonLus(data.nonLus ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  const stats = useMemo(
    () => ({
      total: messages.length,
      nouveaux: messages.filter((m) => m.statut === 'NOUVEAU').length,
      lus: messages.filter((m) => m.statut === 'LU').length,
      traites: messages.filter((m) => m.statut === 'TRAITE').length,
    }),
    [messages],
  );

  const messagesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return messages.filter((m) => {
      if (filtre && m.statut !== filtre) return false;
      if (!q) return true;
      return (
        m.nom.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.sujetLabel.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        (m.telephone?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [messages, filtre, recherche]);

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const updateStatut = async (id: string, statut: ContactStatusKey) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) await load();
    } finally {
      setUpdating(false);
    }
  };

  const openMessage = (id: string) => {
    setSelectedId(id);
    const msg = messages.find((m) => m.id === id);
    if (msg?.statut === 'NOUVEAU') {
      void updateStatut(id, 'LU');
    }
  };

  return (
    <div className="admin-marketing-page admin-contact-page">
      <header className="admin-marketing-header">
        <div>
          <h1 className="admin-marketing-title">
            <Mail className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.75} />
            Messages de contact
            {nonLus > 0 && <span className="admin-contact-badge">{nonLus}</span>}
          </h1>
          <p className="admin-marketing-subtitle">
            Formulaire public — réponses par e-mail ou WhatsApp.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="admin-marketing-refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </header>

      <div className="admin-marketing-stats">
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{stats.total}</span>
          <span className="admin-marketing-stat-label">Messages</span>
        </div>
        <div className="admin-marketing-stat is-pending">
          <span className="admin-marketing-stat-value">{stats.nouveaux}</span>
          <span className="admin-marketing-stat-label">Nouveaux</span>
        </div>
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{stats.lus}</span>
          <span className="admin-marketing-stat-label">Lus</span>
        </div>
        <div className="admin-marketing-stat is-approved">
          <span className="admin-marketing-stat-value">{stats.traites}</span>
          <span className="admin-marketing-stat-label">Traités</span>
        </div>
      </div>

      <div className="admin-marketing-toolbar">
        <div className="admin-marketing-search-wrap">
          <Search className="admin-marketing-search-icon" strokeWidth={1.75} />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un message…"
            className="admin-marketing-search"
          />
        </div>
        <div className="admin-marketing-filters">
          {FILTRES.map(({ id, label }) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setFiltre(id)}
              className={`admin-marketing-filter ${filtre === id ? 'is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-contact-empty-state">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
        </div>
      ) : messages.length === 0 ? (
        <div className="admin-contact-empty-state is-card">
          <Inbox className="h-10 w-10 text-zinc-300" strokeWidth={1.5} />
          <p className="admin-contact-empty-title">Aucun message pour le moment</p>
          <p className="admin-contact-empty-text">
            Les demandes envoyées via le formulaire contact apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="admin-contact-split">
          <aside className="admin-contact-list-card">
            <div className="admin-contact-list-head">
              <span>{messagesFiltres.length} message{messagesFiltres.length > 1 ? 's' : ''}</span>
            </div>
            {messagesFiltres.length === 0 ? (
              <p className="admin-contact-list-empty">Aucun résultat pour cette recherche.</p>
            ) : (
              <ul className="admin-contact-list">
                {messagesFiltres.map((m) => {
                  const isActive = selectedId === m.id;
                  const isNew = m.statut === 'NOUVEAU';
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => openMessage(m.id)}
                        className={`admin-contact-item ${isActive ? 'is-active' : ''} ${isNew ? 'is-new' : ''}`}
                      >
                        <div className="admin-contact-avatar" aria-hidden>
                          {initiales(m.nom)}
                        </div>
                        <div className="admin-contact-item-body">
                          <div className="admin-contact-item-top">
                            <p className="admin-contact-item-name">{m.nom}</p>
                            {isNew && <span className="admin-contact-dot" title="Non lu" />}
                          </div>
                          <p className="admin-contact-item-subject">{m.sujetLabel}</p>
                          <p className="admin-contact-item-preview">{m.message}</p>
                          <div className="admin-contact-item-meta">
                            <Clock className="h-3 w-3" strokeWidth={2} />
                            <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time>
                            <span
                              className={`admin-contact-status is-${m.statut.toLowerCase()}`}
                            >
                              {STATUT_LABELS[m.statut]}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="admin-contact-detail-card">
            {!selected ? (
              <div className="admin-contact-detail-empty">
                <MessageSquare className="h-11 w-11 text-zinc-200" strokeWidth={1.25} />
                <p>Sélectionnez un message pour le lire.</p>
              </div>
            ) : (
              <div className="admin-contact-detail">
                <div className="admin-contact-detail-head">
                  <div className="admin-contact-detail-identity">
                    <div className="admin-contact-avatar is-lg" aria-hidden>
                      {initiales(selected.nom)}
                    </div>
                    <div>
                      <h2>{selected.nom}</h2>
                      <a href={`mailto:${selected.email}`} className="admin-contact-email">
                        {selected.email}
                      </a>
                      {selected.telephone && (
                        <a
                          href={`tel:+${normaliserNumeroAppel(selected.telephone)}`}
                          className="admin-contact-phone"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {selected.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`admin-contact-status-pill is-${selected.statut.toLowerCase()}`}>
                    {STATUT_LABELS[selected.statut]}
                  </span>
                </div>

                <div className="admin-contact-detail-meta">
                  <div>
                    <span className="admin-contact-label">Sujet</span>
                    <p>{selected.sujetLabel}</p>
                  </div>
                  <div>
                    <span className="admin-contact-label">Reçu le</span>
                    <p>{formatDateLong(selected.createdAt)}</p>
                  </div>
                </div>

                <div className="admin-contact-message-block">
                  <span className="admin-contact-label">Message</span>
                  <div className="admin-contact-message-bubble">{selected.message}</div>
                </div>

                <div className="admin-contact-actions">
                  {selected.statut !== 'TRAITE' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateStatut(selected.id, 'TRAITE')}
                      className="admin-contact-btn is-primary"
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Marquer traité
                    </button>
                  )}
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.sujetLabel}`)}`}
                    className="admin-contact-btn"
                  >
                    <Mail className="h-4 w-4" />
                    Répondre par e-mail
                  </a>
                  {whatsappHref(selected.telephone, selected.nom, selected.sujetLabel) && (
                    <a
                      href={whatsappHref(selected.telephone, selected.nom, selected.sujetLabel)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-contact-btn is-whatsapp"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
