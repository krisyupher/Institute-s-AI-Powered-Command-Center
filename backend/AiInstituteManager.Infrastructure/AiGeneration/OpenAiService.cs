using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
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
            // Chunk the requested count into batches small enough for the
            // model's output budget. A single request asking for the full
            // set (e.g. allam-2-7b's 4,096-token output cap vs. a 15-question
            // JSON blob) gets truncated mid-JSON and fails to parse, then the
            // retry loop just re-sends the same oversized payload. Chunking
            // keeps every response well under the cap (and under Groq's
            // free-tier ~6k TPM budget per minute). Values come from
            // OpenAiSettings.ChunkSize / OpenAiSettings.MaxAttempts so
            // operators can dial them per environment without a rebuild.
            int ChunkSize = _settings.ChunkSize;
            int MaxAttempts = _settings.MaxAttempts;

            var chunks = new List<int>();
            for (var remaining = questionCount; remaining > 0; remaining -= ChunkSize)
            {
                chunks.Add(Math.Min(ChunkSize, remaining));
            }

            var allQuestions = new List<GeneratedQuestionDto>(questionCount);

            if (chunks.Count <= 1)
            {
                // Single chunk (the common case for small quizzes) — no
                // fan-out, keep it simple.
                var single = await CallWithRetriesAsync(
                    topic, difficulty, chunks[0], MaxAttempts, cancellationToken);
                allQuestions.AddRange(single);
            }
            else
            {
                // Multiple chunks: fire them off concurrently — 3 chunks of
                // 5 finish in roughly one generation time (~3s) instead of
                // three sequential generations, and the extra concurrent
                // requests stay within the TPM/RPM free-tier budget.
                var responses = await Task.WhenAll(chunks.Select(async qty =>
                    await CallWithRetriesAsync(topic, difficulty, qty, MaxAttempts, cancellationToken)));

                foreach (var response in responses)
                {
                    allQuestions.AddRange(response);
                }
            }

            // Under-count the model couldn't reach even after retries: return
            // what we got — the teacher can review and add the missing
            // questions manually in the preview step. Only fail when we got
            // nothing at all.
            if (allQuestions.Count == 0)
            {
                throw new AiServiceException(
                    $"AI returned 0 questions; expected {questionCount} after {MaxAttempts} attempts per {ChunkSize}-question batch.");
            }

            return allQuestions.Take(questionCount).ToList();
        }

        /// <summary>
        /// Runs one chunk (up to ChunkSize questions) through the retry loop.
        /// ChunkSize and MaxAttempts are supplied from OpenAiSettings so
        // operators can dial them per environment without a rebuild — e.g.
        // lower ChunkSize on the free tier, raise MaxAttempts against a
        // flaky provider. These default to the historical values (5 / 3).
        /// </summary>
        private async Task<List<GeneratedQuestionDto>> CallWithRetriesAsync(
            string topic,
            string difficulty,
            int chunkSize,
            int maxAttempts,
            CancellationToken cancellationToken)
        {
            var requestBody = new ChatCompletionRequest(
                Model: _settings.Model,
                Messages: new List<ChatMessage>
                {
                    new("system",
                        "You are a quiz generation assistant for a school platform. " +
                        "Respond with ONLY raw JSON — no markdown code fences, no " +
                        "backticks, no explanations, no commentary before or after " +
                        "the JSON block."),
                    new("user", BuildPrompt(topic, difficulty, chunkSize))
                },
                // JSON object mode is supported on every Groq model, and with
                // small chunks nothing truncates, so the strict JSON contract
                // is a net win again (it was removed when oversized requests
                // made json_validate_failed the failure mode).
                ResponseFormat: new ResponseFormat("json_object"),
                Temperature: 0.7);

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    var rawContent = await SendRequestAsync(requestBody, cancellationToken);
                    var parsed = ParseQuestions(rawContent);

                    // Guard: some models produce structurally-invalid questions
                    // even in small batches — options left empty with the answer
                    // text crammed into the question text, or literal "A"/"B"/
                    // "C"/"D" labels used as the options. These would 400 on
                    // save and just waste the teacher's review time, so filter
                    // them out here; a chunk that comes back entirely malformed
                    // is treated as a failed attempt and retried.
                    var wellFormed = parsed.Where(IsWellFormed).ToList();
                    if (wellFormed.Count > 0)
                    {
                        return wellFormed;
                    }

                    throw new AiServiceException(
                        "The model response contained no well-formed questions (empty options or missing correctAnswer).");
                }
                catch (AiServiceException ex) when (attempt < maxAttempts)
                {
                    var delaySeconds = DelayBeforeRetry(ex, attempt);
                    await Task.Delay(TimeSpan.FromSeconds(delaySeconds), cancellationToken);
                }
            }

            // Out of attempts for this chunk. Return empty so the caller can
            // either proceed with other chunks (partial quiz) or fail at the
            // end when nothing came back at all.
            return new List<GeneratedQuestionDto>();
        }

        /// <summary>
        /// True when a generated question has the full shape a saved quiz
        /// needs: all four options populated with real content and a
        /// correctAnswer of A/B/C/D. The DTO leaves CorrectAnswer as a free
        /// string precisely so this validation happens here, before the DTO
        /// ever becomes a database Question.
        /// </summary>
        private static bool IsWellFormed(GeneratedQuestionDto q) =>
            !string.IsNullOrWhiteSpace(q.Text) &&
            !string.IsNullOrWhiteSpace(q.OptionA) &&
            !string.IsNullOrWhiteSpace(q.OptionB) &&
            !string.IsNullOrWhiteSpace(q.OptionC) &&
            !string.IsNullOrWhiteSpace(q.OptionD) &&
            (q.CorrectAnswer.Equals("A", StringComparison.OrdinalIgnoreCase) ||
             q.CorrectAnswer.Equals("B", StringComparison.OrdinalIgnoreCase) ||
             q.CorrectAnswer.Equals("C", StringComparison.OrdinalIgnoreCase) ||
             q.CorrectAnswer.Equals("D", StringComparison.OrdinalIgnoreCase));

        /// <summary>
        /// Picks a retry delay: honor a rate-limit delay inferred from the
        /// error (Groq's "Please try again in X.XXs" or a 429 status), else
        /// exponential backoff for transient parse/network failures.
        /// </summary>
        private static double DelayBeforeRetry(AiServiceException ex, int attempt)
        {
            if (ex.Message.Contains("try again in", StringComparison.OrdinalIgnoreCase))
            {
                var match = Regex.Match(ex.Message, @"try again in (\d+\.?\d*)s");
                if (match.Success && double.TryParse(match.Groups[1].Value, out var extractedDelay))
                {
                    return extractedDelay + 1; // Add 1 second buffer
                }
            }

            if (ex.Message.Contains("429", StringComparison.OrdinalIgnoreCase))
            {
                // Conservative default when the message doesn't give us the
                // exact Retry-After duration.
                return 15;
            }

            // Transient errors: exponential backoff, capped so a late retry
            // in a parallel fan-out can't burn the user's patience.
            return Math.Min(Math.Pow(2, attempt), 10);
        }

        private async Task<string> SendRequestAsync(
            ChatCompletionRequest requestBody,
            CancellationToken cancellationToken)
        {
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

                return completion?.Choices?.FirstOrDefault()?.Message?.Content
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
        }

        private static string BuildPrompt(string topic, string difficulty, int questionCount)
        {
            // Triple-quoted raw string literal (C# 11+) — no escaping
            // needed for the embedded quotes/braces in the JSON example,
            // which would otherwise be a mess of \" and {{ }} escapes.
            return $$"""
                Generate {{questionCount}} multiple-choice quiz questions about "{{topic}}" at {{difficulty}} difficulty.

                Respond with ONLY raw JSON (no markdown fences, no backticks, no commentary):
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
                Each string value must be a single line — do not embed newlines or other control characters in text or options.
                The "text" must be ONLY the question itself — never include the options or a "Correct Answer:" line in it.
                optionA/optionB/optionC/optionD must be real, human-readable answer choices — never bare letter labels like "A".
                """;
        }

        /// <summary>
        /// The "JSON fallback logic" the ticket asks for. Even with
        /// response_format: json_object forcing valid JSON, models
        /// occasionally still wrap it in markdown fences or add stray
        /// text — this gives parsing a second chance before failing.
        /// Also handles models that return a raw JSON array instead of
        /// the {"questions": [...]} wrapper shape the prompt requests.
        /// </summary>
        private static List<GeneratedQuestionDto> ParseQuestions(string rawContent)
        {
            // Strip markdown code fences that weaker models wrap JSON in
            var cleaned = StripMarkdown(rawContent);

            // Try parsing as a raw array (some models return JSON arrays
            // directly, e.g. [{"text":..., "optionA":...}] without
            // the {"questions": [...]} wrapper).
            var arrayParsed = TryParseAsArray(cleaned);
            if (arrayParsed is not null)
                return arrayParsed;

            var parsed = TryDeserialize(cleaned);
            if (parsed is not null)
                return parsed;

            // Fallback: extract the substring between the first '{' and
            // the last '}' — strips markdown fences or leading/trailing
            // commentary — and try parsing that instead.
            var start = cleaned.IndexOf('{');
            var end = cleaned.LastIndexOf('}');

            if (start >= 0 && end > start)
            {
                var extracted = cleaned.Substring(start, end - start + 1);
                var fallbackParsed = TryDeserialize(extracted);
                if (fallbackParsed is not null)
                    return fallbackParsed;
            }

            // As last resort, try extracting a JSON array [...]
            var arrayStart = cleaned.IndexOf('[');
            var arrayEnd = cleaned.LastIndexOf(']');

            if (arrayStart >= 0 && arrayEnd > arrayStart)
            {
                var arrayExtracted = cleaned.Substring(arrayStart, arrayEnd - arrayStart + 1);
                var extractedArray = TryParseAsArray(arrayExtracted);
                if (extractedArray is not null)
                    return extractedArray;
            }

            throw new AiServiceException(
                $"Could not parse a valid question list from the AI response. Raw content: {rawContent}");
        }

        private static string StripMarkdown(string rawContent)
        {
            if (string.IsNullOrWhiteSpace(rawContent))
                return rawContent ?? string.Empty;

            // Remove markdown code fences: ```json ... ``` or ``` ... ```
            var cleaned = Regex.Replace(rawContent, @"^```(?:json)?\s*\n?", "", RegexOptions.Multiline);
            cleaned = Regex.Replace(cleaned, @"```$", "", RegexOptions.Multiline);
            // Trim any remaining backticks at start/end
            cleaned = cleaned.Trim('`', ' ', '\n', '\r');
            return cleaned;
        }

        private static List<GeneratedQuestionDto>? TryDeserialize(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;
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

        private static List<GeneratedQuestionDto>? TryParseAsArray(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;
            try
            {
                var array = JsonSerializer.Deserialize<GeneratedQuestionDto[]>(json, ResponseJsonOptions);
                return array?.Length > 0 ? array.ToList() : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }
    }
}