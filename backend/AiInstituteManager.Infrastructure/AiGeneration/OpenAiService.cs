using System.Net.Http.Json;
using System.Text.Json;
using AiInstituteManager.Infrastructure.AiGeneration.Dtos;
using AiInstituteManager.Infrastructure.Settings;
using Microsoft.Extensions.Options;

namespace AiInstituteManager.Infrastructure.AiGeneration
{
    /// <summary>
    /// Calls OpenAI's /chat/completions endpoint, forces a JSON response
    /// shape via response_format, and parses it into GeneratedQuestionDto
    /// objects. HttpClient is injected as a TYPED client (see
    /// ServiceCollectionExtensions.AddHttpClient&lt;IOpenAiService, OpenAiService&gt;)
    /// rather than newed up here — that's what lets DI manage its
    /// lifetime correctly and reuse underlying connections instead of
    /// exhausting sockets, a classic HttpClient pitfall.
    /// </summary>
    public class OpenAiService : IOpenAiService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAiSettings _settings;

        // Two DIFFERENT JsonSerializerOptions on purpose:
        // - RequestJsonOptions: camelCase, because that's what OpenAI's
        //   API expects on the way OUT ("model", "messages", not "Model").
        // - ResponseJsonOptions: case-insensitive, because that's the
        //   simplest way to map whatever casing comes back IN onto our
        //   PascalCase C# properties without a naming policy mismatch.
        private static readonly JsonSerializerOptions RequestJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private static readonly JsonSerializerOptions ResponseJsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public OpenAiService(HttpClient httpClient, IOptions<OpenAiSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<List<GeneratedQuestionDto>> GenerateQuizQuestionsAsync(
            string topic,
            string difficulty,
            int questionCount,
            CancellationToken cancellationToken = default)
        {
            var requestBody = new ChatCompletionRequest(
                Model: _settings.Model,
                Messages: new List<ChatMessage>
                {
                    new("system",
                        "You are a quiz generation assistant for a school platform. " +
                        "Always respond with ONLY valid JSON — no markdown code fences, " +
                        "no commentary before or after it."),
                    new("user", BuildPrompt(topic, difficulty, questionCount))
                },
                ResponseFormat: new ResponseFormat("json_object"),
                Temperature: 0.7);

            string rawContent;

            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "chat/completions", requestBody, RequestJsonOptions, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    throw new AiServiceException(
                        $"OpenAI API returned {(int)response.StatusCode} {response.StatusCode}: {errorBody}");
                }

                var completion = await response.Content
                    .ReadFromJsonAsync<ChatCompletionResponse>(ResponseJsonOptions, cancellationToken);

                rawContent = completion?.Choices?.FirstOrDefault()?.Message?.Content
                    ?? throw new AiServiceException("OpenAI response contained no message content.");
            }
            catch (HttpRequestException ex)
            {
                // Network-level failure: DNS, connection refused, TLS
                // handshake issue — never even got a response back.
                throw new AiServiceException("Could not reach the OpenAI API.", ex);
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                // HttpClient surfaces its own request timeout as
                // TaskCanceledException, not TimeoutException. The "when"
                // clause here distinguishes that from a caller explicitly
                // cancelling via the cancellationToken — different causes,
                // different message.
                throw new AiServiceException("The request to OpenAI timed out.", ex);
            }

            return ParseQuestions(rawContent);
        }

        private static string BuildPrompt(string topic, string difficulty, int questionCount)
        {
            // Triple-quoted raw string literal (C# 11+) — no escaping
            // needed for the embedded quotes/braces in the JSON example,
            // which would otherwise be a mess of \" and {{ }} escapes.
            return $$"""
                Generate {{questionCount}} multiple-choice quiz questions about "{{topic}}" at {{difficulty}} difficulty.

                Respond with ONLY this JSON shape, and nothing else:
                {
                  "questions": [
                    {
                      "text": "question text",
                      "optionA": "...",
                      "optionB": "...",
                      "optionC": "...",
                      "optionD": "...",
                      "correctAnswer": "A"
                    }
                  ]
                }

                correctAnswer must be exactly one of: "A", "B", "C", "D".
                """;
        }

        /// <summary>
        /// The "JSON fallback logic" the ticket asks for. Even with
        /// response_format: json_object forcing valid JSON, models
        /// occasionally still wrap it in markdown fences or add stray
        /// text — this gives parsing a second chance before failing.
        /// </summary>
        private static List<GeneratedQuestionDto> ParseQuestions(string rawContent)
        {
            var parsed = TryDeserialize(rawContent);
            if (parsed is not null)
                return parsed;

            // Fallback: extract the substring between the first '{' and
            // the last '}' — strips markdown fences or leading/trailing
            // commentary — and try parsing that instead.
            var start = rawContent.IndexOf('{');
            var end = rawContent.LastIndexOf('}');

            if (start >= 0 && end > start)
            {
                var extracted = rawContent.Substring(start, end - start + 1);
                var fallbackParsed = TryDeserialize(extracted);
                if (fallbackParsed is not null)
                    return fallbackParsed;
            }

            throw new AiServiceException(
                $"Could not parse a valid question list from the AI response. Raw content: {rawContent}");
        }

        private static List<GeneratedQuestionDto>? TryDeserialize(string json)
        {
            try
            {
                var wrapper = JsonSerializer.Deserialize<QuestionListWrapper>(json, ResponseJsonOptions);
                return wrapper?.Questions is { Count: > 0 } questions ? questions : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }
    }
}