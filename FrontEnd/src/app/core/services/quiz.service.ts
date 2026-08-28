import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AnswerOption,
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

/** One quiz as `GET /api/quiz/available` returns it — see StudentQuizContracts.cs
 *  `AvailableQuizResponse`/`StudentQuestionResponse`. Correct answers are withheld
 *  server-side, not just hidden client-side. */
interface AvailableQuizDto {
  id: number;
  title: string;
  subjectId: number;
  questions: {
    id: number;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  }[];
}

/** Body `POST /api/quiz/submit` returns — see StudentQuizContracts.cs `QuizResultResponse`. */
interface QuizResultDto {
  quizId: number;
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  completedAt: string;
  questionResults: {
    questionId: number;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

// Quiz client. Every method calls the live backend (/api/quiz, /api/subjects) —
// there is no mock data or fallback left; a down/unreachable API surfaces as a
// real error to the caller. Signatures match docs/PROJECT_PLAN.md.
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  // Absolute origin (same as auth.service) — a relative /api path would resolve
  // against the SPA's own dev-server origin (:4200) and 404.
  private readonly baseUrl = `${environment.apiBaseUrl}/api/quiz`;

  // POST /api/quiz/generate — the AI draft, plus the subject catalog to resolve
  // a display name for it. If either call fails (AI provider down/misconfigured,
  // API unreachable) the error propagates — no synthesized fallback quiz.
  generateQuiz(request: GenerateQuizRequest): Observable<QuizDraft> {
    return forkJoin({
      questions: this.http.post<GeneratedQuestion[]>(`${this.baseUrl}/generate`, request),
      subjects: this.getSubjectStats(),
    }).pipe(map(({ questions, subjects }) => this.toQuizDraft(request, questions, subjects)));
  }

  // Wraps raw AI questions (no ids yet) into an editable QuizDraft, assigning
  // the placeholder ids/timestamps the editor expects until save persists it.
  private toQuizDraft(
    request: GenerateQuizRequest,
    questions: GeneratedQuestion[],
    subjects: Subject[],
  ): QuizDraft {
    const subject = subjects.find((s) => s.id === request.subjectId);
    const now = new Date().toISOString();
    return {
      id: 0,
      title: `${subject?.name ?? `Subject #${request.subjectId}`} — ${request.topic}`,
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
      subjectName: subject?.name ?? `Subject #${request.subjectId}`,
    };
  }

  // POST /api/quiz/save — persists the edited quiz (create, or replace-in-place
  // when request.id is set).
  saveQuiz(request: SaveQuizRequest): Observable<SaveQuizResponse> {
    return this.http.post<SaveQuizResponse>(`${this.baseUrl}/save`, request);
  }

  // DELETE /api/quiz/{id} — removes the quiz.
  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // GET /api/quiz/available — every published quiz in its student-safe shape
  // (no correct answers). [Authorize(Roles = "Student")], so a teacher/admin
  // token gets a 403 here same as any other caller that isn't a student.
  private fetchAvailable(): Observable<AvailableQuizDto[]> {
    return this.http.get<AvailableQuizDto[]>(`${this.baseUrl}/available`);
  }

  // Lists published quizzes for students: the real GET /api/quiz/available,
  // mapped down to the summary shape the list view renders, with the real
  // subject catalog resolving each quiz's subject name.
  getAvailableQuizzes(): Observable<AvailableQuiz[]> {
    return forkJoin({
      quizzes: this.fetchAvailable(),
      subjects: this.getSubjectStats(),
    }).pipe(map(({ quizzes, subjects }) => quizzes.map((dto) => this.toAvailableQuiz(dto, subjects))));
  }

  // AvailableQuizResponse carries no teacher info at all — never fabricate one,
  // leave createdByTeacher/publishedAt unset (both optional on AvailableQuiz).
  private toAvailableQuiz(dto: AvailableQuizDto, subjects: Subject[]): AvailableQuiz {
    return {
      id: dto.id,
      title: dto.title,
      subject: subjects.find((s) => s.id === dto.subjectId) ?? {
        id: dto.subjectId,
        name: `Subject #${dto.subjectId}`,
        code: '',
        createdAt: '',
        updatedAt: null,
      },
      questionCount: dto.questions.length,
    };
  }

  // Returns one quiz by id. Tries the teacher/admin `GET /api/quiz/{id}` first
  // (has the real correct answers, needed for the edit flow); a student token
  // gets a 403 there, so on any error this falls back to the student-safe
  // GET /api/quiz/available list and picks the matching id. If neither has it,
  // the error propagates.
  getQuizById(id: number): Observable<Quiz | undefined> {
    return this.http.get<Quiz>(`${this.baseUrl}/${id}`).pipe(
      catchError(() =>
        this.fetchAvailable().pipe(
          map((dtos) => {
            const dto = dtos.find((q) => q.id === id);
            if (!dto) {
              throw new Error(`Quiz ${id} was not found.`);
            }
            return this.toStudentQuiz(dto);
          }),
        ),
      ),
    );
  }

  // Maps the student-safe DTO onto the shared Quiz/Question shape. The backend
  // intentionally withholds each question's correct answer from a student (see
  // StudentQuestionResponse) — grading happens server-side in POST
  // .../submit — and TakeQuizComponent never reads Question.correctAnswer, so a
  // placeholder stands in for the value that's correctly never sent here.
  private toStudentQuiz(dto: AvailableQuizDto): Quiz {
    const now = new Date().toISOString();
    return {
      id: dto.id,
      title: dto.title,
      isPublished: true,
      subjectId: dto.subjectId,
      createdByTeacherId: 0,
      questions: dto.questions.map(
        (q): Question => ({
          id: q.id,
          quizId: dto.id,
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: 'A',
          createdAt: now,
          updatedAt: null,
        }),
      ),
      results: [],
      createdAt: now,
      updatedAt: null,
    };
  }

  // POST /api/quiz/submit — grades server-side against the DB's stored answers
  // and records a QuizResult; the Record<questionId, answer> shape the caller
  // builds gets flattened into the {questionId, selectedAnswer}[] body the API
  // expects.
  submitQuiz(request: SubmitQuizRequest): Observable<SubmitQuizResponse> {
    const body = {
      quizId: request.quizId,
      answers: Object.entries(request.answers).map(([questionId, selectedAnswer]) => ({
        questionId: Number(questionId),
        selectedAnswer,
      })),
    };

    return this.http.post<QuizResultDto>(`${this.baseUrl}/submit`, body).pipe(
      map(
        (dto): SubmitQuizResponse => ({
          quizId: dto.quizId,
          score: dto.scorePercentage,
          totalQuestions: dto.totalQuestions,
          correctCount: dto.correctCount,
          completedAt: dto.completedAt,
          questionResults: (dto.questionResults ?? []).map((r) => ({
            questionId: r.questionId,
            text: '',
            selectedAnswer: r.selectedAnswer as AnswerOption,
            correctAnswer: r.correctAnswer as AnswerOption,
            isCorrect: r.isCorrect,
          })),
        }),
      ),
    );
  }

  // Returns the teacher's most recent unpublished quiz, for the preview screen
  // when it's reached without router state (hard refresh, or a direct link) —
  // the normal generate -> preview flow hands the draft over via router state
  // instead. There's no dedicated "current draft" concept on the backend, so
  // this derives it from the real GET /api/quiz/my-quizzes list.
  getDraftQuiz(): Observable<QuizDraft> {
    return forkJoin({
      quizzes: this.getTeacherQuizzes(),
      subjects: this.getSubjectStats(),
    }).pipe(
      map(({ quizzes, subjects }) => {
        const draft = quizzes
          .filter((q) => !q.isPublished)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (!draft) {
          throw new Error('No draft quiz found.');
        }
        const subject = subjects.find((s) => s.id === draft.subjectId);
        return {
          ...draft,
          // Not a persisted field — difficulty only ever existed on the
          // generate request, so a re-loaded draft has no real value to show.
          difficulty: 'Medium',
          subjectName: subject?.name ?? `Subject #${draft.subjectId}`,
        } satisfies QuizDraft;
      }),
    );
  }

  // GET /api/quiz/results — the calling student's own result history.
  getStudentResults(): Observable<QuizResult[]> {
    return this.http.get<QuizResult[]>(`${this.baseUrl}/results`);
  }

  // GET /api/quiz/my-quizzes — every quiz created by the logged-in teacher.
  getTeacherQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.baseUrl}/my-quizzes`);
  }

  // GET /api/subjects — the subject catalog.
  getSubjectStats(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${environment.apiBaseUrl}/api/subjects`);
  }
}
