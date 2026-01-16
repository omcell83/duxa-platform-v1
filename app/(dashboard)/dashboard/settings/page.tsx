"use client";

import { Clock, Users, Building2, FileText, Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ayarlar</h1>
          <p className="text-muted-foreground mt-2">
            İşletme ayarlarını, personel bilgilerini ve fatura ayarlarını yönetin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/settings/business-identity">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  İşletme Kimliği
                </CardTitle>
                <CardDescription>
                  Logo, işletme adı, yasal bilgiler ve temel ayarlar
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/settings/general">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Genel Ayarlar
                </CardTitle>
                <CardDescription>
                  İletişim bilgileri, menü ayarları ve SEO ayarları
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/settings/invoices">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Faturalar
                </CardTitle>
                <CardDescription>
                  Müşteriye ait faturaları görüntüleyin ve yönetin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/settings/hours">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Çalışma Saatleri
                </CardTitle>
                <CardDescription>
                  Haftalık çalışma saatleri ve kapalı günler
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/settings/staff">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personel
                </CardTitle>
                <CardDescription>
                  Personel yönetimi ve yetkiler
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
