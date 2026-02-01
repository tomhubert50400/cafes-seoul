# Phase 15: Settings & Profile - Research

**Researched:** 2026-02-01
**Domain:** User profile management, file uploads, account deletion
**Confidence:** HIGH

## Summary

This phase implements user profile management with avatar uploads, display name/bio editing, and account deletion. The technical domain spans Supabase Storage for image uploads, react-hook-form for form handling, image cropping for avatar preparation, and account deletion with grace periods.

The standard approach uses Supabase Storage with user-scoped RLS policies for secure file uploads, react-easy-crop for client-side image cropping (aspect=1 for square avatars), and Server Actions for profile updates. Account deletion requires a custom soft-delete implementation since Supabase Auth doesn't natively support grace periods - use a `scheduled_deletion_at` timestamp column with login-based reactivation.

For profile data synchronization, the recommended pattern is maintaining a `profiles` table in the public schema with foreign key cascade to `auth.users`, while also updating `auth.users.user_metadata` for fields like display_name that appear in JWT tokens. Avatar files follow the naming pattern `{user_id}/{timestamp}-{random}.{ext}` to enable user-scoped RLS policies and prevent caching issues.

**Primary recommendation:** Use react-easy-crop (125k+ weekly downloads) for avatar cropping, Supabase Storage with user-folder RLS policies for uploads, and implement soft deletion with grace period via custom `scheduled_deletion_at` column rather than relying on Supabase Auth's built-in deletion.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-easy-crop | 5.x (latest) | Image cropping UI | 125k+ weekly downloads, mobile-friendly, supports square aspect for avatars, minimal dependencies |
| @supabase/supabase-js | 2.93.1+ | File upload to Storage | Official SDK, handles auth tokens, integrates with RLS |
| react-hook-form | 7.71.1 (existing) | Form state management | Already in project, handles file inputs, validation integration |
| zod | 4.3.6 (existing) | Form validation | Type-safe validation, file size/type checking |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/image | 16.1.4 (built-in) | Avatar display/optimization | Display uploaded avatars with automatic optimization |
| URL.createObjectURL | Native API | Image preview generation | Client-side preview before upload |
| sonner | 2.0.7 (existing) | Toast notifications | Success/error feedback for all operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-easy-crop | react-image-crop | More configuration required, less mobile-friendly, but smaller bundle (5KB vs larger) |
| react-easy-crop | react-avatar-editor | Includes rotation features, but 2 months since last update vs react-easy-crop's active maintenance |
| Supabase Storage | Next.js /public folder | Free tier limits, but Supabase provides CDN, RLS security, proper asset management |

**Installation:**
```bash
npm install react-easy-crop
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── [locale]/
│       └── profile/
│           └── settings/
│               └── page.tsx          # Settings page (Server Component wrapper)
├── components/
│   └── profile/
│       ├── profile-form.tsx         # Main form (Client Component)
│       ├── avatar-upload.tsx        # Avatar upload + crop (Client Component)
│       ├── avatar-display.tsx       # Avatar display with fallback
│       └── delete-account-dialog.tsx # Account deletion confirmation
├── lib/
│   ├── actions/
│   │   └── profile.ts               # Server Actions for profile operations
│   ├── supabase/
│   │   └── profiles.ts              # Profile data layer
│   └── validations/
│       └── profile.ts               # Zod schemas for profile forms
└── types/
    └── profile.ts                   # Profile type definitions
```

### Pattern 1: Avatar Upload with Crop
**What:** User selects image, crops it client-side, then uploads cropped blob to Supabase Storage
**When to use:** Any avatar/profile picture upload feature
**Example:**
```typescript
// Source: react-easy-crop docs + Supabase Storage docs
"use client";

import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { createClient } from '@/lib/supabase/client';

export function AvatarUpload({ userId, onUploadComplete }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadCroppedImage = async () => {
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const fileName = `${Date.now()}-${Math.random()}.jpg`;
    const filePath = `${userId}/${fileName}`;

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, croppedBlob, {
        contentType: 'image/jpeg',
        upsert: false, // Use unique filenames instead
      });

    if (!error) {
      onUploadComplete(filePath);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onFileChange} />
      {imageSrc && (
        <div className="relative h-64">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}  // Square crop for avatar
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
      <button onClick={uploadCroppedImage}>Upload</button>
    </div>
  );
}
```

