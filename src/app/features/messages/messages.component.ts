import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocialService } from '../../core/services/social.service';
import { Contact, Message } from '../../core/models/social.model';

/** Messagerie interne : boîte de réception, envoyés, nouveau message. */
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <h1 class="text-3xl font-bold">Messagerie</h1>
    <div class="mt-1 h-1 w-16 bg-odc-brand-orange"></div>
    <div class="mt-5 flex flex-wrap gap-2" role="tablist">
      @for (t of tabs; track t.id) {
        <button type="button" role="tab" class="border-2 border-black px-4 py-2 text-sm font-bold" [attr.aria-selected]="tab() === t.id"
                [class]="tab() === t.id ? 'bg-black text-white' : 'bg-white hover:bg-odc-brand-orange'" (click)="tab.set(t.id)">{{ t.label }}</button>
      }
    </div>

    @if (tab() === 'new') {
      <form class="card mt-5 max-w-2xl space-y-3" [formGroup]="form" (ngSubmit)="send()">
        <label class="block text-sm font-bold">Destinataire
          <select class="input-field mt-1" formControlName="to">
            <option value="">— Choisir —</option>
            @for (c of contacts(); track c.id) { <option [value]="c.id">{{ c.name }} ({{ c.role }})</option> }
          </select>
        </label>
        <label class="block text-sm font-bold">Objet <input class="input-field mt-1" formControlName="subject" /></label>
        <label class="block text-sm font-bold">Message <textarea class="input-field mt-1" rows="5" formControlName="body"></textarea></label>
        <button class="btn-primary" type="submit" [disabled]="form.invalid">Envoyer</button>
      </form>
    } @else {
      <ul class="mt-5 space-y-3">
        @for (m of list(); track m.id) {
          <li class="card cursor-pointer !p-4" [class.border-l-4]="tab() === 'inbox' && !m.read" [class.border-l-odc-brand-orange]="tab() === 'inbox' && !m.read" (click)="open(m)">
            <p class="text-sm"><span class="font-bold">{{ tab() === 'inbox' ? m.senderName : 'À ' + m.recipientName }}</span>
              <span class="text-odc-muted"> · {{ m.sentAt | date: 'dd/MM/yyyy HH:mm' }}</span></p>
            <p class="font-bold">{{ m.subject }}</p>
            @if (selected() === m.id) { <p class="mt-2 whitespace-pre-line text-sm">{{ m.body }}</p> }
          </li>
        } @empty { <li class="text-sm text-odc-muted">Aucun message.</li> }
      </ul>
    }
    @if (msg()) { <p class="mt-4 text-sm font-bold" role="status">{{ msg() }}</p> }
  `,
})
export class MessagesComponent {
  private readonly social = inject(SocialService);
  private readonly fb = inject(FormBuilder);
  readonly tabs: { id: 'inbox' | 'sent' | 'new'; label: string }[] = [{ id: 'inbox', label: 'Réception' }, { id: 'sent', label: 'Envoyés' }, { id: 'new', label: 'Nouveau message' }];
  readonly tab = signal<'inbox' | 'sent' | 'new'>('inbox');
  readonly inbox = signal<Message[]>([]);
  readonly outbox = signal<Message[]>([]);
  readonly contacts = signal<Contact[]>([]);
  readonly selected = signal<number | null>(null);
  readonly msg = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ to: ['', Validators.required], subject: ['', Validators.required], body: ['', Validators.required] });

  constructor() {
    const to = inject(ActivatedRoute).snapshot.queryParamMap.get('to');
    if (to) { this.form.patchValue({ to }); this.tab.set('new'); }
    this.reload(); this.social.contacts().subscribe((c) => this.contacts.set(c));
  }

  list(): Message[] { return this.tab() === 'sent' ? this.outbox() : this.inbox(); }

  private reload(): void {
    this.social.inbox().subscribe((m) => this.inbox.set(m));
    this.social.sent().subscribe((m) => this.outbox.set(m));
  }

  open(m: Message): void {
    this.selected.set(this.selected() === m.id ? null : m.id);
    if (this.tab() === 'inbox' && !m.read) this.social.markRead(m.id).subscribe(() => this.reload());
  }

  send(): void {
    const v = this.form.getRawValue();
    this.social.send(Number(v.to), v.subject, v.body).subscribe({
      next: () => { this.form.reset(); this.msg.set('Message envoyé.'); this.reload(); this.tab.set('sent'); },
      error: (e) => this.msg.set(e.error?.message ?? "Envoi impossible."),
    });
  }
}
