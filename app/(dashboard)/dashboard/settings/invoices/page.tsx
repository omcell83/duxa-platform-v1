"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, FileText, XCircle } from "lucide-react";
import { getTenantInvoices, Invoice } from "@/app/actions/invoices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        const result = await getTenantInvoices();

        if (!result.success) {
          const errorMessage = result.error || "Faturalar yüklenemedi";
          setLoadError(errorMessage);
          toast.error(errorMessage);
          if (errorMessage.includes("tenant_admin")) {
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
          return;
        }

        setLoadError(null);
        setInvoices(result.data || []);
      } catch (error) {
        console.error("Error loading invoices:", error);
        setLoadError("Faturalar yüklenirken bir hata oluştu");
        toast.error("Faturalar yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [router]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Ödendi", variant: "default" },
      pending: { label: "Beklemede", variant: "secondary" },
      overdue: { label: "Gecikmiş", variant: "destructive" },
      cancelled: { label: "İptal", variant: "outline" },
    };

    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: "outline" as const };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyMap: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    const symbol = currencyMap[currency] || currency;
    return `${symbol} ${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!loading && loadError) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Faturalar</h1>
            <p className="text-muted-foreground mt-2">
              Müşteriye ait faturaları görüntüleyin ve yönetin
            </p>
          </div>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    Faturalar Yüklenemedi
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    {loadError}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                    >
                      Sayfayı Yenile
                    </Button>
                    {loadError.includes("tenant_admin") && (
                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="default"
                      >
                        Dashboard'a Dön
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Faturalar</h1>
            <p className="text-muted-foreground mt-2">
              Müşteriye ait faturaları görüntüleyin ve yönetin
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Fatura Listesi
            </CardTitle>
            <CardDescription>
              Tüm faturalarınızı buradan görüntüleyebilir ve indirebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Henüz fatura bulunmuyor
                </h3>
                <p className="text-sm text-muted-foreground">
                  Faturalarınız burada görüntülenecektir
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Düzenleme Tarihi</TableHead>
                      <TableHead>Vade Tarihi</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            İndir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
