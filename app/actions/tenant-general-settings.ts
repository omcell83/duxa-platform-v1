"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generalSettingsSchema = z.object({
  businessName: z.string().min(1, "İşletme adı gereklidir"),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]),
  systemLanguage: z.string().min(1, "Yönetici dili gereklidir"),
  subdomain: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire (-) kullanılabilir"),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tripadvisor: z.string().optional(),
  website: z.string().url("Geçerli bir URL giriniz").optional().or(z.literal("")),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  onlineMenuEnabled: z.boolean(),
  seoIndexingEnabled: z.boolean(),
  menuLanguages: z.array(z.string()),
  logoUrl: z.string().optional(),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

/**
 * Check if subdomain is available
 */
export async function checkSubdomainAvailability(
  subdomain: string,
  currentTenantId: number
): Promise<{ available: boolean; suggestion?: string }> {
  try {
    if (!subdomain || subdomain.trim().length === 0) {
      return { available: false };
    }

    // Validate subdomain format
    const validSubdomainPattern = /^[a-z0-9-]+$/;
    if (!validSubdomainPattern.test(subdomain)) {
      return { available: false };
    }

    const supabase = await createClient();

    // Check if subdomain exists (excluding current tenant)
    const { data, error } = await supabase
      .from("tenants")
      .select("id, slug")
      .eq("slug", subdomain.toLowerCase().trim())
      .neq("id", currentTenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is what we want
      console.error("Error checking subdomain:", error);
      return { available: false };
    }

    if (data) {
      // Subdomain is taken, generate suggestion
      let suggestion = `${subdomain}-2`;
      let counter = 2;

      // Try to find an available suggestion
      while (counter < 100) {
        const { data: checkData } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", suggestion)
          .single();

        if (!checkData) {
          break; // Found available suggestion
        }

        counter++;
        suggestion = `${subdomain}-${counter}`;
      }

      return { available: false, suggestion };
    }

    return { available: true };
  } catch (error) {
    console.error("Error in checkSubdomainAvailability:", error);
    return { available: false };
  }
}

/**
 * Update tenant general settings
 */
export async function updateGeneralSettings(
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

    // Check role - only tenant_admin can access
    const userRole = (profile.role || "").trim().toLowerCase();
    if (userRole !== "tenant_admin") {
      return { success: false, error: "Bu işlem için tenant_admin yetkisi gereklidir" };
    }

    // Parse form data
    const rawData = {
      businessName: formData.get("businessName") as string,
      currency: formData.get("currency") as string,
      systemLanguage: formData.get("systemLanguage") as string,
      subdomain: formData.get("subdomain") as string,
      instagram: formData.get("instagram") as string,
      facebook: formData.get("facebook") as string,
      twitter: formData.get("twitter") as string,
      tripadvisor: formData.get("tripadvisor") as string,
      website: formData.get("website") as string,
      address: formData.get("address") as string,
      latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : undefined,
      longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : undefined,
      onlineMenuEnabled: formData.get("onlineMenuEnabled") === "true",
      seoIndexingEnabled: formData.get("seoIndexingEnabled") === "true",
      menuLanguages: JSON.parse(formData.get("menuLanguages") as string || "[]"),
      logoUrl: formData.get("logoUrl") as string,
    };

    // Validate
    const validated = generalSettingsSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((e) => e.message).join(", "),
      };
    }

    // Check subdomain availability if it changed
    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("slug")
      .eq("id", profile.tenant_id)
      .single();

    if (validated.data.subdomain !== currentTenant?.slug) {
      const availability = await checkSubdomainAvailability(
        validated.data.subdomain,
        profile.tenant_id
      );

      if (!availability.available) {
        return {
          success: false,
          error: `Bu adres kullanılıyor. Öneri: ${availability.suggestion || validated.data.subdomain}-2`,
        };
      }

      // Update slug
      const { error: slugError } = await supabase
        .from("tenants")
        .update({ slug: validated.data.subdomain.toLowerCase().trim() })
        .eq("id", profile.tenant_id);

      if (slugError) {
        console.error("Error updating slug:", slugError);
        return { success: false, error: "Subdomain güncellenirken bir hata oluştu" };
      }
    }

    // Get current settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings, name, currency, address")
      .eq("id", profile.tenant_id)
      .single();

    const currentSettings = tenant?.settings || {};
    const settings = typeof currentSettings === "string"
      ? JSON.parse(currentSettings)
      : currentSettings;

    // Update settings
    const updatedSettings = {
      ...settings,
      business_name: validated.data.businessName,
      currency: validated.data.currency,
      system_language: validated.data.systemLanguage,
      logo_url: validated.data.logoUrl,
      social_media: {
        instagram: validated.data.instagram || "",
        facebook: validated.data.facebook || "",
        twitter: validated.data.twitter || "",
        tripadvisor: validated.data.tripadvisor || "",
        website: validated.data.website || "",
      },
      online_menu_active: validated.data.onlineMenuEnabled,
      seo_visible: validated.data.seoIndexingEnabled,
      online_menu: {
        enabled: validated.data.onlineMenuEnabled,
        seo_indexing: validated.data.seoIndexingEnabled,
        languages: validated.data.menuLanguages,
      },
    };

    // Update tenant name, currency, and address if changed
    const updateData: any = { settings: updatedSettings };
    if (validated.data.businessName !== tenant?.name) {
      updateData.name = validated.data.businessName;
    }
    if (validated.data.currency !== tenant?.currency) {
      updateData.currency = validated.data.currency;
    }
    if (validated.data.address !== tenant?.address) {
      updateData.address = validated.data.address || null;
    }

    // Update tenant
    const { error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", profile.tenant_id);

    if (error) {
      console.error("Error updating settings:", error);
      return { success: false, error: "Ayarlar güncellenirken bir hata oluştu" };
    }

    revalidatePath("/dashboard/settings/general");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateGeneralSettings:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}

