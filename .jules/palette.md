## 2025-03-17 - Added Missing ARIA Labels on Profile Layout Components
**Learning:** Icon-only buttons in the user layout section (like `UserProfileSidebar` upload button and `ProfileDropdown` trigger) often lack `aria-label`s, which represents a critical accessibility gap for screen readers as they provide no context of the interaction. Using `size="icon"` in standard `Button` components from `shadcn/ui` makes the label implicit visually, but screen readers are left blind without an explicit accessible label.
**Action:** When adding or reviewing layout buttons (especially those containing avatars or upload icons without text), enforce that any button with `size="icon"` must include an explicit `aria-label` describing its action, such as "Upload profile picture" or "Open user profile menu".

## 2025-03-22 - Added Missing ARIA Labels to Flashcard Stack
**Learning:** Flashcard review components rely heavily on icon-only navigation and audio playback buttons (e.g., `ChevronLeft`, `Volume2`). Without `aria-label`s, screen readers announce these buttons purely as "Button", making the flashcard navigation and pronunciation features completely inaccessible to visually impaired users.
**Action:** Consistently verify that learning-focused components (especially those involving audio or quick navigation) have explicit `aria-label`s on their `Button`s, ensuring users understand what each action does without visual cues.

## 2026-03-23 - Added ARIA Label to Notification Dropdown
**Learning:** Icon-only utility buttons in global navigation (like the notification bell) often rely solely on the `title` attribute, which is insufficient for robust screen reader support compared to an explicit `aria-label`.
**Action:** When auditing global layout components, ensure all icon-only buttons use `aria-label` for primary accessible naming, treating `title` only as a supplementary tooltip for mouse users.
