"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const businessIdentitySchema = z.object({
  businessName: z.string().min(1, "İşletme adı gereklidir"),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]),
  systemLanguage: z.string().min(1, "Yönetici dili gereklidir"),
  logoUrl: z.string().optional(),
});

/**
 * Get business identity settings
 */
export async function getBusinessIdentity(): Promise<{
  success: boolean;
  data?: {
    businessName: string;
    currency: string;
    systemLanguage: string;
    logoUrl: string;
    commercialName: string;
    address: string;
    countryCode: string;
    countryName: string;
    taxId: string;
    taxLabel: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı" };
    }

    // Get user profile with tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return { success: false, error: "Tenant bulunamadı" };
    }

    // Check role
    const userRole = (profile.role || "").trim().toLowerCase();
    if (userRole !== "tenant_admin") {
      return { success: false, error: "Bu işlem için tenant_admin yetkisi gereklidir" };
    }

    // Get tenant data
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, slug, settings, address, country_code, commercial_name, tax_id, currency")
      .eq("id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching tenant:", error);
      return { success: false, error: "Tenant bilgileri alınamadı" };
    }

    const settings = typeof tenant.settings === "string"
      ? JSON.parse(tenant.settings)
      : tenant.settings || {};

    // Get tax label and country name for country
    let taxLabel = "Vergi Numarası";
    let countryName = "";
    const systemLang = settings.system_language || "tr";
    
    if (tenant.country_code) {
      const { data: language } = await supabase
        .from("languages")
        .select("tax_identifier_label, country_names")
        .eq("code", tenant.country_code.toLowerCase())
        .single();
      if (language?.tax_identifier_label) {
        taxLabel = language.tax_identifier_label;
      }
      // Get country name in system language
      if (language?.country_names && typeof language.country_names === 'object') {
        const countryNames = language.country_names as Record<string, string>;
        countryName = countryNames[systemLang] || countryNames[tenant.country_code.toLowerCase()] || countryNames['en'] || tenant.country_code.toUpperCase();
      }
    }

    return {
      success: true,
      data: {
        businessName: tenant.name || "",
        currency: tenant.currency || settings.currency || "TRY",
        systemLanguage: settings.system_language || "tr",
        logoUrl: settings.logo_url || "",
        commercialName: tenant.commercial_name || "",
        address: tenant.address || "",
        countryCode: tenant.country_code || "",
        countryName: countryName,
        taxId: tenant.tax_id || "",
        taxLabel: taxLabel,
      },
    };
  } catch (error: any) {
    console.error("Error in getBusinessIdentity:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}

/**
 * Update business identity settings
 */
export async function updateBusinessIdentity(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı" };
    }

    // Get user profile with tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return { success: false, error: "Tenant bulunamadı" };
    }

    // Check role
    const userRole = (profile.role || "").trim().toLowerCase();
    if (userRole !== "tenant_admin") {
      return { success: false, error: "Bu işlem için tenant_admin yetkisi gereklidir" };
    }

    // Parse form data
    const data: any = {};
    for (const [key, value] of formData.entries()) {
      if (value === "true" || value === "false") {
        data[key] = value === "true";
      } else {
        data[key] = value;
      }
    }

    // Validate
    const validated = businessIdentitySchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((e) => e.message).join(", "),
      };
    }

    // Get current tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", profile.tenant_id)
      .single();

    if (!tenant) {
      return { success: false, error: "Tenant bulunamadı" };
    }

    const settings = typeof tenant.settings === "string"
      ? JSON.parse(tenant.settings)
      : tenant.settings || {};

    // Prepare update data
    const updateData: any = {};
    const updatedSettings = { ...settings };

    // Update tenant name
    if (validated.data.businessName) {
      updateData.name = validated.data.businessName;
    }

    // Update currency
    if (validated.data.currency) {
      updateData.currency = validated.data.currency;
      updatedSettings.currency = validated.data.currency;
    }

    // Update logo
    if (validated.data.logoUrl !== undefined) {
      updatedSettings.logo_url = validated.data.logoUrl || null;
    }

    // Update system language
    if (validated.data.systemLanguage) {
      updatedSettings.system_language = validated.data.systemLanguage;
      updateData.settings = updatedSettings;
      // Also update tenant.system_language_code (if column exists)
      const currentSystemLang = settings.system_language || "tr";
      if (validated.data.systemLanguage !== currentSystemLang) {
        (updateData as any).system_language_code = validated.data.systemLanguage;
      }
    }

    // Update settings
    updateData.settings = updatedSettings;

    // Update tenant
    const { error: updateError } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", profile.tenant_id);

    if (updateError) {
      console.error("Error updating tenant:", updateError);
      return { success: false, error: "Ayarlar güncellenemedi" };
    }

    revalidatePath("/dashboard/settings/business-identity");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateBusinessIdentity:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
