package com.dailyeng.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, String> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId " +
            "AND (:searchQuery IS NULL OR :searchQuery = '' OR " +
            "LOWER(n.title) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR " +
            "LOWER(n.message) LIKE LOWER(CONCAT('%', :searchQuery, '%')))")
    Page<Notification> findByUserIdAndSearchQuery(
            @Param("userId") String userId,
            @Param("searchQuery") String searchQuery,
            Pageable pageable);

    long countByUserIdAndIsReadFalse(String userId);

    List<Notification> findByUserIdAndIsReadFalse(String userId);

    Optional<Notification> findByIdAndUserId(String id, String userId);

    List<Notification> findByIdInAndUserId(List<String> ids, String userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Notification n WHERE n.title = :title")
    void deleteByTitle(@Param("title") String title);
}
