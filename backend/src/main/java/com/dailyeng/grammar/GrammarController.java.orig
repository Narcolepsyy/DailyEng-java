package com.dailyeng.grammar;

import com.dailyeng.common.web.BaseController;

import com.dailyeng.grammar.GrammarDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the Grammar module — 5 endpoints.
 * Maps from grammar.ts Server Actions to REST API.
 */
@RestController
@RequestMapping("/grammar")
@RequiredArgsConstructor
public class GrammarController extends BaseController {

    private final GrammarService grammarService;

    // ======================== Topic Groups ========================

    /** GET /grammar/topic-groups — getGrammarTopicGroups() */
    @GetMapping("/topic-groups")
    public ResponseEntity<List<TopicGroupResponse>> getTopicGroups(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language) {
        return ResponseEntity.ok(grammarService.getTopicGroups(language));
    }

    // ======================== Topics ========================

    /** GET /grammar/topics — getGrammarTopicsWithProgress() */
    @GetMapping("/topics")
    public ResponseEntity<GrammarTopicListResponse> getTopics(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(required = false) List<String> levels,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int limit) {
        var userId = extractUserId();
        return ResponseEntity.ok(
                grammarService.getTopicsWithProgress(userId, language, category, subcategory, levels, page, limit));
    }

    @GetMapping("/topics/search")
    public ResponseEntity<List<GrammarTopicListItem>> searchTopics(
            @RequestHeader(value = "X-Learning-Language", defaultValue = "en") String language,
            @RequestParam String q) {
        return ResponseEntity.ok(grammarService.searchTopics(q, language));
    }

    /** GET /grammar/topics/{topicId} — getGrammarTopicById() */
    @GetMapping("/topics/{topicId}")
    public ResponseEntity<GrammarTopicDetailResponse> getTopicById(@PathVariable String topicId) {
        var result = grammarService.getTopicById(topicId);
        return result != null
                ? ResponseEntity.ok(result)
                : ResponseEntity.notFound().build();
    }

    // ======================== Current Topic ========================

    /** GET /grammar/current — getCurrentGrammarTopic() */
    @GetMapping("/current")
    public ResponseEntity<CurrentGrammarTopicResponse> getCurrentTopic() {
        var userId = requireUserId();
        var result = grammarService.getCurrentTopic(userId);
        return result != null
                ? ResponseEntity.ok(result)
                : ResponseEntity.noContent().build();
    }
}
