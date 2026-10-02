import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Conditions d'utilisation et données personnelles.
 * TODO(juridique) : texte modèle rédigé pour une plateforme de formation ; à faire relire et adapter par
 * l'équipe juridique / le DPO d'Orange Digital Center avant la mise en production.
 */
@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-3xl bg-white p-6 shadow-card sm:p-10">
      <h1 class="text-3xl font-bold sm:text-4xl">Conditions d'utilisation</h1>
      <div class="mt-2 h-1 w-16 bg-odc-brand-orange"></div>
      <p class="lead mt-6">En créant un compte sur ODC Academy, vous acceptez les règles ci-dessous. Elles protègent les apprenants, les formateurs et la plateforme.</p>

      <h2 class="mt-8 text-xl font-bold">1. Objet</h2>
      <p class="mt-2">ODC Academy est la plateforme de formation en ligne d'Orange Digital Center : catalogue de formations, cours, quiz, devoirs, forums et messagerie.</p>

      <h2 class="mt-8 text-xl font-bold">2. Votre compte</h2>
      <p class="mt-2">Vous fournissez des informations exactes et vous protégez votre mot de passe. Votre compte est personnel : ne le partagez pas. Signalez à l'administration toute utilisation suspecte. Un compte peut être suspendu en cas de non-respect de ces conditions.</p>

      <h2 class="mt-8 text-xl font-bold">3. Contenus pédagogiques</h2>
      <p class="mt-2">Les cours, supports et quiz sont protégés. Ils sont destinés à votre usage personnel de formation : vous ne devez ni les revendre, ni les diffuser publiquement sans autorisation.</p>

      <h2 class="mt-8 text-xl font-bold">4. Vos travaux et vos messages</h2>
      <p class="mt-2">Les travaux que vous déposez, vos messages et vos contributions aux forums restent les vôtres. Vous garantissez qu'ils ne violent pas les droits de tiers. Les formateurs et l'administration y accèdent pour vous évaluer et vous accompagner.</p>

      <h2 class="mt-8 text-xl font-bold">5. Comportement</h2>
      <p class="mt-2">Restez respectueux dans les forums et la messagerie. Sont interdits : le harcèlement, les propos haineux ou discriminatoires, les contenus illégaux, la fraude aux évaluations et toute tentative de perturber ou de contourner la sécurité de la plateforme.</p>

      <h2 id="donnees" class="mt-8 scroll-mt-24 text-xl font-bold">6. Données personnelles</h2>
      <p class="mt-2">Nous collectons : nom, prénom, adresse e-mail, photo de profil (facultative), progression, résultats aux quiz, travaux déposés, messages et publications de forum. Ces données servent à dispenser et suivre votre formation, à sécuriser votre compte et à vous envoyer des notifications utiles (par exemple une réponse à votre discussion ou la réinitialisation de votre mot de passe).</p>
      <p class="mt-2">Elles ne sont pas vendues. Elles sont accessibles à vous, aux formateurs de vos formations et aux administrateurs, et conservées tant que votre compte est actif. Vous pouvez demander l'accès, la correction ou la suppression de vos données auprès de l'administration de la plateforme, conformément à la réglementation applicable en matière de protection des données personnelles.</p>
      <p class="mt-2">Si vous vous connectez avec Google, nous recevons uniquement votre nom et votre adresse e-mail vérifiée.</p>

      <h2 class="mt-8 text-xl font-bold">7. Disponibilité et évolution</h2>
      <p class="mt-2">Nous faisons au mieux pour que la plateforme soit disponible, sans garantie d'accès ininterrompu. Ces conditions peuvent évoluer ; en cas de changement important, vous en serez informé.</p>

      <p class="mt-10 text-sm text-odc-muted">Dernière mise à jour : septembre 2026.</p>
      <p class="mt-6"><a routerLink="/register" class="btn-primary">Créer mon compte</a></p>
    </article>
  `,
})
export class ConditionsComponent {}
