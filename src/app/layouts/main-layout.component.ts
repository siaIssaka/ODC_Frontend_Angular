import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//
import { OdcFooterComponent } from '../shared/odc-footer.component';
import { OdcHeaderComponent } from '../shared/odc-header.component';
import { AuthService } from '../core/services/auth.service';

/**
 * Layout commun des pages authentifiées.
 * Contient la barre de navigation responsive (desktop + menu mobile)
 * et la zone de contenu (router-outlet).
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, OdcHeaderComponent, OdcFooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-odc-gray">
      <!-- Barre supérieure -->
      <app-odc-header />

      <!-- Contenu de la page active -->
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <router-outlet />
      </main>

      <app-odc-footer />
    </div>
  `,
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  /** État d'ouverture du menu hamburger (mobile). */
  mobileOpen = false;

  /** Lien dashboard selon le rôle de l'utilisateur connecté. */
  dashboardLink(): string {
    const role = this.auth.role();
    if (role === 'ADMIN') return '/dashboard/admin';
    if (role === 'FORMATEUR') return '/dashboard/formateur';
    return '/dashboard/apprenant';
  }
}
