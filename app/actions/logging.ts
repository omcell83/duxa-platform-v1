"use server";

import { createAdminClient } from "@/lib/admin";
import { SystemLogInsert } from "@/lib/types";
import { headers } from "next/headers";

/**
 * Common logging function using Admin Client to bypass RLS/Session issues
 */
async function logToDb(log: SystemLogInsert): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseAdmin = createAdminClient();
        console.log(`[logToDb] Input:`, JSON.stringify(log));

        // Ensure strictly serializable data for Postgres
        const cleanData = {
            event_type: String(log.event_type),
            severity: log.severity,
            message: String(log.message),
            user_id: log.user_id || null,
            personnel_id: log.personnel_id || null,
            tenant_id: log.tenant_id || null,
            ip_address: log.ip_address || "unknown",
            user_agent: log.user_agent || "unknown",
            metadata: log.metadata || {}
        };

        const { error } = await supabaseAdmin.from("system_logs").insert(cleanData);

        if (error) {
            console.error("DB Logging Error:", error.message, error.details);
            return { success: false, error: `${error.message} (${error.details || ''})` };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Critical Logging Exception:", err);
        return { success: false, error: err.message || "Bilinmeyen sunucu hatası" };
    }
}

/**
 * Logs a system event with IP and UA
 */
export async function logSystemEvent(
    log: Omit<SystemLogInsert, "ip_address" | "user_agent">
): Promise<{ success: boolean; error?: string }> {
    let ip = "unknown";
    let ua = "unknown";

    try {
        const headersList = await headers();
        if (headersList) {
            const forwardedFor = headersList.get("x-forwarded-for");
            const realIp = headersList.get("x-real-ip");
            ip = forwardedFor || realIp || "unknown";
            if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();
            ua = headersList.get("user-agent") || "unknown";
        }
    } catch (err) {
        // Silently fail, we already have "unknown" defaults
    }

    return await logToDb({
        ...log,
        ip_address: String(ip).substring(0, 50),
        user_agent: String(ua).substring(0, 255),
    });
}

/**
 * Specialized login failure logger
 */
export async function logLoginFailure(email: string) {
    try {
        return await logSystemEvent({
            event_type: "LOGIN_FAILED",
            severity: "WARNING",
            message: `Hatalı giriş denemesi: ${email}`,
            metadata: { email_attempt: email },
            user_id: null,
            personnel_id: null,
            tenant_id: null
        });
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Specialized login blocked logger
 */
export async function logLoginBlocked(email: string, userId?: string | null, tenantId?: number | null) {
    try {
        let finalUserId = userId;
        let finalTenantId = tenantId;

        // If we don't have ID or TenantId, try to lookup from profile by email
        if (!finalUserId || finalTenantId === undefined) {
            const supabaseAdmin = createAdminClient();
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id, tenant_id')
                .eq('email', email)
                .single();

            if (profile) {
                if (!finalUserId) finalUserId = profile.id;
                if (finalTenantId === undefined || finalTenantId === null) finalTenantId = profile.tenant_id;
            }
        }

        return await logSystemEvent({
            event_type: "LOGIN_BLOCKED",
            severity: "WARNING",
            message: `Engellenen kullanıcı girişi: ${email}`,
            user_id: finalUserId || null,
            tenant_id: finalTenantId || null,
            metadata: { email, reason: "banned_or_inactive" },
            personnel_id: null
        });
    } catch (err: any) {
        console.error("Error in logLoginBlocked:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Specialized login success logger
 */
export async function logLoginSuccess(userId: string, role: string, tenantId?: number | null) {
    try {
        return await logSystemEvent({
            event_type: "LOGIN_SUCCESS",
            severity: "SUCCESS",
            message: `Başarılı giriş: ${role}`,
            user_id: userId,
            tenant_id: tenantId || null,
            metadata: { role },
            personnel_id: null
        });
    } catch (err: any) {
        console.error("[LOGGING-FN] Crash in logLoginSuccess:", err);
        return { success: false, error: err.message };
    }
}
