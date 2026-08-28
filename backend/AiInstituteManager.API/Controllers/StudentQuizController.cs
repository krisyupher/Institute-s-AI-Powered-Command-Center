using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AiInstituteManager.API.Contracts.Quiz;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;
using AiInstituteManager.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiInstituteManager.API.Controllers
{
    /// <summary>
    /// Ticket 4.1 (+ later attempts-limit addition): Student Quiz
    /// Retrieval & Auto-Grading Engine.
    ///
    /// Kept separate from QuizController (Teacher-only at the class
    /// level) — see the original Ticket 4.1 notes for why. Route prefix
    /// "api/quiz" is shared safely with QuizController since literal
    /// route segments ("available", "submit") always win over
    /// QuizController's parameterized "{id:int}" in route matching.
    /// </summary>
    [ApiController]
    [Route("api/quiz")]
    [Authorize(Roles = "Student")]
    public class StudentQuizController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public StudentQuizController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// GET /api/quiz/available — every published quiz, with its full
        /// question set (correct answers excluded — see
        /// StudentQuestionResponse), plus how many attempts this specific
        /// student has already used against each one.
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<IReadOnlyList<AvailableQuizResponse>>> GetAvailable()
        {
            var studentId = GetCurrentUserId();
            if (studentId is null)
            {
                return Unauthorized(new { message = "Could not determine the current student's identity from the token." });
            }

            var quizzes = (await _unitOfWork.Quizzes.FindAsync(q => q.IsPublished))
                .OrderByDescending(q => q.CreatedAt)
                .ToList();

            var quizIds = quizzes.Select(q => q.Id).ToList();
            var allQuestions = await _unitOfWork.Questions.FindAsync(q => quizIds.Contains(q.QuizId));

            // One query for all this student's past results across every
            // available quiz, grouped by QuizId — avoids N separate
            // "count my attempts on quiz X" queries in the loop below.
            var attemptCounts = (await _unitOfWork.QuizResults
                    .FindAsync(r => r.StudentId == studentId.Value && quizIds.Contains(r.QuizId)))
                .GroupBy(r => r.QuizId)
                .ToDictionary(g => g.Key, g => g.Count());

            var result = quizzes.Select(quiz => new AvailableQuizResponse(
                quiz.Id,
                quiz.Title,
                quiz.SubjectId,
                allQuestions
                    .Where(q => q.QuizId == quiz.Id)
                    .OrderBy(q => q.Id)
                    .Select(q => new StudentQuestionResponse(q.Id, q.Text, q.OptionA, q.OptionB, q.OptionC, q.OptionD))
                    .ToList(),
                quiz.MaxAttempts,
                attemptCounts.GetValueOrDefault(quiz.Id, 0)
            )).ToList();

            return Ok(result);
        }

        /// <summary>
        /// POST /api/quiz/submit — grades the student's answers against
        /// the DB's stored CorrectAnswer values, enforces the quiz's
        /// MaxAttempts limit (if one is set), saves one QuizResult row,
        /// and returns the score immediately.
        /// </summary>
        [HttpPost("submit")]
        public async Task<ActionResult<QuizResultResponse>> Submit(SubmitQuizRequest request)
        {
            var studentId = GetCurrentUserId();
            if (studentId is null)
            {
                return Unauthorized(new { message = "Could not determine the current student's identity from the token." });
            }

            var quiz = (await _unitOfWork.Quizzes.FindAsync(q => q.Id == request.QuizId)).FirstOrDefault();
            if (quiz is null || !quiz.IsPublished)
            {
                return NotFound(new { message = $"Quiz {request.QuizId} was not found." });
            }

            var priorAttempts = (await _unitOfWork.QuizResults
                .FindAsync(r => r.QuizId == request.QuizId && r.StudentId == studentId.Value)).Count();

            // MaxAttempts == null means unlimited — only block once a
            // real limit is set AND already reached. 409 (not 403)
            // because this is a business-rule conflict, not a
            // permissions failure — the student IS allowed to take the
            // quiz, they've just used up their attempts.
            if (quiz.MaxAttempts is int max && priorAttempts >= max)
            {
                return Conflict(new
                {
                    message = $"Maximum attempts ({max}) reached for this quiz.",
                    attemptsUsed = priorAttempts,
                    maxAttempts = max
                });
            }

            var questions = (await _unitOfWork.Questions.FindAsync(q => q.QuizId == request.QuizId))
                .ToDictionary(q => q.Id);

            var questionResults = new List<QuestionResultResponse>();
            var correctCount = 0;

            foreach (var answer in request.Answers)
            {
                if (!questions.TryGetValue(answer.QuestionId, out var question))
                {
                    continue;
                }

                var selected = Enum.Parse<AnswerOption>(answer.SelectedAnswer, ignoreCase: true);
                var isCorrect = selected == question.CorrectAnswer;
                if (isCorrect)
                {
                    correctCount++;
                }

                questionResults.Add(new QuestionResultResponse(
                    question.Id, selected.ToString(), question.CorrectAnswer.ToString(), isCorrect));
            }

            var totalQuestions = questions.Count;
            var scorePercentage = totalQuestions == 0
                ? 0
                : Math.Round(correctCount * 100.0 / totalQuestions, 2);

            var result = new QuizResult
            {
                QuizId = quiz.Id,
                StudentId = studentId.Value,
                Score = scorePercentage,
                CompletedAt = DateTime.UtcNow
            };

            await _unitOfWork.QuizResults.AddAsync(result);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new QuizResultResponse(
                quiz.Id, correctCount, totalQuestions, scorePercentage, result.CompletedAt,
                questionResults));
        }

        private int? GetCurrentUserId()
        {
            var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(idClaim, out var id) ? id : null;
        }
    }
}
