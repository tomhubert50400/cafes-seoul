# Phase 10: Admin Panel - Research

**Researched:** 2026-01-31
**Domain:** Admin authentication, role-based access control, content moderation UI
**Confidence:** HIGH

## Summary

This research covers building a secure admin panel for moderating cafe submissions and photos in Next.js 16 with Supabase. The standard approach uses Next.js App Router's `forbidden()` function for route protection, Server Actions for admin operations, and TanStack Table with shadcn/ui for data tables. The key pattern is database-level role checking (never trust client-side role), admin-specific Supabase client for RLS bypass where needed, and modal-based approve/reject workflows with inline editing capabilities.

The existing codebase already has the foundation:
- User roles (`user_role` enum: user/pro/admin) in profiles table
- RLS policies checking admin role via `EXISTS` subquery
- Server Actions pattern with structured error returns
- Three-tab organization (Pending/Approved/Declined) established in Phase 7

**Primary recommendation:** Use Next.js `forbidden()` for page-level protection, create separate admin Server Actions with role verification, use TanStack Table with shadcn/ui for submission/photo lists, and implement modal dialogs for approve/reject/edit actions. Avoid creating admin-specific Supabase client unless absolutely necessary - RLS policies already grant admins full access.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.5 | App Router with `forbidden()` | Official route protection pattern, Server Actions for mutations |
| TanStack Table | v8 (latest) | Data table with server-side pagination | Headless, performant, battle-tested for admin dashboards |
| shadcn/ui Table | Latest | Pre-styled table components | Integrates with TanStack, consistent with project's design system |
| Zod | (existing) | Form validation | Already in use for submissions, consistent validation approach |
| react-hook-form | v7.66.0 | Form state management | Already in use, integrates well with Server Actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | (existing) | Toast notifications | Success/error feedback for admin actions (already in project) |
| next-intl | (existing) | i18n for admin UI | Admin panel labels and messages in KO/EN/FR/ZH/VI |
| Supabase Database Webhooks | N/A | Email notifications (optional) | Phase 10 plan 10-04 - notify admins of new submissions |
| Resend/SendGrid | N/A | Email delivery (optional) | If implementing email notifications via Edge Functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | Custom table | TanStack handles sorting/filtering/pagination - custom solution would be 500+ lines |
| Modal dialogs | Inline forms | Modals prevent errors by focusing admin attention; inline editing confuses approve vs save |
| `forbidden()` | Redirect to /login | `forbidden()` shows proper 403 error; redirect implies authentication issue not authorization |

**Installation:**
```bash
# TanStack Table + shadcn table components
npm install @tanstack/react-table

# shadcn/ui table components (if not already added)
npx shadcn@latest add table dialog
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── [locale]/
│   │   └── admin/              # Admin panel routes
│   │       ├── layout.tsx      # Admin layout with role check
│   │       ├── page.tsx        # Admin dashboard
│   │       ├── submissions/    # Cafe submission moderation
│   │       │   └── page.tsx
│   │       └── photos/         # Photo moderation
│   │           └── page.tsx
│   └── forbidden.tsx           # Custom 403 error page (optional)
├── components/
│   └── admin/                  # Admin-specific components
│       ├── submissions-table.tsx
│       ├── photos-table.tsx
│       ├── approve-modal.tsx
│       ├── reject-modal.tsx
│       └── edit-submission-form.tsx
└── lib/
    └── actions/
        └── admin.ts            # Admin Server Actions
```

### Pattern 1: Route Protection with `forbidden()`
**What:** Use Next.js 16's `forbidden()` function to protect admin routes
**When to use:** Every admin page to ensure only admin role can access
**Example:**
```typescript
// Source: Next.js v16.1.5 official docs
// https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/04-functions/forbidden.mdx

import { verifySession } from '@/lib/dal'
import { forbidden } from 'next/navigation'

export default async function AdminPage() {
  const session = await verifySession()

  // Check if the user has the 'admin' role
  if (session.role !== 'admin') {
    forbidden()
  }

  // Render the admin page for authorized users
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </main>
  )
}
```

