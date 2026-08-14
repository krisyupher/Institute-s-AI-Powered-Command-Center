using AiInstituteManager.Domain.Entities;

namespace AiInstituteManager.Infrastructure.Identity
{
    //needs to issue a token and AuthController endpoint needs to call this service to get a token for the user
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}