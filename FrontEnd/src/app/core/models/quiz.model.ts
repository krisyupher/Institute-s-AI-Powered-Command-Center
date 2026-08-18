/**
 * Mirrors the quiz-domain backend entities:
 * `AiInstituteManager.Domain/Entities/Subject.cs`,
 * `Quiz.cs`, `Question.cs`, `QuizResult.cs`, and the `AnswerOption` enum.
 */
import { User } from './user.model';

// Backend `AnswerOption` enum (A | B | C | D)
export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface Subject {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Question {
  id: number;
  quizId: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  createdAt: string;
  updatedAt: string | null;
}

export interface Quiz {
  id: number;
  title: string;
  isPublished: boolean;
  subjectId: number;
  createdByTeacherId: number;
  questions: Question[];
  results: QuizResult[];
  createdAt: string;
  updatedAt: string | null;
}

export interface QuizResult {
  id: number;
  quizId: number;
  studentId: number;
  score: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

// -----------------------------------------------------------------------
// Request / response shapes for the quiz endpoints (docs/PROJECT_PLAN.md)
// -----------------------------------------------------------------------

/** Request payload for `POST /api/quiz/generate`. */
export interface GenerateQuizRequest {
  topic: string;
  difficulty: QuizDifficulty;
  questionCount: number;
}

/**
 * Difficulty is not a backend entity today — it only lives on the
 * `POST /api/quiz/generate` request. Kept here as a UI-level union so it
 * can be tightened to a DTO enum when the endpoint ships.
 */
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

// Request payload for `POST /api/quiz/submit`
export interface SubmitQuizRequest {
  quizId: number;
  answers: Record<number, AnswerOption>;
}

// Shape returned by `POST /api/quiz/submit` alongside recording a `QuizResult`
export interface SubmitQuizResponse {
  quizId: number;
  studentId: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
}

// A quiz as a student sees it: expanded navigation, no correct answers leaked
export interface AvailableQuiz {
  id: number;
  title: string;
  subject: Subject;
  createdByTeacher: Pick<User, 'id' | 'fullName'>;
  questionCount: number;
  publishedAt: string;
}

// -----------------------------------------------------------------------
// Shapes for the teacher save flow (`POST /api/quiz/save`)
// -----------------------------------------------------------------------

/**
 * One teacher-approved/edited question payload. `id`, `quizId`, and the
 * timestamp fields are assigned by the API from the underlying `Question`
 * entity — they never travel into the save request.
 */
export interface CreateQuestionRequest {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
}

/** Payload for `POST /api/quiz/save`: the edited quiz plus its questions. */
export interface SaveQuizRequest {
  title: string;
  subjectId: number;
  isPublished: boolean;
  questions: CreateQuestionRequest[];
}

/**
 * One question returned by `POST /api/quiz/generate` before any teacher
 * edits. Mirrors the backend `GeneratedQuestionResponse` record — no ids,
 * timestamps, or quiz association yet; those are assigned on save.
 */
export interface GeneratedQuestion {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
}

/**
 * Response from `POST /api/quiz/save`. Mirrors the backend `QuizResponse`
 * record — a summary, not the full persisted `Quiz`.
 */
export interface SaveQuizResponse {
  id: number;
  title: string;
  subjectId: number;
  isPublished: boolean;
  questionCount: number;
}

/**
 * A teacher-facing draft quiz: a full `Quiz` plus display metadata the
 * backend does not persist today. `difficulty` only exists on the
 * `POST /api/quiz/generate` request (see `QuizDifficulty`), and
 * `subjectName` saves the preview UI an extra subject lookup.
 */
export interface QuizDraft extends Quiz {
  difficulty: QuizDifficulty;
  subjectName: string;
}
