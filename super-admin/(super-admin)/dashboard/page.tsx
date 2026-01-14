import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardStats() {
  const supabase = await createClient();

  // Toplam İşletme Sayısı
  const { count: totalTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  // Toplam Aktif Cihaz Sayısı (hardware_inventory'de status = 'rented' veya 'in_stock')
  const { count: totalDevices } = await supabase
    .from("hardware_inventory")
    .select("*", { count: "exact", head: true })
    .in("status", ["rented", "in_stock"]);

  // Toplam Satış Hacmi (subscriptions tablosundan toplam payment_amount)
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("payment_amount")
    .eq("payment_status", "paid");

  const totalRevenue = subscriptions?.reduce((sum, sub) => {
    return sum + (sub.payment_amount || 0);
  }, 0) || 0;

  return {
    totalTenants: totalTenants || 0,
    totalDevices: totalDevices || 0,
    totalRevenue,
  };
}

async function getUpcomingPayments() {
  const supabase = await createClient();

  // Ödemesi yaklaşan işletmeler (payment_status = 'pending' veya 'overdue' ve payment_date yakın)
  // Son 30 gün içinde ödeme tarihi olanlar
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Önce subscriptions'ı çek
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("id, tenant_id, payment_date, payment_status, payment_amount, contract_price")
    .in("payment_status", ["pending", "overdue"])
    .gte("payment_date", thirtyDaysAgo.toISOString().split("T")[0])
    .lte("payment_date", thirtyDaysFromNow.toISOString().split("T")[0])
    .order("payment_date", { ascending: true })
    .limit(10);

  if (subscriptionsError || !subscriptions || subscriptions.length === 0) {
    return [];
  }

  // Tenant ID'leri topla
  const tenantIds = subscriptions.map((sub) => sub.tenant_id).filter(Boolean);

  if (tenantIds.length === 0) {
    return subscriptions.map((sub) => ({ ...sub, tenants: null }));
  }

  // Tenants'ı çek
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, name, commercial_name, contact_phone, contact_email")
    .in("id", tenantIds);

  if (tenantsError) {
    console.error("Error fetching tenants:", tenantsError);
    return subscriptions.map((sub) => ({ ...sub, tenants: null }));
  }

  // Subscriptions ile tenants'ı birleştir
  return subscriptions.map((sub) => ({
    ...sub,
    tenants: tenants?.find((t) => t.id === sub.tenant_id) || null,
  }));
}

export default async function SuperAdminDashboardPage() {
  const stats = await getDashboardStats();
  const upcomingPayments = await getUpcomingPayments();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get days until payment
  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const paymentDate = new Date(dateString);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Sistem genel bakış ve istatistikler</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayıtlı İşletme</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sistemdeki toplam işletme sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Aktif Cihaz</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Depoda ve kirada olan cihazlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış Hacmi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm tenant'ların toplam cirosu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ödemesi Yaklaşan İşletmeler */}
      <Card>
        <CardHeader>
          <CardTitle>Ödemesi Yaklaşan İşletmeler</CardTitle>
          <CardDescription>
            Son 30 gün içinde ödeme tarihi olan bekleyen ödemeler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Yaklaşan ödeme bulunmuyor.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İşletme Adı</TableHead>
                  <TableHead>Yasal İsim</TableHead>
                  <TableHead>Ödeme Tarihi</TableHead>
                  <TableHead>Kalan Gün</TableHead>
                  <TableHead>Ödeme Tutarı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPayments.map((subscription: any) => {
                  const tenant = subscription.tenants;
                  const daysUntil = getDaysUntil(subscription.payment_date);
                  const isOverdue = subscription.payment_status === "overdue";

                  return (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {tenant?.name || "-"}
                      </TableCell>
                      <TableCell>{tenant?.commercial_name || "-"}</TableCell>
                      <TableCell>
                        {formatDate(subscription.payment_date)}
                      </TableCell>
                      <TableCell>
                        {daysUntil !== null ? (
                          <span
                            className={
                              isOverdue
                                ? "text-destructive font-semibold"
                                : daysUntil <= 7
                                ? "text-muted-foreground font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {isOverdue
                              ? `${Math.abs(daysUntil)} gün gecikmiş`
                              : `${daysUntil} gün`}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          subscription.payment_amount || subscription.contract_price || 0
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isOverdue
                              ? "bg-destructive/10 text-destructive"
                              : subscription.payment_status === "pending"
                              ? "bg-accent/10 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isOverdue
                            ? "Gecikmiş"
                            : subscription.payment_status === "pending"
                            ? "Bekliyor"
                            : subscription.payment_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/super-admin/tenants/${tenant?.id}`}>
                          <Button variant="outline" size="sm">
                            Detay
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
