/**
 * Modèle formation/cours (aligné sur l'entité Course du backend).
 * Le catalogue public consomme ces données quand l'API est disponible.
 */
export interface Course {
  id: number;
  formationId: number;
  title: string;
  description: string | null;
  level: string;
  price: number;
  active: boolean;
  createdAt: string | null;
  createdById: number | null;
  createdByName: string | null;
}
