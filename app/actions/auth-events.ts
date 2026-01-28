"use server";

import { logLoginSuccess } from "./logging";
import { resetFailedAttempts } from "./user-management";

/**
 * Consolidates post-login tasks into a single server call to improve stability
 * and reduce network roundtrips.
 */
export async function handlePostLoginTasks(userId: string, role: string, tenantId: number | null) {
    try {
        console.log(`[AUTH-EVENTS] Processing post-login for user ${userId}, role ${role}`);

        // 1. Reset failed attempts
        const resetResult = await resetFailedAttempts(userId);
        if (resetResult && 'success' in resetResult && !resetResult.success) {
            console.warn("[AUTH-EVENTS] Failed to reset attempts, but continuing:", resetResult.error);
        }

        // 2. Log success - THIS IS MANDATORY
        const logResult = await logLoginSuccess(userId, role, tenantId);

        if (!logResult.success) {
            console.error("[AUTH-EVENTS] CRITICAL: Log entry failed:", logResult.error);
            return {
                success: false,
                error: `Sistem günlüğü kaydedilemedi. Güvenlik gereği giriş engellendi. (${logResult.error})`
            };
        }

        console.log("[AUTH-EVENTS] Post-login tasks completed successfully.");
        return { success: true };
    } catch (error: any) {
        console.error("[AUTH-EVENTS] Critical error in handlePostLoginTasks:", error);
        return { success: false, error: `Sunucu hatası: ${error.message}` };
    }
}
