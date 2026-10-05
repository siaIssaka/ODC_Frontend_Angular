import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { OdcFooterComponent } from '../shared/odc-footer.component';
import { OdcHeaderComponent } from '../shared/odc-header.component';

/** Catalogue public (avec en-tête) et pages connexion / inscription (plein écran, sans en-tête). */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, OdcHeaderComponent, OdcFooterComponent],
  template: `
    @if (authPage()) {
      <router-outlet />
    } @else {
      <div class="flex min-h-dvh flex-col bg-odc-gray">
        <app-odc-header />
        <main class="site-container flex-1 py-6"><router-outlet /></main>
        <app-odc-footer />
      </div>
    }
  `,
})
export class AuthLayoutComponent {
  private readonly router = inject(Router);
  /** Le layout persiste entre /catalogue et /login : l'URL courante doit être réactive (signal). */
  private readonly url = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), map((e) => e.urlAfterRedirects)),
    { initialValue: this.router.url },
  );
  authPage(): boolean {
    const u = this.url();
    return ['/login', '/register', '/forgot-password', '/reset-password'].some((p) => u.startsWith(p));
  }
}