**Adaptation for this project:**
```typescript
// src/app/[locale]/admin/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { forbidden } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    forbidden()
  }

  return <>{children}</>
}
```

### Pattern 2: Server Actions with Role Verification
**What:** Admin operations via Server Actions with database-level role checks
**When to use:** Approve, reject, edit submissions and photos
**Example:**
```typescript
// Source: Next.js v16.1.5 official docs - Server Actions with Zod
// https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/02-guides/forms.mdx

'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string({
    invalid_type_error: 'Invalid Email',
  }),
})

export default async function createUser(formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get('email'),
  })

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Mutate data
}
```

**Adaptation for admin actions:**
```typescript
// src/lib/actions/admin.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for approval
const approvalSchema = z.object({
  submissionId: z.string().uuid(),
  adminNotes: z.string().optional(),
})

export async function approveSubmission(data: z.infer<typeof approvalSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized - admin role required' }
  }

  // Validate input
  const validation = approvalSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map(i => i.message).join(', ')
    }
  }

  // Perform approval (create cafe, update submission status)
  // ... implementation

  revalidatePath('/admin/submissions')
  return { success: true }
}
```

### Pattern 3: TanStack Table with Server-Side Pagination
**What:** Data table with server-side sorting, filtering, and pagination
**When to use:** Submission and photo moderation lists
**Key configuration:**
```typescript
// Source: TanStack Table official docs
// Set manualPagination: true for server-side pagination
// Pass rowCount to tell table total pages
// Use onPaginationChange callback to trigger API calls

const table = useReactTable({
  data,
  columns,
  pageCount: Math.ceil(totalCount / pageSize),
  state: {
    pagination: { pageIndex, pageSize },
  },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, // Disable client-side pagination
})
```

**Integration with Server Actions:**
```typescript
// Create custom hook for fetching paginated data
function useAdminSubmissions(pageIndex: number, pageSize: number) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-submissions', pageIndex, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/submissions?page=${pageIndex}&limit=${pageSize}`
      )
      return response.json()
    }
  })

  return { data, isLoading }
}
```

### Pattern 4: Modal-Based Approve/Reject Workflows
**What:** Modal dialogs for admin actions with confirmation
**When to use:** Approve, reject (with reason), edit before approving
**Best practice from research:**
- Modals for irreversible actions (approve/reject)
- Inline edit triggers modal for complex forms
- Toast notifications for success/error feedback
**Example:**
```typescript
// Approve modal - simple confirmation
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Approve Submission</DialogTitle>
      <DialogDescription>
        This will create a new cafe and mark the submission as approved.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={handleApprove}>Approve</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Reject modal - requires reason
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reject Submission</DialogTitle>
    </DialogHeader>
    <form action={rejectAction}>
      <Textarea
        name="reason"
        placeholder="Reason for rejection (shown to user)"
        required
      />
      <DialogFooter>
        <Button type="submit">Reject</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Anti-Patterns to Avoid
- **Never trust client-side role checks:** Always verify role in Server Actions and RLS policies - `session.role !== 'admin'` on client can be manipulated
- **Don't create admin Supabase client unnecessarily:** Existing RLS policies grant admins full access - only use service role client if you need to bypass RLS for specific operations
- **Avoid inline editing without modals:** For complex forms (edit submission before approving), use modals to prevent accidentally approving unfinished edits
- **Don't skip revalidation:** After admin actions, always `revalidatePath()` to update cached data
- **Never expose service role key client-side:** Service role bypasses RLS - only use in Server Actions, never send to browser

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data tables with sorting/filtering/pagination | Custom table component | TanStack Table + shadcn/ui | 500+ lines of code to handle edge cases; TanStack handles virtual scrolling, column resizing, server-side state |
| CSRF protection for Server Actions | Custom token system | Built-in Next.js protection | Next.js 16 Server Actions compare Origin vs Host header and only allow POST - CSRF protection included |
| Role-based access control | Custom middleware with JWT parsing | RLS policies + `forbidden()` | Database enforces authorization; middleware can be bypassed with direct API calls |
| Email notifications | Custom SMTP client | Supabase Database Webhooks + Edge Function + Resend/SendGrid | Webhooks are async and won't block database operations; Edge Functions are globally distributed |
| Form validation | Manual error checking | Zod + react-hook-form (already in project) | Type-safe, declarative validation; auto-generates TypeScript types from schema |

