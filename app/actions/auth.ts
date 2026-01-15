"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email: string) {
  try {
    const supabase = await createClient();
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/login/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in resetPasswordForEmail:", error);
    return { success: false, error: error.message || "Bir hata oluştu" };
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
