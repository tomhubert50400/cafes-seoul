# Phase 19: Style and Mobile Responsive Check - Research

**Researched:** 2026-02-07
**Domain:** Responsive web design audit with Tailwind CSS v4 and Next.js 16 App Router
**Confidence:** HIGH

## Summary

This phase focuses on auditing and fixing styling issues across all pages to ensure mobile responsiveness. The project uses Tailwind CSS v4 (4.1.18) with built-in container queries and a mobile-first breakpoint system. Next.js 16 App Router provides the Metadata API for viewport configuration. The audit requires systematic testing across breakpoints (mobile, tablet, desktop), identifying common pitfalls (horizontal overflow, touch target sizes, image responsiveness), and ensuring WCAG 2.5.8 compliance for touch targets (24x24px minimum for AA, 44x44px for AAA).

The standard approach is: (1) establish viewport metadata in root layout, (2) audit each page/component systematically using browser DevTools device mode, (3) fix issues following mobile-first methodology, (4) verify touch target sizes and accessibility, (5) test on actual devices or cloud testing platforms.

**Primary recommendation:** Use browser DevTools Device Mode for systematic testing, add viewport export to root layout, audit pages in mobile-first order (320px → 640px → 768px → 1024px → 1280px+), and fix overflow issues using CSS outline debugging before making changes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.1.18 | Utility-first CSS framework | Built-in responsive utilities, container queries in v4, mobile-first breakpoints |
| @tailwindcss/postcss | 4.1.18 | PostCSS plugin for Tailwind v4 | Required for Tailwind v4 integration |
| Next.js | 16.1.4 | React framework | App Router with Metadata API for viewport config |
| Chrome DevTools | Built-in | Device mode testing | Industry standard, real-time responsive testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix UI | Various (@radix-ui/*) | Accessible UI primitives | Already in project - ensure mobile touch targets |
| framer-motion | 12.29.2 | Animation library | Already in project - verify animations work on mobile |
| Polypane | Optional | Multi-viewport testing | For comprehensive cross-device testing (paid) |
| BrowserStack Live | Optional | Real device testing | For final verification on actual devices (paid) |
| Responsively App | Optional | Free desktop app | For simultaneous multi-device preview |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Chrome DevTools | Firefox DevTools | Chrome has better device emulation profiles |
| Manual testing | Automated tools (Percy, Chromatic) | Manual needed first to identify issues before automation |
| Tailwind breakpoints | Custom CSS media queries | Tailwind's mobile-first system is standardized |

**Installation:**
No additional packages needed - all tools already installed.

## Architecture Patterns

### Recommended Audit Structure

**Phase-based approach:**
```
1. Setup & Configuration
   - Add viewport metadata to root layout
   - Verify Tailwind config
   - Document current breakpoints

2. Systematic Page Audit
   - Home page → Cafes listing → Cafe detail → Map
   - Auth pages (login, signup, verify)
   - User dashboard → Profile → Settings
   - Admin panel → Submissions → Photos
   - New features (Roulette)

3. Component-Level Fixes
   - Header/navigation responsiveness
   - Forms and inputs
   - Modals and dialogs
   - Cards and lists
   - Images and media

4. Cross-Cutting Concerns
   - Typography scaling
   - Touch target sizes
   - Overflow/scroll issues
   - Spacing consistency
```

### Pattern 1: Mobile-First Responsive Design
**What:** Start with mobile styles (unprefixed utilities), layer up with breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:)
**When to use:** All responsive styling in the project
**Example:**
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// ❌ WRONG - sm: doesn't mean "mobile"
<div className="sm:text-center">...</div>

// ✅ CORRECT - Mobile first, then override
<div className="text-center sm:text-left">...</div>

// Real example: Hero section
<h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
  {/* 4xl on mobile, 5xl on tablet (768px+), 6xl on desktop (1024px+) */}
