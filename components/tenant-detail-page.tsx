"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  updateTenantGeneralInfo,
  toggleTenantStatus,
  resetTenantPassword,
  updateTenantSettings,
} from "@/app/actions-tenant";
import { Tenant, Subscription, HardwareInventory, CatalogProduct } from "@/lib/types";
import { AlertCircle, Save, Lock, Mail, Package, ArrowLeft, Plus, Edit } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableLanguages, getTaxIdentifierLabel } from "@/app/actions/tenant-general-settings";
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
  createSubscription,
  updateSubscriptionById,
  createHardwareAssignment,
  getSubscriptionProducts,
  getHardwareProducts,
  getAvailableAssets,
  getProductAddons,
} from "@/app/actions/tenant-management";

interface TenantDetailPageProps {
  tenantId: number;
  data: {
    tenant: Tenant;
    subscriptions: Subscription[];
    hardware: HardwareInventory[];
  };
}

// Validation schemas
const generalInfoSchema = z.object({
  name: z.string().min(1, "İşletme adı gereklidir"),
  commercial_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email("Geçerli bir email adresi giriniz").optional().nullable(),
  contact_address: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  system_language_code: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
});

const subscriptionSchema = z.object({
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  contract_price: z.number().min(0).optional(),
  payment_status: z.enum(["paid", "pending", "overdue", "cancelled", "refunded"]).optional(),
});

const newSubscriptionSchema = z.object({
  product_id: z.number().min(1, "Ürün seçimi gereklidir"),
  contract_price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  contract_start_date: z.string().min(1, "Başlangıç tarihi gereklidir"),
  contract_end_date: z.string().optional().nullable(),
  renewal_period: z.enum(["monthly", "yearly"]).optional(),
});

const newHardwareSchema = z.object({
  product_id: z.number().min(1, "Ürün seçimi gereklidir"),
  serial_number: z.string().min(1, "Seri numarası gereklidir"),
  price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  addon_product_ids: z.array(z.number()).optional(),
});

const settingsSchema = z.object({
  slug: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  is_online: z.boolean(),
});

