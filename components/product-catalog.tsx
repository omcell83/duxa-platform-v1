"use client";

import { useState } from "react";
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
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, ShoppingCart } from "lucide-react";
import { CatalogProduct } from "@/lib/types";
import { deleteProduct } from "@/app/actions-products";
import { ProductFormDialog } from "@/components/product-form-dialog";
import { useRouter } from "next/navigation";

interface ProductCatalogProps {
  initialProducts: CatalogProduct[];
}

export function ProductCatalog({ initialProducts }: ProductCatalogProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (productId: number) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(productId);
    const result = await deleteProduct(productId);

    if (result.success) {
      if (result.archived) {
        alert("Ürün satış kaydı olduğu için arşivlendi (silinmedi).");
      }
      router.refresh();
    } else {
      alert(`Hata: ${result.error}`);
    }
    setDeletingId(null);
  };

  const handleEdit = (product: CatalogProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    router.refresh();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hardware: "Donanım",
      subscription: "Abonelik",
      service: "Hizmet",
      addon: "Eklenti",
    };
    return labels[type] || type;
  };

  const getBillingCycleLabel = (cycle: string | null | undefined) => {
    if (!cycle) return "-";
    const labels: Record<string, string> = {
      one_time: "Tek Seferlik",
      monthly: "Aylık",
      yearly: "Yıllık",
    };
    return labels[cycle] || cycle;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ürün Kataloğu</CardTitle>
              <CardDescription>Tüm satılabilir ürünler</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ürün Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Henüz ürün eklenmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resim</TableHead>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Faturalama</TableHead>
                    <TableHead>Baz Fiyat</TableHead>
                    <TableHead>Min. Fiyat</TableHead>
                    <TableHead>Vergi</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Satış</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getTypeLabel(product.type)}</TableCell>
                      <TableCell>{getBillingCycleLabel(product.billing_cycle)}</TableCell>
                      <TableCell>{formatPrice(product.base_price)}</TableCell>
                      <TableCell>{formatPrice(product.min_sales_price)}</TableCell>
                      <TableCell>%{product.tax_rate}</TableCell>
                      <TableCell>
                        {product.stock_track ? (
                          <span className={product.current_stock && product.current_stock < 10 ? "text-red-600 font-semibold" : ""}>
                            {product.current_stock || 0}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {product.total_sales || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.is_public ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          {!product.is_active && (
                            <span className="text-xs text-gray-500">Arşivli</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        product={editingProduct}
      />
    </>
  );
}
