## 2024-06-12 - [Optimized O(n*m) to O(n) in study-heatmap.tsx]
**Learning:** React component derived state generation involving nested loops across arrays can cause unnecessary O(N^2) or worse complexities on each render. In `src/components/profile/study-heatmap.tsx`, finding existing heatmap entries within a date generation loop resulted in an O(365 * data.length) operation.
**Action:** Replace `Array.prototype.find()` inside loops with O(1) hash map lookups (`Map`) when deriving state from lists, especially when the loop has a constant large factor (like 365 days).

## 2025-02-14 - [Fixed App-Wide Re-renders caused by Zustand in useTranslation]
**Learning:** Destructuring directly from a Zustand store (`const { language } = useAppStore()`) without a selector subscribes the calling component to the *entire* store. In widely used hooks like `useTranslation` (used in hundreds of components), this causes massive cascading re-renders across the entire app whenever *any* unrelated state in the store (e.g., XP, streak, doraraOpen) changes.
**Action:** Always use precise selectors (`useAppStore((state) => state.language)`) when consuming Zustand state in hooks or components to prevent unnecessary React renders, especially for broadly utilized utility hooks.

## 2026-03-21 - [Prevented Unnecessary Re-renders in TopicCard grids]
**Learning:** Widely used grid and list components like `TopicCard` are rendered numerous times in views such as `SearchResults` and `AvailableTopicsTab`. Changes to parent states (e.g., active tabs, search queries, or bookmark toggles) cause all child cards to re-render, even if their individual props are stable. This is a common React performance bottleneck when rendering lists.
**Action:** Use `React.memo` on heavily re-used UI components (like `TopicCard` and its sub-components `SpeakingThumbnail`) when they mostly receive stable primitive props or strings, significantly reducing re-renders across list and grid views during parent state changes.

## 2025-02-19 - React Context Value Memoization
**Learning:** Context provider values created inline (e.g., `value={{ profile, isLoading, refreshProfile }}`) cause all consumers to re-render whenever the provider component re-renders, even if the actual data hasn't changed.
**Action:** Always wrap context values in `useMemo` with appropriate dependencies to maintain stable references and prevent unnecessary re-renders of all consuming components.
## 2026-03-26 - Memoized Filter in Client Components\n**Learning:** Next.js Server/Client component architectures with large data arrays fetched via Server Actions and stored in local state (like `liveTopics`) can cause significant rendering delays when the UI frequently re-renders (e.g. toggling tabs).  operations on these large arrays with string manipulations (, ) should always be wrapped in  to skip work when unrelated state changes.\n**Action:** Always scan for unmemoized  or  operations in React Client Components handling large data arrays, especially those driven by search bars or complex filters.

## 2024-05-19 - Unmemoized Filters in Client Components
**Learning:** React Client Components handling large arrays fetched via Server Actions (e.g. `liveTopics` in `GrammarPageClient.tsx`) can suffer rendering delays if heavy `filter()` operations with string manipulations (`toLowerCase()`, `includes()`) run on every render (e.g., when unrelated state like active tab changes).
**Action:** Always scan for unmemoized `filter()` or `map()` operations on large data arrays in React Client Components, and wrap them in `useMemo()` with appropriate dependencies to skip unnecessary work.

## 2025-03-27 - Unmemoized Filters in Client Components (PlanPageClient)
**Learning:** In Next.js Server/Client component architectures, arrays fetched via Server Actions and stored in local state (like `todayLessons`) can cause significant rendering delays when the UI frequently re-renders (e.g. toggling task completion, editing times). Computations on these large arrays with operations like `.filter()` should be wrapped in `useMemo` to skip work when unrelated state changes.
**Action:** Always scan for unmemoized `filter()` or `map()` operations on arrays in React Client Components, and wrap them in `useMemo()` with appropriate dependencies to skip unnecessary work.

## 2024-05-18 - Memoizing Complex Date Logic Without DST Regressions
**Learning:** When attempting to memoize expensive component render logic (like a calendar or heatmap iterating over 365 days) using `useMemo`, anchoring `today` outside of the `useMemo` using `new Date().toISOString().split("T")[0]` to create a stable dependency string introduces critical timezone offset and Daylight Saving Time (DST) regressions. This ties the date exactly to UTC midnight, which translates to a local offset and causes loops utilizing `startDate.setDate()` to duplicate or skip days over DST boundaries.
**Action:** Always instantiate `const today = new Date()` safely *inside* the `useMemo` block rather than trying to pass it as a stable string dependency, ensuring it operates safely in local time without triggering invalidations or breaking DST logic.
## 2025-05-18 - [Optimized O(N*M) to O(N) in notebook collection counts]
**Learning:** Using `Array.prototype.filter()` repeatedly inside an `Array.prototype.map()` (e.g., mapping over 50 collections and filtering 2000 vocabulary items for each) results in an O(N * M) time complexity. As lists grow, this becomes a major performance bottleneck during React state updates or `useEffect` syncs.
**Action:** Replace `Array.prototype.filter()` inside loops with O(1) hash map lookups. Group the items in a single O(N) pass using a `Map`, then map over the parent array and retrieve the pre-computed grouped stats.

