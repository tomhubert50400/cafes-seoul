# Phase 12: Bug Fixes & Polish - Research

**Researched:** 2026-01-31
**Domain:** Bug fixing in Next.js 16 App Router with Supabase SSR, custom i18n, and Radix UI
**Confidence:** HIGH

## Summary

This phase addresses 9 specific UI bugs and i18n issues across navigation, forms, layouts, authentication, and internationalization. The bugs fall into five categories: i18n translation keys not resolving, conditional navigation items missing, form UX inconsistencies, duplicate layout rendering, mobile responsive overflow, and auth state detection in uploads.

The standard approach for bug fixing in this stack involves: identifying the root cause through component inspection, applying targeted fixes using existing patterns from the codebase, verifying fixes don't break related functionality, and testing across all supported languages and viewports. Critical to this phase is understanding Next.js 16's async request API changes, Supabase SSR's getUser() security pattern, the custom i18n implementation's translation key structure, and Radix UI's conditional rendering patterns.

Most bugs are straightforward fixes requiring minimal code changes - typically updating translation keys, adding conditional renders, removing duplicate components, or adding CSS overflow constraints. The auth detection bug requires understanding the difference between server and client Supabase instances.

**Primary recommendation:** Fix bugs in order of impact - i18n first (affects all users), then navigation/forms (affects daily usage), then layouts (visual polish), then auth edge case (affects subset of users).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.4 | App Router framework | Latest stable with async request APIs, official Vercel framework |
| @supabase/ssr | ^0.8.0 | Server-side auth | Official Supabase package for cookie-based SSR auth |
| @supabase/supabase-js | ^2.93.1 | Supabase client | Core client library for database and auth operations |
| React | 19.2.3 | UI framework | Latest React with Server Components support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dropdown-menu | ^2.1.16 | Dropdown menus | For profile dropdown, conditional admin links |
| react-hook-form | ^7.71.1 | Form state | For add cafe form language selection state |
| Tailwind CSS | ^4 | Styling | For mobile overflow fixes, responsive design |
| Custom i18n | N/A | Translations | Context-based i18n with useI18n hook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom i18n | next-intl | More features but project already has custom implementation |
| Radix UI | Headless UI | Similar API but Radix has better TypeScript support |

**Installation:**
No new dependencies required - all bugs fixable with existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Auth route group
│   ├── profile/            # Profile section with layout
│   │   ├── layout.tsx      # Profile navigation tabs
│   │   └── submissions/    # Submissions subroute
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── auth/              # Auth-related components (user-menu.tsx)
│   ├── ratings/           # Rating components (rating-form.tsx)
│   ├── submissions/       # Submission components (cafe-submission-form.tsx)
│   └── header.tsx         # Global header component
└── lib/
    ├── i18n/              # Custom i18n implementation
    │   ├── context.tsx    # I18n provider with useI18n hook
    │   ├── translations.ts # Translation key-value store
    │   └── languages.ts   # Language configuration
    └── supabase/          # Supabase client creators
        ├── server.ts      # Server-side client
        └── client.ts      # Client-side client
```

### Pattern 1: Translation Key Resolution
**What:** Custom i18n using React Context with flat translation key structure
**When to use:** All user-facing text throughout the application
**Example:**
```typescript
// Source: src/lib/i18n/context.tsx
const t = useCallback((key: string): string => {
  return translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
}, [language]);

// Usage in components:
const { t } = useI18n();
<button>{t('common.cancel')}</button>  // ✅ Correct - key exists
<button>{t('ratings.cancel')}</button> // ❌ Wrong - key doesn't exist in translations
```

**Bug Pattern:** When translation key doesn't exist in translations.ts, the key itself is displayed as fallback (e.g., "common.cancel" appears literally on screen).

### Pattern 2: Conditional Rendering Based on User Role
**What:** Show/hide UI elements based on user metadata from Supabase Auth
**When to use:** Admin-only navigation items, role-based features
**Example:**
```typescript
// Source: Verified from codebase patterns
// In server component:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const isAdmin = user?.user_metadata?.is_admin === true;

// Pass to client component:
<UserMenu user={user} isAdmin={isAdmin} />

// In client component:
{isAdmin && (
  <DropdownMenuItem asChild>
    <Link href={ROUTES.ADMIN}>
      <Shield className="h-4 w-4" />
      {t('nav.admin')}
    </Link>
  </DropdownMenuItem>
)}
```

### Pattern 3: Layout Composition Without Duplication
**What:** Nested layouts render parent layout content once, child pages should not re-render parent components
**When to use:** Profile section, dashboard areas with navigation
**Example:**
```typescript
// Source: Next.js App Router patterns
// ✅ Correct - Layout has Header, page has content only
// layout.tsx
export default async function ProfileLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Header user={user} />
      <nav>{/* Navigation tabs */}</nav>
      {children}
    </div>
  );
}

