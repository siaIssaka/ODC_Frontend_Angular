import { Component, OnInit, inject, input, signal } from '@angular/core';
import { SocialService } from '../../core/services/social.service';
import { DecimalPipe } from '@angular/common';
import { AvatarComponent } from '../../shared/avatar.component';
import { LearnerTracking } from '../../core/models/social.model';

/** Suivi par apprenant : leçons, moyenne aux quiz, devoirs rendus/notés (formateur, admin). */
@Component({
  selector: 'app-tracking-panel',
  standalone: true,
  imports: [AvatarComponent, DecimalPipe],
  template: `
    <section class="border-t-4 border-odc-brand-orange bg-white p-5 shadow-card" aria-labelledby="tr-title">
      <h2 id="tr-title" class="text-lg font-bold">Suivi des apprenants</h2>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[34rem] text-left text-sm">
          <thead><tr class="border-b-2 border-black text-xs uppercase">
            <th class="py-2">Apprenant</th><th>Progression</th><th>Quiz (moy.)</th><th>Devoirs</th><th>Moy. devoirs</th></tr></thead>
          <tbody>
            @for (r of rows(); track r.userId) {
              <tr class="border-b border-gray-200">
                <td class="py-2"><div class="flex items-center gap-2"><app-avatar [photoKey]="r.photoKey" [name]="r.name" [size]="28" />
                  <span><span class="block font-bold">{{ r.name }}</span><span class="block text-xs text-odc-muted">{{ r.email }}</span></span></div></td>
                <td class="min-w-32"><div class="h-2 bg-gray-200"><div class="h-2 bg-odc-brand-orange" [style.width.%]="r.percentage"></div></div>
                  <span class="text-xs">{{ r.completedLessons }}/{{ r.totalLessons }} · {{ r.percentage }}%</span></td>
                <td>{{ r.quizAverage === null ? '—' : (r.quizAverage | number: '1.0-0') + '%' }} <span class="text-xs text-odc-muted">({{ r.quizAttempts }})</span></td>
                <td>{{ r.assignmentsSubmitted }}/{{ r.assignmentsTotal }}</td>
                <td>{{ r.assignmentAverage === null ? '—' : (r.assignmentAverage | number: '1.0-1') + '/20' }}</td>
              </tr>
            } @empty { <tr><td colspan="5" class="py-3 text-odc-muted">Aucun apprenant inscrit.</td></tr> }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class TrackingPanelComponent implements OnInit {
  readonly courseId = input.required<number>();
  private readonly social = inject(SocialService);
  readonly rows = signal<LearnerTracking[]>([]);
  ngOnInit(): void { this.social.tracking(this.courseId()).subscribe({ next: (r) => this.rows.set(r), error: () => this.rows.set([]) }); }
}
