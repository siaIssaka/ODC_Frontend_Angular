export interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  orderIndex: number | null;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string | null;
  moduleId: number | null;
  videoUrl: string | null;
  documentUrl: string | null;
  durationMinutes: number | null;
  orderIndex: number | null;
}

export interface CourseRequest {
  title: string;
  description: string;
  level: string;
  price: number;
}

export interface ModuleRequest {
  title: string;
  description: string;
  orderIndex: number;
}

export interface LessonRequest {
  title: string;
  content: string;
  moduleId?: number | null;
  videoUrl?: string | null;
  documentUrl?: string | null;
  durationMinutes?: number | null;
  orderIndex?: number;
}

export interface LiveSession {
  id: number;
  courseId: number;
  title: string;
  roomName: string | null;
  scheduledAt: string;
  status: 'PLANIFIE' | 'PREPARATION' | 'EN_COURS' | 'TERMINE';
  startedAt: string | null;
  endedAt: string | null;
}

export interface CourseSession {
  id: number;
  formationId: number | null;
  formationTitle: string | null;
  name: string;
  startsAt: string;
  endsAt: string;
  courses: { id: number; title: string }[];
  enrolledCount: number;
}

export interface AdminCohortOverview {
  id: number;
  formationTitle: string | null;
  name: string;
  startsAt: string;
  endsAt: string;
  courses: { id: number; title: string }[];
  enrolledLearners: {
    learner: import('./user.model').User;
    courseIds: number[];
    status: 'ACTIVE' | 'PENDING' | 'CANCELLED';
    enrolledAt: string | null;
  }[];
}

export interface CreateCourseSessionRequest {
  name: string;
  startsAt: string;
  endsAt: string;
  courseIds: number[];
}
