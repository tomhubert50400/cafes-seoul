-- ============================================
-- FIX: Add DELETE policy for admins on photos table
-- Issue: Admins could not delete photos because RLS only allowed
--        users to delete their own pending photos
-- ============================================

-- DELETE: Admins can delete any photo
DROP POLICY IF EXISTS "Admins can delete any photo" ON public.photos;
CREATE POLICY "Admins can delete any photo"
ON public.photos FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

COMMENT ON POLICY "Admins can delete any photo" ON public.photos 
IS 'Allows admin users to delete any photo regardless of ownership or status';


