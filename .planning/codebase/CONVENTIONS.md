# Coding Conventions

**Analysis Date:** 2026-01-27

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `Header.tsx`, `CafeCard.tsx`)
- Pages: lowercase with hyphens for dynamic routes (e.g., `[slug]`, `[id]`, kebab-case for multi-word: `page-header.tsx`)
- Utilities/hooks/types: camelCase with `.ts` or `.tsx` extension
- Route handlers: `route.ts` in directory structure reflecting URL paths
- Constants: PascalCase for exported objects (e.g., `ROUTES`, `CAFE_TYPE_LABELS`, `PRICE_RANGE_LABELS`)

**Functions:**
- camelCase for all function names
- Exported React components: PascalCase
- Internal utility functions: camelCase (e.g., `getLocalizedText()`, `getStorageUrl()`, `transformCafe()`)
- Hook functions: use `use` prefix in camelCase (e.g., `useI18n()`)

**Variables:**
- camelCase for all variables and constants used in logic
- UPPER_SNAKE_CASE for environment variables and readonly constants (e.g., `CAFE_IMAGES_BUCKET`, `DEFAULT_LANGUAGE`)
- Const assertions for immutable objects: `as const` (e.g., `NAV_ITEMS = [...] as const`)

**Types:**
- PascalCase for interfaces and types (e.g., `CafeCardProps`, `SearchFiltersProps`, `I18nContextType`, `RatingStarsProps`)
- Suffix with `Props` for component prop interfaces
- Suffix with `Params` for API query parameter interfaces
- Suffix with `Response` for API response interfaces

## Code Style

**Formatting:**
- Enforced by ESLint (v9) with Next.js config
- Config file: `eslint.config.mjs`
- No Prettier configuration detected (formatting delegated to ESLint)
- Consistent use of single quotes for strings (`'use client'`, `'strict mode'`)

**Linting:**
- ESLint: v9.x with Next.js core web vitals and TypeScript support
- Configured via `eslint.config.mjs` using flat config format
- Next.js ESLint extends:
  - `eslint-config-next/core-web-vitals` - Performance and accessibility rules
  - `eslint-config-next/typescript` - TypeScript-specific rules
- Ignored directories: `.next`, `out`, `build`, `next-env.d.ts`

**TypeScript:**
- `strict: true` mode enforced in `tsconfig.json`
- Target: ES2017
- Module resolution: bundler
- Path aliases: `@/*` maps to `./src/*`
- JSX: react-jsx (no React import needed in components)

## Import Organization

**Order:**
1. External dependencies (React, Next.js, third-party packages)
2. Type imports (marked with `import type`)
3. Internal absolute imports from `@/` paths
4. Local imports (relative paths, if any)

**Path Aliases:**
- All imports use `@/` prefix for absolute imports from `src/` directory
- Example structure:
  ```typescript
  import { Button } from '@/components/ui/button';
  import { createClient } from '@/lib/supabase/server';
  import { useI18n } from '@/lib/i18n';
  import type { Cafe, CafeSummary } from '@/types/cafe';
  import type { CafeListParams } from '@/types/api';
  ```

**Example from `search-filters.tsx`:**
```typescript
'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEOUL_DISTRICTS } from '@/lib/constants/districts';
import { CAFE_TYPE_LABELS, type CafeType, getLocalizedText } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
```

## Error Handling

**Patterns:**

**API Route Error Handling:**
- Return `NextResponse.json()` with error object and HTTP status code
- Validation errors: `status: 400`
- Server errors: `status: 500`
- Error format: `{ error: string }` or `{ error: string, code?: string }`

Example from `/api/cafes/nearby/route.ts`:
```typescript
if (!lat || !lng) {
  return NextResponse.json(
    { error: 'lat and lng parameters are required' },
    { status: 400 }
  );
}

if (isNaN(latitude) || isNaN(longitude)) {
  return NextResponse.json(
    { error: 'Invalid lat or lng values' },
    { status: 400 }
  );
}

if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

**Hook Error Handling:**
- Throw descriptive errors for hook contract violations
- Example from `useI18n()` in `context.tsx`:
```typescript
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
```

**Data Transformation:**
- Cast types explicitly in transform functions using `as` keyword
- Provide fallback values for nullable fields
- Example from `transforms.ts`:
```typescript
export function transformCafeSummary(row: Record<string, unknown>): CafeSummary {
  return {
    id: row.id as string,
    name: (row.name || {}) as TranslatedText,
    overallRating: parseFloat(row.overall_rating as string) || 0,
    totalRatings: row.total_ratings as number,
    primaryImageUrl: getStorageUrl(row.primary_image_url as string | null),
  };
}
```

## Logging

**Framework:** console methods (no centralized logging library)

**Patterns:**
- No console logging found in source code (production-grade minimal logging approach)
- No debug logging framework configured
- Error messages passed through API responses

## Comments

**When to Comment:**
- Minimal commenting observed (self-documenting code preferred)
- Inline comments used only for clarification of complex logic
- Example from `cafe-card.tsx` (inline comments only):
  ```typescript
  {/* Image */}
  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
    {/* Price badge */}
    <div className="absolute right-2 top-2">
  ```

**JSDoc/TSDoc:**
- No JSDoc comments found in codebase
- Interfaces and types are self-documenting through clear naming
- Function purposes are clear from implementation

**Example of self-documenting code without comments:**
```typescript
// No comment needed - function name explains purpose
export function getLocalizedText(
  text: TranslatedText | null | undefined,
  lang: string,
  fallbackLang: string = 'en'
): string {
  if (!text) return '';
  return text[lang] || text[fallbackLang] || text['ko'] || text['en'] || Object.values(text)[0] || '';
}
```

## Function Design

**Size:**
- Functions kept concise and focused on single responsibility
- Most functions 5-50 lines in length
- Complex logic split into helper functions

**Parameters:**
- Use destructuring for object parameters in components
- Example from `CafeCard`:
  ```typescript
  interface CafeCardProps {
    cafe: CafeSummary;
    className?: string;
  }
  export function CafeCard({ cafe, className }: CafeCardProps) {
  ```

**Return Values:**
- Explicit return types in function signatures
- React components always return JSX.Element or null
- Utilities return typed values
- API routes return `NextResponse`

Example:
```typescript
export function transformCafe(row: Record<string, unknown>): Cafe {
  // returns typed object
}

export function SearchFilters({ className }: SearchFiltersProps) {
  // component returns JSX
}
```

## Module Design

**Exports:**
- Named exports preferred for components and utilities
- Example: `export function Header() { ... }`
- Single exports for components: `export function CafeCard() { ... }`

**Barrel Files:**
- Barrel files used in `@/components/ui/` for component libraries
- Not used in custom component directories
- Example structure:
  - `@/components/ui/button.tsx` exports `Button`
  - Imported as `import { Button } from '@/components/ui/button'`

**Constants Organization:**
- Global constants in `@/lib/constants/` directory
- Constants exported from type files when specific to domain (e.g., `CAFE_TYPE_LABELS` in `types/cafe.ts`)
- Example from `routes.ts`:
  ```typescript
  export const ROUTES = {
    HOME: '/',
    CAFES: '/cafes',
    CAFE_DETAIL: (slug: string) => `/cafes/${slug}`,
    API: {
      CAFES: '/api/cafes',
      // ...
    },
  } as const;
  ```

**Hooks Organization:**
- Custom hooks stored with their context providers
- Example: `useI18n()` hook in `@/lib/i18n/context.tsx`
- Exported separately from context for clean imports

---

*Convention analysis: 2026-01-27*
