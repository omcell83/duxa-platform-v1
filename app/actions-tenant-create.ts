"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const createTenantSchema = z.object({
  name: z.string().min(1, "İşletme adı gereklidir"),
  commercial_name: z.string().optional().nullable(),
  slug: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  admin_full_name: z.string().min(1, "Yetkili ad soyad gereklidir"),
  admin_email: z.string().email("Geçerli bir email adresi giriniz"),
  admin_password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  contact_phone: z.string().optional().nullable(),
});

/**
 * Generate slug from business name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Check if slug is available and suggest alternatives
 */
async function checkSlugAvailability(slug: string): Promise<{ available: boolean; suggestion?: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tenants")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (!existing) {
    return { available: true };
  }

  // Generate suggestion with number suffix
  let counter = 1;
  let suggestion = `${slug}-${counter}`;
  let suggestionAvailable = false;

  while (!suggestionAvailable && counter < 100) {
    const { data: check } = await supabase
      .from("tenants")
      .select("slug")
      .eq("slug", suggestion)
      .single();

    if (!check) {
      suggestionAvailable = true;
    } else {
      counter++;
      suggestion = `${slug}-${counter}`;
    }
  }

  return { available: false, suggestion };
}

/**
 * Check if email is already registered
 */
async function checkEmailAvailability(email: string): Promise<boolean> {
  // Check in profiles table first (this works without service role key)
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", email)
    .single();

  if (profile) {
    return false; // Email already exists in profiles
  }

  // If service role key is available, also check auth.users
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return true; // Available if no profile found and no service key
  }

  // Check in auth.users (requires admin client)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // List users and filter by email (getUserByEmail doesn't exist in this version)
    const { data: users, error } = await adminClient.auth.admin.listUsers();
    
    if (error) {
      console.error("Error listing users:", error);
      // If we can't check auth, assume email is available (profiles check already passed)
      return true;
    }

    // Check if any user has this email
    const userExists = users?.users?.some((user) => user.email === email);
    
    if (userExists) {
      return false; // Email already exists in auth.users
    }
  } catch (error) {
    console.error("Error checking email in auth:", error);
    // If error, assume email is available (profiles check already passed)
    return true;
  }

  return true; // Email is available
}

/**
 * Create new tenant with admin user (Transaction-like logic)
 */
