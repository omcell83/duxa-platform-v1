"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Get staff members with profiles for a tenant
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

    const { data: tenantUsers, error } = await supabase
      .from("tenant_users")
      .select(`
        id,
        user_id,
        role,
        is_active,
        profiles:user_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching staff:", error);
      return { success: false, error: "Personel listesi alınamadı" };
    }

    if (!tenantUsers || tenantUsers.length === 0) {
      return { success: true, data: [] };
    }

    const staffMembers = tenantUsers.map((tu: any) => ({
      id: tu.id,
      user_id: tu.user_id,
      role: tu.role,
      is_active: tu.is_active,
      profile: tu.profiles ? {
        full_name: tu.profiles.full_name || null,
        email: tu.profiles.email || "",
        avatar_url: tu.profiles.avatar_url || null,
      } : null,
    }));

    return { success: true, data: staffMembers };
  } catch (error: any) {
    console.error("Error in getStaffWithProfiles:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
