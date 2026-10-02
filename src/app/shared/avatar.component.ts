import { Component, computed, inject, input } from '@angular/core';
import { SocialService } from '../core/services/social.service';

/** Photo de profil, ou initiales sur fond orange si aucune photo. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (url(); as u) {
      <img [src]="u" [alt]="name()" class="rounded-full object-cover" [style.width.px]="size()" [style.height.px]="size()" />
    } @else {
      <span class="flex items-center justify-center rounded-full bg-odc-brand-orange font-bold text-black"
            [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() / 2.6" aria-hidden="true">{{ initials() }}</span>
    }
  `,
})
export class AvatarComponent {
  readonly photoKey = input<string | null | undefined>(null);
  readonly name = input('');
  readonly size = input(40);
  private readonly social = inject(SocialService);
  readonly url = computed(() => this.social.mediaUrl(this.photoKey()));
  readonly initials = computed(() => this.name().split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join(''));
}
