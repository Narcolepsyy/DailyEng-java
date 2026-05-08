package com.dailyeng.speaking;

import com.dailyeng.xp.XpService;
import com.dailyeng.ai.GeminiService;
import com.dailyeng.user.UserRepository;
import com.dailyeng.speaking.SpeakingDtos.*;
import com.dailyeng.xp.XpDtos;
import com.dailyeng.common.enums.Role;
import com.dailyeng.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Speaking session lifecycle service — handles session start, turn submission,
 * analysis/scoring, hints, session details, and deletion.
 * <p>
 * Extracted from SpeakingService to follow Single Responsibility Principle.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpeakingSessionService {

        /** Maximum number of user turns before the session auto-completes. */
        private static final int MAX_USER_TURNS = 8;

        private final SpeakingScenarioRepository scenarioRepo;
        private final SpeakingSessionRepository sessionRepo;
        private final SpeakingTurnRepository turnRepo;
        private final SpeakingTurnErrorRepository turnErrorRepo;
        private final UserRepository userRepo;
        private final GeminiService geminiService;
        private final XpService xpService;

        // ========================================================================
        // startSession
        // ========================================================================

        @Transactional
        public SessionStartResponse startSession(String userId, String scenarioId) {
                var scenario = scenarioRepo.findById(scenarioId)
                                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

                var session = SpeakingSession.builder()
                                .userId(userId).scenarioId(scenarioId)
                                .variationSeed(ThreadLocalRandom.current().nextInt(1, 10000))
                                .build();
                sessionRepo.save(session);
                log.info("🎲 Session started with variationSeed={}", session.getVariationSeed());

                String greetingTurnId = null;
                if (scenario.getOpeningLine() != null && !scenario.getOpeningLine().isBlank()) {
                        var turn = SpeakingTurn.builder()
                                        .sessionId(session.getId()).role(Role.tutor)
                                        .text(scenario.getOpeningLine()).build();
                        turnRepo.save(turn);
                        greetingTurnId = turn.getId();
                }

                return new SessionStartResponse(session.getId(), scenarioId,
                                scenario.getContext(), scenario.getOpeningLine(), greetingTurnId);
        }

        // ========================================================================
        // submitTurn
        // ========================================================================

        @Transactional
        public SubmitTurnResponse submitTurn(String userId, String sessionId, SubmitTurnRequest req) {
                var session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
                if (!userId.equals(session.getUserId())) {
                        throw new ResourceNotFoundException("Session not found: " + sessionId);
                }
                var scenario = scenarioRepo.findById(session.getScenarioId())
                                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found"));
                var turns = turnRepo.findBySessionIdOrderByTimestampAsc(sessionId);

                // Build history for AI
                var history = turns.stream()
                                .map(t -> Map.of("role", t.getRole() == Role.user ? "user" : "assistant", "text",
                                                t.getText()))
                                .collect(Collectors.toList());

                // Count existing user turns + the new one being submitted
                long existingUserTurns = history.stream().filter(h -> "user".equals(h.get("role"))).count();
                int currentUserTurn = (int) existingUserTurns + 1;
                int turnsRemaining = MAX_USER_TURNS - currentUserTurn;
                boolean sessionComplete = turnsRemaining <= 0;

                // Call AI
                var config = new GeminiService.ScenarioConfig(
                                scenario.getContext(), scenario.getUserRole(), scenario.getBotRole(),
                                scenario.getGoal(),
                                scenario.getDifficulty() != null ? scenario.getDifficulty().name() : null,
                                session.getVariationSeed(), scenario.getLanguage());
                var aiResult = geminiService.generateSpeakingResponse(config, history, req.userText(), turnsRemaining);

                // Calculate speech metrics — prefer Azure SDK scores when available
                Integer pronunciationScore = null;
                Integer fluencyScore = null;
                var metrics = req.speechMetrics();
                if (metrics != null && metrics.wordCount() > 0) {
                        if (metrics.azureAccuracyScore() != null && metrics.azureAccuracyScore() > 0) {
                                pronunciationScore = (int) Math.round(metrics.azureAccuracyScore());
                                fluencyScore = (int) Math.round(metrics.azureFluencyScore() != null
                                                ? metrics.azureFluencyScore()
                                                : 0);
                                log.info("📊 Using Azure pronunciation scores: accuracy={}, fluency={}, prosody={}, overall={}",
                                                metrics.azureAccuracyScore(), metrics.azureFluencyScore(),
                                                metrics.azureProsodyScore(), metrics.azureOverallScore());
                        } else {
                                // No Azure scores available — use defaults
                                fluencyScore = 70;
                                pronunciationScore = 70;
                                log.info("📊 No Azure scores available, using defaults");
                        }
                }

                // Save user turn — store Azure prosody as pitchVariance for session-end
                // intonation
                Double storedPitchVariance = metrics != null ? metrics.pitchVariance() : null;
                if (metrics != null && metrics.azureProsodyScore() != null && metrics.azureProsodyScore() > 0) {
                        storedPitchVariance = metrics.azureProsodyScore();
                }

                var userTurn = SpeakingTurn.builder()
                                .sessionId(sessionId).role(Role.user).text(req.userText())
                                .audioUrl(req.audioUrl())
                                .accuracyScore(pronunciationScore).fluencyScore(fluencyScore)
                                .confidenceScores(metrics != null ? metrics.confidenceScores() : List.of())
                                .wordCount(metrics != null ? metrics.wordCount() : null)
                                .speakingDurationMs(metrics != null ? (int) metrics.speakingDurationMs() : null)
                                .pauseCount(metrics != null ? metrics.pauseCount() : null)
                                .pitchVariance(storedPitchVariance)
                                .avgPitch(metrics != null ? metrics.avgPitch() : null)
                                .pitchSamplesCount(metrics != null ? metrics.pitchSamplesCount() : null)
                                .wordAssessmentsJson(metrics != null ? metrics.wordAssessments() : null)
                                .build();
                turnRepo.save(userTurn);

                // Save AI turn
                var aiTurn = SpeakingTurn.builder()
                                .sessionId(sessionId).role(Role.tutor).text(aiResult.response()).build();
                turnRepo.save(aiTurn);

                return new SubmitTurnResponse(aiResult.response(), userTurn.getId(), aiTurn.getId(),
                                sessionComplete, aiResult.correctionHint(), aiResult.relevanceHint());
        }

        // ========================================================================
        // generateHint
        // ========================================================================

        @Transactional(readOnly = true)
        public GeminiService.SpeakingHintResult generateHint(String userId, String sessionId) {
                var session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
                if (!userId.equals(session.getUserId())) {
                        throw new ResourceNotFoundException("Session not found: " + sessionId);
                }
                var scenario = scenarioRepo.findById(session.getScenarioId())
                                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found"));
                var turns = turnRepo.findBySessionIdOrderByTimestampAsc(sessionId);

                var history = turns.stream()
                                .map(t -> Map.of("role", t.getRole() == Role.user ? "user" : "assistant", "text",
                                                t.getText()))
                                .collect(Collectors.toList());

                var config = new GeminiService.ScenarioConfig(
                                scenario.getContext(), scenario.getUserRole(), scenario.getBotRole(),
                                scenario.getGoal(),
                                scenario.getDifficulty() != null ? scenario.getDifficulty().name() : null,
                                session.getVariationSeed(), scenario.getLanguage());

                return geminiService.generateSpeakingHint(config, history);
        }

        // ========================================================================
        // analyzeAndScoreSession (endSession)
        // ========================================================================

        @Transactional
        public SessionAnalysisResponse analyzeAndScoreSession(String userId, String sessionId) {
                var session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
                if (!userId.equals(session.getUserId())) {
                        throw new ResourceNotFoundException("Session not found: " + sessionId);
                }
                var scenario = scenarioRepo.findById(session.getScenarioId())
                                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found"));
                var turns = turnRepo.findBySessionIdOrderByTimestampAsc(sessionId);
                var userTurns = turns.stream().filter(t -> t.getRole() == Role.user).toList();

                // Call AI for analysis
                var turnsForAnalysis = turns.stream()
                                .map(t -> Map.of("role", t.getRole() == Role.user ? "user" : "tutor",
                                                "text", t.getText(), "id", t.getId()))
                                .collect(Collectors.toList());
                var analysis = geminiService.analyzeSessionConversation(scenario.getContext(), turnsForAnalysis,
                                scenario.getLanguage());

                // Save errors per turn
                for (var ta : analysis.turnAnalyses()) {
                        if (ta.turnIndex() >= 0 && ta.turnIndex() < userTurns.size()) {
                                var userTurn = userTurns.get(ta.turnIndex());
                                turnErrorRepo.deleteByTurnId(userTurn.getId());
                                for (var err : ta.errors()) {
                                        turnErrorRepo.save(SpeakingTurnError.builder()
                                                        .turnId(userTurn.getId()).word(err.word())
                                                        .correction(err.correction()).errorType(err.errorType())
                                                        .startIndex(err.startIndex()).endIndex(err.endIndex()).build());
                                }
                        }
                }

                // Calculate session-level scores from turn averages
                var turnsWithScores = turns.stream()
                                .filter(t -> t.getRole() == Role.user && t.getWordCount() != null
                                                && t.getWordCount() > 0 && t.getAccuracyScore() != null)
                                .toList();

                int pronScore = turnsWithScores.isEmpty() ? 70
                                : (int) Math.round(turnsWithScores.stream().mapToInt(SpeakingTurn::getAccuracyScore)
                                                .average().orElse(70));
                int fluScore = turnsWithScores.isEmpty() ? 70
                                : (int) Math.round(turnsWithScores.stream()
                                                .mapToInt(t -> t.getFluencyScore() != null ? t.getFluencyScore() : 0)
                                                .average().orElse(70));

                // Intonation: prefer Azure prosody scores, fall back to pitch variance
                // heuristic
                int intoScore;
                boolean hasAzureScores = turnsWithScores.stream()
                                .anyMatch(t -> t.getAccuracyScore() != null && t.getAccuracyScore() > 0
                                                && t.getFluencyScore() != null && t.getFluencyScore() > 0);

                if (hasAzureScores) {
                        var pitchTurns = turns.stream()
                                        .filter(t -> t.getRole() == Role.user && t.getPitchVariance() != null
                                                        && t.getPitchVariance() > 0)
                                        .toList();

                        if (!pitchTurns.isEmpty() && pitchTurns.get(0).getPitchVariance() > 10) {
                                double avgProsody = pitchTurns.stream().mapToDouble(SpeakingTurn::getPitchVariance)
                                                .average().orElse(70);
                                intoScore = (int) Math.round(Math.min(100, avgProsody));
                                log.info("📊 Session intonation from Azure prosody: {}", intoScore);
                        } else {
                                intoScore = (int) Math.round((pronScore + fluScore) / 2.0);
                                log.info("📊 Session intonation from Azure avg: {}", intoScore);
                        }
                } else {
                        // No Azure scores: use average of pronunciation and fluency as intonation proxy
                        intoScore = (int) Math.round((pronScore + fluScore) / 2.0);
                        log.info("📊 Session intonation from fallback avg: {}", intoScore);
                }

                // Determine level string for weighted scoring
                var user = userRepo.findById(userId).orElse(null);
                String levelStr = null;
                if (scenario.getDifficulty() != null) {
                        levelStr = scenario.getDifficulty().name();
                } else if (user != null && user.getLevel() != null) {
                        levelStr = user.getLevel().name();
                }

                int vocabScore = analysis.vocabularyScore();
                int overallScore = calculateWeightedOverallScore(
                                analysis.grammarScore(), vocabScore, analysis.relevanceScore(),
                                fluScore, pronScore, intoScore, levelStr);

                // Update session
                session.setEndedAt(LocalDateTime.now());
                session.setDuration(session.getCreatedAt() != null
                                ? (int) ChronoUnit.SECONDS.between(session.getCreatedAt(), LocalDateTime.now())
                                : 0);
                session.setOverallScore(overallScore);
                session.setGrammarScore(analysis.grammarScore());
                session.setTopicScore(analysis.relevanceScore());
                session.setFluencyScore(fluScore);
                session.setAccuracyScore(pronScore);
                session.setProsodyScore(intoScore);
                session.setVocabularyScore(vocabScore);
                session.setFeedbackTitle(analysis.feedbackTitle());
                session.setFeedbackSummary(analysis.feedbackSummary());
                session.setFeedbackRating(analysis.feedbackRating());
                session.setFeedbackTip(analysis.feedbackTip());
                sessionRepo.save(session);

                // Award XP for completing the session
                xpService.awardXp(userId, XpDtos.XP_SPEAKING_SESSION);
                int totalWords = userTurns.stream().mapToInt(t -> t.getWordCount() != null ? t.getWordCount() : 0)
                                .sum();
                int durationMinutes = session.getDuration() != null ? session.getDuration() / 60 : 5;
                xpService.recordActivity(userId, 1, durationMinutes, totalWords);

                // ── Enhancement #1: Adaptive difficulty ──
                String newLevel = null;
                String previousLevel = null;
                if (user != null && user.getLevel() != null) {
                        previousLevel = user.getLevel().name();
                        var recentSessions = sessionRepo.findByUserIdAndEndedAtIsNotNullOrderByEndedAtDesc(userId);
                        var recent5 = recentSessions.stream().limit(5).toList();
                        var recent3 = recentSessions.stream().limit(3).toList();

                        // Promote: 5 straight sessions avg ≥ 85
                        if (recent5.size() >= 5) {
                                double avg5 = recent5.stream()
                                                .mapToInt(s -> s.getOverallScore() != null ? s.getOverallScore() : 0)
                                                .average().orElse(0);
                                if (avg5 >= 85) {
                                        var levels = com.dailyeng.common.enums.Level.values();
                                        int currentOrd = user.getLevel().ordinal();
                                        if (currentOrd < levels.length - 1) {
                                                user.setLevel(levels[currentOrd + 1]);
                                                userRepo.save(user);
                                                newLevel = user.getLevel().name();
                                                log.info("🎉 User {} promoted from {} to {}", userId, previousLevel,
                                                                newLevel);
                                        }
                                }
                        }

                        // Demote: 3 straight sessions avg ≤ 45
                        if (newLevel == null && recent3.size() >= 3) {
                                double avg3 = recent3.stream()
                                                .mapToInt(s -> s.getOverallScore() != null ? s.getOverallScore() : 0)
                                                .average().orElse(0);
                                if (avg3 <= 45) {
                                        int currentOrd = user.getLevel().ordinal();
                                        if (currentOrd > 0) {
                                                var levels = com.dailyeng.common.enums.Level.values();
                                                user.setLevel(levels[currentOrd - 1]);
                                                userRepo.save(user);
                                                newLevel = user.getLevel().name();
                                                log.info("📉 User {} demoted from {} to {}", userId, previousLevel,
                                                                newLevel);
                                        }
                                }
                        }

                        // Only return level change if it actually changed
                        if (newLevel != null && newLevel.equals(previousLevel)) {
                                newLevel = null;
                                previousLevel = null;
                        }
                }

                // Build error categories
                Map<String, Integer> errorMap = new LinkedHashMap<>();
                for (var ta : analysis.turnAnalyses()) {
                        for (var e : ta.errors()) {
                                errorMap.merge(e.errorType(), 1, Integer::sum);
                        }
                }
                var errorCategories = errorMap.entrySet().stream()
                                .map(e -> new ErrorCategory(e.getKey(), e.getValue())).toList();

                // Build conversation
                var conversation = turns.stream().map(t -> {
                        var turnErrors = analysis.turnAnalyses().stream()
                                        .filter(ta -> ta.turnIndex() >= 0 && ta.turnIndex() < userTurns.size()
                                                        && userTurns.get(ta.turnIndex()).getId().equals(t.getId()))
                                        .flatMap(ta -> ta.errors().stream())
                                        .map(e -> new TurnErrorDto(e.word(), e.correction(), e.errorType(),
                                                        e.startIndex(), e.endIndex()))
                                        .toList();
                        return new ConversationTurn(t.getRole().name(), t.getText(), t.getId(),
                                        turnErrors.isEmpty() ? null : turnErrors,
                                        t.getRole() == Role.user ? t.getAccuracyScore() : null,
                                        t.getRole() == Role.user ? t.getFluencyScore() : null,
                                        t.getRole() == Role.user ? parseWordAssessments(t.getWordAssessmentsJson())
                                                        : null);
                }).toList();

                var scores = new SessionScores(analysis.grammarScore(), analysis.relevanceScore(),
                                fluScore, pronScore, intoScore, vocabScore, overallScore);

                // Map richer analysis data to DTO types
                var correctedSentences = analysis.correctedSentences() != null
                                ? analysis.correctedSentences().stream()
                                                .map(cs -> new com.dailyeng.speaking.SpeakingDtos.CorrectedSentence(
                                                                cs.turnIndex(), cs.original(), cs.corrected()))
                                                .toList()
                                : List.<com.dailyeng.speaking.SpeakingDtos.CorrectedSentence>of();
                var suggestedPhrases = analysis.suggestedPhrases() != null
                                ? analysis.suggestedPhrases().stream()
                                                .map(sp -> new com.dailyeng.speaking.SpeakingDtos.SuggestedPhrase(
                                                                sp.used(), sp.better()))
                                                .toList()
                                : List.<com.dailyeng.speaking.SpeakingDtos.SuggestedPhrase>of();
                var vocabHighlights = analysis.vocabularyHighlights() != null
                                ? analysis.vocabularyHighlights()
                                : List.<String>of();

                return new SessionAnalysisResponse(scores, errorCategories, conversation,
                                analysis.feedbackTitle(), analysis.feedbackSummary(),
                                analysis.feedbackRating(), analysis.feedbackTip(),
                                newLevel, previousLevel,
                                correctedSentences, vocabHighlights, suggestedPhrases);
        }

        // ========================================================================
        // getSessionDetails
        // ========================================================================

        @Transactional(readOnly = true)
        public SessionDetailResponse getSessionDetails(String userId, String sessionId) {
                var session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
                if (!userId.equals(session.getUserId())) {
                        throw new ResourceNotFoundException("Session not found: " + sessionId);
                }
                var turns = turnRepo.findBySessionIdOrderByTimestampAsc(sessionId);

                // Build error categories
                Map<String, Integer> errorMap = new LinkedHashMap<>();
                var conversation = turns.stream().map(t -> {
                        List<TurnErrorDto> errors = List.of();
                        if (t.getRole() == Role.user && t.getErrors() != null && !t.getErrors().isEmpty()) {
                                errors = t.getErrors().stream()
                                                .map(e -> {
                                                        errorMap.merge(e.getErrorType(), 1, Integer::sum);
                                                        return new TurnErrorDto(e.getWord(), e.getCorrection(),
                                                                        e.getErrorType(), null, null);
                                                }).toList();
                        }
                        return new ConversationTurn(t.getRole().name(), t.getText(), t.getId(),
                                        errors.isEmpty() ? null : errors,
                                        t.getRole() == Role.user ? t.getAccuracyScore() : null,
                                        t.getRole() == Role.user ? t.getFluencyScore() : null,
                                        t.getRole() == Role.user ? parseWordAssessments(t.getWordAssessmentsJson())
                                                        : null);
                }).toList();

                var errorCategories = errorMap.entrySet().stream()
                                .map(e -> new ErrorCategory(e.getKey(), e.getValue())).toList();

                var info = new SessionInfo(
                                session.getId(),
                                session.getCreatedAt() != null ? session.getCreatedAt().toString() : null,
                                session.getEndedAt() != null ? session.getEndedAt().toString() : null,
                                session.getDuration(), session.getOverallScore(),
                                session.getGrammarScore(), session.getTopicScore(),
                                session.getFluencyScore(), session.getAccuracyScore(),
                                session.getProsodyScore(), session.getFeedbackTitle(),
                                session.getFeedbackSummary(), session.getFeedbackRating(), session.getFeedbackTip());

                var scores = new SessionScores(
                                session.getGrammarScore() != null ? session.getGrammarScore() : 0,
                                session.getTopicScore() != null ? session.getTopicScore() : 0,
                                session.getFluencyScore() != null ? session.getFluencyScore() : 0,
                                session.getAccuracyScore() != null ? session.getAccuracyScore() : 0,
                                session.getProsodyScore() != null ? session.getProsodyScore() : 0,
                                session.getVocabularyScore() != null ? session.getVocabularyScore() : 0,
                                session.getOverallScore() != null ? session.getOverallScore() : 0);

                return new SessionDetailResponse(info, scores, errorCategories, conversation);
        }

        // ========================================================================
        // deleteSession
        // ========================================================================

        @Transactional
        public void deleteSession(String sessionId, String userId) {
                var session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
                if (!userId.equals(session.getUserId())) {
                        throw new com.dailyeng.common.exception.UnauthorizedException(
                                        "You can only delete your own sessions");
                }
                var turns = turnRepo.findBySessionIdOrderByTimestampAsc(sessionId);
                for (var turn : turns) {
                        turnErrorRepo.deleteByTurnId(turn.getId());
                }
                turnRepo.deleteAll(turns);
                sessionRepo.delete(session);
                log.info("🗑️ Deleted session {} for user {}", sessionId, userId);
        }

        // ========================================================================
        // Private helpers
        // ========================================================================

        /**
         * Parse stored JSONB word assessments back into DTOs for API response.
         */
        @SuppressWarnings("unchecked")
        private List<WordAssessmentDto> parseWordAssessments(Object jsonData) {
                if (jsonData == null)
                        return null;
                try {
                        if (jsonData instanceof List<?> list) {
                                return list.stream()
                                                .filter(item -> item instanceof Map)
                                                .map(item -> {
                                                        var map = (Map<String, Object>) item;
                                                        var phonemes = map.get("phonemes") instanceof List<?> pList
                                                                        ? pList.stream().filter(p -> p instanceof Map)
                                                                                        .map(p -> {
                                                                                                var pm = (Map<String, Object>) p;
                                                                                                return new PhonemeDto(
                                                                                                                (String) pm.get("phoneme"),
                                                                                                                ((Number) pm.getOrDefault(
                                                                                                                                "accuracyScore",
                                                                                                                                0))
                                                                                                                                .doubleValue());
                                                                                        }).toList()
                                                                        : List.<PhonemeDto>of();
                                                        var syllables = map.get("syllables") instanceof List<?> sList
                                                                        ? sList.stream().filter(s -> s instanceof Map)
                                                                                        .map(s -> {
                                                                                                var sm = (Map<String, Object>) s;
                                                                                                return new SyllableDto(
                                                                                                                (String) sm.get("syllable"),
                                                                                                                ((Number) sm.getOrDefault(
                                                                                                                                "accuracyScore",
                                                                                                                                0))
                                                                                                                                .doubleValue());
                                                                                        }).toList()
                                                                        : List.<SyllableDto>of();
                                                        return new WordAssessmentDto(
                                                                        (String) map.get("word"),
                                                                        ((Number) map.getOrDefault("accuracyScore", 0))
                                                                                        .doubleValue(),
                                                                        (String) map.getOrDefault("errorType", "None"),
                                                                        phonemes, syllables);
                                                }).toList();
                        }
                        return null;
                } catch (Exception e) {
                        log.warn("Failed to parse word assessments: {}", e.getMessage());
                        return null;
                }
        }

        /**
         * Calculate overall score with level-aware weights.
         * Beginners weight grammar more; advanced learners weight vocabulary and
         * intonation more.
         */
        private int calculateWeightedOverallScore(int grammar, int vocabulary, int relevance,
                        int fluency, int pronunciation, int intonation,
                        String level) {
                double wGrammar, wVocab, wRelevance, wFluency, wPron, wInto;

                if (level != null && (level.equals("A1") || level.equals("A2"))) {
                        wGrammar = 0.25;
                        wVocab = 0.15;
                        wRelevance = 0.15;
                        wFluency = 0.20;
                        wPron = 0.15;
                        wInto = 0.10;
                } else if (level != null && (level.equals("C1") || level.equals("C2"))) {
                        wGrammar = 0.15;
                        wVocab = 0.20;
                        wRelevance = 0.15;
                        wFluency = 0.15;
                        wPron = 0.15;
                        wInto = 0.20;
                } else {
                        // Intermediate (B1/B2) or unknown: balanced
                        wGrammar = 0.20;
                        wVocab = 0.15;
                        wRelevance = 0.15;
                        wFluency = 0.20;
                        wPron = 0.15;
                        wInto = 0.15;
                }

                double weighted = grammar * wGrammar + vocabulary * wVocab + relevance * wRelevance
                                + fluency * wFluency + pronunciation * wPron + intonation * wInto;
                return (int) Math.round(Math.max(0, Math.min(100, weighted)));
        }
}
