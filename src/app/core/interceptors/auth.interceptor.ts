import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Intercepteur HTTP : ajoute automatiquement
 *   Authorization: Bearer <token>
 * sur chaque requête sortante, sauf si aucun token n'est stocké.
 *
 * Ainsi les composants n'ont pas à gérer le header manuellement.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.get();

  // Endpoints publics d'auth : pas besoin de token
  const isPublicAuth =
    req.url.includes('/auth/login') || req.url.includes('/auth/register');

  if (!token || isPublicAuth) {
    return next(req);
  }

  // Clone de la requête avec le header Authorization
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        tokenService.clear();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
