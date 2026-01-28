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
    user_id?: string | null;
    tenant_id?: number | string | null;
}

/**
 * Logs a system event.
 * Simplified and robust version.
 */
export async function logSystemEvent(event: SystemLogEvent) {
    console.log(`[logSystemEvent] Start: ${event.event_type}`);

    try {
        const supabaseAdmin = createAdminClient();

        let ipAddress: string | null = null;
        try {
            const headersList = await headers();
            const forwarded = headersList.get('x-forwarded-for');
            const realIp = headersList.get('x-real-ip');
            const ip = forwarded || realIp || null;

            if (ip) {
                ipAddress = ip.split(',')[0].trim();
                // Basic clean up
                if (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
                    ipAddress = null;
                }
            }
        } catch (hErr) {
            console.error('[logSystemEvent] Header error:', hErr);
        }

        // Prepare basic log data
        const logData: any = {
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id || null, // Ensure explicit null if empty
            ip_address: ipAddress,
            tenant_id: null // Default to null
        };

        // Handle tenant_id logic
        if (event.tenant_id) {
            const tid = Number(event.tenant_id);
            if (!isNaN(tid) && tid !== 0) {
                logData.tenant_id = tid;
            } else {
                // User requested to put role/string in tenant_id if empty, 
                // BUT database column is BIGINT. We cannot put text there.
                // We will put the raw value in details for audit purposes.
                logData.details = {
                    ...logData.details,
                    requested_tenant_id: event.tenant_id
                };
            }
        }

        // Explicitly set tenant_id to null if validation failed (double check)
        if (typeof logData.tenant_id !== 'number') {
            logData.tenant_id = null;
        }

        // Insert - NO check for existence, straight insert as requested
        const { error } = await supabaseAdmin
            .from('system_logs')
            .insert([logData]);

        if (error) {
            console.error('[logSystemEvent] DB Error:', error);
            return { success: false, error: error.message };
        }

        console.log(`[logSystemEvent] Success`);
        return { success: true };

    } catch (err: any) {
        console.error('[logSystemEvent] Critical:', err);
        return { success: false, error: err.message || 'Server crash' };
    }
}

export async function getSystemLogs(limit = 100, offset = 0) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { logs: [], count: 0, error: 'Unauthorized' };

        const { data, error, count } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { logs: data || [], count: count || 0 };
    } catch (err) {
        console.error('[getSystemLogs] Error:', err);
        return { logs: [], count: 0, error: 'Fetch failed' };
    }
}
