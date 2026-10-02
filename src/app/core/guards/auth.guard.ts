import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/**
 * Guard d'authentification.
 * Bloque l'accès aux routes privées si l'utilisateur n'est pas connecté.
 * Si un token existe mais que le profil n'est pas encore chargé,
 * on tente de le recharger via /users/me.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const tokens = inject(TokenService);
  const router = inject(Router);

  // Déjà chargé en mémoire
  if (auth.isAuthenticated()) {
    return true;
  }

  // Token présent → on récupère le profil
  if (tokens.hasToken()) {
    return auth.loadCurrentUser().pipe(
      map((user) => {
        if (user) return true;
        void router.navigate(['/login']);
        return false;
      }),
    );
  }

  // Pas de token → redirection login
  void router.navigate(['/login']);
  return of(false);
};
