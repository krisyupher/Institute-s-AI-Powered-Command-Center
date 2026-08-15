using System.ComponentModel.DataAnnotations;
using AiInstituteManager.Domain.Enums;

namespace AiInstituteManager.API.Contracts.Auth
{
    /// <summary>
    /// Everything the /api/auth/register endpoint needs. Kept as a
    /// separate "Contracts" type instead of accepting the Domain User
    /// entity directly in the controller — the API's request shape
    /// (plain-text Password) should never be the same object as the
    /// database entity (PasswordHash), even though they're related.
    /// </summary>
    public record RegisterRequest
    {
        [Required, MaxLength(100)]
        public string FullName { get; init; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; init; } = string.Empty;

        // RequiredLength = 6 mirrors the Password.RequiredLength rule set
        // in ServiceCollectionExtensions.AddIdentity(...) — Identity will
        // enforce this too, but failing fast here gives a clearer 400.
        [Required, MinLength(6)]
        public string Password { get; init; } = string.Empty;

        [Required]
        public UserRole Role { get; init; }
    }

    /// <summary>Everything the /api/auth/login endpoint needs.</summary>
    public record LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; init; } = string.Empty;

        [Required]
        public string Password { get; init; } = string.Empty;
    }

    /// <summary>
    /// Shape required by Ticket 2.2: { token, email, role }. Returned by
    /// both /login and /register so the frontend handles them identically.
    /// </summary>
    public record AuthResponse(string Token, string Email, string Role);
}
