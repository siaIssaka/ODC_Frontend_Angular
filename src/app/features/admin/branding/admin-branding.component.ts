import { Component, inject, signal } from '@angular/core';
import { BrandingService, LogoSlot } from '../../../core/services/branding.service';

/** Admin : logos de l'en-tête et du pied de page (aperçu sur fond noir, comme sur le site). */
@Component({
  selector: 'app-admin-branding',
  standalone: true,
  template: `
    <h1 class="text-3xl font-bold">Identité visuelle</h1>
    <div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div>
    <p class="mt-4 max-w-2xl text-sm text-odc-muted">Personnalisez les logos affichés sur tout le site. Sans logo personnalisé, le logo Orange par défaut est utilisé.</p>
    @if (msg()) { <p class="mt-4 border-l-4 border-odc-brand-orange bg-white p-3 text-sm font-bold" role="status">{{ msg() }}</p> }

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      @for (s of slots; track s.slot) {
        <section class="card !p-0 overflow-hidden" [attr.aria-labelledby]="'t-' + s.slot">
          <div class="flex h-36 items-center justify-center bg-black px-6">
            <img [src]="preview(s.slot)" alt="Aperçu du logo" class="w-auto max-w-full object-contain" [style.height.px]="s.height * 1.5" />
          </div>
          <div class="space-y-3 p-5">
            <h2 [id]="'t-' + s.slot" class="text-lg font-bold">{{ s.title }}</h2>
            <p class="text-xs text-odc-muted">{{ branding.isCustom(s.slot) ? 'Logo personnalisé actif.' : 'Logo Orange par défaut.' }} Affiché à {{ s.height }} px de haut.</p>
            <label class="block text-xs font-bold">Choisir un nouveau logo
              <input type="file" class="mt-1 block w-full text-xs" accept=".png,.jpg,.jpeg,.webp" (change)="upload(s.slot, $event)" />
            </label>
            @if (branding.isCustom(s.slot)) {
              <button type="button" class="btn-secondary !px-4 !py-2 text-xs" (click)="reset(s.slot)">Rétablir le logo par défaut</button>
            }
          </div>
        </section>
      }
    </div>

    <aside class="card mt-6 max-w-3xl text-sm">
      <h2 class="font-bold">Conseils</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-odc-muted">
        <li>PNG (fond transparent de préférence), JPG ou WEBP — 2 Mo maximum. Le SVG n'est pas accepté, par sécurité.</li>
        <li>Les deux zones sont sur fond noir : choisissez un logo lisible sur noir.</li>
        <li>Le logo est réduit à la hauteur indiquée ; prévoyez au moins 2× cette hauteur en pixels pour rester net sur écran Retina.</li>
        <li>Le changement est visible partout à la prochaine actualisation de la page.</li>
      </ul>
    </aside>
  `,
})
export class AdminBrandingComponent {
  readonly branding = inject(BrandingService);
  readonly msg = signal<string | null>(null);
  readonly slots: { slot: LogoSlot; title: string; height: number }[] = [
    { slot: 'header', title: "Logo de l'en-tête", height: 40 },
    { slot: 'footer', title: 'Logo du pied de page', height: 56 },
  ];

  preview(slot: LogoSlot): string { return slot === 'header' ? this.branding.headerLogo() : this.branding.footerLogo(); }

  upload(slot: LogoSlot, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.branding.upload(slot, file).subscribe({
      next: () => { this.msg.set('Logo mis à jour.'); input.value = ''; },
      error: (e) => { this.msg.set(e.error?.message ?? "Envoi impossible (PNG, JPG ou WEBP, 2 Mo max)."); input.value = ''; },
    });
  }

  reset(slot: LogoSlot): void {
    this.branding.reset(slot).subscribe({ next: () => this.msg.set('Logo par défaut rétabli.'), error: (e) => this.msg.set(e.error?.message ?? 'Action impossible.') });
  }
}