### Pattern 2: Profile Update with Dual Table Sync
**What:** Update both profiles table (public schema) and auth.users.user_metadata
**When to use:** Profile fields that should appear in UI and JWT tokens (like display_name)
**Example:**
```typescript
// Source: Supabase User Management docs
"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const displayName = formData.get('display_name') as string;
  const bio = formData.get('bio') as string;

  // 1. Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: displayName,
      bio: bio,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    return { success: false, error: 'Failed to update profile' };
  }

  // 2. Update auth.users metadata (for JWT)
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    }
  });

  if (authError) {
    return { success: false, error: 'Failed to update auth metadata' };
  }

  revalidatePath('/profile');
  return { success: true };
}
```

### Pattern 3: Soft Delete with Grace Period
**What:** Mark user for deletion with timestamp, allow reactivation on login, hard delete after grace period
**When to use:** Account deletion with grace period (7+ days)
**Example:**
```typescript
// Source: Common user deletion patterns
"use server";

import { createClient } from '@/lib/supabase/server';

export async function scheduleAccountDeletionAction(confirmEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== confirmEmail) {
    return { success: false, error: 'Email confirmation failed' };
  }

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 7); // 7-day grace period

  const { error } = await supabase
    .from('profiles')
    .update({
      scheduled_deletion_at: scheduledAt.toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Failed to schedule deletion' };
  }

  return { success: true, scheduledAt };
}

// Reactivation on login (add to login flow)
export async function checkAndReactivateAccount(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('scheduled_deletion_at')
    .eq('id', userId)
    .single();

  if (profile?.scheduled_deletion_at) {
    // User logged in during grace period - reactivate
    await supabase
      .from('profiles')
      .update({ scheduled_deletion_at: null })
      .eq('id', userId);
  }
}
```

### Pattern 4: Supabase Storage RLS Policies
**What:** User-scoped folder access policies for secure file uploads
**When to use:** Any user-uploaded files (avatars, documents, etc.)
**Example:**
```sql
-- Source: Supabase Storage Access Control docs

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update (upsert) their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Pattern 5: Initials Avatar Fallback
**What:** Generate consistent colored avatar with user's initials when no image uploaded
**When to use:** Default avatar before user uploads image
**Example:**
```typescript
// Source: Deterministic React Avatar Fallbacks pattern
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(userId: string): string {
  // Deterministic color based on user ID
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  // Simple hash: sum character codes
  const hash = userId.split('').reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

  return colors[hash % colors.length];
}

export function AvatarDisplay({ user, avatarUrl }: Props) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={user.display_name} />;
  }

  const initials = getInitials(user.display_name || user.email);
  const bgColor = getAvatarColor(user.id);

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-white font-semibold">{initials}</span>
    </div>
  );
}
```

### Pattern 6: Unsaved Changes Warning
**What:** Warn user before navigating away from form with unsaved changes
**When to use:** Any form with significant user input (profile editing, long forms)
**Example:**
```typescript
// Source: Next.js App Router unsaved changes patterns
"use client";

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export function UnsavedChangesWarning() {
  const { formState: { isDirty } } = useFormContext();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Safari
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return null; // No visual component
}

