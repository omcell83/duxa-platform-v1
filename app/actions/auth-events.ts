"use server";

import { logLoginSuccess } from "./logging";
import { resetFailedAttempts } from "./user-management";

/**
 * Consolidates post-login tasks into a single server call to improve stability
 * and reduce network roundtrips.
 */
export async function handlePostLoginTasks(userId: string, role: string, tenantId: number | null) {
    try {
        // 1. Reset failed attempts
        await resetFailedAttempts(userId);

        // 2. Log success
        await logLoginSuccess(userId, role, tenantId);

        return { success: true };
    } catch (error: any) {
        console.error("[POST-LOGIN-TASKS] Failed:", error);
        // Return success: true anyway because we don't want to block the user
        // if logging or counter reset fails.
        return { success: true, warning: error.message };
    }
}
