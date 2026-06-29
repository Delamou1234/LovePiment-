export type AdminSatisfactionNotification = {
  kind: 'satisfaction';
  id: string;
  message: string;
  date: string;
  orderId: string;
  clientNom: string;
  clientVille: string;
  satisfaction: 'SATISFAIT' | 'NON_SATISFAIT' | null;
  commentaire: string | null;
  suiviToken: string;
};

export type AdminLivreurNotification = {
  kind: 'livreur';
  id: string;
  message: string;
  date: string;
  orderId: string;
  clientNom: string;
  clientVille: string;
  livreurNom: string;
  livreurId: string | null;
};

export type AdminNotification = AdminSatisfactionNotification | AdminLivreurNotification;
