import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { CatalogService } from '../core/services/catalog.service';
import { BrandLogoComponent } from './brand-logo.component';
import { AvatarComponent } from './avatar.component';
import { SocialService } from '../core/services/social.service';
import { Category, Formation } from '../core/models/formation.model';

/**
 * En-tête Orange Digital Center : bandeau noir, texte blanc, accent orange #FF7900.
 * Survol d'une catégorie (desktop) ou tap (mobile) = liste de ses formations.
 */
@Component({
  selector: 'app-odc-header',
  standalone: true,
  imports: [RouterLink, AvatarComponent, BrandLogoComponent],
  template: `
    <header #header class="fixed inset-x-0 top-0 z-50 bg-black text-white shadow-md">
      <div class="site-container flex items-center gap-4 py-3">
        <a routerLink="/catalogue" class="flex shrink-0 items-center gap-3">
          <app-brand-logo slot="header" [height]="40" [compact]="true" />
        </a>

        <!-- Menu catégories (desktop) -->
        <nav class="ml-4 hidden min-w-0 flex-1 items-center gap-1 xl:flex" aria-label="Catégories de formations" (mouseleave)="open.set(null)">
          @for (c of menuCategories(); track c.id) {
            <div class="relative" (mouseenter)="open.set(c.id)">
              <button type="button" class="flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-bold uppercase tracking-wide hover:text-odc-brand-orange"
                      [class.border-odc-brand-orange]="open() === c.id" [class.border-transparent]="open() !== c.id"
                      [attr.aria-expanded]="open() === c.id" (focus)="open.set(c.id)">
                {{ c.name }} <span aria-hidden="true" class="text-xs">▾</span>
              </button>
              @if (open() === c.id) {
                <ul class="absolute left-0 top-full w-72 border-t-2 border-odc-brand-orange bg-white py-2 text-black shadow-card">
                  @for (f of byCategory(c.id); track f.id) {
                    <li><a [routerLink]="'/catalogue'" [queryParams]="{ formation: f.id }" (click)="open.set(null)"
                           class="block px-4 py-2.5 text-sm font-bold uppercase hover:bg-odc-orange-light hover:text-odc-orange">{{ f.title }}</a></li>
                  } @empty {
                    <li class="px-4 py-2.5 text-sm text-odc-muted">Bientôt disponible</li>
                  }
                </ul>
              }
            </div>
          }
        </nav>

        <div class="ml-auto flex items-center gap-2 text-sm font-bold">
          @if (auth.currentUser()) {
            <a routerLink="/messages" class="hidden px-3 py-2 hover:text-odc-brand-orange md:inline">Messages@if (unread() > 0) { <span class="ml-1 rounded-full bg-odc-brand-orange px-1.5 text-xs text-black">{{ unread() }}</span> }</a>
            <div class="relative" (mouseenter)="profileOpen.set(true)" (mouseleave)="profileOpen.set(false)" (keydown.escape)="profileOpen.set(false)"
                 (focusout)="$any($event.currentTarget).contains($any($event).relatedTarget) || profileOpen.set(false)">
              <button type="button" class="flex max-w-44 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-odc-brand-orange"
                aria-haspopup="true" [attr.aria-expanded]="profileOpen()" (click)="profileOpen.update(open => !open)">
                <app-avatar [photoKey]="auth.currentUser()?.photoKey" [name]="auth.displayName()" [size]="34" />
                <span class="hidden truncate text-sm sm:inline">{{ auth.displayName() }}</span>
                <span aria-hidden="true" class="text-xs">▾</span>
              </button>
              @if (profileOpen()) {
                <div class="absolute right-0 top-full z-50 w-60 border-t-2 border-odc-brand-orange bg-white py-2 text-black shadow-card">
                  <div class="border-b border-gray-200 px-4 py-3">
                    <p class="font-bold">{{ auth.displayName() }}</p>
                    <p class="text-xs text-odc-muted">{{ roleLabel() }}</p>
                  </div>
                  <a [routerLink]="dashboardLink()" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-bold hover:bg-odc-orange-light hover:text-odc-orange">Mon espace</a>
                  @if (auth.role() === 'ADMIN') {
                    <p class="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-odc-muted">Administration</p>
                    @for (l of adminLinks; track l.to) {
                      <a [routerLink]="l.to" (click)="profileOpen.set(false)" class="block px-4 py-2 text-sm hover:bg-odc-orange-light hover:text-odc-orange">{{ l.label }}</a>
                    }
                  }
                  <a routerLink="/profil" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm hover:bg-odc-orange-light hover:text-odc-orange">Mon profil</a>
                  <button type="button" class="mt-1 w-full border-t border-gray-200 px-4 py-3 text-left text-sm font-bold hover:bg-odc-orange-light hover:text-odc-orange" (click)="auth.logout(); profileOpen.set(false)">Déconnexion</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="rounded-md bg-odc-brand-orange px-4 py-2 text-black hover:bg-white">Connexion</a>
            <a routerLink="/register" class="hidden rounded-md border-2 border-white px-4 py-2 hover:bg-white hover:text-black sm:inline">Inscription</a>
          }
          <button type="button" class="ml-1 flex h-10 w-10 shrink-0 items-center justify-center border-2 border-white xl:hidden"
                  (click)="mobile.set(!mobile())" [attr.aria-expanded]="mobile()" aria-label="Menu">{{ mobile() ? '✕' : '☰' }}</button>
        </div>
      </div>

      <!-- Menu mobile : accordéon -->
      @if (mobile()) {
        <nav class="absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-t border-white/20 bg-black px-4 pb-4 xl:hidden" aria-label="Menu mobile">
          @for (c of menuCategories(); track c.id) {
            <button type="button" class="flex w-full items-center justify-between border-b border-white/20 py-3 text-left text-sm font-bold uppercase"
                    (click)="open.set(open() === c.id ? null : c.id)">{{ c.name }} <span>{{ open() === c.id ? '−' : '+' }}</span></button>
            @if (open() === c.id) {
              @for (f of byCategory(c.id); track f.id) {
                <a [routerLink]="'/catalogue'" [queryParams]="{ formation: f.id }" (click)="mobile.set(false)"
                   class="block py-2 pl-4 text-sm text-odc-brand-orange">{{ f.title }}</a>
              }
            }
          }
          @if (auth.currentUser()) { <a routerLink="/messages" (click)="mobile.set(false)" class="block py-3 text-sm font-bold md:hidden">Messages @if (unread() > 0) { ({{ unread() }}) }</a> }
        </nav>
      }
    </header>
    <div [style.height.px]="headerHeight() || 64" aria-hidden="true"></div>
  `,
})
export class OdcHeaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('header') private headerElement!: ElementRef<HTMLElement>;
  readonly headerHeight = signal(64);
  private resizeObserver?: ResizeObserver;

  readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  readonly categories = signal<Category[]>([]);
  private readonly formations = signal<Formation[]>([]);
  readonly menuCategories = computed(() => {
    const categories = this.categories();
    return this.grouped().some((formation) => formation.categoryId === null)
      ? [...categories, { id: 0, name: 'Autres formations', description: null }]
      : categories;
  });
  readonly open = signal<number | null>(null);
  readonly mobile = signal(false);
  readonly profileOpen = signal(false);
  readonly adminLinks = [
    { to: '/admin/catalogue', label: 'Formations et catégories' },
    { to: '/admin/cohortes', label: 'Cohortes et apprenants' },
    { to: '/admin/formateurs', label: 'Formateurs' },
    { to: '/admin/utilisateurs', label: 'Utilisateurs' },
    { to: '/admin/apparence', label: 'Identité visuelle (logos)' },
  ];
  readonly unread = signal(0);
  private readonly social = inject(SocialService);
  readonly grouped = computed(() => this.formations().filter((f) => f.active));

  ngAfterViewInit(): void {
    const header = this.headerElement.nativeElement;
    const updateHeight = () => this.headerHeight.set(header.getBoundingClientRect().height);
    updateHeight();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(updateHeight);
      this.resizeObserver.observe(header);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  constructor() {
    if (this.auth.currentUser()) this.social.unread().subscribe({ next: (n) => this.unread.set(n), error: () => this.unread.set(0) });
    this.loadCatalog();
    this.catalog.formationsChanged$.subscribe(() => this.loadCatalog());
  }

  roleLabel(): string {
    switch (this.auth.role()) {
      case 'ADMIN': return 'Administrateur';
      case 'FORMATEUR': return 'Formateur';
      case 'APPRENANT': return 'Apprenant';
      default: return '';
    }
  }

  byCategory(id: number): Formation[] {
    return this.grouped().filter((f) => id === 0 ? f.categoryId === null : f.categoryId === id);
  }

  private loadCatalog(): void {
    forkJoin([this.catalog.getCategories(), this.catalog.getFormations()]).subscribe({
      next: ([categories, formations]) => {
        this.categories.set(categories);
        this.formations.set(formations.filter((formation) => formation.active));
      },
      error: () => {
        this.categories.set([]);
        this.formations.set([]);
      },
    });
  }

  dashboardLink(): string {
    const r = this.auth.role();
    return r === 'ADMIN' ? '/dashboard/admin' : r === 'FORMATEUR' ? '/dashboard/formateur' : '/dashboard/apprenant';
  }
}
