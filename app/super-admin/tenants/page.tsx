import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Tenant } from "@/lib/types";
import { TenantsSearch } from "@/components/tenants-search";

interface TenantsPageProps {
  searchParams: {
    q?: string;
  };
}

async function getTenants(searchQuery?: string) {
  const supabase = await createClient();

  let query = supabase.from("tenants").select("*").order("created_at", { ascending: false });

  // Server-side search
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = searchQuery.trim();
    query = query.or(
      `name.ilike.%${searchTerm}%,commercial_name.ilike.%${searchTerm}%,contact_phone.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }

  return (data as Tenant[]) || [];
}

export default async function TenantsPage({ searchParams }: TenantsPageProps) {
  const searchQuery = searchParams.q || "";
  const tenants = await getTenants(searchQuery);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İşletmeler</h1>
          <p className="text-gray-600 mt-1">Müşteri işletmeleri yönetimi</p>
        </div>
        <Link href="/super-admin/tenants/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri Ekle
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <TenantsSearch />
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>İşletme Listesi</CardTitle>
          <CardDescription>
            {searchQuery
              ? `${tenants.length} sonuç bulundu`
              : `Toplam ${tenants.length} işletme`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? "Arama sonucu bulunamadı." : "Henüz işletme eklenmemiş."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İşletme Adı</TableHead>
                    <TableHead>Yasal İsim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.commercial_name || "-"}</TableCell>
                      <TableCell>{tenant.contact_phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tenant.status === "active"
                                ? "bg-primary/10 text-primary"
                                : tenant.status === "suspended"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {tenant.status === "active"
                              ? "Aktif"
                              : tenant.status === "suspended"
                              ? "Askıya Alınmış"
                              : "Pasif"}
                          </span>
                          {tenant.is_online && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Online
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(tenant.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/super-admin/tenants/${tenant.id}`}>
                          <Button variant="outline" size="sm">
                            Yönet
                          </Button>
                        </Link>
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
  );
}
