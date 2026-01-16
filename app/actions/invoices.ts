"use server";

import { createClient } from "@/lib/supabase-server";

export interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  created_at: string;
}

/**
 * Get all invoices for the current tenant
 */
export async function getTenantInvoices(): Promise<{
  success: boolean;
  data?: Invoice[];
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

    // Try to fetch invoices from invoices table
    // Note: If invoices table doesn't exist, this will return empty array
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array (no error)
      if (error.code === "42P01") {
        return { success: true, data: [] };
      }
      console.error("Error fetching invoices:", error);
      return { success: false, error: "Faturalar alınamadı" };
    }

    return {
      success: true,
      data: invoices || [],
    };
  } catch (error: any) {
    console.error("Error in getTenantInvoices:", error);
    return { success: false, error: error?.message || "Bir hata oluştu" };
  }
}
