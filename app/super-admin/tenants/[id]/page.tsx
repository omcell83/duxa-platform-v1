import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { TenantDetailPage } from "@/components/tenant-detail-page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getTenantData(tenantId: number) {
  const supabase = await createClient();

  // Get tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    console.error("Error fetching tenant:", tenantError);
    return null;
  }

  // Get latest subscription (use maybeSingle to handle no subscription case)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get hardware inventory for this tenant
  const { data: hardware } = await supabase
    .from("hardware_inventory")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return {
    tenant,
    subscription: subscription || null,
    hardware: hardware || [],
  };
}

export default async function Page({ params }: PageProps) {
  // Next.js 16+ requires params to be awaited
  const { id } = await params;
  const tenantId = parseInt(id);

  if (isNaN(tenantId)) {
    console.error("Invalid tenant ID:", id);
    notFound();
  }

  const data = await getTenantData(tenantId);

  if (!data) {
    console.error("Tenant not found:", tenantId);
    notFound();
  }

  return <TenantDetailPage data={data} />;
}
