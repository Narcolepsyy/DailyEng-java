package com.dailyeng.studyplan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudyTaskRepository extends JpaRepository<StudyTask, String> {
    List<StudyTask> findByPlanIdAndDateBetween(String planId, LocalDateTime start, LocalDateTime end);
    List<StudyTask> findByPlanIdAndDateBetweenAndCompletedTrue(String planId, LocalDateTime start, LocalDateTime end);
    List<StudyTask> findByPlanIdOrderByDateAsc(String planId);

    @Query("SELECT t FROM StudyTask t JOIN t.plan p WHERE t.id = :id AND p.userId = :userId")
    Optional<StudyTask> findByIdAndUserId(@Param("id") String id, @Param("userId") String userId);
}
