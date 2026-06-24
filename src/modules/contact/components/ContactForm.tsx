'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTACT_SUJETS } from '@/modules/contact/types';
import {
  getShopPhoneDisplay,
  getShopTelHref,
  getShopWhatsAppHref,
  SHOP_EMAIL,
} from '@/shared/lib/shop-contact';

const contactSchema = z.object({
  nom: z.string().min(2, 'Indiquez votre nom'),
  email: z.string().email('Adresse e-mail invalide'),
  telephone: z.string().max(30).optional(),
  sujet: z.enum(['GENERAL', 'COMMANDE', 'PRODUIT', 'PARTENARIAT', 'AUTRE']),
  message: z.string().min(10, 'Minimum 10 caractères').max(5000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const inputClass =
  'w-full rounded-xl border border-[#F2D4DC] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#9B1B2E] focus:ring-2 focus:ring-[#9B1B2E]/10';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { sujet: 'GENERAL' },
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.user;
        if (!user || user.role !== 'customer') return;
        reset({
          nom: user.name ?? '',
          email: user.email ?? '',
          telephone: user.telephone ?? '',
          sujet: 'GENERAL',
          message: '',
        });
      })
      .catch(() => {});
  }, [reset]);

  const onSubmit = async (values: ContactFormValues) => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Envoi impossible.');
        return;
      }
      setSent(true);
      reset({ nom: '', email: '', telephone: '', sujet: 'GENERAL', message: '' });
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold text-zinc-900">Message envoyé</h2>
        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
          Merci ! Notre équipe vous répondra sous 24 h ouvrées par e-mail ou WhatsApp.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setSent(false)}
        >
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Nom *</label>
          <input {...register('nom')} className={inputClass} placeholder="Votre nom" />
          {errors.nom && <p className="mt-1 text-xs text-red-600">{errors.nom.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">E-mail *</label>
          <input
            type="email"
            {...register('email')}
            className={inputClass}
            placeholder="vous@exemple.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Téléphone</label>
          <input {...register('telephone')} className={inputClass} placeholder="+224 629 40 30 19" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Sujet *</label>
          <select {...register('sujet')} className={inputClass}>
            {CONTACT_SUJETS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Message *</label>
        <textarea
          {...register('message')}
          rows={6}
          className={`${inputClass} resize-y min-h-[140px]`}
          placeholder="Décrivez votre demande…"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
        )}
      </div>

      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-[#9B1B2E] hover:bg-[#6E1020] text-white px-8"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Envoyer le message
      </Button>
    </form>
  );
}

export function ContactInfoPanel() {
  const waHref = getShopWhatsAppHref("Bonjour Love Piment&, j'ai une question.");
  const telHref = getShopTelHref();
  const phoneDisplay = getShopPhoneDisplay();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Nous contacter</h2>
        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
          Une question sur une commande, un produit ou une livraison ? Écrivez-nous ou
          contactez-nous directement sur WhatsApp.
        </p>
      </div>

      <ul className="space-y-4">
        <li className="flex gap-3">
          <MapPin className="h-5 w-5 shrink-0 text-[#9B1B2E]" />
          <div>
            <p className="text-sm font-medium text-zinc-900">Adresse</p>
            <p className="text-sm text-zinc-600">Conakry, Guinée</p>
          </div>
        </li>
        <li className="flex gap-3">
          <Mail className="h-5 w-5 shrink-0 text-[#9B1B2E]" />
          <div>
            <p className="text-sm font-medium text-zinc-900">E-mail</p>
            <a
              href={`mailto:${SHOP_EMAIL}`}
              className="text-sm text-[#9B1B2E] hover:underline break-all"
            >
              {SHOP_EMAIL}
            </a>
          </div>
        </li>
        <li className="flex gap-3">
          <Phone className="h-5 w-5 shrink-0 text-[#9B1B2E]" />
          <div>
            <p className="text-sm font-medium text-zinc-900">Téléphone / WhatsApp</p>
            <a
              href={telHref}
              className="text-sm text-[#9B1B2E] hover:underline font-medium"
            >
              {phoneDisplay}
            </a>
            <div className="mt-2 flex flex-wrap gap-3">
              <a
                href={telHref}
                className="text-sm text-[#9B1B2E] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <Phone className="h-3.5 w-3.5" />
                Appeler
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#9B1B2E] hover:underline inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        </li>
      </ul>

      <div className="rounded-xl bg-[#FFF8F6] border border-[#F2D4DC] p-5 text-sm text-zinc-600">
        <p className="font-medium text-zinc-900 mb-1">Horaires de réponse</p>
        <p>Lun – Sam : 9h – 19h (GMT)</p>
        <p className="mt-3">
          Besoin d&apos;une réponse immédiate ?{' '}
          <Link href="/messages" className="text-[#9B1B2E] font-medium hover:underline">
            Messagerie instantanée
          </Link>
        </p>
      </div>
    </div>
  );
}
