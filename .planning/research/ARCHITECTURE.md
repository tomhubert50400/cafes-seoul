# Supabase Auth Architecture for Next.js 16 App Router

**Research Date:** 2026-01-27
**Target:** Authentication integration for cafes-seoul project
**Scope:** Architecture components, data flows, and implementation patterns

---

## Executive Summary

Supabase Auth with Next.js 16 App Router uses a **cookie-based session management** architecture where:
- **Middleware** handles automatic token refresh on every request
- **Server clients** read cookies but cannot write them (Server Components)
- **Browser clients** manage client-side auth state
- **Server Actions** handle mutations (login, signup, logout)
- **OAuth callbacks** exchange authorization codes for sessions

The architecture maintains **Server Components as default**, leveraging RSC for secure data fetching while using Client Components only for interactive auth UI.

---

## Component Architecture

### 1. Client Factory Layer

#### 1.1 Browser Client (`src/lib/supabase/client.ts`)
**Status:** EXISTS
**Purpose:** Client-side authentication and data fetching

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Characteristics:**
- **Singleton pattern** - same instance reused across calls
- Uses `document.cookie` automatically
- Used in Client Components (`'use client'`)
- Handles interactive auth operations (forms, buttons)

**When to use:**
- Login/signup form submissions from client components
- Client-side navigation after auth state changes
- Real-time subscriptions requiring auth context

---

#### 1.2 Server Client (`src/lib/supabase/server.ts`)
**Status:** EXISTS
**Purpose:** Server-side data fetching with auth context

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component cookie writes fail silently
            // Middleware handles session refresh
          }
        },
      },
    }
  )
}
```

**Characteristics:**
- **Read-only cookie access** in Server Components
- Cookie writes fail silently (by design)
- Used in Server Components, Route Handlers, Server Actions
- Must call `cookies()` before Supabase client creation for proper caching

**When to use:**
- Fetching user-specific data in Server Components
- Server Actions for auth mutations (login, signup, logout)
- Route Handlers for API endpoints requiring auth
- Protected page data loading

---

### 2. Middleware Layer

#### 2.1 Session Refresh Middleware (`src/middleware.ts` + `src/lib/supabase/middleware.ts`)
**Status:** EXISTS
**Purpose:** Automatic session token refresh and route protection

**Root Middleware (`src/middleware.ts`):**
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Session Update Logic (`src/lib/supabase/middleware.ts`):**
```typescript
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // MUST set on both request AND response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Call getUser() to trigger token refresh
  const { data: { user } } = await supabase.auth.getUser()

  // Protected route logic
  const protectedPaths = ['/profile', '/favorites']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Auth page redirect logic
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Critical Session Refresh Flow:**
1. Browser sends request with cookies containing access/refresh tokens
2. Middleware creates server client with cookie handlers
3. `supabase.auth.getUser()` checks token expiration
4. If expired, calls Supabase Auth `/token?grant_type=refresh_token`
5. `setAll` updates BOTH request and response cookies
6. Response with fresh tokens returned to browser

**Why This Matters:**
- Prevents stale session errors in Server Components
- Handles the "returning after long absence" scenario (e.g., opening tab after overnight)
- Runs on EVERY request (excluding static assets)

---

### 3. Route Structure

#### 3.1 Existing Route Groups
```
src/app/
├── (auth)/           # Auth-related pages
│   ├── login/       # Login page (EMPTY)
│   └── signup/      # Signup page (EMPTY)
├── (main)/          # Public pages
│   ├── cafes/       # Cafe listings
│   ├── districts/   # District pages
│   ├── map/         # Map view
│   └── profile/     # User profile (protected)
├── api/             # API routes
├── page.tsx         # Homepage
└── layout.tsx       # Root layout
```

#### 3.2 Required Auth Routes (TO BUILD)

**Login Page (`src/app/(auth)/login/page.tsx`):**
- Client Component with form
- Server Action for authentication
- Redirect handling from protected routes

**Signup Page (`src/app/(auth)/signup/page.tsx`):**
- Client Component with form
- Server Action for registration
- Email confirmation handling

**OAuth Callback (`src/app/auth/callback/route.ts`):**
- Route Handler for OAuth code exchange
- Handles Google/GitHub/etc. redirects
- Must handle `x-forwarded-host` for production

**Auth Error Page (`src/app/auth/auth-code-error/page.tsx`):**
- Fallback for failed OAuth exchanges
- User-friendly error messaging

---

### 4. Server Actions Layer

