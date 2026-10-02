/**
 * Modèles liés aux utilisateurs.
 * Les noms de champs (nom, prenom, role) correspondent exactement
 * aux DTO Java du backend pour éviter les erreurs de mapping.
 */

/** Rôles métier définis côté backend (enum Role). */
export type UserRole = 'ADMIN' | 'FORMATEUR' | 'APPRENANT';

/** Profil utilisateur renvoyé par GET /api/v1/users/me */
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  photoKey?: string | null;
}

export interface ProfileUpdateRequest {
  nom: string;
  prenom: string;
  email: string;
}

export interface ProfileUpdateResponse {
  user: User;
  token: string;
}

/** Corps de la requête POST /api/v1/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Corps de la requête POST /api/v1/auth/register */
export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  /** Le backend réserve l'inscription publique aux apprenants. */
  role: 'APPRENANT';
}

/** Réponse de login : JWT + métadonnées */
export interface JwtResponse {
  token: string;
  type: string;
  expiresIn: number;
}

/** Réponse d'inscription */
export interface RegisterResponse {
  message: string;
}

/** Corps attendu par POST /api/v1/admin/create-admin. */
export interface CreateAdminRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  role: 'ADMIN';
}

/** Corps pour POST /api/v1/admin/users. */
export interface CreateManagedUserRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  role: UserRole;
}
