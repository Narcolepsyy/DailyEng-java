package com.dailyeng.studyplan;

import com.dailyeng.common.web.BaseController;

import com.dailyeng.studyplan.StudyDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for study plan management.
 */
@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
public class StudyPlanController extends BaseController {

    private final StudyPlanService studyPlanService;

    @GetMapping("/plan")
    public ResponseEntity<StudyPlanResponse> getStudyPlan(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language) {
        return ResponseEntity.ok(studyPlanService.getStudyPlan(requireUserId(), language));
    }

    @PostMapping("/plan")
    public ResponseEntity<StudyPlanResponse> createNewPlan(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language,
            @Valid @RequestBody CreatePlanRequest request
    ) {
        return ResponseEntity.ok(studyPlanService.createNewPlan(requireUserId(), language, request));
    }

    @PutMapping("/plan/goal")
    public ResponseEntity<StudyPlanResponse> updateStudyGoal(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language,
            @Valid @RequestBody UpdateGoalRequest request
    ) {
        return ResponseEntity.ok(studyPlanService.updateStudyGoal(requireUserId(), language, request));
    }

    @PutMapping("/plan/exam-date")
    public ResponseEntity<StudyPlanResponse> updateExamDate(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language,
            @Valid @RequestBody UpdateExamDateRequest request
    ) {
        return ResponseEntity.ok(studyPlanService.updateExamDate(requireUserId(), language, request));
    }

    @GetMapping("/tasks/today")
    public ResponseEntity<List<StudyTaskResponse>> getTodayTasks(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language) {
        return ResponseEntity.ok(studyPlanService.getTodayTasks(requireUserId(), language));
    }

    @PutMapping("/tasks/{taskId}/toggle")
    public ResponseEntity<StudyTaskResponse> toggleTaskCompletion(
            @PathVariable String taskId,
            @Valid @RequestBody ToggleTaskRequest request
    ) {
        return ResponseEntity.ok(studyPlanService.toggleTaskCompletion(requireUserId(), taskId, request));
    }

    @PutMapping("/tasks/{taskId}/time")
    public ResponseEntity<StudyTaskResponse> updateTaskTime(
            @PathVariable String taskId,
            @Valid @RequestBody UpdateTaskTimeRequest request
    ) {
        return ResponseEntity.ok(studyPlanService.updateTaskTime(requireUserId(), taskId, request));
    }

    @GetMapping("/stats")
    public ResponseEntity<StudyStatsResponse> getStudyStats(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language) {
        return ResponseEntity.ok(studyPlanService.getStudyStats(requireUserId(), language));
    }
}