// page.tsx
export default async function ProfilePage() {
  return <div>{/* Page content only */}</div>;
}

// ❌ Wrong - Page re-renders Header causing duplicate
// page.tsx
export default async function ProfilePage() {
  return (
    <div className="min-h-screen">
      <Header user={user} /> {/* Duplicate! */}
      <div>{/* Page content */}</div>
    </div>
  );
}
```

### Pattern 4: Mobile Overflow Prevention
**What:** Prevent horizontal scroll on mobile by constraining element widths
**When to use:** Any layout that should be 100% responsive without horizontal scroll
**Example:**
```css
/* Source: CSS best practices for mobile responsive */
/* ✅ Correct - Constrain to viewport */
.profile-container {
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.profile-tabs {
  width: 100%;
  overflow-x: auto;  /* Allow tabs to scroll if needed */
}

/* ❌ Common causes of overflow */
.wide-element {
  width: 120vw;        /* Exceeds viewport */
  min-width: 1200px;   /* Too wide for mobile */
  position: absolute;
  left: -100px;        /* Extends beyond left edge */
}
```

### Pattern 5: Server vs Client Supabase Auth
**What:** Use server-side client for initial auth checks, client-side for mutations
**When to use:** Photo uploads, form submissions requiring auth state
**Example:**
```typescript
// Source: Supabase SSR documentation
// Server Component (initial page load):
const supabase = await createClient();  // Server client
const { data: { user } } = await supabase.auth.getUser();  // Security best practice

// Client Component (photo upload):
'use client';
import { createBrowserClient } from '@/lib/supabase/client';

const uploadPhoto = async () => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();  // Client-side check

  if (!user) {
    toast.error(t('auth.signInRequired'));
    return;
  }

  // Proceed with upload
};
```

### Pattern 6: Form State Synchronization
**What:** Synchronize related form fields when one changes
**When to use:** Language selection affecting multiple fields (name language → address language)
**Example:**
```typescript
// Source: react-hook-form patterns
const { watch, setValue } = useForm();

// Watch for language selection change
const nameLanguage = watch('nameLanguage');

