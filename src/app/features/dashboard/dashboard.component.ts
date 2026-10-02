import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Tableau de bord adapté au rôle (détecté via l'URL).
 * /dashboard/admin | /dashboard/formateur | /dashboard/apprenant
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-odc-black sm:text-3xl">
        Bonjour, {{ auth.displayName() }}
      </h1>
      <p class="mt-1 text-sm text-odc-muted">
        Espace {{ label() }} — aperçu de votre activité.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      @for (card of cards(); track card.title) {
        <a [routerLink]="card.link" class="card block transition hover:border-odc-orange hover:shadow-lg">
          <p class="text-xs font-semibold uppercase tracking-wide text-odc-orange">{{ card.tag }}</p>
          <h2 class="mt-2 text-lg font-bold text-odc-black">{{ card.title }}</h2>
          <p class="mt-1 text-sm text-odc-muted">{{ card.description }}</p>
        </a>
      }
    </div>

    <div class="card mt-6">
      <h2 class="font-semibold text-odc-black">Prochaines étapes</h2>
      <ul class="mt-3 list-inside list-disc space-y-1 text-sm text-odc-muted">
        @for (tip of tips(); track tip) {
          <li>{{ tip }}</li>
        }
      </ul>
    </div>
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Variante dérivée de l'URL courante. */
  private readonly variant = computed(() => {
    const url = this.router.url;
    if (url.includes('/admin')) return 'admin' as const;
    if (url.includes('/formateur')) return 'formateur' as const;
    return 'apprenant' as const;
  });

  label(): string {
    switch (this.variant()) {
      case 'admin':
        return 'Administrateur';
      case 'formateur':
        return 'Formateur';
      default:
        return 'Apprenant';
    }
  }

  cards() {
    switch (this.variant()) {
      case 'admin':
        return [
          { tag: 'Administration', title: 'Gérer les utilisateurs', description: 'Créer des comptes et gérer leur statut.', link: '/admin/utilisateurs' },
          { tag: 'Catalogue', title: 'Gérer les formations', description: 'Créer un parcours et attribuer un formateur.', link: '/catalogue' },
        ];
      case 'formateur':
        return [
          { tag: 'Pédagogie', title: 'Mes formations', description: 'Ouvrir une formation qui vous est attribuée.', link: '/catalogue' },
          { tag: 'Cours', title: 'Créer un cours', description: 'Ajouter un cours à une formation qui vous est attribuée.', link: '/catalogue' },
        ];
      default:
        return [
          { tag: 'Apprendre', title: 'Catalogue', description: 'Parcourir les formations et ouvrir les cours.', link: '/catalogue' },
          { tag: 'Compte', title: 'Mon profil', description: 'Consulter les informations de votre compte.', link: '/profil' },
        ];
    }
  }

  tips(): string[] {
    switch (this.variant()) {
      case 'admin':
        return ['Créez une formation puis attribuez un formateur.', 'Vérifiez le statut des comptes dans la gestion des utilisateurs.'];
      case 'formateur':
        return ['Ouvrez une formation attribuée pour créer ses cours.', 'Ajoutez des modules et des leçons texte aux cours.'];
      default:
        return ['Ouvrez un cours pour consulter ses modules et leçons.', 'Consultez les informations de votre profil.'];
    }
  }
}
