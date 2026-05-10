package com.dailyeng.ai;

import com.dailyeng.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import com.dailyeng.common.exception.ExternalServiceException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Google Gemini AI integration service.
 * Provides AI methods for speaking practice, scenario generation, and chatbot.
 *
 * <p>Methods:
 * <ul>
 *   <li>{@link #generateSpeakingResponse} — in-conversation AI reply</li>
 *   <li>{@link #analyzeSessionConversation} — post-session error analysis + scoring</li>
 *   <li>{@link #generateScenario} — create custom/random scenarios</li>
 *   <li>{@link #generateDoraraResponse} — AI chatbot for DailyEng</li>
 * </ul>
 */
@Slf4j
@Service
public class GeminiService {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final FuriganaService furiganaService;
    private Client client;

    public GeminiService(AppProperties appProperties, ObjectMapper objectMapper, FuriganaService furiganaService) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.furiganaService = furiganaService;
    }

    @PostConstruct
    void init() {
        var apiKey = appProperties.getGemini().getApiKey();
        if (apiKey != null && !apiKey.isBlank()) {
            this.client = Client.builder().apiKey(apiKey).build();
            log.info("Gemini client initialized with model: {}", appProperties.getGemini().getModel());
        } else {
            log.warn("GEMINI_API_KEY not set — AI features will return fallback responses");
        }
    }

    // ========================================================================
    // CEFR Level Guidance
    // ========================================================================

    private String getLevelGuidance(String level) {
        if (level == null) return "moderate vocabulary and sentence complexity";
        return switch (level.toUpperCase()) {
            case "A1" -> "very simple words, short sentences, present tense only, basic vocabulary";
            case "A2" -> "simple vocabulary, short sentences, common phrases, past and future tenses";
            case "B1" -> "everyday vocabulary, moderate sentence length, common idioms, varied tenses";
            case "B2" -> "diverse vocabulary, complex sentences, idioms and expressions, all tenses";
            case "C1" -> "sophisticated vocabulary, nuanced expressions, complex grammar structures";
            case "C2" -> "native-level vocabulary, idiomatic expressions, any grammatical structure";
            default -> "moderate vocabulary and sentence complexity";
        };
    }

    // ========================================================================
    // 1. generateSpeakingResponse — In-conversation AI reply
    // ========================================================================

    public record SpeakingResponseResult(String response, String correctionHint, String relevanceHint) {}

    public record SpeakingHintResult(String hint, String hintTranslation) {}

    public record ScenarioConfig(String context, String userRole, String botRole, String goal, String level, Integer variationSeed, String language) {
        /** Backwards-compatible constructor without variationSeed and language */
        public ScenarioConfig(String context, String userRole, String botRole, String goal, String level) {
            this(context, userRole, botRole, goal, level, null, "en");
        }
    }

    /**
     * Generate AI speaking response during conversation.
     */
    @CircuitBreaker(name = "gemini", fallbackMethod = "generateSpeakingResponseFallback")
    @Retry(name = "gemini")
    public SpeakingResponseResult generateSpeakingResponse(
            ScenarioConfig scenario,
            List<Map<String, String>> history,
            String userMessage,
            int turnsRemaining
    ) {
        if (client == null) {
            return new SpeakingResponseResult("I'm sorry, I didn't catch that. Could you repeat?", null, null);
        }

        var botRoleDesc = scenario.botRole() != null
                ? "You are playing the role of: " + scenario.botRole()
                : "You are an English tutor";
        var userRoleDesc = scenario.userRole() != null
                ? "The user is playing the role of: " + scenario.userRole()
                : "";
        var goalDesc = scenario.goal() != null ? "Conversation goal: " + scenario.goal() : "";
        var levelDesc = scenario.level() != null
                ? "LEARNER LEVEL: %s - Adjust your vocabulary accordingly. Use %s.".formatted(
                scenario.level(), getLevelGuidance(scenario.level()))
                : "";
        var variationDesc = buildVariationDirective(scenario.variationSeed());

        var wrapUpDirective = "";
        if (turnsRemaining <= 0) {
            wrapUpDirective = "\nCONVERSATION ENDING: This is the FINAL turn. End the conversation with a natural closing/goodbye. Thank the user for the practice.";
        } else if (turnsRemaining <= 2) {
            wrapUpDirective = "\nCONVERSATION ENDING SOON: Only %d turn(s) remaining. Start wrapping up naturally — summarize key points, give a farewell, or bring the conversation to a natural close.".formatted(turnsRemaining);
        }

        var languageName = getLanguageName(scenario.language());
        var isTargetLanguage = scenario.language() != null && !scenario.language().equals("en");
        var languageDirective = isTargetLanguage
                ? """
                        
                        LANGUAGE: You MUST respond in %s. After your %s response, append an English translation in parentheses.
                        Format: "<%s text> (<English translation>)"
                        Example: "Sí, la estación está directamente aquí y a la derecha. (Yes, the station is straight from here and on the right.)"
                        The parenthetical English is for the learner's reference only — the main response MUST be in %s.""".formatted(languageName, languageName, languageName, languageName)
                : "";

        var systemPrompt = """
                You are a %s tutor helping a language learner practice speaking through roleplay.
                
                SCENARIO CONTEXT: %s
                %s
                %s
                %s
                %s
                %s
                %s
                
                Your task:
                1. Stay in character as %s and respond naturally to continue the roleplay.
                2. Generate a natural, conversational response that advances the scenario. Keep it concise (1-2 sentences).
                3. If the user made a notable grammar or vocabulary error, naturally incorporate the correct form in your response.
                   Example: If user says "I go there yesterday", respond: "Oh, you went there yesterday? That sounds interesting!"
                %s
                
                IMPORTANT: Be natural and engaging. Do NOT use markdown formatting.
                CRITICAL: Return ONLY a JSON object: {"response": "<your response>", "correctionHint": "<brief correction or null>", "relevanceHint": "<brief comment on how well the response fits the scenario or null>"}
                
                RELEVANCE HINT RULES:
                - relevanceHint should be a brief, helpful comment in English IF the user's response is off-topic or doesn't fit the context well.
                - Example: "You should focus on ordering food instead of talking about the weather."
                - If the response is perfectly relevant, return null.
                
                CORRECTION HINT RULES — BE VERY SELECTIVE:
                - correctionHint must be null UNLESS there is a CLEAR, UNAMBIGUOUS grammar or vocabulary mistake.
                - Only flag errors that would be marked wrong in a %s textbook.
                - Do NOT flag stylistic preferences, minor phrasing differences, or debatable grammar.
                - When in doubt, return null. Most casual conversation does NOT need correction.
                - Format: "wrong phrase → correct phrase (brief reason)"
                """.formatted(languageName, scenario.context(), botRoleDesc, userRoleDesc, goalDesc, levelDesc,
                variationDesc, languageDirective, scenario.botRole() != null ? scenario.botRole() : "the tutor",
                wrapUpDirective, languageName);

        try {
            var contents = buildContents(history, userMessage);
            var responseText = callGemini(systemPrompt, contents, 0.7, 1024);

            // Try parsing as JSON first, fall back to raw text
            try {
                var parsed = objectMapper.readTree(responseText);
                var responseField = parsed.path("response").asText(null);
                var correctionHint = parsed.path("correctionHint").asText(null);
                var relevanceHint = parsed.path("relevanceHint").asText(null);
                if (responseField != null && !responseField.isBlank()) {
                    var annotated = furiganaService.annotateIfJapanese(responseField, scenario.language());
                    return new SpeakingResponseResult(annotated,
                            correctionHint != null && !correctionHint.equals("null") ? correctionHint : null,
                            relevanceHint != null && !relevanceHint.equals("null") ? relevanceHint : null);
                }
            } catch (Exception jsonEx) {
                log.debug("[generateSpeakingResponse] Gemini returned plain text, using as-is");
            }

            // Use raw text (strip quotes if wrapped)
            var cleaned = responseText.strip();
            if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
                cleaned = cleaned.substring(1, cleaned.length() - 1);
            }
            var annotated = furiganaService.annotateIfJapanese(cleaned, scenario.language());
            return new SpeakingResponseResult(annotated.isBlank()
                    ? "I'm sorry, I didn't catch that. Could you repeat?"
                    : annotated, null, null);
        } catch (Exception e) {
            log.error("[generateSpeakingResponse] Error: {}", e.getMessage());
            return new SpeakingResponseResult("I'm sorry, I didn't catch that. Could you repeat?", null, null);
        }
    }

    // ========================================================================
    // 1b. generateSpeakingHint — Suggest what the user could say
    // ========================================================================

    /**
     * Generate a sample response hint that the user can read aloud.
     */
    @CircuitBreaker(name = "gemini", fallbackMethod = "generateSpeakingHintFallback")
    @Retry(name = "gemini")
    public SpeakingHintResult generateSpeakingHint(
            ScenarioConfig scenario,
            List<Map<String, String>> history
    ) {
        if (client == null) {
            return new SpeakingHintResult("I would like to ask about that, please.", null);
        }

        var levelDesc = scenario.level() != null
                ? "The user is at %s level. Use %s.".formatted(
                scenario.level(), getLevelGuidance(scenario.level()))
                : "Use moderate vocabulary.";
        var variationDesc = buildVariationDirective(scenario.variationSeed());

        var languageName = getLanguageName(scenario.language());
        var isTargetLanguage = scenario.language() != null && !scenario.language().equals("en");
        var languageDirective = isTargetLanguage
                ? "\nLANGUAGE: Generate the hint in %s. Return JSON: {\"hint\": \"<the %s text>\", \"hintTranslation\": \"<English translation>\"}".formatted(languageName, languageName)
                : "";

        var systemPrompt = """
                You are helping a %s learner practice speaking through roleplay.
                
                SCENARIO: %s
                USER ROLE: %s
                BOT ROLE: %s
                GOAL: %s
                %s
                %s
                %s
                
                The user doesn't know what to say next. Generate a SAMPLE RESPONSE that the user could say.
                
                Rules:
                1. The response should be from the USER's perspective (playing their role: %s)
                2. Keep it natural, 1-2 sentences
                3. Match the user's CEFR level — don't use vocabulary beyond their ability
                4. Make it relevant to the last thing the tutor said
                5. Return ONLY the sample text the user should say, nothing else
                6. Do NOT add quotation marks, labels, or explanations
                """.formatted(
                languageName,
                scenario.context(),
                scenario.userRole() != null ? scenario.userRole() : "a learner",
                scenario.botRole() != null ? scenario.botRole() : "a tutor",
                scenario.goal() != null ? scenario.goal() : "Complete the conversation",
                levelDesc,
                variationDesc,
                languageDirective,
                scenario.userRole() != null ? scenario.userRole() : "a learner");

        try {
            var contents = buildContents(history, "Give me a hint for what I should say next.");
            var responseText = callGemini(systemPrompt, contents, 0.8, 256);
            // Clean any accidental quotes/labels
            var cleaned = responseText.strip()
                    .replaceAll("^[\"']|[\"']$", "")
                    .replaceAll("^(User|You|Hint|Sample|Response|Suggested):\\s*", "");

            // For non-English: try to parse JSON with hint + hintTranslation
            if (isTargetLanguage) {
                try {
                    var parsed = objectMapper.readTree(cleaned);
                    var hintField = parsed.path("hint").asText(null);
                    var translationField = parsed.path("hintTranslation").asText(null);
                    if (hintField != null && !hintField.isBlank()) {
                        var annotated = furiganaService.annotateIfJapanese(hintField, scenario.language());
                        return new SpeakingHintResult(
                                annotated.isBlank() ? "I would like to ask about that, please." : annotated,
                                translationField);
                    }
                } catch (Exception jsonEx) {
                    log.debug("[generateSpeakingHint] Non-JSON response for target language, using as-is");
                }
            }

            var annotated = furiganaService.annotateIfJapanese(cleaned, scenario.language());
            return new SpeakingHintResult(annotated.isBlank()
                    ? "I would like to ask about that, please."
                    : annotated, null);
        } catch (Exception e) {
            log.error("[generateSpeakingHint] Error: {}", e.getMessage());
            return new SpeakingHintResult("I would like to ask about that, please.", null);
        }
    }

    // ========================================================================
    // 2. analyzeSessionConversation — Post-session analysis
    // ========================================================================

    public record CorrectedSentence(int turnIndex, String original, String corrected) {}
    public record SuggestedPhrase(String used, String better) {}
    public record TurnError(String word, String correction, String errorType, int startIndex, int endIndex) {}
    public record TurnAnalysis(int turnIndex, List<TurnError> errors) {}
    public record SessionAnalysisResult(
            String feedbackTitle, String feedbackSummary, String feedbackRating, String feedbackTip,
            int grammarScore, int relevanceScore, int vocabularyScore,
            List<TurnAnalysis> turnAnalyses,
            List<CorrectedSentence> correctedSentences,
            List<String> vocabularyHighlights,
            List<SuggestedPhrase> suggestedPhrases) {}

    /**
     * Analyze session conversation for errors and scoring.
     */
    @CircuitBreaker(name = "gemini", fallbackMethod = "analyzeSessionConversationFallback")
    @Retry(name = "gemini")
    public SessionAnalysisResult analyzeSessionConversation(
            String scenarioContext,
            List<Map<String, String>> turns,
            String language
    ) {
        // Filter user turns
        var userTurns = turns.stream().filter(t -> "user".equals(t.get("role"))).toList();

        if (userTurns.isEmpty()) {
            return new SessionAnalysisResult(
                    "Session Complete", "Start speaking to get feedback!",
                    "N/A", "Try to speak more in your next session.",
                    0, 0, 0, List.of(), List.of(), List.of(), List.of());
        }

        if (client == null) {
            return fallbackAnalysis(userTurns);
        }

        // Build conversation text with turn indices
        var sb = new StringBuilder();
        int userIdx = 0;
        for (var turn : turns) {
            var role = "user".equals(turn.get("role")) ? "User" : "Tutor";
            var indexLabel = "user".equals(turn.get("role")) ? " [UserTurnIndex: " + (userIdx++) + "]" : "";
            sb.append("%s%s: \"%s\"\n".formatted(role, indexLabel, turn.get("text")));
        }

        boolean isJapanese = "ja".equals(language);
        var prompt = isJapanese ? """
                You are a STRICT but fair Japanese language evaluator. Analyze this conversation with HONEST and ACCURATE scoring.
                
                SCENARIO CONTEXT: %s
                
                CONVERSATION:
                %s
                
                YOUR TASK - BE STRICT AND THOROUGH:
                1. For each USER turn, identify ALL errors (particles, verb conjugation, politeness level, vocabulary, word order).
                2. For each error, provide EXACT position (startIndex, endIndex in character count) in the original text.
                3. Calculate HONEST scores - do NOT inflate.
                
                STRICT SCORING GUIDELINES:
                GRAMMAR: 90-100 (perfect particle/conjugation usage), 80-89 (1-2 errors), 70-79 (3-4 errors), 60-69 (5-7 errors), below 60 (8+ errors)
                RELEVANCE: 90-100 (perfectly on-topic), 80-89 (mostly relevant), 70-79 (generally relevant), below 70 (off-topic)
                VOCABULARY: 90-100 (diverse, natural word choices), 80-89 (good variety), 70-79 (adequate), 60-69 (limited/repetitive), below 60 (very basic/incorrect)
                FEEDBACK RATING: "Excellent" (all 85+), "Good" (all 70+), "Average" (one 60-69), "Needs Improvement" (any below 60)
                
                Return JSON ONLY:
                {
                  "feedbackTitle": "<max 5 words>",
                  "feedbackSummary": "<2-sentence honest feedback>",
                  "feedbackRating": "<Excellent|Good|Average|Needs Improvement>",
                  "feedbackTip": "<specific actionable tip>",
                  "grammarScore": <0-100>,
                  "relevanceScore": <0-100>,
                  "vocabularyScore": <0-100>,
                  "turnAnalyses": [
                    {
                      "turnIndex": <index>,
                      "errors": [
                        {"word": "<incorrect>", "correction": "<correct>", "errorType": "<Particle|Conjugation|Politeness|Vocabulary|Word Order|Expression>", "startIndex": <int>, "endIndex": <int>}
                      ]
                    }
                  ],
                  "correctedSentences": [
                    {"turnIndex": <index>, "original": "<user's text>", "corrected": "<corrected version>"}
                  ],
                  "vocabularyHighlights": ["word1", "phrase2"],
                  "suggestedPhrases": [
                    {"used": "<what user said>", "better": "<more natural alternative>"}
                  ]
                }
                """.formatted(scenarioContext, sb.toString())
                : """
                You are a STRICT but fair English language evaluator. Analyze this conversation with HONEST and ACCURATE scoring.
                
                SCENARIO CONTEXT: %s
                
                CONVERSATION:
                %s
                
                YOUR TASK - BE STRICT AND THOROUGH:
                1. For each USER turn, identify ALL errors (grammar, articles, prepositions, vocabulary, verb tense, word choice).
                2. For each error, provide EXACT position (startIndex, endIndex) in the original text.
                3. Calculate HONEST scores - do NOT inflate.
                
                STRICT SCORING GUIDELINES:
                GRAMMAR: 90-100 (perfect), 80-89 (1-2 errors), 70-79 (3-4 errors), 60-69 (5-7 errors), below 60 (8+ errors)
                RELEVANCE: 90-100 (perfectly on-topic), 80-89 (mostly relevant), 70-79 (generally relevant), below 70 (off-topic)
                VOCABULARY: 90-100 (diverse, precise word choices), 80-89 (good variety), 70-79 (adequate), 60-69 (limited/repetitive), below 60 (very basic/incorrect)
                FEEDBACK RATING: "Excellent" (all 85+), "Good" (all 70+), "Average" (one 60-69), "Needs Improvement" (any below 60)
                
                Return JSON ONLY:
                {
                  "feedbackTitle": "<max 5 words>",
                  "feedbackSummary": "<2-sentence honest feedback>",
                  "feedbackRating": "<Excellent|Good|Average|Needs Improvement>",
                  "feedbackTip": "<specific actionable tip>",
                  "grammarScore": <0-100>,
                  "relevanceScore": <0-100>,
                  "vocabularyScore": <0-100>,
                  "turnAnalyses": [
                    {
                      "turnIndex": <index>,
                      "errors": [
                        {"word": "<incorrect>", "correction": "<correct>", "errorType": "<Grammar|Vocabulary|Preposition|Article|Verb Tense|Word Choice>", "startIndex": <int>, "endIndex": <int>}
                      ]
                    }
                  ],
                  "correctedSentences": [
                    {"turnIndex": <index>, "original": "<user's text>", "corrected": "<corrected version>"}
                  ],
                  "vocabularyHighlights": ["word1", "phrase2"],
                  "suggestedPhrases": [
                    {"used": "<what user said>", "better": "<better alternative>"}
                  ]
                }
                """.formatted(scenarioContext, sb.toString());

        try {
            var contents = List.of(
                    Content.builder()
                            .role("user")
                            .parts(List.of(Part.builder().text(prompt).build()))
                            .build());
            var responseText = callGemini(null, contents, 0.3, 16384);
            return objectMapper.readValue(responseText, SessionAnalysisResult.class);
        } catch (Exception e) {
            log.error("[analyzeSessionConversation] Error: {}", e.getMessage());
            return fallbackAnalysis(userTurns);
        }
    }

    // ========================================================================
    // 3. generateScenario — Custom/Random scenario creation
    // ========================================================================

    public record GeneratedScenario(
            String title, String description, String goal, String level,
            String context, String image, String imageKeyword,
            String userRole, String botRole, String openingLine, List<String> objectives) {}

    /**
     * Generate a speaking scenario via AI.
     */
    @CircuitBreaker(name = "gemini", fallbackMethod = "generateScenarioFallback")
    @Retry(name = "gemini")
    public GeneratedScenario generateScenario(String topic, String userLevel) {
        if (client == null) {
            return fallbackScenario(topic, userLevel);
        }

        var levelInstruction = userLevel != null
                ? "The scenario MUST be appropriate for %s level learners. Use %s.".formatted(
                        userLevel, getLevelGuidance(userLevel))
                : "The scenario should be appropriate for B1 (intermediate) level learners.";

        var topicInstruction = topic != null
                ? "Create a speaking roleplay scenario based on: \"%s\".".formatted(topic)
                : "Create a RANDOM, creative speaking roleplay scenario. Choose from diverse topics like: travel, shopping, dining, job interviews, doctor visits, customer service, making friends, etc.";

        var prompt = """
                %s
                
                %s
                
                IMPORTANT: Generate a complete, engaging roleplay scenario. ALL content MUST be in ENGLISH.
                
                Output JSON format ONLY:
                {
                  "title": "Short catchy title (2-5 words)",
                  "description": "Brief description (1-2 sentences)",
                  "goal": "What the user needs to achieve",
                  "level": "%s",
                  "context": "Detailed user-facing situation description (2-3 sentences)",
                  "image": "/learning.png",
                  "imageKeyword": "2-3 word search term for stock photo",
                  "userRole": "The role the learner plays",
                  "botRole": "The role the AI plays",
                  "openingLine": "The AI's first message to start the conversation",
                  "objectives": ["Objective 1", "Objective 2", "Objective 3"]
                }
                """.formatted(topicInstruction, levelInstruction, userLevel != null ? userLevel : "B1");

        try {
            var contents = List.of(
                    Content.builder()
                            .role("user")
                            .parts(List.of(Part.builder().text(prompt).build()))
                            .build());
            var responseText = callGemini(null, contents, 0.8, 8192);
            var parsed = objectMapper.readValue(responseText, GeneratedScenario.class);
            // Fill fallbacks for missing fields
            return new GeneratedScenario(
                    parsed.title() != null ? parsed.title() : (topic != null ? topic.substring(0, Math.min(50, topic.length())) : "Random Scenario"),
                    parsed.description() != null ? parsed.description() : "Practice speaking in this scenario",
                    parsed.goal() != null ? parsed.goal() : "Complete the conversation successfully",
                    parsed.level() != null ? parsed.level() : (userLevel != null ? userLevel : "B1"),
                    parsed.context() != null ? parsed.context() : "You are having a conversation.",
                    "/learning.png",
                    parsed.imageKeyword() != null ? parsed.imageKeyword() : "english learning",
                    parsed.userRole() != null ? parsed.userRole() : "Learner",
                    parsed.botRole() != null ? parsed.botRole() : "English Tutor",
                    parsed.openingLine() != null ? parsed.openingLine() : "Hello! How can I help you today?",
                    parsed.objectives() != null ? parsed.objectives() : List.of("Practice speaking naturally", "Use appropriate vocabulary"));
        } catch (Exception e) {
            log.error("[generateScenario] Error: {}", e.getMessage());
            return fallbackScenario(topic, userLevel);
        }
    }

    // ========================================================================
    // 4. generateDoraraResponse — AI Chatbot (Structured JSON Output)
    // ========================================================================

    /**
     * Generate Dorara AI chatbot response as structured JSON.
     * Returns raw JSON string — parsing is handled by DoraraService.
     */
    @CircuitBreaker(name = "gemini", fallbackMethod = "generateDoraraResponseFallback")
    @Retry(name = "gemini")
    public String generateDoraraResponse(
            String systemInstruction,
            List<Map<String, String>> history,
            String userMessage
    ) {
        if (client == null) {
            return "{\"response\":\"Xin lỗi, tôi gặp chút trục trặc. Bạn có thể hỏi lại được không?\",\"suggestedActions\":[],\"vocabHighlights\":[],\"quizQuestion\":null}";
        }

        try {
            var contents = buildContents(history, userMessage);
            // Increased tokens (2048 → 4096) for structured JSON with vocab cards & quizzes
            return callGemini(systemInstruction, contents, 0.7, 4096);
        } catch (Exception e) {
            log.error("[generateDoraraResponse] Error: {}", e.getMessage());
            return "{\"response\":\"Xin lỗi, tôi gặp chút trục trặc. Bạn có thể hỏi lại được không?\",\"suggestedActions\":[],\"vocabHighlights\":[],\"quizQuestion\":null}";
        }
    }

    /**
     * Generate Dorara AI response with streaming via a consumer callback.
     * Each chunk of text is passed to the consumer as it arrives.
     */
    public void generateDoraraResponseStream(
            String systemInstruction,
            List<Map<String, String>> history,
            String userMessage,
            java.util.function.Consumer<String> chunkConsumer
    ) {
        if (client == null) {
            chunkConsumer.accept("{\"response\":\"Xin lỗi, tôi gặp chút trục trặc.\",\"suggestedActions\":[],\"vocabHighlights\":[],\"quizQuestion\":null}");
            return;
        }

        try {
            var contents = buildContents(history, userMessage);
            var model = appProperties.getGemini().getModel();

            var configBuilder = GenerateContentConfig.builder()
                    .candidateCount(1)
                    .temperature(0.7f)
                    .maxOutputTokens(4096);

            if (systemInstruction != null && !systemInstruction.isBlank()) {
                configBuilder.systemInstruction(
                        Content.fromParts(Part.fromText(systemInstruction)));
            }

            var config = configBuilder.build();

            // Use streaming API — emit each chunk as it arrives
            var stream = client.models.generateContentStream(model, contents, config);
            for (var chunk : stream) {
                var text = chunk.text();
                if (text != null && !text.isEmpty()) {
                    chunkConsumer.accept(text);
                }
            }
        } catch (Exception e) {
            log.error("[generateDoraraResponseStream] Error: {}", e.getMessage());
            chunkConsumer.accept("{\"response\":\"Xin lỗi, tôi gặp chút trục trặc.\",\"suggestedActions\":[],\"vocabHighlights\":[],\"quizQuestion\":null}");
        }
    }

    /**
     * [V2] Generate Dorara AI response with plain text streaming.
     * Drops the JSON wrapper requirement to prevent chunk parsing errors later.
     */
    public void generateDoraraStreamV2(
            String systemInstruction,
            List<Map<String, String>> history,
            String userMessage,
            java.util.function.Consumer<String> chunkConsumer
    ) {
        if (client == null) {
            chunkConsumer.accept("Xin lỗi, tôi gặp chút trục trặc. (No API Key config)");
            return;
        }

        try {
            var contents = buildContents(history, userMessage);
            var model = appProperties.getGemini().getModel();

            var configBuilder = GenerateContentConfig.builder()
                    .candidateCount(1)
                    .temperature(0.7f)
                    .maxOutputTokens(4096);

            if (systemInstruction != null && !systemInstruction.isBlank()) {
                configBuilder.systemInstruction(
                        Content.fromParts(Part.fromText(systemInstruction)));
            }

            log.info("[GeminiService V2] Start streaming plain-text for Dorara...");
            var stream = client.models.generateContentStream(model, contents, configBuilder.build());
            for (var chunk : stream) {
                var text = chunk.text();
                if (text != null && !text.isEmpty()) {
                    chunkConsumer.accept(text); // RAW TEXT, NO JSON
                }
            }
            log.info("[GeminiService V2] Stream finished successfully.");
            
        } catch (Exception e) {
            log.error("[generateDoraraStreamV2] Streaming Error: {}", e.getMessage());
            chunkConsumer.accept("\n\n*(Lỗi kết nối AI: " + e.getMessage() + ")*");
        }
    }

    // ========================================================================
    // 5. generateDoraraEnrich — Post-Stream Vocab + Quiz extraction
    // ========================================================================

    /**
     * Analyze the completed AI response text and extract vocabulary highlights + quiz question.
     * Called AFTER streaming completes (separate API call to avoid breaking SSE stream).
     */
    public com.dailyeng.dorara.DoraraDtos.EnrichResponse generateDoraraEnrich(
            String aiResponse,
            String userMessage,
            String targetLanguage
    ) {
        var emptyResponse = new com.dailyeng.dorara.DoraraDtos.EnrichResponse(List.of(), null);

        if (client == null || aiResponse == null || aiResponse.isBlank()) {
            return emptyResponse;
        }

        var langName = getLanguageName(targetLanguage);

        var prompt = """
                You are a language learning assistant. Analyze this %s learning Q&A exchange and extract educational content.

                USER QUESTION: %s

                AI TUTOR RESPONSE:
                %s

                YOUR TASK: Extract 1-3 key vocabulary words from the AI response AND create 1 quiz question.

                STRICT RULES:
                - Only extract words that are EXPLICITLY explained or demonstrated in the AI response.
                - If there are no clear vocabulary teaching moments, return empty vocabHighlights [].
                - The quiz question must be directly based on content in the response.
                - phonetic should be IPA format (e.g. /ˈwɜːrd/) — use null if unsure.
                - Return ONLY valid JSON, nothing else.

                JSON FORMAT:
                {
                  "vocabHighlights": [
                    {
                      "word": "<the English word>",
                      "phonetic": "<IPA or null>",
                      "meaning": "<concise Vietnamese meaning>",
                      "example": "<example sentence from the response or related>"
                    }
                  ],
                  "quizQuestion": {
                    "question": "<multiple choice question in Vietnamese>",
                    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
                    "correctIndex": <0-3>,
                    "explanation": "<brief explanation in Vietnamese>"
                  }
                }
                """.formatted(langName, userMessage, aiResponse);

        try {
            var contents = List.of(
                    Content.builder()
                            .role("user")
                            .parts(List.of(Part.builder().text(prompt).build()))
                            .build());
            var responseText = callGemini(null, contents, 0.3, 2048);

            // Parse JSON response
            var parsed = objectMapper.readTree(responseText);

            // Parse vocabHighlights
            var vocabList = new ArrayList<com.dailyeng.dorara.DoraraDtos.VocabHighlight>();
            var vocabNode = parsed.path("vocabHighlights");
            if (vocabNode.isArray()) {
                for (var item : vocabNode) {
                    vocabList.add(new com.dailyeng.dorara.DoraraDtos.VocabHighlight(
                            item.path("word").asText(null),
                            item.path("phonetic").asText(null),
                            item.path("meaning").asText(null),
                            item.path("example").asText(null)
                    ));
                }
            }

            // Parse quizQuestion
            com.dailyeng.dorara.DoraraDtos.QuizQuestion quiz = null;
            var quizNode = parsed.path("quizQuestion");
            if (!quizNode.isMissingNode() && !quizNode.isNull()) {
                var options = new ArrayList<String>();
                quizNode.path("options").forEach(o -> options.add(o.asText()));
                quiz = new com.dailyeng.dorara.DoraraDtos.QuizQuestion(
                        quizNode.path("question").asText(null),
                        options,
                        quizNode.path("correctIndex").asInt(0),
                        quizNode.path("explanation").asText(null)
                );
            }

            log.info("[generateDoraraEnrich] Extracted {} vocab items, quiz: {}", vocabList.size(), quiz != null);
            return new com.dailyeng.dorara.DoraraDtos.EnrichResponse(vocabList, quiz);

        } catch (Exception e) {
            log.warn("[generateDoraraEnrich] Failed to parse enrichment response: {}", e.getMessage());
            return emptyResponse;
        }
    }


    // ========================================================================
    // Private helpers
    // ========================================================================

    /**
     * Build a list of Content objects from conversation history + current user message.
     */
    private List<Content> buildContents(
            List<Map<String, String>> history,
            String userMessage
    ) {
        var contents = new ArrayList<Content>();

        // History
        if (history != null) {
            for (var msg : history) {
                var role = msg.get("role");
                var text = msg.get("text") != null ? msg.get("text") : msg.get("content");
                if (text == null) continue;

                // Gemini uses "user" and "model" roles
                var geminiRole = "user".equals(role) ? "user" : "model";
                contents.add(Content.builder()
                        .role(geminiRole)
                        .parts(List.of(Part.builder().text(text).build()))
                        .build());
            }
        }

        // Current user message
        contents.add(Content.builder()
                .role("user")
                .parts(List.of(Part.builder().text(userMessage).build()))
                .build());

        return contents;
    }

    /**
     * Call Gemini API with the given system prompt, contents, temperature, and max tokens.
     */
    private String callGemini(String systemPrompt, List<Content> contents, double temperature, int maxTokens) {
        var model = appProperties.getGemini().getModel();

        var configBuilder = GenerateContentConfig.builder()
                .candidateCount(1)
                .temperature((float) temperature)
                .maxOutputTokens(maxTokens);

        // Set system instruction if provided
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            configBuilder.systemInstruction(
                    Content.fromParts(Part.fromText(systemPrompt)));
        }

        var config = configBuilder.build();
        GenerateContentResponse response = client.models.generateContent(model, contents, config);
        var content = response.text();

        if (content == null) {
            return "";
        }

        // Strip markdown code fences if present
        if (content.startsWith("```")) {
            content = content.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
        }
        return content;
    }

    /**
     * Build a variation directive for the AI prompt based on a seed number.
     * This makes the same scenario produce different conversations each time.
     */
    private String getLanguageName(String langCode) {
        if (langCode == null) return "English";
        return switch (langCode.toLowerCase()) {
            case "ja" -> "Japanese";
            case "en" -> "English";
            case "vi" -> "Vietnamese";
            case "ko" -> "Korean";
            case "zh" -> "Chinese";
            case "fr" -> "French";
            case "es" -> "Spanish";
            case "de" -> "German";
            default -> "English";
        };
    }

    private String buildVariationDirective(Integer seed) {
        if (seed == null || seed <= 0) return "";
        return """
                VARIATION SEED: %d
                Use this number to create UNIQUE details for this conversation instance.
                Vary: specific items/products/menu choices, names of people/places, prices/numbers,
                personality traits/attitudes, and minor complications or twists.
                The seed determines YOUR choices — be creative but stay within the scenario's theme and difficulty level.
                Do NOT mention the seed number to the user.""".formatted(seed);
    }

    private SessionAnalysisResult fallbackAnalysis(List<Map<String, String>> userTurns) {
        var analyses = new ArrayList<TurnAnalysis>();
        for (int i = 0; i < userTurns.size(); i++) {
            analyses.add(new TurnAnalysis(i, List.of()));
        }
        return new SessionAnalysisResult(
                "Session Complete",
                "Great effort! Keep practicing to improve your English speaking skills.",
                "Good", "Focus on grammar and vocabulary to improve your speaking.",
                70, 70, 70, analyses, List.of(), List.of(), List.of());
    }

    private GeneratedScenario fallbackScenario(String topic, String userLevel) {
        return new GeneratedScenario(
                topic != null ? topic.substring(0, Math.min(50, topic.length())) : "Practice Conversation",
                "Custom speaking scenario", "Practice conversation",
                userLevel != null ? userLevel : "B1",
                topic != null ? "Roleplay about " + topic : "Have a casual English conversation",
                "/learning.png",
                topic != null ? topic.split(" ")[0] : "conversation practice",
                "Learner", "English Tutor",
                "Hello! I'm here to help you practice English. What would you like to talk about?",
                List.of("Practice speaking naturally", "Build confidence"));
    }

    // ========================================================================
    // Resilience4j Fallback Methods
    // ========================================================================

    private SpeakingResponseResult generateSpeakingResponseFallback(
            ScenarioConfig scenario,
            List<Map<String, String>> history,
            String userMessage,
            int turnsRemaining,
            Throwable t) {
        log.error("Gemini speaking response circuit breaker activated: {}", t.getMessage());
        return new SpeakingResponseResult("I'm sorry, I didn't catch that. Could you repeat?", null, null);
    }

    private SpeakingHintResult generateSpeakingHintFallback(
            ScenarioConfig scenario,
            List<Map<String, String>> history,
            Throwable t) {
        log.error("Gemini speaking hint circuit breaker activated: {}", t.getMessage());
        return new SpeakingHintResult("I would like to ask about that, please.", null);
    }

    private SessionAnalysisResult analyzeSessionConversationFallback(
            String scenarioContext, List<Map<String, String>> turns, String language, Throwable t) {
        log.error("Gemini session analysis circuit breaker activated: {}", t.getMessage());
        throw new ExternalServiceException("AI analysis service temporarily unavailable", t);
    }

    private GeneratedScenario generateScenarioFallback(String topic, String userLevel, Throwable t) {
        log.error("Gemini scenario generation circuit breaker activated: {}", t.getMessage());
        throw new ExternalServiceException("AI scenario generation service temporarily unavailable", t);
    }

    private String generateDoraraResponseFallback(
            String systemInstruction,
            List<Map<String, String>> history,
            String userMessage,
            Throwable t) {
        log.error("Gemini Dorara response circuit breaker activated: {}", t.getMessage());
        return "{\"response\":\"Xin lỗi, tôi gặp chút trục trặc. Bạn có thể hỏi lại được không?\",\"suggestedActions\":[],\"vocabHighlights\":[],\"quizQuestion\":null}";
    }
}
