import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminCohortOverview } from '../../../core/models/learning.model';
import { CatalogService } from '../../../core/services/catalog.service';

@Component({
  selector: 'app-admin-cohorts',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Cohortes et apprenants</h1>
        <div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div>
        <p class="mt-3 text-sm text-odc-muted">Consultez les périodes, formations, cours et apprenants inscrits pour chaque cohorte.</p>
      </div>
      <a routerLink="/admin/utilisateurs" class="btn-primary">Gérer les cohortes</a>
    </div>

    @if (error()) {
      <p class="card mt-6 border-red-200 bg-red-50 text-red-700" role="alert">{{ error() }}</p>
      <button class="btn-secondary mt-3" type="button" (click)="load()">Réessayer</button>
    } @else if (loading()) {
      <p class="mt-6 text-sm text-odc-muted" role="status">Chargement des cohortes…</p>
    } @else if (!cohorts().length) {
      <p class="card mt-6 text-sm text-odc-muted">Aucune cohorte n’a encore été créée.</p>
    } @else {
      <div class="mt-6 grid gap-4 xl:grid-cols-2">
        @for (cohort of cohorts(); track cohort.id) {
          <article class="card border-t-4 border-t-odc-brand-orange">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-odc-muted">{{ cohort.formationTitle || 'Formation historique non renseignée' }}</p>
                <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-odc-muted">Type / nom de cohorte</p>
                <h2 class="text-lg font-bold">{{ cohort.name }}</h2>
              </div>
              <span class="rounded-full bg-odc-gray px-3 py-1 text-xs font-semibold">{{ cohort.enrolledLearners.length }} apprenant(s)</span>
            </div>
            <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt class="text-xs font-semibold uppercase text-odc-muted">Début</dt><dd class="mt-1">{{ cohort.startsAt | date: 'dd/MM/yyyy HH:mm' }}</dd></div>
              <div><dt class="text-xs font-semibold uppercase text-odc-muted">Fin</dt><dd class="mt-1">{{ cohort.endsAt | date: 'dd/MM/yyyy HH:mm' }}</dd></div>
            </dl>
            <div class="mt-4">
              <h3 class="text-sm font-semibold">Cours de la cohorte</h3>
              @if (cohort.courses.length) {
                <ul class="mt-1 list-disc pl-5 text-sm text-odc-muted">
                  @for (course of cohort.courses; track course.id) { <li>{{ course.title }}</li> }
                </ul>
              } @else {
                <p class="mt-1 text-sm text-odc-muted">Aucun cours associé.</p>
              }
            </div>
            <details class="mt-4 border-t border-gray-200 pt-3">
              <summary class="cursor-pointer text-sm font-semibold text-odc-orange">
                Apprenants inscrits ({{ cohort.enrolledLearners.length }})
              </summary>
              @if (cohort.enrolledLearners.length) {
                <div class="mt-3 overflow-x-auto">
                  <table class="w-full min-w-[420px] text-left text-sm">
                    <thead class="border-b border-gray-200 text-xs uppercase text-odc-muted">
                      <tr><th class="py-2 pr-3">Apprenant</th><th class="py-2 pr-3">Email</th><th class="py-2">Cours inscrits</th></tr>
                    </thead>
                    <tbody>
                      @for (entry of cohort.enrolledLearners; track entry.learner.id) {
                        <tr class="border-b border-gray-100 last:border-0">
                          <td class="py-2 pr-3 font-medium">{{ entry.learner.prenom }} {{ entry.learner.nom }}</td>
                          <td class="py-2 pr-3">{{ entry.learner.email }}</td>
                          <td class="py-2">{{ courseTitles(cohort, entry.courseIds) || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="mt-3 text-sm text-odc-muted">Aucun apprenant inscrit.</p>
              }
            </details>
          </article>
        }
      </div>
    }
  `,
})
export class AdminCohortsComponent {
  private readonly catalog = inject(CatalogService);
  readonly cohorts = signal<AdminCohortOverview[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.getAdminCohorts().subscribe({
      next: (cohorts) => {
        this.cohorts.set(cohorts);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Impossible de charger les cohortes et les apprenants inscrits.');
        this.loading.set(false);
      },
    });
  }

  courseTitles(cohort: AdminCohortOverview, courseIds: number[]): string {
    const enrolled = new Set(courseIds);
    return cohort.courses.filter((course) => enrolled.has(course.id)).map((course) => course.title).join(', ');
  }
}
