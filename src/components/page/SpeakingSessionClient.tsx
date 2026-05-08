"use client";

import { useSpeakingSession } from "@/hooks/speaking-session/useSpeakingSession";
import AnalyzingSpinner from "@/components/speaking/views/AnalyzingSpinner";
import SessionStartingSkeleton from "@/components/speaking/views/SessionStartingSkeleton";
import PreparationView from "@/components/speaking/views/PreparationView";
import ActiveSessionView from "@/components/speaking/views/ActiveSessionView";
import HistoryView from "@/components/speaking/views/HistoryView";
import RecordReviewView from "@/components/speaking/views/RecordReviewView";
import CompletionView from "@/components/speaking/views/CompletionView";
import { useAppStore } from "@/lib/store";

// Re-export types for backward compatibility
export type {
  LearningRecord,
  DetailedFeedbackScore,
  ErrorCategory,
  ConversationItem,
  DetailedFeedbackData,
  ScenarioData,
  InitialTurn,
  SpeakingSessionClientProps,
} from "@/hooks/speaking-session/types";

export { type SpeakingSessionClientProps as Props } from "@/hooks/speaking-session/types";

export default function SpeakingSessionClient(
  props: import("@/hooks/speaking-session/types").SpeakingSessionClientProps
) {
  const session = useSpeakingSession(props);
  const { scenario } = props;
  const learningLanguage = useAppStore((s) => s.learningLanguage);

  // No scenario data — show skeleton
  if (!scenario) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  // Session is being created — show skeleton
  if (session.isStartingSession) {
    return <SessionStartingSkeleton />;
  }

  // Route to the appropriate view based on viewState
  switch (session.viewState) {
    case "preparation":
      return (
        <PreparationView
          scenario={scenario}
          backUrl={session.backUrl}
          sessionMode={session.sessionMode}
          onSessionModeChange={session.setSessionMode}
          onStartSession={session.startSession}
          onViewHistory={session.feedback.loadLearningRecords}
          t={session.t}
        />
      );

    case "active":
      return (
        <ActiveSessionView
          scenario={scenario}
          turns={session.turns}
          isRecording={session.recording.isRecording}
          isTranscribing={session.recording.isTranscribing}
          isProcessing={session.isProcessing}
          mediaStream={session.recording.mediaStream}
          hintText={session.hintText}
          hintTranslation={session.hintTranslation}
          isLoadingHint={session.isLoadingHint}
          sessionMode={session.sessionMode}
          showQuitDialog={session.showQuitDialog}
          showFinishDialog={session.showFinishDialog}
          backUrl={session.backUrl}
          conversationRef={session.conversationRef}
          onToggleRecording={session.recording.handleToggleRecording}
          onRequestHint={session.requestHint}
          onDismissHint={() => { session.setHintText(null); session.setHintTranslation(null); }}
          onSpeakText={session.tts.speakText}
          onSpeakHint={async () => {
            if (session.tts.isSpeakingRef.current) {
              session.tts.stopPlayback();
              return;
            }
            if (session.hintText) {
              await session.tts.speakText(session.hintText);
            }
          }}
          onSetShowQuitDialog={session.setShowQuitDialog}
          onSetShowFinishDialog={session.setShowFinishDialog}
          onContinue={() => session.setShowQuitDialog(false)}
          onFinish={async () => {
            session.setShowQuitDialog(false);
            session.setShowFinishDialog(false);
            session.tts.stopPlayback();
            await session.finishAndAnalyze();
          }}
          onStopMicrophone={() => {
            session.tts.stopPlayback();
            session.recording.stopMicrophone();
          }}
          currentTurnNumber={session.currentTurnNumber}
          maxTurns={session.maxTurns}
          t={session.t}
        />
      );

    case "analyzing":
      return (
        <AnalyzingSpinner
          title={session.t("speaking_session.analyzing.title")}
          description={session.t("speaking_session.analyzing.desc")}
        />
      );

    case "complete":
      return (
        <ActiveSessionView
          scenario={scenario}
          turns={session.turns}
          isRecording={session.recording.isRecording}
          isTranscribing={session.recording.isTranscribing}
          isProcessing={session.isProcessing}
          mediaStream={session.recording.mediaStream}
          hintText={session.hintText}
          hintTranslation={session.hintTranslation}
          isLoadingHint={session.isLoadingHint}
          sessionMode={session.sessionMode}
          showQuitDialog={session.showQuitDialog}
          showFinishDialog={session.showFinishDialog}
          backUrl={session.backUrl}
          conversationRef={session.conversationRef}
          onToggleRecording={session.recording.handleToggleRecording}
          onRequestHint={session.requestHint}
          onDismissHint={() => { session.setHintText(null); session.setHintTranslation(null); }}
          onSpeakText={session.tts.speakText}
          onSpeakHint={async () => {
            if (session.tts.isSpeakingRef.current) {
              session.tts.stopPlayback();
              return;
            }
            if (session.hintText) {
              await session.tts.speakText(session.hintText);
            }
          }}
          onSetShowQuitDialog={session.setShowQuitDialog}
          onSetShowFinishDialog={session.setShowFinishDialog}
          onContinue={() => session.setShowQuitDialog(false)}
          onFinish={async () => {
            session.setShowQuitDialog(false);
            session.setShowFinishDialog(false);
            session.tts.stopPlayback();
            await session.finishAndAnalyze();
          }}
          onStopMicrophone={() => {
            session.tts.stopPlayback();
            session.recording.stopMicrophone();
          }}
          currentTurnNumber={session.currentTurnNumber}
          maxTurns={session.maxTurns}
          t={session.t}
          assessmentData={session.assessmentData}
          onRetry={session.resetSession}
          language={learningLanguage}
        />
      );

    case "history":
      return (
        <HistoryView
          isLoading={session.feedback.isLoadingRecords}
          records={session.feedback.dynamicRecords}
          onBack={() => session.setViewState("preparation")}
          onSelectRecord={session.feedback.handleSelectRecord}
          onDeleteRecord={session.feedback.handleDeleteRecord}
        />
      );

    case "record-review":
      return (
        <RecordReviewView
          isLoading={session.feedback.isLoadingFeedback}
          loadedSessionData={session.feedback.loadedSessionData}
          fromParam={session.fromParam}
          backUrl={session.backUrl}
          language={learningLanguage}
          onBack={() => {
            session.setViewState("history");
            session.feedback.setSelectedRecordId(null);
            session.feedback.setLoadedSessionData(null);
          }}
          onRetry={session.resetSession}
          router={session.router}
          t={session.t}
        />
      );

    default:
      return <div>Loading...</div>;
  }
}
