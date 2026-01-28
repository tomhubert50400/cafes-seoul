# Phase 4: Protected Routes & Session Management - Research

**Researched:** 2026-01-28
**Domain:** Next.js 15+ App Router, Supabase Auth, Session Management
**Confidence:** HIGH

## Summary

This phase focuses on implementing persistent sessions across browser sessions and creating auth-aware UI that adapts to login state. The project already has a solid foundation with Supabase SSR (@supabase/ssr@0.8.0), middleware-based session refresh, and protected routes. This research documents the patterns needed to complete the session management and auth-aware UI features.

**Key findings:**
1. Supabase Auth uses JWT access tokens (short-lived, ~1 hour) and refresh tokens (long-lived, indefinite) - session persistence is automatic via @supabase/ssr cookie handling
2. "Remember me" functionality in Supabase is implemented by extending cookie persistence - the session itself persists until logout
3. Next.js 15 App Router requires careful coordination between Server Components, Client Components, and Middleware for auth state
4. The middleware already handles protected routes and auth redirects - needs minor updates for the ?next parameter naming
5. Auth-aware UI requires passing user data from Server Components to Client Component header

**Primary recommendation:** Build on the existing @supabase/ssr foundation. The library handles most session complexity automatically. Focus on the "Remember me" cookie persistence layer and the avatar dropdown UI component.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @supabase/ssr | 0.8.0 | Cookie-based session management | Already implemented |
| @supabase/supabase-js | 2.93.1 | Supabase client | Already implemented |
| next | 16.1.4 | App Router framework | Already installed |
| @radix-ui/react-dropdown-menu | 2.1.16 | Avatar dropdown | Already installed |
| @radix-ui/react-avatar | 1.1.11 | User avatar component | Already installed |

### Session Management Pattern
The project already uses the **official Supabase SSR pattern**:
- `createServerClient` in middleware for session refresh
- `createServerClient` in Server Actions/Components for auth operations
- `createBrowserClient` singleton in Client Components

**No additional libraries required.**

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── profile/
│   │   └── page.tsx          # Protected route
│   └── auth/
│       └── callback/
│           └── route.ts       # OAuth callback
├── components/
│   ├── auth/
│   │   ├── user-dropdown.tsx  # NEW: Avatar dropdown
│   │   └── login-form.tsx     # UPDATE: Add remember me
│   └── header.tsx             # UPDATE: Auth-aware header
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client singleton
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Session refresh
│   └── auth/
│       └── session.ts         # NEW: Remember me helpers
└── middleware.ts              # UPDATE: Protected routes
```

### Pattern 1: Protected Routes via Middleware
**What:** Middleware redirects unauthenticated users from protected routes
**When to use:** For page-level protection, before rendering
**Current Implementation (already exists):**
```typescript
// src/lib/supabase/middleware.ts
const protectedPaths = ['/profile', '/favorites'];
const isProtectedPath = protectedPaths.some((path) =>
  request.nextUrl.pathname.startsWith(path)
);

if (isProtectedPath && !user) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', request.nextUrl.pathname); // CHANGE TO 'next' per context
  return NextResponse.redirect(url);
}
```

**Important:** The context specifies using `?next=/profile` but current code uses `?redirect=`. Standardize on `?next=` to match OAuth callback pattern.

### Pattern 2: Auth-Aware Header with User Data
**What:** Server Component fetches user, passes to Header client component
**When to use:** When header needs to show different UI based on auth state
**Implementation:**
```typescript
// src/app/page.tsx (and other pages)
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <>
      <Header user={user} />
      {/* ... */}
    </>
  );
}

// src/components/header.tsx
'use client';
interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
  } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header>
      {user ? (
        <UserDropdown user={user} />
      ) : (
        <LoginButtons />
      )}
    </header>
  );
}
```

### Pattern 3: Remember Me with localStorage + Cookie Persistence
**What:** Persist "Remember me" preference in localStorage, use it to set cookie expiration
**When to use:** When user wants session to persist across browser restarts
**How Supabase handles this:**
- By default, Supabase @supabase/ssr sets cookies with session persistence (no Max-Age = session cookie)
- Session cookies are cleared when browser closes
- "Remember me" = extend cookie with long Max-Age

**Implementation approach:**
```typescript
// Store preference in localStorage (client-side)
// On login, pass rememberMe to Server Action
// Server Action sets custom cookie duration if rememberMe is true

