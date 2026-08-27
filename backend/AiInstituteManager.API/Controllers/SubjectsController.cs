using AiInstituteManager.API.Contracts.Subject;
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
    }
}
