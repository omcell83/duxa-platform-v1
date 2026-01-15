"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { CheckCircle2, XCircle, AlertTriangle, Upload, Save, Instagram, Facebook, Twitter, ExternalLink, MapPin } from "lucide-react";
import {
  getGeneralSettings,
  updateGeneralSettings,
  checkSubdomainAvailability,
  getAvailableLanguages,
} from "@/app/actions/tenant-general-settings";
import { uploadProductImage } from "@/lib/image-upload";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  businessName: z.string().min(1, "İşletme adı gereklidir"),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]),
  systemLanguage: z.string().min(1, "Yönetici dili gereklidir"),
  subdomain: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire (-) kullanılabilir"),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tripadvisor: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  onlineMenuEnabled: z.boolean(),
  seoIndexingEnabled: z.boolean(),
  menuLanguages: z.array(z.string()),
  logoUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [subdomainSuggestion, setSubdomainSuggestion] = useState<string>("");
  const [showSubdomainWarning, setShowSubdomainWarning] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ code: string; name: string; flag_path: string }>>([]);
  const [currentSystemLanguage, setCurrentSystemLanguage] = useState("tr");
  const [loadError, setLoadError] = useState<string | null>(null);

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
      subdomain: "",
      instagram: "",
      facebook: "",
      twitter: "",
      tripadvisor: "",
      website: "",
      address: "",
      onlineMenuEnabled: false,
      seoIndexingEnabled: false,
      menuLanguages: [],
      logoUrl: "",
    },
  });

  const watchedSubdomain = watch("subdomain");
  const watchedSystemLanguage = watch("systemLanguage");
  const debouncedSubdomain = useDebounce(watchedSubdomain, 500);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [settingsResult, languagesResult] = await Promise.all([
          getGeneralSettings(),
          getAvailableLanguages("tr"),
        ]);

        if (!settingsResult.success) {
          const errorMessage = settingsResult.error || "Ayarlar yüklenemedi";
          setLoadError(errorMessage);
          toast.error(errorMessage);
          if (errorMessage.includes("tenant_admin")) {
            // Redirect after a short delay to show the error message
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
          setLoading(false);
          return;
        }

        setLoadError(null);

        const settings = settingsResult.data!;
        setOriginalSubdomain(settings.subdomain);
        setCurrentSystemLanguage(settings.systemLanguage);

        // Set form values
        setValue("businessName", settings.businessName);
        setValue("currency", settings.currency as "TRY" | "USD" | "EUR" | "GBP");
        setValue("systemLanguage", settings.systemLanguage);
        setValue("subdomain", settings.subdomain);
        setValue("logoUrl", settings.logoUrl || "");
        setValue("instagram", settings.instagram || "");
        setValue("facebook", settings.facebook || "");
        setValue("twitter", settings.twitter || "");
        setValue("tripadvisor", settings.tripadvisor || "");
        setValue("website", settings.website || "");
        setValue("address", settings.address || "");
        if (settings.latitude) setValue("latitude", settings.latitude);
        if (settings.longitude) setValue("longitude", settings.longitude);
        setValue("onlineMenuEnabled", settings.onlineMenuEnabled);
        setValue("seoIndexingEnabled", settings.seoIndexingEnabled);
        setValue("menuLanguages", settings.menuLanguages || []);

        // Load languages with current system language
        if (languagesResult.success) {
          setAvailableLanguages(languagesResult.data || []);
        } else {
          // If initial languages load fails, still try to load with system language
          console.warn("Initial languages load failed:", languagesResult.error);
        }

        // Reload languages with selected system language
        const updatedLanguagesResult = await getAvailableLanguages(settings.systemLanguage);
        if (updatedLanguagesResult.success) {
          setAvailableLanguages(updatedLanguagesResult.data || []);
        } else {
          // If system language languages load fails, keep the initial ones if they were loaded
          console.warn("System language languages load failed:", updatedLanguagesResult.error);
        }

        // Mark loading as complete
        setLoading(false);
      } catch (error) {
        console.error("Error loading settings:", error);
        const errorMessage = "Ayarlar yüklenirken bir hata oluştu";
        setLoadError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    }

    loadData();
  }, [setValue, router]);

  // Update languages when system language changes (but not on initial load)
  useEffect(() => {
    async function updateLanguages() {
      if (!watchedSystemLanguage || loading) return;
      
      // Only update if system language actually changed (not initial load)
      if (watchedSystemLanguage === currentSystemLanguage) return;

      const result = await getAvailableLanguages(watchedSystemLanguage);
      if (result.success) {
        setAvailableLanguages(result.data || []);
        setCurrentSystemLanguage(watchedSystemLanguage);
      }
    }

    updateLanguages();
  }, [watchedSystemLanguage, currentSystemLanguage, loading]);

  // Check subdomain availability
  useEffect(() => {
    async function checkSubdomain() {
      if (!debouncedSubdomain || debouncedSubdomain.trim().length === 0) {
        setSubdomainStatus("idle");
        setSubdomainSuggestion("");
        return;
      }

      // Validate format
      if (!/^[a-z0-9-]+$/.test(debouncedSubdomain)) {
        setSubdomainStatus("taken");
        return;
      }

      setSubdomainStatus("checking");

      try {
        // Get current tenant ID (we'll need this from the session)
        const supabase = await import("@/lib/supabase-browser").then((m) => m.createClient());
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", session.user.id)
          .single();

        if (!profile?.tenant_id) return;

        const result = await checkSubdomainAvailability(
          debouncedSubdomain,
          profile.tenant_id
        );

        if (result.available) {
          setSubdomainStatus("available");
          setSubdomainSuggestion("");
        } else {
          setSubdomainStatus("taken");
          setSubdomainSuggestion(result.suggestion || "");
        }

        // Show warning if subdomain changed
        if (debouncedSubdomain !== originalSubdomain && debouncedSubdomain.trim().length > 0) {
          setShowSubdomainWarning(true);
        } else {
          setShowSubdomainWarning(false);
        }
      } catch (error) {
        console.error("Error checking subdomain:", error);
        setSubdomainStatus("idle");
      }
    }

    checkSubdomain();
  }, [debouncedSubdomain, originalSubdomain]);

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
    // Validate subdomain if changed
    if (data.subdomain !== originalSubdomain && subdomainStatus !== "available") {
      toast.error("Lütfen geçerli bir subdomain seçin");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "boolean") {
            formData.append(key, value.toString());
          } else if (typeof value === "number") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });

      const result = await updateGeneralSettings(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Ayarlar başarıyla güncellendi");
        setOriginalSubdomain(data.subdomain);
        setShowSubdomainWarning(false);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const toggleMenuLanguage = (langCode: string) => {
    const current = watch("menuLanguages") || [];
    if (current.includes(langCode)) {
      setValue("menuLanguages", current.filter((l) => l !== langCode), { shouldDirty: true });
    } else {
      setValue("menuLanguages", [...current, langCode], { shouldDirty: true });
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

  // Show error state if settings failed to load
  if (!loading && loadError) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Genel Ayarlar</h1>
            <p className="text-muted-foreground mt-2">
              İşletme kimliği, iletişim bilgileri ve menü ayarlarını yönetin
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
            <h1 className="text-3xl font-bold text-foreground">Genel Ayarlar</h1>
            <p className="text-muted-foreground mt-2">
              İşletme kimliği, iletişim bilgileri ve menü ayarlarını yönetin
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
          {/* BÖLÜM 1: İşletme Kimliği */}
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
                  <SelectContent>
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
            </CardContent>
          </Card>

          {/* BÖLÜM 2: Menü Internet Adresi */}
          <Card>
            <CardHeader>
              <CardTitle>Menü Internet Adresi</CardTitle>
              <CardDescription>Online menünüzün adresi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Alt Domain (Subdomain)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">https://</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="subdomain"
                      {...register("subdomain")}
                      placeholder="muradsteakhouse"
                      className={
                        subdomainStatus === "available"
                          ? "border-green-500 focus-visible:ring-green-500"
                          : subdomainStatus === "taken"
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setValue("subdomain", value, { shouldDirty: true });
                      }}
                    />
                    {subdomainStatus === "checking" && (
                      <p className="text-sm text-muted-foreground">Kontrol ediliyor...</p>
                    )}
                    {subdomainStatus === "available" && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Bu adres kullanılabilir</span>
                      </div>
                    )}
                    {subdomainStatus === "taken" && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>
                          Bu adres dolu.
                          {subdomainSuggestion && ` Öneri: ${subdomainSuggestion}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">.duxa.pro</span>
                </div>
                {errors.subdomain && (
                  <p className="text-sm text-destructive">{errors.subdomain.message}</p>
                )}
              </div>

              {showSubdomainWarning && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Adresi değiştirmek mevcut QR kodlarınızı geçersiz kılar!
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Yeni QR kodları oluşturmanız gerekecektir.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BÖLÜM 3: Sosyal Medya & İletişim */}
          <Card>
            <CardHeader>
              <CardTitle>Sosyal Medya & İletişim</CardTitle>
              <CardDescription>İşletmenizin sosyal medya hesapları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">instagram.com/</span>
                  <Input
                    id="instagram"
                    {...register("instagram")}
                    placeholder="kullaniciadi"
                    className="flex-1"
                    onChange={(e) => setValue("instagram", e.target.value, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  {...register("facebook")}
                  placeholder="https://facebook.com/sayfaadi"
                  onChange={(e) => setValue("facebook", e.target.value, { shouldDirty: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter/X
                </Label>
                <Input
                  id="twitter"
                  {...register("twitter")}
                  placeholder="https://x.com/kullaniciadi"
                  onChange={(e) => setValue("twitter", e.target.value, { shouldDirty: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripadvisor">TripAdvisor</Label>
                <Input
                  id="tripadvisor"
                  {...register("tripadvisor")}
                  placeholder="https://tripadvisor.com/restoran"
                  onChange={(e) => setValue("tripadvisor", e.target.value, { shouldDirty: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Website (Harici)
                </Label>
                <Input
                  id="website"
                  type="url"
                  {...register("website")}
                  placeholder="https://example.com"
                  onChange={(e) => setValue("website", e.target.value, { shouldDirty: true })}
                />
              </div>
            </CardContent>
          </Card>

          {/* BÖLÜM 4: Adres & Harita */}
          <Card>
            <CardHeader>
              <CardTitle>Adres & Harita</CardTitle>
              <CardDescription>İşletme konumu ve adres bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Açık Adres</Label>
                <textarea
                  id="address"
                  {...register("address")}
                  placeholder="Tam adres bilgisi"
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => setValue("address", e.target.value, { shouldDirty: true })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Enlem (Latitude)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...register("latitude", { valueAsNumber: true })}
                    placeholder="40.7128"
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setValue("latitude", value, { shouldDirty: true });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Boylam (Longitude)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...register("longitude", { valueAsNumber: true })}
                    placeholder="-74.0060"
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setValue("longitude", value, { shouldDirty: true });
                    }}
                  />
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Konumu Haritada İşaretle (Yakında)
              </Button>
            </CardContent>
          </Card>

          {/* BÖLÜM 5: Online Menü ve SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Online Menü ve SEO</CardTitle>
              <CardDescription>Menü görünürlüğü ve arama motoru ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="onlineMenuEnabled">Online Menü</Label>
                  <p className="text-sm text-muted-foreground">
                    Online menünüzün müşteriler tarafından görüntülenebilmesini sağlar
                  </p>
                </div>
                <Switch
                  id="onlineMenuEnabled"
                  checked={watch("onlineMenuEnabled")}
                  onCheckedChange={(checked) => setValue("onlineMenuEnabled", checked, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="seoIndexingEnabled">SEO İndeksleme</Label>
                  <p className="text-sm text-muted-foreground">
                    Arama motorlarının menünüzü indekslemesine izin verir
                  </p>
                </div>
                <Switch
                  id="seoIndexingEnabled"
                  checked={watch("seoIndexingEnabled")}
                  onCheckedChange={(checked) => setValue("seoIndexingEnabled", checked, { shouldDirty: true })}
                />
              </div>

              <div className="space-y-3">
                <Label>Menü Dilleri</Label>
                <p className="text-sm text-muted-foreground">
                  Menünüzün gösterileceği diller (Yönetici diline göre isimlendirilmiştir)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableLanguages.map((lang) => {
                    const isSelected = (watch("menuLanguages") || []).includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleMenuLanguage(lang.code)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img src={lang.flag_path} alt={lang.name} className="w-6 h-4" />
                        <span className="text-sm font-medium">{lang.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
