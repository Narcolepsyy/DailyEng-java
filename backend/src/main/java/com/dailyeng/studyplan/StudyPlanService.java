package com.dailyeng.studyplan;

import com.dailyeng.studyplan.StudyDtos.*;
import com.dailyeng.common.enums.Level;
import com.dailyeng.common.enums.StudyGoal;
import com.dailyeng.common.enums.TaskType;
import com.dailyeng.common.exception.ResourceNotFoundException;
import com.dailyeng.user.ProfileStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

/**
 * Study Plan service — manages study plans, tasks, and study statistics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudyPlanService {

    private final StudyPlanRepository studyPlanRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final ProfileStatsRepository profileStatsRepository;

    // ========================================================================
    // 1. getStudyPlan
    // ========================================================================

    @Transactional
    public StudyPlanResponse getStudyPlan(String userId, String language) {
        var plan = studyPlanRepository.findByUserIdAndLanguage(userId, language).orElse(null);

        if (plan == null) {
            plan = createDefaultPlan(userId, language);
        }

        return toPlanResponse(plan);
    }

    // ========================================================================
    // 2. createNewPlan
    // ========================================================================

    @Transactional
    public StudyPlanResponse createNewPlan(String userId, String language, CreatePlanRequest request) {
        // Delete existing plan (cascades to tasks)
        studyPlanRepository.findByUserIdAndLanguage(userId, language)
                .ifPresent(studyPlanRepository::delete);
        studyPlanRepository.flush();

        int minutesPerDay = Math.round((request.hoursPerWeek() * 60f) / 7);

        var plan = StudyPlan.builder()
                .userId(userId)
                .goal(request.goal())
                .level(request.level())
                .minutesPerDay(minutesPerDay)
                .interests(request.interests() != null ? request.interests() : List.of("General"))
                .build();
        studyPlanRepository.save(plan);

        generateWeeklyTasks(plan);

        // Refetch with tasks
        var savedPlan = studyPlanRepository.findByUserIdAndLanguage(userId, language)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found after creation"));

        log.info("Created new study plan for user {}", userId);
        return toPlanResponse(savedPlan);
    }

    // ========================================================================
    // 3. getTodayTasks
    // ========================================================================

    @Transactional(readOnly = true)
    public List<StudyTaskResponse> getTodayTasks(String userId, String language) {
        var plan = studyPlanRepository.findByUserIdAndLanguage(userId, language).orElse(null);
        if (plan == null) {
            return List.of();
        }

        var todayStart = LocalDate.now().atStartOfDay();
        var tomorrowStart = todayStart.plusDays(1);

        return studyTaskRepository.findByPlanIdAndDateBetween(plan.getId(), todayStart, tomorrowStart)
                .stream()
                .map(this::toTaskResponse)
                .toList();
    }

    // ========================================================================
    // 4. toggleTaskCompletion
    // ========================================================================

    @Transactional
    public StudyTaskResponse toggleTaskCompletion(String userId, String taskId, ToggleTaskRequest request) {
        var task = findTaskByIdAndUserId(taskId, userId);
        task.setCompleted(request.completed());
        studyTaskRepository.save(task);
        return toTaskResponse(task);
    }

    // ========================================================================
    // 5. updateTaskTime
    // ========================================================================

    @Transactional
    public StudyTaskResponse updateTaskTime(String userId, String taskId, UpdateTaskTimeRequest request) {
        var task = findTaskByIdAndUserId(taskId, userId);
        task.setStartTime(request.startTime());
        task.setEndTime(request.endTime());
        studyTaskRepository.save(task);
        return toTaskResponse(task);
    }

    // ========================================================================
    // 6. updateStudyGoal
    // ========================================================================

    @Transactional
    public StudyPlanResponse updateStudyGoal(String userId, String language, UpdateGoalRequest request) {
        var plan = findPlanByUserId(userId, language);
        int minutesPerDay = Math.round((request.hoursPerWeek() * 60f) / 7);

        plan.setGoal(request.goal());
        plan.setLevel(request.level());
        plan.setMinutesPerDay(minutesPerDay);
        studyPlanRepository.save(plan);

        log.info("Updated study goal for user {}", userId);
        return toPlanResponse(plan);
    }

    // ========================================================================
    // 7. updateExamDate
    // ========================================================================

    @Transactional
    public StudyPlanResponse updateExamDate(String userId, String language, UpdateExamDateRequest request) {
        var plan = findPlanByUserId(userId, language);
        plan.setExamDate(request.examDate());
        studyPlanRepository.save(plan);
        return toPlanResponse(plan);
    }

    // ========================================================================
    // 8. getStudyStats
    // ========================================================================

    @Transactional(readOnly = true)
    public StudyStatsResponse getStudyStats(String userId, String language) {
        var plan = studyPlanRepository.findByUserIdAndLanguage(userId, language).orElse(null);

        if (plan == null) {
            return new StudyStatsResponse("0.0", "0.0", "0.0");
        }

        var today = LocalDate.now();
        var todayStart = today.atStartOfDay();
        var tomorrowStart = todayStart.plusDays(1);

        // Monday of current week
        var startOfWeek = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .atStartOfDay();

        var dailyCompleted = studyTaskRepository.findByPlanIdAndDateBetweenAndCompletedTrue(
                plan.getId(), todayStart, tomorrowStart);
        var weeklyCompleted = studyTaskRepository.findByPlanIdAndDateBetweenAndCompletedTrue(
                plan.getId(), startOfWeek, tomorrowStart);

        int dailyMinutes = calculateMinutes(dailyCompleted);
        int weeklyMinutes = calculateMinutes(weeklyCompleted);

        int totalMinutes = profileStatsRepository.findByUserId(userId)
                .map(stats -> stats.getTotalLearningMinutes() + weeklyMinutes)
                .orElse(weeklyMinutes);

        return new StudyStatsResponse(
                formatHours(dailyMinutes),
                formatHours(weeklyMinutes),
                formatHours(totalMinutes)
        );
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private StudyPlan findPlanByUserId(String userId, String language) {
        return studyPlanRepository.findByUserIdAndLanguage(userId, language)
                .orElseGet(() -> {
                    log.info("No study plan found for user {}, creating default plan", userId);
                    return createDefaultPlan(userId, language);
                });
    }

    private StudyTask findTaskByIdAndUserId(String taskId, String userId) {
        return studyTaskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Study task not found: " + taskId));
    }

    private StudyPlan createDefaultPlan(String userId, String language) {
        var plan = StudyPlan.builder()
                .userId(userId)
                .goal(StudyGoal.exam)
                .level(Level.B1)
                .minutesPerDay(90)
                .wordsPerDay(15)
                .interests(List.of("General"))
                .build();
        studyPlanRepository.save(plan);

        createDefaultTasks(plan);

        return studyPlanRepository.findByUserIdAndLanguage(userId, language)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found after creation"));
    }

    private void createDefaultTasks(StudyPlan plan) {
        var today = LocalDate.now().atStartOfDay();

        var tasks = List.of(
                buildTask(plan.getId(), today, TaskType.speaking,
                        "Speaking Room Session", "06:00", "06:30", "/speaking"),
                buildTask(plan.getId(), today, TaskType.vocab,
                        "Learn 15 New Words", "12:00", "12:20", "/notebook"),
                buildTask(plan.getId(), today, TaskType.grammar,
                        "Grammar Quiz: Past Tense", "20:00", "20:30", "/quizzes")
        );
        studyTaskRepository.saveAll(tasks);
    }

    private void generateWeeklyTasks(StudyPlan plan) {
        var today = LocalDate.now().atStartOfDay();
        var tasks = new ArrayList<StudyTask>();

        for (int i = 0; i < 7; i++) {
            var date = today.plusDays(i);
            int day = i + 1;

            tasks.add(buildTask(plan.getId(), date, TaskType.vocab,
                    "Vocabulary Day " + day, "07:00", "07:30", "/notebook"));
            tasks.add(buildTask(plan.getId(), date, TaskType.speaking,
                    "Speaking Practice Day " + day, "13:00", "13:45", "/speaking"));
            tasks.add(buildTask(plan.getId(), date, TaskType.grammar,
                    "Grammar Focus Day " + day, "20:00", "20:30", "/quizzes"));
        }

        studyTaskRepository.saveAll(tasks);
    }

    private StudyTask buildTask(String planId, LocalDateTime date, TaskType type,
                                String title, String startTime, String endTime, String link) {
        return StudyTask.builder()
                .planId(planId)
                .date(date)
                .type(type)
                .title(title)
                .startTime(startTime)
                .endTime(endTime)
                .link(link)
                .completed(false)
                .build();
    }

    private int calculateMinutes(List<StudyTask> tasks) {
        return tasks.stream()
                .mapToInt(task -> {
                    if (task.getStartTime() == null || task.getEndTime() == null) {
                        return 20; // Default 20 mins
                    }
                    var start = LocalTime.parse(task.getStartTime());
                    var end = LocalTime.parse(task.getEndTime());
                    return (int) java.time.Duration.between(start, end).toMinutes();
                })
                .sum();
    }

    private String formatHours(int minutes) {
        return String.format("%.1f", minutes / 60.0);
    }

    private StudyPlanResponse toPlanResponse(StudyPlan plan) {
        var taskResponses = plan.getTasks() != null
                ? plan.getTasks().stream().map(this::toTaskResponse).toList()
                : List.<StudyTaskResponse>of();

        return new StudyPlanResponse(
                plan.getId(),
                plan.getUserId(),
                plan.getGoal(),
                plan.getLevel(),
                plan.getMinutesPerDay(),
                plan.getWordsPerDay(),
                plan.getInterests(),
                plan.getExamDate(),
                plan.getCreatedAt(),
                taskResponses
        );
    }

    private StudyTaskResponse toTaskResponse(StudyTask task) {
        return new StudyTaskResponse(
                task.getId(),
                task.getPlanId(),
                task.getDate(),
                task.getType(),
                task.isCompleted(),
                task.getTitle(),
                task.getStartTime(),
                task.getEndTime(),
                task.getLink()
        );
    }
}
