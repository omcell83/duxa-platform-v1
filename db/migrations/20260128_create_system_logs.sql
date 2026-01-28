-- Create Enums for Event Types and Severity
DO $$ BEGIN
    CREATE TYPE log_severity AS ENUM ('info', 'warning', 'error', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_event_type AS ENUM ('login', 'login_failed', 'logout', 'unauthorized_access', 'system_change', 'data_mutation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid REFERENCES public.tenants(id), -- Nullable, system-wide logs may not have tenant
  user_id uuid REFERENCES auth.users(id), -- Nullable, failed logins may not have known user
  event_type text NOT NULL, -- Stored as text to allow flexibility, but logic uses enum concepts
  severity log_severity NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb, -- Store IP, User Agent, Route, metadata
  ip_address inet,
  
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admins can SELECT all logs
CREATE POLICY "Super Admins can view system logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Service Role can doing ANYTHING (implicit, but good to know)
-- We might want authenticated users to be able to INSERT (for their own audit trail)
-- But usually, we insert via System/Admin client in Server Actions to ensure integrity.
-- So we won't add an INSERT policy for public/authenticated unless needed.
-- But wait, if I use `supabase-js` client in a Server Component without Admin privileges, I can't insert.
-- We will use `createAdminClient` in our logging server action, so RLS bypass is handled there.
