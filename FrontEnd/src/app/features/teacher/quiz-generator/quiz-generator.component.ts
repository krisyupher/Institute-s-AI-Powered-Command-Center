import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { QuizService } from '../../../core/services/quiz.service';
import { Question, QuizDifficulty, Subject } from '../../../core/models/quiz.model';

/** Ticket 3.3: quiz criteria form that kicks off `POST /api/quiz/generate`. */
@Component({
  selector: 'app-quiz-generator',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'quiz-generator.component.html',
  styleUrl: 'quiz-generator.component.scss',
})
export class QuizGeneratorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly quizApi = inject(QuizService);

  protected readonly difficulties: readonly QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];

  protected readonly subjects = signal<Subject[]>([]);
  protected readonly loadingSubjects = signal(true);
  protected readonly subjectsError = signal<string | null>(null);

  protected readonly generating = signal(false);
  protected readonly generateError = signal<string | null>(null);
  protected readonly generatedQuestions = signal<Question[] | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    subjectId: [null as number | null, Validators.required],
    difficulty: ['Medium' as QuizDifficulty, Validators.required],
    topic: ['', [Validators.required, Validators.minLength(3)]],
    questionCount: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
  });

  protected get subjectId() {
    return this.form.controls.subjectId;
  }

  protected get topic() {
    return this.form.controls.topic;
  }

  constructor() {
    this.quizApi.getSubjectStats().subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        this.loadingSubjects.set(false);
      },
      error: () => {
        this.subjectsError.set('Could not load subjects.');
        this.loadingSubjects.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.generating()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.generating.set(true);
    this.generateError.set(null);
    this.generatedQuestions.set(null);

    const { subjectId, difficulty, topic, questionCount } = this.form.getRawValue();

    this.quizApi
      .generateQuiz({ subjectId: subjectId!, difficulty, topic, questionCount })
      .subscribe({
        next: (questions) => {
          this.generating.set(false);
          this.generatedQuestions.set(questions);
        },
        error: () => {
          this.generating.set(false);
          this.generateError.set('Could not generate a draft quiz. Please try again.');
        },
      });
  }
}
