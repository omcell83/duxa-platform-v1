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
import { QuickActions } from "@/components/super-admin/dashboard/quick-actions";
import { RecentActivity } from "@/components/super-admin/dashboard/recent-activity";
import { DashboardSearchBar } from "@/components/super-admin/dashboard/search-bar";

interface Tenant {
  id: string;
  name: string;
  commercial_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

interface Subscription {
  id: string;
  tenant_id: string;
  payment_date: string | null;
  payment_status: string;
  payment_amount: number | null;
  contract_price: number | null;
  tenants?: Tenant | null;
}

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

  const totalRevenue = subscriptions?.reduce((sum: number, sub: { payment_amount: number | null }) => {
    return sum + (sub.payment_amount || 0);
  }, 0) || 0;

  return {
    totalTenants: totalTenants || 0,
    totalDevices: totalDevices || 0,
    totalRevenue,
  };
}

async function getUpcomingPayments(): Promise<Subscription[]> {
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
    .limit(5); // Reduced limit to 5 for cleaner dashboard

  if (subscriptionsError || !subscriptions || subscriptions.length === 0) {
    return [];
  }

  // Tenant ID'leri topla
  const tenantIds = subscriptions.map((sub) => sub.tenant_id).filter(Boolean);

  if (tenantIds.length === 0) {
    // Cast to Subscription[] to handle the missing tenants property
    return subscriptions as unknown as Subscription[];
  }

  // Tenants'ı çek
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, name, commercial_name, contact_phone, contact_email")
    .in("id", tenantIds);

  if (tenantsError) {
    console.error("Error fetching tenants:", tenantsError);
    return subscriptions as unknown as Subscription[];
  }

  // Subscriptions ile tenants'ı birleştir
  return subscriptions.map((sub) => ({
    ...sub,
    tenants: tenants?.find((t) => t.id === sub.tenant_id) || null,
  })) as Subscription[];
}

export default async function SuperAdminDashboardPage() {
  const stats = await getDashboardStats();
  const upcomingPayments = await getUpcomingPayments();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
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
      {/* Page Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Sistem genel bakış ve istatistikler</p>
        </div>
        <div className="w-full md:w-auto">
          <DashboardSearchBar />
        </div>
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

      {/* Quick Actions and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ödemesi Yaklaşan İşletmeler */}
          <Card>
            <CardHeader>
              <CardTitle>Ödemesi Yaklaşan İşletmeler</CardTitle>
              <CardDescription>
                Yaklaşan ödemeler ve gecikmeler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Yaklaşan ödeme bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>İşletme</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingPayments.map((subscription) => {
                        const tenant = subscription.tenants;
                        const daysUntil = getDaysUntil(subscription.payment_date);
                        const isOverdue = subscription.payment_status === "overdue";

                        return (
                          <TableRow key={subscription.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{tenant?.name || "-"}</span>
                                <span className="text-xs text-muted-foreground">{tenant?.commercial_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatDate(subscription.payment_date)}</span>
                                {daysUntil !== null && (
                                  <span className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                                    {isOverdue ? `${Math.abs(daysUntil)} gün gecikmiş` : `${daysUntil} gün kaldı`}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              {formatCurrency(
                                subscription.payment_amount || subscription.contract_price || 0
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue
                                  ? "bg-destructive/10 text-destructive"
                                  : subscription.payment_status === "pending"
                                    ? "bg-secondary/10 text-secondary"
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
                                <Button variant="ghost" size="sm">
                                  Detay
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
