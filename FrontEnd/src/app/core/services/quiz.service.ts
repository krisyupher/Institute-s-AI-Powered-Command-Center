import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import {
  MOCK_AVAILABLE_QUIZZES,
  MOCK_QUIZ_RESULTS,
  MOCK_QUIZZES,
} from '../mock/mock-data';
import {
  AvailableQuiz,
  GenerateQuizRequest,
  Question,
  Quiz,
  QuizResult,
  SubmitQuizRequest,
  SubmitQuizResponse,
} from '../models/quiz.model';

// Builds a fresh draft question from the raw generator payload
function draftQuestion(quizId: number, index: number): Question {
  return {
    id: -1, // negative placeholder until saved by `POST /api/quiz/save`
    quizId,
    text: `Draft question ${index + 1} about the requested topic.`,
    optionA: 'Option A',
    optionB: 'Option B',
    optionC: 'Option C',
    optionD: 'Option D',
    correctAnswer: 'A',
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}

/**
 * Quiz client. Currently serves mock data; the method signatures match
 * `GET/POST /api/quiz/*` from docs/PROJECT_PLAN.md, so wiring the real API
 * means replacing each body with `this.http.*` and nothing in callers changes.
 */
@Injectable({ providedIn: 'root' })
export class QuizService {
  private static readonly latencyMs = 250;

  // Lists published quizzes for students
  getAvailableQuizzes(): Observable<AvailableQuiz[]> {
    return of(MOCK_AVAILABLE_QUIZZES).pipe(delay(QuizService.latencyMs));
  }

  // Returns one quiz by id (for teachers reviewing full drafts)
  getQuizById(id: number): Observable<Quiz | undefined> {
    return of(MOCK_QUIZZES.find((q) => q.id === id)).pipe(delay(QuizService.latencyMs));
  }

  // Requests `POST /api/quiz/generate`; returns raw draft questions
  generateQuiz(request: GenerateQuizRequest): Observable<Question[]> {
    const drafts = Array.from({ length: request.questionCount }, (_, i) =>
      draftQuestion(-1, i),
    );
    return of(drafts).pipe(delay(QuizService.latencyMs));
  }

  // Accepts student answers, evaluates them, records a `QuizResult`
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

  // Returns the calling student's past results
  getStudentResults(): Observable<QuizResult[]> {
    return of(MOCK_QUIZ_RESULTS).pipe(delay(QuizService.latencyMs));
  }
}
