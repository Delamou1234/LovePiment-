'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Shield, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';

export type AdminUserRow = {
  id: string;
  email: string;
  nom: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  currentAdminId: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function AdminAdminsPanel({ currentAdminId }: Props) {
  const [admins, setAdmins] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [form, setForm] = useState({ nom: '', email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/utilisateurs/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const creer = async () => {
    if (!form.nom.trim() || !form.email.trim() || form.password.length < 6) {
      alert('Nom, e-mail et mot de passe (6 car. min.) requis.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/utilisateurs/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowCreate(false);
        setForm({ nom: '', email: '', password: '' });
        await load();
        return;
      }
      alert((data as { message?: string }).message ?? 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/utilisateurs/admins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await load();
        return true;
      }
      alert((data as { message?: string }).message ?? 'Mise à jour impossible.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget || newPassword.length < 6) {
      alert('Mot de passe de 6 caractères minimum.');
      return;
    }
    const ok = await patch(resetTarget.id, { password: newPassword });
    if (ok) {
      setResetTarget(null);
      setNewPassword('');
      alert(`Mot de passe mis à jour pour ${resetTarget.email}.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Comptes avec accès au back-office — création et activation.
        </p>
        <Button type="button" onClick={() => setShowCreate(true)} className={ADMIN_BTN_PRIMARY}>
          <UserPlus className="h-4 w-4" />
          Nouvel admin
        </Button>
      </div>

      <div className="admin-marketing-table-card">
        {loading ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : admins.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucun administrateur.</p>
        ) : (
          <div className="admin-marketing-table-wrap">
            <table className="admin-marketing-table">
              <thead>
                <tr>
                  <th>Administrateur</th>
                  <th>E-mail</th>
                  <th>Créé le</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const isSelf = a.id === currentAdminId;
                  return (
                    <tr key={a.id}>
                      <td>
                        <p className="font-semibold text-zinc-900">{a.nom}</p>
                        {isSelf && (
                          <span className="mt-1 inline-flex rounded-full bg-olive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-olive">
                            Vous
                          </span>
                        )}
                      </td>
                      <td className="text-zinc-700">{a.email}</td>
                      <td className="whitespace-nowrap text-zinc-500">{formatDate(a.createdAt)}</td>
                      <td>
                        <span
                          className={`admin-marketing-badge ${a.actif ? 'is-active' : 'is-inactive'}`}
                        >
                          {a.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-avis-actions justify-end">
                          <button
                            type="button"
                            title="Réinitialiser le mot de passe"
                            onClick={() => {
                              setResetTarget(a);
                              setNewPassword('');
                            }}
                            className="admin-avis-action"
                          >
                            <KeyRound className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          {!isSelf && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              disabled={saving}
                              onClick={() => void patch(a.id, { actif: !a.actif })}
                            >
                              {a.actif ? 'Désactiver' : 'Activer'}
                            </Button>
                          )}
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

      {showCreate && (
        <div
          className="admin-courier-modal-backdrop"
          onClick={() => !saving && setShowCreate(false)}
          role="dialog"
          aria-modal
        >
          <div className="admin-avis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-avis-modal-head">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-olive" />
                <h2 className="text-base font-bold text-zinc-900">Nouvel administrateur</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="admin-avis-modal-close"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-avis-modal-body space-y-3">
              <div>
                <label className="admin-courier-label" htmlFor="admin-nom">
                  Nom complet
                </label>
                <input
                  id="admin-nom"
                  className="admin-courier-input mt-1"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
              <div>
                <label className="admin-courier-label" htmlFor="admin-email">
                  E-mail
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className="admin-courier-input mt-1"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="admin-courier-label" htmlFor="admin-password">
                  Mot de passe
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="admin-courier-input mt-1"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
            <div className="admin-avis-modal-actions">
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={() => void creer()} disabled={saving} className={ADMIN_BTN_PRIMARY}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div
          className="admin-courier-modal-backdrop"
          onClick={() => !saving && setResetTarget(null)}
          role="dialog"
          aria-modal
        >
          <div className="admin-avis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-avis-modal-head">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Nouveau mot de passe</h2>
                <p className="text-sm text-zinc-500">{resetTarget.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="admin-avis-modal-close"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-avis-modal-body">
              <label className="admin-courier-label" htmlFor="admin-new-pw">
                Mot de passe
              </label>
              <input
                id="admin-new-pw"
                type="password"
                className="admin-courier-input mt-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="admin-avis-modal-actions">
              <Button variant="outline" onClick={() => setResetTarget(null)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={() => void resetPassword()} disabled={saving} className={ADMIN_BTN_PRIMARY}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
