import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleButtonComponent } from '../../../shared/google-button.component';

/** Formulaire de connexion (la carte et le panneau glissant sont dans AuthPageComponent). */
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleButtonComponent],
  template: `
    <section class="flex w-full flex-col justify-center" [attr.aria-hidden]="!active()" aria-labelledby="login-title">
      <h1 id="login-title" class="text-center text-3xl font-bold text-black sm:text-4xl">Connexion</h1>
      <app-google-button mode="signin" [enabled]="active()" (failed)="error.set($event)" />

      @if (error()) { <div class="mt-4 border-l-4 border-red-600 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">{{ error() }}</div> }

      <form class="mt-5 space-y-3" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div>
          <label for="login-email" class="sr-only">Adresse e-mail</label>
          <input id="login-email" type="email" inputmode="email" formControlName="email" class="auth-input" placeholder="Adresse e-mail"
                 autocomplete="username" autocapitalize="none" spellcheck="false" [attr.aria-invalid]="bad('email')" />
          @if (bad('email')) { <p class="mt-1 text-sm text-red-700">Saisissez une adresse e-mail valide.</p> }
        </div>
        <div>
          <label for="login-password" class="sr-only">Mot de passe</label>
          <div class="relative">
            <input id="login-password" [type]="show() ? 'text' : 'password'" formControlName="password" class="auth-input pr-24"
                   placeholder="Mot de passe" autocomplete="current-password" [attr.aria-invalid]="bad('password')" />
            <button type="button" class="absolute inset-y-0 right-0 px-4 text-sm font-bold text-black underline decoration-odc-brand-orange decoration-2 underline-offset-4"
                    (click)="show.set(!show())" [attr.aria-pressed]="show()" aria-label="Afficher ou masquer le mot de passe">{{ show() ? 'Masquer' : 'Afficher' }}</button>
          </div>
          @if (bad('password')) { <p class="mt-1 text-sm text-red-700">Au moins 8 caractères.</p> }
        </div>
        <p class="text-right"><a routerLink="/forgot-password" class="text-sm text-gray-600 underline underline-offset-4 hover:text-black">Mot de passe oublié ?</a></p>
        <button type="submit" class="auth-btn" [disabled]="loading()">
          @if (loading()) { <span class="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" aria-hidden="true"></span> }
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>
    </section>
  `,
})
export class LoginComponent {
  readonly active = input(true);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly show = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  bad(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).pipe(switchMap(() => this.auth.loadCurrentUser())).subscribe({
      next: (user) => {
        this.loading.set(false);
        if (user) this.auth.redirectAfterLogin(user.role);
        else this.error.set('Impossible de charger votre profil.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.detail || 'E-mail ou mot de passe incorrect.');
      },
    });
  }
}
