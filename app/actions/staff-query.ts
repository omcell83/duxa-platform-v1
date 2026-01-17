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
    // List all profiles that have the same tenant_id as the logged-in user
    // This includes all roles: owner, tenant_admin, manager, staff, kitchen, courier
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, is_active, tenant_id")
      .eq("tenant_id", tenantId) // Get all profiles with the same tenant_id
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      console.error("Profile error details:", {
        code: profilesError.code,
        message: profilesError.message,
        details: profilesError.details,
        hint: profilesError.hint,
      });
      return { success: false, error: "Profiles alınamadı" };
    }

    console.log("Staff query result:", {
      tenantId,
      profilesCount: profiles?.length || 0,
      profiles: profiles?.map(p => ({ id: p.id, email: p.email, role: p.role, tenant_id: p.tenant_id })),
    });

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found for tenant_id:", tenantId);
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