**Key insight:** Admin panels are high-value targets for attackers - use battle-tested libraries and framework features rather than rolling custom auth/validation. Database-level enforcement (RLS) is your last line of defense.

## Common Pitfalls

### Pitfall 1: Client-Side Role Checking
**What goes wrong:** Checking `user.role === 'admin'` only in client components or page components without server-side verification
**Why it happens:** Seems easier to check role once in layout and assume all child components are protected
**How to avoid:**
- Always verify role in Server Actions that perform admin operations
- Use `forbidden()` in server components (page/layout)
- RLS policies provide final defense - even if client bypasses UI, database blocks unauthorized operations
**Warning signs:**
- Server Actions don't check user role
- Only client-side role checks in `useAuth()` or similar hooks
- Admin operations work in Postman/curl without role verification

### Pitfall 2: Service Role Key Exposure
**What goes wrong:** Creating admin Supabase client with service role key and accidentally exposing it client-side
**Why it happens:** Misconception that admins need service role to bypass RLS - they don't, RLS policies already grant admin access
**How to avoid:**
- Only create service role client in Server Actions if you need to bypass RLS
- **Never** import service role client in client components
- Store `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, never commit to git
- Use separate client instance for service role: `createClient(url, serviceKey)` - don't modify default client
**Warning signs:**
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` environment variable (NEVER do this)
- Service role client created in client components
- Same client instance used for both user and admin operations
**Reference:** [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security) - "Secret keys cannot be used in the browser and will always reply with HTTP 401 Unauthorized"

### Pitfall 3: Missing Rate Limit Bypass for Admins
**What goes wrong:** Admin approving a submission creates a cafe, but submitter hits rate limit when trying to submit another cafe
**Why it happens:** Rate limit increment happens on submission creation, not on approval - admin approval doesn't bypass rate limits
**How to avoid:**
- Don't bypass rate limits - they apply equally to all users including admins when submitting
- For moderation actions (approve/reject), admins don't create submissions, so rate limits don't apply
- If admin edits submission before approving, it's an UPDATE, not INSERT - no rate limit increment
**Warning signs:**
- Users complaining they can't submit after having submissions approved
- Rate limit errors in admin panel when approving submissions

### Pitfall 4: Incomplete Revalidation After Admin Actions
**What goes wrong:** Admin approves submission, but it still shows in pending list until page refresh
**Why it happens:** Next.js caches page data (Server Components) - without revalidation, cached data remains stale
**How to avoid:**
- Call `revalidatePath('/admin/submissions')` after every admin action
- If submission approval affects multiple pages (admin dashboard stats, user profile), revalidate all affected paths
- Use `revalidatePath('/admin', 'layout')` to revalidate entire admin section
**Warning signs:**
- Admin sees stale data after actions
- Page refresh required to see changes
- Pending count doesn't decrement after approval

### Pitfall 5: Missing Error Handling in Modals
**What goes wrong:** Modal closes immediately on submit, user doesn't see error if approval fails
**Why it happens:** Modal close handler called before awaiting Server Action response
**How to avoid:**
- Use `useActionState` or `useTransition` to track pending state
- Disable close button while action is pending
- Show error in modal instead of closing on error
- Only close modal on successful response
**Warning signs:**
- Modal disappears before user sees success/error message
- Users report "actions not working" but no errors shown
- Toasts appear after modal already closed

## Code Examples

Verified patterns from official sources:

