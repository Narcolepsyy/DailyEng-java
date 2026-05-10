package com.dailyeng.common.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Health Check Controller to prevent Render's free tier from sleeping.
 * Also performs a tiny DB query to keep the database connection pool warm.
 */
@Slf4j
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> checkHealth() {
        try {
            // Keep DB connection alive
            jdbcTemplate.execute("SELECT 1");
            return Map.of(
                "status", "UP",
                "message", "DailyEng Backend is awake and database is connected",
                "timestamp", System.currentTimeMillis()
            );
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage());
            return Map.of(
                "status", "DOWN",
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            );
        }
    }
}
