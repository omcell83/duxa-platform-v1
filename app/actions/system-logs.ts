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
 * This version is designed to be extremely stable and never throw "Unexpected response".
 */
export async function logSystemEvent(event: SystemLogEvent) {
    // Server-side logging for debugging in Coolify/Docker logs
    console.log(`[LOG_SYSTEM_EVENT_START] ${event.event_type}: ${event.message}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[LOG_SYSTEM_EVENT_ERROR] Missing Supabase environment variables');
            return {
                success: false,
                error: 'Sistem konfigürasyonu eksik (Supabase Keys)'
            };
        }

        const supabaseAdmin = createAdminClient();

        // Get IP safely
        let ipAddress: string | null = null;
        try {
            // In Next.js 15+, headers() is a Promise. We must await it.
            const headersList = await headers();
            const forwarded = headersList.get('x-forwarded-for');
            const realIp = headersList.get('x-real-ip');
            const ip = forwarded || realIp || null;

            if (ip) {
                ipAddress = ip.split(',')[0].trim();
                // inet type validation: ignore invalid/private IPs if they cause issues
                if (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
                    ipAddress = null;
                }
            }
        } catch (hErr) {
            console.warn('[LOG_SYSTEM_EVENT_IP_WARN] Could not retrieve headers', hErr);
        }

        // Prepare simple log data
        const logData: any = {
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id || null,
            ip_address: ipAddress,
            tenant_id: null
        };

        // Handle tenant_id conversion
        // Ensure we don't pass 0 or empty strings to a bigint field
        if (event.tenant_id !== undefined && event.tenant_id !== null) {
            const tid = Number(event.tenant_id);
            if (!isNaN(tid) && tid !== 0) {
                logData.tenant_id = tid;
            }
        }

        const { error } = await supabaseAdmin
            .from('system_logs')
            .insert([logData]);

        if (error) {
            console.error('[LOG_SYSTEM_EVENT_DB_ERROR]', error);
            return {
                success: false,
                error: `Veritabanı Hatası: ${error.message}`
            };
        }

        console.log(`[LOG_SYSTEM_EVENT_SUCCESS] ${event.event_type}`);
        return { success: true };

    } catch (err: any) {
        console.error('[LOG_SYSTEM_EVENT_CRITICAL_ERROR]', err);
        // Next.js Server Actions MUST return a plain object and MUST NOT throw to avoid "Unexpected response"
        return {
            success: false,
            error: err.message || 'Bilinmeyen bir sunucu hatası oluştu'
        };
    }
}

export async function getSystemLogs(limit = 100, offset = 0) {
    try {
        const supabase = await createClient();

        // Use getUser() as recommended by Supabase for security
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('[GET_SYSTEM_LOGS_AUTH_ERROR]', userError);
            return { logs: [], count: 0, error: 'Yetkisiz erişim' };
        }

        const { data, error, count } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[GET_SYSTEM_LOGS_DB_ERROR]', error);
            return { logs: [], count: 0, error: 'Loglar getirilemedi' };
        }

        return {
            logs: data || [],
            count: count || 0,
            success: true
        };
    } catch (err: any) {
        console.error('[GET_SYSTEM_LOGS_CRITICAL_ERROR]', err);
        return { logs: [], count: 0, error: 'Sunucu hatası' };
    }
}
