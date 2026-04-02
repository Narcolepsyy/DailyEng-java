package com.dailyeng.content;

import com.dailyeng.ai.AzureTranslatorService;
import com.dailyeng.ai.AzureTranslatorService.TranslationResult;
import com.dailyeng.ai.AzureVisionService;
import com.dailyeng.ai.AzureVisionService.OcrResult;
import com.dailyeng.ai.AzureVisionService.TextBlock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * SmartLens controller — OCR + Translation pipeline for images.
 * Upload an image → extract text via Azure Vision → translate via Azure Translator.
 * Text is grouped by paragraph (Azure block) so that split words are translated correctly.
 */
@Slf4j
@RestController
@RequestMapping("/smartlens")
@RequiredArgsConstructor
public class SmartLensController {

    private final AzureVisionService visionService;
    private final AzureTranslatorService translatorService;

    private static final long MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

    /**
     * Analyze an image: extract text and translate it.
     *
     * @param image  the uploaded image file (JPEG, PNG, BMP, GIF, TIFF)
     * @param to     target language code (en, ja, vi)
     * @return extracted + translated text blocks (paragraph-level)
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "to", defaultValue = "en") String to) {

        if (image.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image file is required"));
        }
        if (image.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Image exceeds maximum size of 4MB"));
        }

        // 🛡️ Sentinel: Prevent Memory Exhaustion / DoS from massive language codes
        if (to != null && to.length() > 50) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Target language code exceeds maximum length of 50 characters"));
        }

        try {
            // Step 1: OCR — extract text from image
            byte[] imageData = image.getBytes();
            OcrResult ocrResult = visionService.extractText(imageData);

            if (ocrResult.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "lines", List.of(),
                        "fullText", "",
                        "translatedFullText", "",
                        "message", "No text detected in the image"));
            }

            // Step 2: Translate the full text (for copy-to-clipboard)
            String fullText = ocrResult.fullText();
            TranslationResult fullTranslation = translatorService.translate(fullText, null, to);

            // Step 3: Batch-translate paragraph blocks (lines merged within each Azure block)
            // This ensures words split across visual lines are translated as complete sentences
            var blockTexts = ocrResult.textBlocks().stream()
                    .map(TextBlock::text)
                    .toList();
            var translatedBlockTexts = translatorService.translateBatch(blockTexts, null, to);

            // Step 4: Build response with paragraph-level translations
            var translatedBlocks = new ArrayList<Map<String, Object>>();
            for (int i = 0; i < ocrResult.textBlocks().size(); i++) {
                TextBlock block = ocrResult.textBlocks().get(i);
                String translatedBlock = i < translatedBlockTexts.size() ? translatedBlockTexts.get(i) : "";

                var blockMap = Map.<String, Object>of(
                        "original", block.text(),
                        "translated", translatedBlock,
                        "lineCount", block.lineCount(),
                        "boundingPolygon", block.boundingPolygon().stream()
                                .map(p -> Map.of("x", p[0], "y", p[1]))
                                .toList()
                );
                translatedBlocks.add(blockMap);
            }

            log.info("🔍 SmartLens: {} blocks extracted and translated to '{}'",
                    translatedBlocks.size(), to);

            return ResponseEntity.ok(Map.of(
                    "lines", translatedBlocks,
                    "fullText", fullText,
                    "translatedFullText", fullTranslation.translatedText(),
                    "detectedLanguage", fullTranslation.detectedLanguage() != null
                            ? fullTranslation.detectedLanguage() : "",
                    "targetLanguage", to
            ));

        } catch (Exception e) {
            log.error("SmartLens analysis error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to analyze image"));
        }
    }
}