</h1>
```

### Pattern 2: Container Queries for Components
**What:** Use @container and @ variants for component-based responsive design
**When to use:** When component needs to adapt based on its parent's size, not viewport
**Example:**
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
<div className="@container">
  <div className="flex flex-col @md:flex-row">
    {/* Stacks vertically until container is md-sized */}
  </div>
</div>

// Named containers for nested scenarios
<div className="@container/main">
  <div className="flex flex-row @sm/main:flex-col">
    {/* Responsive to /main container, not viewport */}
  </div>
</div>
```

### Pattern 3: Viewport Metadata Configuration
**What:** Export viewport object from root layout for proper mobile rendering
**When to use:** Always in root layout.tsx
**Example:**
```tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-viewport
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Never disable user scaling
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Pattern 4: Responsive Image Optimization
**What:** Use Next.js Image component with sizes prop for responsive images
**When to use:** All images, especially hero images and cafe photos
**Example:**
```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/image
import Image from 'next/image'

// For full-width images
<Image
  src="/cafe-hero.jpg"
  alt="Cafe interior"
  width={1200}
  height={800}
  sizes="100vw"
  className="h-48 w-full object-cover md:h-full md:w-48"
/>

// For constrained images
<Image
  src="/cafe-thumbnail.jpg"
  alt="Cafe"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="w-full"
/>
```

### Pattern 5: Touch Target Sizing
**What:** Ensure interactive elements meet WCAG 2.5.8 minimum sizes
**When to use:** All buttons, links, form controls
**Example:**
```tsx
// Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
// ❌ Too small for touch
<button className="p-1 text-xs">Delete</button>

// ✅ Minimum 24x24px (AA compliance)
<button className="min-h-[24px] min-w-[24px] p-2">Delete</button>

// ✅ Recommended 44x44px (AAA compliance)
<Button size="default" className="min-h-11 min-w-11">
  Delete
</Button>

// Icon buttons need explicit sizing
<button className="h-11 w-11 rounded-md">
  <TrashIcon className="h-5 w-5" />
</button>
```

### Pattern 6: Overflow Detection and Debugging
**What:** Systematically identify elements causing horizontal scroll
**When to use:** When horizontal scrollbar appears on mobile
**Example:**
```javascript
// Source: https://css-tricks.com/findingfixing-unintended-body-overflow/
// Paste in browser console to highlight all elements
$$("*").forEach(el => el.style.outline = "1px solid red")

