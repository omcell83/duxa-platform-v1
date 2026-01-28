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
 * MANDATORY SYSTEM LOGGING
 * This action is designed to be extremely stable.
 * CRITICAL: Never return non-serializable objects (like Error instances) to prevent Next.js crashes.
 */
export async function logSystemEvent(event: SystemLogEvent) {
    // Server log for Coolify/Console inspection
    console.log(`[logSystemEvent] Monitoring: ${event.event_type} - ${event.message}`);

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
                if (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
                    ipAddress = null;
                }
            }
        } catch (hErr) {
            console.warn('[logSystemEvent] Header error ignored');
        }

        // 1. Prepare log data
        const logData: any = {
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id || null,
            ip_address: ipAddress,
            tenant_id: null
        };

        // 2. User/Role Logic for Tenant ID
        // Note: tenant_id is BIGINT in DB. We CANNOT write strings there.
        // If tenant_id is missing, we log it in details but keep DB column NULL.
        if (event.tenant_id) {
            const tid = Number(event.tenant_id);
            if (!isNaN(tid) && tid !== 0) {
                logData.tenant_id = tid;
            } else {
                // For non-numeric tenant IDs (like roles), put in details as requested
                logData.details.role_as_tenant = String(event.tenant_id);
            }
        }

        // 3. Insert without complex checks
        // We use insert().select() but only return serializable bits
        const { data, error } = await supabaseAdmin
            .from('system_logs')
            .insert([logData])
            .select('id')
            .single();

        if (error) {
            console.error('[logSystemEvent] DB ERROR:', error.message);
            // DO NOT return the error object itself, it crashes Next.js serialization
            return {
                success: false,
                error: `Database: ${error.message}`,
                code: error.code
            };
        }

        return { success: true, id: data?.id };

    } catch (err: any) {
        console.error('[logSystemEvent] FATAL:', err.message);
        return {
            success: false,
            error: err.message || 'Fatal server error'
        };
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
    } catch (err: any) {
        return { logs: [], count: 0, error: err.message };
    }
}
