-- ============================================
-- ADMIN DELETE CAFES
-- Allow admins to delete cafes (with cascade to related data)
-- ============================================

-- Enable RLS on cafes if not already enabled
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

-- Allow admins to delete cafes
DROP POLICY IF EXISTS "Admins can delete cafes" ON public.cafes;
CREATE POLICY "Admins can delete cafes"
ON public.cafes FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Also allow admins full read access to cafes
DROP POLICY IF EXISTS "Admins can view all cafes" ON public.cafes;
CREATE POLICY "Admins can view all cafes"
ON public.cafes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow admins to delete photos (for cleanup)
DROP POLICY IF EXISTS "Admins can delete any photos" ON public.photos;
CREATE POLICY "Admins can delete any photos"
ON public.photos FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Set cafe_id to NULL on cafe_submissions when cafe is deleted
-- (instead of blocking deletion due to FK constraint)
ALTER TABLE public.cafe_submissions
DROP CONSTRAINT IF EXISTS cafe_submissions_cafe_id_fkey;

ALTER TABLE public.cafe_submissions
ADD CONSTRAINT cafe_submissions_cafe_id_fkey
FOREIGN KEY (cafe_id) REFERENCES public.cafes(id)
ON DELETE SET NULL;

-- Set cafe_id to NULL on reports when cafe is deleted
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_cafe_id_fkey;

ALTER TABLE public.reports
ADD CONSTRAINT reports_cafe_id_fkey
FOREIGN KEY (cafe_id) REFERENCES public.cafes(id)
ON DELETE SET NULL;

COMMENT ON POLICY "Admins can delete cafes" ON public.cafes IS 'Administrators can permanently delete cafes. Related photos, reviews, favorites, and images are automatically deleted via CASCADE.';