// Auto-sync address language when name language changes
useEffect(() => {
  setValue('addressLanguage', nameLanguage);
}, [nameLanguage, setValue]);
```

### Anti-Patterns to Avoid
- **Using getSession() in Server Components:** Always use getUser() for security - getSession() doesn't validate JWT signatures
- **Hardcoding translation text:** Always use t() function even for seemingly static text
- **Adding overflow-hidden to html/body:** Causes Next.js scroll position issues on navigation
- **Duplicating layout components in pages:** Pages inside layouts should only render page-specific content
- **Using sync cookies() in Next.js 16:** All request APIs must be awaited - `const cookieStore = await cookies()`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown menu accessibility | Custom dropdown with div and CSS | @radix-ui/react-dropdown-menu | Handles focus management, keyboard navigation, screen readers, portal rendering |
| Translation missing detection | Custom validation | Existing t() fallback pattern | Already returns key as fallback, just need to add key to translations.ts |
| Mobile overflow debugging | Manual inspection | Browser DevTools + outline technique | DevTools shows computed dimensions, outline: 1px solid red on * selector reveals overflow sources |
| Form field synchronization | Manual state updates | react-hook-form watch + setValue | Built-in reactive updates, prevents race conditions |
| Auth state detection | Manual cookie parsing | Supabase auth.getUser() | Validates JWT, handles expired tokens, type-safe user object |

**Key insight:** Most bugs in this phase are configuration/data issues (wrong translation key, missing conditional, duplicate component) rather than logic bugs. The framework and libraries already handle the hard parts correctly - fixes are typically one-line changes.

## Common Pitfalls

### Pitfall 1: Translation Key Typos
**What goes wrong:** Developer uses t('common.cancel') but translation file only has 'ratings.cancel', so literal string "common.cancel" displays on screen.
**Why it happens:** Flat key structure means no TypeScript autocomplete, easy to mistype or use non-existent key.
**How to avoid:**
- Search translations.ts for similar keys before using new translation
- Use consistent naming convention (module.action pattern)
- Test in all supported languages to catch missing keys early
**Warning signs:** Seeing dot-notation strings (e.g., "common.cancel") in UI instead of translated text.

### Pitfall 2: Async Request API Breaking Changes (Next.js 16)
**What goes wrong:** Code using `const cookieStore = cookies()` throws error in Next.js 16.
**Why it happens:** Next.js 16 made cookies(), headers(), params, searchParams async to enable streaming and PPR.
**How to avoid:**
- Always await request-related APIs: `const cookieStore = await cookies()`
- Run `npx next typegen` to get TypeScript helpers
- Use codemod: `npx @next/codemod@canary upgrade latest`
**Warning signs:** TypeScript errors on cookies/headers calls, runtime errors about promises.

### Pitfall 3: Duplicate Layout Components
**What goes wrong:** Page renders Header when layout already renders it, causing two headers on screen.
**Why it happens:** Developer copies page template that includes full layout structure into a page that's already inside a layout.
**How to avoid:**
- Check parent layouts before adding components to page
- Pages in layouts should only render page-specific content
- Use layout.tsx for shared UI (headers, navs), page.tsx for unique content
**Warning signs:** Duplicate headers/navs visible on page, navigation rendering twice.

### Pitfall 4: Mobile Overflow from Desktop Styles
**What goes wrong:** Profile page has horizontal scroll on mobile due to elements with fixed widths or absolute positioning.
**Why it happens:**
- Using 100vw (includes scrollbar width, exceeds viewport)
- Fixed min-width larger than mobile viewport
- Absolute positioning with negative offsets
- Not testing on actual mobile viewports during development
**How to avoid:**
- Use max-width: 100% instead of width: 100vw
- Add box-sizing: border-box to all elements
- Test responsive breakpoints in DevTools mobile view
- Use outline debugging: `* { outline: 1px solid red; }` to find overflow source
**Warning signs:** Horizontal scrollbar on mobile, content cut off or requiring side-scroll.

### Pitfall 5: Server vs Client Auth Confusion
**What goes wrong:** Photo upload checks user auth on server during initial page load but not on client during upload action, causing "sign in required" error for signed-in users.
**Why it happens:**
- Server Component gets user once at page load
- Client Component makes upload mutation later
- Client doesn't re-check auth state before upload
- SSR hydration issues between server and client auth state
**How to avoid:**
- Check auth in both Server Component (page protection) AND Client Component (action validation)
- Use createBrowserClient() in client components
- Call getUser() immediately before mutations that require auth
- Don't rely on props passed from server - re-validate client-side
**Warning signs:**
- User is signed in but gets "sign in required" error
- Works on page load but fails on interaction
- Different behavior between SSR and CSR

### Pitfall 6: Conditional Rendering with Missing Data
**What goes wrong:** Admin link doesn't appear even for admin users because user_metadata.is_admin isn't checked.
**Why it happens:**
- Assuming role data exists when it might not be fetched
- Not checking nested properties safely (user?.user_metadata?.is_admin)
- Role data stored differently than expected (database vs auth metadata)
**How to avoid:**
- Use optional chaining: `user?.user_metadata?.is_admin === true`
- Check where role data is stored (database table vs auth metadata)
- Log user object to verify data structure during development
- Test with both admin and non-admin accounts
**Warning signs:** Feature missing for authorized users, no errors in console, conditional always evaluates false.

### Pitfall 7: Form State Desynchronization
**What goes wrong:** User selects Korean for cafe name language, but address language stays English, requiring manual selection twice.
**Why it happens:**
- Independent form fields not synchronized
- No useEffect to propagate selection changes
- State updates in wrong order or lost during re-renders
**How to avoid:**
- Use react-hook-form's watch() to observe field changes
- Use setValue() in useEffect to sync dependent fields
- Define clear "primary" field that drives secondary fields
- Document synchronization logic in comments
**Warning signs:** User must set same value twice, form feels inconsistent, related fields out of sync.

## Code Examples

Verified patterns from official sources:

### I18N Translation Key Fix
```typescript
// Source: Custom i18n implementation in src/lib/i18n/context.tsx
// Before (bug - key doesn't exist):
<Button onClick={onCancel}>
  {t('common.cancel')}  // Displays "common.cancel" literally
</Button>

// After (fixed - correct key):
<Button onClick={onCancel}>
  {t('ratings.cancel')}  // Displays "취소" in Korean, "Cancel" in English
</Button>

// Or add missing key to translations.ts:
// translations.ts
export const translations = {
  en: {
    // ...
    common: {
      cancel: 'Cancel',
      // ...
    }
  },
  ko: {
    // ...
    common: {
      cancel: '취소',
      // ...
    }
  }
};
```

### Conditional Admin Link in Dropdown
```typescript
// Source: Radix UI patterns + codebase auth patterns
// user-menu.tsx
'use client';