#### 4.1 Authentication Actions (`src/app/(auth)/login/actions.ts`)
**Status:** TO CREATE
**Purpose:** Handle auth mutations (login, signup, logout)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/auth/confirm-email')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
```

**Key Patterns:**
- Always call `createClient()` at the start
- Use `revalidatePath('/', 'layout')` to bust Next.js cache
- Use `redirect()` for navigation (throws, so no return needed)
- Extract form data using `FormData.get()`
- Handle errors with redirects to error pages

---

#### 4.2 OAuth Actions
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  if (data.url) {
    redirect(data.url) // Redirect to OAuth provider
  }
}
```

---

### 5. OAuth Callback Handler

#### 5.1 Callback Route (`src/app/auth/callback/route.ts`)
**Status:** TO CREATE
**Purpose:** Exchange OAuth authorization code for session

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // Security: ensure redirect is relative
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

**Critical Details:**
- Handles OAuth providers (Google, GitHub, etc.)
- Uses PKCE flow (Proof Key for Code Exchange)
- Must handle `x-forwarded-host` for Vercel/load balancers
- Validates redirect URL for security
- Falls back to error page on failure

---

### 6. Protected Route Patterns

#### 6.1 Server Component Protection
**CRITICAL:** Always use `getUser()` for auth checks, NEVER `getSession()` in server code.

```typescript
// src/app/(main)/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()

  // CORRECT: Validates JWT signature against Supabase public keys
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user-specific data
  const { data: favorites } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {/* Render favorites */}
    </div>
  )
}
```

**Why `getUser()` not `getSession()`:**
- `getUser()` validates JWT signature cryptographically
- `getSession()` only reads from cookies (can be spoofed)
- Server-side code MUST verify token authenticity

---

#### 6.2 Middleware-Based Protection (CURRENT APPROACH)
```typescript
// Already implemented in src/lib/supabase/middleware.ts
const protectedPaths = ['/profile', '/favorites']
const isProtectedPath = protectedPaths.some((path) =>
  request.nextUrl.pathname.startsWith(path)
)

if (isProtectedPath && !user) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}
```

**Benefits:**
- Centralized route protection
- Runs before page renders (faster redirects)
- Preserves redirect URL for post-login navigation

---

### 7. Data Flow Diagrams

#### 7.1 Initial Page Load (Cold Start)
```
User Request → Middleware → Session Refresh → Protected Route Check
                    ↓
            Supabase Auth API
         (refresh token if expired)
                    ↓
            Updated Cookies → Response
                    ↓
            Server Component
                    ↓
            getUser() → Fetch Data → Render
```

#### 7.2 Login Flow (Email/Password)
```
User fills form → Client Component → formAction
                                          ↓
                                    Server Action
                                          ↓
                              createClient (server)
                                          ↓
                    signInWithPassword(email, password)
                                          ↓
                              Supabase Auth API
                                          ↓
                        Session cookies set automatically
                                          ↓
                    revalidatePath('/', 'layout')
                                          ↓
                              redirect('/')
                                          ↓
                          Middleware refreshes
                                          ↓
                            User logged in
```

#### 7.3 OAuth Flow (Google/GitHub)
```
User clicks OAuth button → Client Component → formAction
                                                   ↓
                                           Server Action
                                                   ↓
                                   signInWithOAuth(provider)
                                                   ↓
                                    Supabase generates URL
                                                   ↓
                              redirect(data.url) → OAuth Provider
                                                   ↓
                                    User authorizes
                                                   ↓
                          Provider redirects to /auth/callback?code=...
                                                   ↓
                              Route Handler (GET)
                                                   ↓
                          exchangeCodeForSession(code)
                                                   ↓
                              Supabase Auth API
                                                   ↓
                          Session cookies set
                                                   ↓
                              redirect('/') or redirect(next)
                                                   ↓
                          Middleware refreshes
                                                   ↓
                              User logged in
```

#### 7.4 Token Refresh (Automatic)
```
Middleware runs → getUser() → Check token expiry
                                    ↓
                            Token expired?
                                    ↓
                    POST /token?grant_type=refresh_token
                                    ↓
                            Supabase Auth API
                                    ↓
                    Returns new access_token + refresh_token
                                    ↓
                    setAll() updates request & response cookies
                                    ↓
                    Request continues with fresh token
```

---

## File/Folder Structure for Auth

