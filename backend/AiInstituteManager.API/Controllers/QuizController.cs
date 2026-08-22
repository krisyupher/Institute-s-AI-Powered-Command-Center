using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AiInstituteManager.API.Contracts.Quiz;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;
using AiInstituteManager.Infrastructure.AiGeneration;
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
            var generated = await _openAiService.GenerateQuizQuestionsAsync(
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

            var teacherId = GetCurrentUserId();
            if (teacherId is null)
            {
                // Shouldn't happen behind [Authorize(Roles = "Teacher")]
                // with a token from /api/auth/login, but fail loudly
                // rather than silently saving a quiz with no owner.
                return Unauthorized(new { message = "Could not determine the current teacher's identity from the token." });
            }

            // Edit mode: an id was supplied, so this replaces the existing
            // quiz (title/subject/status + a fresh question set) rather than
            // inserting a new row.
            if (request.Id is int quizId)
            {
                var existing = (await _unitOfWork.Quizzes.FindAsync(q => q.Id == quizId)).FirstOrDefault();
                if (existing is null)
                {
                    return NotFound(new { message = $"Quiz {quizId} was not found." });
                }
                if (existing.CreatedByTeacherId != teacherId.Value)
                {
                    // A teacher may only edit the quizzes they created.
                    return Forbid();
                }

                var updateSubject = await _unitOfWork.Subjects.GetByIdAsync(request.SubjectId);
                if (updateSubject is null)
                {
                    return NotFound(new { message = $"Subject {request.SubjectId} was not found." });
                }

                existing.Title = request.Title;
                existing.SubjectId = request.SubjectId;
                existing.IsPublished = request.IsPublished;
                existing.MarkAsUpdated();

                // Replace the question set wholesale — the teacher's edited
                // list is authoritative, so drop the old rows and re-add.
                var oldQuestions = await _unitOfWork.Questions.FindAsync(q => q.QuizId == quizId);
                foreach (var old in oldQuestions)
                {
                    _unitOfWork.Questions.Remove(old);
                }
                await AddQuestionsAsync(quizId, request.Questions);

                await _unitOfWork.SaveChangesAsync();
                return Ok(new QuizResponse(existing.Id, existing.Title, existing.SubjectId, existing.IsPublished, request.Questions.Count));
            }

            var subject = await _unitOfWork.Subjects.GetByIdAsync(request.SubjectId);
            if (subject is null)
            {
                return NotFound(new { message = $"Subject {request.SubjectId} was not found." });
            }

            var quiz = new Quiz
            {
                Title = request.Title,
                SubjectId = request.SubjectId,
                CreatedByTeacherId = teacherId.Value,
                IsPublished = request.IsPublished,
            };

            await _unitOfWork.Quizzes.AddAsync(quiz);
            await _unitOfWork.SaveChangesAsync();
            await AddQuestionsAsync(quiz.Id, request.Questions);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new QuizResponse(quiz.Id, quiz.Title, quiz.SubjectId, quiz.IsPublished, request.Questions.Count));
        }

        /// <summary>
        /// GET /api/quiz/{id} — one quiz with its full question set for the
        /// frontend editor (edit mode from the quiz list). The teacher is
        /// allowed to view any quiz id; publish/submit gating is a separate
        /// concern from reading a draft back.
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<QuizDetailResponse>> GetById(int id)
        {
            var quiz = (await _unitOfWork.Quizzes.FindAsync(q => q.Id == id)).FirstOrDefault();
            if (quiz is null)
            {
                return NotFound(new { message = $"Quiz {id} was not found." });
            }
            return Ok(await MapDetailAsync(quiz));
        }

        /// <summary>
        /// DELETE /api/quiz/{id} — removes a quiz and its questions. The
        /// teacher may only delete quizzes they created. QuizResults point at
        /// the quiz with DeleteBehavior.Restrict, so they are removed
        /// explicitly first (cascade would otherwise be thrown out by the FK).
        /// </summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var teacherId = GetCurrentUserId();
            if (teacherId is null)
            {
                return Unauthorized(new { message = "Could not determine the current teacher's identity from the token." });
            }

            var quiz = (await _unitOfWork.Quizzes.FindAsync(q => q.Id == id)).FirstOrDefault();
            if (quiz is null)
            {
                return NotFound(new { message = $"Quiz {id} was not found." });
            }
            if (quiz.CreatedByTeacherId != teacherId.Value)
            {
                return Forbid();
            }

            // QuizResult -> Quiz is Restrict (see QuizResultConfiguration),
            // so drop any results before the quiz so the FK delete is not blocked.
            var results = await _unitOfWork.QuizResults.FindAsync(r => r.QuizId == id);
            foreach (var result in results)
            {
                _unitOfWork.QuizResults.Remove(result);
            }

            // Question -> Quiz is Cascade, so the questions go with the quiz.
            _unitOfWork.Quizzes.Remove(quiz);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// GET /api/quiz/my-quizzes — every quiz created by the logged-in
        /// teacher, with questions, for the teacher quiz list view.
        /// </summary>
        [HttpGet("my-quizzes")]
        public async Task<ActionResult<IReadOnlyList<QuizDetailResponse>>> GetMyQuizzes()
        {
            var teacherId = GetCurrentUserId();
            if (teacherId is null)
            {
                return Unauthorized(new { message = "Could not determine the current teacher's identity from the token." });
            }

            var quizzes = (await _unitOfWork.Quizzes.FindAsync(q => q.CreatedByTeacherId == teacherId.Value))
                .OrderByDescending(q => q.CreatedAt)
                .ToList();

            var quizIds = quizzes.Select(q => q.Id).ToList();
            var allQuestions = await _unitOfWork.Questions.FindAsync(q => quizIds.Contains(q.QuizId));

            var result = new List<QuizDetailResponse>(quizzes.Count);
            foreach (var quiz in quizzes)
            {
                result.Add(MapDetail(quiz, allQuestions.Where(q => q.QuizId == quiz.Id)));
            }
            return Ok(result);
        }

        private async Task AddQuestionsAsync(int quizId, IEnumerable<SaveQuestionRequest> questions)
        {
            foreach (var q in questions)
            {
                await _unitOfWork.Questions.AddAsync(new Question
                {
                    QuizId = quizId,
                    Text = q.Text,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    // Regex on SaveQuestionRequest.CorrectAnswer already
                    // guarantees this is A/B/C/D, so Parse (not TryParse)
                    // is safe here.
                    CorrectAnswer = Enum.Parse<AnswerOption>(q.CorrectAnswer, ignoreCase: true)
                });
            }
        }

        private async Task<QuizDetailResponse> MapDetailAsync(Quiz quiz)
        {
            var questions = await _unitOfWork.Questions.FindAsync(q => q.QuizId == quiz.Id);
            return MapDetail(quiz, questions);
        }

        private static QuizDetailResponse MapDetail(Quiz quiz, IEnumerable<Question> questions)
        {
            var mapped = questions
                .OrderBy(q => q.Id)
                .Select(q => new QuestionResponse(
                    q.Id, q.QuizId, q.Text,
                    q.OptionA, q.OptionB, q.OptionC, q.OptionD,
                    q.CorrectAnswer.ToString(), q.CreatedAt, q.UpdatedAt))
                .ToList();

            return new QuizDetailResponse(
                quiz.Id, quiz.Title, quiz.IsPublished, quiz.SubjectId,
                quiz.CreatedByTeacherId, mapped, quiz.CreatedAt, quiz.UpdatedAt);
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
