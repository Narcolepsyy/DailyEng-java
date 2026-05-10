package com.dailyeng.notification;

import com.dailyeng.common.enums.NotificationType;
import com.dailyeng.user.User;
import com.dailyeng.user.UserRepository;
import com.dailyeng.vocabulary.UserVocabProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyReviewNotificationJob {

    private final NotificationRepository notificationRepo;
    private final UserVocabProgressRepository progressRepo;
    private final UserRepository userRepo;

    // Chạy vào 00:00:00 mỗi ngày
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void generateDailyReviewNotifications() {
        log.info("Starting Daily Review Notification Job...");
        
        // 1. Xóa tất cả các thông báo Daily Review cũ để không bị rác
        notificationRepo.deleteByTitle("Daily Review");

        // 2. Lấy danh sách tất cả người dùng
        List<User> users = userRepo.findAll();
        int notificationCount = 0;

        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            // Lấy danh sách các từ vựng đến hạn của user này
            long dueCount = progressRepo.findByUserIdAndNextReviewBefore(user.getId(), now).size();
            
            if (dueCount > 0) {
                Notification notif = Notification.builder()
                        .userId(user.getId())
                        .type(NotificationType.plan)
                        .title("Daily Review")
                        .message("You have " + dueCount + " vocabulary words to review today. Review now!")
                        .isRead(false)
                        .build();
                
                notificationRepo.save(notif);
                notificationCount++;
            }
        }

        log.info("Finished Daily Review Notification Job. Created {} notifications.", notificationCount);
    }
}
