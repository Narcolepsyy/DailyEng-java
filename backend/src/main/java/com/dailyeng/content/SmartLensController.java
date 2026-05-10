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
                    "error", "Language code exceeds maximum length of 50 characters"));
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

            // Step 3: Batch-translate individual lines to preserve exact coloring and positioning
            // This ensures every visual line gets its own AR overlay box exactly where it was
            var lineTexts = ocrResult.lines().stream()
                    .map(AzureVisionService.TextLine::text)
                    .toList();
            var translatedLineTexts = translatorService.translateBatch(lineTexts, null, to);

            // Step 4: Build response with line-level translations
            var translatedLines = new ArrayList<Map<String, Object>>();
            for (int i = 0; i < ocrResult.lines().size(); i++) {
                AzureVisionService.TextLine line = ocrResult.lines().get(i);
                String translatedLine = i < translatedLineTexts.size() ? translatedLineTexts.get(i) : "";

                var lineMap = Map.<String, Object>of(
                        "original", line.text(),
                        "translated", translatedLine,
                        "lineCount", 1,
                        "boundingPolygon", line.boundingPolygon().stream()
                                .map(p -> Map.of("x", p[0], "y", p[1]))
                                .toList()
                );
                translatedLines.add(lineMap);
            }

            log.info("🔍 SmartLens: {} lines extracted and translated to '{}'",
                    translatedLines.size(), to);

            return ResponseEntity.ok(Map.of(
                    "lines", translatedLines,
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
