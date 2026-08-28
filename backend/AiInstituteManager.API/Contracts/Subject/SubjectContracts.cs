namespace AiInstituteManager.API.Contracts.Subject
{
    /// <summary>One row of the subject catalog, returned by GET /api/subjects.</summary>
    public record SubjectResponse(int Id, string Name, string Code, DateTime CreatedAt, DateTime? UpdatedAt);

    /// <summary>Request to create a new subject, sent to POST /api/subjects.</summary>
    public record CreateSubjectRequest(string Name, string Code);
}
