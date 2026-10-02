import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';
import { Lesson } from '../../core/models/learning.model';
import { AttemptResult, Quiz, QuizDraft, QuizQuestion } from '../../core/models/social.model';

/** Quiz d'une leçon : passage + correction automatique (apprenant) ; création / remplacement par le formateur créateur. */
@Component({
  selector: 'app-quiz-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border-t-4 border-odc-brand-orange bg-white p-5 shadow-card" aria-labelledby="qz-title">
      <h2 id="qz-title" class="text-lg font-bold">Quiz</h2>
      <label class="mt-3 block text-xs font-bold">Leçon
        <select class="input-field mt-1" [ngModel]="lessonId()" (ngModelChange)="pick($event)">
          <option [ngValue]="null">— Choisir une leçon —</option>
          @for (l of lessons(); track l.id) { <option [ngValue]="l.id">{{ l.title }}</option> }
        </select>
      </label>

      @if (lessonId() !== null) {
        @if (isManager() ) {
          <div class="mt-4 space-y-3 text-sm">
            <p class="text-xs text-odc-muted">{{ quiz() ? 'Un quiz existe : l\\'enregistrement le remplace.' : 'Aucun quiz pour cette leçon.' }}</p>
            <input class="input-field" [(ngModel)]="draft.title" placeholder="Titre du quiz" aria-label="Titre du quiz" />
            <label class="block text-xs font-bold">Note de réussite (%) <input type="number" min="0" max="100" class="input-field mt-1" [(ngModel)]="draft.passingScore" /></label>
            @for (q of draft.questions; track $index; let qi = $index) {
              <fieldset class="border border-gray-300 p-3">
                <div class="flex gap-2">
                  <input class="input-field" [(ngModel)]="q.prompt" placeholder="Question" [attr.aria-label]="'Question ' + (qi + 1)" />
                  <button type="button" class="btn-secondary !px-2" (click)="draft.questions.splice(qi, 1)" aria-label="Supprimer la question">✕</button>
                </div>
                <select class="input-field mt-2" [(ngModel)]="q.type" (ngModelChange)="typeChanged(q)">
                  <option value="SINGLE_CHOICE">Choix unique</option><option value="MULTIPLE_CHOICE">Choix multiples</option><option value="TRUE_FALSE">Vrai / Faux</option>
                </select>
                @for (o of q.options; track $index; let oi = $index) {
                  <div class="mt-2 flex items-center gap-2">
                    <input type="checkbox" [ngModel]="!!o.correct" (ngModelChange)="setCorrect(q, oi, $event)" [attr.aria-label]="'Bonne réponse ' + (oi + 1)" />
                    <input class="input-field !py-1" [(ngModel)]="o.label" placeholder="Réponse" [readOnly]="q.type === 'TRUE_FALSE'" />
                  </div>
                }
                @if (q.type !== 'TRUE_FALSE') { <button type="button" class="mt-2 text-xs font-bold text-odc-orange underline" (click)="q.options.push({ label: '', correct: false })">+ Réponse</button> }
              </fieldset>
            }
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-secondary" (click)="addQuestion()">+ Question</button>
              <button type="button" class="btn-primary" (click)="save()">Enregistrer le quiz</button>
            </div>
          </div>
        } @else if (quiz(); as z) {
          <div class="mt-4 text-sm">
            <h3 class="font-bold">{{ z.title }}</h3><p class="text-xs text-odc-muted">Réussite à partir de {{ z.passingScore }}%</p>
            @for (q of z.questions; track q.id) {
              <fieldset class="mt-3" [class.border-l-4]="result() !== null" [class.border-red-600]="wrong(q)" [class.border-green-700]="result() !== null && !wrong(q)" [class.pl-3]="result() !== null">
                <legend class="font-bold">{{ q.prompt }}</legend>
                @for (o of q.options; track o.id) {
                  <label class="mt-1 flex items-center gap-2">
                    @if (q.type === 'MULTIPLE_CHOICE') { <input type="checkbox" [checked]="has(q, o.id!)" (change)="toggle(q, o.id!, true)" /> }
                    @else { <input type="radio" [name]="'q' + q.id" [checked]="has(q, o.id!)" (change)="toggle(q, o.id!, false)" /> }
                    {{ o.label }}
                  </label>
                }
              </fieldset>
            }
            <button type="button" class="btn-primary mt-4" (click)="submit(z.id)">Corriger</button>
            @if (result(); as r) {
              <p class="mt-3 font-bold" [class.text-green-700]="r.passed" [class.text-red-700]="!r.passed" role="status">
                {{ r.score }}% ({{ r.correct }}/{{ r.total }}) — {{ r.passed ? 'Réussi ! Leçon validée.' : 'Non validé, réessayez.' }}</p>
            }
          </div>
        } @else { <p class="mt-3 text-sm text-odc-muted">Aucun quiz pour cette leçon.</p> }
      }
      @if (msg()) { <p class="mt-3 text-sm font-bold" role="status">{{ msg() }}</p> }
    </section>
  `,
})
export class QuizPanelComponent implements OnInit {
  readonly courseId = input.required<number>();
  readonly canManage = input(false);
  private readonly catalog = inject(CatalogService);
  private readonly social = inject(SocialService);
  readonly auth = inject(AuthService);
  readonly lessons = signal<Lesson[]>([]);
  readonly lessonId = signal<number | null>(null);
  readonly quiz = signal<Quiz | null>(null);
  readonly result = signal<AttemptResult | null>(null);
  readonly msg = signal<string | null>(null);
  answers: Record<number, number[]> = {};
  draft: QuizDraft = this.blank();

  private blank(): QuizDraft { return { title: '', description: '', passingScore: 50, questions: [] }; }
  isManager(): boolean { return this.auth.role() === 'FORMATEUR' && this.canManage(); }

  ngOnInit(): void { this.catalog.getLessons(this.courseId()).subscribe((l) => this.lessons.set(l)); }

  pick(id: number | null): void {
    this.lessonId.set(id); this.quiz.set(null); this.result.set(null); this.answers = {}; this.msg.set(null); this.draft = this.blank();
    if (id === null) return;
    this.social.getQuiz(id).subscribe((q) => {
      this.quiz.set(q);
      if (q && this.isManager()) this.draft = { title: q.title, description: q.description ?? '', passingScore: q.passingScore, questions: structuredClone(q.questions) };
    });
  }

  addQuestion(): void { this.draft.questions.push({ prompt: '', type: 'SINGLE_CHOICE', options: [{ label: '', correct: true }, { label: '', correct: false }] }); }

  typeChanged(q: QuizQuestion): void {
    if (q.type === 'TRUE_FALSE') q.options = [{ label: 'Vrai', correct: true }, { label: 'Faux', correct: false }];
  }

  setCorrect(q: QuizQuestion, i: number, on: boolean): void {
    if (q.type === 'MULTIPLE_CHOICE') q.options[i].correct = on;
    else q.options.forEach((o, k) => (o.correct = k === i && on));
  }

  save(): void {
    const id = this.lessonId();
    if (id === null) return;
    const body: QuizDraft = { ...this.draft, questions: this.draft.questions.map((q) => ({ prompt: q.prompt, type: q.type, options: q.options.map((o) => ({ label: o.label, correct: !!o.correct })) })) };
    this.social.saveQuiz(id, body).subscribe({ next: (q) => { this.quiz.set(q); this.msg.set('Quiz enregistré.'); }, error: (e) => this.msg.set(e.error?.message ?? 'Enregistrement impossible.') });
  }

  has(q: QuizQuestion, oid: number): boolean { return (this.answers[q.id!] ?? []).includes(oid); }
  toggle(q: QuizQuestion, oid: number, multi: boolean): void {
    const cur = this.answers[q.id!] ?? [];
    this.answers[q.id!] = multi ? (cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid]) : [oid];
  }
  wrong(q: QuizQuestion): boolean { return !!this.result()?.wrongQuestionIds.includes(q.id!); }

  submit(quizId: number): void {
    this.social.attempt(quizId, this.answers).subscribe({ next: (r) => this.result.set(r), error: (e) => this.msg.set(e.error?.message ?? 'Correction impossible.') });
  }
}
