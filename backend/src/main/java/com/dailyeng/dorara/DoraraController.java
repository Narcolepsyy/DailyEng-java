package com.dailyeng.dorara;

import com.dailyeng.ai.GeminiService;
import com.dailyeng.dorara.DoraraDtos.ChatRequest;
import com.dailyeng.dorara.DoraraDtos.EnrichRequest;
import com.dailyeng.dorara.DoraraDtos.EnrichResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Controller
 */
@RestController
@RequestMapping("/dorara")
@RequiredArgsConstructor
public class DoraraController {

    private final DoraraService doraraService;
    private final GeminiService geminiService;

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@Valid @RequestBody ChatRequest request) {

        SseEmitter emitter = new SseEmitter(120_000L);

        Thread.startVirtualThread(() -> {
            try {
                doraraService.chatWithDoraraStream(request, chunk -> {
                    try {
                        String safeChunk = chunk.replace("\n", "\\n");
                        emitter.send(safeChunk);
                    } catch (Exception e) {
                        emitter.completeWithError(e);
                    }
                });

                emitter.complete();

            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * POST /dorara/enrich
     * Called by the frontend AFTER the chat stream completes.
     * Analyzes the AI response text and returns vocab highlights + a quiz question.
     */
    @PostMapping("/enrich")
    public ResponseEntity<EnrichResponse> enrich(@Valid @RequestBody EnrichRequest request) {
        var result = geminiService.generateDoraraEnrich(
                request.aiResponse(),
                request.userMessage(),
                request.targetLanguage()
        );
        return ResponseEntity.ok(result);
    }
}

