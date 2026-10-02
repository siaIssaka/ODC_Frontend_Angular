import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Carte « panneau orange + formulaire blanc » pour les pages annexes (mot de passe oublié / nouveau mot de passe).
 * Même langage visuel que la page connexion/inscription ; sur mobile, le panneau devient un bandeau.
 */
import { BrandLogoComponent } from './brand-logo.component';
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent],
  template: `
    <div class="flex min-h-dvh items-center justify-center bg-black px-3 py-6 sm:px-6"
         style="padding-top: max(1.5rem, env(safe-area-inset-top)); padding-bottom: max(1.5rem, env(safe-area-inset-bottom))">
      <div class="w-full max-w-4xl">
        <a routerLink="/catalogue" class="mb-4 flex items-center gap-3 text-white" aria-label="ODC Academy, retour au catalogue">
          <app-brand-logo slot="header" [height]="40" />
        </a>
        <div class="grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(255,121,0,0.25)] md:grid-cols-2">
          <aside class="odc-panel flex items-center justify-center px-6 py-6 text-center text-black md:px-10 md:py-16">
            <div class="relative z-[1]">
              <h2 class="text-2xl font-bold md:text-4xl">Besoin d'aide ?</h2>
              <p class="mx-auto mt-3 max-w-xs text-sm font-bold md:mt-4 md:text-base">Retrouvez l'accès à votre compte en quelques instants.</p>
              <a routerLink="/login" class="mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-black px-7 text-sm font-bold uppercase tracking-wide hover:bg-black hover:text-white md:mt-6 md:h-12">← Se connecter</a>
            </div>
          </aside>
          <main class="animate-rise flex flex-col justify-center p-6 sm:p-10"><ng-content /></main>
        </div>
      </div>
    </div>
  `,
})
export class AuthShellComponent {}