export function TenantDetailPage({ tenantId, data }: TenantDetailPageProps) {
  const router = useRouter();
  const { tenant, subscriptions, hardware } = data;
  const [isSuspended, setIsSuspended] = useState(tenant.status === "suspended");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [editSubscriptionModalOpen, setEditSubscriptionModalOpen] = useState(false);
  const [hardwareModalOpen, setHardwareModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Data states
  const [subscriptionProducts, setSubscriptionProducts] = useState<CatalogProduct[]>([]);
  const [hardwareProducts, setHardwareProducts] = useState<CatalogProduct[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [productAddons, setProductAddons] = useState<any[]>([]);
  const [availableCountries, setAvailableCountries] = useState<Array<{ code: string; name: string; flag_path: string }>>([]);
  const [taxLabel, setTaxLabel] = useState<string>("Vergi Numarası");

  // General Info Form
  const generalForm = useForm<z.infer<typeof generalInfoSchema>>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      name: tenant.name || "",
      commercial_name: tenant.commercial_name || "",
      contact_phone: tenant.contact_phone || "",
      contact_email: tenant.contact_email || "",
      contact_address: tenant.contact_address || "",
      address: (tenant as any).address || "",
      country_code: (tenant as any).country_code || "",
      system_language_code: (tenant as any).system_language_code || "",
      tax_id: (tenant as any).tax_id || "",
    },
  });

  const countryCode = generalForm.watch("country_code");
  const systemLanguageCode = generalForm.watch("system_language_code");

  // Load available countries on mount
  useEffect(() => {
    async function loadCountries() {
      const result = await getAvailableLanguages("tr");
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

  // New Subscription Form
  const newSubscriptionForm = useForm<z.infer<typeof newSubscriptionSchema>>({
    resolver: zodResolver(newSubscriptionSchema),
    defaultValues: {
      product_id: 0,
      contract_price: 0,
      contract_start_date: "",
      contract_end_date: "",
      renewal_period: "monthly",
    },
  });

  // Edit Subscription Form
  const editSubscriptionForm = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      contract_start_date: "",
      contract_end_date: "",
      contract_price: 0,
      payment_status: "pending",
    },
  });

  // New Hardware Form
  const newHardwareForm = useForm<z.infer<typeof newHardwareSchema>>({
    resolver: zodResolver(newHardwareSchema),
    defaultValues: {
      product_id: 0,
      serial_number: "",
      price: 0,
      addon_product_ids: [],
    },
  });

  // Settings Form
  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      slug: tenant.slug || "",
      is_online: tenant.is_online || false,
    },
  });

  const handleGeneralSubmit = async (values: z.infer<typeof generalInfoSchema>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value || "");
    });

    const result = await updateTenantGeneralInfo(tenant.id, formData);

    if (result.success) {
      setSuccess("Bilgiler başarıyla güncellendi");
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };


  const handleSettingsSubmit = async (values: z.infer<typeof settingsSchema>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("slug", values.slug);
    formData.append("is_online", values.is_online.toString());

    const result = await updateTenantSettings(tenant.id, formData);

    if (result.success) {
      setSuccess("Ayarlar başarıyla güncellendi");
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  const handleSuspend = async () => {
    setLoading(true);
    setError(null);
    const result = await toggleTenantStatus(tenant.id);
    if (result.success) {
      setIsSuspended(result.status === "suspended");
      setSuccess(result.status === "suspended" ? "Hesap donduruldu" : "Hesap aktifleştirildi");
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!tenant.contact_email) {
      setError("İşletme için email adresi bulunamadı");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await resetTenantPassword(tenant.contact_email);
    if (result.success) {
      setSuccess("Şifre sıfırlama maili gönderildi");
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Load subscription products on mount
  useEffect(() => {
    getSubscriptionProducts().then((result) => {
      if (result.success) {
        setSubscriptionProducts(result.data);
      }
    });
    getHardwareProducts().then((result) => {
      if (result.success) {
        setHardwareProducts(result.data);
      }
    });
  }, []);

  // Load available assets when product is selected
  const handleProductSelect = async (productId: number) => {
    const result = await getAvailableAssets(productId);
    if (result.success) {
      setAvailableAssets(result.data);
    }
    const addonsResult = await getProductAddons(productId);
    if (addonsResult.success) {
      setProductAddons(addonsResult.data);
    }
  };

  const handleCreateSubscription = async (values: z.infer<typeof newSubscriptionSchema>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("tenant_id", tenantId.toString());
    formData.append("product_id", values.product_id.toString());
    formData.append("contract_price", values.contract_price.toString());
    formData.append("contract_start_date", values.contract_start_date);
    if (values.contract_end_date) formData.append("contract_end_date", values.contract_end_date);
    if (values.renewal_period) formData.append("renewal_period", values.renewal_period);

    const result = await createSubscription(formData);

    if (result.success) {
      setSuccess("Abonelik başarıyla oluşturuldu");
      setSubscriptionModalOpen(false);
      newSubscriptionForm.reset();
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    editSubscriptionForm.reset({
      contract_start_date: formatDate(subscription.contract_start_date) || "",
      contract_end_date: formatDate(subscription.contract_end_date) || "",
      contract_price: subscription.contract_price || 0,
      payment_status: subscription.payment_status || "pending",
    });
    setEditSubscriptionModalOpen(true);
  };

  const handleUpdateSubscription = async (values: z.infer<typeof subscriptionSchema>) => {
    if (!selectedSubscription) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (values.contract_start_date) formData.append("contract_start_date", values.contract_start_date);
    if (values.contract_end_date) formData.append("contract_end_date", values.contract_end_date);
    if (values.contract_price !== undefined) formData.append("contract_price", values.contract_price.toString());
    if (values.payment_status) formData.append("payment_status", values.payment_status);

    const result = await updateSubscriptionById(selectedSubscription.id, formData);

    if (result.success) {
      setSuccess("Abonelik başarıyla güncellendi");
      setEditSubscriptionModalOpen(false);
      setSelectedSubscription(null);
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  const handleCreateHardware = async (values: z.infer<typeof newHardwareSchema>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("tenant_id", tenantId.toString());
    formData.append("product_id", values.product_id.toString());
    formData.append("serial_number", values.serial_number);
    formData.append("price", values.price.toString());
    if (values.addon_product_ids && values.addon_product_ids.length > 0) {
      formData.append("addon_product_ids", JSON.stringify(values.addon_product_ids));
    }

    const result = await createHardwareAssignment(formData);

    if (result.success) {
      setSuccess("Donanım başarıyla eklendi");
      setHardwareModalOpen(false);
      newHardwareForm.reset();
      router.refresh();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
            <p className="text-muted-foreground mt-1">İşletme Detayları ve Yönetimi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isSuspended ? "default" : "destructive"}
            onClick={handleSuspend}
            disabled={loading}
          >
            <Lock className="h-4 w-4 mr-2" />
            {isSuspended ? "Hesabı Aktifleştir" : "Hesabı Dondur"}
          </Button>
          {tenant.contact_email && (
            <Button variant="outline" onClick={handleResetPassword} disabled={loading}>
              <Mail className="h-4 w-4 mr-2" />
              Şifre Sıfırla
            </Button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-2 text-primary">
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="subscription">Abonelik</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="hardware">Donanım Listesi</TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Bilgiler</CardTitle>
              <CardDescription>İşletme iletişim ve temel bilgileri</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">İşletme Adı *</Label>
                    <Input
                      id="name"
                      {...generalForm.register("name")}
                      placeholder="İşletme Adı"
                    />
                    {generalForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commercial_name">Yasal İsim</Label>
                    <Input
                      id="commercial_name"
                      {...generalForm.register("commercial_name")}
                      placeholder="Yasal İsim"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Telefon</Label>
                    <Input
                      id="contact_phone"
                      {...generalForm.register("contact_phone")}
                      placeholder="+90 555 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      {...generalForm.register("contact_email")}
                      placeholder="ornek@email.com"
                    />
                    {generalForm.formState.errors.contact_email && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.contact_email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_address">İletişim Adresi</Label>
                  <Input
                    id="contact_address"
                    {...generalForm.register("contact_address")}
                    placeholder="İletişim Adresi"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <textarea
                    id="address"
                    {...generalForm.register("address")}
                    placeholder="Tam adres bilgisi"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country_code">Ülke</Label>
                  <Select
                    value={generalForm.watch("country_code") || ""}
                    onValueChange={(value) => {
                      generalForm.setValue("country_code", value || null, { shouldValidate: true });
                    }}
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
                    value={generalForm.watch("system_language_code") || ""}
                    onValueChange={(value) => {
                      generalForm.setValue("system_language_code", value || null, { shouldValidate: true });
                    }}
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
                    {...generalForm.register("tax_id")}
                    placeholder={taxLabel}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Subscription */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Abonelik Bilgileri</CardTitle>
                  <CardDescription>Paket, tarih ve ödeme bilgileri</CardDescription>
                </div>
                <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Abonelik Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Yeni Abonelik Ekle</DialogTitle>
                      <DialogDescription>
                        İşletme için yeni bir abonelik paketi oluşturun
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={newSubscriptionForm.handleSubmit(handleCreateSubscription)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_product_id">Ürün *</Label>
                        <select
                          id="new_product_id"
                          {...newSubscriptionForm.register("product_id", { valueAsNumber: true })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          onChange={(e) => {
                            const productId = parseInt(e.target.value);
                            newSubscriptionForm.setValue("product_id", productId);
                            const product = subscriptionProducts.find((p) => p.id === productId);
                            if (product) {
                              newSubscriptionForm.setValue("contract_price", product.base_price);
                            }
                          }}
                        >
                          <option value="0">Ürün Seçin</option>
                          {subscriptionProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.base_price} TL
                            </option>
                          ))}
                        </select>
                        {newSubscriptionForm.formState.errors.product_id && (
                          <p className="text-sm text-destructive">
                            {newSubscriptionForm.formState.errors.product_id.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new_contract_start_date">Başlangıç Tarihi *</Label>
                          <Input
                            id="new_contract_start_date"
                            type="date"
                            {...newSubscriptionForm.register("contract_start_date")}
                          />
                          {newSubscriptionForm.formState.errors.contract_start_date && (
                            <p className="text-sm text-destructive">
                              {newSubscriptionForm.formState.errors.contract_start_date.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_contract_end_date">Bitiş Tarihi</Label>
                          <Input
                            id="new_contract_end_date"
                            type="date"
                            {...newSubscriptionForm.register("contract_end_date")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_contract_price">Fiyat *</Label>
                          <Input
                            id="new_contract_price"
                            type="number"
                            step="0.01"
                            {...newSubscriptionForm.register("contract_price", { valueAsNumber: true })}
                          />
                          {newSubscriptionForm.formState.errors.contract_price && (
                            <p className="text-sm text-destructive">
                              {newSubscriptionForm.formState.errors.contract_price.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_renewal_period">Yenileme Periyodu</Label>
                          <select
                            id="new_renewal_period"
                            {...newSubscriptionForm.register("renewal_period")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="monthly">Aylık</option>
                            <option value="yearly">Yıllık</option>
                          </select>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSubscriptionModalOpen(false)}>
                          İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptions.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Başlangıç Tarihi</TableHead>
                          <TableHead>Bitiş Tarihi</TableHead>
                          <TableHead>Fiyat</TableHead>
                          <TableHead>Ödeme Durumu</TableHead>
                          <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>{formatDate(sub.contract_start_date) || "-"}</TableCell>
                            <TableCell>{formatDate(sub.contract_end_date) || "-"}</TableCell>
                            <TableCell>{sub.contract_price} TL</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sub.payment_status === "paid"
                                    ? "bg-primary/10 text-primary"
                                    : sub.payment_status === "overdue"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {sub.payment_status === "paid"
                                  ? "Ödendi"
                                  : sub.payment_status === "overdue"
                                  ? "Gecikmiş"
                                  : sub.payment_status === "pending"
                                  ? "Bekliyor"
                                  : sub.payment_status === "cancelled"
                                  ? "İptal"
                                  : "İade"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSubscription(sub)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Edit Subscription Modal */}
                  <Dialog open={editSubscriptionModalOpen} onOpenChange={setEditSubscriptionModalOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Abonelik Düzenle</DialogTitle>
                        <DialogDescription>
                          Abonelik bilgilerini güncelleyin
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={editSubscriptionForm.handleSubmit(handleUpdateSubscription)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit_contract_start_date">Başlangıç Tarihi</Label>
                            <Input
                              id="edit_contract_start_date"
                              type="date"
                              {...editSubscriptionForm.register("contract_start_date")}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit_contract_end_date">Bitiş Tarihi</Label>
                            <Input
                              id="edit_contract_end_date"
                              type="date"
                              {...editSubscriptionForm.register("contract_end_date")}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit_contract_price">Fiyat</Label>
                            <Input
                              id="edit_contract_price"
                              type="number"
                              step="0.01"
                              {...editSubscriptionForm.register("contract_price", { valueAsNumber: true })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit_payment_status">Ödeme Durumu</Label>
                            <select
                              id="edit_payment_status"
                              {...editSubscriptionForm.register("payment_status")}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="pending">Bekliyor</option>
                              <option value="paid">Ödendi</option>
                              <option value="overdue">Gecikmiş</option>
                              <option value="cancelled">İptal Edildi</option>
                              <option value="refunded">İade Edildi</option>
                            </select>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setEditSubscriptionModalOpen(false)}>
                            İptal
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Bu işletme için abonelik kaydı bulunamadı.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Ayarlar</CardTitle>
              <CardDescription>Sistem ve genel ayarlar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Subdomain *</Label>
                  <Input
                    id="slug"
                    {...settingsForm.register("slug")}
                    placeholder="ornek-subdomain"
                  />
                  {settingsForm.formState.errors.slug && (
                    <p className="text-sm text-destructive">{settingsForm.formState.errors.slug.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Örnek: tr, kotor gibi. Sadece küçük harf, rakam ve tire kullanılabilir.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_online">Online Sipariş</Label>
                    <p className="text-sm text-muted-foreground">Online sipariş alımını aktif/pasif yap</p>
                  </div>
                  <Switch
                    id="is_online"
                    checked={settingsForm.watch("is_online")}
                    onCheckedChange={(checked) => settingsForm.setValue("is_online", checked)}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Hardware List */}
        <TabsContent value="hardware">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Donanım Listesi</CardTitle>
                  <CardDescription>İşletmeye zimmetli cihazlar</CardDescription>
                </div>
                <Dialog open={hardwareModalOpen} onOpenChange={setHardwareModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Donanım Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Yeni Donanım Ekle</DialogTitle>
                      <DialogDescription>
                        İşletme için yeni bir donanım ataması yapın
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={newHardwareForm.handleSubmit(handleCreateHardware)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="hardware_product_id">Ürün *</Label>
                        <select
                          id="hardware_product_id"
                          {...newHardwareForm.register("product_id", { valueAsNumber: true })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          onChange={(e) => {
                            const productId = parseInt(e.target.value);
                            newHardwareForm.setValue("product_id", productId);
                            handleProductSelect(productId);
                            const product = hardwareProducts.find((p) => p.id === productId);
                            if (product) {
                              newHardwareForm.setValue("price", product.base_price);
                            }
                          }}
                        >
                          <option value="0">Ürün Seçin</option>
                          {hardwareProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.base_price} TL
                            </option>
                          ))}
                        </select>
                        {newHardwareForm.formState.errors.product_id && (
                          <p className="text-sm text-destructive">
                            {newHardwareForm.formState.errors.product_id.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hardware_serial_number">Seri Numarası *</Label>
                        <select
                          id="hardware_serial_number"
                          {...newHardwareForm.register("serial_number")}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Seri Numarası Seçin</option>
                          {availableAssets.map((asset) => (
                            <option key={asset.serial_number} value={asset.serial_number}>
                              {asset.serial_number} {asset.model ? `(${asset.model})` : ""}
                            </option>
                          ))}
                        </select>
                        {newHardwareForm.formState.errors.serial_number && (
                          <p className="text-sm text-destructive">
                            {newHardwareForm.formState.errors.serial_number.message}
                          </p>
                        )}
                        {availableAssets.length === 0 && newHardwareForm.watch("product_id") > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Bu ürün için müsait cihaz bulunamadı.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hardware_price">Fiyat *</Label>
                        <Input
                          id="hardware_price"
                          type="number"
                          step="0.01"
                          {...newHardwareForm.register("price", { valueAsNumber: true })}
                        />
                        {newHardwareForm.formState.errors.price && (
                          <p className="text-sm text-destructive">
                            {newHardwareForm.formState.errors.price.message}
                          </p>
                        )}
                      </div>

                      {productAddons.length > 0 && (
                        <div className="space-y-2">
                          <Label>Ek Parçalar</Label>
                          <div className="space-y-2 p-4 border rounded-md">
                            {productAddons.map((addon) => (
                              <div key={addon.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`addon-${addon.id}`}
                                  checked={newHardwareForm.watch("addon_product_ids")?.includes(addon.child_product_id) || false}
                                  onChange={(e) => {
                                    const currentIds = newHardwareForm.watch("addon_product_ids") || [];
                                    if (e.target.checked) {
                                      newHardwareForm.setValue("addon_product_ids", [...currentIds, addon.child_product_id]);
                                    } else {
                                      newHardwareForm.setValue(
                                        "addon_product_ids",
                                        currentIds.filter((id) => id !== addon.child_product_id)
                                      );
                                    }
                                  }}
                                  className="rounded border-input"
                                />
                                <Label htmlFor={`addon-${addon.id}`} className="text-sm font-normal cursor-pointer">
                                  {addon.child_product?.name || `Ürün ${addon.child_product_id}`}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setHardwareModalOpen(false)}>
                          İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {hardware.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seri Numarası</TableHead>
                        <TableHead>Cihaz Tipi</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Atama Tarihi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hardware.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.serial_number}</TableCell>
                          <TableCell>{item.device_type === "kiosk" ? "Kiosk" : "POS"}</TableCell>
                          <TableCell>{item.model || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.status === "rented"
                                  ? "bg-primary/10 text-primary"
                                  : item.status === "under_repair"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.status === "rented"
                                ? "Zimmetli"
                                : item.status === "under_repair"
                                ? "Tamirde"
                                : item.status === "broken"
                                ? "Arızalı"
                                : "Stokta"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.assignment_date
                              ? new Date(item.assignment_date).toLocaleDateString("tr-TR")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Bu işletme için donanım kaydı bulunamadı.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
