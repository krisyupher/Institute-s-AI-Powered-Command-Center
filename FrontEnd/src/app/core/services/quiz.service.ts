import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MOCK_AVAILABLE_QUIZZES,
  MOCK_QUIZ_RESULTS,
  MOCK_QUIZZES,
  MOCK_SUBJECTS,
} from '../mock/mock-data';
import {
  AvailableQuiz,
  GeneratedQuestion,
  GenerateQuizRequest,
  Question,
  Quiz,
  QuizDraft,
  QuizResult,
  SaveQuizRequest,
  SaveQuizResponse,
  SubmitQuizRequest,
  SubmitQuizResponse,
  Subject,
} from '../models/quiz.model';

// Quiz client. generateQuiz/saveQuiz hit the live backend (/api/quiz);
// the remaining methods serve mock data because those endpoints are not
// implemented on the backend yet. Signatures match docs/PROJECT_PLAN.md.
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  // Absolute origin (same as auth.service) — a relative /api path would resolve
  // against the SPA's own dev-server origin (:4200) and 404.
  private readonly baseUrl = `${environment.apiBaseUrl}/api/quiz`;
  private static readonly latencyMs = 250;

  // POST /api/quiz/generate — real backend call; returns raw AI questions
  generateQuiz(request: GenerateQuizRequest): Observable<GeneratedQuestion[]> {
    return this.http.post<GeneratedQuestion[]>(`${this.baseUrl}/generate`, request);
  }

  // POST /api/quiz/save — real backend call; persists the edited quiz
  saveQuiz(request: SaveQuizRequest): Observable<SaveQuizResponse> {
    return this.http.post<SaveQuizResponse>(`${this.baseUrl}/save`, request);
  }

  // Lists published quizzes for students (backend GET /available pending)
  getAvailableQuizzes(): Observable<AvailableQuiz[]> {
    return of(MOCK_AVAILABLE_QUIZZES).pipe(delay(QuizService.latencyMs));
  }

  // Returns one quiz by id (backend GET /{id} pending)
  getQuizById(id: number): Observable<Quiz | undefined> {
    return of(MOCK_QUIZZES.find((q) => q.id === id)).pipe(delay(QuizService.latencyMs));
  }

  // Accepts student answers, evaluates them, records a QuizResult (backend pending)
  submitQuiz(request: SubmitQuizRequest): Observable<SubmitQuizResponse> {
    const quiz = MOCK_QUIZZES.find((q) => q.id === request.quizId);
    if (!quiz) {
      return throwError(() => new Error(`Quiz ${request.quizId} not found`));
    }

    const correctCount = quiz.questions.reduce(
      (tally, question) =>
        tally + (request.answers[question.id] === question.correctAnswer ? 1 : 0),
      0,
    );
    const response: SubmitQuizResponse = {
      quizId: quiz.id,
      studentId: 2, // mock student (Ana Morales)
      score: correctCount,
      totalQuestions: quiz.questions.length,
      correctCount,
      completedAt: new Date().toISOString(),
    };
    return of(response).pipe(delay(QuizService.latencyMs));
  }

  // Returns the teacher's in-progress draft quiz (unpublished) for the
  // preview-and-edit screen (Ticket 3.4). Mock fallback: the backend has no
  // GET draft endpoint, so a generated quiz is normally handed to the
  // preview via router state instead. Used only when navigating directly.
  getDraftQuiz(): Observable<QuizDraft> {
    const draft = MOCK_QUIZZES.find((q) => q.id === 3 && !q.isPublished);
    if (!draft) {
      return throwError(() => new Error('No draft quiz found'));
    }
    const subject = MOCK_SUBJECTS.find((s) => s.id === draft.subjectId);
    const quizDraft: QuizDraft = {
      ...draft,
      difficulty: 'Medium',
      subjectName: subject?.name ?? 'Unknown subject',
    };
    return of(quizDraft).pipe(delay(QuizService.latencyMs));
  }

  // Returns the calling student's past results (backend pending)
  getStudentResults(): Observable<QuizResult[]> {
    return of(MOCK_QUIZ_RESULTS).pipe(delay(QuizService.latencyMs));
  }

  // Returns full quiz entities for a teacher's quiz list (backend pending)
  getTeacherQuizzes(): Observable<Quiz[]> {
    return of(MOCK_QUIZZES).pipe(delay(QuizService.latencyMs));
  }

  // Returns the subject breakdown for the admin analytics dashboard (backend pending)
  getSubjectStats(): Observable<Subject[]> {
    return of(MOCK_SUBJECTS).pipe(delay(QuizService.latencyMs));
  }
}