// Or use this script to find wide elements
document.querySelectorAll('*').forEach(el => {
  if (el.offsetWidth > document.documentElement.offsetWidth) {
    console.log('Wide element:', el, el.offsetWidth)
  }
})
```

### Anti-Patterns to Avoid
- **Disabling user zoom:** Never set `userScalable: false` or `maximumScale: 1` - violates accessibility guidelines
- **Using sm: for mobile:** The sm: prefix means "at small breakpoint and above" (640px+), not mobile-first
- **Fixed widths without max-width:** Use `w-full max-w-*` pattern instead of fixed `w-[600px]`
- **Ignoring touch target sizes:** Buttons smaller than 24x24px fail WCAG AA compliance
- **overflow-hidden on body:** Removes scroll capability, only use on specific containers
- **Fixed positioning without testing:** Can cause overlap issues on mobile, test thoroughly
- **Assuming container width:** Elements inside containers may overflow - use `overflow-auto` or `truncate`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive testing | Custom viewport simulator | Chrome DevTools Device Mode | Built-in, accurate touch emulation, network throttling |
| Viewport meta tags | Manual meta tags in head | Next.js viewport export | Type-safe, automatic generation, supports dynamic values |
| Responsive images | Manual srcset generation | Next.js Image component | Automatic optimization, responsive sizing, lazy loading |
| Breakpoint detection | JavaScript window.innerWidth | Tailwind responsive utilities | CSS-based, no JS needed, mobile-first methodology |
| Container-based responsive | JavaScript ResizeObserver | Tailwind @container queries | Built-in to Tailwind v4, no JS, better performance |
| Overflow debugging | Manual element inspection | Console outline script or Polypane | Automated detection, visual highlighting |
| Touch target sizing | Manual pixel calculations | Tailwind min-h/min-w utilities | Consistent, design system aligned |
| Fluid typography | Custom calc() formulas | CSS clamp() with Tailwind | Browser-native, simpler syntax, better control |

**Key insight:** Responsive design has mature tooling - leverage browser DevTools, Tailwind's utilities, and Next.js optimizations rather than building custom solutions. The complexity is in systematic testing and fixing edge cases, not in the tools themselves.

## Common Pitfalls

### Pitfall 1: Missing Viewport Meta Tag
**What goes wrong:** Site doesn't render properly on mobile - appears zoomed out, text too small, layout broken
**Why it happens:** Next.js doesn't add viewport meta by default - must export viewport object from layout
**How to avoid:** Add `export const viewport: Viewport` to root layout.tsx with proper configuration
**Warning signs:** Site looks desktop-sized on mobile, users need to pinch-zoom to read

### Pitfall 2: Horizontal Overflow on Mobile
**What goes wrong:** Horizontal scrollbar appears on mobile, content extends beyond screen width
**Why it happens:** Fixed-width elements (images, containers), large text strings, padding/margin miscalculations
**How to avoid:**
- Use `max-w-full` on images
- Use `truncate` or responsive font sizes on text
- Debug with console outline script: `$$("*").forEach(el => el.style.outline = "1px solid red")`
- Test at 320px width (smallest common mobile)
**Warning signs:** Horizontal scrollbar, content cut off, layout shift when scrolling

### Pitfall 3: Touch Targets Too Small
**What goes wrong:** Buttons/links hard to tap on mobile, users miss clicks, accessibility violation
**Why it happens:** Desktop-sized buttons (padding: 8px) don't meet 24x24px minimum for mobile
**How to avoid:**
- Use `min-h-[44px] min-w-[44px]` for AAA compliance
- Use `min-h-[24px] min-w-[24px]` minimum for AA compliance
- Test with "Show tap highlights" in Chrome DevTools
- Ensure 8px spacing between adjacent touch targets
**Warning signs:** High bounce rate on mobile, users report "can't click buttons"

### Pitfall 4: Text Overflow and Wrapping Issues
**What goes wrong:** Long URLs, usernames, or words break layout, cause horizontal scroll
**Why it happens:** Default CSS doesn't break long strings, especially URLs and hashes
**How to avoid:**
- Use `break-words` or `break-all` on user-generated content
- Use `truncate` for single-line text that must stay constrained
- Use `line-clamp-*` for multi-line truncation
**Warning signs:** User-generated content (reviews, usernames) breaks card layouts

### Pitfall 5: Radix UI Modals and Overlays Not Mobile-Optimized
**What goes wrong:** Modals too large for mobile screen, close buttons unreachable, content cut off
**Why it happens:** Default Radix components use desktop sizing, need responsive overrides
**How to avoid:**
- Add responsive classes to Dialog/Modal content: `max-h-[90vh] w-full max-w-lg`
- Ensure close buttons are reachable: `sticky top-0` or in header
- Test scrollable content with `overflow-y-auto`
- Use `@container` for complex modal layouts
**Warning signs:** Modal content cut off on mobile, can't reach close button, keyboard covers inputs

### Pitfall 6: Navigation Menu Overlap on Mobile
**What goes wrong:** Header elements overlap, navigation links unclickable, language switcher hidden
**Why it happens:** Absolute positioning, insufficient responsive adjustments, z-index issues
**How to avoid:**
- Test header at 320px width (narrowest mobile)
- Use `hidden md:flex` pattern for desktop-only items
- Implement mobile menu (hamburger) if navigation exceeds available space
- Ensure z-index layering is correct: logo/menu at higher z-index than nav
**Warning signs:** Elements overlapping in header, touch targets not working

### Pitfall 7: Fixed Heights Cause Content Overflow
**What goes wrong:** Text cut off, content overflows container, especially with i18n (longer translations)
**Why it happens:** Fixed heights (h-[200px]) don't adapt to content, especially multi-line text
**How to avoid:**
- Use `min-h-*` instead of `h-*` for containers with variable content
- Use `line-clamp-*` with proper fallback for truncation
- Test with longest language (Korean and French tend to be longer)
- Use flexbox `flex-1` for flexible height distribution
**Warning signs:** Text cut off mid-line, content overlapping, broken multi-language layouts

### Pitfall 8: Images Not Responsive
**What goes wrong:** Images load at full size on mobile, slow performance, layout breaks
**Why it happens:** Not using Next.js Image component, missing `sizes` prop, incorrect aspect ratios
**How to avoid:**
- Always use `next/image` for all images
- Add `sizes` prop based on responsive layout
- Use `w-full` and object-fit utilities: `object-cover`, `object-contain`
- Set explicit width/height or use `fill` for dynamic sizing
**Warning signs:** Slow mobile load times, images push layout width, poor Lighthouse scores

### Pitfall 9: Spacing Inconsistencies Across Breakpoints
**What goes wrong:** Too much padding on mobile (wastes space), too little on desktop (cramped)
**Why it happens:** Not using responsive spacing utilities, copying desktop spacing to mobile
**How to avoid:**
- Use responsive padding/margin: `px-4 md:px-6 lg:px-8`
- Use container max-width: `max-w-6xl mx-auto px-4`
- Test content density at each breakpoint
- Mobile: tighter spacing (p-4), Desktop: more breathing room (p-8)
**Warning signs:** Content cramped on mobile, excessive scrolling, poor readability

### Pitfall 10: Assuming Hover Works on Mobile
**What goes wrong:** Features only accessible on hover don't work on touch devices
**Why it happens:** Hover states designed for desktop, no touch equivalent
**How to avoid:**
- Use click/tap for critical interactions, not hover
- Add `@media (hover: hover)` for hover-only enhancements
- Test on actual touch device or Chrome DevTools touch emulation
- Ensure all features accessible without hover (tooltips, dropdowns)
**Warning signs:** Features unreachable on mobile, users can't access hover-only content

## Code Examples

Verified patterns from official sources:

### Responsive Layout Pattern
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Mobile-first card layout
<div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl">
  <div className="md:flex">
    <div className="md:shrink-0">
      <img
        className="h-48 w-full object-cover md:h-full md:w-48"
        src="/img/cafe.jpg"
        alt="Cafe interior"
      />
    </div>
    <div className="p-8">
      <div className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
        Featured Cafe
      </div>
      <a href="#" className="mt-1 block text-lg font-medium leading-tight text-black hover:underline">
        Amazing coffee experience
      </a>
      <p className="mt-2 text-muted-foreground">
        Located in the heart of Gangnam
      </p>
    </div>
  </div>
</div>
```

