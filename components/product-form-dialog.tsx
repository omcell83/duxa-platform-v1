"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CatalogProduct } from "@/lib/types";
import { createProduct, updateProduct } from "@/app/actions-products";
import { useRouter } from "next/navigation";
import { uploadProductImages } from "@/lib/image-upload";
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product: CatalogProduct | null;
}

const productSchema = z.object({
  name: z.string().min(1, "Ürün adı gereklidir"),
  description: z.string().optional().nullable(),
  image_url: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      "Geçerli bir URL giriniz"
    ),
  type: z.enum(["hardware", "subscription", "service", "addon"]),
  billing_cycle: z.enum(["one_time", "monthly", "yearly"]).optional().nullable(),
  base_price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  min_sales_price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  tax_rate: z.number().min(0).max(100, "Vergi oranı 0-100 arasında olmalıdır"),
  stock_track: z.boolean(),
  current_stock: z.number().min(0).optional().nullable(),
  is_public: z.boolean(),
}).refine(
  (data) => data.min_sales_price <= data.base_price,
  {
    message: "Min. satış fiyatı baz fiyattan büyük olamaz",
    path: ["min_sales_price"],
  }
).refine(
  (data) => {
    if (data.type === "subscription" && data.stock_track) {
      return false;
    }
    return true;
  },
  {
    message: "Abonelik ürünleri stok takibi yapamaz",
    path: ["stock_track"],
  }
);

type ProductFormData = z.infer<typeof productSchema>;

