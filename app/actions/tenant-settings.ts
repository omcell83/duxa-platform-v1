"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const themeSchema = z.object({
  themeId: z.enum(["theme-1", "theme-2", "theme-3", "theme-4"]),
});

const businessHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  tuesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  wednesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  thursday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  friday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  saturday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  sunday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
});

export async function updateTenantTheme(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { error: "Oturum bulunamadı" };
    }

    // Get user profile with tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return { error: "Tenant bulunamadı" };
    }

    // Check role
    const userRole = (profile.role || "").trim().toLowerCase();
    if (userRole !== "tenant_admin" && userRole !== "staff") {
      return { error: "Yetkiniz yok" };
    }

    // Validate theme ID
    const themeId = formData.get("themeId") as string;
    const validated = themeSchema.safeParse({ themeId });

    if (!validated.success) {
      return { error: "Geçersiz tema ID" };
    }

    // Get current settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", profile.tenant_id)
      .single();

    const currentSettings = tenant?.settings || {};
    const settings = typeof currentSettings === "string" 
      ? JSON.parse(currentSettings) 
      : currentSettings;

    // Update theme_id
    const updatedSettings = {
      ...settings,
      theme_id: validated.data.themeId,
    };

    // Update tenant settings
    const { error } = await supabase
      .from("tenants")
      .update({ settings: updatedSettings })
      .eq("id", profile.tenant_id);

    if (error) {
      console.error("Error updating theme:", error);
      return { error: "Tema güncellenirken bir hata oluştu" };
    }

    revalidatePath("/dashboard/design");
    return { success: true };
  } catch (error) {
    console.error("Error in updateTenantTheme:", error);
    return { error: "Bir hata oluştu" };
  }
}

export async function updateBusinessHours(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { error: "Oturum bulunamadı" };
    }

    // Get user profile with tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return { error: "Tenant bulunamadı" };
    }

    // Check role
    const userRole = (profile.role || "").trim().toLowerCase();
    if (userRole !== "tenant_admin" && userRole !== "staff") {
      return { error: "Yetkiniz yok" };
    }

    // Parse business hours from form data
    const businessHours: Record<string, any> = {};
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    for (const day of days) {
      const isOpen = formData.get(`${day}.isOpen`) === "true";
      businessHours[day] = {
        isOpen,
        openTime: isOpen ? (formData.get(`${day}.openTime`) as string) || undefined : undefined,
        closeTime: isOpen ? (formData.get(`${day}.closeTime`) as string) || undefined : undefined,
      };
    }

    // Validate
    const validated = businessHoursSchema.safeParse(businessHours);
    if (!validated.success) {
      return { error: "Geçersiz çalışma saatleri" };
    }

    // Get current settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", profile.tenant_id)
      .single();

    const currentSettings = tenant?.settings || {};
    const settings = typeof currentSettings === "string" 
      ? JSON.parse(currentSettings) 
      : currentSettings;

    // Update business_hours
    const updatedSettings = {
      ...settings,
      business_hours: validated.data,
    };

    // Update tenant settings
    const { error } = await supabase
      .from("tenants")
      .update({ settings: updatedSettings })
      .eq("id", profile.tenant_id);

    if (error) {
      console.error("Error updating business hours:", error);
      return { error: "Çalışma saatleri güncellenirken bir hata oluştu" };
    }

    revalidatePath("/dashboard/settings/hours");
    return { success: true };
  } catch (error) {
    console.error("Error in updateBusinessHours:", error);
    return { error: "Bir hata oluştu" };
  }
}
