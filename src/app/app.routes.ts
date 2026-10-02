import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * Routes de l'application ODC Academy.
 *
 * Structure :
 * - /login, /register → layout auth (guestGuard)
 * - /catalogue, /profil, /dashboard/* → layout principal (authGuard)
 * - dashboards protégés par rôle (roleGuard + data.roles)
 *
 * Lazy-loading via loadComponent pour alléger le bundle initial.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalogue',
  },

  // ----- Authentification (visiteurs uniquement) -----
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'catalogue',
        loadComponent: () =>
          import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
        title: 'Catalogue — ODC Academy',
      },
      {
        path: 'conditions',
        loadComponent: () => import('./features/legal/conditions.component').then((m) => m.ConditionsComponent),
        title: "Conditions d'utilisation — ODC Academy",
      },
      {
        // Une seule page pour /login et /register : la navigation reste dans le même composant, donc le panneau glisse.
        path: '',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/auth-page.component').then((m) => m.AuthPageComponent),
        children: [
          { path: 'login', children: [], title: 'Connexion — ODC Academy' },
          { path: 'register', children: [], title: 'Inscription — ODC Academy' },
        ],
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/forgot/forgot-password.component').then((m) => m.ForgotPasswordComponent),
        title: 'Mot de passe oublié — ODC Academy',
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset/reset-password.component').then((m) => m.ResetPasswordComponent),
        title: 'Nouveau mot de passe — ODC Academy',
      },
    ],
  },

  // ----- Zone authentifiée -----
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'profil',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Mon profil — ODC Academy',
      },
      {
        path: 'cours/:id',
        loadComponent: () =>
          import('./features/course-detail/course-detail.component').then((m) => m.CourseDetailComponent),
        title: 'Cours — ODC Academy',
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/messages/messages.component').then((m) => m.MessagesComponent),
        title: 'Messagerie — ODC Academy',
      },
      {
        path: 'forum/:formationId',
        loadComponent: () => import('./features/forum/forum.component').then((m) => m.ForumComponent),
        title: 'Forum — ODC Academy',
      },
      {
        path: 'admin/apparence',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/branding/admin-branding.component').then((m) => m.AdminBrandingComponent),
        title: 'Identité visuelle — ODC Academy',
      },
      {
        path: 'admin/catalogue',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/catalog/admin-catalog.component').then((m) => m.AdminCatalogComponent),
        title: 'Gestion du catalogue — ODC Academy',
      },
      {
        path: 'admin/formateurs',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/trainers/admin-trainers.component').then((m) => m.AdminTrainersComponent),
        title: 'Formateurs — ODC Academy',
      },
      {
        path: 'admin/cohortes',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/cohorts/admin-cohorts.component').then((m) => m.AdminCohortsComponent),
        title: 'Cohortes et apprenants — ODC Academy',
      },
      {
        path: 'admin/utilisateurs',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/users/admin-users.component').then((m) => m.AdminUsersComponent),
        title: 'Gestion des utilisateurs — ODC Academy',
      },
      {
        path: 'dashboard/admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard Admin — ODC Academy',
      },
      {
        path: 'dashboard/formateur',
        canActivate: [roleGuard],
        data: { roles: ['FORMATEUR'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard Formateur — ODC Academy',
      },
      {
        path: 'dashboard/apprenant',
        canActivate: [roleGuard],
        data: { roles: ['APPRENANT'] },
        loadComponent: () =>
          import('./features/dashboard/learner-dashboard.component').then((m) => m.LearnerDashboardComponent),
        title: 'Mon espace apprenant — ODC Academy',
      },
    ],
  },

  // Route inconnue → catalogue (ou login si non connecté via guard)
  { path: '**', redirectTo: 'catalogue' },
];