export function ProductFormDialog({ open, onClose, product }: ProductFormDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
      type: "hardware",
      billing_cycle: "one_time",
      base_price: 0,
      min_sales_price: 0,
      tax_rate: 0,
      stock_track: false,
      current_stock: 0,
      is_public: false,
    },
  });

  const productType = watch("type");
  const stockTrack = watch("stock_track");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || "",
        image_url: product.image_url || "",
        type: product.type,
        billing_cycle: product.billing_cycle || "one_time",
        base_price: product.base_price,
        min_sales_price: product.min_sales_price,
        tax_rate: product.tax_rate,
        stock_track: product.stock_track,
        current_stock: product.current_stock || 0,
        is_public: product.is_public,
      });
      // Set existing image URL if available
      if (product.image_url) {
        setImageUrls([product.image_url]);
      } else {
        setImageUrls([]);
      }
    } else {
      reset({
        name: "",
        description: "",
        image_url: "",
        type: "hardware",
        billing_cycle: "one_time",
        base_price: 0,
        min_sales_price: 0,
        tax_rate: 0,
        stock_track: false,
        current_stock: 0,
        is_public: false,
      });
      setImageUrls([]);
    }
    setSelectedFiles([]);
    setShowUrlInput(false);
  }, [product, reset, open]);

  // Disable stock tracking for subscriptions
  useEffect(() => {
    if (productType === "subscription") {
      setValue("stock_track", false);
      setValue("current_stock", null);
    }
  }, [productType, setValue]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check total count (existing + new)
    const totalCount = imageUrls.length + selectedFiles.length + files.length;
    if (totalCount > 6) {
      setError(`Maksimum 6 resim yüklenebilir. Şu anda ${imageUrls.length + selectedFiles.length} resim var.`);
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Sadece resim dosyaları yüklenebilir.');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    setError(null);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) return;

    const totalCount = imageUrls.length + selectedFiles.length + files.length;
    if (totalCount > 6) {
      setError(`Maksimum 6 resim yüklenebilir. Şu anda ${imageUrls.length + selectedFiles.length} resim var.`);
      return;
    }

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Sadece resim dosyaları yüklenebilir.');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    setError(null);
  };

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove uploaded image URL
  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => {
      const newUrls = prev.filter((_, i) => i !== index);
      setValue("image_url", newUrls[0] || "");
      return newUrls;
    });
  };

  // Upload images before form submission
  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadingImages(true);
    setError(null);

    try {
      const result = await uploadProductImages(selectedFiles, product?.id);

      if (result.success && result.urls) {
        const newUrls = [...imageUrls, ...result.urls];
        setImageUrls(newUrls);
        // Set first image as primary
        setValue("image_url", newUrls[0] || "");
        setSelectedFiles([]);
      } else {
        setError(result.error || "Resim yükleme başarısız");
        setUploadingImages(false);
        return false;
      }
    } catch (err: any) {
      setError(err?.message || "Resim yükleme sırasında bir hata oluştu");
      setUploadingImages(false);
      return false;
    }

    setUploadingImages(false);
    return true;
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    setError(null);

    // Upload images first if there are selected files
    if (selectedFiles.length > 0) {
      const uploadSuccess = await handleImageUpload();
      if (!uploadSuccess) {
        setLoading(false);
        return;
      }
    }

    // Use first image URL or provided URL
    const finalImageUrl = imageUrls[0] || data.image_url || "";

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("image_url", finalImageUrl);
    formData.append("type", data.type);
    formData.append("billing_cycle", data.billing_cycle || "");
    formData.append("base_price", data.base_price.toString());
    formData.append("min_sales_price", data.min_sales_price.toString());
    formData.append("tax_rate", data.tax_rate.toString());
    formData.append("stock_track", data.stock_track.toString());
    formData.append("current_stock", data.current_stock?.toString() || "0");
    formData.append("is_public", data.is_public.toString());

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result.success) {
      onClose();
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>{product ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
          <DialogDescription>
            {product ? "Ürün bilgilerini güncelleyin" : "Yeni bir ürün ekleyin"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Genel Bilgiler */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <textarea
                id="description"
                {...register("description")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label>Ürün Resimleri (Maksimum 6)</Label>
              
              {/* Uploaded Images Preview */}
              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Yüklenen resimler:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Ürün resmi ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border border-input"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                            Ana
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-input rounded-md p-6 text-center hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Resimleri sürükleyip bırakın veya
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || imageUrls.length + selectedFiles.length >= 6}
                  className="mb-2"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
                <p className="text-xs text-muted-foreground">
                  {imageUrls.length + selectedFiles.length}/6 resim seçildi
                </p>
              </div>

              {/* Selected Files Preview (before upload) */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Yüklenecek resimler:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-md border border-input"
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
                          />
                          <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(previewUrl);
                              removeSelectedFile(index);
                            }}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* URL Input Option */}
              <div className="space-y-2">
                {!showUrlInput ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlInput(true)}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL ile ekle
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="image_url"
                        type="url"
                        {...register("image_url")}
                        placeholder="https://..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowUrlInput(false);
                          setValue("image_url", "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.image_url && (
                      <p className="text-sm text-destructive">{errors.image_url.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tip ve Faturalama */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Ürün Tipi *</Label>
              <select
                id="type"
                {...register("type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="hardware">Donanım</option>
                <option value="subscription">Abonelik</option>
                <option value="service">Hizmet</option>
                <option value="addon">Eklenti</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Faturalama Döngüsü</Label>
              <select
                id="billing_cycle"
                {...register("billing_cycle")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="one_time">Tek Seferlik</option>
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
            </div>
          </div>

          {/* Fiyatlandırma */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Baz Fiyat (₺) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register("base_price", { valueAsNumber: true })}
              />
              {errors.base_price && <p className="text-sm text-destructive">{errors.base_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_sales_price">Min. Satış Fiyatı (₺) *</Label>
              <Input
                id="min_sales_price"
                type="number"
                step="0.01"
                {...register("min_sales_price", { valueAsNumber: true })}
              />
              {errors.min_sales_price && <p className="text-sm text-destructive">{errors.min_sales_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_rate">Vergi Oranı (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                {...register("tax_rate", { valueAsNumber: true })}
              />
              {errors.tax_rate && <p className="text-sm text-destructive">{errors.tax_rate.message}</p>}
            </div>
          </div>

          {/* Stok */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="stock_track">Stok Takibi</Label>
                <p className="text-sm text-muted-foreground">Stok takibi yapılsın mı?</p>
              </div>
              <Switch
                id="stock_track"
                checked={stockTrack}
                onCheckedChange={(checked) => {
                  setValue("stock_track", checked);
                  if (!checked) {
                    setValue("current_stock", null);
                  }
                }}
                disabled={productType === "subscription"}
              />
            </div>

            {stockTrack && productType !== "subscription" && (
              <div className="space-y-2">
                <Label htmlFor="current_stock">Mevcut Stok</Label>
                <Input
                  id="current_stock"
                  type="number"
                  {...register("current_stock", { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Public */}
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-0.5">
              <Label htmlFor="is_public">Herkese Açık</Label>
              <p className="text-sm text-muted-foreground">Marketing sitesinde görünsün mü?</p>
            </div>
            <Switch
              id="is_public"
              checked={watch("is_public")}
              onCheckedChange={(checked) => setValue("is_public", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading || uploadingImages}>
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImages}
            >
              {uploadingImages
                ? "Resimler yükleniyor..."
                : loading
                ? "Kaydediliyor..."
                : product
                ? "Güncelle"
                : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