### Recommended Organization
```
src/
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser client factory
│       ├── server.ts           # Server client factory
│       ├── middleware.ts       # Session refresh logic
│       └── transforms.ts       # (existing)
├── middleware.ts               # Root middleware
├── app/
│   ├── (auth)/                # Auth route group
│   │   ├── login/
│   │   │   ├── page.tsx       # Login UI (Client Component)
│   │   │   └── actions.ts     # login() server action
│   │   ├── signup/
│   │   │   ├── page.tsx       # Signup UI (Client Component)
│   │   │   └── actions.ts     # signup() server action
│   │   └── confirm-email/
│   │       └── page.tsx       # Email confirmation message
│   ├── auth/                  # Auth utilities (not a route group)
│   │   ├── callback/
│   │   │   └── route.ts       # OAuth callback handler
│   │   └── auth-code-error/
│   │       └── page.tsx       # OAuth error page
│   ├── (main)/                # Main app routes
│   │   ├── profile/
│   │   │   └── page.tsx       # Protected user profile
│   │   ├── favorites/
│   │   │   └── page.tsx       # Protected favorites (TO CREATE)
│   │   ├── cafes/             # (existing)
│   │   ├── districts/         # (existing)
│   │   └── map/               # (existing)
│   └── layout.tsx             # Root layout (add auth context)
└── components/
    ├── auth/
    │   ├── LoginForm.tsx      # Reusable login form
    │   ├── SignupForm.tsx     # Reusable signup form
    │   └── OAuthButtons.tsx   # Google/GitHub buttons
    └── layout/
        └── UserMenu.tsx       # User dropdown (show when logged in)
```

---

## Server vs Client Component Boundaries

### Server Components (Default)
**When to use:**
- Fetching user-specific data
- Displaying static auth UI (email confirmation pages)
- Protected page layouts
- Any component that only reads auth state

**Why:**
- No JavaScript sent to client
- Direct database access via Supabase RLS
- Secure token validation
- Better performance

**Example:**
```typescript
// src/app/(main)/profile/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <div>Welcome {user?.email}</div>
}
```

---

### Client Components
**When to use:**
- Interactive forms (login, signup)
- Real-time auth state (useEffect, useState)
- OAuth buttons requiring client-side redirects
- Components with browser-only APIs

**Why:**
- Forms need interactivity (onChange, onSubmit)
- Client-side navigation after auth actions
- Real-time session listeners

**Example:**
```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { login } from './actions'

export default function LoginPage() {
  return (
    <form action={login}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Log in</button>
    </form>
  )
}
```

**Critical Pattern:**
- Form UI = Client Component
- Form submission = Server Action
- This keeps sensitive logic server-side while maintaining UX

---

## Build Order Implications

### Phase 1: Foundation (Core Auth Infrastructure)
**Goal:** Establish cookie-based session management

1. **Middleware** - Already exists, may need updates for new protected routes
2. **Server Client** - Already exists (`src/lib/supabase/server.ts`)
3. **Browser Client** - Already exists (`src/lib/supabase/client.ts`)

**Validation:** Middleware successfully refreshes tokens on cold starts

---

### Phase 2: Email/Password Authentication
**Goal:** Basic login/signup flows

1. **Server Actions** - Create `src/app/(auth)/login/actions.ts`
   - `login(formData)` function
   - `signup(formData)` function
   - `signout()` function

2. **Login Page** - Create `src/app/(auth)/login/page.tsx`
   - Client Component with form
   - Call `login` action on submit
   - Link to signup page

3. **Signup Page** - Create `src/app/(auth)/signup/page.tsx`
   - Client Component with form
   - Call `signup` action on submit
   - Link to login page

4. **Email Confirmation Page** - Create `src/app/(auth)/confirm-email/page.tsx`
   - Static page with instructions
   - Server Component (no interactivity)

**Validation:** Users can sign up, receive confirmation email, and log in

**Dependencies:** Phase 1 must be complete (middleware handles session refresh)

---

### Phase 3: OAuth Integration
**Goal:** Social login (Google, GitHub)

1. **OAuth Callback Handler** - Create `src/app/auth/callback/route.ts`
   - Route Handler for GET requests
   - Exchange code for session
   - Handle production vs local env redirects

2. **OAuth Error Page** - Create `src/app/auth/auth-code-error/page.tsx`
   - User-friendly error messaging
   - Link back to login

3. **OAuth Actions** - Extend `src/app/(auth)/login/actions.ts`
   - `signInWithGoogle()` function
   - `signInWithGitHub()` function

4. **OAuth Buttons** - Update login page
   - Add OAuth button components
   - Style consistently with brand

5. **Supabase Configuration** - Dashboard setup
   - Enable Google/GitHub providers
   - Configure callback URLs
   - Set up OAuth apps in Google/GitHub

**Validation:** Users can log in with Google/GitHub and land on correct page

**Dependencies:** Phase 2 must be complete (core auth flow working)

---

### Phase 4: Protected Routes
**Goal:** Restrict access to authenticated users

1. **Update Middleware** - Extend protected paths list
   - Add `/favorites` to protected paths
   - Add any new protected routes

