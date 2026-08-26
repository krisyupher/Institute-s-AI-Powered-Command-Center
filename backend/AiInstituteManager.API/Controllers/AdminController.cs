using AiInstituteManager.API.Contracts.Admin;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiInstituteManager.API.Controllers
{
    /// <summary>
    /// Ticket 4.2: Admin Statistics Controller Endpoint.
    ///
    /// Built the same way AuthController and QuizController were:
    /// UserManager for the Identity-managed User table (IUnitOfWork has
    /// no Users repository, same reasoning as AuthController), and
    /// IUnitOfWork for everything else.
    /// </summary>
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<User> _userManager;

        public AdminController(IUnitOfWork unitOfWork, UserManager<User> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<AdminStatsResponse>> GetStats()
        {
            var totalUsers = await _userManager.Users.CountAsync();

            var quizzes = await _unitOfWork.Quizzes.GetAllAsync();
            var results = await _unitOfWork.QuizResults.GetAllAsync();

            // Ticket 4.1 (student quiz submission + auto-grading) is what
            // actually populates QuizResults — until that's merged, this
            // table is empty on every environment. Guard against dividing
            // by zero rather than letting an empty result set throw, so
            // the dashboard shows "0" instead of the endpoint erroring.
            var averageScore = results.Count > 0
                ? Math.Round(results.Average(r => r.Score), 2)
                : 0;

            return Ok(new AdminStatsResponse(totalUsers, quizzes.Count, averageScore));
        }
    }
}
