import { Component, computed, inject, input, signal } from '@angular/core';
import { BrandingService } from '../core/services/branding.service';

/**
 * Logo du site à l'emplacement « header » ou « footer » : image choisie par l'admin, sinon logo Orange par défaut.
 * Si l'image personnalisée ne se charge pas, on retombe sur le logo par défaut plutôt que d'afficher une icône cassée.
 */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <span class="flex items-center gap-3">
      <img [src]="src()" alt="Orange" class="w-auto max-w-[10rem] shrink-0 object-contain" [style.height.px]="height()" (error)="failed.set(true)" />
      @if (showName()) {
        <span class="text-sm font-bold" [class.max-sm:hidden]="compact()">ODC <span class="text-odc-brand-orange">Academy</span></span>
      }
    </span>
  `,
})
export class BrandLogoComponent {
  readonly slot = input<'header' | 'footer'>('header');
  readonly height = input(40);
  readonly showName = input(true);
  /** Masque le nom à côté du logo sur petit écran (en-tête mobile). */
  readonly compact = input(false);
  private readonly branding = inject(BrandingService);
  readonly failed = signal(false);
  readonly src = computed(() =>
    this.failed() ? BrandingService.DEFAULT_LOGO : this.slot() === 'footer' ? this.branding.footerLogo() : this.branding.headerLogo(),
  );
}
