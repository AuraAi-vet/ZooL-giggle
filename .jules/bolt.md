## 2024-05-24 - Lack of Memoization in React Architecture
**Learning:** Found that this React codebase entirely lacked memoization on its pure presentational components, suggesting a potential pattern of unnecessary re-renders when parent dashboard states update.
**Action:** When working on performance optimization in this repo, look for pure presentation components with static or primitive props and wrap them in `React.memo()`.
