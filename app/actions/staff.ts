"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteStaffSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  role: z.enum(["owner", "manager", "staff", "kitchen", "courier"]),
  fullName: z.string().min(1, "Ad soyad gereklidir"),
});

const updateRoleSchema = z.object({
  tenantUserId: z.number().min(1),
  role: z.enum(["owner", "manager", "staff", "kitchen", "courier"]),
});

const removeAccessSchema = z.object({
  tenantUserId: z.number().min(1),
});

const deleteStaffSchema = z.object({
  tenantUserId: z.number().min(1),
});

export async function inviteStaff(formData: FormData) {
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

    // Check role - only tenant_admin or super_admin can invite
    const userRole = (profile.role || "").trim().toLowerCase();
    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return { error: "Sadece yöneticiler personel davet edebilir" };
    }

    // Validate form data
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const fullName = formData.get("fullName") as string;
    const isTenantAdmin = userRole === "tenant_admin";

    // Tenant admin can only add manager, staff, kitchen, courier roles
    if (isTenantAdmin && !["manager", "staff", "kitchen", "courier"].includes(role)) {
      return { error: "Bu rolü ekleme yetkiniz bulunmamaktadır" };
    }

    const validated = inviteStaffSchema.safeParse({ email, role, fullName });

    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    // Check if user exists in profiles by email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", validated.data.email)
      .single();

    if (!existingProfile) {
      return { error: "Bu email adresine kayıtlı kullanıcı bulunamadı" };
    }

    // Update full_name if provided
    if (validated.data.fullName && existingProfile.full_name !== validated.data.fullName) {
      await supabase
        .from("profiles")
        .update({ full_name: validated.data.fullName })
        .eq("id", existingProfile.id);
    }

    // Check if user is already in tenant_users
    const { data: existingTenantUser } = await supabase
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .eq("user_id", existingProfile.id)
      .single();

    if (existingTenantUser) {
      // Update existing record
      const { error } = await supabase
        .from("tenant_users")
        .update({
          role: validated.data.role,
          is_active: true,
        })
        .eq("id", existingTenantUser.id);

      if (error) {
        console.error("Error updating tenant_user:", error);
        return { error: "Personel güncellenirken bir hata oluştu" };
      }
    } else {
      // Insert new record
      const { error } = await supabase.from("tenant_users").insert({
        tenant_id: profile.tenant_id,
        user_id: existingProfile.id,
        role: validated.data.role,
        is_active: true,
      });

      if (error) {
        console.error("Error inserting tenant_user:", error);
        return { error: "Personel eklenirken bir hata oluştu" };
      }
    }

    revalidatePath("/dashboard/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Error in inviteStaff:", error);
    return { error: "Bir hata oluştu" };
  }
}

export async function updateStaffRole(formData: FormData) {
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
    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return { error: "Sadece yöneticiler rol güncelleyebilir" };
    }

    const isTenantAdmin = userRole === "tenant_admin";

    // Validate
    const tenantUserId = parseInt(formData.get("tenantUserId") as string);
    const role = formData.get("role") as string;

    const validated = updateRoleSchema.safeParse({ tenantUserId, role });

    if (!validated.success) {
      return { error: "Geçersiz veri" };
    }

    // Check if tenant_user belongs to this tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("user_id")
      .eq("id", validated.data.tenantUserId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!tenantUser) {
      return { error: "Personel bulunamadı" };
    }

    // Don't allow updating own role
    if (tenantUser.user_id === session.user.id) {
      return { error: "Kendi rolünüzü değiştiremezsiniz" };
    }

    // Tenant admin can only set manager, staff, kitchen, courier roles
    if (isTenantAdmin && !["manager", "staff", "kitchen", "courier"].includes(validated.data.role)) {
      return { error: "Bu rolü atama yetkiniz bulunmamaktadır" };
    }

    // Update role
    const { error } = await supabase
      .from("tenant_users")
      .update({ role: validated.data.role })
      .eq("id", validated.data.tenantUserId);

    if (error) {
      console.error("Error updating role:", error);
      return { error: "Rol güncellenirken bir hata oluştu" };
    }

    revalidatePath("/dashboard/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Error in updateStaffRole:", error);
    return { error: "Bir hata oluştu" };
  }
}

export async function removeStaffAccess(formData: FormData) {
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
    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return { error: "Sadece yöneticiler erişim kaldırabilir" };
    }

    // Validate
    const tenantUserId = parseInt(formData.get("tenantUserId") as string);

    const validated = removeAccessSchema.safeParse({ tenantUserId });

    if (!validated.success) {
      return { error: "Geçersiz veri" };
    }

    // Check if tenant_user belongs to this tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("user_id")
      .eq("id", validated.data.tenantUserId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!tenantUser) {
      return { error: "Personel bulunamadı" };
    }

    // Don't allow removing own access
    if (tenantUser.user_id === session.user.id) {
      return { error: "Kendi erişiminizi kaldıramazsınız" };
    }

    // Soft delete: set is_active to false
    const { error } = await supabase
      .from("tenant_users")
      .update({ is_active: false })
      .eq("id", validated.data.tenantUserId);

    if (error) {
      console.error("Error removing access:", error);
      return { error: "Erişim kaldırılırken bir hata oluştu" };
    }

    revalidatePath("/dashboard/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Error in removeStaffAccess:", error);
    return { error: "Bir hata oluştu" };
  }
}

export async function deleteStaff(formData: FormData) {
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
    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return { error: "Sadece yöneticiler personel silebilir" };
    }

    // Validate
    const tenantUserId = parseInt(formData.get("tenantUserId") as string);

    const validated = deleteStaffSchema.safeParse({ tenantUserId });

    if (!validated.success) {
      return { error: "Geçersiz veri" };
    }

    // Check if tenant_user belongs to this tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("user_id")
      .eq("id", validated.data.tenantUserId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!tenantUser) {
      return { error: "Personel bulunamadı" };
    }

    // Don't allow deleting own account
    if (tenantUser.user_id === session.user.id) {
      return { error: "Kendi hesabınızı silemezsiniz" };
    }

    // Hard delete: remove from tenant_users
    const { error } = await supabase
      .from("tenant_users")
      .delete()
      .eq("id", validated.data.tenantUserId);

    if (error) {
      console.error("Error deleting staff:", error);
      return { error: "Personel silinirken bir hata oluştu" };
    }

    revalidatePath("/dashboard/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteStaff:", error);
    return { error: "Bir hata oluştu" };
  }
}