### Route Protection with Admin Role Check
```typescript
// Source: Next.js v16.1.5 official documentation
// app/[locale]/admin/layout.tsx

import { createClient } from '@/lib/supabase/server'
import { forbidden } from 'next/navigation'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // Check admin role from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Throw 403 if not admin
  if (profile?.role !== 'admin') {
    forbidden()
  }

  return (
    <div className="admin-layout">
      {/* Admin navigation, header, etc. */}
      {children}
    </div>
  )
}
```

### Server Action with Admin Verification and Validation
```typescript
// Source: Next.js v16.1.5 + react-hook-form v7.66.0
// lib/actions/admin.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const rejectSchema = z.object({
  submissionId: z.string().uuid(),
  rejectionReason: z.string().min(10, 'Reason must be at least 10 characters'),
  adminNotes: z.string().optional(),
})

type RejectInput = z.infer<typeof rejectSchema>

export async function rejectSubmission(input: RejectInput) {
  // 1. Verify authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  // 2. Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized - admin role required' }
  }

  // 3. Validate input
  const validation = rejectSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map(i => i.message).join(', ')
    }
  }

  // 4. Update submission status
  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update({
      status: 'declined',
      rejection_reason: validation.data.rejectionReason,
      admin_notes: validation.data.adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', validation.data.submissionId)

  if (updateError) {
    console.error('Failed to reject submission:', updateError)
    return { success: false, error: 'Failed to update submission' }
  }

  // 5. Revalidate admin pages
  revalidatePath('/admin/submissions')

  return { success: true }
}
```

### TanStack Table with shadcn/ui Components
```typescript
// Source: shadcn/ui Data Table documentation + TanStack Table v8
// components/admin/submissions-table.tsx

'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface Submission {
  id: string
  name: Record<string, string>
  status: 'pending' | 'approved' | 'declined'
  created_at: string
}

interface SubmissionsTableProps {
  data: Submission[]
  pageCount: number
}

export function SubmissionsTable({ data, pageCount }: SubmissionsTableProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: 'name',
      header: 'Cafe Name',
      cell: ({ row }) => row.original.name.en || row.original.name.ko,
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleApprove(row.original.id)}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleReject(row.original.id)}>
            Reject
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Server-side pagination
  })

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

### Modal with useActionState for Error Handling
```typescript
// Source: Next.js v16.1.5 + react-hook-form v7.66.0
// components/admin/reject-modal.tsx

'use client'

import { useActionState } from 'react'
import { rejectSubmission } from '@/lib/actions/admin'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface RejectModalProps {
  submissionId: string
  isOpen: boolean
  onClose: () => void
}

