"use server";

import { createAdminClient } from "@/lib/admin";
import { SystemLogInsert } from "@/lib/types";
import { headers } from "next/headers";

/**
 * Common logging function using Admin Client to bypass RLS/Session issues
 */
async function logToDb(log: SystemLogInsert): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[logToDb] Input:`, JSON.stringify(log));

        const supabaseAdmin = createAdminClient();

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
        ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();
        ua = headersList.get("user-agent") || "unknown";
    } catch (err) {
        console.warn("Headers access failed");
    }

    return await logToDb({
        ...log,
        ip_address: ip,
        user_agent: ua,
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
 * Specialized login success logger
 */
export async function logLoginSuccess(userId: string, role: string) {
    try {
        console.log(`[LOGGING-FN] logLoginSuccess for ${userId}`);
        return await logSystemEvent({
            event_type: "LOGIN_SUCCESS",
            severity: "SUCCESS",
            message: `Başarılı giriş: ${role}`,
            user_id: userId,
            metadata: { role },
            personnel_id: null,
            tenant_id: null
        });
    } catch (err: any) {
        console.error("[LOGGING-FN] Crash in logLoginSuccess:", err);
        return { success: false, error: err.message };
    }
}
