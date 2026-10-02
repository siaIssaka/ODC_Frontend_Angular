import { Component, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

interface GoogleId {
  initialize(cfg: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string; auto_select?: boolean }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
type GoogleWindow = Window & { google?: { accounts: { id: GoogleId } } };

// Google n'accepte qu'un seul initialize() : on l'appelle une fois, et le formulaire visible enregistre son gestionnaire.
let gsiReady = false;
let activeHandler: ((credential: string) => void) | null = null;

/**
 * Icône ronde « Google » alignée comme les icônes sociales de la maquette, suivie du séparateur « Ou ».
 * N'apparaît que si le backend a un GOOGLE_CLIENT_ID et si le formulaire parent est actif.
 */
@Component({
  selector: 'app-google-button',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (clientId() && enabled()) {
      <div class="mt-4" role="group" aria-label="Continuer avec Google">
        <div #host class="flex min-h-[44px] justify-center"></div>
        @if (mode() === 'signup') {
          <p class="mt-2 text-center text-xs text-gray-600">En continuant avec Google, vous acceptez les <a routerLink="/conditions" target="_blank" rel="noopener" class="font-bold text-black underline">conditions d'utilisation</a>.</p>
        }
        <div class="mt-4 flex items-center gap-3 text-sm text-gray-500" aria-hidden="true">
          <span class="h-px flex-1 bg-gray-300"></span>Ou<span class="h-px flex-1 bg-gray-300"></span>
        </div>
      </div>
    }
  `,
})
export class GoogleButtonComponent {
  readonly mode = input<'signin' | 'signup'>('signin');
  readonly enabled = input(true);
  readonly failed = output<string>();
  private readonly auth = inject(AuthService);
  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  readonly clientId = signal<string | null>(null);
  private lastEl: HTMLElement | null = null;

  constructor() {
    this.auth.authConfig().subscribe({ next: (c) => this.clientId.set(c.googleClientId), error: () => this.clientId.set(null) });
    effect(() => {
      const el = this.host()?.nativeElement;
      const id = this.clientId();
      if (el && id && el !== this.lastEl) {
        this.lastEl = el;
        this.loadScript().then(() => this.render(el, id)).catch(() => this.clientId.set(null)); // script bloqué : bouton masqué
      }
    });
  }

  private loadScript(): Promise<void> {
    if ((window as GoogleWindow).google?.accounts?.id) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('gsi'));
      document.head.appendChild(s);
    });
  }

  private render(el: HTMLElement, clientId: string): void {
    const gid = (window as GoogleWindow).google!.accounts.id;
    activeHandler = (c) => this.onCredential(c);
    if (!gsiReady) {
      gid.initialize({ client_id: clientId, ux_mode: 'popup', auto_select: false, callback: (r) => activeHandler?.(r.credential) });
      gsiReady = true;
    }
    gid.renderButton(el, { type: 'icon', shape: 'circle', theme: 'outline', size: 'large', locale: 'fr' });
  }

  private onCredential(credential: string): void {
    this.auth.googleLogin(credential).pipe(switchMap(() => this.auth.loadCurrentUser())).subscribe({
      next: (user) => (user ? this.auth.redirectAfterLogin(user.role) : this.failed.emit('Impossible de charger votre profil.')),
      error: (e) => this.failed.emit(e?.error?.message || 'Connexion Google impossible.'),
    });
  }
}
