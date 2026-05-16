package com.dailyeng.studyplan;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudyTaskRepository extends JpaRepository<StudyTask, String> {
    List<StudyTask> findByPlanIdAndDateBetween(String planId, LocalDateTime start, LocalDateTime end);
    List<StudyTask> findByPlanIdAndDateBetweenAndCompletedTrue(String planId, LocalDateTime start, LocalDateTime end);
    List<StudyTask> findByPlanIdOrderByDateAsc(String planId);
    Optional<StudyTask> findByIdAndPlanUserId(String id, String userId);
}
