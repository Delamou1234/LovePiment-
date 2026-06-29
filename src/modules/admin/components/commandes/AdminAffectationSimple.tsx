'use client';

import { useMemo } from 'react';
import { MapPin, Package, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_CARD, ADMIN_CARD_PAD } from '@/modules/admin/components/admin-ui';
import { formaterDateCourte } from '@/modules/admin/lib/order-status-labels';
import type { AssignLivreurCommande } from './assign-livreur.types';

type Props = {
  commandes: AssignLivreurCommande[];
  onAssign: (commandes: AssignLivreurCommande[]) => void;
};

export function AdminAffectationSimple({ commandes, onAssign }: Props) {
  const parVille = useMemo(() => {
    const map = new Map<string, AssignLivreurCommande[]>();
    for (const cmd of commandes) {
      const ville = cmd.clientVille.trim() || 'Ville non renseignée';
      const list = map.get(ville) ?? [];
      list.push(cmd);
      map.set(ville, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [commandes]);

  if (commandes.length === 0) return null;

  return (
    <section className={`admin-livraison-card ${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <div className="admin-livraison-card-icon shrink-0" aria-hidden>
            <Package className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="admin-livraison-card-title">
              {commandes.length} commande{commandes.length > 1 ? 's' : ''} à envoyer
            </h2>
            <p className="admin-livraison-card-desc">
              Cliquez sur Envoyer pour choisir un livreur.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-olive hover:bg-olive-dark text-white"
          onClick={() => onAssign(commandes)}
        >
          <Send className="h-3.5 w-3.5 mr-1" />
          Tout envoyer
        </Button>
      </div>

      <div className="space-y-4">
        {parVille.map(([ville, cmds]) => (
          <div key={ville} className="admin-affect-simple-group">
            <div className="admin-affect-simple-group-head">
              <p className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-olive" />
                {ville}
                <span className="font-normal text-zinc-500">
                  · {cmds.length} commande{cmds.length > 1 ? 's' : ''}
                </span>
              </p>
              {cmds.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full text-xs"
                  onClick={() => onAssign(cmds)}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Envoyer ({cmds.length})
                </Button>
              )}
            </div>

            <ul className="admin-affect-simple-list">
              {cmds.map((cmd) => (
                <li key={cmd.id} className="admin-affect-simple-row">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 text-sm truncate">{cmd.clientNom}</p>
                    <p className="text-xs text-zinc-500">
                      {cmd.createdAt ? `${formaterDateCourte(cmd.createdAt)} · ` : ''}
                      {cmd.montantTotal.toLocaleString('fr-FR')} GN
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-full bg-olive hover:bg-olive-dark text-white text-xs"
                    onClick={() => onAssign([cmd])}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Envoyer
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
