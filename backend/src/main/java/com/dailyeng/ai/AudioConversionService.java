package com.dailyeng.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;

/**
 * Audio format conversion service using ffmpeg.
 * Converts various audio formats (WebM, OGG, etc.) to WAV PCM 16kHz mono
 * for Azure Speech SDK compatibility.
 */
@Slf4j
@Service
public class AudioConversionService {

    private static final int MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB
    private static final long FFMPEG_TIMEOUT_SECONDS = 30L;

    /**
     * Convert any audio format to WAV PCM 16kHz mono via ffmpeg.
     * This ensures Azure STT always gets a format it can decode.
     *
     * Safeguards:
     * - Rejects uploads larger than 20 MB
     * - Enforces a 30-second timeout on ffmpeg
     * - Provides a clear error when ffmpeg is not installed
     */
    public byte[] convertToWav(byte[] inputAudio) throws IOException, InterruptedException {
        if (inputAudio == null || inputAudio.length == 0) {
            throw new IOException("Input audio is empty.");
        }
        if (inputAudio.length > MAX_AUDIO_BYTES) {
            throw new IOException("Input audio is too large; maximum supported size is 20 MB.");
        }

        // Write input to temp file
        var inputFile = File.createTempFile("stt_input_", ".audio");
        var outputFile = File.createTempFile("stt_output_", ".wav");
        try {
            Files.write(inputFile.toPath(), inputAudio);

            // Handle VS Code stale PATH issue by checking absolute path or falling back to "ffmpeg"
            String ffmpegCmd = "ffmpeg";
            File localFfmpeg = new File("C:\\Users\\MaiVu\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe");
            if (localFfmpeg.exists()) {
                ffmpegCmd = localFfmpeg.getAbsolutePath();
            }

            Process process;
            try {
                process = new ProcessBuilder(
                        ffmpegCmd, "-y",
                        "-i", inputFile.getAbsolutePath(),
                        "-ar", "16000",     // 16kHz sample rate
                        "-ac", "1",         // mono
                        "-f", "wav",        // WAV format
                        outputFile.getAbsolutePath()
                )
                        .redirectErrorStream(true)
                        .start();
            } catch (IOException e) {
                throw new IOException(
                        "Failed to execute ffmpeg. Ensure ffmpeg is installed and available on the system PATH.", e);
            }

            // Read ffmpeg output for debugging
            var ffmpegOutput = new String(process.getInputStream().readAllBytes());

            // Enforce timeout to avoid hanging conversions
            boolean finished = process.waitFor(FFMPEG_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("ffmpeg conversion timed out after " + FFMPEG_TIMEOUT_SECONDS + " seconds.");
            }

            var exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("🎤 ffmpeg failed (exit {}): {}", exitCode, ffmpegOutput);
                throw new IOException("ffmpeg conversion failed with exit code " + exitCode);
            }

            return Files.readAllBytes(outputFile.toPath());
        } finally {
            inputFile.delete();
            outputFile.delete();
        }
    }

    /**
     * Asynchronous audio conversion using virtual-thread-backed executor.
     * Offloads CPU-intensive FFmpeg conversion from HTTP request threads.
     */
    @Async("audioProcessingExecutor")
    public CompletableFuture<byte[]> convertToWavAsync(byte[] audioBytes) {
        log.info("🎵 Async audio conversion started (size: {} bytes)", audioBytes.length);
        try {
            byte[] result = convertToWav(audioBytes);
            return CompletableFuture.completedFuture(result);
        } catch (IOException | InterruptedException e) {
            log.error("🎵 Async audio conversion failed: {}", e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
