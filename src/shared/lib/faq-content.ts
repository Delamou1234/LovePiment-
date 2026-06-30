export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: 'commande' | 'livraison' | 'paiement' | 'compte' | 'produits';
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'delai',
    category: 'livraison',
    question: 'Quels sont les délais de livraison ?',
    answer:
      'À Conakry, comptez en général 24 à 48 h après confirmation de votre commande. Pour Coyah, Kindia et environs, le délai peut aller jusqu’à 72 h selon la disponibilité de nos livreurs.',
  },
  {
    id: 'zones',
    category: 'livraison',
    question: 'Livrez-vous partout à Conakry ?',
    answer:
      'Oui, nous livrons dans toutes les communes de Conakry (Kaloum, Dixinn, Matam, Ratoma, Matoto) ainsi qu’à Coyah et Kindia. Indiquez votre commune, quartier et un repère précis pour faciliter la livraison.',
  },
  {
    id: 'frais',
    category: 'livraison',
    question: 'Combien coûte la livraison ?',
    answer:
      'Les frais dépendent de votre commune. Ils sont affichés clairement avant validation du paiement. La livraison peut être offerte à partir d’un certain montant de commande à Conakry — le seuil est indiqué sur le panier et au checkout.',
  },
  {
    id: 'mobile-money',
    category: 'paiement',
    question: 'Comment payer ma commande ?',
    answer:
      'Le paiement se fait uniquement via Orange Money, directement sur le compte marchand Love Piment&. Après validation du panier, vous êtes redirigé vers Orange Money et confirmez avec un code OTP envoyé sur votre téléphone.',
  },
  {
    id: 'suivi',
    category: 'commande',
    question: 'Comment suivre ma commande ?',
    answer:
      'Après votre commande, vous recevez un lien de suivi par SMS ou WhatsApp. Vous pouvez aussi le retrouver dans Mon compte → Mes commandes. Chaque étape (préparation, expédition, livraison) y est affichée.',
  },
  {
    id: 'modifier',
    category: 'commande',
    question: 'Puis-je modifier ou annuler ma commande ?',
    answer:
      'Contactez-nous rapidement par WhatsApp ou téléphone si vous devez corriger l’adresse ou annuler. Une fois la commande en préparation ou expédiée, la modification peut ne plus être possible.',
  },
  {
    id: 'bienvenue',
    category: 'compte',
    question: 'Y a-t-il une offre pour les nouveaux clients ?',
    answer:
      'Oui ! Quand l’offre est activée par la boutique, la remise de bienvenue s’applique automatiquement sur votre première commande (montant minimum selon les conditions du coupon). Vous gagnez aussi des points fidélité à chaque achat.',
  },
  {
    id: 'parrainage',
    category: 'compte',
    question: 'Comment fonctionne le parrainage ?',
    answer:
      'Chaque client dispose d’un code personnel dans Mon compte → Fidélité. Partagez-le : votre filleul bénéficie de −5 % sur sa première commande et vous gagnez des points après sa première commande validée.',
  },
  {
    id: 'discretion',
    category: 'produits',
    question: 'La livraison est-elle discrète ?',
    answer:
      'Oui. Nos colis sont neutres, sans mention du contenu. Seul votre nom et votre adresse apparaissent sur l’étiquette de livraison.',
  },
  {
    id: 'contact',
    category: 'commande',
    question: 'Comment vous contacter en cas de problème ?',
    answer:
      'Utilisez le bouton WhatsApp ou le numéro affiché sur le site. Indiquez votre numéro de commande pour une prise en charge plus rapide. Notre équipe répond du lundi au samedi.',
  },
];

export const FAQ_CATEGORIES: { id: FaqItem['category']; label: string }[] = [
  { id: 'commande', label: 'Commande' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'compte', label: 'Compte & fidélité' },
  { id: 'produits', label: 'Produits' },
];
