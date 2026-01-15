import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
// Simple date formatter
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface Invoice {
  id: number;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  invoice_url: string | null;
  created_at: string;
}

interface Subscription {
  id: number;
  contract_price: number;
  payment_status: string;
  payment_date: string | null;
  contract_date: string;
}

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?redirect=/dashboard/billing");
  }

  // Get tenant_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", session.user.id)
    .single();

  if (!profile?.tenant_id) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            Tenant bilgisi bulunamadı
          </div>
        </div>
      </div>
    );
  }

  // Get tenant info with plan
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, status")
    .eq("id", profile.tenant_id)
    .single();

  // Get latest subscription
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("contract_date", { ascending: false })
    .limit(1);

  const latestSubscription: Subscription | null = subscriptions?.[0] || null;

  // Check if subscription is expired
  let subscriptionStatus = "Ücretsiz Plan";
  let subscriptionExpired = false;

  if (latestSubscription) {
    const contractDate = new Date(latestSubscription.contract_date);
    const now = new Date();
    const oneYearLater = new Date(contractDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    if (now > oneYearLater) {
      subscriptionStatus = "Süresi Dolmuş";
      subscriptionExpired = true;
    } else {
      subscriptionStatus = tenant?.plan || "Standard Plan";
    }
  } else if (tenant?.plan) {
    subscriptionStatus = tenant.plan;
  }

  // Get invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  const invoiceList: Invoice[] = invoices || [];

  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Abonelik ve Faturalar</h1>
          <p className="text-muted-foreground mt-2">
            Abonelik bilgilerinizi ve fatura geçmişinizi görüntüleyin
          </p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Mevcut Paket</CardTitle>
            <CardDescription>
              Aktif abonelik bilgileriniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paket</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {subscriptionStatus}
                  </p>
                </div>
                {subscriptionExpired && (
                  <Badge variant="destructive">Süresi Dolmuş</Badge>
                )}
                {!subscriptionExpired && latestSubscription && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>

              {latestSubscription && (
                <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Sözleşme Tarihi</p>
                    <p className="font-medium text-foreground mt-1">
                      {formatDate(latestSubscription.contract_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ödeme Durumu</p>
                    <p className="font-medium text-foreground mt-1">
                      {latestSubscription.payment_status === "paid"
                        ? "Ödendi"
                        : latestSubscription.payment_status === "pending"
                        ? "Beklemede"
                        : "Ödenmedi"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aylık Ücret</p>
                    <p className="font-medium text-foreground mt-1">
                      ₺{(latestSubscription.contract_price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {!latestSubscription && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Aktif bir aboneliğiniz bulunmamaktadır.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoices History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Fatura Geçmişi</CardTitle>
            <CardDescription>
              Tüm faturalarınızı buradan görüntüleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoiceList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Henüz kesilmiş bir faturanız bulunmamaktadır
                </h3>
                <p className="text-sm text-muted-foreground">
                  Faturalarınız burada görünecektir
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceList.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {formatDate(invoice.created_at)}
                      </TableCell>
                      <TableCell>
                        {(invoice.amount / 100).toFixed(2)} {invoice.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {invoice.status === "paid"
                            ? "Ödendi"
                            : invoice.status === "pending"
                            ? "Beklemede"
                            : "Gecikmiş"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.invoice_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="gap-2"
                          >
                            <a
                              href={invoice.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                              PDF İndir
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            PDF mevcut değil
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
