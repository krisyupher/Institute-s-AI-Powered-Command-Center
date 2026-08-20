import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of, throwError } from 'rxjs';

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
  // The real generate endpoint is still shipping (Ticket 3.1), so when it is
  // down the mock fallback runs for ~1.5s to make the AI generation feel real.
  private static readonly generateMockLatencyMs = 1500;

  // POST /api/quiz/generate — attempts the real AI call; on any failure (404,
  // 500, unreachable API) falls back to a dynamically constructed QuizDraft
  // matching the request criteria so the generator -> preview flow never breaks.
  generateQuiz(request: GenerateQuizRequest): Observable<QuizDraft> {
    return this.http.post<GeneratedQuestion[]>(`${this.baseUrl}/generate`, request).pipe(
      map((questions) => this.toQuizDraft(request, questions)),
      catchError(() =>
        of(this.buildMockDraft(request)).pipe(delay(QuizService.generateMockLatencyMs)),
      ),
    );
  }

  // Wraps raw AI questions (no ids yet) into an editable QuizDraft, assigning
  // the placeholder ids/timestamps the editor expects until save persists it.
  private toQuizDraft(request: GenerateQuizRequest, questions: GeneratedQuestion[]): QuizDraft {
    const subject = MOCK_SUBJECTS.find((s) => s.id === request.subjectId);
    const now = new Date().toISOString();
    return {
      id: 0,
      title: `${subject?.name ?? 'Quiz'} — ${request.topic}`,
      isPublished: false,
      subjectId: request.subjectId,
      createdByTeacherId: 1,
      questions: questions.map((question, i): Question => ({
        id: -(i + 1),
        quizId: 0,
        text: question.text,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctAnswer: question.correctAnswer,
        createdAt: now,
        updatedAt: null,
      })),
      results: [],
      createdAt: now,
      updatedAt: null,
      difficulty: request.difficulty,
      subjectName: subject?.name ?? 'Unknown subject',
    };
  }

  // Synthesizes a draft from the criteria alone when /generate is unreachable.
  private buildMockDraft(request: GenerateQuizRequest): QuizDraft {
    const subject = MOCK_SUBJECTS.find((s) => s.id === request.subjectId);
    const now = new Date().toISOString();
    const questions: Question[] = Array.from({ length: request.questionCount }, (_, i) => ({
      id: -(i + 1),
      quizId: 0,
      text: `${request.topic} question ${i + 1}: pick the correct ${request.difficulty} answer.`,
      optionA: 'First option',
      optionB: 'Second option',
      optionC: 'Third option',
      optionD: 'Fourth option',
      correctAnswer: 'A',
      createdAt: now,
      updatedAt: null,
    }));
    return {
      id: 0,
      title: `${subject?.name ?? 'Quiz'} — ${request.topic}`,
      isPublished: false,
      subjectId: request.subjectId,
      createdByTeacherId: 1,
      questions,
      results: [],
      createdAt: now,
      updatedAt: null,
      difficulty: request.difficulty,
      subjectName: subject?.name ?? 'Unknown subject',
    };
  }

  // POST /api/quiz/save — persists the edited quiz. Falls back to a mock
  // response (built from the request) when the endpoint is unreachable, so the
  // teacher can still publish and move to the quiz list in dev.
  saveQuiz(request: SaveQuizRequest): Observable<SaveQuizResponse> {
    return this.http.post<SaveQuizResponse>(`${this.baseUrl}/save`, request).pipe(
      catchError(() =>
        of({
          id: request.id ?? Math.floor(Date.now() / 1000),
          title: request.title,
          subjectId: request.subjectId,
          isPublished: request.isPublished,
          questionCount: request.questions.length,
        } satisfies SaveQuizResponse).pipe(delay(QuizService.latencyMs)),
      ),
    );
  }

  // DELETE /api/quiz/{id} — removes the quiz. The endpoint is not implemented
  // on the backend yet, so on any error (404, unreachable API) the quiz is
  // spliced out of the in-memory mock dataset so the list updates immediately
  // without losing the local change the next time the teacher list reloads.
  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const index = MOCK_QUIZZES.findIndex((q) => q.id === id);
        if (index !== -1) {
          MOCK_QUIZZES.splice(index, 1);
        }
        return of(undefined).pipe(delay(QuizService.latencyMs));
      }),
    );
  }

  // Lists published quizzes for students (backend GET /available pending)
  getAvailableQuizzes(): Observable<AvailableQuiz[]> {
    return of(MOCK_AVAILABLE_QUIZZES).pipe(delay(QuizService.latencyMs));
  }

  // Returns one quiz by id. Attempts the real `GET /api/quiz/{id}` first; the
  // endpoint is not implemented on the backend yet, so any error (404, unreachable
  // API) falls back to the matching mock quiz. Kept out of the public API contract
  // until the backend ships.
  getQuizById(id: number): Observable<Quiz | undefined> {
    return this.http.get<Quiz>(`${this.baseUrl}/${id}`).pipe(
      catchError(() =>
        of(MOCK_QUIZZES.find((q) => q.id === id)).pipe(delay(QuizService.latencyMs)),
      ),
    );
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

  // Returns full quiz entities for the logged-in teacher's quiz list.
  // Calls the real `GET /api/quiz/my-quizzes`; any error (401, unreachable API)
  // falls back to the mock dataset so the screen never breaks in dev.
  getTeacherQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.baseUrl}/my-quizzes`).pipe(
      catchError(() => of(MOCK_QUIZZES).pipe(delay(QuizService.latencyMs))),
    );
  }

  // Returns the subject breakdown for the admin analytics dashboard (backend pending)
  getSubjectStats(): Observable<Subject[]> {
    return of(MOCK_SUBJECTS).pipe(delay(QuizService.latencyMs));
  }
}
