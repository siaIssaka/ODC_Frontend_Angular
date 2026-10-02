import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Guard de rôle.
 * Utilisation dans les routes :
 *   canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] }
 *
 * Vérifie que le rôle de l'utilisateur fait partie de la liste autorisée.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as UserRole[] | undefined) ?? [];
  const role = auth.role();

  if (role && (allowed.length === 0 || allowed.includes(role))) {
    return true;
  }

  // Mauvais rôle → on renvoie vers son propre dashboard
  if (role) {
    auth.redirectAfterLogin(role);
  } else {
    void router.navigate(['/login']);
  }
  return false;
};
