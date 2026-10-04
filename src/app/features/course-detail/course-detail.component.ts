import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssignmentsPanelComponent } from './assignments-panel.component';
import { QuizPanelComponent } from './quiz-panel.component';
import { TrackingPanelComponent } from './tracking-panel.component';
import { LessonCompleteComponent } from './lesson-complete.component';
import { LiveClassPanelComponent } from './live-class-panel.component';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Course } from '../../core/models/course.model';
import { Lesson, Module } from '../../core/models/learning.model';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseRequest } from '../../core/models/learning.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink, AssignmentsPanelComponent, QuizPanelComponent, TrackingPanelComponent, LessonCompleteComponent, LiveClassPanelComponent],
  template: `
    <a routerLink="/catalogue" class="mb-5 inline-flex items-center gap-2 text-sm font-bold text-odc-orange hover:underline">
      <span aria-hidden="true">←</span> Retour au catalogue
    </a>

    @if (loading()) {
      <div class="card text-center text-odc-muted" role="status">Chargement du cours…</div>
    } @else if (error()) {
      <div class="card border-red-200" role="alert">
        <h1 class="text-xl font-bold">Cours indisponible</h1>
        <p class="mt-2 text-sm text-odc-muted">{{ error() }}</p>
      </div>
    } @else if (course(); as item) {
      <header class="page-hero mb-8">
        <div class="relative z-10 max-w-3xl">
          <p class="eyebrow !text-black">{{ item.level }} · {{ item.price | currency: 'XOF' : 'symbol' : '1.0-0' }}</p>
          <h1 class="mt-3 text-3xl font-bold sm:text-5xl">{{ item.title }}</h1>
          <p class="mt-4 max-w-2xl leading-7 text-black/80">{{ item.description || 'Les contenus et modules de ce cours sont présentés ci-dessous.' }}</p>
          @if (auth.role() === 'ADMIN') {
            <p class="mt-3 text-sm text-black/80">
              @if (item.createdAt) { Créé le {{ item.createdAt | date: 'dd/MM/yyyy à HH:mm' }} }
              @else { Date de création non disponible pour ce cours historique. }
              @if (item.createdByName) { par {{ item.createdByName }} }
              @else { · créateur non renseigné }
            </p>
          }
        </div>
        <div class="pointer-events-none absolute -right-14 -top-16 h-60 w-60 rounded-full border-[34px] border-white/30" aria-hidden="true"></div>
      </header>
      @if (auth.role() === 'APPRENANT' && !enrolled()) {
        <section class="card border-orange-200 bg-orange-50" aria-labelledby="enrollment-required-title">
          <p class="eyebrow">Accès réservé</p>
          <h2 id="enrollment-required-title" class="mt-1 text-xl font-bold">Vous n’êtes pas encore inscrit à ce cours</h2>
          <p class="mt-2 text-sm leading-6 text-odc-navy">
            Vous pouvez consulter cette formation dans le catalogue. L’accès aux modules, leçons et ressources sera activé dès que l’administrateur vous aura inscrit.
          </p>
          <a routerLink="/catalogue" class="btn-secondary mt-4">Retour au catalogue</a>
        </section>
      } @else {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section class="space-y-6" aria-label="Contenu pédagogique">
          <div class="card">
            <div class="mb-5 flex items-start justify-between gap-4">
              <div><p class="eyebrow">Parcours d’apprentissage</p><h2 class="mt-1 text-2xl font-bold">Modules</h2></div>
              <span class="badge">{{ modules().length }} module(s)</span>
            </div>
            @if (modules().length === 0) {
              <p class="text-sm text-odc-muted">Aucun module n’a encore été ajouté à ce cours.</p>
            } @else {
              <ol class="space-y-3">
                @for (module of modules(); track module.id; let index = $index) {
                  <li class="flex gap-4 rounded-xl border border-gray-200 p-4">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-odc-orange-light font-bold text-odc-orange">{{ module.orderIndex || index + 1 }}</span>
                    <div><h3 class="font-bold">{{ module.title }}</h3><p class="mt-1 text-sm leading-6 text-odc-muted">{{ module.description || 'Aucune description.' }}</p></div>
                  </li>
                }
              </ol>
            }
          </div>

          <div class="card">
            <div class="mb-5 flex items-start justify-between gap-4">
              <div><p class="eyebrow">Contenu en texte</p><h2 class="mt-1 text-2xl font-bold">Leçons</h2></div>
              <span class="badge">{{ lessons().length }} leçon(s)</span>
            </div>
            <p class="mb-4 text-sm text-odc-muted">L’API rattache les leçons directement au cours et expose leur contenu sous forme de texte.</p>
            @if (lessons().length === 0) {
              <p class="text-sm text-odc-muted">Aucun contenu pédagogique n’est disponible pour le moment.</p>
            } @else {
              <div class="space-y-4">
                @for (lesson of lessons(); track lesson.id; let index = $index) {
                  <article class="rounded-xl border border-gray-200 p-4 sm:p-5">
                    <p class="eyebrow">Leçon {{ index + 1 }}</p>
                    <h3 class="mt-1 text-lg font-bold">{{ lesson.title }}</h3>
                    @if (auth.role() === 'APPRENANT') { <app-lesson-complete [courseId]="courseId" [lessonId]="lesson.id" /> }
                    @if (lesson.durationMinutes) { <p class="mt-1 text-xs text-odc-muted">{{ lesson.durationMinutes }} min</p> }
                    @if (lesson.content) {
                      <div class="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-odc-navy">{{ lesson.content }}</div>
                    } @else {
                      <p class="mt-3 text-sm italic text-odc-muted">Cette leçon ne contient pas encore de texte.</p>
                    }
                    @if (lesson.videoUrl) {
                      @if (isUploadedMedia(lesson.videoUrl)) {
                        <video class="mt-4 w-full rounded-lg bg-black" controls preload="metadata" [src]="resourceHref(lesson.videoUrl)">
                          Votre navigateur ne peut pas lire cette vidéo.
                        </video>
                        <a class="mt-2 inline-flex text-sm font-bold text-odc-orange underline" [href]="downloadHref(lesson.videoUrl)" download>Télécharger la vidéo</a>
                      } @else {
                        <a class="mt-4 inline-flex text-sm font-bold text-odc-orange underline" [href]="lesson.videoUrl" target="_blank" rel="noopener noreferrer">Voir la vidéo externe</a>
                      }
                    }
                    @if (lesson.documentUrl) {
                      @if (isUploadedPdf(lesson.documentUrl)) {
                        <button type="button" class="btn-secondary mt-4 !px-3 !py-2 text-sm" (click)="openPdf(lesson)">
                          Ouvrir le document
                        </button>
                      } @else if (isUploadedMedia(lesson.documentUrl)) {
                        <div class="mt-4 flex items-center justify-between gap-3">
                          <p class="text-sm">Ce format DOCX/PPTX ne peut pas être prévisualisé dans le navigateur.</p>
                          <a class="btn-secondary !px-3 !py-2 text-sm" [href]="downloadHref(lesson.documentUrl)" download>Télécharger le document</a>
                        </div>
                      } @else {
                        <a class="mt-4 inline-flex text-sm font-bold text-odc-orange underline" [href]="lesson.documentUrl" target="_blank" rel="noopener noreferrer">Ouvrir le document externe</a>
                      }
                    }
                  </article>
                }
              </div>
            }
          </div>
        </section>

        <aside class="space-y-5">
          @if (canEditCourse()) {
            <section class="card" aria-labelledby="module-form-title">
              <p class="eyebrow">Espace formateur</p>
              <h2 id="module-form-title" class="mt-1 text-lg font-bold">Ajouter un module</h2>
              <form class="mt-4 space-y-3" [formGroup]="moduleForm" (ngSubmit)="createModule()">
                <label class="block text-sm font-semibold">Titre<input class="input-field mt-1" formControlName="title" /></label>
                <label class="block text-sm font-semibold">Description<textarea class="input-field mt-1" rows="3" formControlName="description"></textarea></label>
                <button class="btn-primary w-full" type="submit" [disabled]="moduleForm.invalid || creatingModule()">{{ creatingModule() ? 'Ajout…' : 'Ajouter le module' }}</button>
              </form>
              @if (moduleError()) { <p class="mt-3 text-sm text-red-700" role="alert">{{ moduleError() }}</p> }
            </section>
          }

          @if (canEditCourse()) {
            <section class="card" aria-labelledby="lesson-form-title">
              <p class="eyebrow">Espace formateur</p>
              <h2 id="lesson-form-title" class="mt-1 text-lg font-bold">Ajouter une leçon texte</h2>
              <form class="mt-4 space-y-3" [formGroup]="lessonForm" (ngSubmit)="createLesson()">
                <label class="block text-sm font-semibold">Titre<input class="input-field mt-1" formControlName="title" /></label>
                <label class="block text-sm font-semibold">Module (facultatif)
                  <select class="input-field mt-1" formControlName="moduleId"><option [ngValue]="null">Sans module</option>@for (module of modules(); track module.id) { <option [ngValue]="module.id">{{ module.title }}</option> }</select>
                </label>
                <label class="block text-sm font-semibold">Contenu
                  <textarea class="input-field mt-1 min-h-40" rows="7" formControlName="content" placeholder="Rédigez le contenu de la leçon…"></textarea>
                </label>
                <label class="block text-sm font-semibold">Vidéo depuis votre appareil (MP4, WEBM, MOV · 100 Mo max)
                  <input class="input-field mt-1" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" (change)="selectVideo($event)" />
                </label>
                @if (selectedVideo()) { <p class="text-xs text-odc-muted">Vidéo sélectionnée : {{ selectedVideo()?.name }}</p> }
                <label class="block text-sm font-semibold">Document depuis votre appareil (PDF, DOCX, PPTX · 20 Mo max)
                  <input class="input-field mt-1" type="file" accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" (change)="selectDocument($event)" />
                </label>
                @if (selectedDocument()) { <p class="text-xs text-odc-muted">Document sélectionné : {{ selectedDocument()?.name }}</p> }
                <p class="text-xs text-odc-muted">Ou renseignez un lien externe si le fichier est déjà hébergé.</p>
                <label class="block text-sm font-semibold">Lien vidéo externe<input class="input-field mt-1" type="url" formControlName="videoUrl" placeholder="https://…" /></label>
                <label class="block text-sm font-semibold">Lien document externe<input class="input-field mt-1" type="url" formControlName="documentUrl" placeholder="https://…" /></label>
                <label class="block text-sm font-semibold">Durée en minutes<input class="input-field mt-1" type="number" min="1" formControlName="durationMinutes" /></label>
                <button class="btn-primary w-full" type="submit" [disabled]="lessonForm.invalid || creatingLesson()">{{ creatingLesson() ? 'Publication…' : 'Publier la leçon' }}</button>
              </form>
              @if (lessonError()) { <p class="mt-3 text-sm text-red-700" role="alert">{{ lessonError() }}</p> }
            </section>
          }

          @if (course()?.formationId) {
            <a [routerLink]="['/forum', course()!.formationId]" class="btn-primary w-full">Forum de la formation</a>
          }
          @if (canEditCourse()) {
            <section class="card">
              <h2 class="font-bold">Modifier le cours</h2>
              @if (!editingCourse()) {
                <button class="btn-secondary mt-3 w-full" type="button" (click)="startCourseEdit()">Modifier les informations du cours</button>
              } @else {
                <form class="mt-3 space-y-3" [formGroup]="courseForm" (ngSubmit)="saveCourse()">
                  <label class="block text-sm font-semibold">Titre<input class="input-field mt-1" formControlName="title" /></label>
                  <label class="block text-sm font-semibold">Niveau<input class="input-field mt-1" formControlName="level" /></label>
                  <label class="block text-sm font-semibold">Prix (XOF)<input class="input-field mt-1" type="number" min="0" formControlName="price" /></label>
                  <label class="block text-sm font-semibold">Description<textarea class="input-field mt-1" rows="3" formControlName="description"></textarea></label>
                  <div class="flex gap-2">
                    <button class="btn-primary flex-1" type="submit" [disabled]="courseForm.invalid || savingCourse()">Enregistrer</button>
                    <button class="btn-secondary" type="button" (click)="editingCourse.set(false)">Annuler</button>
                  </div>
                </form>
              }
              <button class="mt-3 w-full border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                type="button" [disabled]="deletingCourse()" (click)="deleteCourse()">
                {{ deletingCourse() ? 'Suppression…' : 'Supprimer ce cours' }}
              </button>
              @if (courseEditMessage()) { <p class="mt-2 text-sm" role="status">{{ courseEditMessage() }}</p> }
            </section>
          }
          <app-quiz-panel [courseId]="courseId" [canManage]="canEditCourse()" />
          @if (auth.role() === 'FORMATEUR' || auth.role() === 'ADMIN') { <app-tracking-panel [courseId]="courseId" /> }
          <app-live-class-panel [courseId]="courseId" [enrolled]="enrolled()" [canManage]="canEditCourse()" />
          <app-assignments-panel [courseId]="courseId" [canManage]="canEditCourse()" [enrolled]="enrolled()" />

          <section class="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <h2 class="font-bold">Ressources disponibles</h2>
            <p class="mt-2 text-sm leading-6 text-odc-navy">Les formateurs peuvent joindre une vidéo ou un document depuis leur appareil. Les fichiers sont stockés dans le dossier configuré sur le serveur.</p>
          </section>
        </aside>
      </div>
      }
    }
    @if (openedPdf(); as pdf) {
      <div class="fixed inset-0 z-50 flex flex-col bg-[#252525]" role="dialog" aria-modal="true" [attr.aria-label]="'Lecteur PDF : ' + pdf.title">
        <header class="flex min-h-14 items-center justify-between gap-3 bg-[#3c3c3c] px-4 py-2 text-white shadow-lg">
          <h2 class="truncate text-sm font-semibold sm:text-base">{{ pdf.title }}</h2>
          <div class="flex shrink-0 items-center gap-2">
            <a class="rounded p-2 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              [href]="downloadHref(pdf.url)" [attr.download]="pdf.title + '.pdf'" [attr.aria-label]="'Télécharger ' + pdf.title" title="Télécharger">
              <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5M12 15V3" />
              </svg>
            </a>
            <button type="button" class="rounded px-3 py-2 text-sm font-semibold hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              (click)="closePdf()" aria-label="Fermer le lecteur PDF" title="Fermer">
              Fermer
            </button>
          </div>
        </header>
        @if (pdfLoading()) {
          <p class="m-auto text-white" role="status">Chargement du document…</p>
        } @else if (pdfError()) {
          <div class="m-auto max-w-lg px-6 text-center text-white" role="alert">
            <p>{{ pdfError() }}</p>
            <a class="mt-4 inline-flex rounded bg-white px-4 py-2 font-bold text-black"
              [href]="downloadHref(pdf.url)">Télécharger le PDF</a>
          </div>
        } @else if (pdf.viewerUrl) {
          <iframe class="min-h-0 w-full flex-1 bg-[#252525]" [src]="pdf.viewerUrl" [title]="'Lecture de ' + pdf.title"></iframe>
        }
      </div>
    }
  `,
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly course = signal<Course | null>(null);
  readonly modules = signal<Module[]>([]);
  readonly lessons = signal<Lesson[]>([]);
  readonly loading = signal(true);
  readonly creatingModule = signal(false);
  readonly creatingLesson = signal(false);
  readonly selectedVideo = signal<File | null>(null);
  readonly selectedDocument = signal<File | null>(null);
  readonly error = signal<string | null>(null);
  readonly moduleError = signal<string | null>(null);
  readonly lessonError = signal<string | null>(null);
  readonly enrolled = signal(false);
  readonly editingCourse = signal(false);
  readonly savingCourse = signal(false);
  readonly deletingCourse = signal(false);
  readonly courseEditMessage = signal<string | null>(null);
  readonly openedPdf = signal<{ title: string; url: string; viewerUrl: SafeResourceUrl | null } | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfError = signal<string | null>(null);
  private pdfRequestId = 0;
  private pdfObjectUrl: string | null = null;
  courseId = 0;
  private readonly apiOrigin = new URL(environment.apiUrl).origin;

  canEditCourse(): boolean {
    const course = this.course();
    const userId = this.auth.currentUser()?.id;
    return this.auth.role() === 'FORMATEUR' && !!course
      && (course.createdById === userId || course.createdById === null);
  }

  readonly moduleForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
  });
  readonly lessonForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: [''],
    moduleId: this.fb.control<number | null>(null),
    videoUrl: [''],
    documentUrl: [''],
    durationMinutes: this.fb.control<number | null>(null),
  });
  readonly courseForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    level: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.courseId) || this.courseId <= 0) {
      this.error.set('Identifiant de cours invalide.');
      this.loading.set(false);
      return;
    }
    const user = this.auth.currentUser();
    if (user?.role === 'APPRENANT') {
      forkJoin({
        course: this.catalog.getCourse(this.courseId),
        enrollments: this.catalog.getEnrollments(user.id),
      }).subscribe({
        next: ({ course, enrollments }) => {
          this.course.set(course);
          this.enrolled.set(enrollments.some((e) => e.courseId === this.courseId && e.status === 'ACTIVE'));
          if (!this.enrolled()) {
            this.loading.set(false);
            return;
          }
          this.loadCourseContent();
        },
        error: (error) => {
          this.error.set(error?.status === 404
            ? 'Ce cours n’existe pas ou n’est plus disponible.'
            : 'Impossible de vérifier votre inscription. Actualisez la page ou contactez l’administrateur.');
          this.loading.set(false);
        },
      });
      return;
    }

    forkJoin({
      course: this.catalog.getCourse(this.courseId),
      modules: this.catalog.getModules(this.courseId),
      lessons: this.catalog.getLessons(this.courseId),
    }).subscribe({
      next: ({ course, modules, lessons }) => {
        this.course.set(course);
        this.modules.set(modules.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
        this.lessons.set(lessons);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.status === 403
          ? 'Votre compte n’est pas autorisé à consulter ce cours.'
          : error?.status === 404
            ? 'Ce cours n’existe pas ou n’est plus disponible.'
            : 'Impossible de charger le contenu du cours. Réessayez plus tard.');
        this.loading.set(false);
      },
    });
  }

  private loadCourseContent(): void {
    forkJoin({
      modules: this.catalog.getModules(this.courseId),
      lessons: this.catalog.getLessons(this.courseId),
    }).subscribe({
      next: ({ modules, lessons }) => {
        this.modules.set(modules.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
        this.lessons.set(lessons);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le contenu du cours. Réessayez plus tard.');
        this.loading.set(false);
      },
    });
  }

  createModule(): void {
    if (this.moduleForm.invalid || this.creatingModule()) return;
    this.creatingModule.set(true);
    this.moduleError.set(null);
    this.catalog.createModule(this.courseId, {
      ...this.moduleForm.getRawValue(),
      orderIndex: this.modules().length + 1,
    }).subscribe({
      next: (module) => {
        this.modules.update((items) => [...items, module].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
        this.moduleForm.reset();
        this.creatingModule.set(false);
      },
      error: (error) => {
        this.moduleError.set(this.apiMessage(error, 'Impossible d’ajouter le module. Vérifiez que cette formation vous est attribuée.'));
        this.creatingModule.set(false);
      },
    });
  }

  createLesson(): void {
    if (this.lessonForm.invalid || this.creatingLesson()) return;
    this.creatingLesson.set(true);
    this.lessonError.set(null);
    const values = this.lessonForm.getRawValue();
    const payload = {
      ...values,
      videoUrl: values.videoUrl.trim() || null,
      documentUrl: values.documentUrl.trim() || null,
      orderIndex: this.lessons().length,
    };
    this.catalog.createLessonWithFiles(this.courseId, payload, this.selectedVideo(), this.selectedDocument()).subscribe({
      next: (lesson) => {
        this.lessons.update((items) => [...items, lesson]);
        this.lessonForm.reset();
        this.selectedVideo.set(null);
        this.selectedDocument.set(null);
        this.creatingLesson.set(false);
      },
      error: (error) => {
        this.lessonError.set(this.apiMessage(error, 'Impossible de publier cette leçon.'));
        this.creatingLesson.set(false);
      },
    });
  }

  selectVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > 100 * 1024 * 1024) {
      this.lessonError.set('La vidéo doit faire au maximum 100 Mo.');
      input.value = '';
      this.selectedVideo.set(null);
      return;
    }
    this.lessonError.set(null);
    this.selectedVideo.set(file);
  }

  resourceHref(url: string): string {
    try {
      const parsed = new URL(url, this.apiOrigin);
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (parsed.pathname.startsWith('/api/v1/media/')
        && (url.startsWith('/') || parsed.origin === this.apiOrigin || isLocalHost)) {
        return `${this.apiOrigin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  isUploadedMedia(url: string): boolean {
    return this.resourceHref(url).startsWith(this.apiOrigin + '/api/v1/media/');
  }

  isUploadedPdf(url: string): boolean {
    return this.isUploadedMedia(url) && (url.toLowerCase().split('?')[0] ?? '').endsWith('.pdf');
  }

  downloadHref(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${this.resourceHref(url)}${separator}download=true`;
  }

  openPdf(lesson: Lesson): void {
    if (!lesson.documentUrl || !this.isUploadedPdf(lesson.documentUrl)) return;
    this.closePdf();
    const requestId = ++this.pdfRequestId;
    this.openedPdf.set({ title: lesson.title, url: lesson.documentUrl, viewerUrl: null });
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    this.catalog.getMediaBlob(this.resourceHref(lesson.documentUrl)).subscribe({
      next: (blob) => {
        if (requestId !== this.pdfRequestId) return;
        if (blob.type !== 'application/pdf' && !blob.type.endsWith('+pdf')) {
          this.pdfError.set('Le fichier reçu n’est pas un PDF lisible.');
          this.pdfLoading.set(false);
          return;
        }
        this.pdfObjectUrl = URL.createObjectURL(blob);
        const viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
        this.openedPdf.update((pdf) => pdf ? { ...pdf, viewerUrl } : null);
        this.pdfLoading.set(false);
      },
      error: () => {
        if (requestId !== this.pdfRequestId) return;
        this.pdfError.set('Impossible de charger le PDF dans le lecteur. Vous pouvez le télécharger.');
        this.pdfLoading.set(false);
      },
    });
  }

  closePdf(): void {
    this.pdfRequestId += 1;
    if (this.pdfObjectUrl) URL.revokeObjectURL(this.pdfObjectUrl);
    this.pdfObjectUrl = null;
    this.openedPdf.set(null);
    this.pdfLoading.set(false);
    this.pdfError.set(null);
  }

  ngOnDestroy(): void {
    this.closePdf();
  }

  startCourseEdit(): void {
    const item = this.course();
    if (!item) return;
    this.courseForm.setValue({
      title: item.title,
      description: item.description ?? '',
      level: item.level,
      price: item.price,
    });
    this.courseEditMessage.set(null);
    this.editingCourse.set(true);
  }

  saveCourse(): void {
    const item = this.course();
    if (!item || this.courseForm.invalid || this.savingCourse()) return;
    this.savingCourse.set(true);
    const request: CourseRequest = this.courseForm.getRawValue();
    this.catalog.updateCourse(item.id, request).subscribe({
      next: (updated) => {
        this.course.set(updated);
        this.editingCourse.set(false);
        this.courseEditMessage.set('Cours mis à jour.');
        this.savingCourse.set(false);
      },
      error: (error) => {
        this.courseEditMessage.set(error?.error?.message ?? 'Impossible de modifier le cours.');
        this.savingCourse.set(false);
      },
    });
  }

  deleteCourse(): void {
    const item = this.course();
    if (!item || this.deletingCourse()) return;
    const warning = `Supprimer « ${item.title} » ? Les modules, leçons, PDF/vidéos, devoirs et dépôts, inscriptions et progressions associés seront également supprimés. Cette action est irréversible.`;
    if (!confirm(warning)) return;
    this.deletingCourse.set(true);
    this.catalog.deleteCourse(item.id).subscribe({
      next: () => this.router.navigateByUrl('/catalogue'),
      error: (error) => {
        this.courseEditMessage.set(error?.error?.message ?? 'Impossible de supprimer le cours.');
        this.deletingCourse.set(false);
      },
    });
  }

  selectDocument(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > 20 * 1024 * 1024) {
      this.lessonError.set('Le document doit faire au maximum 20 Mo.');
      input.value = '';
      this.selectedDocument.set(null);
      return;
    }
    this.lessonError.set(null);
    this.selectedDocument.set(file);
  }

  private apiMessage(error: any, fallback: string): string {
    return error?.error?.details?.join(' ') || error?.error?.message || fallback;
  }
}
