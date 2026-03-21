## 2024-06-12 - [Optimized O(n*m) to O(n) in study-heatmap.tsx]
**Learning:** React component derived state generation involving nested loops across arrays can cause unnecessary O(N^2) or worse complexities on each render. In `src/components/profile/study-heatmap.tsx`, finding existing heatmap entries within a date generation loop resulted in an O(365 * data.length) operation.
**Action:** Replace `Array.prototype.find()` inside loops with O(1) hash map lookups (`Map`) when deriving state from lists, especially when the loop has a constant large factor (like 365 days).

## 2025-02-14 - [Fixed App-Wide Re-renders caused by Zustand in useTranslation]
**Learning:** Destructuring directly from a Zustand store (`const { language } = useAppStore()`) without a selector subscribes the calling component to the *entire* store. In widely used hooks like `useTranslation` (used in hundreds of components), this causes massive cascading re-renders across the entire app whenever *any* unrelated state in the store (e.g., XP, streak, doraraOpen) changes.
**Action:** Always use precise selectors (`useAppStore((state) => state.language)`) when consuming Zustand state in hooks or components to prevent unnecessary React renders, especially for broadly utilized utility hooks.

## 2026-03-21 - [Prevented Unnecessary Re-renders in TopicCard grids]
**Learning:** Widely used grid and list components like `TopicCard` are rendered numerous times in views such as `SearchResults` and `AvailableTopicsTab`. Changes to parent states (e.g., active tabs, search queries, or bookmark toggles) cause all child cards to re-render, even if their individual props are stable. This is a common React performance bottleneck when rendering lists.
**Action:** Use `React.memo` on heavily re-used UI components (like `TopicCard` and its sub-components `SpeakingThumbnail`) when they mostly receive stable primitive props or strings, significantly reducing re-renders across list and grid views during parent state changes.
