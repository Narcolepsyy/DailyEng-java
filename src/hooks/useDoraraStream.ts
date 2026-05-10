"use client";

import { useRef, useState, useCallback } from "react";
import { getStreamConfig, fetchEnrichment, DoraraChatMessage } from "@/actions/dorara";

interface StreamState {
  streamedText: string;
  isStreaming: boolean;
}

interface ParsedStructuredResponse {
  response: string;
  suggestedActions?: string[];
  vocabHighlights?: Array<any>;
  quizQuestion?: any | null;
}

/**
 * Detect if the user's message is about language learning (vocab, grammar, translation, etc.)
 * vs. asking about website navigation/features.
 * Returns true → call enrich API. Returns false → skip enrich.
 */
function isLanguageLearningIntent(userMessage: string): boolean {
  const msg = userMessage.toLowerCase().trim();

  // Keywords that signal website/navigation questions — skip enrich
  const navigationKeywords = [
    "trang web", "website", "dailyeng", "chức năng", "tính năng",
    "hướng dẫn", "cách dùng", "cách sử dụng", "làm thế nào để",
    "mục nào", "vào đâu", "ở đâu", "trang nào", "tab nào",
    "speaking room", "vocabulary hub", "grammar hub", "notebook",
    "study plan", "lộ trình", "smartlens", "smart lens",
    "how to use", "how do i", "where is", "what is this",
    "what does this", "feature", "navigation",
  ];

  if (navigationKeywords.some((kw) => msg.includes(kw))) {
    return false;
  }

  // If message is very short generic greeting — skip enrich
  if (msg.split(" ").length <= 3 && !/\b(word|từ|nghĩa|grammar|ngữ pháp|pronounce|phát âm|translate|dịch)\b/.test(msg)) {
    return false;
  }

  return true;
}

export function useDoraraStream() {
  const [state, setState] = useState<StreamState>({
    streamedText: "",
    isStreaming: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const streamMessage = useCallback(
    async (
      messages: DoraraChatMessage[],
      userMessage: string,
      currentPage: string,
      learningLanguage: string = "en"
    ): Promise<ParsedStructuredResponse> => {
      // Abort any existing stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ streamedText: "", isStreaming: true });

      const { apiBase, token } = await getStreamConfig();
      // BƯỚC 3: Đi thẳng cấu trúc API không qua Proxy JSON lằng nhằng
      const url = `${apiBase}/dorara/chat`;

      // API Java mới siêu dễ dãi, chỉ nhận đúng nội dung bạn gõ
      const body = JSON.stringify({
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
        userMessage,
        currentPage,
        targetLanguage: learningLanguage
      });

      let rawAccumulator = "";

      try {
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Stream request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No readable stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.startsWith("data:")) {
              // Bỏ đúng chữ "data:" và TỐI ĐA 1 dấu cách đi theo sau nó (Chuẩn SSE). Đoạn đuôi không được Trim để giữ nguyên Dấu Cách của câu rớt lửng chữ!
              let data = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
              
              if (data.trim() === "[DONE]") {
                setState((prev) => ({ ...prev, isStreaming: false }));
                return { response: rawAccumulator };
              }

              // BƯỚC 4: Ráp trực tiếp dữ liệu thô (đã vứt bỏ JSON Parsing)
              let chunkText = data;
              // Xử lý các dấu xuống dòng nguyên thủy do Backend gởi sang
              chunkText = chunkText.replace(/\\n/g, "\n");
              
              rawAccumulator += chunkText;
              
              setState({ streamedText: rawAccumulator, isStreaming: true });
            }
          }
        }

        setState((prev) => ({ ...prev, isStreaming: false }));

        // 'Chia để trị' — gọi API thứ 2 sau khi Stream hoàn tất để lấy Vocab Cards + Quiz
        // Chỉ gọi enrich khi câu hỏi liên quan đến học ngôn ngữ, không phải hướng dẫn web
        if (isLanguageLearningIntent(userMessage)) {
          const enrichment = await fetchEnrichment(rawAccumulator, userMessage, learningLanguage);
          return {
            response: rawAccumulator,
            vocabHighlights: enrichment.vocabHighlights,
            quizQuestion: enrichment.quizQuestion,
          };
        }

        return { response: rawAccumulator };
      } catch (error: any) {
        if (error.name === "AbortError") {
          setState((prev) => ({ ...prev, isStreaming: false }));
          return { response: rawAccumulator };
        }
        console.error("[useDoraraStream] Error:", error);
        setState({ streamedText: "", isStreaming: false });
        // Trả về câu thông báo lỗi thân thiện thay vì sập app
        return {
          response: "Xin lỗi, đường ống kết nối mạng hiện đang gặp trục trặc... 😿",
        };
      }
    },
    []
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return {
    streamedText: state.streamedText,
    isStreaming: state.isStreaming,
    streamMessage,
    cancelStream,
  };
}
