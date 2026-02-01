# Phase 15: Settings & Profile - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

User can manage their profile information and account: edit display name, upload avatar, write bio, and delete account. Includes public profile pages where other users can view someone's profile, reviews, and favorites.

</domain>

<decisions>
## Implementation Decisions

### Profile Form Layout
- Claude's discretion on form structure (single form vs sections)
- Edit button reveals form (display mode shows current values, Edit switches to editable)
- Display name: required, 2-50 characters, basic sanitization
- Bio: 500 character limit
- Character counter shows when typing (not always visible)
- Toast notification on save (Sonner, matches existing app pattern)
- Custom modal warning for unsaved changes when navigating away
- Claude's discretion on Cancel button (Edit/Cancel/Save vs Edit/Save)

### Avatar Upload Flow
- Click avatar area to open file picker (no separate button needed)
- Square crop tool before saving (user adjusts crop area)
- Max file size: 5 MB
- Default avatar: initials on colored background (first letter(s) of display name)

### Account Deletion
- Type-to-confirm: user must type their email to proceed
- 7-day grace period before actual deletion
- Account marked for deletion, can reactivate by logging in within grace period
- After deletion: reviews are anonymized (kept but show "Deleted User" as author)
- Favorites and other personal data deleted

### Data Visibility
- Public profile pages at /user/[id]
- Public profiles show: name, avatar, bio, reviews, favorited cafes
- Privacy toggle in settings (user can make profile private)
- Default: public for new accounts
- Display name appears in header, profile, and as author on review cards
- **Email is NEVER exposed publicly** - only visible to the user themselves

### Claude's Discretion
- Form grouping structure (single vs sectioned)
- Cancel button presence
- Exact crop tool implementation
- Color generation for initials avatar
- Grace period reactivation flow details

</decisions>

<specifics>
## Specific Ideas

- Click-to-upload for avatar (clean, no extra buttons)
- Type email to confirm deletion (more personal than typing "DELETE")
- Anonymize reviews instead of deleting (preserves cafe rating data)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-settings-profile*
*Context gathered: 2026-02-01*