/**
 * Get tenant general settings
 */
export async function getGeneralSettings(): Promise<{
  success: boolean;
  data?: any;
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
      .select("id, name, slug, settings, address, country_code, legal_name, tax_id, currency")
      .eq("id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching tenant:", error);
      return { success: false, error: "Tenant bilgileri alınamadı" };
    }

    const settings = typeof tenant.settings === "string"
      ? JSON.parse(tenant.settings)
      : tenant.settings || {};

    // Get tax label for country
    let taxLabel = "Vergi Numarası";
    if (tenant.country_code) {
      const { data: language } = await supabase
        .from("languages")
        .select("tax_identifier_label")
        .eq("code", tenant.country_code.toLowerCase())
        .single();
      if (language?.tax_identifier_label) {
        taxLabel = language.tax_identifier_label;
      }
    }

    return {
      success: true,
      data: {
        businessName: tenant.name || "",
        currency: tenant.currency || settings.currency || "TRY",
        systemLanguage: settings.system_language || "tr",
        subdomain: tenant.slug || "",
        logoUrl: settings.logo_url || "",
        legalName: tenant.legal_name || "",
        address: tenant.address || settings.location?.address || "",
        countryCode: tenant.country_code || "",
        taxId: tenant.tax_id || "",
        taxLabel: taxLabel,
        instagram: settings.social_media?.instagram || "",
        facebook: settings.social_media?.facebook || "",
        twitter: settings.social_media?.twitter || "",
        tripadvisor: settings.social_media?.tripadvisor || "",
        website: settings.social_media?.website || "",
        onlineMenuEnabled: settings.online_menu?.enabled || false,
        seoIndexingEnabled: settings.online_menu?.seo_indexing || false,
        menuLanguages: settings.online_menu?.languages || [],
      },
    };
  } catch (error: any) {
    console.error("Error in getGeneralSettings:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}

/**
 * Get all available languages from languages table
 */
export async function getAvailableLanguages(
  systemLanguageCode: string = "tr"
): Promise<{
  success: boolean;
  data?: Array<{ code: string; name: string; flag_path: string }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: languages, error } = await supabase
      .from("languages")
      .select("code, flag_path, translations, is_active")
      .eq("is_active", true)
      .order("code");

    if (error) {
      console.error("Error fetching languages:", error);
      return { success: false, error: "Diller alınamadı" };
    }

    // Get language name based on system language
    const languagesWithNames = languages?.map((lang: any) => {
      const translations = typeof lang.translations === "string"
        ? JSON.parse(lang.translations)
        : lang.translations || {};

      // Get name in system language, fallback to English, then to code
      const name = translations[systemLanguageCode] || translations.en || translations[lang.code] || lang.code.toUpperCase();

      return {
        code: lang.code,
        name,
        flag_path: lang.flag_path,
      };
    }) || [];

    return {
      success: true,
      data: languagesWithNames,
    };
  } catch (error: any) {
    console.error("Error in getAvailableLanguages:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}

/**
 * Get tax identifier label for a country code
 */
export async function getTaxIdentifierLabel(
  countryCode: string
): Promise<{
  success: boolean;
  label?: string;
  error?: string;
}> {
  try {
    if (!countryCode) {
      return { success: false, error: "Ülke kodu gereklidir" };
    }

    const supabase = await createClient();

    const { data: language, error } = await supabase
      .from("languages")
      .select("tax_identifier_label")
      .eq("code", countryCode.toLowerCase())
      .single();

    if (error) {
      console.error("Error fetching tax identifier label:", error);
      return { success: false, error: "Vergi etiketi alınamadı" };
    }

    return {
      success: true,
      label: language?.tax_identifier_label || "Vergi Numarası",
    };
  } catch (error: any) {
    console.error("Error in getTaxIdentifierLabel:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
