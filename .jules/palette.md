## 2025-04-02 - Icon-only Button Accessibility
**Learning:** React elements utilizing Shadcn `Button` components with `size="icon"` frequently miss `aria-label`s since they do not have text children. This limits screen reader visibility.
**Action:** When adding or reviewing `size="icon"` buttons, always verify if an `aria-label` or `title` exists so assistive technologies can describe the interactive element.
## 2024-03-26 - Added aria-label to Edit icon in PlanPageClient.tsx
**Learning:** Found an `aria-label` missing on a `Button` component that only contained an icon (`<Edit2 className="w-3 h-3" />`).
**Action:** Always make sure `size="icon"` buttons have an `aria-label`.
## 2026-03-28 - Added dynamic aria-label to star button in VocabularyFlashcards.tsx
**Learning:** Stateful icon-only buttons (like a toggleable Star icon) not only need an `aria-label`, but the label needs to dynamically reflect the action that will happen when clicked (e.g., 'Star flashcard' vs 'Unstar flashcard').
**Action:** Always check if icon-only buttons are stateful, and ensure their `aria-label` provides the correct context for the current state.

## $(date +%Y-%m-%d) - Add accessible labels to microphone buttons in practice mode
**Learning:** Found that custom practice mode components (`GrammarPracticeMode.tsx` and `VocabPracticeMode.tsx`) used interactive `Button` elements with `size="icon"` for microphone recording but lacked `aria-label`s, rendering them inaccessible to screen readers.
**Action:** Always ensure that icon-only interactive buttons in newly created or complex interactive modes have both an `aria-label` for screen reader support and a `title` for visual tooltips.

## 2026-04-05 - Add accessible labels to microphone buttons in practice mode
**Learning:** Found that custom practice mode components (`GrammarPracticeMode.tsx` and `VocabPracticeMode.tsx`) used interactive `Button` elements with `size="icon"` for microphone recording but lacked `aria-label`s, rendering them inaccessible to screen readers.
**Action:** Always ensure that icon-only interactive buttons in newly created or complex interactive modes have both an `aria-label` for screen reader support and a `title` for visual tooltips.
## $(date +%Y-%m-%d) - Dynamic ARIA labels on Icon-only components
**Learning:** Found an icon-only button within `AddToNotebookDialog` that correctly tracked a boolean state (e.g. `saved`) but its tooltip (`title`) was static ("Add to Notebook"). Static ARIA labels/titles on stateful buttons are confusing for both screen readers and visual users when the action is no longer possible or has already been performed.
**Action:** When adding or updating ARIA labels or titles on stateful icon-only buttons, always ensure the text updates dynamically to match the current state (e.g. `aria-label={saved ? "Added" : "Add"}`).
