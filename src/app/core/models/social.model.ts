export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export interface QuizOption { id?: number; label: string; correct?: boolean | null }
export interface QuizQuestion { id?: number; prompt: string; type: QuestionType; options: QuizOption[] }
export interface Quiz { id: number; lessonId: number; title: string; description: string | null; passingScore: number; questions: QuizQuestion[] }
export interface QuizDraft { title: string; description: string; passingScore: number; questions: QuizQuestion[] }
export interface AttemptResult { score: number; passed: boolean; passingScore: number; correct: number; total: number; wrongQuestionIds: number[] }

export interface Contact { id: number; name: string; role: string; photoKey: string | null }
export interface Message { id: number; senderId: number; senderName: string; recipientId: number; recipientName: string; subject: string; body: string; sentAt: string; read: boolean }

export interface ForumPost { id: number; authorId: number; title: string | null; body: string; authorName: string; authorRole: string; authorPhotoKey: string | null; createdAt: string; replies: number }
export interface ForumThread { thread: ForumPost; replies: ForumPost[] }

export interface LearnerTracking {
  userId: number; name: string; email: string; photoKey: string | null; percentage: number;
  completedLessons: number; totalLessons: number; quizAverage: number | null; quizAttempts: number;
  assignmentsTotal: number; assignmentsSubmitted: number; assignmentAverage: number | null;
}
export interface TrainerOverview {
  id: number; prenom: string; nom: string; email: string; photoKey: string | null; active: boolean;
  formations: string[];
  formationDetails: { id: number; title: string; courses: { id: number; title: string }[] }[];
  courses: number; lessons: number; learners: number; avgLearnerProgress: number;
}
