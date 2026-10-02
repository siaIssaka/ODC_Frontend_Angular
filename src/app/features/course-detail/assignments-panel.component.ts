import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Assignment, Submission } from '../../core/models/formation.model';

/** Devoirs d'un cours : rendu (apprenant inscrit) ; gestion par le formateur créateur. */
@Component({
  selector: 'app-assignments-panel',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <section class="border-t-4 border-odc-brand-orange bg-white p-5 shadow-card" aria-labelledby="dv-title">
      <h2 id="dv-title" class="text-lg font-bold">Devoirs</h2>

      @for (a of items(); track a.id) {
        <article class="mt-4 border-b border-gray-200 pb-4">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-sm font-bold">{{ a.title }}</h3>
            <span class="badge shrink-0" [class.!bg-black]="a.status === 'FERME'" [class.!text-white]="a.status === 'FERME'">{{ a.status === 'OUVERT' ? 'Ouvert' : a.status === 'FERME' ? 'Fermé' : 'Planifié' }}</span>
          </div>
          @if (a.description) { <p class="mt-1 text-xs text-odc-muted">{{ a.description }}</p> }
          <p class="mt-1 text-xs">Du {{ a.opensAt | date: 'dd/MM HH:mm' }} au {{ a.closesAt | date: 'dd/MM/yyyy HH:mm' }}</p>
          @if (auth.role() === 'FORMATEUR' && canManage() && a.status === 'PLANIFIE') {
            @if (editingId() !== a.id) {
              <button type="button" class="mt-2 text-xs font-bold text-odc-orange underline" (click)="edit(a)">Modifier les consignes ou les dates</button>
            }
          }
          @if (editingId() === a.id) {
            <form class="mt-3 space-y-3 rounded-lg bg-gray-50 p-3" [formGroup]="form" (ngSubmit)="create()">
              <h4 class="text-sm font-bold">Modifier le devoir planifié</h4>
              <label class="block text-xs font-bold">Titre<input class="input-field mt-1" formControlName="title" /></label>
              <label class="block text-xs font-bold">Consignes<textarea class="input-field mt-1" rows="2" formControlName="description"></textarea></label>
              <label class="block text-xs font-bold">Date d’ouverture<input type="datetime-local" class="input-field mt-1" formControlName="opensAt" /></label>
              <label class="block text-xs font-bold">Date de fermeture<input type="datetime-local" class="input-field mt-1" formControlName="closesAt" /></label>
              <div class="flex gap-2">
                <button class="btn-primary flex-1" type="submit" [disabled]="form.invalid">{{ submittingEdit() ? 'Enregistrement…' : 'Enregistrer les modifications' }}</button>
                <button class="btn-secondary" type="button" (click)="cancelEdit()">Annuler</button>
              </div>
            </form>
          }

          @if (auth.role() === 'APPRENANT') {
            @if (a.grade !== null) { <p class="mt-2 text-sm font-bold text-odc-orange">Note : {{ a.grade }}/20</p> }
            @if (a.status === 'OUVERT') {
              @if (enrolled()) {
                <div class="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
                  <p class="text-xs font-bold">{{ a.submitted ? 'Travail déjà rendu : vous pouvez le remplacer avant la fermeture.' : 'Déposez votre travail avant la fermeture.' }}</p>
                  <label class="block text-xs font-bold">Téléverser un fichier (PDF, DOC, DOCX ou TXT · 20 Mo maximum)
                    <input type="file" class="mt-1 block w-full text-xs" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" [disabled]="submittingId() === a.id" (change)="upload(a.id, $event)" />
                  </label>
                  <div class="border-t border-gray-200 pt-3">
                    <label class="block text-xs font-bold" [for]="'answer-' + a.id">Ou rédiger une réponse texte (20 000 caractères maximum)</label>
                    <textarea [id]="'answer-' + a.id" class="input-field mt-1" rows="5" maxlength="20000"
                      [value]="textAnswers()[a.id] ?? ''" (input)="setTextAnswer(a.id, $event)"
                      placeholder="Saisissez votre réponse ici…"></textarea>
                    <div class="mt-2 flex items-center justify-between gap-3">
                      <span class="text-xs text-odc-muted">{{ (textAnswers()[a.id] ?? '').length }}/20 000</span>
                      <button type="button" class="btn-primary !px-3 !py-2 text-xs"
                        [disabled]="!(textAnswers()[a.id] ?? '').trim() || submittingId() === a.id"
                        (click)="submitText(a.id)">{{ submittingId() === a.id ? 'Envoi…' : 'Envoyer la réponse texte' }}</button>
                    </div>
                  </div>
                </div>
              } @else {
                <p class="mt-2 text-sm text-odc-muted">L’administrateur doit d’abord vous inscrire à ce cours pour rendre le devoir.</p>
              }
            } @else if (a.submitted) { <p class="mt-2 text-xs">Travail rendu.</p> }
            @else if (a.status === 'FERME') { <p class="mt-2 text-xs font-bold">Espace de dépôt clôturé.</p> }
          } @else {
            <button type="button" class="btn-secondary mt-2 !px-3 !py-1.5 text-xs" (click)="toggle(a.id)">{{ openId() === a.id ? 'Masquer les dépôts' : 'Voir les dépôts' }}</button>
            @if (openId() === a.id) {
              <ul class="mt-3 space-y-3">
                @for (s of subs(); track s.id) {
                  <li class="bg-odc-gray p-2 text-xs">
                    <p class="font-bold">{{ s.learnerName }} · {{ s.submittedAt | date: 'dd/MM HH:mm' }}</p>
                    <button type="button" class="text-odc-orange underline" (click)="download(s)">{{ s.originalName || 'Télécharger' }}</button>
                    @if (auth.role() === 'FORMATEUR' && canManage()) {
                      <div class="mt-2 flex gap-2">
                        <input #g type="number" min="0" max="20" step="0.5" class="input-field !w-20 !py-1" [value]="s.grade ?? ''" placeholder="/20" aria-label="Note sur 20" />
                        <input #f class="input-field !py-1" [value]="s.feedback ?? ''" placeholder="Commentaire" aria-label="Commentaire" />
                        <button type="button" class="btn-primary !px-3 !py-1 text-xs" (click)="grade(s, g.value, f.value)">Enregistrer</button>
                      </div>
                    } @else {
                      <p class="mt-2">Note : {{ s.grade ?? '—' }}/20{{ s.feedback ? ' · ' + s.feedback : '' }}</p>
                    }
                  </li>
                } @empty { <li class="text-xs text-odc-muted">Aucun dépôt.</li> }
              </ul>
            }
          }
        </article>
      } @empty {
        <p class="mt-3 text-sm text-odc-muted">Aucun devoir pour ce cours.</p>
      }

      @if (auth.role() === 'FORMATEUR' && canManage() && !editingId()) {
        <form class="mt-5 space-y-3" [formGroup]="form" (ngSubmit)="create()">
          <h3 class="text-sm font-bold">Nouvel espace de dépôt</h3>
          <input class="input-field" formControlName="title" placeholder="Titre" aria-label="Titre" />
          <textarea class="input-field" formControlName="description" rows="2" placeholder="Consignes" aria-label="Consignes"></textarea>
          <label class="block text-xs font-bold">Ouverture <input type="datetime-local" class="input-field mt-1" formControlName="opensAt" /></label>
          <label class="block text-xs font-bold">Fermeture automatique <input type="datetime-local" class="input-field mt-1" formControlName="closesAt" /></label>
          <div class="flex gap-2">
            <button class="btn-primary flex-1" type="submit" [disabled]="form.invalid || submittingEdit()">{{ submittingEdit() ? 'Création…' : 'Créer le devoir' }}</button>
          </div>
        </form>
      }
      @if (msg()) { <p class="mt-3 text-sm font-bold" role="status">{{ msg() }}</p> }
    </section>
  `,
})
export class AssignmentsPanelComponent implements OnInit {
  readonly courseId = input.required<number>();
  readonly canManage = input(false);
  readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  readonly items = signal<Assignment[]>([]);
  readonly subs = signal<Submission[]>([]);
  readonly openId = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly enrolled = input(false);
  readonly submittingId = signal<number | null>(null);
  readonly submittingEdit = signal(false);
  readonly textAnswers = signal<Record<number, string>>({});
  readonly msg = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required], description: [''],
    opensAt: ['', Validators.required], closesAt: ['', Validators.required],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.catalog.getCourseAssignments(this.courseId()).subscribe({ next: (a) => this.items.set(a), error: () => this.items.set([]) });
  }

  private fail = (e: { error?: { message?: string } }) => this.msg.set(e.error?.message ?? 'Action impossible.');

  create(): void {
    if (this.submittingEdit()) return;
    if (this.editingId()) {
      const id = this.editingId()!;
      this.submittingEdit.set(true);
      this.catalog.updateAssignment(id, this.form.getRawValue()).subscribe({
        next: () => { this.cancelEdit(); this.msg.set('Devoir et dates modifiés.'); this.load(); this.submittingEdit.set(false); },
        error: (e) => { this.fail(e); this.submittingEdit.set(false); },
      });
      return;
    }
    this.catalog.createAssignment(this.courseId(), this.form.getRawValue()).subscribe({
      next: () => { this.form.reset(); this.msg.set('Devoir créé.'); this.load(); },
      error: this.fail,
    });
  }

  edit(a: Assignment): void {
    this.editingId.set(a.id);
    this.msg.set(null);
    this.form.setValue({
      title: a.title,
      description: a.description ?? '',
      opensAt: this.toDateTimeInput(a.opensAt),
      closesAt: this.toDateTimeInput(a.closesAt),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  upload(id: number, ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const input = ev.target as HTMLInputElement;
    if (file.size > 20 * 1024 * 1024) {
      input.value = '';
      this.msg.set('Le fichier dépasse la limite de 20 Mo.');
      return;
    }
    this.submittingId.set(id);
    this.catalog.submitAssignment(id, file).subscribe({
      next: () => {
        input.value = '';
        this.submittingId.set(null);
        this.msg.set('Fichier déposé avec succès.');
        this.load();
      },
      error: (error) => { input.value = ''; this.submittingId.set(null); this.fail(error); },
    });
  }

  setTextAnswer(id: number, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.textAnswers.update((answers) => ({ ...answers, [id]: value }));
  }

  submitText(id: number): void {
    const text = this.textAnswers()[id] ?? '';
    if (!text.trim() || this.submittingId() === id) return;
    this.submittingId.set(id);
    this.catalog.submitAssignment(id, null, text).subscribe({
      next: () => {
        this.submittingId.set(null);
        this.textAnswers.update((answers) => ({ ...answers, [id]: '' }));
        this.msg.set('Réponse texte envoyée avec succès.');
        this.load();
      },
      error: (error) => { this.submittingId.set(null); this.fail(error); },
    });
  }

  toggle(id: number): void {
    if (this.openId() === id) { this.openId.set(null); return; }
    this.openId.set(id);
    this.catalog.getSubmissions(id).subscribe({ next: (s) => this.subs.set(s), error: this.fail });
  }

  grade(s: Submission, g: string, f: string): void {
    this.catalog.gradeSubmission(s.id, Number(g), f).subscribe({ next: () => this.msg.set('Note enregistrée.'), error: this.fail });
  }

  download(s: Submission): void {
    this.catalog.downloadSubmission(s.id).subscribe((b) => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url; a.download = s.originalName ?? 'depot'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  private toDateTimeInput(value: string): string {
    return value.slice(0, 16);
  }
}
