import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Sistem ve genel ayarlar</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Ayarları</CardTitle>
            <CardDescription>SMTP konfigürasyonu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Email ayarları buraya eklenecek.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Güvenlik</CardTitle>
            <CardDescription>Güvenlik ayarları</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Güvenlik ayarları buraya eklenecek.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Genel Ayarlar</CardTitle>
            <CardDescription>Sistem genel ayarları</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Genel ayarlar buraya eklenecek.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yedekleme</CardTitle>
            <CardDescription>Veritabanı yedekleme</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Yedekleme ayarları buraya eklenecek.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
