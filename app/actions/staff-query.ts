"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";

/**
 * Get staff members with profiles for a tenant
 * @deprecated Use getTenantStaff instead for RLS bypass with proper authorization
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
      phone: string | null;
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
        profiles:profiles!tenant_users_profiles_fkey (
          full_name,
          email,
          avatar_url,
          phone
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
        phone: tu.profiles.phone || null,
      } : null,
    }));

    return { success: true, data: staffMembers };
  } catch (error: any) {
    console.error("Error in getStaffWithProfiles:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}

/**
 * Get tenant staff with profiles using Service Role (RLS bypass)
 * Includes authorization check before fetching data
 * 
 * Security flow:
 * 1. Verify user authentication (standard client)
 * 2. Verify user authorization for the tenant (permission check)
 * 3. Fetch data using admin client (bypasses RLS)
 * 
 * @param tenantId - The tenant ID to fetch staff for
 * @returns Staff members with profile information
 */
export async function getTenantStaff(tenantId: number): Promise<{
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
      phone: string | null;
    } | null;
  }>;
  error?: string;
}> {
  try {
    // 1. Kimlik Doğrulama
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Oturum açmanız gerekiyor" };
    }

    // 2. Yetki Kontrolü (Standart Client ile)
    const { data: membership, error: permError } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (
      permError ||
      !membership ||
      !["owner", "tenant_admin", "super_admin"].includes(membership.role)
    ) {
      return { success: false, error: "Bu işlem için yetkiniz yok" };
    }

    // 3. Veri Çekme (Admin Client ile - Service Role)
    const supabaseAdmin = createAdminClient();

    const { data: tenantUsers, error } = await supabaseAdmin
      .from("tenant_users")
      .select(`
        id,
        user_id,
        role,
        is_active,
        profiles:profiles!tenant_users_profiles_fkey (
          full_name,
          email,
          avatar_url,
          phone
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message || "Personel listesi alınamadı" };
    }

    if (!tenantUsers || tenantUsers.length === 0) {
      return { success: true, data: [] };
    }

    // Map the data to match the expected format
    const staffMembers = tenantUsers.map((tu: any) => ({
      id: tu.id,
      user_id: tu.user_id,
      role: tu.role,
      is_active: tu.is_active,
      profile: tu.profiles
        ? {
            full_name: tu.profiles.full_name || null,
            email: tu.profiles.email || "",
            avatar_url: tu.profiles.avatar_url || null,
            phone: tu.profiles.phone || null,
          }
        : null,
    }));

    return { success: true, data: staffMembers };
  } catch (error: any) {
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
