"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Kullanıcının tema tercihini veritabanında günceller
 * @param theme - 'light', 'dark', veya 'system'
 */
export async function updateUserTheme(theme: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate theme value
    if (!["light", "dark", "system"].includes(theme)) {
      return { success: false, error: "Invalid theme value" };
    }

    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Update theme in profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ theme })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating theme:", updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate relevant paths
    revalidatePath("/");
    revalidatePath("/super-admin");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateUserTheme:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Kullanıcının kayıtlı tema tercihini veritabanından getirir
 * @returns 'light', 'dark', 'system' veya null
 */
export async function getUserTheme(): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get theme from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile.theme || "system";
  } catch (error) {
    console.error("Error in getUserTheme:", error);
    return null;
  }
}
