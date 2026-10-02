import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/auth-shell.component';

/** Choix du nouveau mot de passe. Le jeton vient du lien reçu par e-mail (/reset-password?token=…). */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell>
      <h1 class="text-3xl font-bold text-black">Nouveau mot de passe</h1>

      @if (!token()) {
        <div class="mt-6 border-l-4 border-red-600 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">Lien incomplet. Refaites une demande de réinitialisation.</div>
        <p class="mt-6"><a routerLink="/forgot-password" class="auth-btn">Demander un nouveau lien</a></p>
      } @else if (done()) {
        <div class="mt-6 border-l-4 border-green-700 bg-green-50 px-3 py-3 text-sm text-green-900" role="status">Mot de passe modifié. Redirection vers la connexion…</div>
      } @else {
        <p class="mt-1 text-base text-odc-muted">Choisissez un mot de passe d'au moins 8 caractères.</p>
        @if (error()) {
          <div class="mt-5 border-l-4 border-red-600 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">{{ error() }}
            <a routerLink="/forgot-password" class="ml-1 font-bold underline">Nouvelle demande</a></div>
        }
        <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label for="password" class="mb-1 block text-sm font-bold">Nouveau mot de passe</label>
            <div class="relative">
              <input id="password" [type]="show() ? 'text' : 'password'" formControlName="password" class="auth-input pr-20" autocomplete="new-password"
                     [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid" />
              <button type="button" class="absolute inset-y-0 right-0 px-4 text-sm font-bold text-odc-orange" (click)="show.set(!show())" [attr.aria-pressed]="show()">{{ show() ? 'Masquer' : 'Afficher' }}</button>
            </div>
            <div class="mt-2 flex gap-1" aria-hidden="true">
              @for (i of [1, 2, 3, 4]; track i) { <span class="h-1.5 flex-1 rounded-full" [class]="i <= score() ? 'bg-odc-brand-orange' : 'bg-gray-200'"></span> }
            </div>
            @if (form.controls.password.touched && form.controls.password.invalid) { <p class="mt-1 text-sm text-red-700">Au moins 8 caractères.</p> }
          </div>
          <div>
            <label for="confirm" class="mb-1 block text-sm font-bold">Confirmer</label>
            <input id="confirm" [type]="show() ? 'text' : 'password'" formControlName="confirm" class="auth-input" autocomplete="new-password" [attr.aria-invalid]="mismatch()" />
            @if (mismatch()) { <p class="mt-1 text-sm text-red-700">Les mots de passe ne correspondent pas.</p> }
          </div>
          <button type="submit" class="auth-btn" [disabled]="loading()">{{ loading() ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </form>
      }
    </app-auth-shell>
  `,
})
export class ResetPasswordComponent {
  readonly token = input<string>(); // lié au paramètre ?token= (withComponentInputBinding)
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly show = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ password: ['', [Validators.required, Validators.minLength(8)]], confirm: ['', Validators.required] });
  private readonly pw = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  private readonly cf = toSignal(this.form.controls.confirm.valueChanges, { initialValue: '' });
  readonly score = computed(() => {
    const p = this.pw();
    return p.length < 8 ? (p ? 1 : 0) : Math.min(4, 1 + +(/[a-z]/.test(p) && /[A-Z]/.test(p)) + +/\d/.test(p) + +/[^A-Za-z0-9]/.test(p));
  });
  readonly mismatch = computed(() => this.form.controls.confirm.touched && this.cf() !== this.pw());

  submit(): void {
    this.form.markAllAsTouched();
    const { password, confirm } = this.form.getRawValue();
    const token = this.token();
    if (!token || this.form.invalid || password !== confirm) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.resetPassword(token, password).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); setTimeout(() => void this.router.navigate(['/login']), 2000); },
      error: (e) => { this.loading.set(false); this.error.set(e?.error?.message || 'Lien invalide ou expiré.'); },
    });
  }
}
