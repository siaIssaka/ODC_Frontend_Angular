import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/auth-shell.component';

/** Demande de lien de réinitialisation. La réponse est volontairement identique que le compte existe ou non. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell>
      <h1 class="text-3xl font-bold text-black">Mot de passe oublié ?</h1>
      <p class="mt-1 text-base text-odc-muted">Saisissez votre adresse e-mail : nous vous envoyons un lien valable 30 minutes.</p>

      @if (sent()) {
        <div class="mt-6 border-l-4 border-green-700 bg-green-50 px-3 py-3 text-sm text-green-900" role="status">
          Si un compte existe pour cette adresse, un e-mail vient d'être envoyé. Pensez à vérifier vos courriers indésirables.
        </div>
      } @else {
        @if (error()) { <div class="mt-5 border-l-4 border-red-600 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">{{ error() }}</div> }
        <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label for="email" class="mb-1 block text-sm font-bold">Adresse e-mail</label>
            <input id="email" type="email" inputmode="email" formControlName="email" class="auth-input" autocomplete="email"
                   autocapitalize="none" spellcheck="false" placeholder="vous@exemple.com" [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid" />
            @if (form.controls.email.touched && form.controls.email.invalid) { <p class="mt-1 text-sm text-red-700">Saisissez une adresse e-mail valide.</p> }
          </div>
          <button type="submit" class="auth-btn" [disabled]="loading()">{{ loading() ? 'Envoi…' : 'Envoyer le lien' }}</button>
        </form>
      }
      <p class="mt-8 text-center"><a routerLink="/login" class="font-bold text-black underline decoration-odc-brand-orange decoration-2 underline-offset-4">← Retour à la connexion</a></p>
    </app-auth-shell>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.error.set('Service momentanément indisponible. Réessayez dans un instant.'); },
    });
  }
}
