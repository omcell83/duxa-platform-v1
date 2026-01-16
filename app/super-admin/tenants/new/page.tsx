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
import { getAvailableCountries, getTaxIdentifierLabel } from "@/app/actions/tenant-general-settings";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validation schema
const createTenantSchema = z.object({
  name: z.string().min(1, "İşletme adı gereklidir"),
  commercial_name: z.string().optional().nullable(),
  slug: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  admin_full_name: z.string().min(1, "Yetkili ad soyad gereklidir"),
  admin_email: z.string().email("Geçerli bir email adresi giriniz"),
  admin_password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  contact_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  system_language_code: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof createTenantSchema>;

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slugSuggestion, setSlugSuggestion] = useState<string>("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<Array<{ code: string; name: string; flag_path: string }>>([]);
  const [taxLabel, setTaxLabel] = useState<string>("Vergi Numarası");

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
      address: "",
      country_code: "",
      system_language_code: "",
      tax_id: "",
    },
  });

  const businessName = watch("name");
  const countryCode = watch("country_code");
  const systemLanguageCode = watch("system_language_code");

  // Load available countries on mount
  useEffect(() => {
    async function loadCountries() {
      const result = await getAvailableCountries("tr");
      if (result.success && result.data) {
        setAvailableCountries(result.data);
      }
    }
    loadCountries();
  }, []);

  // Update tax label when country changes
  useEffect(() => {
    async function updateTaxLabel() {
      if (countryCode) {
        const result = await getTaxIdentifierLabel(countryCode);
        if (result.success && result.label) {
          setTaxLabel(result.label);
        } else {
          setTaxLabel("Vergi Numarası");
        }
      } else {
        setTaxLabel("Vergi Numarası");
      }
    }
    updateTaxLabel();
  }, [countryCode]);

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
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
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
          <h1 className="text-3xl font-bold text-foreground">Yeni Müşteri Ekle</h1>
          <p className="text-muted-foreground mt-1">Yeni işletme ve yetkili kullanıcı oluştur</p>
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
                    <p className="text-sm text-destructive flex items-center gap-1">
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
                      <span className="text-sm text-muted-foreground">Kontrol ediliyor...</span>
                    )}
                    {slugSuggestion && !checkingSlug && (
                      <span className="text-sm text-primary flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Öneri: {slugSuggestion}
                      </span>
                    )}
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.slug.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <textarea
                    id="address"
                    {...register("address")}
                    placeholder="Tam adres bilgisi"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country_code">Ülke</Label>
                  <Select
                    value={watch("country_code") || ""}
                    onValueChange={(value) => {
                      setValue("country_code", value || null, { shouldValidate: true });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger id="country_code">
                      <SelectValue placeholder="Ülke seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {availableCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <img src={country.flag_path} alt={country.name} className="w-5 h-3.5" />
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system_language_code">Sistem Dili</Label>
                  <Select
                    value={watch("system_language_code") || ""}
                    onValueChange={(value) => {
                      setValue("system_language_code", value || null, { shouldValidate: true });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger id="system_language_code">
                      <SelectValue placeholder="Sistem dili seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {availableCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <img src={country.flag_path} alt={country.name} className="w-5 h-3.5" />
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">{taxLabel}</Label>
                  <Input
                    id="tax_id"
                    {...register("tax_id")}
                    placeholder={taxLabel}
                    disabled={loading}
                  />
                  {errors.tax_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.tax_id.message}
                    </p>
                  )}
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
                    <p className="text-sm text-destructive flex items-center gap-1">
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
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.admin_email.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
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
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.admin_password.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
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
