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
 * DEBUG MODE: Log System Event
 * Returns explicit error strings instead of throwing.
 */
export async function logSystemEvent(event: SystemLogEvent) {
    // 1. Initial Server Log
    console.log('--- [DEBUG] logSystemEvent CALLED ---');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // 2. Env Var Check
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            console.error('[DEBUG] Missing Env Vars');
            return {
                success: false,
                error: `Missing ENV: URL=${!!url}, KEY=${!!key}`,
                debug: { url: !!url, key: !!key }
            };
        }

        // 3. Admin Client Creation
        let supabaseAdmin;
        try {
            supabaseAdmin = createAdminClient();
        } catch (clientErr: any) {
            console.error('[DEBUG] Admin Client Creation Failed:', clientErr);
            return { success: false, error: `Client Init Failed: ${clientErr.message}` };
        }

        // 4. IP Extraction (Safe)
        let ipAddress: string | null = null;
        try {
            const headersList = await headers();
            const forwarded = headersList.get('x-forwarded-for');
            const realIp = headersList.get('x-real-ip');
            const ip = forwarded || realIp || null;
            if (ip) {
                ipAddress = ip.split(',')[0].trim();
                // Basic cleanup
                if (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
                    ipAddress = null;
                }
            }
        } catch (hErr) {
            console.warn('[DEBUG] Header Warning:', hErr);
            // Ignore header errors
        }

        // 5. Data Preparation
        const logData: any = {
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id || null, // Ensure explicit null
            ip_address: ipAddress,
            tenant_id: null // Default null
        };

        // 6. Tenant ID Handling (Safe)
        if (event.tenant_id !== undefined && event.tenant_id !== null) {
            const tid = Number(event.tenant_id);
            if (!isNaN(tid) && tid !== 0) {
                logData.tenant_id = tid;
            } else {
                // If invalid number, log in details
                logData.details.invalid_tenant_id_attempt = event.tenant_id;
            }
        }

        console.log('[DEBUG] Prepared Log Data:', JSON.stringify(logData, null, 2));

        // 7. Supabase Insert
        const { data, error } = await supabaseAdmin
            .from('system_logs')
            .insert([logData])
            .select()
            .single();

        if (error) {
            console.error('[DEBUG] Supabase Insert Error:', error);
            // Return raw error message
            return {
                success: false,
                error: `DB Error: ${error.message} (Code: ${error.code})`,
                full_error: error
            };
        }

        console.log('[DEBUG] Insert Success:', data);
        return { success: true, id: data.id };

    } catch (criticalErr: any) {
        // 8. Catch All
        console.error('[DEBUG] Critical Catch:', criticalErr);
        return {
            success: false,
            error: `CRITICAL EXCEPTION: ${criticalErr.message}`,
            stack: criticalErr.stack
        };
    }
}

export async function getSystemLogs(limit = 100, offset = 0) {
    // Basic get implementation
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
        return { logs: [], count: 0, error: 'Fetch failed' };
    }
}
