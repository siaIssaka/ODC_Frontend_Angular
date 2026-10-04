import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course } from '../models/course.model';
import { Assignment, Submission, Category, EnrollmentBatchResult, EnrollmentCandidates, EnrollmentInfo, Formation, ProgressInfo } from '../models/formation.model';
import { AdminCohortOverview, CreateCourseSessionRequest, CourseSession, Lesson, LessonRequest, LiveSession, Module, ModuleRequest, CourseRequest } from '../models/learning.model';

/**
 * Appels du catalogue et des contenus pédagogiques, alignés sur les routes Spring.
 * Le catalogue des cours est public ; le contenu pédagogique exige une inscription active.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private readonly formationsChanged = new Subject<void>();
  readonly formationsChanged$ = this.formationsChanged.asObservable();

  notifyFormationsChanged(): void {
    this.formationsChanged.next();
  }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}/courses`);
  }

  getMediaBlob(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  getFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.base}/formations`);
  }

  getMyFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.base}/formations/mine`);
  }

  createFormation(payload: Pick<Formation, 'title' | 'description'>): Observable<Formation> {
    return this.http.post<Formation>(`${this.base}/formations`, payload);
  }

  updateFormation(formationId: number, payload: Pick<Formation, 'title' | 'description' | 'categoryId'>): Observable<Formation> {
    return this.http.put<Formation>(`${this.base}/formations/${formationId}`, payload);
  }

  deleteFormation(formationId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/formations/${formationId}`);
  }

  assignTrainer(formationId: number, trainerId: number): Observable<Formation> {
    return this.http.post<Formation>(`${this.base}/formations/${formationId}/trainers/${trainerId}`, null);
  }

  createCourse(formationId: number, payload: CourseRequest): Observable<Course> {
    return this.http.post<Course>(`${this.base}/courses/formation/${formationId}`, payload);
  }

  updateCourse(courseId: number, payload: CourseRequest): Observable<Course> {
    return this.http.put<Course>(`${this.base}/courses/${courseId}`, payload);
  }

  deleteCourse(courseId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/courses/${courseId}`);
  }

  getCourse(courseId: number): Observable<Course> {
    return this.http.get<Course>(`${this.base}/courses/${courseId}`);
  }

  getModules(courseId: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.base}/modules/course/${courseId}`);
  }

  createModule(courseId: number, payload: ModuleRequest): Observable<Module> {
    return this.http.post<Module>(`${this.base}/modules/course/${courseId}`, payload);
  }

  getLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.base}/lessons/course/${courseId}`);
  }

  createLesson(courseId: number, payload: LessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.base}/lessons/course/${courseId}`, payload);
  }

  createLessonWithFiles(courseId: number, payload: LessonRequest, video: File | null, document: File | null): Observable<Lesson> {
    const form = new FormData();
    form.append('lesson', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (video) form.append('video', video, video.name);
    if (document) form.append('document', document, document.name);
    return this.http.post<Lesson>(`${this.base}/lessons/course/${courseId}/with-files`, form);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  createFormationInCategory(payload: { title: string; description: string; categoryId: number | null }): Observable<Formation> {
    return this.http.post<Formation>(`${this.base}/formations`, payload);
  }

  getEnrollments(userId: number): Observable<EnrollmentInfo[]> {
    return this.http.get<EnrollmentInfo[]>(`${this.base}/enrollments/user/${userId}`);
  }

  enrollUserToCourse(userId: number, courseId: number): Observable<EnrollmentInfo> {
    return this.http.post<EnrollmentInfo>(`${this.base}/enrollments/user/${userId}/course/${courseId}`, null);
  }

  getEnrollmentCandidates(courseId: number): Observable<EnrollmentCandidates> {
    return this.http.get<EnrollmentCandidates>(`${this.base}/enrollments/course/${courseId}/candidates`);
  }

  enrollLearnersToCourse(courseId: number, userIds: number[]): Observable<EnrollmentBatchResult> {
    return this.http.post<EnrollmentBatchResult>(`${this.base}/enrollments/course/${courseId}/learners`, { userIds });
  }

  getFormationSessions(formationId: number): Observable<CourseSession[]> {
    return this.http.get<CourseSession[]>(`${this.base}/formations/${formationId}/sessions`);
  }

  getAdminCohorts(): Observable<AdminCohortOverview[]> {
    return this.http.get<AdminCohortOverview[]>(`${this.base}/admin/cohorts`);
  }

  createFormationSession(formationId: number, payload: CreateCourseSessionRequest): Observable<CourseSession> {
    return this.http.post<CourseSession>(`${this.base}/formations/${formationId}/sessions`, payload);
  }

  addCoursesToSession(sessionId: number, courseIds: number[]): Observable<CourseSession> {
    return this.http.post<CourseSession>(`${this.base}/course-sessions/${sessionId}/courses`, { courseIds });
  }

  getSessionEnrollmentCandidates(sessionId: number): Observable<EnrollmentCandidates> {
    return this.http.get<EnrollmentCandidates>(`${this.base}/course-sessions/${sessionId}/candidates`);
  }

  enrollLearnersToSession(sessionId: number, userIds: number[]): Observable<EnrollmentBatchResult> {
    return this.http.post<EnrollmentBatchResult>(`${this.base}/course-sessions/${sessionId}/learners`, { userIds });
  }

  getProgress(userId: number): Observable<ProgressInfo[]> {
    return this.http.get<ProgressInfo[]>(`${this.base}/progress/user/${userId}`);
  }

  getMyAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.base}/assignments/mine`);
  }

  submitAssignment(id: number, file: File | null, text?: string): Observable<Assignment> {
    const form = new FormData();
    if (file) form.append('file', file, file.name);
    if (text !== undefined) form.append('text', text);
    return this.http.post<Assignment>(`${this.base}/assignments/${id}/submit`, form);
  }

  getCourseAssignments(courseId: number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.base}/assignments/course/${courseId}`);
  }

  createAssignment(courseId: number, payload: { title: string; description: string; opensAt: string; closesAt: string }): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.base}/assignments/course/${courseId}`, payload);
  }

  updateAssignment(id: number, payload: { title: string; description: string; opensAt: string; closesAt: string }): Observable<Assignment> {
    return this.http.put<Assignment>(`${this.base}/assignments/${id}`, payload);
  }

  getLiveSessions(courseId: number): Observable<LiveSession[]> {
    return this.http.get<LiveSession[]>(`${this.base}/live-sessions/course/${courseId}`);
  }

  scheduleLiveSession(courseId: number, title: string, scheduledAt: string): Observable<LiveSession> {
    return this.http.post<LiveSession>(`${this.base}/live-sessions/course/${courseId}`, { title, scheduledAt });
  }

  startLiveSession(id: number): Observable<LiveSession> {
    return this.http.patch<LiveSession>(`${this.base}/live-sessions/${id}/start`, {});
  }

  publishLiveSession(id: number): Observable<LiveSession> {
    return this.http.patch<LiveSession>(`${this.base}/live-sessions/${id}/publish`, {});
  }

  endLiveSession(id: number): Observable<LiveSession> {
    return this.http.patch<LiveSession>(`${this.base}/live-sessions/${id}/end`, {});
  }

  getSubmissions(assignmentId: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.base}/assignments/${assignmentId}/submissions`);
  }

  gradeSubmission(id: number, grade: number, feedback: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/assignments/submissions/${id}/grade`, { grade, feedback });
  }

  downloadSubmission(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/assignments/submissions/${id}/file`, { responseType: 'blob' });
  }

  createCategory(payload: { name: string; description: string }): Observable<Category> {
    return this.http.post<Category>(`${this.base}/categories`, payload);
  }

  updateCategory(id: number, payload: { name: string; description: string }): Observable<Category> {
    return this.http.patch<Category>(`${this.base}/categories/${id}`, payload);
  }

  deactivateCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  uploadCategoryImage(id: number, file: File): Observable<Category> {
    const f = new FormData();
    f.append('file', file, file.name);
    return this.http.post<Category>(`${this.base}/categories/${id}/image`, f);
  }

  uploadFormationImage(id: number, file: File): Observable<Formation> {
    const f = new FormData();
    f.append('file', file, file.name);
    return this.http.post<Formation>(`${this.base}/formations/${id}/image`, f);
  }
}
