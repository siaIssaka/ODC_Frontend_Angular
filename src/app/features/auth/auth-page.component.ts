import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { BrandLogoComponent } from '../../shared/brand-logo.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

/**
 * Connexion / inscription sur UNE carte : le panneau orange glisse d'un côté à l'autre (desktop) ;
 * sur mobile, il devient un bandeau en haut et le formulaire actif s'affiche dessous en fondu.
 * Les URL /login et /register restent réelles (liens, bouton retour) : c'est le routeur qui pilote l'état.
 */
@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [RouterLink, LoginComponent, RegisterComponent, BrandLogoComponent],
  template: `
    <div class="flex min-h-dvh items-center justify-center bg-black px-3 py-6 sm:px-6"
         style="padding-top: max(1.5rem, env(safe-area-inset-top)); padding-bottom: max(1.5rem, env(safe-area-inset-bottom))">
      <div class="w-full max-w-4xl">
        <a routerLink="/catalogue" class="mb-4 flex items-center gap-3 text-white" aria-label="ODC Academy, retour au catalogue">
          <app-brand-logo slot="header" [height]="40" />
        </a>

        <div class="relative grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(255,121,0,0.25)] md:grid-cols-2">
          <!-- Panneau orange : glisse à droite en mode connexion, à gauche en mode inscription -->
          <aside class="odc-panel z-10 flex items-center justify-center px-6 py-6 text-center text-black md:absolute md:inset-y-0 md:left-0 md:w-1/2 md:px-10 md:py-0 md:transition-transform md:duration-700 md:ease-in-out motion-reduce:transition-none"
                 [class]="login() ? 'md:translate-x-full' : 'md:translate-x-0'">
            <div class="relative z-[1] grid w-full">
              <div class="col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none"
                   [class]="login() ? 'opacity-100' : 'pointer-events-none opacity-0 max-md:hidden'" [attr.aria-hidden]="!login()">
                <svg class="mx-auto hidden h-8 w-8 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
                <h2 class="text-2xl font-bold md:mt-3 md:text-4xl">Bienvenue !</h2>
                <p class="mx-auto mt-2 max-w-xs text-sm font-bold md:mt-4 md:text-base">Pas encore de compte ? Créez le vôtre en une minute et démarrez votre parcours numérique.</p>
                <a routerLink="/register" class="mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-black px-7 text-sm font-bold uppercase tracking-wide hover:bg-black hover:text-white md:mt-6 md:h-12">S'inscrire →</a>
              </div>
              <div class="col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none"
                   [class]="login() ? 'pointer-events-none opacity-0 max-md:hidden' : 'opacity-100'" [attr.aria-hidden]="login()">
                <svg class="mx-auto hidden h-8 w-8 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
                <h2 class="text-2xl font-bold md:mt-3 md:text-4xl">Content de vous revoir !</h2>
                <p class="mx-auto mt-2 max-w-xs text-sm font-bold md:mt-4 md:text-base">Déjà inscrit ? Connectez-vous pour reprendre votre formation là où vous l'avez laissée.</p>
                <a routerLink="/login" class="mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-black px-7 text-sm font-bold uppercase tracking-wide hover:bg-black hover:text-white md:mt-6 md:h-12">← Se connecter</a>
              </div>
            </div>
          </aside>

          <!-- Connexion : colonne gauche (desktop) -->
          <div class="flex p-6 transition-opacity duration-500 sm:p-10 md:col-start-1 md:row-start-1 motion-reduce:transition-none"
               [class]="login() ? 'animate-rise' : 'pointer-events-none opacity-0 max-md:hidden'" [attr.inert]="login() ? null : ''">
            <app-login-form [active]="login()" />
          </div>
          <!-- Inscription : colonne droite (desktop) -->
          <div class="flex p-6 transition-opacity duration-500 sm:p-10 md:col-start-2 md:row-start-1 motion-reduce:transition-none"
               [class]="login() ? 'pointer-events-none opacity-0 max-md:hidden' : 'animate-rise'" [attr.inert]="login() ? '' : null">
            <app-register-form [active]="!login()" />
          </div>
        </div>
        <p class="sr-only" aria-live="polite">{{ login() ? 'Formulaire de connexion affiché' : "Formulaire d'inscription affiché" }}</p>
      </div>
    </div>
  `,
})
export class AuthPageComponent {
  private readonly router = inject(Router);
  readonly login = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), map((e) => !e.urlAfterRedirects.startsWith('/register'))),
    { initialValue: !this.router.url.startsWith('/register') },
  );
}
