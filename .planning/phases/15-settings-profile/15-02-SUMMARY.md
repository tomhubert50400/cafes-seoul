---
phase: 15-settings-profile
plan: 02
subsystem: profile-components
tags: [avatar, react-easy-crop, cropping, utilities]

dependency-graph:
  requires: ["15-01"]
  provides: ["avatar-display", "avatar-upload", "initials-utility", "crop-utility"]
  affects: ["15-03", "15-04"]

tech-stack:
  added: ["react-easy-crop@5.5.6"]
  patterns: ["canvas-based-cropping", "initials-fallback", "deterministic-color"]

key-files:
  created:
    - src/lib/utils/avatar.ts
    - src/lib/utils/crop-image.ts
    - src/components/profile/avatar-display.tsx
    - src/components/profile/avatar-upload.tsx
  modified:
    - package.json

decisions:
  - id: initials-extraction
    choice: "First 2 chars for single word, first letter of first 2 words for multiple"
    rationale: "Handles both single names and full names elegantly"
  - id: deterministic-color
    choice: "Hash userId to index into 8-color palette"
    rationale: "Same user always sees same color, simple implementation"
  - id: crop-output
    choice: "256px JPEG at 90% quality"
    rationale: "Good balance of quality and file size for avatars"

metrics:
  duration: "~3 min"
  completed: 2026-02-01
---

# Phase 15 Plan 02: Avatar Components Summary

Avatar display with initials fallback and upload component with react-easy-crop integration for square cropping

## What Was Built

### Utilities (src/lib/utils/)

**avatar.ts:**
- `getInitials(name)` - Extracts 1-2 uppercase letters from display name
- `getAvatarColor(userId)` - Returns deterministic color from 8-color palette

**crop-image.ts:**
- `getCroppedImg(imageSrc, pixelCrop, outputSize)` - Canvas-based image cropping
- Returns JPEG Blob at 256px square, 90% quality

### Components (src/components/profile/)

**AvatarDisplay:**
- Shows avatar image when available
- Falls back to initials on colored background
- Supports 4 sizes: sm (8), md (10), lg (16), xl (24)
- Deterministic background color from userId

**AvatarUpload:**
- Click-to-upload trigger with current avatar preview
- Hover overlay showing "Change" text
- File validation: 5MB max, JPG/PNG/WebP only
- react-easy-crop integration with square aspect ratio
- Zoom slider (1-3x)
- Cancel/Save buttons
- `onCropComplete` callback receives cropped Blob

## Integration Points

The `onCropComplete` callback in AvatarUpload is designed to be wired by the parent ProfileForm (Plan 15-03) to the `uploadAvatarAction` Server Action. This plan creates the UI; the action wiring happens in the next plan.

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Install react-easy-crop and create utilities | 9f7b2f4 |
| 2 | Create AvatarDisplay and AvatarUpload components | 4010f93 |

## Verification Results

- [x] react-easy-crop in package.json dependencies
- [x] getInitials and getAvatarColor exported from avatar.ts
- [x] getCroppedImg exported from crop-image.ts
- [x] AvatarDisplay component created
- [x] AvatarUpload with react-easy-crop integration
- [x] TypeScript compiles without errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Plan 15-03 can proceed:
- Avatar components ready for integration into ProfileForm
- `onCropComplete` callback ready to receive upload action wiring
- Utilities available for use across the application
