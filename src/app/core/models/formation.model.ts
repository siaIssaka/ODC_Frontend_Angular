import type { User } from './user.model';

export interface Formation {
  id: number;
  title: string;
  description: string | null;
  active: boolean;
  categoryId: number | null;
  categoryName: string | null;
  imageKey: string | null;
  categoryImageKey: string | null;
  trainers: { id: number; name: string; photoKey: string | null }[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  imageKey?: string | null;
}

export interface Assignment {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description: string | null;
  opensAt: string;
  closesAt: string;
  status: 'PLANIFIE' | 'OUVERT' | 'FERME';
  submitted: boolean;
  grade: number | null;
}

export interface ProgressInfo {
  courseId: number;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface EnrollmentInfo {
  id: number;
  courseId: number;
  courseTitle: string;
  sessionId: number | null;
  sessionName: string | null;
  sessionStartsAt: string | null;
  sessionEndsAt: string | null;
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED';
}

export interface EnrollmentCandidates {
  enrolledCount: number;
  learners: User[];
  enrolledLearners: EnrolledLearner[];
}

export interface EnrolledLearner {
  learner: User;
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED';
  enrolledAt: string;
}

export interface EnrollmentBatchResult {
  enrolledCount: number;
  alreadyEnrolledCount: number;
}

export interface Submission {
  id: number;
  learnerId: number;
  learnerName: string;
  originalName: string | null;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
}
