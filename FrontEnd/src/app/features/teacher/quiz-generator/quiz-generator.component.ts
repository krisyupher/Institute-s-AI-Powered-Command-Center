import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { QuizService } from '../../../core/services/quiz.service';
import { QuizDifficulty, Subject } from '../../../core/models/quiz.model';

/** Ticket 3.3: quiz criteria form that kicks off `POST /api/quiz/generate`. */
@Component({
  selector: 'app-quiz-generator',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'quiz-generator.component.html',
  styleUrl: 'quiz-generator.component.scss',
})
export class QuizGeneratorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly quizApi = inject(QuizService);
  private readonly router = inject(Router);

  protected readonly difficulties: readonly QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];

  protected readonly subjects = signal<Subject[]>([]);
  protected readonly loadingSubjects = signal(true);
  protected readonly subjectsError = signal<string | null>(null);

  protected readonly showCustomSubject = signal(false);
  protected readonly customSubjectName = signal('');

  protected readonly generating = signal(false);
  protected readonly generateError = signal<string | null>(null);

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

  protected onSubjectChange(value: string): void {
    if (value === 'another') {
      this.showCustomSubject.set(true);
      this.form.controls.subjectId.reset();
    } else {
      this.showCustomSubject.set(false);
      this.customSubjectName.set('');
    }
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

    if (this.showCustomSubject()) {
      if (!this.customSubjectName().trim()) {
        this.generateError.set('Please enter a subject name.');
        return;
      }
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.generating.set(true);
    this.generateError.set(null);

    const { subjectId, difficulty, topic, questionCount } = this.form.getRawValue();
    const finalSubjectId = this.showCustomSubject()
      ? -1
      : subjectId!;

    this.quizApi
      .generateQuiz({ subjectId: finalSubjectId, difficulty, topic, questionCount })
      .subscribe({
        // Draft ready: hand it straight to the preview-edit screen via router
        // state (no static link/banner), where the teacher reviews and edits.
        next: (draftQuiz) => {
          this.generating.set(false);
          this.router.navigate(['/teacher/preview'], { state: { draftQuiz } });
        },
        error: () => {
          this.generating.set(false);
          this.generateError.set('Could not generate a draft quiz. Please try again.');
        },
      });
  }
}
