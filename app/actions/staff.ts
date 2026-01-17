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
  userId: z.string().min(1, "Kullanıcı ID gereklidir"),
  role: z.enum(["owner", "manager", "staff", "kitchen", "courier"]),
});

const removeAccessSchema = z.object({
  userId: z.string().min(1, "Kullanıcı ID gereklidir"),
});

const deleteStaffSchema = z.object({
  userId: z.string().min(1, "Kullanıcı ID gereklidir"),
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
      .select("id, full_name, tenant_id, role")
      .eq("email", validated.data.email)
      .single();

    if (!existingProfile) {
      return { error: "Bu email adresine kayıtlı kullanıcı bulunamadı" };
    }

    // Check if user already belongs to this tenant
    if (existingProfile.tenant_id === profile.tenant_id) {
      // Update existing profile: role and full_name
      const updateData: any = {
        role: validated.data.role,
        is_active: true,
      };
      if (validated.data.fullName && existingProfile.full_name !== validated.data.fullName) {
        updateData.full_name = validated.data.fullName;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", existingProfile.id);

      if (error) {
        console.error("Error updating profile:", error);
        return { error: "Personel güncellenirken bir hata oluştu" };
      }
    } else {
      // User belongs to different tenant - update tenant_id, role, and full_name
      const updateData: any = {
        tenant_id: profile.tenant_id,
        role: validated.data.role,
        is_active: true,
      };
      if (validated.data.fullName) {
        updateData.full_name = validated.data.fullName;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", existingProfile.id);

      if (error) {
        console.error("Error updating profile:", error);
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

    // Validate - userId is now string (profile.id)
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as string;

    const validated = updateRoleSchema.safeParse({ userId, role });

    if (!validated.success) {
      return { error: "Geçersiz veri" };
    }

    // Don't allow updating own role
    if (validated.data.userId === session.user.id) {
      return { error: "Kendi rolünüzü değiştiremezsiniz" };
    }

    // Check if user belongs to this tenant
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, tenant_id, role")
      .eq("id", validated.data.userId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!targetProfile) {
      return { error: "Personel bulunamadı veya bu işletmeye ait değil" };
    }

    // Don't allow changing super_admin or tenant_admin roles (only super_admin can do this)
    const targetRole = (targetProfile.role || "").trim().toLowerCase();
    if (targetRole === "super_admin" || (targetRole === "tenant_admin" && isTenantAdmin)) {
      return { error: "Bu rolü değiştirme yetkiniz bulunmamaktadır" };
    }

    // Tenant admin can only set manager, staff, kitchen, courier roles
    if (isTenantAdmin && !["manager", "staff", "kitchen", "courier"].includes(validated.data.role)) {
      return { error: "Bu rolü atama yetkiniz bulunmamaktadır" };
    }

    // Update role in profiles
    const { error } = await supabase
      .from("profiles")
      .update({ role: validated.data.role })
      .eq("id", validated.data.userId);

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

    // Validate - userId is now string (profile.id)
    const userId = formData.get("userId") as string;

    const validated = removeAccessSchema.safeParse({ userId });

    if (!validated.success) {
      return { error: "Geçersiz veri" };
    }

    // Don't allow removing own access
    if (validated.data.userId === session.user.id) {
      return { error: "Kendi erişiminizi kaldıramazsınız" };
    }

    // Check if user belongs to this tenant
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, tenant_id, role")
      .eq("id", validated.data.userId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!targetProfile) {
      return { error: "Personel bulunamadı veya bu işletmeye ait değil" };
    }

    // Don't allow deactivating super_admin or tenant_admin (only super_admin can do this)
    const targetRole = (targetProfile.role || "").trim().toLowerCase();
    if (targetRole === "super_admin" || (targetRole === "tenant_admin" && userRole === "tenant_admin")) {
      return { error: "Bu kullanıcının erişimini kaldırma yetkiniz bulunmamaktadır" };
    }

    // Soft delete: set is_active to false in profiles
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", validated.data.userId);

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

    // Validate - userId is now string (profile.id)
    const userId = formData.get("userId") as string;

    const validated = deleteStaffSchema.safeParse({ userId });

    if (!validated.success) {
      return { error: "Geçersiz veri" };
    }

    // Don't allow deleting own account
    if (validated.data.userId === session.user.id) {
      return { error: "Kendi hesabınızı silemezsiniz" };
    }

    // Check if user belongs to this tenant
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, tenant_id, role")
      .eq("id", validated.data.userId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!targetProfile) {
      return { error: "Personel bulunamadı veya bu işletmeye ait değil" };
    }

    // Don't allow deleting super_admin or tenant_admin (only super_admin can do this)
    const targetRole = (targetProfile.role || "").trim().toLowerCase();
    if (targetRole === "super_admin" || (targetRole === "tenant_admin" && userRole === "tenant_admin")) {
      return { error: "Bu kullanıcıyı silme yetkiniz bulunmamaktadır" };
    }

    // Hard delete: remove tenant_id (but keep profile for auth.users reference)
    // Actually, we should set tenant_id to null instead of deleting the profile
    // because profile.id references auth.users.id
    const { error } = await supabase
      .from("profiles")
      .update({ tenant_id: null, is_active: false })
      .eq("id", validated.data.userId);

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
