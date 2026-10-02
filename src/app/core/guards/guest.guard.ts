import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { map, of } from 'rxjs';

/**
 * Empêche un utilisateur déjà connecté d'accéder aux pages login/register.
 * S'il a un token valide, on le redirige vers son dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const tokens = inject(TokenService);

  if (auth.isAuthenticated()) {
    const role = auth.role();
    if (role) auth.redirectAfterLogin(role);
    return false;
  }

  if (tokens.hasToken()) {
    return auth.loadCurrentUser().pipe(
      map((user) => {
        if (user) {
          auth.redirectAfterLogin(user.role);
          return false;
        }
        return true;
      }),
    );
  }

  return of(true);
};