// Usage in form:
export function ProfileForm() {
  const form = useForm();

  return (
    <FormProvider {...form}>
      <UnsavedChangesWarning />
      <form>{/* form fields */}</form>
    </FormProvider>
  );
}
```

### Anti-Patterns to Avoid
- **Using upsert=true with same filename:** Causes CDN caching issues. Use unique filenames with timestamps instead.
- **Storing avatars in /public folder:** No access control, no CDN, clutters repo. Use Supabase Storage.
- **Only updating auth.users metadata:** Profile changes won't persist in your database, and metadata is limited in size.
- **Hard deleting user immediately:** No grace period for account recovery. Use soft delete with scheduled_deletion_at.
- **Deleting user without cleaning Storage first:** Supabase prevents user deletion if they own Storage objects. Delete files first or reassign ownership.
- **Using auth.getSession() in Server Components:** Unreliable with cookie rotation. Always use auth.getUser().

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image cropping UI | Custom canvas cropping with mouse/touch events | react-easy-crop | Mobile gestures (pinch-zoom), accessibility, cross-browser canvas quirks, touch event normalization |
| Avatar color generation | Random colors or CSS nth-child | Deterministic hash from user ID | Same user needs same color across sessions, deterministic = no DB storage needed |
| File upload progress | Custom XMLHttpRequest wrapper | Supabase Storage SDK | Handles auth tokens, retries, error states, signed URLs automatically |
| Character counter | Manual substring + length check | maxLength attribute + controlled input | Browser handles input limiting, you just display count. Prevents copy-paste overflow. |
| Form dirty state tracking | Manual field comparison in useEffect | react-hook-form formState.isDirty | Tracks nested fields, arrays, complex objects. Built-in and optimized. |
| Image URL preview cleanup | Forget to cleanup or manual tracking | URL.revokeObjectURL in useEffect cleanup | Memory leaks from forgotten cleanup. useEffect cleanup handles unmount automatically. |

**Key insight:** File uploads and image manipulation have many edge cases (EXIF orientation, HEIC format, file size limits, network failures, progress tracking, cancellation). Established libraries handle browser quirks, mobile gestures, accessibility, and error states that take weeks to get right.

## Common Pitfalls

### Pitfall 1: Supabase Storage User Deletion Constraint
**What goes wrong:** User deletion fails with error "cannot delete user who owns storage objects"
**Why it happens:** Supabase Auth enforces referential integrity - users can't be deleted if they have files in Storage
**How to avoid:** Delete all user's Storage objects before attempting user deletion, or implement soft deletion that doesn't delete auth.users record
**Warning signs:** Error message containing "owns storage objects" when calling auth.admin.deleteUser()

### Pitfall 2: File Upload Size Limits
**What goes wrong:** Upload silently fails or times out with files over 6MB
**Why it happens:** Standard upload() method is optimized for small files (<6MB). Server Actions have 1MB default body limit.
**How to avoid:** Validate file size client-side (max 5MB per requirements), compress images before upload, or use TUS resumable upload for larger files
**Warning signs:** Timeout errors, no progress on large uploads, network tab shows request pending indefinitely

### Pitfall 3: Avatar URL Caching After Update
**What goes wrong:** User uploads new avatar but old image still displays due to browser/CDN caching
**Why it happens:** Using same filename with upsert=true causes same URL, browsers cache aggressively
**How to avoid:** Use unique filenames with timestamp/random component: `${userId}/${Date.now()}-${Math.random()}.jpg`
**Warning signs:** Hard refresh (Ctrl+F5) shows new image but normal refresh doesn't, different browsers show different images

### Pitfall 4: Memory Leaks from URL.createObjectURL
**What goes wrong:** Browser memory usage grows, especially on image-heavy pages or repeated uploads
**Why it happens:** createObjectURL creates a blob URL that stays in memory until revoked
**How to avoid:** Always call URL.revokeObjectURL in useEffect cleanup function
**Warning signs:** Increasing memory usage in DevTools, page slowdown after multiple uploads

### Pitfall 5: Auth Metadata vs Profiles Table Sync
**What goes wrong:** Display name shows correctly in some places but not others, or updates don't persist after session refresh
**Why it happens:** auth.users.user_metadata is separate from profiles table, only updating one causes drift
**How to avoid:** Update both places: updateUser({ data: {...} }) AND profiles table upsert
**Warning signs:** User sees old display name in header (JWT) but new one in profile page (database query)

### Pitfall 6: Email Confirmation for Profile Updates
**What goes wrong:** Changing email triggers confirmation emails and logs user out unexpectedly
**Why it happens:** Supabase Auth's "Secure email change" setting (default: enabled) requires confirmation from both old and new email
**How to avoid:** If implementing email change, inform user of confirmation requirement. For this phase, display_name/bio changes don't need email confirmation.
**Warning signs:** User reports being logged out after updating profile, confirmation emails sent unexpectedly

### Pitfall 7: Race Condition on Initial Avatar Load
**What goes wrong:** Avatar flickers between initials and image on page load
**Why it happens:** Avatar URL loads asynchronously while initials render immediately
**How to avoid:** Use Suspense boundary or loading state, or check if avatarUrl exists before rendering either state
**Warning signs:** Flash of initials avatar before image loads on every page load

### Pitfall 8: Character Counter Not Updating While Typing
**What goes wrong:** Counter only updates after blur, or doesn't update at all
**Why it happens:** Not using controlled input or watching the correct form field
**How to avoid:** Use react-hook-form's watch() or controlled value state for real-time updates
**Warning signs:** Counter stuck at 0 or previous value while user types

## Code Examples

Verified patterns from official sources:

### Profile Form with File Upload Validation
```typescript
// Source: react-hook-form file upload patterns + Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[\w\s-]+$/, 'Only letters, numbers, spaces, and hyphens allowed'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  avatar: z.custom<FileList>()
    .refine((files) => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, {
      message: 'File size must be less than 5MB',
    })
    .refine((files) => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type), {
      message: 'Only JPG, PNG, and WebP images are allowed',
    })
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm({ initialData }: Props) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('display_name')} />
      <textarea {...form.register('bio')} maxLength={500} />
      <input type="file" {...form.register('avatar')} accept="image/*" />
    </form>
  );
}
```

### Character Counter for Textarea
```typescript
// Source: React character counter patterns
import { useFormContext } from 'react-hook-form';

