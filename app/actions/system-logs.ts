'use server';

import { createAdminClient } from '@/lib/admin';
import { createClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';

export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';
export type LogEventType =
    | 'login'
    | 'login_failed'
    | 'logout'
    | 'unauthorized_access'
    | 'system_change'
    | 'data_mutation';

export interface SystemLogEvent {
    event_type: LogEventType;
    severity: LogSeverity;
    message: string;
    details?: Record<string, any>;
    user_id?: string;
    tenant_id?: string | number;
}

/**
 * Logs a system event to the database.
 * This is a server action that can be called from client or server components.
 */
export async function logSystemEvent(event: SystemLogEvent) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!');
            return { success: false, error: 'Service role key missing' };
        }

        const supabaseAdmin = createAdminClient();

        // Safety check for IP address to avoid Postgres inet errors
        let ipAddress: string | null = null;
        try {
            const headersList = await headers();
            const forwarded = headersList.get('x-forwarded-for');
            const realIp = headersList.get('x-real-ip');
            const ip = forwarded || realIp || null;

            if (ip) {
                ipAddress = ip.split(',')[0].trim();
                // Basic validation: if it doesn't look like an IP, set to null
                if (ipAddress === 'unknown' || ipAddress === '::1') {
                    ipAddress = null;
                }
            }
        } catch (hError) {
            console.error('Error fetching headers for log:', hError);
        }

        // Prepare data for insertion
        const logData: any = {
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id || null,
            ip_address: ipAddress,
        };

        // Handle tenant_id conversion if it exists
        if (event.tenant_id) {
            // If it's a string that can be a number, convert it. 
            // Our DB uses bigint for tenants.id
            const tid = Number(event.tenant_id);
            if (!isNaN(tid)) {
                logData.tenant_id = tid;
            }
        }

        const { error } = await supabaseAdmin.from('system_logs').insert(logData);

        if (error) {
            console.error('Supabase error logging event:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Critical failure in logSystemEvent:', err);
        // We return success: false instead of throwing to prevent "Unexpected response" errors in Next.js
        return { success: false, error: err.message || 'Unknown error' };
    }
}

export async function getSystemLogs(limit = 100, offset = 0) {
    try {
        const supabase = await createClient();

        // Check permission (RLS handles this, but we can double check)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        const { data, error, count } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching logs:', error);
            throw new Error('Failed to fetch logs');
        }

        return { logs: data || [], count: count || 0 };
    } catch (err) {
        console.error('getSystemLogs failure:', err);
        return { logs: [], count: 0, error: 'Failed to fetch' };
    }
}
