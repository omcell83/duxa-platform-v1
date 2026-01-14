import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, ShoppingCart, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { CatalogProduct } from "@/lib/types";
import { getProducts, deleteProduct } from "@/app/actions-products";
import { ProductCatalog } from "@/components/product-catalog";
import { HardwareInventoryList } from "@/components/hardware-inventory-list";

export default async function InventoryPage() {
  const supabase = await createClient();

  // Get products
  const productsResult = await getProducts();
  const products = productsResult.success ? productsResult.data : [];

  // Get hardware inventory stats
  const { data: hardwareStats } = await supabase
    .from("hardware_inventory")
    .select("status");

  const stats = {
    in_stock: hardwareStats?.filter((h) => h.status === "in_stock").length || 0,
    rented: hardwareStats?.filter((h) => h.status === "rented").length || 0,
    under_repair: hardwareStats?.filter((h) => h.status === "under_repair").length || 0,
    total: hardwareStats?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Envanter Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Ürün kataloğu ve donanım envanteri</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catalog" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Ürün Kataloğu
          </TabsTrigger>
          <TabsTrigger value="hardware" className="gap-2">
            <Package className="h-4 w-4" />
            Cihaz Envanteri (Seri No)
          </TabsTrigger>
        </TabsList>

        {/* Product Catalog Tab */}
        <TabsContent value="catalog">
          <ProductCatalog initialProducts={products} />
        </TabsContent>

        {/* Hardware Inventory Tab */}
        <TabsContent value="hardware">
          <HardwareInventoryList initialStats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
