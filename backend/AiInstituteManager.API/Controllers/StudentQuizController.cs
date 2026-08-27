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
        /// question set, but with correct answers excluded entirely (see
        /// StudentQuestionResponse).
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<IReadOnlyList<AvailableQuizResponse>>> GetAvailable()
        {
            var quizzes = (await _unitOfWork.Quizzes.FindAsync(q => q.IsPublished))
                .OrderByDescending(q => q.CreatedAt)
                .ToList();

            var quizIds = quizzes.Select(q => q.Id).ToList();
            var allQuestions = await _unitOfWork.Questions.FindAsync(q => quizIds.Contains(q.QuizId));

            var result = quizzes.Select(quiz => new AvailableQuizResponse(
                quiz.Id,
                quiz.Title,
                quiz.SubjectId,
                allQuestions
                    .Where(q => q.QuizId == quiz.Id)
                    .OrderBy(q => q.Id)
                    .Select(q => new StudentQuestionResponse(q.Id, q.Text, q.OptionA, q.OptionB, q.OptionC, q.OptionD))
                    .ToList()
            )).ToList();

            return Ok(result);
        }

        /// <summary>
        /// POST /api/quiz/submit — grades the student's answers against
        /// the DB's stored CorrectAnswer values (never anything the
        /// client claims), saves one QuizResult row, and returns the
        /// score immediately.
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
                // Treat an unpublished quiz the same as a missing one — a
                // student should never be able to submit against a draft
                // that was never made available to them via /available.
                return NotFound(new { message = $"Quiz {request.QuizId} was not found." });
            }

            var questions = (await _unitOfWork.Questions.FindAsync(q => q.QuizId == request.QuizId))
                .ToDictionary(q => q.Id);

            var questionResults = new List<QuestionResultResponse>();
            var correctCount = 0;

            foreach (var answer in request.Answers)
            {
                if (!questions.TryGetValue(answer.QuestionId, out var question))
                {
                    // Submitted QuestionId doesn't belong to this quiz —
                    // ignore it rather than let it corrupt scoring or
                    // throw and fail the whole submission.
                    continue;
                }

                // Regex on SubmitAnswerRequest.SelectedAnswer already
                // guarantees this is A/B/C/D, so Parse (not TryParse) is
                // safe here — same pattern QuizController.AddQuestionsAsync
                // already uses for CorrectAnswer.
                var selected = Enum.Parse<AnswerOption>(answer.SelectedAnswer, ignoreCase: true);
                var isCorrect = selected == question.CorrectAnswer;
                if (isCorrect)
                {
                    correctCount++;
                }

                questionResults.Add(new QuestionResultResponse(
                    question.Id, selected.ToString(), question.CorrectAnswer.ToString(), isCorrect));
            }

            // Denominator is every question IN THE QUIZ, not just the ones
            // answered — an unanswered question should count against the
            // score, not be silently excluded from it.
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
                quiz.Id, correctCount, totalQuestions, scorePercentage, result.CompletedAt, questionResults));
        }

        /// <summary>
        /// GET /api/quiz/results — every QuizResult recorded for the current
        /// student, most recent first, for the "My Results" history table.
        /// </summary>
        [HttpGet("results")]
        public async Task<ActionResult<IReadOnlyList<QuizResultHistoryResponse>>> GetResults()
        {
            var studentId = GetCurrentUserId();
            if (studentId is null)
            {
                return Unauthorized(new { message = "Could not determine the current student's identity from the token." });
            }

            var results = (await _unitOfWork.QuizResults.FindAsync(r => r.StudentId == studentId.Value))
                .OrderByDescending(r => r.CompletedAt)
                .Select(r => new QuizResultHistoryResponse(
                    r.Id, r.QuizId, r.StudentId, r.Score, r.CompletedAt, r.CreatedAt, r.UpdatedAt))
                .ToList();

            return Ok(results);
        }

        /// <summary>
        /// Same claim-reading pattern as QuizController.GetCurrentUserId —
        /// duplicated rather than shared, matching the existing codebase's
        /// current style (no shared base controller exists yet).
        /// </summary>
        private int? GetCurrentUserId()
        {
            var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(idClaim, out var id) ? id : null;
        }
    }
}