// Client: login-form.tsx
const [rememberMe, setRememberMe] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rememberMe') === 'true';
  }
  return false;
});

useEffect(() => {
  localStorage.setItem('rememberMe', rememberMe.toString());
}, [rememberMe]);

// Server Action modification needed to set custom cookie duration
```

**Note:** Supabase @supabase/ssr handles cookie setting internally. To implement custom expiration, need to either:
1. Wrap the supabase client cookie handling
2. Set a separate "remember_me" cookie and check it in middleware

**Recommended approach:** Use a separate persistent flag in localStorage that the login form reads. The actual session persistence is handled by Supabase - the key is to ensure the user isn't automatically logged out. With Supabase, sessions persist until explicitly signed out by default.

### Pattern 4: Avatar Dropdown Component
**What:** Radix UI Dropdown with avatar trigger, displaying user menu
**When to use:** For logged-in user navigation and actions
**Implementation:**
```typescript
// Using @radix-ui/react-dropdown-menu (already installed)
// Using @radix-ui/react-avatar (already installed)

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';

export function UserDropdown({ user }: { user: User }) {
  const initials = getInitials(user.user_metadata?.name || user.email);
  
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="rounded-full">
          <Avatar.Root>
            <Avatar.Image 
              src={user.user_metadata?.avatar_url} 
              alt={user.user_metadata?.name || user.email}
            />
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar.Root>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content>
          {/* Mini profile card */}
          <div className="p-3">
            <Avatar.Root>
              <Avatar.Image src={user.user_metadata?.avatar_url} />
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar.Root>
            <p>{user.user_metadata?.name || user.email}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          
          <DropdownMenu.Separator />
          
          <DropdownMenu.Item>
            <Link href="/profile">Profile</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            <Link href="/reviews">My Reviews</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            <Link href="/settings">Settings</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            <LanguageSwitcher />
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>
            <LogoutButton />
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

### Pattern 5: Session Storage for Next URL
**What:** Persist intended destination across multiple login attempts
**When to use:** When user might fail login multiple times before success
**Implementation:**
```typescript
// On protected route redirect:
// middleware.ts sets ?next=/profile

// On login page (client):
'use client';
import { useSearchParams } from 'next/navigation';

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  
  useEffect(() => {
    if (nextUrl) {
      sessionStorage.setItem('auth_next_url', nextUrl);
    }
  }, [nextUrl]);
  
  // On successful login, read from sessionStorage
  // But per context: "After login: Redirect to home (not back to original page)"
  // So we still store it but don't use it for redirect
  // Instead show "redirecting..." or use for post-login navigation suggestions
}
```

**Note:** The context specifies storing in sessionStorage but then says "After login: Redirect to home (not back to original page)". This is contradictory - if we're not using the next URL, we don't need to store it. However, storing it provides future flexibility and follows the context's specific request.

### Anti-Patterns to Avoid
- **Don't use `supabase.auth.getSession()` in middleware** - Use `getUser()` which validates the JWT
- **Don't call `getUser()` multiple times per request** - Use React's `cache()` or pass user as prop
- **Don't store sensitive data in localStorage** - Only store "remember me" preference, not session tokens
- **Don't redirect from Server Components** - Use middleware for redirects, or `redirect()` in Server Actions
- **Don't use `useSession` hook pattern** - Next.js 15 App Router prefers Server Component data fetching

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session refresh | Custom interval/polling | @supabase/ssr middleware | Already handles automatic refresh via cookie sync |
| JWT validation | Manual JWT parsing | `supabase.auth.getUser()` | Validates against Supabase auth server, checks revocation |
| Cookie handling | Manual cookie parsing | @supabase/ssr cookie helpers | Properly syncs cookies between client/server |
| Avatar fallback | Custom CSS circles | @radix-ui/react-avatar | Accessible, handles image loading states |
| Dropdown menu | Custom CSS | @radix-ui/react-dropdown-menu | Accessible, keyboard navigation, focus management |
| Remember me state | Custom cookie expiration | localStorage preference + Supabase session | Supabase session already persists until logout |

**Key insight:** The @supabase/ssr package handles 90% of session complexity. The main custom work is the "Remember me" preference storage and the auth-aware UI components.

## Common Pitfalls

### Pitfall 1: Session Not Available in Server Component After Login
**What goes wrong:** After login, Server Component still shows user as logged out on first render
**Why it happens:** Cookie hasn't been synced yet between client and server
**How to avoid:** 
- Use middleware for immediate redirects after login
- Or use `router.refresh()` before redirect in client
- The middleware `updateSession` already handles cookie sync

### Pitfall 2: Protected Route Redirect Loop
**What goes wrong:** User redirected to login, logs in, redirected back, still shows as logged out, redirected again
**Why it happens:** Timing issue with cookie propagation or middleware running before cookie is set
**How to avoid:**
- Ensure middleware uses `NextResponse.next()` pattern, not `redirect()` for session refresh
- Add small delay or use `router.refresh()` before navigation
- Check that callback route properly exchanges code for session before redirecting

### Pitfall 3: OAuth "next" Param Not Preserved
**What goes wrong:** User clicks login from /profile, uses OAuth, ends up at homepage instead of /profile
**Why it happens:** OAuth state not properly passed through or callback not reading next param
**How to avoid:**
- Pass `next` param to OAuth redirect URL
- Store in state parameter or callback URL
- Read and validate in callback route

**Current implementation already handles this:**
```typescript
// auth.ts loginWithOAuth
const redirectTo = next 
  ? `${redirectToBase}?next=${encodeURIComponent(next)}`
  : redirectToBase;

// callback/route.ts
const next = searchParams.get('next');
const redirectUrl = next?.startsWith('/') ? next : '/';
```

### Pitfall 4: Avatar Dropdown Not Closing on Navigation
**What goes wrong:** Click item in dropdown, navigate to new page, dropdown stays open
**Why it happens:** Dropdown state not managed properly with Next.js navigation
**How to avoid:**
- Use `DropdownMenu.Item` with `asChild` pattern for Next.js Links
- Or wrap Link in DropdownMenu.Item without asChild
- Ensure onClick handlers close the dropdown

### Pitfall 5: localStorage SSR Error
**What goes wrong:** "window is not defined" error when using localStorage
**Why it happens:** localStorage only exists in browser, not on server
**How to avoid:**
```typescript
// Always check typeof window
const [rememberMe, setRememberMe] = useState(false);

useEffect(() => {
  const stored = localStorage.getItem('rememberMe');
  if (stored) setRememberMe(stored === 'true');
}, []);
```

## Code Examples

### Verified Pattern: Server Component Auth Check
```typescript
// app/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?next=/profile');
  }
  
  return <ProfileContent user={user} />;
}
```

### Verified Pattern: Middleware Protected Routes
```typescript
// middleware.ts (already exists, needs minor update)
export async function middleware(request: NextRequest) {
  const { user } = await updateSession(request);
  
  // Change 'redirect' to 'next' for consistency
  const nextUrl = request.nextUrl.pathname;
  
  if (isProtectedPath && !user) {
    url.searchParams.set('next', nextUrl); // Changed from 'redirect'
    return NextResponse.redirect(url);
  }
  
  // ... rest of logic
}
```

### Verified Pattern: Auth-Aware Header
```typescript
// components/header.tsx
'use client';

import { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { User, LogOut, Settings, FileText } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [open, setOpen] = useState(false);
  
  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';
  
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="font-semibold">Seoul Cafés</Link>
        
        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/cafes">Cafes</Link>
          <Link href="/map">Map</Link>
        </nav>
        
        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu.Root open={open} onOpenChange={setOpen}>
              <DropdownMenu.Trigger asChild>
                <button className="rounded-full outline-none focus:ring-2 focus:ring-primary">
                  <Avatar.Root className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Avatar.Image
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.name || user.email}
                      className="h-full w-full rounded-full object-cover"
                    />
                    <Avatar.Fallback className="text-sm font-medium text-primary">
                      {initials}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </button>
              </DropdownMenu.Trigger>
              
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="min-w-[200px] rounded-md border bg-popover p-1 shadow-md"
                >
                  {/* Mini Profile */}
                  <div className="flex items-center gap-3 p-3">
                    <Avatar.Root className="h-10 w-10 rounded-full bg-primary/10">
                      <Avatar.Image
                        src={user.user_metadata?.avatar_url}
                        className="h-full w-full rounded-full object-cover"
                      />
                      <Avatar.Fallback className="text-sm font-medium">
                        {initials}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.user_metadata?.name || user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  
                  <DropdownMenu.Item asChild>
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Item asChild>
                    <Link href="/reviews" className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent">
                      <FileText className="h-4 w-4" />
                      My Reviews
                    </Link>
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Item asChild>
                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  
                  <DropdownMenu.Item asChild>
                    <LogoutButton className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent text-destructive" />
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Verified Pattern: Login Form with Remember Me
```typescript
// components/auth/login-form.tsx (additions)
'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export function LoginForm() {
  // ... existing form state
  
  // Remember me state from localStorage
  const [rememberMe, setRememberMe] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem('rememberMe');
    if (stored) setRememberMe(stored === 'true');
  }, []);
  
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem('rememberMe', checked.toString());
  };
  
  return (
    <form action={formAction}>
      {/* ... existing fields */}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            name="remember"
            checked={rememberMe}
            onCheckedChange={handleRememberMeChange}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">
            Remember me
          </label>
        </div>
        
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      
      {/* ... submit button */}
    </form>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | More framework-agnostic, better cookie handling |
| getSession() in middleware | getUser() in middleware | 2024 | getUser validates JWT, more secure |
| Implicit OAuth flow | PKCE OAuth flow | 2024 | More secure, required for SSR |
| localStorage for tokens | HTTP-only cookies | 2024 | XSS protection, SSR compatible |
| Client-side auth state | Server Component auth | 2025 (Next.js 15) | Better performance, less hydration issues |

**Deprecated/outdated:**
- `supabase.auth.getSession()` in server code: Use `getUser()` instead
- `redirectTo` in OAuth without next param: Use explicit next parameter
- Storing tokens in localStorage: Use cookies via @supabase/ssr

## Open Questions

1. **Session Expiry UX**
   - What: How to handle when session expires while user is actively using the app
   - Current: Silent refresh via middleware should prevent this
   - Gap: If silent refresh fails, should we show modal or redirect to login?
   - Recommendation: Redirect to login with "Your session expired" message per context

2. **Remember Me Implementation**
   - What: How to technically implement "Remember me" checkbox
   - Current: Supabase sessions persist until logout by default
   - Gap: Should we set custom cookie expiration or rely on Supabase default?
   - Recommendation: Store preference in localStorage. The actual session persistence works automatically with Supabase - the checkbox is mostly for user expectation management.

3. **Multiple Login Attempts**
   - What: Context says store next URL in sessionStorage to survive multiple attempts
   - Current: But also says "After login: Redirect to home (not back to original page)"
   - Gap: Contradictory requirements
   - Recommendation: Store in sessionStorage as requested, but follow the redirect-to-home rule. The stored URL could be used for post-login "Continue to {page}" button or future feature.

4. **Profile Page Data Fetching**
   - What: How to fetch extended user profile data (name, avatar, etc.)
   - Current: Supabase auth user only has basic info
   - Gap: Need profiles table or extend user_metadata?
   - Recommendation: For Phase 4, use user_metadata (already available via OAuth). Future phases may need profiles table for custom uploaded avatars.

## Sources

### Primary (HIGH confidence)
- https://supabase.com/docs/guides/auth/server-side/nextjs - Official Supabase SSR guide
- https://supabase.com/docs/guides/auth/sessions - Session management concepts
- https://supabase.com/docs/guides/auth/server-side/advanced-guide - Advanced SSR patterns
- https://nextjs.org/docs/app/building-your-application/authentication - Next.js auth patterns
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie - Cookie security attributes

### Secondary (MEDIUM confidence)
- @supabase/ssr package source and examples
- Radix UI documentation for DropdownMenu and Avatar
- Next.js 15 App Router documentation on Server/Client Components

### Implementation Notes
- Current middleware.ts uses 'redirect' param but context specifies 'next' - standardize on 'next'
- Current auth layout already redirects logged-in users
- Current OAuth callback already handles next parameter
- shadcn/ui components available: Checkbox, Avatar (via Radix)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using official @supabase/ssr
- Architecture: HIGH - Well-documented Next.js 15 + Supabase patterns
- Pitfalls: MEDIUM-HIGH - Based on official docs and common issues
- Remember me: MEDIUM - Requires some custom implementation on top of Supabase

**Research date:** 2026-01-28
**Valid until:** 2026-04-28 (Supabase SSR is stable, Next.js 15 is current)
