import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText, Route, BookOpen, Users, Languages, ClipboardList, Palette } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Sistem ve genel ayarlar</p>
      </div>

      {/* Documentation Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Sistem Dokümantasyonu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link href="/super-admin/documentation/files">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dosya Ağacı</CardTitle>
                    <CardDescription>Proje dosya yapısı ve açıklamaları</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/super-admin/documentation/routes">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Route className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Site Haritası</CardTitle>
                    <CardDescription>Tüm route'lar ve sayfa listesi</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Settings Sections */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Sistem Ayarları</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Ayarları</CardTitle>
              <CardDescription>SMTP konfigürasyonu</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Email ayarları buraya eklenecek.</p>
            </CardContent>
          </Card>

          <Link href="/super-admin/settings/security">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Güvenlik</CardTitle>
                    <CardDescription>Güvenlik ayarları</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Parola politikaları ve erişim kontrolleri.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/settings/logs">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Sistem Logları</CardTitle>
                    <CardDescription>Sistem kayıtları ve izleme</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Giriş kayıtları, önemli değişiklikler ve hatalar.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/settings/users">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Personel / Kullanıcı</CardTitle>
                    <CardDescription>Yetkili kullanıcı yönetimi</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Admin, Manager ve Personel hesapları.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/settings/translations">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Languages className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Çeviri Yönetimi</CardTitle>
                    <CardDescription>Platform dil çevirileri</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">AI destekli çeviri sistemi ve dil dosyaları.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/settings/meeting-tasks">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Toplantı Kararları</CardTitle>
                    <CardDescription>Personel toplantısı yapılacaklar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Toplantılarda alınan kararlar ve görev takibi.</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Sistem genel ayarları</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Genel ayarlar buraya eklenecek.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yedekleme</CardTitle>
              <CardDescription>Veritabanı yedekleme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Yedekleme ayarları buraya eklenecek.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
