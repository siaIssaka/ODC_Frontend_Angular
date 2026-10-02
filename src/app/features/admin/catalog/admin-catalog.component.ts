import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../../core/services/catalog.service';
import { SocialService } from '../../../core/services/social.service';
import { Category, Formation } from '../../../core/models/formation.model';

/** Admin : catégories (création, édition, photo, désactivation) et photo de chaque formation. */
@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="text-3xl font-bold">Gestion du catalogue</h1>
    <div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div>
    @if (msg()) { <p class="mt-4 border-l-4 border-odc-brand-orange bg-white p-3 text-sm font-bold" role="status">{{ msg() }}</p> }

    <section class="mt-6" aria-labelledby="cat-title">
      <h2 id="cat-title" class="text-xl font-bold">Catégories</h2>
      <form class="card mt-3 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end" [formGroup]="form" (ngSubmit)="create()">
        <label class="text-sm font-bold">Nom <input class="input-field mt-1" formControlName="name" /></label>
        <label class="text-sm font-bold">Description <input class="input-field mt-1" formControlName="description" /></label>
        <button class="btn-primary" type="submit" [disabled]="form.invalid">Ajouter</button>
      </form>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (c of categories(); track c.id) {
          <article class="card !p-0 overflow-hidden">
            <div class="h-32 bg-black bg-cover bg-center" [style.background-image]="bg(c.imageKey)">
              @if (!c.imageKey) { <div class="flex h-full items-end p-3"><span class="bg-odc-brand-orange px-2 py-1 text-xs font-bold">Pas de photo</span></div> }
            </div>
            <div class="space-y-2 p-4">
              <input class="input-field !py-1 font-bold" [value]="c.name" #n aria-label="Nom de la catégorie" />
              <input class="input-field !py-1" [value]="c.description ?? ''" #d aria-label="Description" placeholder="Description" />
              <label class="block text-xs font-bold">Photo (PNG, JPG, WEBP — 2 Mo max)
                <input type="file" class="mt-1 block w-full text-xs" accept=".png,.jpg,.jpeg,.webp" (change)="uploadCategory(c.id, $event)" /></label>
              <div class="flex gap-2">
                <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" (click)="save(c.id, n.value, d.value)">Enregistrer</button>
                <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="deactivate(c)">Désactiver</button>
              </div>
            </div>
          </article>
        } @empty { <p class="text-sm text-odc-muted">Aucune catégorie.</p> }
      </div>
    </section>

    <section class="mt-10" aria-labelledby="form-title">
      <h2 id="form-title" class="text-xl font-bold">Photos des formations</h2>
      <p class="mt-1 text-sm text-odc-muted">Sans photo propre, une formation utilise la photo de sa catégorie.</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (f of formations(); track f.id) {
          <article class="card flex gap-3 !p-3">
            <div class="h-20 w-24 shrink-0 bg-black bg-cover bg-center" [style.background-image]="bg(f.imageKey ?? f.categoryImageKey)"></div>
            <div class="min-w-0 flex-1">
              <input class="input-field !py-1 font-bold" [value]="f.title" #title [attr.aria-label]="'Nom de la formation ' + f.title" />
              <p class="text-xs text-odc-muted">{{ f.categoryName ?? 'Sans catégorie' }}</p>
              <input type="file" class="mt-1 block w-full text-xs" accept=".png,.jpg,.jpeg,.webp" (change)="uploadFormation(f.id, $event)" [attr.aria-label]="'Photo de ' + f.title" />
              <div class="mt-2 flex flex-wrap gap-2">
                <button class="btn-primary !px-3 !py-1.5 text-xs" type="button" (click)="saveFormation(f, title.value)">Enregistrer le nom</button>
                <button class="btn-secondary !px-3 !py-1.5 text-xs" type="button" (click)="deleteFormation(f)">Supprimer</button>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class AdminCatalogComponent {
  private readonly catalog = inject(CatalogService);
  private readonly social = inject(SocialService);
  private readonly fb = inject(FormBuilder);
  readonly categories = signal<Category[]>([]);
  readonly formations = signal<Formation[]>([]);
  readonly msg = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ name: ['', Validators.required], description: [''] });

  constructor() { this.load(); }

  bg(key: string | null | undefined): string | null {
    const u = this.social.mediaUrl(key);
    return u ? `url('${u}')` : null;
  }

  private load(): void {
    this.catalog.getCategories().subscribe((c) => this.categories.set(c));
    this.catalog.getFormations().subscribe((f) => this.formations.set(f));
  }

  private done = (text: string) => () => {
    this.msg.set(text);
    this.catalog.notifyFormationsChanged();
    this.load();
  };
  private fail = (e: { error?: { message?: string } }) => this.msg.set(e.error?.message ?? 'Action impossible.');

  create(): void { this.catalog.createCategory(this.form.getRawValue()).subscribe({ next: () => { this.form.reset(); this.done('Catégorie ajoutée.')(); }, error: this.fail }); }
  save(id: number, name: string, description: string): void { this.catalog.updateCategory(id, { name, description }).subscribe({ next: this.done('Catégorie enregistrée.'), error: this.fail }); }
  deactivate(c: Category): void { if (confirm(`Désactiver « ${c.name} » ? Elle disparaîtra du menu.`)) this.catalog.deactivateCategory(c.id).subscribe({ next: this.done('Catégorie désactivée.'), error: this.fail }); }

  uploadCategory(id: number, ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (f) this.catalog.uploadCategoryImage(id, f).subscribe({ next: this.done('Photo de la catégorie mise à jour.'), error: this.fail });
  }

  uploadFormation(id: number, ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (f) this.catalog.uploadFormationImage(id, f).subscribe({ next: this.done('Photo de la formation mise à jour.'), error: this.fail });
  }

  saveFormation(formation: Formation, title: string): void {
    this.catalog.updateFormation(formation.id, {
      title,
      description: formation.description,
      categoryId: formation.categoryId,
    }).subscribe({ next: this.done('Formation mise à jour.'), error: this.fail });
  }

  deleteFormation(formation: Formation): void {
    const warning = `Supprimer « ${formation.title} » ? Cette action supprimera aussi ses cours, modules, leçons, PDF/vidéos, devoirs et dépôts, inscriptions, progressions et discussions. Cette action est irréversible.`;
    if (!confirm(warning)) return;
    this.catalog.deleteFormation(formation.id).subscribe({
      next: this.done('Formation et contenus associés supprimés.'),
      error: this.fail,
    });
  }
}
