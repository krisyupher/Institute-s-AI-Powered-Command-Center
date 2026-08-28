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
        /// POST /api/subjects — teachers create a new subject. If the code already
        /// exists, returns 409 Conflict. On success, returns 201 Created with the
        /// new subject's id and details.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult<SubjectResponse>> Create([FromBody] CreateSubjectRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest("Subject name and code are required.");
            }

            var existing = (await _unitOfWork.Subjects.GetAllAsync())
                .FirstOrDefault(s => s.Code.ToUpper() == request.Code.ToUpper());
            if (existing != null)
            {
                return Conflict($"Subject with code '{request.Code}' already exists.");
            }

            var subject = new Subject { Name = request.Name, Code = request.Code };
            await _unitOfWork.Subjects.AddAsync(subject);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new SubjectResponse(subject.Id, subject.Name, subject.Code, subject.CreatedAt, subject.UpdatedAt));
        }

        /// <summary>
        /// DELETE /api/subjects/{id} — admin only. Deletes a subject and all quizzes
        /// that reference it (cascade). Use with caution.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var subject = await _unitOfWork.Subjects.GetByIdAsync(id);
            if (subject == null)
            {
                return NotFound($"Subject with id {id} not found.");
            }

            _unitOfWork.Subjects.Remove(subject);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
    }
}
