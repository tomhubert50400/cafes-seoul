-- Make avatars bucket public so getPublicUrl() works
-- Avatar images need to be accessible without auth (displayed in menus, profiles, reviews)
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
