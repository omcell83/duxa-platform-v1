"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  Edit,
  Trash2,
  Languages,
  DollarSign,
  QrCode,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  image?: string;
  order: number;
  is_active: boolean;
}

interface MenuProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category_id?: number;
  is_active: boolean;
  order: number;
  modifier_group_id?: number;
}

interface ProductModifier {
  id: number;
  name: string;
  type: "single" | "multiple";
  is_required: boolean;
  options: Array<{ name: string; price: number }>;
}

export default function MenuManagementPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "categories";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [modifiers, setModifiers] = useState<ProductModifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          return;
        }

        // Get tenant_id from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", session.user.id)
          .single();

        if (!profile?.tenant_id) {
          setLoading(false);
          return;
        }

        setTenantId(profile.tenant_id);

        // Load categories
        const { data: categoriesData } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .order("order", { ascending: true });

        if (categoriesData) {
          setCategories(categoriesData);
        }

        // Load products
        const { data: productsData } = await supabase
          .from("menu_products")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .order("order", { ascending: true });

        if (productsData) {
          setProducts(productsData);
        }

        // Load modifiers
        const { data: modifiersData } = await supabase
          .from("product_modifiers")
          .select("*")
          .eq("tenant_id", profile.tenant_id);

        if (modifiersData) {
          setModifiers(modifiersData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Veriler yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleBulkPriceUpdate = () => {
    toast.info("Toplu fiyat güncelleme özelliği yakında eklenecek");
  };

  const handleGenerateQR = () => {
    toast.info("QR kod oluşturma özelliği yakında eklenecek");
  };

  const handleTranslation = (productId: number) => {
    toast.info("Çeviri özelliği yakında eklenecek");
  };

  if (loading) {
    return (
      <div className="bg-background min-h-full p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menü Yönetimi</h1>
            <p className="text-muted-foreground mt-2">
              Kategoriler, ürünler ve seçenekleri yönetin
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBulkPriceUpdate}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Toplu Fiyat Güncelle
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateQR}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Kod Oluştur
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Kategoriler</TabsTrigger>
            <TabsTrigger value="products">Ürünler</TabsTrigger>
            <TabsTrigger value="modifiers">Seçenekler</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Kategoriler</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Kategori
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-popover">
                      <DialogHeader>
                        <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                        <DialogDescription>
                          Menüye yeni bir kategori ekleyin
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          Kategori ekleme formu yakında eklenecek
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">İptal</Button>
                        <Button>Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz kategori eklenmemiş
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sıra</TableHead>
                        <TableHead>İsim</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>{category.order}</TableCell>
                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                category.is_active
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                            >
                              {category.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ürünler</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Ürün
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-popover max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Yeni Ürün Ekle</DialogTitle>
                        <DialogDescription>
                          Menüye yeni bir ürün ekleyin
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          Ürün ekleme formu yakında eklenecek. Bu formda:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Ürün adı, açıklama, fiyat</li>
                          <li>Kategori seçimi</li>
                          <li>Opsiyon Grubu Seç (Modifier Group)</li>
                          <li>Resim yükleme</li>
                        </ul>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">İptal</Button>
                        <Button>Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz ürün eklenmemiş
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>İsim</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {categories.find((c) => c.id === product.category_id)
                              ?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {(product.price / 100).toFixed(2)} ₺
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                product.is_active
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                            >
                              {product.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTranslation(product.id)}
                                title="Çeviri"
                              >
                                <Languages className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modifiers Tab */}
          <TabsContent value="modifiers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Seçenekler (Modifiers)</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Seçenek Grubu
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-popover">
                      <DialogHeader>
                        <DialogTitle>Yeni Seçenek Grubu Ekle</DialogTitle>
                        <DialogDescription>
                          Ürünlere eklenebilecek seçenek grupları oluşturun
                          (Örn: Ekstra Peynir, Sos Seçimi)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          Seçenek grubu ekleme formu yakında eklenecek
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">İptal</Button>
                        <Button>Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {modifiers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz seçenek grubu eklenmemiş
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>İsim</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Zorunlu</TableHead>
                        <TableHead>Seçenek Sayısı</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modifiers.map((modifier) => (
                        <TableRow key={modifier.id}>
                          <TableCell className="font-medium">
                            {modifier.name}
                          </TableCell>
                          <TableCell>
                            {modifier.type === "single"
                              ? "Tek Seçim"
                              : "Çoklu Seçim"}
                          </TableCell>
                          <TableCell>
                            {modifier.is_required ? (
                              <span className="text-destructive">Evet</span>
                            ) : (
                              <span className="text-muted-foreground">Hayır</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(modifier.options)
                              ? modifier.options.length
                              : 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