### Responsive Navigation Header
```tsx
// Source: Project header.tsx (verified pattern)
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="mx-auto relative flex h-14 max-w-6xl items-center justify-between px-4">
    {/* Logo - icon only on mobile, icon + text on desktop */}
    <Link href="/" className="flex items-center gap-2">
      <CoffeeIcon className="h-6 w-6" />
      <span className="font-semibold hidden md:inline">Seoul Cafes</span>
    </Link>

    {/* Centered navigation */}
    <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6">
      <Link href="/cafes" className="text-sm font-medium">Cafes</Link>
      <Link href="/map" className="text-sm font-medium">Map</Link>
    </nav>

    {/* Actions - responsive auth buttons */}
    <div className="flex items-center gap-2">
      {user ? (
        <UserMenu user={user} />
      ) : (
        <>
          {/* Desktop: both buttons */}
          <div className="hidden md:flex gap-2">
            <Button variant="ghost" size="sm">Login</Button>
            <Button size="sm">Sign Up</Button>
          </div>
          {/* Mobile: single login button */}
          <Button size="sm" className="md:hidden">Login</Button>
        </>
      )}
    </div>
  </div>
</header>
```

### Responsive Form Layout
```tsx
// Mobile-stacked, desktop-grid form
<form className="space-y-4 md:space-y-6">
  {/* Single column on mobile, two columns on desktop */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <Label htmlFor="name">Cafe Name</Label>
      <Input
        id="name"
        className="h-11 text-base" // Larger for mobile touch
      />
    </div>
    <div>
      <Label htmlFor="district">District</Label>
      <Select>...</Select>
    </div>
  </div>

  {/* Full width on all sizes */}
  <div>
    <Label htmlFor="description">Description</Label>
    <Textarea
      id="description"
      className="min-h-[120px] text-base"
    />
  </div>

  {/* Responsive button layout */}
  <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
    <Button variant="outline" type="button" className="w-full md:w-auto">
      Cancel
    </Button>
    <Button type="submit" className="w-full md:w-auto">
      Submit
    </Button>
  </div>
</form>
```

