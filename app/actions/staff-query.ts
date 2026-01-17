"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Get staff members from profiles table for a tenant
 * This server action fetches staff directly from profiles table
 */
export async function getStaffWithProfiles(tenantId: number): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    user_id: string;
    role: string;
    is_active: boolean;
    profile: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get profiles directly for this tenant
    // Filter out super_admin role (system admins should not appear in staff list)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, is_active, tenant_id")
      .eq("tenant_id", tenantId)
      .neq("role", "super_admin") // Exclude super_admin from staff list
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { success: false, error: "Profiles alınamadı" };
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, data: [] };
    }

    // Map profiles to staff members format
    const staffMembers = profiles.map((p) => ({
      id: p.id, // Use profile id instead of tenant_user id
      user_id: p.id, // user_id is same as profile id
      role: p.role || "staff",
      is_active: p.is_active ?? true,
      profile: {
        full_name: p.full_name || null,
        email: p.email || "",
        avatar_url: p.avatar_url || null,
      },
    }));

    return { success: true, data: staffMembers };
  } catch (error: any) {
    console.error("Error in getStaffWithProfiles:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}