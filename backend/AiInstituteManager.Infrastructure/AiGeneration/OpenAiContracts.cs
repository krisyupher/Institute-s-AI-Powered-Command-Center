using System.Text.Json.Serialization;
using AiInstituteManager.Infrastructure.AiGeneration.Dtos;

namespace AiInstituteManager.Infrastructure.AiGeneration
{
    // These records exist ONLY to mirror OpenAI's actual JSON wire format
    // for the /chat/completions endpoint. They're deliberately kept
    // internal to this project and this feature — nothing outside
    // OpenAiService should ever reference them directly. If you ever swap
    // providers (Azure OpenAI, OpenRouter, etc.), only these records and
    // OpenAiService change; IOpenAiService and its callers don't.
    //
    // Records (not classes) fit here because these are pure, immutable
    // "shape of the data" types with no behavior — a textbook case for
    // record types over classes.

    internal record ChatMessage(string Role, string Content);

    internal record ChatCompletionRequest(
        string Model,
        List<ChatMessage> Messages,
        // JSON object mode is supported on every Groq model, so we always
        // send it (the nullable + JsonIgnore-when-null only guards against
        // a provider that rejects the field outright). Prompt-side JSON
        // instructions plus ParseQuestions' markdown-fence stripping remain
        // as a belt-and-suspenders fallback.
        [property: JsonPropertyName("response_format")]
        ResponseFormat ResponseFormat,
        double Temperature);

    internal record ResponseFormat(string Type);

    internal record ChatCompletionResponse(List<Choice> Choices);

    internal record Choice(ChatMessage Message);

    // The shape we ASK the model to respond in — see BuildPrompt() in
    // OpenAiService. "Questions" here maps to our own GeneratedQuestionDto,
    // not an OpenAI-specific type, since this is OUR requested shape, not
    // theirs.
    internal record QuestionListWrapper(List<GeneratedQuestionDto> Questions);
}