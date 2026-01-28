-- Recreate Log Severity Enum to ensure correct values and casing
DROP TYPE IF EXISTS log_severity CASCADE;
CREATE TYPE log_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS');


-- Create System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    event_type TEXT NOT NULL,
    severity log_severity NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    personnel_id UUID REFERENCES auth.users(id),
    tenant_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admins can view all logs
CREATE POLICY "Super admins can view all logs"
ON system_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Policy: Everyone can insert (necessary for login failure logging from client/server actions)
CREATE POLICY "Everyone can insert logs"
ON system_logs FOR INSERT
WITH CHECK (true);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
