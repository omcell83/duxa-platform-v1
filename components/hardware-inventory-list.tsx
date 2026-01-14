"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

interface HardwareInventoryListProps {
  initialStats: {
    in_stock: number;
    rented: number;
    under_repair: number;
    total: number;
  };
}

export function HardwareInventoryList({ initialStats }: HardwareInventoryListProps) {
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Depoda</CardDescription>
            <CardTitle className="text-2xl">{initialStats.in_stock}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kirada</CardDescription>
            <CardTitle className="text-2xl">{initialStats.rented}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tamirde</CardDescription>
            <CardTitle className="text-2xl">{initialStats.under_repair}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam</CardDescription>
            <CardTitle className="text-2xl">{initialStats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cihaz Listesi</CardTitle>
              <CardDescription>Tüm donanım cihazları (Seri No ile)</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Cihaz Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz cihaz eklenmemiş.</p>
            <p className="text-sm text-muted-foreground mt-2">Cihaz ekleme özelliği yakında eklenecek.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
