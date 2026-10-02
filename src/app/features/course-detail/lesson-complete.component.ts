import { Component, OnInit, inject, input, signal } from '@angular/core';
import { SocialService } from '../../core/services/social.service';

/** Bouton « Marquer comme terminé » : alimente la progression réelle du cours. */
@Component({
  selector: 'app-lesson-complete',
  standalone: true,
  template: `
    @if (done()) { <span class="badge">✓ Terminée</span> }
    @else { <button type="button" class="btn-secondary !px-3 !py-1 text-xs" (click)="mark()">Marquer comme terminée</button> }
  `,
})
export class LessonCompleteComponent implements OnInit {
  readonly courseId = input.required<number>();
  readonly lessonId = input.required<number>();
  private readonly social = inject(SocialService);
  readonly done = signal(false);

  ngOnInit(): void {
    this.social.completedLessons(this.courseId()).subscribe({ next: (ids) => this.done.set(ids.includes(this.lessonId())) });
  }

  mark(): void { this.social.completeLesson(this.lessonId()).subscribe({ next: () => this.done.set(true) }); }
}
