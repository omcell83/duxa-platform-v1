"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface SecuritySettings {
    min_password_length: number;
    require_special_char: boolean;
    require_number: boolean;
    require_uppercase: boolean;
    max_login_attempts: number;
    session_timeout_minutes: number;
    two_factor_enforced: boolean;
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    min_password_length: 8,
    require_special_char: true,
    require_number: true,
    require_uppercase: true,
    max_login_attempts: 5,
    session_timeout_minutes: 60,
    two_factor_enforced: false,
};

export async function getSecuritySettings(): Promise<SecuritySettings> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "security")
            .single();

        if (error) {
            console.error("Error fetching security settings:", error);
            // Fallback to default if not found or error (e.g. table doesn't exist yet)
            return DEFAULT_SECURITY_SETTINGS;
        }

        // Merge with defaults to ensure all keys exist
        return { ...DEFAULT_SECURITY_SETTINGS, ...data.value };
    } catch (error) {
        console.error("Unexpected error fetching security settings:", error);
        return DEFAULT_SECURITY_SETTINGS;
    }
}

export async function updateSecuritySettings(settings: SecuritySettings): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
        // Check authentication and role (double check on server side)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // We can explicitly check for super_admin role here if we want strict enforcement before DB call,
        // but RLS will also handle it. Let's rely on RLS and standard Supabase checks.

        const { error } = await supabase
            .from("system_settings")
            .upsert({
                key: "security",
                value: settings,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error updating security settings:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/super-admin/settings/security");
        return { success: true };
    } catch (error: any) {
        console.error("Unexpected error updating security settings:", error);
        return { success: false, error: error.message || "Unknown error" };
    }
}
