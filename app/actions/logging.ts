"use server";

import { createClient } from "@/lib/supabase-server";
import { SystemLogInsert } from "@/lib/types";
import { headers } from "next/headers";

/**
 * Common logging function
 */
async function logToDb(log: SystemLogInsert) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from("system_logs").insert(log);
        if (error) {
            console.error("DB Logging Error:", error);
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
        console.error("logSystemEvent Exception:", err);
    }
}

/**
 * Specialized login failure logger
 */
export async function logLoginFailure(email: string) {
    return logSystemEvent({
        event_type: "LOGIN_FAILED",
        severity: "WARNING",
        message: `Hatalı giriş denemesi: ${email}`,
        metadata: { email_attempt: email },
        user_id: null,
        tenant_id: null
    });
}

/**
 * Specialized login success logger
 */
export async function logLoginSuccess(userId: string, role: string) {
    return logSystemEvent({
        event_type: "LOGIN_SUCCESS",
        severity: "SUCCESS",
        message: `Başarılı giriş: ${role}`,
        user_id: userId,
        metadata: { role }
    });
}
