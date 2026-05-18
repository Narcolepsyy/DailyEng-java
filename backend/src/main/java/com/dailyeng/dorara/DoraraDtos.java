package com.dailyeng.dorara;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Nơi chứa các cấu trúc dữ liệu giao tiếp với Frontend.
 */
public final class DoraraDtos {

    public record ChatMessage(
            @Size(max = 50) String role,
            @Size(max = 5000) String content
    ) {}

    // Dữ liệu nhận từ Frontend chứa Lịch sử Chat và Lời nhắn mới
    public record ChatRequest(
            @Valid List<ChatMessage> messages,
            @Size(max = 5000) String userMessage,
            @Size(max = 200) String currentPage,
            @Size(max = 50) String targetLanguage
    ) {}

    // ── Rich UI Enrichment (Post-Streaming) ───────────────────────────────

    // Request: Frontend gửi lên nội dung AI vừa trả lời để phân tích
    public record EnrichRequest(
            @Size(max = 20000) String aiResponse,      // Full text AI vừa stream xong
            @Size(max = 5000) String userMessage,     // Câu hỏi ban đầu của user
            @Size(max = 50) String targetLanguage   // "en" | "ja" etc.
    ) {}

    // Vocab highlight từng từ
    public record VocabHighlight(
            String word,
            String phonetic,
            String meaning,
            String example
    ) {}

    // Câu hỏi Quiz trắc nghiệm
    public record QuizQuestion(
            String question,
            List<String> options,
            int correctIndex,
            String explanation
    ) {}

    // Response trả về cho Frontend
    public record EnrichResponse(
            List<VocabHighlight> vocabHighlights,
            QuizQuestion quizQuestion
    ) {}
}
