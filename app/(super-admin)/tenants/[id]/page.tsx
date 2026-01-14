import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { TenantDetailPage } from "@/components/tenant-detail-page";

interface TenantDetailPageProps {
  params: {
    id: string;
  };
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
    return null;
  }

  // Get latest subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

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

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const tenantId = parseInt(params.id);

  if (isNaN(tenantId)) {
    notFound();
  }

  const data = await getTenantData(tenantId);

  if (!data) {
    notFound();
  }

  return <TenantDetailPage data={data} />;
}
