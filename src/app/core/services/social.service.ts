import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AttemptResult, Contact, ForumPost, ForumThread, LearnerTracking, Message, Quiz, QuizDraft, TrainerOverview } from '../models/social.model';

/** Quiz, messagerie, forums, suivi et vue admin : un service, les routes Spring correspondantes. */
@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly b = environment.apiUrl;

  mediaUrl(key: string | null | undefined): string | null { return key ? `${this.b}/media/${key}` : null; }

  getQuiz(lessonId: number): Observable<Quiz | null> { return this.http.get<Quiz | null>(`${this.b}/quizzes/lesson/${lessonId}`); }
  saveQuiz(lessonId: number, q: QuizDraft): Observable<Quiz> { return this.http.put<Quiz>(`${this.b}/quizzes/lesson/${lessonId}`, q); }
  attempt(quizId: number, answers: Record<number, number[]>): Observable<AttemptResult> { return this.http.post<AttemptResult>(`${this.b}/quizzes/${quizId}/attempts`, { answers }); }

  completeLesson(lessonId: number): Observable<void> { return this.http.post<void>(`${this.b}/progress/lessons/${lessonId}/complete`, null); }
  completedLessons(courseId: number): Observable<number[]> { return this.http.get<number[]>(`${this.b}/progress/course/${courseId}/completed`); }

  contacts(): Observable<Contact[]> { return this.http.get<Contact[]>(`${this.b}/messages/contacts`); }
  inbox(): Observable<Message[]> { return this.http.get<Message[]>(`${this.b}/messages/inbox`); }
  sent(): Observable<Message[]> { return this.http.get<Message[]>(`${this.b}/messages/sent`); }
  unread(): Observable<number> { return this.http.get<number>(`${this.b}/messages/unread-count`); }
  markRead(id: number): Observable<void> { return this.http.patch<void>(`${this.b}/messages/${id}/read`, null); }
  send(recipientId: number, subject: string, body: string): Observable<Message> { return this.http.post<Message>(`${this.b}/messages`, { recipientId, subject, body }); }

  threads(formationId: number): Observable<ForumPost[]> { return this.http.get<ForumPost[]>(`${this.b}/forums/formation/${formationId}/threads`); }
  createThread(formationId: number, title: string, body: string): Observable<ForumPost> { return this.http.post<ForumPost>(`${this.b}/forums/formation/${formationId}/threads`, { title, body }); }
  thread(id: number): Observable<ForumThread> { return this.http.get<ForumThread>(`${this.b}/forums/threads/${id}`); }
  reply(id: number, body: string): Observable<ForumPost> { return this.http.post<ForumPost>(`${this.b}/forums/threads/${id}/replies`, { body }); }

  tracking(courseId: number): Observable<LearnerTracking[]> { return this.http.get<LearnerTracking[]>(`${this.b}/tracking/course/${courseId}`); }
  trainers(): Observable<TrainerOverview[]> { return this.http.get<TrainerOverview[]>(`${this.b}/admin/trainers`); }

  uploadPhoto(file: File): Observable<User> {
    const f = new FormData();
    f.append('file', file, file.name);
    return this.http.post<User>(`${this.b}/profile/photo`, f);
  }
}