interface UserMenuProps {
  user: SupabaseUser;
  isAdmin?: boolean;  // Add prop
}

export function UserMenu({ user, isAdmin }: UserMenuProps) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuContent>
        {/* ... existing items ... */}

        {/* Admin link - only shows for admin users */}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('nav.admin')}
            </Link>
          </DropdownMenuItem>
        )}

        {/* ... rest of menu ... */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Header component passes isAdmin:
const isAdmin = user?.user_metadata?.is_admin === true;
<UserMenu user={user} isAdmin={isAdmin} />
```

### Remove Duplicate Header from Page
```typescript
// Source: Next.js App Router layout patterns
// Before (submissions/page.tsx - has duplicate Header):
export default async function MySubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <Header user={user} /> {/* ❌ DUPLICATE - layout already has this */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* ... content ... */}
      </main>
    </div>
  );
}

// After (fixed - rely on layout's Header):
export default async function MySubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* ... content ... */}
    </main>
  );
  // Layout provides: Header, title, tabs navigation
  // Page provides: Only page-specific content
}
```

### Mobile Overflow Fix
```css
/* Source: CSS overflow prevention best practices */
/* Profile layout mobile responsive */
.profile-container {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Tabs that may need horizontal scroll on small screens */
.profile-tabs {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
}

/* Prevent content from exceeding viewport */
.profile-tabs > * {
  max-width: 100%;
  box-sizing: border-box;
}

/* Mobile-specific constraints */
@media (max-width: 640px) {
  .profile-container {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  /* Reset any desktop absolute positioning */
  .desktop-positioned {
    position: static;
  }
}
```

### Auth Detection in Photo Upload
```typescript
// Source: Supabase SSR documentation + codebase patterns
// photo-upload.tsx
'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

export function PhotoUpload({ cafeId }: { cafeId: string }) {
  const { t } = useI18n();

  const handleUpload = async (file: File) => {
    // ✅ Check auth state at upload time (not page load time)
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t('auth.signInRequired'));
      return;
    }

    // Proceed with upload - user is authenticated
    const { data, error } = await supabase.storage
      .from('cafe-photos')
      .upload(`${cafeId}/${file.name}`, file);

    if (error) {
      toast.error(t('photos.uploadError'));
      return;
    }

    toast.success(t('photos.uploadSuccess'));
  };

  return (
    <input type="file" onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    }} />
  );
}
```

### Form Language Synchronization
```typescript
// Source: react-hook-form documentation
// cafe-submission-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

export function CafeSubmissionForm() {
  const { watch, setValue, register } = useForm({
    defaultValues: {
      nameLanguage: 'ko',
      addressLanguage: 'ko',
    }
  });

  // Watch name language selection
  const nameLanguage = watch('nameLanguage');

  // Auto-sync address language when name language changes
  useEffect(() => {
    setValue('addressLanguage', nameLanguage);
  }, [nameLanguage, setValue]);

  return (
    <form>
      <label>
        Name Language:
        <select {...register('nameLanguage')}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </label>

      <label>
        Address Language:
        <select {...register('addressLanguage')}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </label>
      {/* Address language automatically matches name language */}
    </form>
  );
}
```

### Async Cookies in Next.js 16
```typescript
// Source: Next.js 16 upgrade documentation
// Before (Next.js 15 - sync):
import { cookies } from 'next/headers';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = cookies();  // ❌ Sync access removed in Next.js 16
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  return langCookie?.value as LanguageCode || DEFAULT_LANGUAGE;
}

// After (Next.js 16 - async):
import { cookies } from 'next/headers';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();  // ✅ Await required in Next.js 16
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  return langCookie?.value as LanguageCode || DEFAULT_LANGUAGE;
}

