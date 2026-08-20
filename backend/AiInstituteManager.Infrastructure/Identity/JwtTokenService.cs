using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AiInstituteManager.Infrastructure.Identity
{
    /// <summary>
    /// Signs a JWT containing UserId, Email, and Role — exactly what the
    /// ticket asks for. This class only CREATES tokens; validating tokens
    /// on incoming requests is configured separately in Program.cs
    /// (AddAuthentication().AddJwtBearer(...)) using the same key/issuer/
    /// audience values, so the two sides agree on what a "valid" token is.
    /// </summary>
    public class JwtTokenService : ITokenService
    {
        private readonly JwtSettings _jwtSettings;

        // IOptions<JwtSettings> is resolved by DI from the "Jwt" section
        // of appsettings.json (bound in ServiceCollectionExtensions).
        public JwtTokenService(IOptions<JwtSettings> jwtSettings)
        {
            _jwtSettings = jwtSettings.Value;
        }

        public string GenerateToken(User user)
        {
            // Claims are the "facts about this user" baked directly into
            // the token — the API reads these on every request instead of
            // hitting the database again just to know who's calling and
            // what role they hold.
            var claims = new List<Claim>
            {
                // Both `sub` (standard JWT subject) and a literal `UserId`
                // claim carry the user's id. `sub` is the interoperable
                // canonical form; the explicit `UserId` claim satisfies the
                // ticket's "UserId, Email, Role" claim list verbatim. The
                // frontend (FrontEnd/src/app/core/auth/jwt.ts) accepts both
                // via its CLAIM_ALIASES.userId array, so Session.userId
                // decodes either way.
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new("UserId", user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                // The frontend reads the display name off "unique_name" (see
                // FrontEnd/src/app/core/auth/jwt.ts) — this used to be two
                // claims both typed "name" (username then full name), which
                // collapses into a JWT array and makes the client pick the
                // username instead of the full name.
                new(JwtRegisteredClaimNames.UniqueName, user.FullName ?? string.Empty),
                new(ClaimTypes.Role, user.Role.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // The signing key is symmetric: the SAME secret both signs the
            // token here and verifies it in Program.cs's AddJwtBearer(...).
            // If this key doesn't match on both sides, every token will
            // fail validation with a "signature invalid" error.
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
