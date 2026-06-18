## 2024-06-17 - Added missing aria-labels to icon-only buttons
**Learning:** Found multiple icon-only buttons in `ProviderServiceCatalog.tsx` that lacked `aria-label`s, breaking accessibility for screen reader users.
**Action:** Applied `aria-label` attributes describing the purpose of these buttons (e.g. 'Close modal', 'Delete item', 'Select all', etc) to improve accessibility.
## 2024-06-17 - Missing ARIA labels on modal close buttons
**Learning:** Found a consistent pattern across multiple components (NotificationsDrawer, ZoolHelpWidget, AddPetDialog, ProviderServiceCatalog) where icon-only `X` buttons used for closing dialogs or drawers were missing `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Always verify that buttons containing only icons (like from lucide-react) have descriptive `aria-label`s, especially in reusable UI components like modals and overlays.

