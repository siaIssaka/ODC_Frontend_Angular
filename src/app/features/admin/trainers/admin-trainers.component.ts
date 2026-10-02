import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialService } from '../../../core/services/social.service';
import { AvatarComponent } from '../../../shared/avatar.component';
import { TrainerOverview } from '../../../core/models/social.model';

/** Vue admin : formateurs, photo, contenu publié et avancement de leurs apprenants. */
@Component({
  selector: 'app-admin-trainers',
  standalone: true,
  imports: [RouterLink, AvatarComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div><h1 class="text-3xl font-bold">Formateurs</h1><div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div></div>
      <a routerLink="/admin/utilisateurs" class="btn-primary">Créer un formateur</a>
    </div>
    <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      @for (t of trainers(); track t.id) {
        <article class="card border-t-4 border-t-odc-brand-orange">
          <div class="flex items-center gap-3">
            <app-avatar [photoKey]="t.photoKey" [name]="t.prenom + ' ' + t.nom" [size]="56" />
            <div class="min-w-0"><h2 class="truncate font-bold">{{ t.prenom }} {{ t.nom }}</h2>
              <p class="truncate text-xs text-odc-muted">{{ t.email }}</p>
              @if (!t.active) { <span class="badge !bg-black !text-white">Inactif</span> }</div>
          </div>
          <div class="mt-4 space-y-3">
            <h3 class="text-sm font-bold">Formations et cours attribués</h3>
            @for (formation of t.formationDetails; track formation.id) {
              <div class="rounded-lg border border-gray-200 p-3">
                <p class="text-sm font-semibold">{{ formation.title }}</p>
                @if (formation.courses.length) {
                  <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-odc-muted">
                    @for (course of formation.courses; track course.id) {
                      <li>{{ course.title }}</li>
                    }
                  </ul>
                } @else {
                  <p class="mt-1 text-xs text-odc-muted">Aucun cours dans cette formation.</p>
                }
              </div>
            } @empty {
              <p class="text-xs text-odc-muted">Aucune formation attribuée.</p>
            }
          </div>
          <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="bg-odc-gray p-2"><dt class="text-[11px] uppercase">Cours</dt><dd class="text-lg font-bold">{{ t.courses }}</dd></div>
            <div class="bg-odc-gray p-2"><dt class="text-[11px] uppercase">Leçons</dt><dd class="text-lg font-bold">{{ t.lessons }}</dd></div>
            <div class="bg-odc-gray p-2"><dt class="text-[11px] uppercase">Apprenants</dt><dd class="text-lg font-bold">{{ t.learners }}</dd></div>
          </dl>
          <p class="mt-3 text-xs font-bold">Avancement moyen des apprenants : {{ t.avgLearnerProgress }}%</p>
          <div class="mt-1 h-2 bg-gray-200" role="progressbar" [attr.aria-valuenow]="t.avgLearnerProgress" aria-valuemin="0" aria-valuemax="100">
            <div class="h-2 bg-odc-brand-orange" [style.width.%]="t.avgLearnerProgress"></div></div>
        </article>
      } @empty { <p class="text-sm text-odc-muted sm:col-span-2">Aucun formateur pour le moment.</p> }
    </div>
  `,
})
export class AdminTrainersComponent {
  readonly trainers = signal<TrainerOverview[]>([]);
  constructor() { inject(SocialService).trainers().subscribe((t) => this.trainers.set(t)); }
}
