using AiInstituteManager.Domain.Entities;

namespace AiInstituteManager.Infrastructure.Identity
{
    /// <summary>
    /// Abstracting token creation behind an interface means anything that
    /// needs to issue a token (Ticket 2.2's AuthController today, maybe a
    /// refresh-token endpoint later) depends on THIS interface, not on JWT
    /// library details directly. Swap the implementation later — say, to
    /// support refresh tokens or a different signing algorithm — without
    /// touching any caller.
    /// </summary>
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
