using AiInstituteManager.API.Contracts.Subject;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiInstituteManager.API.Controllers
{
    /// <summary>
    /// GET /api/subjects — the subject catalog. Backs the teacher quiz
    /// generator's subject dropdown and every subjectId -&gt; name lookup the
    /// frontend does. Not role-specific: any authenticated user may read it,
    /// same as the catalog itself carries no sensitive data.
    ///
    /// POST/PUT/DELETE are tightened to Teacher only via a method-level
    /// [Authorize(Roles = "Teacher")] layered on top of the class-level
    /// [Authorize] — this ADDS a restriction on top of a permissive base,
    /// which fails safe (a mistake here means "too locked down," not "an
    /// endpoint nobody meant to expose").
    /// </summary>
    [ApiController]
    [Route("api/subjects")]
    [Authorize]
    public class SubjectsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubjectsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<SubjectResponse>>> GetAll()
        {
            var subjects = (await _unitOfWork.Subjects.GetAllAsync())
                .OrderBy(s => s.Name)
                .Select(s => new SubjectResponse(s.Id, s.Name, s.Code, s.CreatedAt, s.UpdatedAt))
                .ToList();

            return Ok(subjects);
        }

        /// <summary>
        /// POST /api/subjects — creates a new subject. Checks Code
        /// uniqueness proactively (rather than only relying on the
        /// database's unique index and catching the resulting exception)
        /// so the error message is clear and immediate.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<SubjectResponse>> Create(CreateSubjectRequest request)
        {
            var duplicate = (await _unitOfWork.Subjects.FindAsync(s => s.Code == request.Code)).Any();
            if (duplicate)
            {
                return Conflict(new { message = $"A subject with code '{request.Code}' already exists." });
            }

            var subject = new Subject
            {
                Name = request.Name,
                Code = request.Code
            };

            await _unitOfWork.Subjects.AddAsync(subject);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new SubjectResponse(subject.Id, subject.Name, subject.Code, subject.CreatedAt, subject.UpdatedAt));
        }

        /// <summary>
        /// PUT /api/subjects/{id} — updates name/code. Excludes the
        /// subject's own row from the duplicate-code check, since "update
        /// a subject without changing its code" would otherwise
        /// incorrectly flag itself as a conflict.
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<SubjectResponse>> Update(int id, UpdateSubjectRequest request)
        {
            var subject = await _unitOfWork.Subjects.GetByIdAsync(id);
            if (subject is null)
            {
                return NotFound(new { message = $"Subject {id} was not found." });
            }

            var duplicate = (await _unitOfWork.Subjects.FindAsync(s => s.Code == request.Code && s.Id != id)).Any();
            if (duplicate)
            {
                return Conflict(new { message = $"A subject with code '{request.Code}' already exists." });
            }

            subject.Name = request.Name;
            subject.Code = request.Code;
            subject.MarkAsUpdated();

            _unitOfWork.Subjects.Update(subject);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new SubjectResponse(subject.Id, subject.Name, subject.Code, subject.CreatedAt, subject.UpdatedAt));
        }

        /// <summary>
        /// DELETE /api/subjects/{id} — blocked if any quiz still
        /// references this subject (QuizConfiguration has Quiz -&gt; Subject
        /// as DeleteBehavior.Restrict, so the database itself would
        /// reject this anyway — this check just turns that into a clear
        /// 409 instead of a raw 500 from an unhandled DbUpdateException).
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Delete(int id)
        {
            var subject = await _unitOfWork.Subjects.GetByIdAsync(id);
            if (subject is null)
            {
                return NotFound(new { message = $"Subject {id} was not found." });
            }

            var hasQuizzes = (await _unitOfWork.Quizzes.FindAsync(q => q.SubjectId == id)).Any();
            if (hasQuizzes)
            {
                return Conflict(new
                {
                    message = "Cannot delete a subject that has quizzes. Reassign or delete those quizzes first."
                });
            }

            _unitOfWork.Subjects.Remove(subject);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
    }
}
