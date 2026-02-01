# Phase 18: Email Notifications - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Send email notifications when cafe/photo submission status changes (approved/rejected). Users who enabled notification preferences receive daily digest emails summarizing their submission updates.

</domain>

<decisions>
## Implementation Decisions

### Email Content & Tone
- Friendly & casual tone ("Hey! Great news — your cafe submission was approved!")
- Approval emails include full details: cafe name, address/neighborhood, direct link, contribution stats
- Rejection emails always include the specific rejection reason from admin
- No action links in rejection emails — just notify with reason, user figures out next steps

### Delivery Timing
- Daily digest at 9 AM KST (not immediate)
- Skip sending if no updates for the day
- Multiple updates grouped in sections: "Approved (2)" and "Rejected (1)" format
- Edge Function triggered on schedule (cron), not on individual status changes

### Template Structure
- HTML with plain text fallback for universal compatibility
- Logo + brand colors in header (Cafes Seoul visual identity)
- Footer includes one-click unsubscribe link + settings link to notification preferences
- Localized to user's app language preference (KO/EN/FR/ZH/VI)

### Claude's Discretion
- Exact HTML/CSS styling within brand guidelines
- Plain text fallback formatting
- Email subject line wording
- How to store pending notifications for daily batch

</decisions>

<specifics>
## Specific Ideas

- Digest groups by status (approved vs rejected sections) for clarity
- One-click unsubscribe should work without login (token-based)
- Consider using Resend or similar service via Edge Function

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-email-notifications*
*Context gathered: 2026-02-01*
