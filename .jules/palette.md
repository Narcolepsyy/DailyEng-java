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
## 2024-10-27 - Icon-only buttons in dense data views
**Learning:** Icon-only buttons in dense data views (like dictionary tables) often have `aria-label` for screen readers but lack `title` attributes, making their exact function ambiguous to sighted users hovering over them.
**Action:** Ensure both `aria-label` and `title` are added to icon-only action buttons in tables/lists to serve both screen reader and mouse users.
## 2026-05-19 - Added title attributes to icon-only buttons in VocabularyListView
**Learning:** Found multiple `Button` components with `size="icon"` in `VocabularyListView.tsx` that had `aria-label`s for screen readers but lacked `title` attributes for sighted users, reducing discoverability.
**Action:** Always add `title` attributes alongside `aria-label`s for icon-only buttons to provide visual tooltips on hover.
