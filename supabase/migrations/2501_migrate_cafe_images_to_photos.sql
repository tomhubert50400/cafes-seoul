-- Migration: Unify cafe_images into photos table
-- All API-imported photos move into the photos table so there's one unified photo system

-- Allow photos without a user (API imports have no user)
ALTER TABLE photos ALTER COLUMN user_id DROP NOT NULL;

-- Migrate approved cafe_images into photos table
INSERT INTO photos (cafe_id, user_id, storage_path, status, upvote_count, created_at)
SELECT cafe_id, user_id, storage_path, 'approved', 0, created_at
FROM cafe_images
WHERE is_approved = true
ON CONFLICT DO NOTHING;

-- Keep cafe_images table for safety (can be dropped in a future migration)
