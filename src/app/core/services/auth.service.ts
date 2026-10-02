import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import {
  JwtResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  User,
  UserRole,
} from '../models/user.model';

/**
 * Service d'authentification central.
 *
 * Responsabilités :
 * - login / register / logout
 * - conserver l'utilisateur courant (signal Angular)
 * - charger le profil via GET /users/me
 *
 * Les composants ne doivent JAMAIS appeler HttpClient directement pour l'auth :
 * ils passent toujours par ce service.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);
  private readonly base = environment.apiUrl;

  /** Utilisateur connecté (null si anonyme). signal = état réactif Angular moderne. */
  private readonly currentUserSignal = signal<User | null>(null);

  /** Lecture seule pour les templates et les guards. */
  readonly currentUser = this.currentUserSignal.asReadonly();

  /** true si un utilisateur est chargé en mémoire. */
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  readonly role = computed<UserRole | null>(() => this.currentUserSignal()?.role ?? null);

  /** Connexion : envoie email/mot de passe, stocke le JWT, charge le profil. */
  login(payload: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.base}/auth/login`, payload).pipe(
      tap((res) => {
        // 1. Sauvegarder le token pour les prochaines requêtes (interceptor)
        this.tokens.save(res.token);
      }),
    );
  }

  /** Demande d'e-mail de réinitialisation (réponse identique que le compte existe ou non). */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/reset-password`, { token, newPassword });
  }

  /** Connexion Google : envoie l'ID token Google, reçoit notre JWT. */
  googleLogin(credential: string): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.base}/auth/google`, { credential }).pipe(tap((res) => this.tokens.save(res.token)));
  }

  private config$?: Observable<{ googleClientId: string | null }>;

  authConfig(): Observable<{ googleClientId: string | null }> {
    this.config$ ??= this.http.get<{ googleClientId: string | null }>(`${this.base}/auth/config`).pipe(shareReplay(1));
    return this.config$;
  }

  /** Inscription publique (APPRENANT ou FORMATEUR uniquement côté backend). */
  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, payload);
  }

  /**
   * Charge le profil de l'utilisateur authentifié.
   * Appelé après login et au démarrage de l'app si un token existe déjà.
   */
  loadCurrentUser(): Observable<User | null> {
    if (!this.tokens.hasToken()) {
      this.currentUserSignal.set(null);
      return of(null);
    }

    return this.http.get<User>(`${this.base}/users/me`).pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError(() => {
        // Token invalide ou expiré → on nettoie
        this.tokens.clear();
        this.currentUserSignal.set(null);
        return of(null);
      }),
    );
  }

  updateProfile(payload: ProfileUpdateRequest): Observable<User> {
    return this.http.put<ProfileUpdateResponse>(`${this.base}/profile`, payload).pipe(
      tap((response) => {
        this.tokens.save(response.token);
        this.currentUserSignal.set(response.user);
      }),
      map((response) => response.user),
    );
  }

  /** Déconnexion : efface token + état local, redirige vers login. */
  logout(): void {
    this.tokens.clear();
    this.currentUserSignal.set(null);
    void this.router.navigate(['/login']);
  }

  /** Redirige vers le tableau de bord adapté au rôle. */
  redirectAfterLogin(role: UserRole): void {
    switch (role) {
      case 'ADMIN':
        void this.router.navigate(['/dashboard/admin']);
        break;
      case 'FORMATEUR':
        void this.router.navigate(['/dashboard/formateur']);
        break;
      default:
        void this.router.navigate(['/dashboard/apprenant']);
    }
  }

  /** Nom affiché dans la barre de navigation. */
  displayName(): string {
    const u = this.currentUserSignal();
    if (!u) return '';
    return `${u.prenom} ${u.nom}`.trim();
  }
}
