"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Get staff members with profiles for a tenant
 * This server action ensures proper UUID matching between tenant_users and profiles
 */
export async function getStaffWithProfiles(tenantId: number): Promise<{
  success: boolean;
  data?: Array<{
    id: number;
    user_id: string;
    role: string;
    is_active: boolean;
    profile: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get tenant_users
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from("tenant_users")
      .select("id, user_id, role, is_active")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (tenantUsersError) {
      console.error("Error fetching tenant_users:", tenantUsersError);
      return { success: false, error: "Tenant users alınamadı" };
    }

    const validTenantUsers = tenantUsers?.filter((tu) => tu.user_id) || [];

    if (validTenantUsers.length === 0) {
      return { success: true, data: [] };
    }

    // Get user IDs - keep as UUID format
    const userIds = validTenantUsers.map((tu) => tu.user_id);

    // Get profiles - use .in() with UUID array
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { success: false, error: "Profiles alınamadı" };
    }

    // Create a Map for fast lookup - normalize UUIDs to lowercase strings
    const profilesMap = new Map<string, { full_name: string | null; email: string; avatar_url: string | null }>();
    
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        if (p.id) {
          // Normalize UUID to lowercase string for consistent matching
          const normalizedId = String(p.id).toLowerCase().trim();
          profilesMap.set(normalizedId, {
            full_name: p.full_name || null,
            email: p.email || "",
            avatar_url: p.avatar_url || null,
          });
        }
      }
    }

    // Combine data - normalize both UUIDs for matching
    const staffMembers = validTenantUsers.map((tu) => {
      // Normalize user_id to lowercase string for matching
      const normalizedUserId = String(tu.user_id).toLowerCase().trim();
      const profileData = profilesMap.get(normalizedUserId) || null;
      
      return {
        id: tu.id,
        user_id: tu.user_id,
        role: tu.role,
        is_active: tu.is_active,
        profile: profileData,
      };
    });

    return { success: true, data: staffMembers };
  } catch (error: any) {
    console.error("Error in getStaffWithProfiles:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
