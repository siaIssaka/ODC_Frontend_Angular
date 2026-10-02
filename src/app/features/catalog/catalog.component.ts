import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../shared/avatar.component';
import { SocialService } from '../../core/services/social.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { AdminService } from '../../core/services/admin.service';
import { forkJoin } from 'rxjs';
import { Course } from '../../core/models/course.model';
import { Category, Formation } from '../../core/models/formation.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, AvatarComponent],
  template: `
    <section class="page-hero mb-8">
      <div class="relative z-10 max-w-2xl">
        <p class="eyebrow !text-black">Orange Digital Center · Académie</p>
        <h1 class="mt-3 text-3xl font-bold leading-tight sm:text-5xl">Apprenez les compétences numériques de demain.</h1>
        <p class="mt-4 max-w-xl text-base text-black/80 sm:text-lg">Explorez nos parcours, suivez les cours et progressez à votre rythme.</p>
        <a class="btn-secondary mt-6" href="#parcours">Explorer le catalogue</a>
      </div>
      <div class="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/30 sm:right-12 sm:top-8" aria-hidden="true"></div>
      <div class="pointer-events-none absolute bottom-[-6rem] right-32 h-56 w-56 rounded-full bg-white/20" aria-hidden="true"></div>
    </section>

    <label class="mb-5 block max-w-2xl text-sm font-semibold" for="catalog-search">
      Rechercher un cours ou une formation
      <input id="catalog-search" class="input-field mt-2" type="search" [value]="searchTerm()"
        (input)="searchTerm.set(($any($event.target)).value)" placeholder="Ex. Java, développement, cybersécurité…" />
    </label>

    <nav class="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer par catégorie">
      <button type="button" class="shrink-0 border-2 px-4 py-2 text-sm font-bold" [class]="chip(null)" (click)="cat.set(null); only.set(null)">Toutes</button>
      @for (c of categories(); track c.id) {
        <button type="button" class="shrink-0 border-2 px-4 py-2 text-sm font-bold" [class]="chip(c.id)" (click)="cat.set(c.id); only.set(null)">{{ c.name }}</button>
      }
    </nav>

    @if (auth.currentUser()?.role === 'ADMIN') {
      <section class="card mb-6" aria-labelledby="create-formation-title">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="eyebrow">Administration</p>
            <h2 id="create-formation-title" class="mt-1 text-xl font-bold">Créer une formation</h2>
            <p class="mt-1 text-sm text-odc-muted">Le backend accepte un titre et une description. Les médias ne sont pas encore pris en charge.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a class="btn-secondary" routerLink="/admin/catalogue">Gérer les formations</a>
            <button class="btn-secondary" type="button" (click)="showFormationForm.update(v => !v)" [attr.aria-expanded]="showFormationForm()">
              {{ showFormationForm() ? 'Fermer' : 'Nouvelle formation' }}
            </button>
          </div>
        </div>
        @if (showFormationForm()) {
          <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" [formGroup]="formationForm" (ngSubmit)="createFormation()">
            <label class="text-sm font-semibold">Titre
              <input class="input-field mt-1" formControlName="title" />
            </label>
            <label class="text-sm font-semibold">Catégorie
              <select class="input-field mt-1" formControlName="categoryId">
                <option value="">— Aucune —</option>
                @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </label>
            <label class="text-sm font-semibold sm:col-span-2">Description
              <textarea class="input-field mt-1 min-h-24" formControlName="description" rows="3"></textarea>
            </label>
            <div class="sm:col-span-2">
              <button class="btn-primary" type="submit" [disabled]="formationForm.invalid || creatingFormation()">
                {{ creatingFormation() ? 'Création…' : 'Créer la formation' }}
              </button>
            </div>
          </form>
        }
        @if (adminFeedback()) { <p class="mt-3 text-sm text-green-800" role="status">{{ adminFeedback() }}</p> }
        @if (adminError()) { <p class="mt-3 text-sm text-red-700" role="alert">{{ adminError() }}</p> }
      </section>

      @if (formations().length && trainers().length) {
        <section class="card mb-8" aria-labelledby="assign-title">
          <p class="eyebrow">Équipe pédagogique</p>
          <h2 id="assign-title" class="mt-1 text-xl font-bold">Attribuer un formateur</h2>
          <form class="mt-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto]" [formGroup]="assignmentForm" (ngSubmit)="assignTrainer()">
            <label class="text-sm font-semibold">Formation
              <select class="input-field mt-1" formControlName="formationId">
                <option value="">Choisir une formation</option>
                @for (formation of formations(); track formation.id) { <option [value]="formation.id">{{ formation.title }}</option> }
              </select>
            </label>
            <label class="text-sm font-semibold">Formateur
              <select class="input-field mt-1" formControlName="trainerId">
                <option value="">Choisir un formateur</option>
                @for (trainer of trainers(); track trainer.id) { <option [value]="trainer.id">{{ trainer.prenom }} {{ trainer.nom }}</option> }
              </select>
            </label>
            <button class="btn-primary" type="submit" [disabled]="assignmentForm.invalid || assigning()">
              {{ assigning() ? 'Attribution…' : 'Attribuer' }}
            </button>
          </form>
        </section>
      }
    }

    <div id="parcours" class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Catalogue de formation</p>
        <h2 class="mt-1 text-2xl font-bold sm:text-3xl">{{ auth.currentUser()?.role === 'FORMATEUR' ? 'Mes formations' : 'Parcours disponibles' }}</h2>
      </div>
      <span class="badge">{{ visibleFormations().length }} parcours · {{ visibleCourseCount() }} cours</span>
    </div>

    @if (loading()) {
      <div class="card text-center text-odc-muted" role="status">Chargement du catalogue…</div>
    } @else if (error()) {
      <div class="card border-red-200 text-red-700" role="alert">{{ error() }}</div>
    } @else if (auth.currentUser()) {
      @if (formationError()) {
        <div class="card border-red-200 text-red-700" role="alert">{{ formationError() }}</div>
      } @else if (formationLoading()) {
        <div class="card text-center text-odc-muted" role="status">Chargement des formations…</div>
      } @else if (visibleFormations().length === 0) {
        <div class="card text-center">
          <p class="text-lg font-bold">{{ searchTerm().trim() ? 'Aucun cours ou formation ne correspond à cette recherche.' : 'Aucune formation attribuée pour le moment.' }}</p>
          @if (!searchTerm().trim() && auth.role() === 'FORMATEUR') { <p class="mt-2 text-sm text-odc-muted">Demandez à un administrateur de vous attribuer une formation.</p> }
        </div>
      } @else {
        <div class="space-y-6">
          @for (formation of visibleFormations(); track formation.id) {
            <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
              <div class="grid md:grid-cols-[0.8fr_1.2fr]">
                <div class="media-placeholder min-h-52 rounded-none bg-cover bg-center md:min-h-full" [style.background-image]="bg(formation)">
                  <div [class]="formation.imageKey || formation.categoryImageKey ? 'bg-black/70 p-3 text-white' : ''">
                    <span class="badge bg-white/80">Parcours digital</span>
                    <p class="mt-4 max-w-sm text-2xl font-bold">{{ formation.title }}</p>
                  </div>
                </div>
                <div class="p-5 sm:p-7">
                  @if (formation.trainers.length) {
                    <div class="mb-3 flex items-center gap-2" aria-label="Formateurs">
                      @for (t of formation.trainers; track t.id) { <app-avatar [photoKey]="t.photoKey" [name]="t.name" [size]="32" /> }
                      <span class="text-xs text-odc-muted">{{ formation.trainers[0].name }}{{ formation.trainers.length > 1 ? ' +' + (formation.trainers.length - 1) : '' }}</span>
                    </div>
                  }
                  <p class="eyebrow">Formation</p>
                  <h3 class="mt-1 text-2xl font-bold">{{ formation.title }}</h3>
                  <p class="mt-2 text-sm leading-6 text-odc-muted">{{ formation.description || 'Découvrez les cours de ce parcours.' }}</p>
                  @if (auth.role() === 'FORMATEUR') {
                    <div class="mt-4 flex justify-end">
                      <button class="btn-primary" type="button" (click)="toggleCourseForm(formation.id)">
                        {{ courseFormationId() === formation.id ? 'Fermer' : 'Ajouter un cours' }}
                      </button>
                    </div>
                  }
                  @if (courseFormationId() === formation.id) {
                    <form class="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2" [formGroup]="courseForm" (ngSubmit)="createCourse(formation.id)">
                      <label class="text-sm font-semibold">Titre du cours<input class="input-field mt-1" formControlName="title" /></label>
                      <label class="text-sm font-semibold">Niveau<input class="input-field mt-1" formControlName="level" placeholder="Débutant, intermédiaire…" /></label>
                      <label class="text-sm font-semibold">Prix (XOF)<input class="input-field mt-1" type="number" min="0" formControlName="price" /></label>
                      <label class="text-sm font-semibold">Description<textarea class="input-field mt-1" rows="2" formControlName="description"></textarea></label>
                      <button class="btn-primary sm:col-span-2" type="submit" [disabled]="courseForm.invalid || creatingCourse()">{{ creatingCourse() ? 'Création…' : 'Créer le cours' }}</button>
                    </form>
                  }
                  @if (courseError()) { <p class="mt-3 text-sm text-red-700" role="alert">{{ courseError() }}</p> }
                  <div class="mt-6 border-t border-gray-200 pt-5">
                    <div class="mb-3 flex items-center justify-between">
                      <h4 class="font-bold">Cours du parcours</h4>
                      <span class="text-xs font-medium text-odc-muted">{{ coursesFor(formation.id).length }} cours</span>
                    </div>
                    @if (coursesFor(formation.id).length === 0) {
                      <p class="text-sm text-odc-muted">Les cours de cette formation seront affichés ici.</p>
                    } @else {
                      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        @for (course of coursesFor(formation.id); track course.id) {
                          <a class="group rounded-xl border border-gray-200 p-4 transition hover:border-odc-orange hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-odc-orange" [routerLink]="['/cours', course.id]">
                            <div class="flex items-start justify-between gap-4">
                              <div>
                                <span class="eyebrow">{{ course.level }}</span>
                                <h5 class="mt-1 font-bold group-hover:text-odc-orange">{{ course.title }}</h5>
                                <p class="mt-1 line-clamp-2 text-sm text-odc-muted">{{ course.description || 'Ouvrir le contenu du cours.' }}</p>
                              </div>
                              <span class="shrink-0 text-sm font-bold">{{ course.price | currency: 'XOF' : 'symbol' : '1.0-0' }}</span>
                            </div>
                            <span class="mt-4 inline-flex text-sm font-bold text-odc-orange">Voir le cours <span aria-hidden="true" class="ml-1">→</span></span>
                          </a>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            </section>
          }
        </div>
      }
    } @else if (visibleFormations().length === 0) {
      <div class="card text-center text-odc-muted">{{ searchTerm().trim() ? 'Aucune formation ne correspond à cette recherche.' : 'Aucune formation disponible pour le moment.' }}</div>
    } @else {
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @for (formation of visibleFormations(); track formation.id) {
          <article class="card flex flex-col !p-4">
            <div class="media-placeholder mb-4 min-h-52 bg-cover bg-center" [style.background-image]="bg(formation)"
              [attr.role]="formation.imageKey || formation.categoryImageKey ? 'img' : null"
              [attr.aria-label]="formation.imageKey || formation.categoryImageKey ? 'Image de la formation ' + formation.title : null">
              <div [class]="formation.imageKey || formation.categoryImageKey ? 'rounded-lg bg-black/55 p-3 text-white' : ''">
                <span class="badge bg-white/90">{{ formation.categoryName || 'Formation' }}</span>
                <h3 class="mt-3 text-xl font-bold">{{ formation.title }}</h3>
              </div>
            </div>
            <p class="flex-1 text-sm leading-6 text-odc-muted">{{ formation.description || 'Découvrez les cours de cette formation sur ODC Academy.' }}</p>
            @if (formation.trainers.length) {
              <div class="mt-4 flex items-center gap-2" aria-label="Formateurs de la formation">
                @for (trainer of formation.trainers; track trainer.id) {
                  <app-avatar [photoKey]="trainer.photoKey" [name]="trainer.name" [size]="30" />
                }
                <span class="text-xs text-odc-muted">
                  {{ formation.trainers[0].name }}{{ formation.trainers.length > 1 ? ' +' + (formation.trainers.length - 1) : '' }}
                </span>
              </div>
            }
            @if (coursesFor(formation.id).length) {
              <p class="mt-4 border-t border-gray-200 pt-3 text-sm font-semibold">
                {{ coursesFor(formation.id).length }} cours disponible(s)
              </p>
            }
            <div class="mt-4 flex flex-wrap gap-3 border-t border-gray-200 pt-4">
              <a class="btn-primary flex-1 text-center" routerLink="/login">Se connecter pour découvrir</a>
              <a class="btn-secondary flex-1 text-center" routerLink="/register">Créer un compte</a>
            </div>
          </article>
        }
      </div>
    }

    @if (!auth.currentUser() && visibleFormations().length) {
      <p class="mt-6 text-sm text-odc-muted">Connectez-vous pour découvrir les cours et contenus pédagogiques de ces formations.</p>
    }
  `,
})
export class CatalogComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly tokens = inject(TokenService);
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly courses = signal<Course[]>([]);
  readonly searchTerm = signal('');
  readonly formations = signal<Formation[]>([]);
  readonly trainers = signal<User[]>([]);
  readonly loading = signal(true);
  readonly formationLoading = signal(false);
  readonly creatingFormation = signal(false);
  readonly creatingCourse = signal(false);
  readonly assigning = signal(false);
  readonly showFormationForm = signal(false);
  readonly courseFormationId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly formationError = signal<string | null>(null);
  readonly courseError = signal<string | null>(null);
  readonly adminError = signal<string | null>(null);
  readonly adminFeedback = signal<string | null>(null);

  readonly formationForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    categoryId: [''],
  });
  readonly courseForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    level: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
  });
  readonly assignmentForm = this.fb.nonNullable.group({
    formationId: ['', Validators.required],
    trainerId: ['', Validators.required],
  });

  private readonly route = inject(ActivatedRoute);
  private readonly social = inject(SocialService);

  bg(f: Formation): string | null {
    const url = this.social.mediaUrl(f.imageKey ?? f.categoryImageKey);
    return url ? `url('${url}')` : null;
  }

  readonly categories = signal<Category[]>([]);
  readonly cat = signal<number | null>(null);
  readonly only = signal<number | null>(null);

  visibleFormations(): Formation[] {
    const query = this.normalizedSearch();
    return this.formations().filter(
      (f) => (this.only() === null || f.id === this.only())
        && (this.cat() === null || f.categoryId === this.cat())
        && (!query || this.formationMatches(f, query) || this.courses().some((course) =>
          course.formationId === f.id && this.courseMatches(course, query))),
    );
  }

  coursesFor(formationId: number): Course[] {
    const formation = this.formations().find((item) => item.id === formationId);
    const query = this.normalizedSearch();
    const formationMatches = !!formation && !!query && this.formationMatches(formation, query);
    return this.courses().filter((course) => course.formationId === formationId
      && (!query || formationMatches || this.courseMatches(course, query)));
  }

  visibleCourseCount(): number {
    return this.visibleFormations().reduce((sum, formation) => sum + this.coursesFor(formation.id).length, 0);
  }

  private normalizedSearch(): string {
    return this.searchTerm().trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private courseMatches(course: Course, query: string): boolean {
    return this.normalizeText(`${course.title} ${course.description ?? ''} ${course.level}`).includes(query);
  }

  private formationMatches(formation: Formation, query: string): boolean {
    return this.normalizeText(`${formation.title} ${formation.description ?? ''} ${formation.categoryName ?? ''} ${formation.trainers.map((trainer) => trainer.name).join(' ')}`).includes(query);
  }

  private normalizeText(value: string): string {
    return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  chip(id: number | null): string {
    return this.cat() === id ? 'border-black bg-black text-white' : 'border-black bg-white text-black hover:bg-odc-brand-orange';
  }

  ngOnInit(): void {
    this.catalog.getCategories().subscribe({ next: (c) => this.categories.set(c) });
    // /catalogue?formation=ID (menu déroulant) : ne montrer que cette formation
    this.route.queryParamMap.subscribe((q) => {
      const id = Number(q.get('formation'));
      this.only.set(Number.isInteger(id) && id > 0 ? id : null);
    });
    if (!this.tokens.hasToken()) {
      forkJoin({
        formations: this.catalog.getFormations(),
        courses: this.catalog.getCourses(),
      }).subscribe({
        next: ({ formations, courses }) => {
          this.formations.set(formations.filter((formation) => formation.active));
          this.courses.set(courses.filter((course) => course.active));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les formations. Réessayez plus tard.');
          this.loading.set(false);
        },
      });
      return;
    }
    this.catalog.getCourses().subscribe({
      next: (items) => {
        this.courses.set(items.filter((course) => course.active));
        this.loading.set(false);
        if (this.tokens.hasToken()) this.loadFormations();
      },
      error: () => {
        this.error.set('Impossible de charger les cours. Réessayez plus tard.');
        this.loading.set(false);
      },
    });
  }

  toggleCourseForm(formationId: number): void {
    this.courseError.set(null);
    this.courseFormationId.set(this.courseFormationId() === formationId ? null : formationId);
  }

  createFormation(): void {
    if (this.formationForm.invalid || this.creatingFormation()) return;
    this.creatingFormation.set(true);
    this.adminError.set(null);
    this.adminFeedback.set(null);
    this.catalog.createFormationInCategory((({ title, description, categoryId }) =>
      ({ title, description, categoryId: categoryId ? Number(categoryId) : null }))(this.formationForm.getRawValue())).subscribe({
      next: (formation) => {
        this.formations.update((items) => [...items, formation]);
        this.catalog.notifyFormationsChanged();
        this.assignmentForm.controls.formationId.setValue(String(formation.id));
        this.formationForm.reset();
        this.showFormationForm.set(false);
        this.creatingFormation.set(false);
        this.adminFeedback.set('Formation créée. Attribuez-lui un formateur pour qu’il puisse y ajouter des cours.');
      },
      error: (error) => {
        this.adminError.set(this.apiError(error, 'Impossible de créer la formation.'));
        this.creatingFormation.set(false);
      },
    });
  }

  assignTrainer(): void {
    if (this.assignmentForm.invalid || this.assigning()) return;
    const { formationId, trainerId } = this.assignmentForm.getRawValue();
    this.assigning.set(true);
    this.adminError.set(null);
    this.catalog.assignTrainer(Number(formationId), Number(trainerId)).subscribe({
      next: () => {
        this.assigning.set(false);
        this.adminFeedback.set('Formateur attribué à la formation.');
      },
      error: (error) => {
        this.assigning.set(false);
        this.adminError.set(this.apiError(error, 'Impossible d’attribuer ce formateur.'));
      },
    });
  }

  createCourse(formationId: number): void {
    if (this.courseForm.invalid || this.creatingCourse()) return;
    this.creatingCourse.set(true);
    this.courseError.set(null);
    this.catalog.createCourse(formationId, this.courseForm.getRawValue()).subscribe({
      next: (course) => {
        this.courses.update((items) => [...items, course]);
        this.courseForm.reset();
        this.courseFormationId.set(null);
        this.creatingCourse.set(false);
      },
      error: (error) => {
        this.courseError.set(this.apiError(error, 'Impossible de créer le cours. Vérifiez vos droits sur cette formation.'));
        this.creatingCourse.set(false);
      },
    });
  }

  private loadFormations(): void {
    this.auth.loadCurrentUser().subscribe((user) => {
      if (!user) return;
      if (user.role === 'ADMIN') {
        this.admin.getUsers().subscribe({
          next: (users) => this.trainers.set(users.filter((candidate) => candidate.role === 'FORMATEUR' && candidate.active)),
          error: () => this.adminError.set('Impossible de charger la liste des formateurs.'),
        });
      }
      this.formationLoading.set(true);
      const request = user.role === 'FORMATEUR' ? this.catalog.getMyFormations() : this.catalog.getFormations();
      request.subscribe({
        next: (items) => {
          this.formations.set(items.filter((formation) => formation.active));
          this.formationLoading.set(false);
        },
        error: (error) => {
          this.formationError.set(this.apiError(error, 'Impossible de charger les formations.'));
          this.formationLoading.set(false);
        },
      });
    });
  }

  private apiError(error: any, fallback: string): string {
    return error?.error?.details?.join(' ') || error?.error?.message || fallback;
  }
}
