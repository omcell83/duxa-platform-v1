"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const tenantUpdateSchema = z.object({
  name: z.string().min(1, "İşletme adı gereklidir"),
  commercial_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email("Geçerli bir email adresi giriniz").optional().nullable(),
  contact_address: z.string().optional().nullable(),
});

const subscriptionUpdateSchema = z.object({
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  contract_price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır").optional(),
  payment_status: z.enum(["paid", "pending", "overdue", "cancelled", "refunded"]).optional(),
});

const settingsUpdateSchema = z.object({
  slug: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  is_online: z.boolean().optional(),
});

/**
 * Update tenant general information
 */
export async function updateTenantGeneralInfo(
  tenantId: number,
  formData: FormData
) {
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
      contact_phone: formData.get("contact_phone") as string || null,
      contact_email: formData.get("contact_email") as string || null,
      contact_address: formData.get("contact_address") as string || null,
    };

    const validatedData = tenantUpdateSchema.parse(data);

    // Update tenant
    const { error } = await supabase
      .from("tenants")
      .update(validatedData)
      .eq("id", tenantId);

    if (error) {
      console.error("Error updating tenant:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/super-admin/tenants/${tenantId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateTenantGeneralInfo:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Suspend/Unsuspend tenant
 */
export async function toggleTenantStatus(tenantId: number) {
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

    // Get current tenant status
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("status")
      .eq("id", tenantId)
      .single();

    if (fetchError || !tenant) {
      return { success: false, error: "İşletme bulunamadı" };
    }

    // Toggle status
    const newStatus = tenant.status === "suspended" ? "active" : "suspended";

    const { error } = await supabase
      .from("tenants")
      .update({ status: newStatus })
      .eq("id", tenantId);

    if (error) {
      console.error("Error updating tenant status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/super-admin/tenants/${tenantId}`);
    return { success: true, status: newStatus };
  } catch (error: any) {
    console.error("Error in toggleTenantStatus:", error);
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Reset password for tenant user
 */
export async function resetTenantPassword(tenantEmail: string) {
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

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(tenantEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login?reset=true`,
    });

    if (error) {
      console.error("Error sending password reset:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in resetTenantPassword:", error);
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: number,
  formData: FormData
) {
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

    // Parse form data
    const contractStartDate = formData.get("contract_start_date") as string || null;
    const contractEndDate = formData.get("contract_end_date") as string || null;
    const contractPrice = formData.get("contract_price") ? Number(formData.get("contract_price")) : undefined;
    const paymentStatus = formData.get("payment_status") as string || undefined;

    const data: any = {};
    if (contractStartDate) data.contract_start_date = contractStartDate;
    if (contractEndDate) data.contract_end_date = contractEndDate;
    if (contractPrice !== undefined) data.contract_price = contractPrice;
    if (paymentStatus) data.payment_status = paymentStatus;

    const validatedData = subscriptionUpdateSchema.parse(data);

    // Update subscription
    const { error } = await supabase
      .from("subscriptions")
      .update(validatedData)
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error updating subscription:", error);
      return { success: false, error: error.message };
    }

    // Get tenant_id to revalidate
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("tenant_id")
      .eq("id", subscriptionId)
      .single();

    if (subscription) {
      revalidatePath(`/super-admin/tenants/${subscription.tenant_id}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateSubscription:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  tenantId: number,
  formData: FormData
) {
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

    // Parse form data
    const data = {
      slug: formData.get("slug") as string,
      is_online: formData.get("is_online") === "true",
    };

    const validatedData = settingsUpdateSchema.parse(data);

    // Check if slug is already taken by another tenant
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", validatedData.slug)
      .neq("id", tenantId)
      .single();

    if (existingTenant) {
      return { success: false, error: "Bu subdomain zaten kullanılıyor" };
    }

    // Update tenant
    const { error } = await supabase
      .from("tenants")
      .update(validatedData)
      .eq("id", tenantId);

    if (error) {
      console.error("Error updating tenant settings:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/super-admin/tenants/${tenantId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateTenantSettings:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}
