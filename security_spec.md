# Security Specification: Pet Health App

## 1. Data Invariants
- A `Pet` cannot exist without a valid `ownerId`.
- An `Appointment` must be linked to a valid `petId` and `ownerId`.
- Only `admin` or the `owner` can modify user-profile data.
- PII must be restricted to owner or admin.

## 2. The "Dirty Dozen" Payloads (Representative Examples)

1. **Privilege Escalation:** Update user's role to 'admin' (should be blocked by rules).
2. **Orphaned Record:** Create a `Pet` with a non-existent `ownerId`.
3. **Ghost Field:** Update `CommunityPost` with a `isVerified: true` field.
4. **License Hijacking:** Update `License` (id:1) by a user who doesn't own it.
5. **State Skipping:** Update `Appointment` from 'pending' directly to 'completed' (should require specific logic).
6. **Path Injection:** Write to `pets/../../../users/hackedId`.
7. **Resource Exhaustion:** Create a `CommunityPost` with 10MB content.
8. **PII Leak:** Read `users/{otherUser}/private` data.
9. **Role Injection:** Create user with `role: 'admin'`.
10. **Terminal State Modification:** Update `Appointment` already marked 'completed' back to 'scheduled'.
11. **System Field Override:** Modify `ActivityLog` status controlled by the system.
12. **Anonymous Write:** Create `CommunityPost` without `isVerified`.

## 3. High-Level Audit Results
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning | Status |
| :--- | :--- | :--- | :--- | :--- |
| users | Low | N/A | Low | Needs Patch (Role injection) |
| pets | Low | N/A | Medium | OK |
| appointments| Medium | High | Medium | Needs Patch |
| communityPosts| Medium | N/A | High | Needs Patch |
| licenses | High | N/A | Medium | **CRITICAL FAILURE** |

## 4. Remediation Plan
1. Fix Role Injection in `users` match block.
2. Implement strict state transition logic for `appointments`.
3. Fix `communityPosts` update logic to restrict unauthorized updates.
4. Completely overhaul `licenses` collection security.