## 2025-05-19 - [Optimized Set Generation from Filtered Mapped Array]
**Learning:** Chaining `.filter().map()` to generate an array of IDs from a large data list and then wrapping it in `new Set()` allocates intermediate arrays that are immediately thrown away. In heavily re-rendered or intensely derived state components (like graph node simulation state), this creates unnecessary GC pressure and iterates over the original array twice.
**Action:** Replace chained `.filter().map()` operations with a single classic `for` loop that populates a `Set` directly to cut iteration count in half and reduce memory allocation.
## 2025-05-19 - [Optimized O(N*M) to O(N+M) in useBookmarks.ts]
**Learning:** In `src/hooks/vocab/useBookmarks.ts`, `bookmarkedTopicsList` was derived on every render by calling `topics.filter((topic) => bookmarkedTopics.includes(topic.id))`. `bookmarkedTopics.includes` is an O(M) operation inside an O(N) filter, making it O(N*M). In Next.js client components, this array can be large and cause significant rendering delays on every UI interaction.
**Action:** Wrap such array derivations in `useMemo` and optimize the check by converting the lookup array to a `Set` first (`bookmarkSet.has(topic.id)`).
## 2026-04-04 - [Optimized Multiple Filters into Single Loop]
**Learning:** When computing multiple statistics from an array (like separating an array into 'mastered', 'learning', and 'new' items), performing multiple sequential `.filter()` operations traverses the array multiple times, which is O(k*N) and creates intermediate unneeded arrays.
**Action:** Combine multiple filtering operations into a single O(N) loop to calculate all metrics simultaneously.
## 2025-03-03 - O(N) Array Aggregation
**Learning:** React re-renders or utility logic executing multiple O(N) Array passes using `.filter().length` in sequence on the same dataset creates an easily-fixable performance bottleneck.
**Action:** Always refactor sequential `.filter().length` aggregations into a single loop (e.g. `for` or `.reduce`) to traverse the array exactly once.
## 2024-04-11 - [Optimize multiple sequential Array.filter() calls in useMemo]
**Learning:** Found a pattern where derived statistics or grouped objects are computed using multiple sequential `.filter()` calls within a single `useMemo` block (e.g., `groupedTasks = { morning: tasks.filter(...), afternoon: tasks.filter(...) }`). In React applications that handle long lists or large arrays on the client side, this O(M * N) complexity (where M is the number of filters and N is array size) causes unnecessary performance overhead during recalculation, especially since `useMemo` might re-trigger when shallow-compared dependencies update.
**Action:** When calculating multiple derived properties (like categories, counts, or sums) from a single list, replace the redundant `filter()` and `reduce()` passes with a single O(N) `for` loop or `reduce` pass to minimize array traversals.
## 2024-05-18 - Optimize Vocab Graph Stats Computation
**Learning:** In the `src/actions/vocab-graph.ts` server action, the final stats object was calculated by traversing the `nodes` array four separate times using `.filter().length`. In a graph with potentially thousands of nodes, this causes unnecessary O(N) traversals and redundant array allocations for the intermediate `.filter()` results. Consolidating these loops into a single O(N) pass significantly reduces CPU overhead and garbage collection pressure in Node.js/Next.js.
**Action:** When computing multiple derived values or counts from a single array in server actions, avoid chaining multiple `.filter().length` calls. Always use a single `for` loop or `.reduce()` to iterate through the array exactly once.
## 2025-05-19 - [Hoist .toLowerCase() out of map/filter loops]
**Learning:** Calling `.toLowerCase()` inside `.map()` or `.filter()` functions (e.g. `item.word.toLowerCase().includes(searchQuery.toLowerCase())`) on large lists in React recalculates the search query string over and over again on every render, causing O(N) string allocations and performance drops in client components.
**Action:** Always hoist variables that don't change within a loop (like search queries) outside of the loop. Save it to a constant (`const lowerQuery = searchQuery.toLowerCase()`) and reference that inside the `.filter()` block to ensure it's evaluated exactly once.
