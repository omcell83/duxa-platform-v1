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
    tenant_id?: string;
}

export async function logSystemEvent(event: SystemLogEvent) {
    try {
        const supabaseAdmin = createAdminClient();
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

        // Parse IP if it's a list (x-forwarded-for can be comma separated)
        const ipAddress = ip ? ip.split(',')[0].trim() : 'unknown';

        const { error } = await supabaseAdmin.from('system_logs').insert({
            event_type: event.event_type,
            severity: event.severity,
            message: event.message,
            details: event.details || {},
            user_id: event.user_id,
            tenant_id: event.tenant_id,
            ip_address: ipAddress,
        });

        if (error) {
            console.error('Failed to log system event:', error);
            // Don't throw, just log to console to not break the app flow
        }
    } catch (err) {
        console.error('Error in logSystemEvent:', err);
    }
}

export async function getSystemLogs(limit = 100, offset = 0) {
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

    return { logs: data, count };
}