export function RejectModal({ submissionId, isOpen, onClose }: RejectModalProps) {
  const [state, action, pending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await rejectSubmission({
        submissionId,
        rejectionReason: formData.get('reason') as string,
        adminNotes: formData.get('notes') as string || undefined,
      })

      if (result.success) {
        toast.success('Submission rejected')
        onClose()
      }

      return result
    },
    null
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Submission</DialogTitle>
        </DialogHeader>

        <form action={action}>
          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for rejection (shown to user) *
              </label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="e.g., Duplicate cafe, inaccurate address..."
                required
                minLength={10}
              />
            </div>

            <div>
              <label htmlFor="notes" className="text-sm font-medium">
                Admin notes (internal only)
              </label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Internal notes..."
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Rejecting...' : 'Reject Submission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom middleware for route protection | `forbidden()` function | Next.js 15+ (experimental), stable in 16 | Simpler code, proper HTTP 403 status, customizable forbidden.tsx page |
| API routes for admin actions | Server Actions | Next.js 13+ | Type-safe, no manual API routing, better error handling |
| Client-side role checking | RLS policies + server verification | Always best practice | Database-level enforcement, can't be bypassed |
| Custom CSRF tokens | Built-in Server Action protection | Next.js 14+ | Automatic Origin/Host comparison, no manual token management |
| SWR/React Query for table data | TanStack Table v8 | v8 released 2023 | Headless architecture, better TypeScript support, smaller bundle |
| Custom table components | shadcn/ui + TanStack Table | 2024-2025 | Pre-styled, accessible, customizable via CSS variables |

**Deprecated/outdated:**
- **getSession() in Server Components:** Use `getUser()` instead - session can be spoofed, user data is verified by Supabase
- **Pages Router API routes:** Use App Router Server Actions - better type safety and integration
- **Custom table solutions:** TanStack Table v8 is now industry standard for React tables
- **Client-side pagination for admin lists:** Server-side pagination performs better with large datasets (100+ submissions)

## Open Questions

1. **Email notifications implementation timing**
   - What we know: Plan 10-04 covers admin notifications and email alerts
   - What's unclear: Should emails be sent on every submission or batched daily? What's the trigger strategy?
   - Recommendation: Research in Plan 10-04; start with database webhooks for real-time, add batch option later if needed

2. **Admin dashboard analytics**
   - What we know: Requirements only mention viewing/moderating submissions, not analytics
   - What's unclear: Do admins need stats (submissions per day, approval rate, etc.)?
   - Recommendation: Implement basic counts (pending/approved/declined) in Plan 10-01, defer detailed analytics to future phase

3. **Bulk actions support**
   - What we know: Requirements mention approve/reject individual submissions
   - What's unclear: Should admins be able to approve/reject multiple submissions at once?
   - Recommendation: Implement single-item actions first (easier, lower risk), add bulk actions if requested

4. **Photo preview in moderation**
   - What we know: ADMIN-05/06 require viewing and moderating photos
   - What's unclear: Should photo moderation show full-size preview or thumbnails? Gallery view or list view?
   - Recommendation: Use gallery view with modal preview (consistent with user-facing photo gallery pattern)

## Sources

### Primary (HIGH confidence)
- [Next.js v16.1.5 Documentation](https://github.com/vercel/next.js/blob/v16.1.5/docs/) - Authentication, Server Actions, `forbidden()` function
- [React Hook Form v7.66.0](https://context7.com/react-hook-form/react-hook-form/llms.txt) - Form handling with Zod integration
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - Role-based access control patterns
- [Supabase RBAC Guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - Custom claims and role permissions
- [TanStack Table v8 Documentation](https://tanstack.com/table/latest) - Server-side pagination and filtering
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - TanStack Table integration

### Secondary (MEDIUM confidence)
- [Mastering Modal UX: Best Practices](https://www.eleken.co/blog-posts/modal-ux) - When to use modals vs inline editing
- [Modal UX Design for SaaS in 2026](https://userpilot.com/blog/modal-ux-design/) - Modern modal patterns
- [TanStack Table Server-Side Guide](https://medium.com/@clee080/how-to-do-server-side-pagination-column-filtering-and-sorting-with-tanstack-react-table-and-react-7400a5604ff2) - Pagination best practices
- [Next.js Server Action Security](https://nextjs.org/docs/app/guides/data-security) - CSRF protection and security
- [Supabase Send Email Tutorial](https://mailtrap.io/blog/supabase-send-email/) - Email integration patterns
- [Resend + Supabase Integration](https://resend.com/supabase) - Email notifications via Edge Functions

### Tertiary (LOW confidence)
- [shadcn Admin Dashboard Templates](https://github.com/Kiranism/next-shadcn-dashboard-starter) - Example implementations (not official)
- [Next.js Admin Dashboard Patterns](https://nextjstemplates.com/blog/admin-dashboard-templates) - Community patterns (commercial templates)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official or widely adopted (Next.js, TanStack, shadcn/ui)
- Architecture: HIGH - Patterns verified from official Next.js and Supabase documentation
- Pitfalls: MEDIUM - Based on documentation warnings and community discussions (not exhaustive security audit)

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (60 days - Next.js and Supabase are stable, unlikely to change patterns)

**Note on testing:** This research assumes manual testing of admin features. Consider adding admin e2e tests in future phase to prevent regressions in role-based access control.
