package com.dailyeng.ai;

import com.dailyeng.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Azure AI Vision Service — Image Analysis v4.0 with OCR (Read feature).
 * <p>
 * Synchronous API: sends image bytes, receives extracted text immediately.
 * Endpoint: POST {endpoint}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=read
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AzureVisionService {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private boolean enabled = false;

    @PostConstruct
    void init() {
        var config = appProperties.getAzureVision();
        if (config.getSubscriptionKey() != null && !config.getSubscriptionKey().isBlank()
                && config.getEndpoint() != null && !config.getEndpoint().isBlank()) {
            enabled = true;
            log.info("Azure Vision initialized — endpoint: {}", config.getEndpoint());
        } else {
            log.warn("Azure Vision disabled — AZURE_VISION_KEY or AZURE_VISION_ENDPOINT not set");
        }
    }

    /**
     * Extract text from an image using Azure AI Vision OCR.
     *
     * @param imageData raw image bytes (JPEG, PNG, BMP, GIF, TIFF — max 4MB)
     * @return OcrResult containing extracted text lines
     */
    @CircuitBreaker(name = "azureVision", fallbackMethod = "extractTextFallback")
    @Retry(name = "azureVision")
    public OcrResult extractText(byte[] imageData) {
        if (!enabled) {
            log.warn("Azure Vision not enabled — returning empty result");
            return OcrResult.empty();
        }

        if (imageData == null || imageData.length == 0) {
            return OcrResult.empty();
        }

        // Azure Vision limit: 4MB
        if (imageData.length > 4 * 1024 * 1024) {
            log.warn("Image too large: {} bytes (max 4MB)", imageData.length);
            return OcrResult.empty();
        }

        var config = appProperties.getAzureVision();
        var endpoint = config.getEndpoint().replaceAll("/$", "");
        var url = endpoint + "/computervision/imageanalysis:analyze?api-version=2024-02-01&features=read";

        try {
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Ocp-Apim-Subscription-Key", config.getSubscriptionKey())
                    .header("Content-Type", "application/octet-stream")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(imageData))
                    .build();

            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Azure Vision failed — status: {}, body: {}",
                        response.statusCode(), response.body());
                return OcrResult.empty();
            }

            // Parse response
            var json = objectMapper.readTree(response.body());
            var readResult = json.path("readResult");
            if (readResult.isMissingNode()) {
                log.warn("No readResult in Azure Vision response");
                return OcrResult.empty();
            }

            var blocks = readResult.path("blocks");
            var lines = new ArrayList<TextLine>();
            var textBlocks = new ArrayList<TextBlock>();
            var fullTextBuilder = new StringBuilder();

            if (blocks.isArray()) {
                for (var block : blocks) {
                    var blockLines = block.path("lines");
                    if (blockLines.isArray()) {
                        // Collect lines for this block → merge into a paragraph
                        var blockLineTexts = new ArrayList<String>();
                        double blockMinX = Double.MAX_VALUE, blockMinY = Double.MAX_VALUE;
                        double blockMaxX = Double.MIN_VALUE, blockMaxY = Double.MIN_VALUE;

                        for (var line : blockLines) {
                            var text = line.path("text").asText("");
                            if (!text.isBlank()) {
                                // Extract bounding polygon for individual line
                                var boundingPolygon = new ArrayList<double[]>();
                                var polygonNode = line.path("boundingPolygon");
                                if (polygonNode.isArray()) {
                                    for (var point : polygonNode) {
                                        double px = point.path("x").asDouble(0);
                                        double py = point.path("y").asDouble(0);
                                        boundingPolygon.add(new double[]{px, py});
                                        blockMinX = Math.min(blockMinX, px);
                                        blockMinY = Math.min(blockMinY, py);
                                        blockMaxX = Math.max(blockMaxX, px);
                                        blockMaxY = Math.max(blockMaxY, py);
                                    }
                                }

                                lines.add(new TextLine(text, boundingPolygon));
                                blockLineTexts.add(text);
                                if (!fullTextBuilder.isEmpty()) fullTextBuilder.append("\n");
                                fullTextBuilder.append(text);
                            }
                        }

                        // Create merged paragraph block with combined bounding box
                        if (!blockLineTexts.isEmpty()) {
                            var mergedText = String.join("\n", blockLineTexts);
                            var combinedPolygon = List.of(
                                    new double[]{blockMinX, blockMinY},
                                    new double[]{blockMaxX, blockMinY},
                                    new double[]{blockMaxX, blockMaxY},
                                    new double[]{blockMinX, blockMaxY}
                            );
                            textBlocks.add(new TextBlock(mergedText, combinedPolygon, blockLineTexts.size()));
                        }
                    }
                }
            }

            log.info("🔍 Azure Vision OCR: extracted {} lines ({} blocks) from image ({} bytes)",
                    lines.size(), textBlocks.size(), imageData.length);

            return new OcrResult(lines, textBlocks, fullTextBuilder.toString());

        } catch (Exception e) {
            log.error("Azure Vision error: {}", e.getMessage(), e);
            return OcrResult.empty();
        }
    }

    @SuppressWarnings("unused")
    private OcrResult extractTextFallback(byte[] imageData, Throwable t) {
        log.warn("Azure Vision circuit breaker open — fallback: {}", t.getMessage());
        return OcrResult.empty();
    }

    // ── Result records ──

    public record TextLine(String text, List<double[]> boundingPolygon) {
    }

    /**
     * A merged paragraph block — all OCR lines within a single Azure block joined into one text.
     * The bounding polygon covers the entire block area.
     */
    public record TextBlock(String text, List<double[]> boundingPolygon, int lineCount) {
    }

    public record OcrResult(List<TextLine> lines, List<TextBlock> textBlocks, String fullText) {
        public static OcrResult empty() {
            return new OcrResult(List.of(), List.of(), "");
        }

        public boolean isEmpty() {
            return lines == null || lines.isEmpty();
        }
    }
}
