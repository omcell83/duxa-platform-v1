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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // If service role key is not available, only check profiles table
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();

    return !profile; // Available if no profile found
  }

  // Check in auth.users (requires admin client)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data: authUser } = await adminClient.auth.admin.getUserByEmail(email);
    
    if (authUser?.user) {
      return false; // Email already exists
    }
  } catch (error) {
    console.error("Error checking email in auth:", error);
    // Continue to check profiles table
  }

  // Also check in profiles table
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", email)
    .single();

  return !profile; // Available if no profile found
}

/**
 * Create new tenant with admin user (Transaction-like logic)
 */
export async function createTenant(formData: FormData) {
  try {
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

    // Check email availability (only if service role key is available)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const emailAvailable = await checkEmailAvailability(validatedData.admin_email);
      if (!emailAvailable) {
        return {
          success: false,
          error: "Bu email adresi zaten sistemde kayıtlı",
        };
      }
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: "Service role key yapılandırılmamış. Lütfen SUPABASE_SERVICE_ROLE_KEY ortam değişkenini ayarlayın." };
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

      // Step 3: Create profile with tenant_admin role
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: createdUserId,
          email: validatedData.admin_email,
          full_name: validatedData.admin_full_name,
          role: "tenant_admin",
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

      revalidatePath("/super-admin/tenants");
      return { success: true, tenantId: createdTenantId };
    } catch (error: any) {
      // Rollback on any error
      if (createdTenantId) {
        await supabase.from("tenants").delete().eq("id", createdTenantId);
      }
      if (createdUserId) {
        await adminClient.auth.admin.deleteUser(createdUserId);
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error in createTenant:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
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
