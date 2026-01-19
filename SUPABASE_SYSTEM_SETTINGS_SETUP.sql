-- =====================================================
-- SYSTEM SETTINGS TABLE (Global System Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY, -- Setting key (e.g., 'security', 'email', 'general')
  value jsonb NOT NULL DEFAULT '{}'::jsonb, -- Setting value (JSON structure)
  description text, -- Description of the setting group
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id) -- Last updated by
);

-- RLS Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: Only authenticated users can read (or maybe public if needed, but for now restricted)
-- Super admins can read all.
CREATE POLICY "system_settings_select_policy"
ON public.system_settings FOR SELECT
TO authenticated
USING (true); -- Allow all authenticated users to read settings (some might be needed for the app)

-- INSERT/UPDATE/DELETE: Only super admins
CREATE POLICY "system_settings_all_policy"
ON public.system_settings FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Default Security Settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('security', '{
    "min_password_length": 8,
    "require_special_char": true,
    "require_number": true,
    "require_uppercase": true,
    "max_login_attempts": 5,
    "session_timeout_minutes": 60,
    "two_factor_enforced": false
  }'::jsonb, 'General system security configuration')
ON CONFLICT (key) DO NOTHING;