export function BioField() {
  const { register, watch } = useFormContext();
  const bio = watch('bio') || '';
  const remaining = 500 - bio.length;

  return (
    <div>
      <textarea
        {...register('bio')}
        maxLength={500}
        placeholder="Tell us about yourself..."
      />
      {bio.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {remaining} characters remaining
        </p>
      )}
    </div>
  );
}
```

### Server Action for File Upload to Supabase Storage
```typescript
// Source: Supabase Storage upload docs + Next.js Server Actions
"use server";

import { createClient } from '@/lib/supabase/server';

export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const file = formData.get('avatar') as File;

  if (!file || file.size === 0) {
    return { success: false, error: 'No file provided' };
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds 5MB limit' };
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false, // Don't overwrite - use unique filenames
    });

  if (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to upload file' };
  }

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: filePath })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: 'Failed to update profile' };
  }

  return { success: true, path: filePath };
}
```

### Getting Cropped Image Blob
```typescript
// Source: react-easy-crop examples
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.9);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing profile images in /public folder | Supabase Storage with RLS | 2020+ | Secure user-scoped access, CDN delivery, no repo bloat |
| Custom canvas crop tools | Libraries like react-easy-crop | 2021+ | Better mobile support, accessibility, maintained |
| Hard delete users immediately | Soft delete with grace period | 2022+ (GDPR awareness) | Better UX, account recovery, compliance-friendly |
| Global public buckets | User-folder RLS policies | 2023+ | Secure by default, prevents unauthorized access |
| Server-side image processing | Client-side crop before upload | 2023+ | Reduces server load, faster feedback, lower bandwidth |
| updateUser only | Dual sync (updateUser + profiles table) | 2024+ | Consistent data across JWT and database queries |

**Deprecated/outdated:**
- **auth.getSession() in Server Components:** Replaced by auth.getUser() due to cookie rotation issues in Next.js App Router (deprecated 2024)
- **TUS upload for small files:** Standard upload() is now recommended for files under 6MB; TUS is only for large files (updated 2025)
- **react-avatar-editor:** Still works but less maintained (2 months since update); react-easy-crop more actively maintained

## Open Questions

1. **Storage bucket public vs private configuration**
   - What we know: Buckets can be public or private. RLS policies control access regardless.
   - What's unclear: Whether making avatars bucket public improves CDN caching for user-uploaded avatars
   - Recommendation: Start with private bucket + RLS policies. Public bucket with RLS still restricts access but may improve CDN. Test performance after initial implementation.

2. **Grace period enforcement mechanism**
   - What we know: Need to mark users with scheduled_deletion_at and allow reactivation on login
   - What's unclear: Best approach for hard deletion after grace period expires (cron job, database trigger, manual admin process)
   - Recommendation: Implement soft delete and reactivation first. Consider database trigger or scheduled Edge Function for hard deletion. Document need for cleanup process.

3. **Profile privacy toggle implementation**
   - What we know: User can make profile private/public
   - What's unclear: Whether privacy affects only public profile pages (/user/[id]) or also reviews/favorites visibility on cafe pages
   - Recommendation: Start with privacy toggle only affecting /user/[id] route (simplest scope). Reviews/favorites on cafe pages remain visible even if profile is private (preserve data integrity for cafes).

## Sources

### Primary (HIGH confidence)
- Supabase Storage Uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase Storage RLS: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Auth Update User: https://supabase.com/docs/reference/javascript/auth-updateuser
- Supabase Auth Delete User: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
- Supabase User Management: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase Next.js Tutorial: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs

### Secondary (MEDIUM confidence)
- react-easy-crop: 125k+ weekly downloads, actively maintained, official recommendation for avatar cropping
- react-image-crop: 11.0.10 version, 5KB bundle, LogRocket 2024 comparison article
- Next.js Server Actions file upload: Strapi tutorial (2025), medium.com guides (Jan 2026)
- Deterministic avatar colors: joshuaslate.com/blog/deterministic-react-avatar-fallback
- Unsaved changes patterns: React Router discussions, Next.js GitHub discussions (2024-2026)

### Tertiary (LOW confidence - verify before use)
- Grace period patterns: General software patterns from Microsoft/Google docs, not Supabase-specific
- Character counter implementations: Various community tutorials (createIT, DEV Community)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs, npm package stats, established libraries
- Architecture: HIGH - Patterns verified from official Supabase tutorials and Next.js best practices
- Pitfalls: MEDIUM-HIGH - Most from official docs warnings, some from community discussions

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, but Supabase/Next.js release frequently)
