import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Languages } from "lucide-react";

export default function TranslationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sistem Çevirileri</h1>
          <p className="text-muted-foreground mt-1">Çok dilli içerik yönetimi</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Çeviri Ekle
        </Button>
      </div>

      {/* Translations Content */}
      <Card>
        <CardHeader>
          <CardTitle>Çeviri Anahtarları</CardTitle>
          <CardDescription>Sistem genelindeki tüm çeviriler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Languages className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz çeviri eklenmemiş.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
