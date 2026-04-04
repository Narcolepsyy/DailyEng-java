## 2024-03-26 - Added aria-label to Edit icon in PlanPageClient.tsx
**Learning:** Found an `aria-label` missing on a `Button` component that only contained an icon (`<Edit2 className="w-3 h-3" />`).
**Action:** Always make sure `size="icon"` buttons have an `aria-label`.
## 2026-03-28 - Added dynamic aria-label to star button in VocabularyFlashcards.tsx
**Learning:** Stateful icon-only buttons (like a toggleable Star icon) not only need an `aria-label`, but the label needs to dynamically reflect the action that will happen when clicked (e.g., 'Star flashcard' vs 'Unstar flashcard').
**Action:** Always check if icon-only buttons are stateful, and ensure their `aria-label` provides the correct context for the current state.
## 2024-05-18 - Added `title` attributes for visual tooltips on icon-only buttons
**Learning:** While `aria-label` makes icon-only buttons accessible for screen readers, sighted users also need context. Adding `title` provides a native browser tooltip on hover.
**Action:** When adding `aria-label` to an icon-only button, also ensure it has a matching `title` attribute for visual accessibility.
