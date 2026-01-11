"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Plus, Building2 } from "lucide-react";

// Mock data - gerçek uygulamada API'den gelecek
const mockRestaurants = [
  {
    id: 1,
    name: "Lezzet Dünyası",
    subdomain: "lezzet",
    status: "Aktif",
    package: "Premium",
  },
  {
    id: 2,
    name: "Deniz Mahallesi",
    subdomain: "deniz",
    status: "Aktif",
    package: "Standart",
  },
  {
    id: 3,
    name: "Karadeniz Lokantası",
    subdomain: "karadeniz",
    status: "Pasif",
    package: "Premium",
  },
];

export default function SuperAdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    email: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Restoran adı değiştiğinde subdomain'i otomatik öner
      if (field === "name") {
        const suggestedSubdomain = value
          .toLowerCase()
          .replace(/ğ/g, "g")
          .replace(/ü/g, "u")
          .replace(/ş/g, "s")
          .replace(/ı/g, "i")
          .replace(/ö/g, "o")
          .replace(/ç/g, "c")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        newData.subdomain = suggestedSubdomain;
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Yeni Restoran Verisi:", formData);
    setIsDialogOpen(false);
    setFormData({ name: "", subdomain: "", email: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#05594C]" />
            <h1 className="text-xl font-semibold text-gray-900">Duxa SuperAdmin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <User className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Toplam Restoran Sayısı</CardDescription>
              <CardTitle className="text-3xl font-bold">24</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aktif Abonelikler</CardDescription>
              <CardTitle className="text-3xl font-bold">18</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Toplam Gelir</CardDescription>
              <CardTitle className="text-3xl font-bold">₺145.500</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Restoranlar Tablosu */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Restoranlar</CardTitle>
                <CardDescription>Tüm restoranları yönetin</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#05594C] hover:bg-[#044a3f] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Restoran Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Yeni Restoran Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni bir restoran eklemek için aşağıdaki bilgileri doldurun.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Restoran Adı</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Örn: Lezzet Dünyası"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="subdomain">Subdomain</Label>
                        <Input
                          id="subdomain"
                          value={formData.subdomain}
                          onChange={(e) => handleInputChange("subdomain", e.target.value)}
                          placeholder="lezzet"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Restoran adına göre otomatik önerilir
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Yetkili E-posta</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="ornek@email.com"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        İptal
                      </Button>
                      <Button type="submit" className="bg-[#05594C] hover:bg-[#044a3f] text-white">
                        Oluştur
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restoran Adı</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">{restaurant.name}</TableCell>
                    <TableCell>{restaurant.subdomain}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurant.status === "Aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {restaurant.status}
                      </span>
                    </TableCell>
                    <TableCell>{restaurant.package}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Düzenle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}