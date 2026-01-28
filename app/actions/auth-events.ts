"use server";

import { createAdminClient } from "@/lib/admin";

/**
 * Consolidated post-login tasks in a SINGLE self-contained function
 * to minimize dependencies and potential serialization/import errors.
 */
export async function handlePostLoginTasks(userId: string, role: string, tenantId: number | null) {
    try {
        console.log(`[AUTH-EVENTS] Self-contained start for user ${userId}`);

        const supabaseAdmin = createAdminClient();

        // 1. Reset failed attempts
        const { error: resetError } = await supabaseAdmin
            .from('profiles')
            .update({ failed_login_attempts: 0 })
            .eq('id', userId);

        if (resetError) {
            console.error("[AUTH-EVENTS] Reset attempts failed:", resetError.message);
        }

        // 2. Log success - SELF-CONTAINED INSERT
        const cleanData = {
            event_type: "LOGIN_SUCCESS",
            severity: "SUCCESS",
            message: `Başarılı giriş: ${role}`,
            user_id: userId,
            tenant_id: tenantId ? Number(tenantId) : null,
            ip_address: "unknown",
            user_agent: "unknown",
            metadata: { role }
        };

        const { error: logError } = await supabaseAdmin
            .from("system_logs")
            .insert(cleanData);

        if (logError) {
            console.error("[AUTH-EVENTS] Log insert failed:", logError.message);
            return {
                success: false,
                error: `Log hatası: ${logError.message}`
            };
        }

        console.log("[AUTH-EVENTS] All tasks done.");
        return { success: true };
    } catch (error: any) {
        console.error("[AUTH-EVENTS] Fatal crash:", error);
        return {
            success: false,
            error: `Sistem hatası: ${error.message || 'Bilinmeyen'}`
        };
    }
}
