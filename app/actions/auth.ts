"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

/**
 * Send password reset email
 * Security: Always returns success to prevent email enumeration attacks
 */
export async function resetPasswordForEmail(email: string) {
  try {
    // Get origin from headers for callback URL
    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${origin}/auth/callback?next=/login/update-password`;

    // Check if user exists using admin client (silent check)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // If no service role key, we can't check, but still return success for security
      console.warn("SUPABASE_SERVICE_ROLE_KEY not configured, skipping user existence check");
      return { success: true };
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if user exists in auth.users
    let userExists = false;
    try {
      const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
      
      if (!listError && users?.users) {
        userExists = users.users.some((user) => user.email === email);
      }
    } catch (checkError) {
      console.error("Error checking user existence:", checkError);
      // On error, assume user doesn't exist but still return success
      return { success: true };
    }

    // Only send reset email if user exists
    if (userExists) {
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Error sending password reset email:", error);
        // Still return success to prevent email enumeration
        return { success: true };
      }
    }

    // Always return success (whether user exists or not) to prevent email enumeration
    return { success: true };
  } catch (error: any) {
    console.error("Error in resetPasswordForEmail:", error);
    // Always return success even on error to prevent email enumeration
    return { success: true };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updatePassword:", error);
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Update password and clear must_change_password flag
 */
export async function updatePasswordAndClearFlag(newPassword: string) {
  try {
    const supabase = await createClient();

    // Update password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      console.error("Error updating password:", passwordError);
      return { success: false, error: passwordError.message };
    }

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı" };
    }

    // Clear must_change_password flag
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", session.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updatePasswordAndClearFlag:", error);
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}
