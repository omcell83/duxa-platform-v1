-- =====================================================
-- ADD THEME COLUMN TO PROFILES TABLE
-- =====================================================
-- Kullanıcı tema tercihini saklamak için profiles tablosuna theme sütunu ekler

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));

-- Index for theme lookups (optional, but can be useful)
CREATE INDEX IF NOT EXISTS profiles_theme_idx ON public.profiles(theme);

-- Update existing users to have 'system' as default theme
UPDATE public.profiles 
SET theme = 'system' 
WHERE theme IS NULL;
