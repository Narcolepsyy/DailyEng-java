package com.dailyeng.speaking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * All Speaking module DTOs as Java 21 records.
 * Compact and immutable request/response types.
 */
public final class SpeakingDtos {

    private SpeakingDtos() {}

    // ============================== Requests ==============================

    public record CreateCustomScenarioRequest(@NotBlank @Size(max = 500) String topicPrompt) {}
    public record StartSessionRequest(@NotBlank String scenarioId) {}
    public record SubmitTurnRequest(
            @NotBlank @Size(max = 2000) String userText,
            String audioUrl,
            SpeechMetrics speechMetrics
    ) {}

    public record SpeechMetrics(
            List<Double> confidenceScores,
            int wordCount,
            long speakingDurationMs,
            int pauseCount,
            Double pitchVariance,
            Double avgPitch,
            Integer pitchSamplesCount,
            // Azure Pronunciation Assessment scores (override client heuristics when present)
            Double azureAccuracyScore,
            Double azureFluencyScore,
            Double azureProsodyScore,
            Double azureOverallScore,
            // Per-word pronunciation assessment data from Azure Speech SDK
            List<WordAssessmentDto> wordAssessments
    ) {}

    // ============================== Responses ==============================

    public record TopicGroupResponse(String id, String name, List<String> subcategories) {}

    public record ScenarioListItem(
            String id, String title, String description,
            String category, String subcategory, String level,
            String image, int sessionsCompleted, int totalSessions,
            int progress, boolean isCustom
    ) {}

    public record ScenarioListResponse(
            List<ScenarioListItem> scenarios, long total,
            int totalPages, int currentPage
    ) {}

    public record ScenarioDetailResponse(
            String id, String title, String description,
            String context, String goal, List<String> objectives,
            String userRole, String botRole, String openingLine, String image
    ) {}

    public record SessionStartResponse(
            String sessionId, String scenarioId,
            String contextMessage, String greetingMessage, String greetingTurnId
    ) {}

    public record SubmitTurnResponse(
            String aiResponse, String userTurnId, String aiTurnId,
            boolean sessionComplete, String correctionHint, String relevanceHint
    ) {}

    public record CustomScenarioResponse(ScenarioDetailResponse scenario, String sessionId) {}

    public record SessionScores(
            int grammar, int topic, int fluency,
            int accuracy, int prosody, int vocabulary, int overall
    ) {}

    public record ErrorCategory(String name, int count) {}

    public record ConversationTurn(
            String role, String text, String turnId,
            List<TurnErrorDto> userErrors,
            Integer accuracyScore, Integer fluencyScore,
            List<WordAssessmentDto> wordAssessments
    ) {}

    public record TurnErrorDto(
            String word, String correction, String type,
            Integer startIndex, Integer endIndex
    ) {}

    public record SessionAnalysisResponse(
            SessionScores scores, List<ErrorCategory> errorCategories,
            List<ConversationTurn> conversation,
            String feedbackTitle, String feedbackSummary,
            String feedbackRating, String feedbackTip,
            // Enhancement #1: Adaptive difficulty
            String newLevel, String previousLevel,
            // Enhancement #2: Richer analysis
            List<CorrectedSentence> correctedSentences,
            List<String> vocabularyHighlights,
            List<SuggestedPhrase> suggestedPhrases
    ) {}

    public record SessionDetailResponse(
            SessionInfo session, SessionScores scores,
            List<ErrorCategory> errorCategories, List<ConversationTurn> conversation
    ) {}

    public record SessionInfo(
            String id, String createdAt, String endedAt, Integer duration,
            Integer overallScore, Integer grammarScore, Integer topicScore,
            Integer fluencyScore, Integer accuracyScore, Integer prosodyScore,
            String feedbackTitle, String feedbackSummary,
            String feedbackRating, String feedbackTip
    ) {}

    public record HistoryItem(
            String id, String title, String description, int score,
            String date, String level, String image, int progress, int wordCount
    ) {}

    public record HistoryGraphPoint(int session, int score) {}

    public record HistoryResponse(List<HistoryItem> historyTopics, List<HistoryGraphPoint> historyGraph) {}

    public record HistorySessionItem(
            String id, String scenarioId, String scenarioTitle,
            int overallScore, int grammarScore, int topicScore,
            int fluencyScore, int accuracyScore, int prosodyScore,
            int vocabularyScore, String feedbackRating, String createdAt
    ) {}

    public record HistorySessionsResponse(
            List<HistorySessionItem> sessions, int totalPages, long totalCount
    ) {}

    public record HistoryStatsResponse(
            List<HistoryGraphPoint> performanceData,
            CriteriaAverages criteriaAverages,
            int totalSessions, int highestScore, int averageScore
    ) {}

    public record CriteriaAverages(int topic, int accuracy, int prosody, int fluency, int grammar, int vocabulary) {}

    public record LearningRecordItem(
            String id, int overallScore, int grammarScore, int topicScore,
            int fluencyScore, int accuracyScore, int prosodyScore, int vocabularyScore, String date
    ) {}

    // ============================== Word Assessment ==============================

    public record WordAssessmentDto(
            String word,
            double accuracyScore,
            String errorType,
            List<PhonemeDto> phonemes,
            List<SyllableDto> syllables
    ) {}

    public record PhonemeDto(String phoneme, double accuracyScore) {}
    public record SyllableDto(String syllable, double accuracyScore) {}

    // ============================== Richer Analysis DTOs ==============================

    /** A corrected version of a user turn. */
    public record CorrectedSentence(int turnIndex, String original, String corrected) {}

    /** A better alternative for a phrase the user used. */
    public record SuggestedPhrase(String used, String better) {}

    // ============================== Bookmarks ==============================

    public record ToggleBookmarkRequest(@NotBlank String scenarioId) {}
    public record ToggleBookmarkResponse(boolean bookmarked) {}
    public record BookmarkListResponse(
            List<ScenarioListItem> bookmarks,
            List<String> bookmarkIds,
            long total,
            int totalPages,
            int currentPage
    ) {}

    // ============================== Speech Assessment DTOs ==============================

    /** Combined transcribe + pronunciation assessment response. */
    public record TranscribeAssessResponse(
            String text,
            double accuracyScore,
            double fluencyScore,
            double prosodyScore,
            double overallScore,
            double completenessScore,
            List<WordAssessResult> words
    ) {}

    /** Per-word pronunciation result with IPA phonemes. */
    public record WordAssessResult(
            String word,
            double accuracyScore,
            String errorType,
            List<PhonemeResult> phonemes,
            List<SyllableResult> syllables
    ) {}

    /** Per-phoneme IPA result. */
    public record PhonemeResult(
            String phoneme,
            double accuracyScore
    ) {}

    /** Per-syllable result. */
    public record SyllableResult(
            String syllable,
            double accuracyScore
    ) {}
}
