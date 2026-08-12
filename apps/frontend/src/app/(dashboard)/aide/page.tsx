'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Layers, Users, Activity, KeyRound, Infinity as InfinityIcon } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

export default function AidePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useI18n();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  const fr = language === 'fr';

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <HelpCircle size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">{fr ? 'Centre d\'aide' : 'Help center'}</h1>
        </div>

        {/* --- PLANS --- */}
        <Section icon={Layers} title={fr ? 'Les plans (Starter / Pro / Enterprise)' : 'Plans (Starter / Pro / Enterprise)'}>
          <p>
            {fr
              ? 'Un plan détermine les fonctionnalités et le nombre de personnes qui peuvent utiliser votre compte en même temps. Plus le plan est élevé, plus vous avez de sièges et de fonctionnalités disponibles.'
              : 'A plan determines which features are available and how many people can use your account at once. Higher plans include more seats and more features.'}
          </p>
          <ul className="mt-2 space-y-1.5 list-disc pl-5">
            <li><strong>Starter</strong> — {fr ? '3 sièges. Fonctions de base : produits, stock, clients.' : '3 seats. Core features: products, stock, customers.'}</li>
            <li><strong>Pro</strong> — {fr ? '10 sièges. Ajoute la synchronisation Google Sheets/Excel et les rapports avancés.' : '10 seats. Adds Google Sheets/Excel sync and advanced reports.'}</li>
            <li><strong>Enterprise</strong> — {fr ? '50 sièges. Ajoute la connexion unique (SSO) et l\'export du journal d\'audit.' : '50 seats. Adds single sign-on (SSO) and audit log export.'}</li>
          </ul>
        </Section>

        {/* --- SIÈGES --- */}
        <Section icon={Users} title={fr ? 'Les sièges' : 'Seats'}>
          <p>
            {fr
              ? 'Un "siège" correspond à une personne pouvant se connecter à votre compte (vous, vos employés). Le chiffre affiché (ex: "2/3 sièges utilisés") montre combien de comptes utilisateurs sont déjà créés par rapport à la limite de votre plan. Une fois la limite atteinte, il faut mettre à niveau votre plan pour ajouter de nouvelles personnes.'
              : 'A "seat" is one person who can log into your account (you, your employees). The number shown (e.g. "2/3 seats used") shows how many user accounts already exist compared to your plan\'s limit. Once the limit is reached, you need to upgrade your plan to add more people.'}
          </p>
        </Section>

        {/* --- STATUT --- */}
        <Section icon={Activity} title={fr ? 'Le statut de votre abonnement' : 'Your subscription status'}>
          <ul className="space-y-2">
            <li><strong>{fr ? 'Essai en cours' : 'Trial in progress'}</strong> — {fr ? 'Période de découverte gratuite (14 jours), sans engagement.' : 'Free 14-day trial period, no commitment.'}</li>
            <li><strong>{fr ? 'Actif' : 'Active'}</strong> — {fr ? 'Votre abonnement est payé et à jour. Tout fonctionne normalement.' : 'Your subscription is paid and up to date. Everything works normally.'}</li>
            <li><strong>{fr ? 'Paiement en retard' : 'Payment overdue'}</strong> — {fr ? 'Un renouvellement est attendu. Contactez le support pour régulariser.' : 'A renewal is due. Contact support to sort it out.'}</li>
            <li><strong>{fr ? 'Suspendu' : 'Suspended'}</strong> — {fr ? 'L\'accès est temporairement bloqué, mais vos données restent intactes et seront restaurées à la réactivation.' : 'Access is temporarily blocked, but your data stays intact and will be restored upon reactivation.'}</li>
            <li><strong>{fr ? 'Annulé' : 'Cancelled'}</strong> — {fr ? 'L\'abonnement a été résilié. Vos données restent conservées.' : 'The subscription was cancelled. Your data remains stored.'}</li>
          </ul>
        </Section>

        {/* --- CODES D'ACCÈS --- */}
        <Section icon={KeyRound} title={fr ? "Les codes d'accès" : 'Access codes'}>
          <p>
            {fr
              ? "Un code d'accès (format MG-XXXX-XXXX-XXXX) est ce que vous recevez après avoir payé votre abonnement hors de l'application. Vous l'activez sur la page \"Abonnement\". Le décompte de votre période démarre exactement au moment où vous activez le code — jamais avant."
              : 'An access code (format MG-XXXX-XXXX-XXXX) is what you receive after paying for your subscription outside the app. You activate it on the "Subscription" page. Your period starts counting exactly when you activate the code — never before.'}
          </p>
        </Section>

        {/* --- ACCÈS À VIE --- */}
        <Section icon={InfinityIcon} title={fr ? 'Accès à vie' : 'Lifetime access'}>
          <p>
            {fr
              ? "Un abonnement \"à vie\" n'expire jamais — aucun renouvellement à prévoir. Ce type de code ne peut être activé qu'une seule fois, et reste définitivement lié à votre entreprise."
              : 'A "lifetime" subscription never expires — no renewal needed. This type of code can only be activated once, and stays permanently linked to your business.'}
          </p>
        </Section>
      </div>
    </DashboardShell>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={17} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
