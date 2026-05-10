/**
 * Grammar module API client — calls Spring Boot GrammarController.
 *
 * Endpoints:
 *   GET /grammar/topic-groups            → getGrammarTopicGroups()
 *   GET /grammar/topics                  → getGrammarTopicsWithProgress()
 *   GET /grammar/topics/search?q=        → searchGrammarTopics()
 *   GET /grammar/topics/{topicId}        → getGrammarTopicById()
 *   GET /grammar/current                 → getCurrentGrammarTopic()
 */

import { apiClient } from "@/lib/api-client";

// ======================== Types ========================

interface TopicGroup {
  id: string;
  name: string;
  order: number;
  hubType: string;
  subcategories: string[];
}

interface GrammarTopic {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: string;
  wordCount: number;
  estimatedTime: number;
  thumbnail: string | null;
  category: string | null;
  subcategory: string | null;
  order: number;
  progress?: number;
}

interface GrammarTopicListResponse {
  topics: GrammarTopic[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface GrammarNote {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string;
  order: number;
}

interface GrammarTopicDetail {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: string;
  grammarNotes: GrammarNote[];
  lessons: Lesson[];
  quizItems: any[];
}

interface CurrentGrammarTopic {
  id: string;
  title: string;
  subtitle: string | null;
}

// ======================== Actions ========================

/**
 * Fetch all grammar topic groups.
 */
export async function getGrammarTopicGroups(): Promise<TopicGroup[]> {
  return apiClient.get<TopicGroup[]>("/grammar/topic-groups");
}

/**
 * Fetch grammar topics with optional filters and pagination.
 */
export async function getGrammarTopicsWithProgress(
  _userId?: string,
  options?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    levels?: string[];
  }
): Promise<GrammarTopicListResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", String(options.page));
  if (options?.limit) params.append("limit", String(options.limit));
  if (options?.category) params.append("category", options.category);
  if (options?.subcategory && options.subcategory !== "All") {
    params.append("subcategory", options.subcategory);
  }
  if (options?.levels?.length) {
    for (const level of options.levels) {
      params.append("levels", level);
    }
  }
  const qs = params.toString();
  return apiClient.get<GrammarTopicListResponse>(
    `/grammar/topics${qs ? `?${qs}` : ""}`
  );
}

/**
 * Fetch a single grammar topic by ID with notes and lessons.
 */
export async function getGrammarTopicById(
  topicId: string
): Promise<GrammarTopicDetail | null> {
  try {
    return await apiClient.get<GrammarTopicDetail>(
      `/grammar/topics/${topicId}`
    );
  } catch {
    return null;
  }
}

/**
 * Get the current grammar topic for a user (based on their progress).
 */
export async function getCurrentGrammarTopic(
  _userId: string
): Promise<CurrentGrammarTopic | null> {
  try {
    return await apiClient.get<CurrentGrammarTopic>("/grammar/current");
  } catch {
    return null;
  }
}