### Responsive Modal/Dialog
```tsx
// Source: Radix UI + responsive best practices
<Dialog>
  <DialogContent className="
    max-h-[90vh]
    w-[95vw] max-w-lg
    overflow-y-auto
    p-4 md:p-6
  ">
    <DialogHeader className="sticky top-0 bg-background pb-4">
      <DialogTitle className="text-lg md:text-xl">
        Review Cafe
      </DialogTitle>
      <DialogClose className="
        absolute right-4 top-4
        h-11 w-11 // WCAG compliant touch target
      ">
        <X className="h-5 w-5" />
      </DialogClose>
    </DialogHeader>

    <div className="space-y-4">
      {/* Scrollable content */}
    </div>

    <DialogFooter className="
      sticky bottom-0 bg-background pt-4
      flex-col gap-2 md:flex-row
    ">
      <Button variant="outline" className="w-full md:w-auto">
        Cancel
      </Button>
      <Button className="w-full md:w-auto">Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Responsive Grid Layout
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Cafe cards grid - responsive columns
<div className="
  grid
  grid-cols-1
  gap-4
  sm:grid-cols-2
  md:gap-6
  lg:grid-cols-3
  xl:grid-cols-4
">
  {cafes.map(cafe => (
    <CafeCard key={cafe.id} cafe={cafe} />
  ))}
</div>
```

### Overflow Detection Script
```javascript
// Source: https://css-tricks.com/findingfixing-unintended-body-overflow/
// Paste in Chrome DevTools console
// Method 1: Highlight all elements
$$("*").forEach(el => el.style.outline = "1px solid red")

// Method 2: Log elements wider than viewport
document.querySelectorAll('*').forEach(el => {
  if (el.offsetWidth > document.documentElement.offsetWidth) {
    console.log('Wide element:', el, `${el.offsetWidth}px`, el.className)
    el.style.outline = "3px solid red"
  }
})

// Method 3: Check for horizontal scroll
if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
  console.log('Horizontal overflow detected!')
  console.log('Viewport width:', document.documentElement.clientWidth)
  console.log('Scroll width:', document.documentElement.scrollWidth)
}
```

