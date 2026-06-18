## 2024-05-18 - Avoid Component Definitions Inside Render Methods
**Learning:** Found an anti-pattern in `UnifiedSidebar.tsx` where a child functional component (`NavContent`) was defined directly inside the parent's component body. This causes the child component to unmount and remount completely on every parent render, leading to significant performance degradation and state/focus loss.
**Action:** Always extract child component definitions outside of parent components or inline the JSX directly into the parent's return statement to prevent unnecessary remounts.
