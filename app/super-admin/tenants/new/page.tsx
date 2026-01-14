"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTenant, generateSlugSuggestion } from "@/app/actions-tenant-create";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Validation schema
const createTenantSchema = z.object({
  name: z.string().min(1, "İşletme adı gereklidir"),
  commercial_name: z.string().optional().nullable(),
  slug: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  admin_full_name: z.string().min(1, "Yetkili ad soyad gereklidir"),
  admin_email: z.string().email("Geçerli bir email adresi giriniz"),
  admin_password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  contact_phone: z.string().optional().nullable(),
});

type FormData = z.infer<typeof createTenantSchema>;

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slugSuggestion, setSlugSuggestion] = useState<string>("");
  const [checkingSlug, setCheckingSlug] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      commercial_name: "",
      slug: "",
      admin_full_name: "",
      admin_email: "",
      admin_password: "",
      contact_phone: "",
    },
  });

  const businessName = watch("name");

  // Auto-generate slug when business name changes
  useEffect(() => {
    if (businessName && businessName.trim()) {
      setCheckingSlug(true);
      generateSlugSuggestion(businessName)
        .then((suggestion) => {
          setSlugSuggestion(suggestion);
          setValue("slug", suggestion);
          setCheckingSlug(false);
        })
        .catch(() => {
          setCheckingSlug(false);
        });
    }
  }, [businessName, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value || "");
    });

    const result = await createTenant(formData);

    if (result.success) {
      toast.success("Müşteri başarıyla eklendi!", {
        description: `${data.name} işletmesi ve yetkili kullanıcı oluşturuldu.`,
      });
      router.push("/super-admin/tenants");
      router.refresh();
    } else {
      toast.error("Hata!", {
        description: result.error || "Bir hata oluştu",
      });

      // If slug suggestion is provided, update the form
      if (result.suggestion) {
        setValue("slug", result.suggestion);
        setSlugSuggestion(result.suggestion);
      }
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Müşteri Ekle</h1>
          <p className="text-gray-600 mt-1">Yeni işletme ve yetkili kullanıcı oluştur</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>İşletme Bilgileri</CardTitle>
          <CardDescription>Yeni müşteri işletmesi ve yetkili kullanıcı bilgilerini girin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">İşletme Bilgileri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">İşletme Adı *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Örn: Lezzet Dünyası"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commercial_name">Yasal İsim</Label>
                  <Input
                    id="commercial_name"
                    {...register("commercial_name")}
                    placeholder="Yasal İsim"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slug">Subdomain *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      {...register("slug")}
                      placeholder="ornek-subdomain"
                      disabled={loading || checkingSlug}
                      className="flex-1"
                    />
                    {checkingSlug && (
                      <span className="text-sm text-gray-500">Kontrol ediliyor...</span>
                    )}
                    {slugSuggestion && !checkingSlug && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Öneri: {slugSuggestion}
                      </span>
                    )}
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.slug.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    İşletme adından otomatik oluşturulur. Türkçe karakterler temizlenir.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    {...register("contact_phone")}
                    placeholder="+90 555 123 4567"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Admin User Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Yetkili Kullanıcı Bilgileri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_full_name">Yetkili Ad Soyad *</Label>
                  <Input
                    id="admin_full_name"
                    {...register("admin_full_name")}
                    placeholder="Ahmet Yılmaz"
                    disabled={loading}
                  />
                  {errors.admin_full_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.admin_full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email">Yetkili Email *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    {...register("admin_email")}
                    placeholder="yetkili@email.com"
                    disabled={loading}
                  />
                  {errors.admin_email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.admin_email.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Bu email ile sisteme giriş yapılacak
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">Geçici Şifre *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    {...register("admin_password")}
                    placeholder="En az 6 karakter"
                    disabled={loading}
                  />
                  {errors.admin_password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.admin_password.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Kullanıcı ilk girişte şifresini değiştirebilir
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link href="/super-admin/tenants">
                <Button type="button" variant="outline" disabled={loading}>
                  İptal
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
