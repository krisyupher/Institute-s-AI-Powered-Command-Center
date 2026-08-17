using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AiInstituteManager.API.Contracts.Quiz;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;
using AiInstituteManager.Infrastructure.AI;
using AiInstituteManager.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiInstituteManager.API.Controllers
{
    /// <summary>
    /// Ticket 3.2: Create Quiz Management Controller Endpoints.
    ///
    /// Built against IUnitOfWork (Backend Dev's Ticket 1.1 repository
    /// pattern) rather than ApplicationDbContext directly, and against
    /// IOpenAiService (see AiInstituteManager.Infrastructure/AI/) rather
    /// than a concrete OpenAiService — Ticket 3.1 hasn't merged yet, so
    /// this controller is coded against the contract that ticket's
    /// acceptance criteria already defines. Swapping the stub for the
    /// real service later needs zero changes here.
    /// </summary>
    [ApiController]
    [Route("api/quiz")]
    [Authorize(Roles = "Teacher")]
    public class QuizController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IOpenAiService _openAiService;

        public QuizController(IUnitOfWork unitOfWork, IOpenAiService openAiService)
        {
            _unitOfWork = unitOfWork;
            _openAiService = openAiService;
        }

        [HttpPost("generate")]
        public async Task<ActionResult<IReadOnlyList<GeneratedQuestionResponse>>> Generate(GenerateQuizRequest request)
        {
            var generated = await _openAiService.GenerateQuestionsAsync(
                request.Topic, request.Difficulty, request.QuestionCount);

            var response = generated.Select(q => new GeneratedQuestionResponse(
                q.Text, q.OptionA, q.OptionB, q.OptionC, q.OptionD, q.CorrectAnswer));

            return Ok(response);
        }

        [HttpPost("save")]
        public async Task<ActionResult<QuizResponse>> Save(SaveQuizRequest request)
        {
            // Model validation (via SaveQuizRequest's data annotations,
            // e.g. CorrectAnswer's regex and Questions' MinLength) has
            // already run by the time we get here — [ApiController]
            // auto-returns 400 for anything that fails those rules.

            var subject = await _unitOfWork.Subjects.GetByIdAsync(request.SubjectId);
            if (subject is null)
            {
                return NotFound(new { message = $"Subject {request.SubjectId} was not found." });
            }

            var teacherId = GetCurrentUserId();
            if (teacherId is null)
            {
                // Shouldn't happen behind [Authorize(Roles = "Teacher")]
                // with a token from /api/auth/login, but fail loudly
                // rather than silently saving a quiz with no owner.
                return Unauthorized(new { message = "Could not determine the current teacher's identity from the token." });
            }

            var quiz = new Quiz
            {
                Title = request.Title,
                SubjectId = request.SubjectId,
                CreatedByTeacherId = teacherId.Value,
                IsPublished = request.IsPublished,
                Questions = request.Questions.Select(q => new Question
                {
                    Text = q.Text,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    // Regex on SaveQuestionRequest.CorrectAnswer already
                    // guarantees this is A/B/C/D, so Parse (not TryParse)
                    // is safe here.
                    CorrectAnswer = Enum.Parse<AnswerOption>(q.CorrectAnswer, ignoreCase: true)
                }).ToList()
            };

            await _unitOfWork.Quizzes.AddAsync(quiz);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new QuizResponse(quiz.Id, quiz.Title, quiz.SubjectId, quiz.IsPublished, quiz.Questions.Count));
        }

        /// <summary>
        /// Reads the numeric user id JwtTokenService put in the "sub"
        /// claim. Checked both as the raw JWT claim type and as
        /// ClaimTypes.NameIdentifier because ASP.NET Core's default
        /// inbound claim mapping behavior differs by version/config —
        /// this works regardless of which one the token ends up using.
        /// </summary>
        private int? GetCurrentUserId()
        {
            var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(idClaim, out var id) ? id : null;
        }
    }
}