### Responsive Typography with Clamp
```tsx
// Source: https://tryhoverify.com/blog/fluid-typography-tricks-scaling-text-seamlessly-across-devices-with-tailwind-and-css-clamp/
// Hero heading with fluid sizing
<h1 className="
  text-[clamp(2rem,5vw,4rem)]
  font-bold
  leading-tight
">
  Discover Seoul's Best Cafes
</h1>

// Or using Tailwind responsive utilities (preferred for consistency)
<h1 className="
  text-4xl
  font-bold
  md:text-5xl
  lg:text-6xl
  leading-tight
">
  Discover Seoul's Best Cafes
</h1>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Media query plugin | Built-in container queries | Tailwind v4.0 (2023) | No plugin needed, @container works out of box |
| Metadata in head tag | viewport export from layout | Next.js 14 (2023) | Type-safe, automatic generation, better DX |
| Manual responsive images | Next.js Image with sizes | Next.js 13+ (2022) | Automatic optimization, better performance |
| userScalable: false | Always allow zoom | WCAG 2.1+ (2018) | Accessibility requirement, legal compliance |
| Fixed breakpoints | Fluid typography with clamp() | CSS spec (2020) | Smoother scaling across devices |
| max-width media queries | Mobile-first min-width | Industry standard (2015+) | Better progressive enhancement |
| JavaScript resize observers | CSS container queries | CSS spec (2023) | Better performance, no JS needed |

**Deprecated/outdated:**
- **viewport meta in _document.js:** Next.js App Router uses viewport export from layout
- **overflow-x: hidden on html/body:** Hides accessibility issues, use on specific containers
- **Separate mobile site (m.domain.com):** Use responsive design, single codebase
- **Device-specific CSS (iPhone 6, etc):** Use semantic breakpoints (sm, md, lg)
- **Tailwind container queries plugin:** Built into v4, plugin no longer needed

## Open Questions

Things that couldn't be fully resolved:

1. **Roulette feature responsiveness**
   - What we know: New feature in src/app/roulette/ and src/components/roulette/, 6 component files
   - What's unclear: Current responsive state, whether animations work on mobile, spinner touch interactions
   - Recommendation: Prioritize testing roulette UI on mobile - new features often lack responsive testing

2. **I18n impact on layout**
   - What we know: 5 languages (KO, EN, FR, ZH, VI), some translations are longer
   - What's unclear: Whether fixed heights cause overflow with longer translations (French tends to be verbose)
   - Recommendation: Test all pages in French (typically longest) and Korean at mobile widths

3. **Map component mobile usability**
   - What we know: Interactive map with rating filters (uses react-kakao-maps-sdk)
   - What's unclear: Touch interactions, filter UI on mobile, performance on mobile devices
   - Recommendation: Test map gestures (pinch zoom, pan) don't conflict with page scroll

4. **Admin panel mobile access**
   - What we know: Admin panel exists with tables (cafes, photos, submissions)
   - What's unclear: Whether admin panel is intended for mobile use (tables typically don't work well on mobile)
   - Recommendation: Decide if admin is desktop-only or needs mobile-responsive tables

5. **Photo upload on mobile**
   - What we know: Photo upload and moderation feature exists
   - What's unclear: Whether mobile photo upload (from camera) is tested and working
   - Recommendation: Test photo upload flow on actual mobile device with camera access

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Responsive Design Documentation](https://tailwindcss.com/docs/responsive-design) - Mobile-first methodology, breakpoints, container queries
- [Next.js Viewport Configuration API](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) - Viewport export pattern
- [Next.js Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image) - Responsive image optimization
- [WCAG 2.5.8 Target Size Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) - Touch target requirements
- [Radix UI Accessibility Documentation](https://www.radix-ui.com/primitives/docs/overview/accessibility) - Component accessibility standards

### Secondary (MEDIUM confidence)
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) - Design system patterns
- [CSS-Tricks: Finding/Fixing Unintended Body Overflow](https://css-tricks.com/findingfixing-unintended-body-overflow/) - Overflow debugging
- [Mobile Navigation UX Best Practices 2026](https://www.designstudiouiux.com/blog/mobile-navigation-ux/) - Navigation patterns
- [Modern CSS Layout Techniques 2025-2026](https://www.frontendtools.tech/blog/modern-css-layout-techniques-flexbox-grid-subgrid-2025) - Grid/Flexbox usage
- [Polypane: Strategies for Dealing with Horizontal Overflows](https://polypane.app/blog/strategies-for-dealing-with-horizontal-overflows/) - Debugging techniques

### Tertiary (LOW confidence)
- [BrowserStack Responsive Design Testing Tools](https://www.browserstack.com/guide/responsive-design-testing-tools) - Testing tools overview
- [Fluid Typography with Tailwind and CSS Clamp](https://tryhoverify.com/blog/fluid-typography-tricks-scaling-text-seamlessly-across-devices-with-tailwind-and-css-clamp/) - Typography techniques

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project, versions verified, official documentation current
- Architecture: HIGH - Patterns verified from Tailwind/Next.js official docs and WCAG standards
- Pitfalls: HIGH - Based on official sources and common industry knowledge, cross-verified

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain, but test tooling evolves)
