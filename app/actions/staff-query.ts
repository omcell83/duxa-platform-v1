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

    // Get profiles - try multiple approaches
    let profiles: any[] = [];
    
    // Strategy 1: Try .in() with UUID array directly (works for UUID types)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds); // Keep as UUID array, not string

    if (profilesError) {
      console.error("Error fetching profiles with .in() (UUID):", profilesError);
      console.error("Profile error code:", profilesError.code);
      console.error("Profile error message:", profilesError.message);
      
      // Strategy 2: Try .in() with string array
      console.log("Attempting fallback: trying .in() with string array...");
      const userIdsString = userIds.map((id) => String(id));
      const { data: profilesData2, error: profilesError2 } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIdsString);
      
      if (profilesError2) {
        console.error("Error fetching profiles with .in() (string):", profilesError2);
        
        // Strategy 3: Fallback to individual queries (slower but reliable)
        console.log("Attempting final fallback: fetching profiles individually...");
        const profilePromises = userIds.map(async (userId) => {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .eq("id", userId)
            .single();
          if (error) {
            console.error(`Error fetching profile for ${userId}:`, error);
            return null;
          }
          return data;
        });
        
        const profileResults = await Promise.all(profilePromises);
        profiles = profileResults.filter((p) => p !== null && p !== undefined);
        console.log(`Fallback: Found ${profiles.length} profiles out of ${userIds.length} user IDs`);
      } else {
        profiles = profilesData2 || [];
        console.log(`String array .in() worked: Found ${profiles.length} profiles`);
      }
    } else {
      profiles = profilesData || [];
      console.log(`UUID array .in() worked: Found ${profiles.length} profiles`);
    }

    // Create a Map for fast lookup - normalize UUIDs to lowercase strings
    const profilesMap = new Map<string, { full_name: string | null; email: string; avatar_url: string | null }>();
    
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        if (p && p.id) {
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