export async function createTenant(formData: FormData) {
  try {
    // Check if service role key is available FIRST
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { 
        success: false, 
        error: "SUPABASE_SERVICE_ROLE_KEY ortam değişkeni yapılandırılmamış. Lütfen Supabase Service Role Key'i ayarlayın." 
      };
    }

    const supabase = await createClient();

    // Get current user to verify super_admin role
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "Oturum bulunamadı" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return { success: false, error: "Yetkiniz yok" };
    }

    // Parse and validate form data
    const data = {
      name: formData.get("name") as string,
      commercial_name: formData.get("commercial_name") as string || null,
      slug: formData.get("slug") as string,
      admin_full_name: formData.get("admin_full_name") as string,
      admin_email: formData.get("admin_email") as string,
      admin_password: formData.get("admin_password") as string,
      contact_phone: formData.get("contact_phone") as string || null,
    };

    const validatedData = createTenantSchema.parse(data);

    // Check slug availability
    const slugCheck = await checkSlugAvailability(validatedData.slug);
    if (!slugCheck.available) {
      return {
        success: false,
        error: `Bu subdomain zaten kullanılıyor. Öneri: ${slugCheck.suggestion}`,
        suggestion: slugCheck.suggestion,
      };
    }

    // Check email availability
    const emailAvailable = await checkEmailAvailability(validatedData.admin_email);
    if (!emailAvailable) {
      return {
        success: false,
        error: "Bu email adresi zaten sistemde kayıtlı",
      };
    }

    // Use service role key for admin operations
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let createdUserId: string | null = null;
    let createdTenantId: number | null = null;

    try {
      // Step 1: Create user in auth.users
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: validatedData.admin_email,
        password: validatedData.admin_password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: validatedData.admin_full_name,
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: `Kullanıcı oluşturulamadı: ${authError?.message}` };
      }

      createdUserId = authData.user.id;

      // Step 2: Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: validatedData.name,
          commercial_name: validatedData.commercial_name,
          slug: validatedData.slug,
          contact_phone: validatedData.contact_phone,
          contact_email: validatedData.admin_email,
          status: "active",
        })
        .select()
        .single();

      if (tenantError || !tenantData) {
        // Rollback: Delete created user
        if (createdUserId) {
          await adminClient.auth.admin.deleteUser(createdUserId);
        }
        return { success: false, error: `İşletme oluşturulamadı: ${tenantError?.message}` };
      }

      createdTenantId = tenantData.id;

      // Step 3: Create profile with tenant_admin role and tenant_id
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: createdUserId,
          email: validatedData.admin_email,
          full_name: validatedData.admin_full_name,
          role: "tenant_admin",
          tenant_id: createdTenantId,
          is_active: true,
        });

      if (profileError) {
        // Rollback: Delete tenant and user
        if (createdTenantId) {
          await supabase.from("tenants").delete().eq("id", createdTenantId);
        }
        if (createdUserId) {
          await adminClient.auth.admin.deleteUser(createdUserId);
        }
        return { success: false, error: `Profil oluşturulamadı: ${profileError.message}` };
      }

      // Step 4: Link user to tenant in tenant_users table
      const { error: tenantUserError } = await supabase
        .from("tenant_users")
        .insert({
          tenant_id: createdTenantId,
          user_id: createdUserId,
          role: "owner",
          is_active: true,
        });

      if (tenantUserError) {
        // Rollback: Delete profile, tenant and user
        if (createdUserId) {
          await supabase.from("profiles").delete().eq("id", createdUserId);
        }
        if (createdTenantId) {
          await supabase.from("tenants").delete().eq("id", createdTenantId);
        }
        if (createdUserId) {
          await adminClient.auth.admin.deleteUser(createdUserId);
        }
        return { success: false, error: `Tenant kullanıcı bağlantısı oluşturulamadı: ${tenantUserError.message}` };
      }

      revalidatePath("/super-admin/tenants");
      return { success: true, tenantId: createdTenantId, userId: createdUserId };
    } catch (error: any) {
      // Rollback on any error
      if (createdUserId) {
        // Delete profile if exists
        try {
          const { error: deleteError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", createdUserId);
          if (deleteError) console.error("Rollback: Error deleting profile:", deleteError);
        } catch (e) {
          // Ignore errors during rollback
        }
        // Delete tenant_user if exists
        try {
          const { error: deleteError } = await supabase
            .from("tenant_users")
            .delete()
            .eq("user_id", createdUserId);
          if (deleteError) console.error("Rollback: Error deleting tenant_user:", deleteError);
        } catch (e) {
          // Ignore errors during rollback
        }
        // Delete auth user
        try {
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(createdUserId);
          if (deleteError) console.error("Rollback: Error deleting auth user:", deleteError);
        } catch (e) {
          // Ignore errors during rollback
        }
      }
      if (createdTenantId) {
        try {
          const { error: deleteError } = await supabase
            .from("tenants")
            .delete()
            .eq("id", createdTenantId);
          if (deleteError) console.error("Rollback: Error deleting tenant:", deleteError);
        } catch (e) {
          // Ignore errors during rollback
        }
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error in createTenant:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Generate slug suggestion from business name
 */
export async function generateSlugSuggestion(name: string): Promise<string> {
  const baseSlug = generateSlug(name);
  const check = await checkSlugAvailability(baseSlug);
  
  if (check.available) {
    return baseSlug;
  }
  
  return check.suggestion || `${baseSlug}-1`;
}
