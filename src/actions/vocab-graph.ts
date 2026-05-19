/**
 * Vocab Graph API client — calls Spring Boot NotebookController.
 *
 * Builds the knowledge graph client-side from notebook items and vocab items
 * fetched via the API. Replaces the old Prisma-based server action.
 */

import { apiClient } from "@/lib/api-client";

// ─── Types ─────────────────────────────────────────

export interface GraphNode {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  vietnameseMeaning: string;
  partOfSpeech: string;
  notebookId: string;
  notebookName: string;
  notebookColor: string;
  level: string;
  masteryLevel: number;
  nextReview: string | null;
  lastReviewed: string | null;
  synonyms: string[];
  antonyms: string[];
  exampleSentence: string;
  exampleTranslation: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "synonym" | "antonym" | "same-notebook";
}

export interface VocabGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  notebooks: { id: string; name: string; color: string }[];
  stats: {
    totalWords: number;
    mastered: number;
    learning: number;
    unseen: number;
    dueForReview: number;
  };
}

interface NotebookItem {
  id: string;
  word: string;
  pronunciation: string | null;
  meaning: string[];
  vietnamese: string[];
  partOfSpeech: string | null;
  level: string | null;
  notebookId: string;
  notebookName: string;
  notebookColor: string;
  masteryLevel: number;
  nextReview: string | null;
  lastReviewed: string | null;
}

interface Notebook {
  id: string;
  name: string;
  color: string;
}

interface VocabItemLookup {
  word: string;
  synonyms: string[];
  antonyms: string[];
  exampleSentence: string;
  exampleTranslation: string;
}

const NOTEBOOK_COLORS = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "info",
] as const;

const EMPTY_RESULT: VocabGraphData = {
  nodes: [],
  edges: [],
  notebooks: [],
  stats: {
    totalWords: 0,
    mastered: 0,
    learning: 0,
    unseen: 0,
    dueForReview: 0,
  },
};

// ─── Main Action ────────────────────────────

export async function getVocabGraphData(options?: {
  notebookId?: string;
  limit?: number;
}): Promise<VocabGraphData> {
  try {
    // Fetch notebooks and items from Spring Boot API
    const [notebooks, notebookItems] = await Promise.all([
      apiClient.get<Notebook[]>("/notebooks"),
      apiClient.get<NotebookItem[]>(
        `/notebooks/items${options?.notebookId ? `?notebookId=${options.notebookId}` : ""}`
      ),
    ]);

    if (!notebookItems || notebookItems.length === 0) return EMPTY_RESULT;

    const limit = options?.limit || 200;
    const items = notebookItems.slice(0, limit);

    // Fetch vocab items for synonym/antonym data
    const words = items.map((i) => i.word);
    let vocabLookup = new Map<
      string,
      {
        synonyms: string[];
        antonyms: string[];
        exampleSentence: string;
        exampleTranslation: string;
      }
    >();

    try {
      const vocabItems = await apiClient.post<VocabItemLookup[]>(
        "/vocab/lookup",
        { words }
      );
      for (const v of vocabItems) {
        vocabLookup.set(v.word.toLowerCase(), {
          synonyms: v.synonyms || [],
          antonyms: v.antonyms || [],
          exampleSentence: v.exampleSentence || "",
          exampleTranslation: v.exampleTranslation || "",
        });
      }
    } catch {
      // If vocab lookup endpoint doesn't exist yet, continue without it
    }

    // Build nodes
    const wordToNodeId = new Map<string, string>();
    const nodes: GraphNode[] = items.map((item, idx) => {
      const vocabData = vocabLookup.get(item.word.toLowerCase());
      const notebookIndex = notebooks.findIndex(
        (n) => n.id === item.notebookId
      );
      const notebookColor =
        item.notebookColor ||
        NOTEBOOK_COLORS[Math.max(0, notebookIndex) % NOTEBOOK_COLORS.length];

      wordToNodeId.set(item.word.toLowerCase(), item.id);

      return {
        id: item.id,
        word: item.word,
        pronunciation: item.pronunciation || "",
        meaning: Array.isArray(item.meaning) ? item.meaning.join("; ") : "",
        vietnameseMeaning: Array.isArray(item.vietnamese)
          ? item.vietnamese.join("; ")
          : "",
        partOfSpeech: item.partOfSpeech || "",
        notebookId: item.notebookId,
        notebookName: item.notebookName || "Notebook",
        notebookColor,
        level: item.level || "",
        masteryLevel: item.masteryLevel || 0,
        nextReview: item.nextReview || null,
        lastReviewed: item.lastReviewed || null,
        synonyms: vocabData?.synonyms || [],
        antonyms: vocabData?.antonyms || [],
        exampleSentence: vocabData?.exampleSentence || "",
        exampleTranslation: vocabData?.exampleTranslation || "",
      };
    });

    // Build edges
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    for (const node of nodes) {
      for (const syn of node.synonyms) {
        const targetId = wordToNodeId.get(syn.toLowerCase());
        if (targetId && targetId !== node.id) {
          const edgeKey = [node.id, targetId].sort().join("-");
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              id: `syn-${edgeKey}`,
              source: node.id,
              target: targetId,
              type: "synonym",
            });
          }
        }
      }
      for (const ant of node.antonyms) {
        const targetId = wordToNodeId.get(ant.toLowerCase());
        if (targetId && targetId !== node.id) {
          const edgeKey = [node.id, targetId].sort().join("-");
          if (!edgeSet.has(`ant-${edgeKey}`)) {
            edgeSet.add(`ant-${edgeKey}`);
            edges.push({
              id: `ant-${edgeKey}`,
              source: node.id,
              target: targetId,
              type: "antonym",
            });
          }
        }
      }
    }

    // Same-notebook edges
    const notebookMap = new Map<string, string[]>();
    for (const node of nodes) {
      const existing = notebookMap.get(node.notebookId) || [];
      existing.push(node.id);
      notebookMap.set(node.notebookId, existing);
    }
    for (const [, wordIds] of notebookMap) {
      for (let i = 0; i < wordIds.length; i++) {
        for (let j = i + 1; j < Math.min(i + 3, wordIds.length); j++) {
          const edgeKey = [wordIds[i], wordIds[j]].sort().join("-");
          if (!edgeSet.has(`nb-${edgeKey}`)) {
            edgeSet.add(`nb-${edgeKey}`);
            edges.push({
              id: `nb-${edgeKey}`,
              source: wordIds[i],
              target: wordIds[j],
              type: "same-notebook",
            });
          }
        }
      }
    }

    // Stats
    const now = new Date();

    // ⚡ Bolt: Use a single O(N) loop to compute all stats instead of 4 separate .filter().length traversals
    let mastered = 0;
    let learning = 0;
    let unseen = 0;
    let dueForReview = 0;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.masteryLevel >= 76) {
        mastered++;
      } else if (n.masteryLevel > 0 && n.masteryLevel < 76) {
        learning++;
      } else if (n.masteryLevel === 0) {
        unseen++;
      }

      if (n.nextReview && new Date(n.nextReview) <= now) {
        dueForReview++;
      }
    }

    return {
      nodes,
      edges,
      notebooks: notebooks.map((nb, i) => ({
        id: nb.id,
        name: nb.name,
        color: nb.color || NOTEBOOK_COLORS[i % NOTEBOOK_COLORS.length],
      })),
      stats: {
        totalWords: nodes.length,
        mastered,
        learning,
        unseen,
        dueForReview,
      },
    };
  } catch {
    return EMPTY_RESULT;
  }
}
