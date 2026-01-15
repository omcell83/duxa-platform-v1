"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const createSubscriptionSchema = z.object({
  tenant_id: z.number().min(1, "Tenant ID gereklidir"),
  product_id: z.number().min(1, "Ürün seçimi gereklidir"),
  contract_price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  contract_start_date: z.string().min(1, "Başlangıç tarihi gereklidir"),
  contract_end_date: z.string().optional().nullable(),
  renewal_period: z.enum(["monthly", "yearly"]).optional(),
});

const updateSubscriptionSchema = z.object({
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  contract_price: z.number().min(0).optional(),
  renewal_period: z.enum(["monthly", "yearly"]).optional(),
});

const createHardwareSchema = z.object({
  tenant_id: z.number().min(1, "Tenant ID gereklidir"),
  product_id: z.number().min(1, "Ürün seçimi gereklidir"),
  serial_number: z.string().min(1, "Seri numarası gereklidir"),
  price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  addon_product_ids: z.array(z.number()).optional(),
});

/**
 * Check if user is super_admin
 */
async function checkSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { authorized: false, error: "Oturum bulunamadı" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { authorized: false, error: "Yetkiniz yok" };
  }

  return { authorized: true, userId: session.user.id };
}

/**
 * Create a new subscription for a tenant
 */
export async function createSubscription(formData: FormData) {
  try {
    const authCheck = await checkSuperAdmin();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const supabase = await createClient();

    const data = {
      tenant_id: parseInt(formData.get("tenant_id") as string),
      product_id: parseInt(formData.get("product_id") as string),
      contract_price: parseFloat(formData.get("contract_price") as string),
      contract_start_date: formData.get("contract_start_date") as string,
      contract_end_date: formData.get("contract_end_date") as string || null,
      renewal_period: formData.get("renewal_period") as string || null,
    };

    const validatedData = createSubscriptionSchema.parse(data);

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", validatedData.product_id)
      .eq("type", "subscription")
      .single();

    if (productError || !product) {
      return { success: false, error: "Ürün bulunamadı" };
    }

    // Create subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        tenant_id: validatedData.tenant_id,
        contract_price: validatedData.contract_price,
        contract_date: validatedData.contract_start_date,
        contract_start_date: validatedData.contract_start_date,
        contract_end_date: validatedData.contract_end_date,
        payment_status: "pending",
        created_by: authCheck.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/super-admin/tenants/${validatedData.tenant_id}`);
    return { success: true, data: subscription };
  } catch (error: any) {
    console.error("Error in createSubscription:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Update an existing subscription
 */
export async function updateSubscriptionById(
  subscriptionId: number,
  formData: FormData
) {
  try {
    const authCheck = await checkSuperAdmin();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const supabase = await createClient();

    const data: any = {};
    if (formData.get("contract_start_date")) {
      data.contract_start_date = formData.get("contract_start_date") as string;
    }
    if (formData.get("contract_end_date")) {
      data.contract_end_date = formData.get("contract_end_date") as string;
    }
    if (formData.get("contract_price")) {
      data.contract_price = parseFloat(formData.get("contract_price") as string);
    }

    const validatedData = updateSubscriptionSchema.parse(data);

    const { error } = await supabase
      .from("subscriptions")
      .update(validatedData)
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error updating subscription:", error);
      return { success: false, error: error.message };
    }

    // Get tenant_id for revalidation
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
    console.error("Error in updateSubscriptionById:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Create hardware assignment for a tenant
 */
export async function createHardwareAssignment(formData: FormData) {
  try {
    const authCheck = await checkSuperAdmin();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const supabase = await createClient();

    const addonIds = formData.get("addon_product_ids");
    const data = {
      tenant_id: parseInt(formData.get("tenant_id") as string),
      product_id: parseInt(formData.get("product_id") as string),
      serial_number: formData.get("serial_number") as string,
      price: parseFloat(formData.get("price") as string),
      addon_product_ids: addonIds ? JSON.parse(addonIds as string) : [],
    };

    const validatedData = createHardwareSchema.parse(data);

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", validatedData.product_id)
      .eq("type", "hardware")
      .single();

    if (productError || !product) {
      return { success: false, error: "Ürün bulunamadı" };
    }

    // Check if serial number exists and is available
    const { data: asset, error: assetError } = await supabase
      .from("hardware_inventory")
      .select("*")
      .eq("serial_number", validatedData.serial_number)
      .single();

    if (assetError || !asset) {
      return { success: false, error: "Seri numarası bulunamadı" };
    }

    if (asset.status !== "in_stock") {
      return { success: false, error: "Bu cihaz zaten zimmetli veya kullanımda" };
    }

    // Update asset status to deployed/rented
    const { error: updateError } = await supabase
      .from("hardware_inventory")
      .update({
        status: "rented",
        tenant_id: validatedData.tenant_id,
        assignment_date: new Date().toISOString().split("T")[0],
      })
      .eq("serial_number", validatedData.serial_number);

    if (updateError) {
      console.error("Error updating asset:", updateError);
      return { success: false, error: updateError.message };
    }

    // Create hardware assignment record (if you have a tenant_assets table)
    // For now, we'll just update the hardware_inventory table

    revalidatePath(`/super-admin/tenants/${validatedData.tenant_id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in createHardwareAssignment:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Geçersiz veri formatı" };
    }
    return { success: false, error: error.message || "Bir hata oluştu" };
  }
}

/**
 * Get subscription products (type='subscription')
 */
export async function getSubscriptionProducts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("type", "subscription")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching subscription products:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error in getSubscriptionProducts:", error);
    return { success: false, error: error.message || "Bir hata oluştu", data: [] };
  }
}

/**
 * Get hardware products (type='hardware')
 */
export async function getHardwareProducts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("type", "hardware")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching hardware products:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error in getHardwareProducts:", error);
    return { success: false, error: error.message || "Bir hata oluştu", data: [] };
  }
}

/**
 * Get available assets (in_stock) for a product type
 */
export async function getAvailableAssets(productId: number) {
  try {
    const supabase = await createClient();

    // Get product to determine device_type
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return { success: false, error: "Ürün bulunamadı", data: [] };
    }

    // Determine device_type from product (you may need to adjust this based on your schema)
    // For now, we'll query all in_stock assets
    const { data, error } = await supabase
      .from("hardware_inventory")
      .select("serial_number, device_type, model, manufacturer")
      .eq("status", "in_stock")
      .order("serial_number");

    if (error) {
      console.error("Error fetching available assets:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error in getAvailableAssets:", error);
    return { success: false, error: error.message || "Bir hata oluştu", data: [] };
  }
}

/**
 * Get product addons (from product_options)
 */
export async function getProductAddons(productId: number) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_options")
      .select(`
        *,
        child_product:products!product_options_child_product_id_fkey(*)
      `)
      .eq("parent_product_id", productId);

    if (error) {
      console.error("Error fetching product addons:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error in getProductAddons:", error);
    return { success: false, error: error.message || "Bir hata oluştu", data: [] };
  }
}
