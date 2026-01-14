import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donanım Envanteri</h1>
          <p className="text-gray-600 mt-1">Cihaz yönetimi ve takibi</p>
        </div>
        <Button className="bg-[#05594C] hover:bg-[#044a3f]">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Cihaz Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Depoda</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kirada</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tamirde</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Listesi</CardTitle>
          <CardDescription>Tüm donanım cihazları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Henüz cihaz eklenmemiş.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
