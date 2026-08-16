using AiInstituteManager.API.Contracts.Auth;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AiInstituteManager.API.Controllers
{
    /// <summary>
    /// Ticket 2.2: Create AuthController Endpoints (login &amp; register).
    ///
    /// Deliberately thin: UserManager/SignInManager (wired up in Ticket 2.1
    /// via AddIdentity in ServiceCollectionExtensions) handle password
    /// hashing and credential checking, and ITokenService (JwtTokenService,
    /// also Ticket 2.1) handles signing the JWT. This controller's only
    /// job is to translate HTTP requests into calls on those two services
    /// and shape the response the way the ticket specifies.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly ITokenService _tokenService;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser is not null)
            {
                return Conflict(new { message = "An account with this email already exists." });
            }

            var user = new User
            {
                // Identity uses UserName as the primary lookup key, so we
                // mirror Email into it — this project doesn't have a
                // separate concept of "username" vs "email".
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                Role = request.Role
            };

            // UserManager.CreateAsync hashes the password (per the rules
            // configured in AddIdentity) and saves the user — we never
            // touch PasswordHash directly.
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(error.Code, error.Description);
                }

                return ValidationProblem(ModelState);
            }

            var token = _tokenService.GenerateToken(user);
            return Ok(new AuthResponse(token, user.Email!, user.Role.ToString()));
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            // Same "invalid credentials" message whether the email doesn't
            // exist or the password is wrong — never reveal which one it
            // was, or the endpoint becomes a way to enumerate valid emails.
            if (user is null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var checkResult = await _signInManager.CheckPasswordSignInAsync(
                user, request.Password, lockoutOnFailure: false);

            if (!checkResult.Succeeded)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _tokenService.GenerateToken(user);
            return Ok(new AuthResponse(token, user.Email!, user.Role.ToString()));
        }

        /// <summary>
        /// Not part of the ticket's required endpoints — this exists only
        /// to satisfy "Add [Authorize] attributes to test protected
        /// routes." Call it with the token from /login or /register in
        /// the Swagger "Authorize" box to confirm JWT auth is wired
        /// correctly end-to-end.
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public ActionResult Me()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value });
            return Ok(new { message = "You are authenticated.", claims });
        }
    }
}
