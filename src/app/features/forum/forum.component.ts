import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialService } from '../../core/services/social.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { Contact, ForumPost, ForumThread } from '../../core/models/social.model';

/** Forum d'une formation (route /forum/:formationId). */
@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, AvatarComponent],
  template: `
    <a routerLink="/catalogue" class="text-sm font-bold text-odc-orange hover:underline">← Catalogue</a>
    <h1 class="mt-2 text-3xl font-bold">Forum de la formation</h1>
    <div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div>
    @if (error()) { <p class="card mt-5" role="alert">{{ error() }}</p> }
    @else if (open(); as t) {
      <button type="button" class="btn-secondary mt-5" (click)="open.set(null)">← Toutes les discussions</button>
      <article class="card mt-4">
        <h2 class="text-xl font-bold">{{ t.thread.title }}</h2>
        <div class="mt-2 flex items-center gap-2 text-sm"><app-avatar [photoKey]="t.thread.authorPhotoKey" [name]="t.thread.authorName" [size]="28" />
          <b>{{ t.thread.authorName }}</b>
          @if (canWrite(t.thread.authorId)) { <a [routerLink]="'/messages'" [queryParams]="{ to: t.thread.authorId }" class="text-xs font-bold text-odc-orange underline">Écrire</a> }<span class="text-odc-muted">{{ t.thread.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span></div>
        <p class="mt-3 whitespace-pre-line">{{ t.thread.body }}</p>
      </article>
      @for (r of t.replies; track r.id) {
        <article class="card mt-3 ml-4 sm:ml-10 !p-4">
          <div class="flex items-center gap-2 text-sm"><app-avatar [photoKey]="r.authorPhotoKey" [name]="r.authorName" [size]="28" />
            <b>{{ r.authorName }}</b>
            @if (canWrite(r.authorId)) { <a [routerLink]="'/messages'" [queryParams]="{ to: r.authorId }" class="text-xs font-bold text-odc-orange underline">Écrire</a> }
            @if (r.authorRole !== 'APPRENANT') { <span class="badge">{{ r.authorRole === 'ADMIN' ? 'Admin' : 'Formateur' }}</span> }
            <span class="text-odc-muted">{{ r.createdAt | date: 'dd/MM HH:mm' }}</span></div>
          <p class="mt-2 whitespace-pre-line text-sm">{{ r.body }}</p>
        </article>
      }
      <form class="mt-4 space-y-3" [formGroup]="replyForm" (ngSubmit)="reply(t.thread.id)">
        <textarea class="input-field" rows="3" formControlName="body" placeholder="Votre réponse" aria-label="Votre réponse"></textarea>
        <button class="btn-primary" type="submit" [disabled]="replyForm.invalid">Répondre</button>
      </form>
    } @else {
      <form class="card mt-5 space-y-3" [formGroup]="threadForm" (ngSubmit)="create()">
        <h2 class="font-bold">Nouvelle discussion</h2>
        <input class="input-field" formControlName="title" placeholder="Titre" aria-label="Titre" />
        <textarea class="input-field" rows="3" formControlName="body" placeholder="Votre question ou sujet" aria-label="Message"></textarea>
        <button class="btn-primary" type="submit" [disabled]="threadForm.invalid">Publier</button>
      </form>
      <ul class="mt-5 space-y-3">
        @for (p of threads(); track p.id) {
          <li><button type="button" class="card block w-full text-left !p-4 hover:border-odc-brand-orange" (click)="show(p.id)">
            <span class="font-bold">{{ p.title }}</span>
            <span class="mt-1 block text-xs text-odc-muted">{{ p.authorName }} · {{ p.createdAt | date: 'dd/MM/yyyy' }} · {{ p.replies }} réponse(s)</span></button></li>
        } @empty { <li class="text-sm text-odc-muted">Aucune discussion. Lancez la première !</li> }
      </ul>
    }
  `,
})
export class ForumComponent {
  readonly formationId = input.required<string>();
  private readonly social = inject(SocialService);
  private readonly fb = inject(FormBuilder);
  readonly threads = signal<ForumPost[]>([]);
  readonly open = signal<ForumThread | null>(null);
  readonly error = signal<string | null>(null);
  private readonly contacts = signal<Contact[]>([]);

  /** Le bouton « Écrire » n'apparaît que si la messagerie autorise ce destinataire. */
  canWrite(userId: number): boolean { return this.contacts().some((c) => c.id === userId); }
  readonly threadForm = this.fb.nonNullable.group({ title: ['', Validators.required], body: ['', Validators.required] });
  readonly replyForm = this.fb.nonNullable.group({ body: ['', Validators.required] });

  constructor() {
    effect(() => this.load());
    this.social.contacts().subscribe({ next: (c) => this.contacts.set(c) });
  }

  private id(): number { return Number(this.formationId()); }

  private load(): void {
    this.social.threads(this.id()).subscribe({ next: (t) => { this.threads.set(t); this.error.set(null); }, error: (e) => this.error.set(e.error?.message ?? 'Accès refusé à ce forum.') });
  }

  show(id: number): void { this.social.thread(id).subscribe((t) => this.open.set(t)); }

  create(): void {
    const v = this.threadForm.getRawValue();
    this.social.createThread(this.id(), v.title, v.body).subscribe(() => { this.threadForm.reset(); this.load(); });
  }

  reply(threadId: number): void {
    this.social.reply(threadId, this.replyForm.getRawValue().body).subscribe(() => { this.replyForm.reset(); this.show(threadId); });
  }
}
