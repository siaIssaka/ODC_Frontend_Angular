import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Assignment, EnrollmentInfo, ProgressInfo } from '../../core/models/formation.model';

/** Espace apprenant (inspiré de la maquette Moodle) aux couleurs Orange : orange #FF7900, noir, blanc. */
@Component({
  selector: 'app-learner-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <nav class="text-sm text-odc-muted" aria-label="Fil d'Ariane">Tableau de bord › <span class="text-black">Mes cours</span></nav>
    <h1 class="mt-1 text-3xl font-bold text-black sm:text-4xl">Bonjour, {{ auth.displayName() }}</h1>
    <div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section aria-label="Mes cours">
        <div class="flex flex-wrap items-center justify-between gap-4 border-2 border-black bg-white p-4">
          <a routerLink="/catalogue" class="btn-primary">Explorer le catalogue</a>
          <div class="flex items-center gap-3">
            <span class="text-sm text-odc-muted">Progression générale</span>
            <div class="relative flex h-14 w-14 items-center justify-center rounded-full"
                 [style.background]="'conic-gradient(#FF7900 ' + overall() * 3.6 + 'deg, #e5e5e5 0)'">
              <span class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold">{{ overall() }}%</span>
            </div>
          </div>
        </div>

        <h2 class="mt-6 text-lg font-bold">Mes formations</h2>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          @for (c of rows(); track c.enrollmentId) {
            <a [routerLink]="['/cours', c.courseId]" class="card block border-t-4 border-t-odc-brand-orange transition hover:shadow-lg">
              <h3 class="font-bold">{{ c.title }}</h3>
              @if (c.sessionName) {
                <p class="mt-1 text-sm text-odc-muted">{{ c.sessionName }} · {{ c.sessionStartsAt | date: 'dd/MM/yyyy' }} – {{ c.sessionEndsAt | date: 'dd/MM/yyyy' }}</p>
              }
              <div class="mt-4 h-2 w-full bg-gray-200" role="progressbar" [attr.aria-valuenow]="c.pct" aria-valuemin="0" aria-valuemax="100">
                <div class="h-2 bg-odc-brand-orange" [style.width.%]="c.pct"></div>
              </div>
              <p class="mt-2 text-xs text-odc-muted">{{ c.done }}/{{ c.total }} leçons · {{ c.pct }}%</p>
            </a>
          } @empty {
            <p class="text-sm text-odc-muted sm:col-span-2">{{ loading() ? 'Chargement…' : "Vous n'êtes inscrit à aucun cours pour l'instant." }}</p>
          }
        </div>
      </section>

      <aside class="space-y-4" aria-label="Progression et échéances">
        <div class="bg-black p-4 text-white">
          <p class="text-lg font-bold text-odc-brand-orange">Progressez !</p>
          <p class="mt-2 text-sm">{{ doneLessons() }} leçon(s) terminée(s). Continuez pour atteindre 100 %.</p>
        </div>
        <div class="card">
          <h2 class="font-bold">Devoirs à rendre</h2>
          <ul class="mt-3 space-y-3">
            @for (a of assignments(); track a.id) {
              <li class="border-l-4 pl-3" [class.border-odc-brand-orange]="a.status === 'OUVERT'" [class.border-gray-300]="a.status !== 'OUVERT'">
                <a [routerLink]="['/cours', a.courseId]" class="text-sm font-bold hover:underline">{{ a.title }}</a>
                <p class="text-xs text-odc-muted">{{ a.courseTitle }} · fermeture {{ a.closesAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                <span class="badge mt-1">{{ a.submitted ? (a.grade !== null ? 'Noté ' + a.grade + '/20' : 'Rendu') : a.status === 'OUVERT' ? 'À rendre' : a.status === 'FERME' ? 'Fermé' : 'Planifié' }}</span>
              </li>
            } @empty {
              <li class="text-sm text-odc-muted">Aucun devoir pour le moment.</li>
            }
          </ul>
        </div>
      </aside>
    </div>
  `,
})
export class LearnerDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  readonly loading = signal(true);
  private readonly enrollments = signal<EnrollmentInfo[]>([]);
  private readonly progress = signal<ProgressInfo[]>([]);
  readonly assignments = signal<Assignment[]>([]);

  readonly rows = computed(() =>
    this.enrollments().map((e) => {
      const p = this.progress().find((x) => x.courseId === e.courseId);
      return {
        enrollmentId: e.id,
        courseId: e.courseId,
        title: e.courseTitle,
        sessionName: e.sessionName,
        sessionStartsAt: e.sessionStartsAt,
        sessionEndsAt: e.sessionEndsAt,
        done: p?.completedLessons ?? 0,
        total: p?.totalLessons ?? 0,
        pct: Math.round(p?.percentage ?? 0),
      };
    }),
  );
  readonly overall = computed(() => {
    const r = this.rows();
    return r.length ? Math.round(r.reduce((s, x) => s + x.pct, 0) / r.length) : 0;
  });
  readonly doneLessons = computed(() => this.rows().reduce((s, x) => s + x.done, 0));

  constructor() {
    const id = this.auth.currentUser()?.id;
    if (!id) return;
    forkJoin([
      this.catalog.getEnrollments(id).pipe(catchError(() => of([]))),
      this.catalog.getProgress(id).pipe(catchError(() => of([]))),
      this.catalog.getMyAssignments().pipe(catchError(() => of([]))),
    ]).subscribe(([e, p, a]) => {
      this.enrollments.set(e);
      this.progress.set(p);
      this.assignments.set(a);
      this.loading.set(false);
    });
  }
}
