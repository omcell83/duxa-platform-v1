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
 * Logs a system event to the database.
 * This is a MANDATORY action. If it fails, the calling process should be aware.
 */
export async function logSystemEvent(event: SystemLogEvent) {
    console.log(`[logSystemEvent] Attempting to log: ${event.event_type} - ${event.message}`);

    try {
        // Enforce mandatory environment check
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('SYSTEM LOG FAILURE: Missing Supabase Credentials in Environment');
            return {
                success: false,
                error: 'Server configuration error: Missing Supabase Admin Keys'
            };
        }

        const supabaseAdmin = createAdminClient();

        // Safety check for IP address
        let ipAddress: string | null = null;
        try {
            const headersList = await headers();
            const forwarded = headersList.get('x-forwarded-for');
            const realIp = headersList.get('x-real-ip');
            const ip = forwarded || realIp || null;

            if (ip) {
                ipAddress = ip.split(',')[0].trim();
                if (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
                    ipAddress = null;
                }
            }
        } catch (hError) {
            console.error('Logging Headers Error (Continuing without IP):', hError);
        }

        // Prepare data for insertion (Only include fields that exist)
        const logData: any = {
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id || null,
            ip_address: ipAddress,
        };

        // Strict tenant_id handling: Only bigint compatible numbers allowed
        if (event.tenant_id !== undefined && event.tenant_id !== null && event.tenant_id !== '') {
            const tid = Number(event.tenant_id);
            if (!isNaN(tid) && tid !== 0) {
                logData.tenant_id = tid;
            }
        }

        const { error } = await supabaseAdmin
            .from('system_logs')
            .insert(logData);

        if (error) {
            console.error('SUPABASE DB LOG ERROR:', error);
            return { success: false, error: `Database Error: ${error.message}` };
        }

        console.log(`[logSystemEvent] Success: ${event.event_type}`);
        return { success: true };
    } catch (err: any) {
        console.error('SYSTEM LOG CRITICAL FAILURE:', err);
        // Ensure we always return a serializable object, never an Error instance
        return {
            success: false,
            error: err.message || 'Critical internal failure during logging'
        };
    }
}

export async function getSystemLogs(limit = 100, offset = 0) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Unauthorized');

        const { data, error, count } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { logs: data || [], count: count || 0 };
    } catch (err) {
        console.error('getSystemLogs failure:', err);
        return { logs: [], count: 0, error: 'Failed to fetch logs' };
    }
}
