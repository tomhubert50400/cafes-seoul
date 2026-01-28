# Phase 4: Protected Routes & Session Management - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable persistent sessions across browser actions and create auth-aware UI that adapts to login state. Implement protected routes that redirect unauthenticated users, a profile page with account management, and session persistence with user preference. This phase focuses on the session lifecycle and auth state visibility, not new authentication methods.

</domain>

<decisions>
## Implementation Decisions

### Auth-aware header UI
- **Avatar dropdown** for logged-in users — circular avatar opens dropdown menu
- **Menu options:** Profile, My Reviews, Settings, Language, Logout
- **Avatar fallback:** Initials avatar (e.g., "JD") when no profile image exists
- **Position:** Far right of header, replacing Login/Signup buttons when logged in

### Protected route behavior
- **Unauthenticated access:** Redirect to /login with return URL (?next=/profile)
- **After login:** Redirect to home (not back to original page — simpler flow)
- **Logged-in users on auth pages:** Redirect to homepage from /login and /signup
- **Next URL persistence:** Store in sessionStorage to survive multiple login attempts
- **Invalid next URLs:** Redirect to homepage with error message (not 404)
- **Protected routes scope:** Claude's discretion — implement typical auth patterns
- **Middleware API handling:** Claude's discretion — follow API conventions
- **Protected link indicators:** Claude's discretion — no strong preference

### Profile page content
- **Main sections:** Full dashboard layout with placeholders for future features
  - Account info section (email, created date)
  - Placeholder sections for Reviews and Favorites ("Coming soon")
  - Settings section
  - Account management section
- **Avatar:** Allow image upload (not just OAuth provider avatars)
- **Profile editing:** Full editing — name, avatar, display preferences
- **OAuth providers:** Claude's discretion on showing linked providers
- **Header dropdown click:** Show mini-profile card in dropdown (not navigate away)
- **Dropdown content:** Navigation links only (no stats in header dropdown)
- **Account management:** Full options — logout, delete account, change password

### Session persistence UX
- **Remember me:** Yes, optional checkbox on login
- **Session duration:** Until logout (indefinite persistence when "Remember me" checked)
- **Active session refresh:** Auto-refresh silently via middleware
- **Expiry notification:** Silent refresh — no user notification
- **Remember me preference:** Store in localStorage (survives cookie clearing)
- **Multi-device logout:** No — single device logout only
- **Post-expiry behavior:** Redirect to login with "Your session expired" message
- **Session transparency:** Don't display last active or session info to users

### Claude's Discretion
- Protected routes scope (which routes to protect)
- Middleware API response handling
- Protected link visual indicators
- OAuth provider linking UI on profile page
- Exact mini-profile dropdown design
- Session refresh implementation details

</decisions>

<specifics>
## Specific Ideas

- Header dropdown mini-profile: Expands in place to show user info card without leaving current page
- Avatar upload: Allow users to upload custom profile images (separate from OAuth provider avatars)
- Profile dashboard: Show account info prominently, with "Coming soon" placeholders for Reviews and Favorites sections
- Session flow: Remember preference in localStorage, actual session in cookies, silent refresh via middleware

</specifics>

<deferred>
## Deferred Ideas

- Reviews and Favorites functionality — Phase 6+ (User Contributions milestone)
- Multi-device session management — future enhancement
- Activity/session history display — future transparency feature
- Advanced profile fields (bio, location, preferences) — future profile enhancements

</deferred>

---

*Phase: 04-protected-routes-session-management*
*Context gathered: 2026-01-28*
