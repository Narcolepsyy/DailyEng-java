package com.dailyeng.srs;

import com.dailyeng.xp.XpService;

import com.dailyeng.srs.SrsDtos.*;
import com.dailyeng.xp.XpDtos;
import com.dailyeng.user.ProfileStats;
import com.dailyeng.vocabulary.UserVocabProgress;
import com.dailyeng.vocabulary.UserVocabProgress.SrsState;
import com.dailyeng.vocabulary.VocabItem;
import com.dailyeng.user.ProfileStatsRepository;
import com.dailyeng.vocabulary.UserVocabProgressRepository;
import com.dailyeng.vocabulary.VocabItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Spaced Repetition Service — manages vocab review lifecycle using FSRS
 * algorithm.
 * <p>
 * Orchestrates review submissions, due item queries, study session
 * generation, and integrates with XP system on mastery milestones.
 * Logs every review for per-user FSRS weight optimization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SrsService {

        private final UserVocabProgressRepository progressRepo;
        private final VocabItemRepository vocabItemRepo;
        private final ProfileStatsRepository profileStatsRepo;
        private final ReviewLogRepository reviewLogRepo;
        private final XpService xpService;

        private static final int MASTERY_THRESHOLD = 100;

        // ========================================================================
        // 1. reviewVocabItem — process a review
        // ========================================================================

        @Transactional
        public ReviewResponse reviewVocabItem(String userId, String vocabItemId, int rating) {
                var progress = progressRepo.findByUserIdAndVocabItemId(userId, vocabItemId)
                                .orElseGet(() -> createNewProgress(userId, vocabItemId));

                double elapsedDays = progress.getLastReviewed() != null
                                ? ChronoUnit.HOURS.between(progress.getLastReviewed(), LocalDateTime.now()) / 24.0
                                : 0;

                // Load per-user optimized weights (null = use defaults)
                double[] userWeights = loadUserWeights(userId);

                // Log review BEFORE scheduling (captures pre-review state)
                logReview(userId, vocabItemId, rating, elapsedDays, progress);

                // Run FSRS algorithm with user's personalized weights
                var result = FsrsAlgorithm.schedule(
                                progress.getStability(),
                                progress.getDifficulty(),
                                elapsedDays,
                                rating,
                                progress.getSrsState(),
                                progress.getRepetitions(),
                                progress.getLapses(),
                                userWeights);

                // Update entity
                progress.setStability(result.stability());
                progress.setDifficulty(result.difficulty());
                progress.setRepetitions(result.repetitions());
                progress.setLapses(result.lapses());
                progress.setSrsState(result.state());
                progress.setLastReviewed(LocalDateTime.now());
                progress.setNextReview(LocalDateTime.now().plusDays(result.intervalDays()));

                int newMastery = Math.max(0, Math.min(MASTERY_THRESHOLD,
                                progress.getMasteryLevel() + result.masteryDelta()));
                boolean justMastered = newMastery >= MASTERY_THRESHOLD
                                && progress.getMasteryLevel() < MASTERY_THRESHOLD;
                progress.setMasteryLevel(newMastery);
                progressRepo.save(progress);

                // Award XP on mastery milestone
                int xpAwarded = 0;
                if (justMastered) {
                        var xpResult = xpService.awardXp(userId, XpDtos.XP_VOCAB_MASTERY);
                        xpAwarded = xpResult.xpAwarded();
                        log.info("🎓 Vocab item mastered: userId={}, vocabItemId={}", userId, vocabItemId);
                }

                double retrievability = FsrsAlgorithm.retrievability(result.stability(), 0);

                return new ReviewResponse(
                                progress.getNextReview().toString(),
                                result.intervalDays(),
                                Math.round(result.stability() * 100.0) / 100.0,
                                Math.round(result.difficulty() * 100.0) / 100.0,
                                Math.round(retrievability * 1000.0) / 1000.0,
                                newMastery,
                                result.state().name(),
                                xpAwarded);
        }

        // ========================================================================
        // 2. getDueItems — items needing review
        // ========================================================================

        @Transactional(readOnly = true)
        public List<DueItemResponse> getDueItems(String userId, int limit) {
                var now = LocalDateTime.now();
                var allProgress = progressRepo.findByUserIdAndNextReviewBefore(userId, now);

                allProgress.sort(Comparator.comparingDouble(p -> {
                        double elapsed = ChronoUnit.HOURS.between(p.getLastReviewed(), now) / 24.0;
                        return FsrsAlgorithm.retrievability(p.getStability(), elapsed);
                }));

                return allProgress.stream()
                                .limit(limit)
                                .map(this::mapToDueItem)
                                .toList();
        }

        // ========================================================================
        // 3. getReviewStats — overview statistics
        // ========================================================================

        @Transactional(readOnly = true)
        public ReviewStatsResponse getReviewStats(String userId) {
                var now = LocalDateTime.now();
                var endOfWeek = now.plusDays(7);

                var allProgress = progressRepo.findByUserId(userId);
                if (allProgress.isEmpty()) {
                        return new ReviewStatsResponse(0, 0, 0, 0, 0.0, 0);
                }

                int dueToday = 0;
                int dueThisWeek = 0;
                int totalReviewed = 0;
                int masteredCount = 0;
                int newCount = 0;
                double totalRetention = 0.0;
                int retentionCount = 0;

                // ⚡ Bolt: Consolidated multiple sequential stream().filter() calls into a single O(N) pass to minimize traversals
                for (var p : allProgress) {
                        if (p.getNextReview() != null) {
                                if (p.getNextReview().isBefore(now)) {
                                        dueToday++;
                                }
                                if (p.getNextReview().isBefore(endOfWeek)) {
                                        dueThisWeek++;
                                }
                        }

                        if (p.getSrsState() != SrsState.NEW) {
                                totalReviewed++;
                        } else {
                                newCount++;
                        }

                        if (p.getMasteryLevel() >= MASTERY_THRESHOLD) {
                                masteredCount++;
                        }

                        if (p.getStability() > 0 && p.getLastReviewed() != null) {
                                double elapsed = ChronoUnit.HOURS.between(p.getLastReviewed(), now) / 24.0;
                                totalRetention += FsrsAlgorithm.retrievability(p.getStability(), elapsed);
                                retentionCount++;
                        }
                }

                double avgRetention = retentionCount > 0 ? totalRetention / retentionCount : 0.0;

                return new ReviewStatsResponse(
                                dueToday, dueThisWeek, totalReviewed, masteredCount,
                                Math.round(avgRetention * 1000.0) / 1000.0, newCount);
        }

        // ========================================================================
        // 4. getStudySession — mix of due + new items for a topic
        // ========================================================================

        @Transactional(readOnly = true)
        public StudySessionResponse getStudySession(String userId, String topicId, int limit) {
                var now = LocalDateTime.now();

                var vocabItems = vocabItemRepo.findByTopicId(topicId);
                var vocabIds = vocabItems.stream().map(VocabItem::getId).toList();

                var existingProgress = progressRepo.findByUserIdAndVocabItemIdIn(userId, vocabIds)
                                .stream()
                                .collect(Collectors.toMap(UserVocabProgress::getVocabItemId, p -> p));

                var dueItems = existingProgress.values().stream()
                                .filter(p -> p.getNextReview() != null && p.getNextReview().isBefore(now))
                                .sorted(Comparator.comparingDouble(p -> {
                                        double elapsed = ChronoUnit.HOURS.between(p.getLastReviewed(), now) / 24.0;
                                        return FsrsAlgorithm.retrievability(p.getStability(), elapsed);
                                }))
                                .toList();

                var newItems = vocabItems.stream()
                                .filter(v -> !existingProgress.containsKey(v.getId()))
                                .toList();

                int reviewCount = Math.min(dueItems.size(), limit);
                int newCount = Math.min(newItems.size(), limit - reviewCount);

                var sessionItems = Stream.concat(
                                dueItems.stream().limit(reviewCount).map(this::mapToDueItem),
                                newItems.stream().limit(newCount).map(this::mapNewItemToDue)).toList();

                return new StudySessionResponse(sessionItems, newCount, reviewCount, sessionItems.size());
        }

        // ========================================================================
        // 5. optimizeWeights — run ML training on review history
        // ========================================================================

        /**
         * Run gradient descent on user's review history to learn personalized
         * FSRS weights. Returns the optimized weights or null if insufficient data.
         */
        @Transactional
        public double[] optimizeWeights(String userId) {
                long reviewCount = reviewLogRepo.countByUserId(userId);
                if (reviewCount < FsrsOptimizer.MIN_REVIEWS_FOR_OPTIMIZATION) {
                        log.info("⏳ User {} has {} reviews, need {} for optimization",
                                        userId, reviewCount, FsrsOptimizer.MIN_REVIEWS_FOR_OPTIMIZATION);
                        return null;
                }

                var reviews = reviewLogRepo.findByUserIdOrderByCreatedAtAsc(userId);
                double[] optimized = FsrsOptimizer.optimize(reviews);

                if (optimized != null) {
                        var stats = profileStatsRepo.findByUserId(userId)
                                        .orElseGet(() -> profileStatsRepo.save(
                                                        ProfileStats.builder().userId(userId).build()));
                        stats.setFsrsWeights(optimized);
                        profileStatsRepo.save(stats);
                        log.info("✅ Saved optimized FSRS weights for user {}", userId);
                }

                return optimized;
        }

        // ========================================================================
        // Private helpers
        // ========================================================================

        private double[] loadUserWeights(String userId) {
                return profileStatsRepo.findByUserId(userId)
                                .map(ProfileStats::getFsrsWeights)
                                .orElse(null);
        }

        private void logReview(String userId, String vocabItemId, int rating,
                        double elapsedDays, UserVocabProgress progress) {
                reviewLogRepo.save(ReviewLog.builder()
                                .userId(userId)
                                .vocabItemId(vocabItemId)
                                .rating(rating)
                                .elapsedDays(elapsedDays)
                                .stability(progress.getStability())
                                .difficulty(progress.getDifficulty())
                                .state(progress.getSrsState())
                                .build());
        }

        private UserVocabProgress createNewProgress(String userId, String vocabItemId) {
                return progressRepo.save(UserVocabProgress.builder()
                                .userId(userId)
                                .vocabItemId(vocabItemId)
                                .build());
        }

        private DueItemResponse mapToDueItem(UserVocabProgress progress) {
                var vocabItem = progress.getVocabItem();
                if (vocabItem == null) {
                        vocabItem = vocabItemRepo.findById(progress.getVocabItemId()).orElse(null);
                }

                double elapsedDays = progress.getLastReviewed() != null
                                ? ChronoUnit.HOURS.between(progress.getLastReviewed(), LocalDateTime.now()) / 24.0
                                : 0;
                double retrievability = FsrsAlgorithm.retrievability(progress.getStability(), elapsedDays);

                return new DueItemResponse(
                                progress.getVocabItemId(),
                                vocabItem != null ? vocabItem.getWord() : "Unknown",
                                vocabItem != null ? vocabItem.getMeaning() : "",
                                vocabItem != null ? vocabItem.getPronunciation() : "",
                                vocabItem != null && vocabItem.getPartOfSpeech() != null
                                                ? vocabItem.getPartOfSpeech().name()
                                                : "",
                                vocabItem != null ? vocabItem.getExampleSentence() : "",
                                Math.round(retrievability * 1000.0) / 1000.0,
                                progress.getLastReviewed() != null
                                                ? ChronoUnit.DAYS.between(progress.getLastReviewed(),
                                                                LocalDateTime.now())
                                                : 0,
                                progress.getMasteryLevel(),
                                progress.getSrsState().name());
        }

        private DueItemResponse mapNewItemToDue(VocabItem vocabItem) {
                return new DueItemResponse(
                                vocabItem.getId(),
                                vocabItem.getWord(),
                                vocabItem.getMeaning(),
                                vocabItem.getPronunciation(),
                                vocabItem.getPartOfSpeech() != null ? vocabItem.getPartOfSpeech().name() : "",
                                vocabItem.getExampleSentence(),
                                0.0, 0, 0, SrsState.NEW.name());
        }
}
