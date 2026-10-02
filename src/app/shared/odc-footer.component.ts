import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from './brand-logo.component';
import { AuthService } from '../core/services/auth.service';

/** Pied de page noir (comme l'en-tête) : texte blanc, accents orange, liens à cible tactile confortable. */
@Component({
  selector: 'app-odc-footer',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent],
  template: `
    <footer class="bg-black text-white" style="padding-bottom: env(safe-area-inset-bottom)">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <a routerLink="/catalogue" class="flex items-center gap-3" aria-label="ODC Academy, catalogue">
            <app-brand-logo slot="footer" [height]="56" />
          </a>
          <p class="mt-4 max-w-xs text-sm text-white/80">Formations certifiantes en développement, data, e-business et cybersécurité, avec vos formateurs et votre communauté.</p>
        </div>
        <nav aria-label="Plateforme">
          <h2 class="text-sm font-bold uppercase tracking-wider text-odc-brand-orange">Plateforme</h2>
          <ul class="mt-3 space-y-1 text-sm">
            <li><a routerLink="/catalogue" class="inline-block py-1.5 hover:text-odc-brand-orange">Catalogue des formations</a></li>
            @if (auth.currentUser()) {
              <li><a routerLink="/messages" class="inline-block py-1.5 hover:text-odc-brand-orange">Messagerie</a></li>
              <li><a routerLink="/profil" class="inline-block py-1.5 hover:text-odc-brand-orange">Mon profil</a></li>
            } @else {
              <li><a routerLink="/login" class="inline-block py-1.5 hover:text-odc-brand-orange">Connexion</a></li>
              <li><a routerLink="/register" class="inline-block py-1.5 hover:text-odc-brand-orange">Créer un compte</a></li>
            }
          </ul>
        </nav>
        <nav aria-label="Informations légales">
          <h2 class="text-sm font-bold uppercase tracking-wider text-odc-brand-orange">Informations</h2>
          <ul class="mt-3 space-y-1 text-sm">
            <li><a routerLink="/conditions" class="inline-block py-1.5 hover:text-odc-brand-orange">Conditions d'utilisation</a></li>
            <li><a routerLink="/conditions" fragment="donnees" class="inline-block py-1.5 hover:text-odc-brand-orange">Données personnelles</a></li>
          </ul>
        </nav>
      </div>
      <div class="border-t border-white/20">
        <p class="mx-auto max-w-7xl px-4 py-4 text-xs text-white/70 sm:px-6">© {{ year }} Orange Digital Center — ODC Academy. Tous droits réservés.</p>
      </div>
    </footer>
  `,
})
export class OdcFooterComponent {
  readonly auth = inject(AuthService);
  readonly year = new Date().getFullYear();
}
