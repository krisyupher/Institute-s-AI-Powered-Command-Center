using System.ComponentModel.DataAnnotations;

namespace AiInstituteManager.API.Contracts.Subject
{
    /// <summary>One row of the subject catalog, returned by GET /api/subjects.</summary>
    public record SubjectResponse(int Id, string Name, string Code, DateTime CreatedAt, DateTime? UpdatedAt);

    /// <summary>Body for POST /api/subjects.</summary>
    public record CreateSubjectRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; init; } = string.Empty;

        [Required, MaxLength(20)]
        public string Code { get; init; } = string.Empty;
    }

    /// <summary>Body for PUT /api/subjects/{id}.</summary>
    public record UpdateSubjectRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; init; } = string.Empty;

        [Required, MaxLength(20)]
        public string Code { get; init; } = string.Empty;
    }
}
