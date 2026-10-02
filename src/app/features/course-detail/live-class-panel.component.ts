import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LiveSession } from '../../core/models/learning.model';
import { JitsiRoomComponent } from './jitsi-room.component';

@Component({
  selector: 'app-live-class-panel',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, JitsiRoomComponent],
  template: `
    <section class="card" aria-labelledby="live-title">
      <div class="flex items-start justify-between gap-2">
        <div><p class="eyebrow">Classe virtuelle</p><h2 id="live-title" class="mt-1 text-lg font-bold">Appels en direct</h2></div>
        <button type="button" class="text-sm font-bold text-odc-orange underline" (click)="load()">Actualiser</button>
      </div>

      @for (session of sessions(); track session.id) {
        <article class="mt-3 rounded-lg border border-gray-200 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-semibold">{{ session.title }}</h3>
              <p class="text-xs text-odc-muted">{{ session.scheduledAt | date: 'dd/MM/yyyy à HH:mm' }}</p>
            </div>
            <span class="badge">{{ session.status === 'PLANIFIE' ? 'Planifié' : session.status === 'PREPARATION' ? 'Préparation' : session.status === 'EN_COURS' ? 'En cours' : 'Terminé' }}</span>
          </div>

          @if (canManage() && session.status === 'PLANIFIE') {
            <button type="button" class="btn-primary mt-3" [disabled]="busyId() === session.id" (click)="start(session)">Démarrer l’appel</button>
          }
          @if (canManage() && session.status === 'EN_COURS') {
            <button type="button" class="btn-secondary mt-3" [disabled]="busyId() === session.id" (click)="end(session)">Terminer l’appel</button>
          }
          @if (canManage() && session.status === 'PREPARATION') {
            <p class="mt-3 text-sm">Rejoignez la salle ci-dessous en premier, puis ouvrez-la aux apprenants.</p>
            <button type="button" class="btn-primary mt-3" [disabled]="busyId() === session.id" (click)="publish(session)">Ouvrir la salle aux apprenants</button>
          }
          @if (session.status === 'EN_COURS' && session.roomName) {
            <app-jitsi-room [roomName]="session.roomName" />
          } @else if (session.status === 'PREPARATION' && session.roomName) {
            <app-jitsi-room [roomName]="session.roomName" />
          } @else if (session.status === 'PREPARATION' && enrolled()) {
            <p class="mt-3 text-sm">Le formateur prépare la salle. Vous pourrez rejoindre après son ouverture.</p>
          } @else if (session.status === 'EN_COURS' && enrolled()) {
            <p class="mt-3 text-sm">L’appel est en cours. Actualisez pour le rejoindre.</p>
          }
        </article>
      } @empty {
        <p class="mt-3 text-sm text-odc-muted">Aucun appel planifié pour ce cours.</p>
      }

      @if (canManage()) {
        <form class="mt-5 space-y-3 border-t border-gray-200 pt-4" [formGroup]="form" (ngSubmit)="schedule()">
          <h3 class="font-semibold">Planifier un appel</h3>
          <label class="block text-sm font-semibold">Titre<input class="input-field mt-1" formControlName="title" placeholder="Ex. Séance de questions-réponses" /></label>
          <label class="block text-sm font-semibold">Date et heure<input class="input-field mt-1" type="datetime-local" formControlName="scheduledAt" /></label>
          <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || saving()">Planifier l’appel</button>
        </form>
      }
      @if (message()) { <p class="mt-3 text-sm" [class.text-red-700]="hasError()" role="status">{{ message() }}</p> }
      <p class="mt-3 text-xs text-odc-muted">Les apprenants inscrits peuvent rejoindre la séance lorsqu’elle est démarrée par le formateur.</p>
    </section>
  `,
})
export class LiveClassPanelComponent {
  readonly courseId = input.required<number>();
  readonly canManage = input(false);
  readonly enrolled = input(false);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly sessions = signal<LiveSession[]>([]);
  readonly busyId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly hasError = signal(false);
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    scheduledAt: ['', Validators.required],
  });

  private readonly refreshOnAccessChange = effect(() => {
    if (this.auth.role() === 'APPRENANT' && !this.enrolled()) {
      this.sessions.set([]);
      return;
    }
    if (this.auth.role() === 'FORMATEUR' && !this.canManage()) return;
    this.load();
  });

  load(): void {
    if ((this.auth.role() === 'APPRENANT' && !this.enrolled())
      || (this.auth.role() === 'FORMATEUR' && !this.canManage())) {
      this.sessions.set([]);
      return;
    }
    this.catalog.getLiveSessions(this.courseId()).subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: (error) => {
        this.hasError.set(true);
        this.message.set(error?.error?.message ?? 'Impossible de charger les appels.');
      },
    });
  }

  schedule(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.message.set(null);
    const values = this.form.getRawValue();
    this.catalog.scheduleLiveSession(this.courseId(), values.title, values.scheduledAt).subscribe({
      next: () => {
        this.form.reset();
        this.saving.set(false);
        this.hasError.set(false);
        this.message.set('Appel planifié.');
        this.load();
      },
      error: (error) => {
        this.saving.set(false);
        this.hasError.set(true);
        this.message.set(error?.error?.message ?? 'Impossible de planifier cet appel.');
      },
    });
  }

  start(session: LiveSession): void {
    this.busyId.set(session.id);
    this.catalog.startLiveSession(session.id).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: (error) => {
        this.busyId.set(null);
        this.hasError.set(true);
        this.message.set(error?.error?.message ?? 'Impossible de démarrer cet appel.');
      },
    });
  }

  publish(session: LiveSession): void {
    this.busyId.set(session.id);
    this.catalog.publishLiveSession(session.id).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: (error) => {
        this.busyId.set(null);
        this.hasError.set(true);
        this.message.set(error?.error?.message ?? 'Impossible d’ouvrir cette salle aux apprenants.');
      },
    });
  }

  end(session: LiveSession): void {
    this.busyId.set(session.id);
    this.catalog.endLiveSession(session.id).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: (error) => {
        this.busyId.set(null);
        this.hasError.set(true);
        this.message.set(error?.error?.message ?? 'Impossible de terminer cet appel.');
      },
    });
  }
}
