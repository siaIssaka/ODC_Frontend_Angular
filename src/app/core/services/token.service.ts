import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Gère le stockage du JWT dans le navigateur (localStorage).
 * On isole cette logique pour pouvoir changer facilement de stratégie
 * (sessionStorage, cookie HttpOnly, etc.) sans toucher au reste de l'app.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly key = environment.tokenStorageKey;

  /** Enregistre le token après un login réussi. */
  save(token: string): void {
    localStorage.setItem(this.key, token);
  }

  /** Récupère le token courant (ou null s'il n'y en a pas). */
  get(): string | null {
    return localStorage.getItem(this.key);
  }

  /** Supprime le token (déconnexion). */
  clear(): void {
    localStorage.removeItem(this.key);
  }

  /** Indique si un token est présent (sans vérifier sa validité côté serveur). */
  hasToken(): boolean {
    return !!this.get();
  }
}
