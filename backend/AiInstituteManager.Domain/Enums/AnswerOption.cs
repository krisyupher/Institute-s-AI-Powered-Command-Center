namespace AiInstituteManager.Domain.Enums
{
    /// <summary>
    /// Instead of storing CorrectAnswer as a free-text string ("A", "B"...),
    /// an enum makes invalid values (like "E" or "correct") impossible
    /// to represent in code at all — the ticket's OptionA-D fields map
    /// naturally onto these four values.
    /// </summary>
    public enum AnswerOption
    {
        A,
        B,
        C,
        D
    }
}
