package com.dailyeng.notification;

import com.dailyeng.common.web.BaseController;

import com.dailyeng.notification.dto.GetNotificationsOptions;
import com.dailyeng.notification.dto.GetNotificationsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController extends BaseController {

    private final NotificationService notificationService;

    /** GET /api/notifications */
    @GetMapping
    public ResponseEntity<GetNotificationsResponse> getNotifications(
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false, defaultValue = "newest") String sortOrder,
            @RequestParam(required = false, defaultValue = "") String searchQuery
    ) {
        String userId = requireUserId();
        var options = new GetNotificationsOptions(page, limit, sortOrder, searchQuery);
        return ResponseEntity.ok(notificationService.getNotifications(userId, options));
    }

    /** PATCH /api/notifications/{id}/read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Boolean>> markAsRead(@PathVariable String id) {
        String userId = requireUserId();
        boolean success = notificationService.markNotificationAsRead(userId, id);
        return ResponseEntity.ok(Map.of("success", success));
    }

    /** PATCH /api/notifications/read-batch */
    @PatchMapping("/read-batch")
    public ResponseEntity<Map<String, Object>> markBatchAsRead(@RequestBody List<String> notificationIds) {
        String userId = requireUserId();
        int count = notificationService.markNotificationsAsRead(userId, notificationIds);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }

    /** GET /api/notifications/unread-count */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        String userId = requireUserId();
        return ResponseEntity.ok(notificationService.getUnreadNotificationCount(userId));
    }

    /** PATCH /api/notifications/read-all */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        String userId = requireUserId();
        int count = notificationService.markAllNotificationsAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }

    /** POST /api/notifications/test-create — FOR TESTING ONLY */
    @Profile("dev")
    @PostMapping("/test-create")
    public ResponseEntity<?> createTestNotification(@RequestBody Map<String, String> payload) {
        String userId = requireUserId();
        String title = payload.getOrDefault("title", "Test Notification");
        String message = payload.getOrDefault("message", "This is a dummy notification created via Postman!");
        String type = payload.getOrDefault("type", "system");
        return ResponseEntity.ok(notificationService.createTestNotification(userId, title, message, type));
    }
}
