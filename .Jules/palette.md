## 2024-06-17 - Missing ARIA labels on modal close buttons
**Learning:** Found a consistent pattern across multiple components (NotificationsDrawer, ZoolHelpWidget, AddPetDialog, ProviderServiceCatalog) where icon-only `X` buttons used for closing dialogs or drawers were missing `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Always verify that buttons containing only icons (like from lucide-react) have descriptive `aria-label`s, especially in reusable UI components like modals and overlays.

