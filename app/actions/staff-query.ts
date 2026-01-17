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
    console.log("--- STAFF FETCH START ---", { tenantId, timestamp: new Date().toISOString() });

    // STEP 1: Authentication check using standard client
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("--- AUTH CHECK ---", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError ? JSON.stringify(authError, null, 2) : null,
    });

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return { success: false, error: "Oturum bulunamadı" };
    }

    // STEP 2: Authorization check - verify user has permission for this tenant
    // Check if user is admin/owner in this tenant
    const { data: tenantUser, error: permissionError } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    console.log("--- PERMISSION CHECK ---", {
      tenantUser: tenantUser ? JSON.stringify(tenantUser, null, 2) : null,
      permissionError: permissionError ? JSON.stringify(permissionError, null, 2) : null,
      tenantId,
      userId: user.id,
    });

    if (permissionError || !tenantUser) {
      console.error("Permission error:", permissionError);
      return { success: false, error: "Bu işletme için yetkiniz bulunmamaktadır" };
    }

    // Verify user has admin/owner role
    const userRole = (tenantUser.role || "").trim().toLowerCase();
    const isAuthorized = 
      userRole === "tenant_admin" || 
      userRole === "super_admin" || 
      userRole === "owner";

    console.log("--- AUTHORIZATION RESULT ---", {
      userRole,
      isAuthorized,
    });

    if (!isAuthorized) {
      return { success: false, error: "Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır" };
    }

    // STEP 3: Fetch data using admin client (bypasses RLS)
    console.log("--- CREATING ADMIN CLIENT ---");
    const supabaseAdmin = createAdminClient();
    console.log("--- ADMIN CLIENT CREATED ---");

    // STEP 3a: Simple query first - check if there are any tenant_users records
    console.log("--- RAW QUERY START ---", { tenantId });
    const { data: rawUsers, error: rawError } = await supabaseAdmin
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", tenantId);

    console.log("--- RAW QUERY RESULT ---", {
      rawUsersCount: rawUsers?.length ?? 0,
      rawError: rawError ? JSON.stringify(rawError, null, 2) : null,
      rawUsersData: rawUsers ? JSON.stringify(rawUsers, null, 2) : null,
    });

    if (rawError) {
      console.error("--- RAW QUERY ERROR ---", rawError);
      return { 
        success: false, 
        error: `Veri çekme hatası: ${rawError.message || JSON.stringify(rawError)}` 
      };
    }

    if (!rawUsers || rawUsers.length === 0) {
      console.log("--- NO RAW USERS FOUND ---", { tenantId });
      return { success: true, data: [] };
    }

    // STEP 3b: Try join query with Foreign Key hint
    console.log("--- JOIN QUERY START ---", { tenantId });
    const { data: joinData, error: joinError } = await supabaseAdmin
      .from("tenant_users")
      .select("*, profiles!tenant_users_profiles_fkey(*)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    console.log("--- JOIN QUERY RESULT ---", {
      joinDataCount: joinData?.length ?? 0,
      joinError: joinError ? JSON.stringify(joinError, null, 2) : null,
      joinDataSample: joinData && joinData.length > 0 
        ? JSON.stringify(joinData[0], null, 2) 
        : null,
    });

    if (joinError) {
      console.error("--- JOIN QUERY ERROR ---", joinError);
      // Throw the error so we can see it in UI
      throw new Error(`Join hatası: ${joinError.message || JSON.stringify(joinError)}`);
    }

    // STEP 3c: Try the original query format with specific fields
    console.log("--- SPECIFIC JOIN QUERY START ---", { tenantId });
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

    console.log("--- SPECIFIC JOIN QUERY RESULT ---", {
      tenantUsersCount: tenantUsers?.length ?? 0,
      error: error ? JSON.stringify(error, null, 2) : null,
      tenantUsersSample: tenantUsers && tenantUsers.length > 0 
        ? JSON.stringify(tenantUsers[0], null, 2) 
        : null,
    });

    if (error) {
      console.error("--- SPECIFIC JOIN QUERY ERROR ---", error);
      // If raw users exist but join fails, this is likely a Foreign Key issue
      if (rawUsers && rawUsers.length > 0) {
        throw new Error(
          `Foreign Key hatası: Veriler var ancak join yapılamıyor. ` +
          `Foreign Key ismini kontrol edin: tenant_users_profiles_fkey. ` +
          `Hata: ${error.message || JSON.stringify(error)}`
        );
      }
      return { success: false, error: `Personel listesi alınamadı: ${error.message || JSON.stringify(error)}` };
    }

    if (!tenantUsers || tenantUsers.length === 0) {
      console.log("--- NO TENANT USERS AFTER JOIN ---", { 
        tenantId,
        rawUsersCount: rawUsers?.length,
        note: "Raw users var ama join sonrası boş" 
      });
      return { success: true, data: [] };
    }

    console.log("--- MAPPING DATA START ---", { tenantUsersCount: tenantUsers.length });

    // Map the data to match the expected format
    const staffMembers = tenantUsers.map((tu: any) => {
      console.log("--- MAPPING USER ---", {
        id: tu.id,
        user_id: tu.user_id,
        hasProfile: !!tu.profiles,
        profileData: tu.profiles ? JSON.stringify(tu.profiles, null, 2) : null,
      });

      return {
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
      };
    });

    console.log("--- MAPPING COMPLETE ---", {
      staffMembersCount: staffMembers.length,
      staffMembersSample: staffMembers.length > 0 
        ? JSON.stringify(staffMembers[0], null, 2) 
        : null,
    });

    console.log("--- STAFF FETCH SUCCESS ---", {
      tenantId,
      staffCount: staffMembers.length,
      timestamp: new Date().toISOString(),
    });

    return { success: true, data: staffMembers };
  } catch (error: any) {
    console.error("--- STAFF FETCH ERROR ---", {
      error: error?.message || JSON.stringify(error, null, 2),
      stack: error?.stack,
      tenantId,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
