"use server";

import { createAdminClient } from "@/lib/admin";
import { SystemLogInsert } from "@/lib/types";
import { headers } from "next/headers";

/**
 * Common logging function using Admin Client to bypass RLS/Session issues
 */
async function logToDb(log: SystemLogInsert) {
    try {
        console.log(`[logToDb] Attempting database insert:`, JSON.stringify(log));

        // Statik olarak Admin Client kullanıyoruz, böylece auth/session bağımlılığı kalmaz.
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.from("system_logs").insert(log);

        if (error) {
            console.error("DB Logging Error:", error.message, error.details);
        } else {
            console.log("[logToDb] Insert successful");
        }
    } catch (err) {
        console.error("Critical Logging Exception:", err);
    }
}

/**
 * Logs a system event with IP and UA
 */
export async function logSystemEvent(
    log: Omit<SystemLogInsert, "ip_address" | "user_agent">
) {
    try {
        const headersList = await headers();
        let ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        if (ip.includes(",")) ip = ip.split(",")[0].trim();
        const ua = headersList.get("user-agent") || "unknown";

        await logToDb({
            ...log,
            ip_address: ip,
            user_agent: ua,
        });
    } catch (err) {
        // If headers() fails (e.g. in some edge cases), still try to log
        await logToDb({
            ...log,
            ip_address: "unknown",
            user_agent: "unknown",
        });
    }
}

/**
 * Specialized login failure logger
 */
export async function logLoginFailure(email: string) {
    // Always log errors to server console too for debugging
    console.log(`[LOGGING-FN] logLoginFailure called for: ${email}`);

    return await logSystemEvent({
        event_type: "LOGIN_FAILED",
        severity: "WARNING",
        message: `Hatalı giriş denemesi: ${email}`,
        metadata: { email_attempt: email },
        user_id: null,
        personnel_id: null
    });
}

/**
 * Specialized login success logger
 */
export async function logLoginSuccess(userId: string, role: string) {
    console.log(`[LOGGING-FN] logLoginSuccess called for user: ${userId} (${role})`);

    return await logSystemEvent({
        event_type: "LOGIN_SUCCESS",
        severity: "SUCCESS",
        message: `Başarılı giriş: ${role}`,
        user_id: userId,
        metadata: { role }
    });
}
