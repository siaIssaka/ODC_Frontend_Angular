import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegistrationSettingsService } from '../../../core/services/registration-settings.service';
import { GoogleButtonComponent } from '../../../shared/google-button.component';

/** Formulaire d'inscription apprenant (mêmes champs qu'avant : prénom, nom, e-mail, mot de passe + confirmation). */
@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleButtonComponent],
  template: `
    <section class="flex w-full flex-col justify-center" [attr.aria-hidden]="!active()" aria-labelledby="reg-title">
      @if (registrationOpen() === false) {
        <h1 id="reg-title" class="text-center text-3xl font-bold text-black sm:text-4xl">Inscriptions fermées</h1>
        <p class="mt-5 rounded-lg border-l-4 border-odc-brand-orange bg-orange-50 p-4 text-center text-sm text-gray-800" role="status">
          Aucune formation n'est ouverte pour le moment. Veuillez attendre le prochain lancement des inscriptions.
        </p>
        <a routerLink="/login" class="auth-btn !mt-5 text-center">Se connecter à mon compte</a>
      } @else if (registrationOpen() === null) {
        <h1 id="reg-title" class="text-center text-3xl font-bold text-black sm:text-4xl">Créer un compte</h1>
        @if (registrationLoading()) {
          <p class="mt-5 text-center text-sm text-gray-600" role="status">Vérification de l'ouverture des inscriptions…</p>
        } @else {
          <p class="mt-5 border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ registrationError() }}</p>
          <button type="button" class="auth-btn !mt-4" (click)="loadRegistrationStatus()">Réessayer</button>
        }
      } @else {
        <h1 id="reg-title" class="text-center text-3xl font-bold text-black sm:text-4xl">Créer un compte</h1>
        <app-google-button mode="signup" [enabled]="active()" (failed)="error.set($event)" />

        @if (error()) { <div class="mt-4 border-l-4 border-red-600 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">{{ error() }}</div> }
        @if (success()) { <div class="mt-4 border-l-4 border-green-700 bg-green-50 px-3 py-3 text-sm text-green-900" role="status">{{ success() }}</div> }

        <form class="mt-5 space-y-3" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="reg-prenom" class="sr-only">Prénom</label>
            <input id="reg-prenom" formControlName="prenom" class="auth-input" placeholder="Prénom" autocomplete="given-name" [attr.aria-invalid]="bad('prenom')" />
            @if (bad('prenom')) { <p class="mt-1 text-sm text-red-700">Requis.</p> }
          </div>
          <div>
            <label for="reg-nom" class="sr-only">Nom</label>
            <input id="reg-nom" formControlName="nom" class="auth-input" placeholder="Nom" autocomplete="family-name" [attr.aria-invalid]="bad('nom')" />
            @if (bad('nom')) { <p class="mt-1 text-sm text-red-700">Requis.</p> }
          </div>
        </div>
        <div>
          <label for="reg-email" class="sr-only">Adresse e-mail</label>
          <input id="reg-email" type="email" inputmode="email" formControlName="email" class="auth-input" placeholder="Adresse e-mail"
                 autocomplete="email" autocapitalize="none" spellcheck="false" [attr.aria-invalid]="bad('email')" />
          @if (bad('email')) { <p class="mt-1 text-sm text-red-700">Adresse e-mail invalide.</p> }
        </div>
        <div>
          <label for="reg-password" class="sr-only">Mot de passe</label>
          <div class="relative">
            <input id="reg-password" [type]="show() ? 'text' : 'password'" formControlName="password" class="auth-input pr-24"
                   placeholder="Mot de passe" autocomplete="new-password" [attr.aria-invalid]="bad('password')" aria-describedby="reg-strength" />
            <button type="button" class="absolute inset-y-0 right-0 px-4 text-sm font-bold text-black underline decoration-odc-brand-orange decoration-2 underline-offset-4"
                    (click)="show.set(!show())" [attr.aria-pressed]="show()" aria-label="Afficher ou masquer le mot de passe">{{ show() ? 'Masquer' : 'Afficher' }}</button>
          </div>
          <div class="mt-2 flex gap-1" aria-hidden="true">
            @for (i of [1, 2, 3, 4]; track i) { <span class="h-1.5 flex-1 transition-colors" [class]="i <= strength().score ? 'bg-odc-brand-orange' : 'bg-gray-200'"></span> }
          </div>
          <p id="reg-strength" class="mt-1 text-xs text-gray-600" aria-live="polite">8 caractères minimum · Force : <b class="text-black">{{ strength().label }}</b></p>
        </div>
        <div>
          <label for="reg-confirm" class="sr-only">Confirmer le mot de passe</label>
          <input id="reg-confirm" [type]="show() ? 'text' : 'password'" formControlName="confirm" class="auth-input" placeholder="Confirmer le mot de passe"
                 autocomplete="new-password" [attr.aria-invalid]="mismatch()" />
          @if (mismatch()) { <p class="mt-1 text-sm text-red-700">Les mots de passe ne correspondent pas.</p> }
        </div>
        <div>
          <label for="reg-terms" class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-normal text-gray-700">
            <input id="reg-terms" type="checkbox" formControlName="terms" class="h-5 w-5 shrink-0 accent-[#ff7900]" [attr.aria-invalid]="bad('terms')" />
            <span>J'accepte les <a routerLink="/conditions" target="_blank" rel="noopener" class="font-bold text-black underline decoration-odc-brand-orange decoration-2 underline-offset-4">conditions d'utilisation</a></span>
          </label>
          @if (bad('terms')) { <p class="text-sm text-red-700">Vous devez accepter les conditions pour créer un compte.</p> }
        </div>
        <button type="submit" class="auth-btn !mt-4" [disabled]="loading()">
          @if (loading()) { <span class="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" aria-hidden="true"></span> }
          {{ loading() ? 'Création…' : "S'inscrire" }}
        </button>
        </form>
      }
    </section>
  `,
})
export class RegisterComponent {
  readonly active = input(true);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly registrationSettings = inject(RegistrationSettingsService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly show = signal(false);
  readonly registrationOpen = signal<boolean | null>(null);
  readonly registrationLoading = signal(true);
  readonly registrationError = signal('Impossible de vérifier le statut des inscriptions.');
  readonly form = this.fb.nonNullable.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
    terms: [false, Validators.requiredTrue],
  });
  private readonly pw = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  private readonly cf = toSignal(this.form.controls.confirm.valueChanges, { initialValue: '' });

  constructor() {
    this.loadRegistrationStatus();
  }

  readonly strength = computed(() => {
    const p = this.pw();
    const score = p.length < 8 ? (p ? 1 : 0) : 1 + +(/[a-z]/.test(p) && /[A-Z]/.test(p)) + +/\d/.test(p) + +/[^A-Za-z0-9]/.test(p);
    return { score: Math.min(4, score), label: ['—', 'faible', 'moyenne', 'bonne', 'excellente'][Math.min(4, score)] };
  });
  readonly mismatch = computed(() => this.form.controls.confirm.touched && this.cf() !== this.pw());

  bad(name: 'prenom' | 'nom' | 'email' | 'password' | 'terms'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  loadRegistrationStatus(): void {
    this.registrationLoading.set(true);
    this.registrationError.set('Impossible de vérifier le statut des inscriptions.');
    this.registrationSettings.getStatus().subscribe({
      next: (status) => {
        this.registrationOpen.set(status.open);
        this.registrationLoading.set(false);
      },
      error: () => {
        this.registrationOpen.set(null);
        this.registrationError.set('Le statut des inscriptions est indisponible. Réessayez dans un instant.');
        this.registrationLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    const { prenom, nom, email, password, confirm } = this.form.getRawValue();
    if (this.form.invalid || confirm !== password) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.register({ prenom, nom, email, password, role: 'APPRENANT' }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.message || 'Compte créé. Vous pouvez vous connecter.');
        setTimeout(() => void this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.details?.join(' ') || err?.error?.message || err?.error?.detail || 'Impossible de créer le compte.');
      },
    });
  }
}
