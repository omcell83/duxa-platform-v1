"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { CatalogProduct, CatalogProductInsert, CatalogProductUpdate, ProductOption, ProductOptionInsert } from "@/lib/types";

/**
 * Get current user profile to verify super_admin role
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", session.user.id)
    .single();

  return profile;
}

/**
 * Get all products with sales statistics
 */
export async function getProducts() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const supabase = await createClient();

  // Get all products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: error.message, data: [] };
  }

  // Get sales count for each product
  const productsWithSales = await Promise.all(
    (products || []).map(async (product) => {
      const { data: sales } = await supabase
        .from("product_sales")
        .select("quantity")
        .eq("product_id", product.id);

      const totalSales = sales?.reduce((sum, sale) => sum + (sale.quantity || 0), 0) || 0;

      return {
        ...product,
        total_sales: totalSales,
      };
    })
  );

  return { success: true, data: productsWithSales };
}

/**
 * Get single product with options
 */
export async function getProduct(productId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const supabase = await createClient();

  // Get product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { success: false, error: "Product not found", data: null };
  }

  // Get product options
  const { data: options } = await supabase
    .from("product_options")
    .select(`
      *,
      child_product:products!product_options_child_product_id_fkey(*)
    `)
    .eq("parent_product_id", productId);

  return {
    success: true,
    data: {
      ...product,
      options: options || [],
    },
  };
}

/**
 * Create new product
 */
export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Parse form data
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const image_url = formData.get("image_url") as string | null;
  const type = formData.get("type") as CatalogProduct["type"];
  const billing_cycle = formData.get("billing_cycle") as string | null;
  const base_price = parseFloat(formData.get("base_price") as string);
  const min_sales_price = parseFloat(formData.get("min_sales_price") as string);
  const tax_rate = parseFloat(formData.get("tax_rate") as string) || 0;
  const stock_track = formData.get("stock_track") === "true";
  const current_stock = formData.get("current_stock") ? parseInt(formData.get("current_stock") as string) : null;
  const is_public = formData.get("is_public") === "true";

  // Validation
  if (!name || !type) {
    return { success: false, error: "Name and type are required" };
  }

  if (min_sales_price > base_price) {
    return { success: false, error: "Min sales price cannot be greater than base price" };
  }

  if (type === "subscription" && stock_track) {
    return { success: false, error: "Subscription products cannot track stock" };
  }

  const productData: CatalogProductInsert = {
    name,
    description: description || null,
    image_url: image_url || null,
    type,
    billing_cycle: billing_cycle as any || null,
    base_price,
    min_sales_price,
    tax_rate,
    stock_track,
    current_stock: stock_track ? (current_stock || 0) : null,
    is_public,
    is_active: true,
  };

  const { data, error } = await supabase.from("products").insert(productData).select().single();

  if (error) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/super-admin/inventory");
  return { success: true, data };
}

/**
 * Update product
 */
export async function updateProduct(productId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Parse form data
  const name = formData.get("name") as string | undefined;
  const description = formData.get("description") as string | null | undefined;
  const image_url = formData.get("image_url") as string | null | undefined;
  const type = formData.get("type") as CatalogProduct["type"] | undefined;
  const billing_cycle = formData.get("billing_cycle") as string | null | undefined;
  const base_price = formData.get("base_price") ? parseFloat(formData.get("base_price") as string) : undefined;
  const min_sales_price = formData.get("min_sales_price") ? parseFloat(formData.get("min_sales_price") as string) : undefined;
  const tax_rate = formData.get("tax_rate") ? parseFloat(formData.get("tax_rate") as string) : undefined;
  const stock_track = formData.get("stock_track") ? formData.get("stock_track") === "true" : undefined;
  const current_stock = formData.get("current_stock") ? parseInt(formData.get("current_stock") as string) : null;
  const is_public = formData.get("is_public") ? formData.get("is_public") === "true" : undefined;

  // Get current product to validate
  const { data: currentProduct } = await supabase
    .from("products")
    .select("base_price, min_sales_price, type")
    .eq("id", productId)
    .single();

  if (!currentProduct) {
    return { success: false, error: "Product not found" };
  }

  // Validation
  const finalBasePrice = base_price !== undefined ? base_price : currentProduct.base_price;
  const finalMinPrice = min_sales_price !== undefined ? min_sales_price : currentProduct.min_sales_price;

  if (finalMinPrice > finalBasePrice) {
    return { success: false, error: "Min sales price cannot be greater than base price" };
  }

  const finalType = type || currentProduct.type;
  if (finalType === "subscription" && stock_track === true) {
    return { success: false, error: "Subscription products cannot track stock" };
  }

  const updateData: CatalogProductUpdate = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (type !== undefined) updateData.type = type;
  if (billing_cycle !== undefined) updateData.billing_cycle = billing_cycle as any;
  if (base_price !== undefined) updateData.base_price = base_price;
  if (min_sales_price !== undefined) updateData.min_sales_price = min_sales_price;
  if (tax_rate !== undefined) updateData.tax_rate = tax_rate;
  if (stock_track !== undefined) updateData.stock_track = stock_track;
  if (current_stock !== null) updateData.current_stock = current_stock;
  if (is_public !== undefined) updateData.is_public = is_public;

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/super-admin/inventory");
  return { success: true, data };
}

/**
 * Delete/Archive product (only if no sales)
 */
export async function deleteProduct(productId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Check if product has sales
  const { data: sales } = await supabase
    .from("product_sales")
    .select("id")
    .eq("product_id", productId)
    .limit(1);

  if (sales && sales.length > 0) {
    // Archive instead of delete
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (error) {
      console.error("Error archiving product:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/super-admin/inventory");
    return { success: true, archived: true };
  }

  // No sales, can delete
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/super-admin/inventory");
  return { success: true, archived: false };
}

/**
 * Add product option
 */
export async function addProductOption(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const parent_product_id = parseInt(formData.get("parent_product_id") as string);
  const child_product_id = parseInt(formData.get("child_product_id") as string);
  const is_required = formData.get("is_required") === "true";

  if (!parent_product_id || !child_product_id) {
    return { success: false, error: "Parent and child product IDs are required" };
  }

  if (parent_product_id === child_product_id) {
    return { success: false, error: "Product cannot be its own option" };
  }

  const optionData: ProductOptionInsert = {
    parent_product_id,
    child_product_id,
    is_required,
  };

  const { data, error } = await supabase.from("product_options").insert(optionData).select().single();

  if (error) {
    console.error("Error adding product option:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/super-admin/inventory");
  return { success: true, data };
}

/**
 * Remove product option
 */
export async function removeProductOption(optionId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin" || !user.is_active) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("product_options").delete().eq("id", optionId);

  if (error) {
    console.error("Error removing product option:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/super-admin/inventory");
  return { success: true };
}