2. **Profile Page** - Enhance `src/app/(main)/profile/page.tsx`
   - Fetch user data
   - Display user info
   - Add edit functionality (if needed)

3. **Favorites Page** - Create `src/app/(main)/favorites/page.tsx`
   - Server Component
   - Fetch user's favorite cafes
   - Display in list/grid

4. **User Menu** - Create `src/components/layout/UserMenu.tsx`
   - Show when logged in
   - Display user avatar/email
   - Logout button

**Validation:** Unauthenticated users redirected to login, authenticated users see protected content

**Dependencies:** Phase 2 complete (login/signup working)

---

### Phase 5: Auth UI/UX Polish
**Goal:** Production-ready auth experience

1. **Form Validation** - Add client-side validation
   - Email format
   - Password strength
   - Confirmation matching

2. **Loading States** - Add pending UI
   - useFormStatus hook
   - Disabled buttons during submission
   - Loading spinners

3. **Error Handling** - Improve error display
   - Show error messages inline
   - Toast notifications (using sonner)
   - Field-level errors

4. **Redirect Flow** - Preserve intended destination
   - Capture redirect URL in middleware
   - Pass to login page
   - Navigate after successful login

**Validation:** Smooth UX with no confusing states

**Dependencies:** Phases 2-4 complete (all auth flows working)

---

## Environment Variables

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional (for production):**
```env
NEXT_PUBLIC_SITE_URL=https://cafes-seoul.com
```

**Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser.

---

## Security Considerations

### 1. Never Trust `getSession()` on Server
- Always use `getUser()` in Server Components
- `getSession()` only reads cookies (no validation)
- `getUser()` validates JWT signature against Supabase keys

### 2. Validate Redirect URLs
```typescript
let next = searchParams.get('next') ?? '/'
if (!next.startsWith('/')) {
  next = '/' // Prevent open redirect vulnerability
}
```

### 3. Row Level Security (RLS)
- Enable RLS on all Supabase tables
- Use `auth.uid()` in policies
- Example policy:
  ```sql
  CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);
  ```

### 4. Cookie Security
- Supabase SSR sets `httpOnly`, `secure`, `sameSite` automatically
- Tokens stored in cookies, not localStorage (XSS protection)
- 400-day max age (Supabase default)

---

## Testing Strategy

### Unit Tests
- Test Server Actions in isolation
- Mock Supabase client
- Verify redirect logic

### Integration Tests
- Test OAuth callback code exchange
- Test middleware session refresh
- Test protected route redirects

### E2E Tests
- Full login/signup flows
- OAuth flows (may need mocking)
- Protected route access

---

## References

### Official Documentation
- [Supabase Auth with Next.js Server-Side](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth Helpers Migration Guide](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [Next.js 16 App Router Documentation](https://nextjs.org/docs)

### Context7 Documentation
- `/supabase/ssr` - SSR client patterns
- `/supabase/supabase-js` - Auth methods and examples

### Web Resources
- [Setting up Server-Side Auth for Next.js | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Build a User Management App with Next.js | Supabase Docs](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Supabase & Next.js App Router Starter Template](https://vercel.com/templates/next.js/supabase)

---

## Quality Gate Checklist

- [x] Components clearly defined with boundaries
  - Browser client vs Server client distinction clear
  - Middleware role explicit
  - OAuth callback handler defined
  - Server Actions vs Route Handlers clarified

- [x] Data flow direction explicit
  - Diagram 7.1: Initial page load
  - Diagram 7.2: Email/password login
  - Diagram 7.3: OAuth flow
  - Diagram 7.4: Token refresh

- [x] Build order implications noted
  - Phase 1: Foundation (middleware, clients)
  - Phase 2: Email/password auth
  - Phase 3: OAuth integration
  - Phase 4: Protected routes
  - Phase 5: UI/UX polish
  - Dependencies between phases explicit

---

## Next Steps for Planning

When creating ROADMAP.md phases, use this architecture to:

1. **Phase boundaries** align with build order (Phases 1-5 above)
2. **File creation order** follows dependency graph
3. **Testing checkpoints** after each phase
4. **Environment setup** as Phase 0 or prerequisite
5. **Database migrations** (RLS policies) in parallel with Phase 4

**Example Phase Structure:**
```
Phase 1: Auth Foundation
├── 1.1 Verify middleware configuration
├── 1.2 Test token refresh on cold start
└── 1.3 Add environment variables

Phase 2: Email/Password Auth
├── 2.1 Create login server actions
├── 2.2 Build login page UI
├── 2.3 Create signup server actions
├── 2.4 Build signup page UI
└── 2.5 Add email confirmation page
```

---

**End of Architecture Research**
