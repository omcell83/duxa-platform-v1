"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Save, Info, XCircle } from "lucide-react";
import {
  getBusinessIdentity,
  updateBusinessIdentity,
} from "@/app/actions/business-identity";
import { getAvailableLanguages } from "@/app/actions/tenant-general-settings";
import { uploadProductImage } from "@/lib/image-upload";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  businessName: z.string().min(1, "İşletme adı gereklidir"),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]),
  systemLanguage: z.string().min(1, "Yönetici dili gereklidir"),
  logoUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function BusinessIdentityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ code: string; name: string; flag_path: string }>>([]);
  const [currentSystemLanguage, setCurrentSystemLanguage] = useState("tr");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [taxId, setTaxId] = useState<string>("");
  const [taxLabel, setTaxLabel] = useState<string>("Vergi Numarası");
  const [commercialName, setCommercialName] = useState<string>("");
  const [countryName, setCountryName] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      currency: "TRY",
      systemLanguage: "tr",
      logoUrl: "",
    },
  });

  const watchedSystemLanguage = watch("systemLanguage");

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsResult, languagesResult] = await Promise.all([
          getBusinessIdentity(),
          getAvailableLanguages("tr"),
        ]);

        if (!settingsResult.success) {
          const errorMessage = settingsResult.error || "Ayarlar yüklenemedi";
          setLoadError(errorMessage);
          toast.error(errorMessage);
          if (errorMessage.includes("tenant_admin")) {
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
          setLoading(false);
          return;
        }

        setLoadError(null);
        const settings = settingsResult.data!;
        setCurrentSystemLanguage(settings.systemLanguage);

        // Set form values
        setValue("businessName", settings.businessName);
        setValue("currency", settings.currency as "TRY" | "USD" | "EUR" | "GBP");
        setValue("systemLanguage", settings.systemLanguage);
        setValue("logoUrl", settings.logoUrl || "");
        
        // Set legal info (read-only)
        setCommercialName(settings.commercialName || "");
        setTaxId(settings.taxId || "");
        setTaxLabel(settings.taxLabel || "Vergi Numarası");
        setCountryName(settings.countryName || "");
        setAddress(settings.address || "");

        // Load languages with current system language
        if (languagesResult.success) {
          setAvailableLanguages(languagesResult.data || []);
        } else {
          console.warn("Initial languages load failed:", languagesResult.error);
        }

        // Load languages with system language
        const updatedLanguagesResult = await getAvailableLanguages(settings.systemLanguage);
        if (updatedLanguagesResult.success) {
          setAvailableLanguages(updatedLanguagesResult.data || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setLoadError("Veriler yüklenirken bir hata oluştu");
        toast.error("Veriler yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setValue, router]);

  // Update languages when system language changes
  useEffect(() => {
    async function updateLanguages() {
      if (!watchedSystemLanguage || loading) return;
      
      if (watchedSystemLanguage === currentSystemLanguage) return;

      const result = await getAvailableLanguages(watchedSystemLanguage);
      if (result.success) {
        setAvailableLanguages(result.data || []);
        setCurrentSystemLanguage(watchedSystemLanguage);
      }
    }

    updateLanguages();
  }, [watchedSystemLanguage, currentSystemLanguage, loading]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadProductImage(file);
      if (result.success && result.url) {
        setValue("logoUrl", result.url, { shouldDirty: true });
        toast.success("Logo yüklendi");
      } else {
        toast.error(result.error || "Logo yüklenirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Logo yüklenirken bir hata oluştu");
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const result = await updateBusinessIdentity(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Ayarlar başarıyla güncellendi");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!loading && loadError) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">İşletme Kimliği</h1>
            <p className="text-muted-foreground mt-2">
              Logo, işletme adı ve temel ayarlar
            </p>
          </div>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    Ayarlar Yüklenemedi
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    {loadError}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                    >
                      Sayfayı Yenile
                    </Button>
                    {loadError.includes("tenant_admin") && (
                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="default"
                      >
                        Dashboard'a Dön
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">İşletme Kimliği</h1>
            <p className="text-muted-foreground mt-2">
              Logo, işletme adı ve temel ayarlar
            </p>
          </div>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saving || !isDirty}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İşletme Kimliği</CardTitle>
              <CardDescription>Logo, işletme adı ve temel ayarlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={watch("logoUrl")} />
                    <AvatarFallback>
                      <Upload className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="cursor-pointer"
                    />
                    {uploadingLogo && (
                      <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* İşletme Adı */}
              <div className="space-y-2">
                <Label htmlFor="businessName">İşletme Adı *</Label>
                <Input
                  id="businessName"
                  {...register("businessName")}
                  placeholder="Örn: Murad Steakhouse"
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive">{errors.businessName.message}</p>
                )}
              </div>

              {/* Para Birimi */}
              <div className="space-y-2">
                <Label htmlFor="currency">Para Birimi *</Label>
                <Select
                  value={watch("currency")}
                  onValueChange={(value) => setValue("currency", value as "TRY" | "USD" | "EUR" | "GBP", { shouldDirty: true })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Para birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">₺ Türk Lirası (TRY)</SelectItem>
                    <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Yönetici Dili */}
              <div className="space-y-2">
                <Label htmlFor="systemLanguage">Yönetici Dili *</Label>
                <Select
                  value={watch("systemLanguage")}
                  onValueChange={(value) => {
                    setValue("systemLanguage", value, { shouldDirty: true });
                  }}
                >
                  <SelectTrigger id="systemLanguage">
                    <SelectValue placeholder="Yönetici dili seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <img src={lang.flag_path} alt={lang.name} className="w-5 h-3.5" />
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Yasal Bilgiler (Read-Only) */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Bu bilgileri değiştirmek için Müşteri Temsilcisi ile iletişime geçin.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commercial_name">Yasal İsim</Label>
                  <Input
                    id="commercial_name"
                    value={commercialName}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">{taxLabel}</Label>
                  <Input
                    id="tax_id"
                    value={taxId}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <textarea
                    id="address"
                    value={address || ""}
                    disabled
                    className="w-full min-h-[100px] px-3 py-2 text-sm bg-muted rounded-md border border-input disabled:cursor-not-allowed disabled:opacity-50"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Ülke</Label>
                  <Input
                    id="country"
                    value={countryName || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
