package com.dailyeng.studyplan;

import com.dailyeng.studyplan.StudyDtos.*;
import com.dailyeng.user.ProfileStats;
import com.dailyeng.common.enums.Level;
import com.dailyeng.common.enums.StudyGoal;
import com.dailyeng.common.enums.TaskType;
import com.dailyeng.common.exception.ResourceNotFoundException;
import com.dailyeng.user.ProfileStatsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyPlanServiceTest {

    @Mock private StudyPlanRepository studyPlanRepository;
    @Mock private StudyTaskRepository studyTaskRepository;
    @Mock private ProfileStatsRepository profileStatsRepository;

    @InjectMocks private StudyPlanService studyPlanService;

    private static final String USER_ID = "user-123";
    private static final String PLAN_ID = "plan-456";
    private static final String TASK_ID = "task-789";

    private StudyPlan createTestPlan() {
        var plan = StudyPlan.builder()
                .userId(USER_ID)
                .goal(StudyGoal.exam)
                .level(Level.B1)
                .minutesPerDay(90)
                .wordsPerDay(15)
                .interests(List.of("General"))
                .tasks(new ArrayList<>())
                .build();
        plan.setId(PLAN_ID);
        return plan;
    }

    private StudyTask createTestTask(String id, TaskType type, String title, boolean completed) {
        var task = StudyTask.builder()
                .planId(PLAN_ID)
                .date(LocalDateTime.now().toLocalDate().atStartOfDay())
                .type(type)
                .title(title)
                .startTime("07:00")
                .endTime("07:30")
                .link("/notebook")
                .completed(completed)
                .build();
        task.setId(id);
        return task;
    }

    // ========================================================================
    // getStudyPlan
    // ========================================================================

    @Nested
    @DisplayName("getStudyPlan")
    class GetStudyPlan {

        @Test
        @DisplayName("returns existing plan")
        void existingPlan() {
            var plan = createTestPlan();
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en")).thenReturn(Optional.of(plan));

            var result = studyPlanService.getStudyPlan(USER_ID, "en");

            assertEquals(PLAN_ID, result.id());
            assertEquals(USER_ID, result.userId());
            assertEquals(StudyGoal.exam, result.goal());
            assertEquals(Level.B1, result.level());
            assertEquals(90, result.minutesPerDay());
        }

        @Test
        @DisplayName("creates default plan when none exists")
        void createsDefaultPlan() {
            var defaultPlan = createTestPlan();

            // First call: no plan exists; second call: after save
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en"))
                    .thenReturn(Optional.empty())
                    .thenReturn(Optional.of(defaultPlan));
            when(studyPlanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = studyPlanService.getStudyPlan(USER_ID, "en");

            assertNotNull(result);
            verify(studyPlanRepository).save(any(StudyPlan.class));
            verify(studyTaskRepository).saveAll(anyList());
        }
    }

    // ========================================================================
    // createNewPlan
    // ========================================================================

    @Nested
    @DisplayName("createNewPlan")
    class CreateNewPlan {

        @Test
        @DisplayName("creates plan with 21 tasks for 7 days")
        void createsWeekOfTasks() {
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en"))
                    .thenReturn(Optional.empty())   // no existing plan to delete
                    .thenReturn(Optional.of(createTestPlan())); // refetch after creation
            when(studyPlanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var request = new CreatePlanRequest(
                    StudyGoal.exam, Level.B2, 10, List.of("Travel", "Business")
            );
            var result = studyPlanService.createNewPlan(USER_ID, "en", request);

            assertNotNull(result);
            verify(studyPlanRepository).save(any(StudyPlan.class));
            verify(studyTaskRepository).saveAll(argThat(tasks ->
                    ((List<?>) tasks).size() == 21
            ));
        }

        @Test
        @DisplayName("deletes existing plan before creating new one")
        void deletesExistingPlan() {
            var existingPlan = createTestPlan();
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en"))
                    .thenReturn(Optional.of(existingPlan))  // existing plan found
                    .thenReturn(Optional.of(createTestPlan())); // refetch
            when(studyPlanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var request = new CreatePlanRequest(
                    StudyGoal.fluent, Level.C1, 14, List.of("General")
            );
            studyPlanService.createNewPlan(USER_ID, "en", request);

            verify(studyPlanRepository).delete(existingPlan);
        }

        @Test
        @DisplayName("computes minutesPerDay from hoursPerWeek")
        void computesMinutesPerDay() {
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en"))
                    .thenReturn(Optional.empty())
                    .thenReturn(Optional.of(createTestPlan()));
            when(studyPlanRepository.save(any())).thenAnswer(i -> {
                StudyPlan plan = i.getArgument(0);
                assertEquals(86, plan.getMinutesPerDay()); // 10 * 60 / 7 = 85.7 -> 86
                return plan;
            });

            var request = new CreatePlanRequest(
                    StudyGoal.exam, Level.B1, 10, List.of("General")
            );
            studyPlanService.createNewPlan(USER_ID, "en", request);
        }
    }

    // ========================================================================
    // getTodayTasks
    // ========================================================================

    @Nested
    @DisplayName("getTodayTasks")
    class GetTodayTasks {

        @Test
        @DisplayName("returns empty list when no plan exists")
        void noPlan() {
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en")).thenReturn(Optional.empty());

            var result = studyPlanService.getTodayTasks(USER_ID, "en");

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("returns today's tasks")
        void withTasks() {
            var plan = createTestPlan();
            var task = createTestTask(TASK_ID, TaskType.vocab, "Learn Words", false);

            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en")).thenReturn(Optional.of(plan));
            when(studyTaskRepository.findByPlanIdAndDateBetween(eq(PLAN_ID), any(), any()))
                    .thenReturn(List.of(task));

            var result = studyPlanService.getTodayTasks(USER_ID, "en");

            assertEquals(1, result.size());
            assertEquals("Learn Words", result.get(0).title());
        }
    }

    // ========================================================================
    // toggleTaskCompletion
    // ========================================================================

    @Nested
    @DisplayName("toggleTaskCompletion")
    class ToggleTaskCompletion {

        @Test
        @DisplayName("toggles task completion")
        void toggle() {
            var task = createTestTask(TASK_ID, TaskType.vocab, "Learn Words", false);
            when(studyTaskRepository.findByIdAndUserId(TASK_ID, USER_ID)).thenReturn(Optional.of(task));
            when(studyTaskRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = studyPlanService.toggleTaskCompletion(USER_ID, TASK_ID, new ToggleTaskRequest(true));

            assertTrue(result.completed());
            verify(studyTaskRepository).save(task);
        }

        @Test
        @DisplayName("throws when task not found")
        void notFound() {
            when(studyTaskRepository.findByIdAndUserId(TASK_ID, USER_ID)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> studyPlanService.toggleTaskCompletion(USER_ID, TASK_ID, new ToggleTaskRequest(true)));
        }
    }

    // ========================================================================
    // updateTaskTime
    // ========================================================================

    @Nested
    @DisplayName("updateTaskTime")
    class UpdateTaskTime {

        @Test
        @DisplayName("updates task time")
        void updateTime() {
            var task = createTestTask(TASK_ID, TaskType.vocab, "Learn Words", false);
            when(studyTaskRepository.findByIdAndUserId(TASK_ID, USER_ID)).thenReturn(Optional.of(task));
            when(studyTaskRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = studyPlanService.updateTaskTime(USER_ID, TASK_ID, new UpdateTaskTimeRequest("09:00", "10:00"));

            assertEquals("09:00", result.startTime());
            assertEquals("10:00", result.endTime());
            verify(studyTaskRepository).save(task);
        }
    }

    // ========================================================================
    // updateStudyGoal
    // ========================================================================

    @Nested
    @DisplayName("updateStudyGoal")
    class UpdateStudyGoal {

        @Test
        @DisplayName("updates goal, level, and minutesPerDay")
        void updatesGoal() {
            var plan = createTestPlan();
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en")).thenReturn(Optional.of(plan));
            when(studyPlanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var request = new UpdateGoalRequest(StudyGoal.fluent, Level.C2, 21);
            var result = studyPlanService.updateStudyGoal(USER_ID, "en", request);

            assertEquals(StudyGoal.fluent, result.goal());
            assertEquals(Level.C2, result.level());
            assertEquals(180, result.minutesPerDay()); // 21 * 60 / 7 = 180
        }
    }

    // ========================================================================
    // getStudyStats
    // ========================================================================

    @Nested
    @DisplayName("getStudyStats")
    class GetStudyStats {

        @Test
        @DisplayName("returns zeroes when no plan exists")
        void noPlan() {
            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en")).thenReturn(Optional.empty());

            var result = studyPlanService.getStudyStats(USER_ID, "en");

            assertEquals("0.0", result.dailyHours());
            assertEquals("0.0", result.weeklyHours());
            assertEquals("0.0", result.totalHours());
        }

        @Test
        @DisplayName("aggregates completed task minutes")
        void withCompletedTasks() {
            var plan = createTestPlan();
            var task = createTestTask(TASK_ID, TaskType.vocab, "Learn Words", true);

            when(studyPlanRepository.findByUserIdAndLanguage(USER_ID, "en")).thenReturn(Optional.of(plan));
            when(studyTaskRepository.findByPlanIdAndDateBetweenAndCompletedTrue(eq(PLAN_ID), any(), any()))
                    .thenReturn(List.of(task));
            when(profileStatsRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(ProfileStats.builder()
                            .userId(USER_ID)
                            .totalLearningMinutes(120)
                            .build()));

            var result = studyPlanService.getStudyStats(USER_ID, "en");

            assertEquals("0.5", result.dailyHours());  // 30 mins = 0.5h
            assertEquals("0.5", result.weeklyHours());  // same task
            assertEquals("2.5", result.totalHours());   // 120 + 30 = 150 mins = 2.5h
        }
    }
}
