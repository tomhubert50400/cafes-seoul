# Phase 3: OAuth Integration - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Google and Kakao OAuth login to the existing authentication system. Users can log in via social providers as an alternative to email/password. OAuth buttons appear on both login and signup pages. Account linking and error handling are included. Profile management of linked providers is out of scope (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Button Placement & Styling
- OAuth buttons appear **below** the email/password form with a divider ("or")
- **Official brand colors**: Google multicolor logo, Kakao yellow background
- **Full text labels**: "Continue with Google", "Continue with Kakao" (not icon-only)
- OAuth buttons on **both** login and signup pages

### Provider Priority & Layout
- **Kakao first**, then Google (local provider prioritized for Korean audience)
- **Same size** for both buttons — equal prominence, no bias
- **Stacked vertically** — one button per row, full width
- **Localized labels**: "카카오로 계속하기" in Korean, "Continue with Kakao" in English

### Account Linking Behavior
- **Auto-link accounts**: When OAuth email matches existing account, silently merge
- **OAuth users immediately active**: No email verification required (provider verified)
- **Kakao without email**: Use Kakao user ID as identifier when email not shared

### Claude's Discretion
- Whether to allow linking multiple providers to one account (based on Supabase capabilities)

### Error Handling
- **Full-page redirect flow** instead of popup — avoids popup blockers entirely
- **User cancellation**: Show brief "Login cancelled" message, return to auth page
- **Provider errors**: Specific message like "Google login is temporarily unavailable"
- **Error display**: Inline on auth page (within form area), not toast

</decisions>

<specifics>
## Specific Ideas

- Kakao first because this is a Seoul-focused app — Korean users are primary audience
- Brand colors for trust — users recognize familiar provider styling
- No popup complexity — redirect flow is more reliable across browsers/devices

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-oauth-integration*
*Context gathered: 2026-01-28*
