"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCustomScenario,
  createRandomScenario,
  createFreeTalkScenario,
  deleteCustomScenario,
  getCustomTopics,
} from "@/actions/speaking";
import type { Scenario } from "./types";

// ─── Hook ──────────────────────────────────────────

interface UseCustomTopicsParams {
  userId: string | undefined;
  effectiveUserId: string;
  activeTab: string;
}

export function useCustomTopics({
  userId,
  effectiveUserId,
  activeTab,
}: UseCustomTopicsParams) {
  const router = useRouter();

  // ── Dialog state ──
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topicPrompt, setTopicPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // ── Generating overlay ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");

  // ── Custom scenarios list ──
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [customScenariosLoading, setCustomScenariosLoading] = useState(false);

  // ── Fetch custom topics when tab is active ──
  useEffect(() => {
    if (!userId || activeTab !== "custom") return;

    setCustomScenariosLoading(true);
    getCustomTopics(userId)
      .then((customTopics) => {
        setCustomScenarios(
          customTopics.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            category: s.category || "Custom",
            level: s.level || "B1",
            image: s.image || "/learning.png",
            sessionsCompleted: 0,
            totalSessions: 10,
            progress: 0,
            isCustom: true,
          }))
        );
      })
      .finally(() => setCustomScenariosLoading(false));
  }, [userId, activeTab]);

  // ── Shared overlay helper ──

  const executeWithOverlay = async (
    action: () => Promise<{ scenario: { id: string }; sessionId: string }>,
    overlayMessage: string,
    errorMessage: string
  ) => {
    setIsGenerating(true);
    setGeneratingMessage(overlayMessage);

    try {
      const result = await action();
      router.push(`/speaking-room/session/${result.scenario.id}`);
    } catch (error) {
      console.error(error);
      toast.error(errorMessage);
      setIsGenerating(false);
    }
  };

  // ── Handlers ──

  const handleCreateScenario = async () => {
    if (!topicPrompt.trim()) return;

    setIsDialogOpen(false);
    await executeWithOverlay(
      () => createCustomScenario(effectiveUserId, topicPrompt),
      "Creating your custom scenario...",
      "Failed to create scenario"
    );
    setTopicPrompt("");
  };

  const handleSurpriseMe = () =>
    executeWithOverlay(
      () => createRandomScenario(effectiveUserId),
      "Generating a surprise scenario...",
      "Failed to generate random scenario"
    );

  const handleFreeTalk = () =>
    executeWithOverlay(
      () => createFreeTalkScenario(effectiveUserId),
      "Starting free conversation...",
      "Failed to start free conversation"
    );

  const handleDeleteScenario = async (scenarioId: string) => {
    // Optimistic removal
    setCustomScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    try {
      await deleteCustomScenario(scenarioId);
    } catch (error) {
      console.error("Failed to delete scenario:", error);
      toast.error("Failed to delete scenario");
      // Restore on failure by re-fetching
      if (userId) {
        getCustomTopics(userId).then((topics) =>
          setCustomScenarios(
            topics.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              category: s.category || "Custom",
              level: s.level || "B1",
              image: s.image || "/learning.png",
              sessionsCompleted: 0,
              totalSessions: 10,
              progress: 0,
              isCustom: true,
            }))
          )
        );
      }
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    topicPrompt,
    setTopicPrompt,
    isCreating,
    handleCreateScenario,
    handleSurpriseMe,
    handleFreeTalk,
    handleDeleteScenario,
    customScenarios,
    customScenariosLoading,
    isGenerating,
    generatingMessage,
  };
}
