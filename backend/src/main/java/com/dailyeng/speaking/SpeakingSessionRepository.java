package com.dailyeng.speaking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;

public interface SpeakingSessionRepository extends JpaRepository<SpeakingSession, String> {
        Optional<SpeakingSession> findByIdAndUserId(String id, String userId);

        List<SpeakingSession> findByUserIdOrderByCreatedAtDesc(String userId);

        Page<SpeakingSession> findByUserId(String userId, Pageable pageable);

        List<SpeakingSession> findByUserIdAndScenarioId(String userId, String scenarioId);

        // Completed sessions (endedAt not null)
        List<SpeakingSession> findByUserIdAndEndedAtIsNotNullOrderByEndedAtDesc(String userId);

        Page<SpeakingSession> findByUserIdAndEndedAtIsNotNull(String userId, Pageable pageable);

        Page<SpeakingSession> findByUserIdAndEndedAtIsNotNullAndFeedbackRating(
                        String userId, String feedbackRating, Pageable pageable);

        long countByUserIdAndEndedAtIsNotNull(String userId);

        // ── Language-filtered history queries ──

        @Query("SELECT s FROM SpeakingSession s JOIN SpeakingScenario sc ON s.scenarioId = sc.id " +
                        "WHERE s.userId = :userId AND s.endedAt IS NOT NULL AND sc.language = :language " +
                        "ORDER BY s.endedAt DESC")
        List<SpeakingSession> findCompletedByUserAndLanguage(
                        @Param("userId") String userId, @Param("language") String language);

        @Query("SELECT s FROM SpeakingSession s JOIN SpeakingScenario sc ON s.scenarioId = sc.id " +
                        "WHERE s.userId = :userId AND s.endedAt IS NOT NULL AND sc.language = :language")
        Page<SpeakingSession> findCompletedByUserAndLanguagePaged(
                        @Param("userId") String userId, @Param("language") String language, Pageable pageable);

        @Query("SELECT s FROM SpeakingSession s JOIN SpeakingScenario sc ON s.scenarioId = sc.id " +
                        "WHERE s.userId = :userId AND s.endedAt IS NOT NULL AND sc.language = :language " +
                        "AND s.feedbackRating = :rating")
        Page<SpeakingSession> findCompletedByUserAndLanguageAndRating(
                        @Param("userId") String userId, @Param("language") String language,
                        @Param("rating") String rating, Pageable pageable);

        // Learning records per scenario
        List<SpeakingSession> findByUserIdAndScenarioIdAndEndedAtIsNotNullOrderByCreatedAtDesc(
                        String userId, String scenarioId);

        // User scenario progress
        List<SpeakingSession> findByUserIdAndScenarioIdIn(String userId, List<String> scenarioIds);
}