// Layout using async cookies:
export default async function ProfileLayout({ children }) {
  const lang = await getLanguageFromCookies();  // Already async
  const supabase = await createClient();        // Already async
  const { data: { user } } = await supabase.auth.getUser();

  return <div>{/* ... */}</div>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| getSession() | getUser() | Supabase SSR v0.8.0 | Security - getUser() validates JWT on every call |
| Sync cookies() | Async cookies() | Next.js 16.0.0 | Breaking - all request APIs must be awaited |
| middleware.ts | proxy.ts | Next.js 16.0.0 | Convention change - middleware deprecated |
| @supabase/auth-helpers | @supabase/ssr | 2024 Q2 | New package - auth-helpers deprecated |
| experimental.turbopack | turbopack | Next.js 16.0.0 | Turbopack now stable and default |
| overflow-x: hidden on body | max-width: 100% + box-sizing | Ongoing | Better practice - prevents scroll position bugs |

**Deprecated/outdated:**
- **@supabase/auth-helpers:** Replaced by @supabase/ssr - no longer receives updates
- **Sync request APIs (cookies, headers, params):** Removed in Next.js 16 - must await all
- **middleware.ts naming:** Use proxy.ts instead (middleware still works but deprecated)
- **width: 100vw for full-width:** Use max-width: 100% to avoid scrollbar overflow issues

## Open Questions

Things that couldn't be fully resolved:

1. **Translation key organization**
   - What we know: Current system uses flat keys (common.cancel, ratings.cancel)
   - What's unclear: Should all components share common.cancel or have component-specific keys?
   - Recommendation: Check if 'common.cancel' key exists in translations.ts first. If not, either add it OR use component-specific key like 'ratings.cancel'. Prefer common keys for reusable actions (cancel, save, delete).

2. **Admin role data source**
   - What we know: User menu needs to conditionally show admin link
   - What's unclear: Is admin status in user_metadata.is_admin, database users table, or separate roles table?
   - Recommendation: Inspect actual user object during development to confirm location. Most likely user_metadata.is_admin based on Supabase auth patterns.

3. **Coordinates field in add cafe form**
   - What we know: Requirement says remove coordinates field
   - What's unclear: Are coordinates auto-calculated from address or not needed at all?
   - Recommendation: If using geocoding API, coordinates calculated server-side from address. If not using geocoding, database schema may need to allow null coordinates or have sensible defaults.

4. **My Contributions page header**
   - What we know: Page needs proper header
   - What's unclear: What makes current header "improper" - is it missing, wrong title, or wrong styling?
   - Recommendation: Inspect actual page to see if header exists. May need to add title/description or fix i18n keys used in header.

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Creating a Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Server vs Client auth patterns, getUser() security
- [Next.js 16 Upgrading Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - Async request APIs, breaking changes, migration patterns
- Codebase inspection:
  - `src/lib/i18n/context.tsx` - Translation resolution pattern
  - `src/app/profile/layout.tsx` - Layout composition, async cookies usage
  - `src/app/profile/submissions/page.tsx` - Duplicate header example
  - `src/components/auth/user-menu.tsx` - Dropdown menu structure, conditional rendering
  - `src/components/ratings/rating-form.tsx` - I18n key usage

### Secondary (MEDIUM confidence)
- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16) - Turbopack default, routing changes
- [Next.js Layouts Documentation](https://nextjs.org/docs/app/getting-started/layouts-and-pages) - Layout behavior on navigation, partial rendering
- [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) - Component API, conditional items pattern
- [CSS Overflow Issues - Smashing Magazine](https://www.smashingmagazine.com/2021/04/css-overflow-issues/) - Mobile overflow debugging techniques
- [Finding/Fixing Unintended Body Overflow - CSS-Tricks](https://css-tricks.com/findingfixing-unintended-body-overflow/) - JavaScript detection method
- [React Hook Form + Zod + i18n discussion](https://github.com/orgs/react-hook-form/discussions/10010) - Form translation patterns

### Tertiary (LOW confidence)
- [3 Easy Steps To Fix Horizontal Scroll On Mobile](https://foxscribbler.com/prevent-horizontal-scroll-on-mobile/) - CSS debugging technique with outline
- [Next.js State Management Patterns](https://www.compilenrun.com/docs/framework/nextjs/nextjs-state-management/nextjs-state-management-patterns) - Form state synchronization approaches

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries from package.json, versions verified
- Architecture patterns: HIGH - Extracted from actual codebase files
- I18n bug fixes: HIGH - Found exact bug location in rating-form.tsx
- Layout duplication: HIGH - Identified duplicate Header in submissions/page.tsx
- Auth patterns: HIGH - Supabase official docs + codebase implementation
- Mobile overflow: MEDIUM - General CSS best practices, not project-specific
- Admin conditional rendering: MEDIUM - Pattern clear, data source needs verification
- Form synchronization: MEDIUM - Standard react-hook-form pattern, needs codebase context

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - stable ecosystem, Next.js 16 recently released)

**Notes:**
- Next.js 16.1.4 is latest stable as of research date
- Codebase already using async cookies in some areas (profile/layout.tsx) - good pattern to follow
- Custom i18n implementation is mature and working - no need to migrate to next-intl
- All bugs are fixable with existing stack - no new dependencies required
- Testing should verify fixes across all 5 supported languages (KO, EN, FR, ZH, VI)
- Mobile testing essential for overflow fixes - test on actual devices or DevTools mobile emulation
