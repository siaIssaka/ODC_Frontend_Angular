import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvatarComponent } from '../../shared/avatar.component';
import { SocialService } from '../../core/services/social.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Page profil : permet de modifier les informations personnelles du compte connecté.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, AvatarComponent],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-odc-black">Mon profil</h1>
      <p class="mt-1 text-sm text-odc-muted">Informations de votre compte ODC Academy</p>
    </div>

    @if (auth.currentUser(); as user) {
      <div class="card max-w-xl space-y-4">
        <div class="flex items-center gap-4">
          <app-avatar [photoKey]="user.photoKey" [name]="user.prenom + ' ' + user.nom" [size]="64" />
          <div>
            <p class="text-lg font-semibold">{{ user.prenom }} {{ user.nom }}</p>
            <p class="text-sm text-odc-muted">{{ user.email }}</p>
          </div>
        </div>

        <label class="block text-xs font-bold">Photo de profil (PNG, JPG, WEBP — 2 Mo max)
          <input type="file" class="mt-1 block w-full text-xs" accept=".png,.jpg,.jpeg,.webp" (change)="upload($event)" />
        </label>
        @if (photoMsg()) { <p class="text-sm font-bold" role="status">{{ photoMsg() }}</p> }

        <form class="space-y-3 border-t border-gray-200 pt-4" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <h2 class="font-bold">Modifier mes informations</h2>
          <label class="block text-sm font-semibold">Prénom
            <input class="input-field mt-1" formControlName="prenom" autocomplete="given-name" />
          </label>
          <label class="block text-sm font-semibold">Nom
            <input class="input-field mt-1" formControlName="nom" autocomplete="family-name" />
          </label>
          <label class="block text-sm font-semibold">Adresse e-mail
            <input class="input-field mt-1" type="email" formControlName="email" autocomplete="email" />
          </label>
          <p class="text-xs text-odc-muted">Votre rôle et le statut de votre compte ne peuvent pas être modifiés ici.</p>
          <button class="btn-primary" type="submit" [disabled]="profileForm.invalid || saving()">
            {{ saving() ? 'Enregistrement…' : 'Enregistrer les modifications' }}
          </button>
          @if (profileMsg()) {
            <p class="text-sm font-bold" [class]="profileError() ? 'text-red-700' : 'text-green-700'" [attr.role]="profileError() ? 'alert' : 'status'">{{ profileMsg() }}</p>
          }
        </form>

        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium uppercase text-odc-muted">Rôle</dt>
            <dd class="mt-0.5 font-semibold text-odc-black">{{ user.role }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-odc-muted">Statut</dt>
            <dd class="mt-0.5 font-semibold" [class]="user.active ? 'text-green-700' : 'text-red-600'">
              {{ user.active ? 'Actif' : 'Inactif' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-odc-muted">Identifiant</dt>
            <dd class="mt-0.5 font-semibold text-odc-black">#{{ user.id }}</dd>
          </div>
          @if (user.createdAt) {
            <div>
              <dt class="text-xs font-medium uppercase text-odc-muted">Membre depuis</dt>
              <dd class="mt-0.5 font-semibold text-odc-black">{{ user.createdAt | date: 'longDate' }}</dd>
            </div>
          }
        </dl>
      </div>
    } @else {
      <div class="card text-odc-muted">Profil indisponible.</div>
    }
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly social = inject(SocialService);
  private readonly fb = inject(FormBuilder);
  readonly photoMsg = signal<string | null>(null);
  readonly profileMsg = signal<string | null>(null);
  readonly profileError = signal(false);
  readonly saving = signal(false);
  readonly profileForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.maxLength(255)]],
    nom: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) this.profileForm.setValue({ prenom: user.prenom, nom: user.nom, email: user.email });
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving()) return;
    this.saving.set(true);
    this.profileMsg.set(null);
    this.profileError.set(false);
    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (user) => {
        this.profileForm.setValue({ prenom: user.prenom, nom: user.nom, email: user.email });
        this.profileMsg.set('Vos informations ont été mises à jour.');
        this.saving.set(false);
      },
      error: (error) => {
        this.profileMsg.set(error.error?.message ?? 'Impossible de mettre à jour vos informations.');
        this.profileError.set(true);
        this.saving.set(false);
      },
    });
  }

  upload(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.social.uploadPhoto(file).subscribe({
      next: () => { this.photoMsg.set('Photo mise à jour.'); this.auth.loadCurrentUser().subscribe(); },
      error: (e) => this.photoMsg.set(e.error?.message ?? "Échec de l'envoi."),
    });
  }
}
