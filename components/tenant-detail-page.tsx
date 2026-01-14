"use client";

import { useState } from "react";
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
  updateTenantGeneralInfo,
  toggleTenantStatus,
  resetTenantPassword,
  updateSubscription,
  updateTenantSettings,
} from "@/app/actions-tenant";
import { Tenant, Subscription, HardwareInventory } from "@/lib/types";
import { AlertCircle, Save, Lock, Mail, Package } from "lucide-react";

interface TenantDetailPageProps {
  data: {
    tenant: Tenant;
    subscription: Subscription | null;
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
});

const subscriptionSchema = z.object({
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  contract_price: z.number().min(0).optional(),
  payment_status: z.enum(["paid", "pending", "overdue", "cancelled", "refunded"]).optional(),
});

const settingsSchema = z.object({
  slug: z.string().min(1, "Subdomain gereklidir").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  is_online: z.boolean(),
});

export function TenantDetailPage({ data }: TenantDetailPageProps) {
  const router = useRouter();
  const { tenant, subscription, hardware } = data;
  const [isSuspended, setIsSuspended] = useState(tenant.status === "suspended");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // General Info Form
  const generalForm = useForm<z.infer<typeof generalInfoSchema>>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      name: tenant.name || "",
      commercial_name: tenant.commercial_name || "",
      contact_phone: tenant.contact_phone || "",
      contact_email: tenant.contact_email || "",
      contact_address: tenant.contact_address || "",
    },
  });

  // Subscription Form
  const subscriptionForm = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      contract_start_date: subscription?.contract_start_date || "",
      contract_end_date: subscription?.contract_end_date || "",
      contract_price: subscription?.contract_price || 0,
      payment_status: subscription?.payment_status || "pending",
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

  const handleSubscriptionSubmit = async (values: z.infer<typeof subscriptionSchema>) => {
    if (!subscription) {
      setError("Abonelik bulunamadı");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (values.contract_start_date) formData.append("contract_start_date", values.contract_start_date);
    if (values.contract_end_date) formData.append("contract_end_date", values.contract_end_date);
    if (values.contract_price !== undefined) formData.append("contract_price", values.contract_price.toString());
    if (values.payment_status) formData.append("payment_status", values.payment_status);

    const result = await updateSubscription(subscription.id, formData);

    if (result.success) {
      setSuccess("Abonelik bilgileri başarıyla güncellendi");
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-600 mt-1">İşletme Detayları ve Yönetimi</p>
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
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
                      <p className="text-sm text-red-600">{generalForm.formState.errors.name.message}</p>
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
                      <p className="text-sm text-red-600">{generalForm.formState.errors.contact_email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_address">Adres</Label>
                  <Input
                    id="contact_address"
                    {...generalForm.register("contact_address")}
                    placeholder="Tam Adres"
                  />
                </div>

                <Button type="submit" disabled={loading} className="bg-[#05594C] hover:bg-[#044a3f]">
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
              <CardTitle>Abonelik Bilgileri</CardTitle>
              <CardDescription>Paket, tarih ve ödeme bilgileri</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <form onSubmit={subscriptionForm.handleSubmit(handleSubscriptionSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contract_start_date">Başlangıç Tarihi</Label>
                      <Input
                        id="contract_start_date"
                        type="date"
                        {...subscriptionForm.register("contract_start_date")}
                        defaultValue={formatDate(subscription.contract_start_date)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contract_end_date">Bitiş Tarihi</Label>
                      <Input
                        id="contract_end_date"
                        type="date"
                        {...subscriptionForm.register("contract_end_date")}
                        defaultValue={formatDate(subscription.contract_end_date)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contract_price">Paket Fiyatı</Label>
                      <Input
                        id="contract_price"
                        type="number"
                        step="0.01"
                        {...subscriptionForm.register("contract_price", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_status">Ödeme Durumu</Label>
                      <select
                        id="payment_status"
                        {...subscriptionForm.register("payment_status")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="pending">Bekliyor</option>
                        <option value="paid">Ödendi</option>
                        <option value="overdue">Gecikmiş</option>
                        <option value="cancelled">İptal Edildi</option>
                        <option value="refunded">İade Edildi</option>
                      </select>
                    </div>
                  </div>

                  {/* Hardware Info Display */}
                  {subscription.hardware_list && (
                    <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-md">
                      <Label>Mevcut Donanım</Label>
                      <div className="text-sm text-gray-600">
                        {Array.isArray(subscription.hardware_list) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {subscription.hardware_list.map((item: any, index: number) => (
                              <li key={index}>
                                {item.serial_number || item.type || `Cihaz ${index + 1}`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Donanım bilgisi bulunamadı</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="bg-[#05594C] hover:bg-[#044a3f]">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-500">
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
                    <p className="text-sm text-red-600">{settingsForm.formState.errors.slug.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Örnek: tr, kotor gibi. Sadece küçük harf, rakam ve tire kullanılabilir.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_online">Online Sipariş</Label>
                    <p className="text-sm text-gray-500">Online sipariş alımını aktif/pasif yap</p>
                  </div>
                  <Switch
                    id="is_online"
                    checked={settingsForm.watch("is_online")}
                    onCheckedChange={(checked) => settingsForm.setValue("is_online", checked)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="bg-[#05594C] hover:bg-[#044a3f]">
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
              <CardTitle>Donanım Listesi</CardTitle>
              <CardDescription>İşletmeye zimmetli cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              {hardware.length > 0 ? (
                <div className="space-y-4">
                  {hardware.map((item) => (
                    <div key={item.id} className="p-4 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.serial_number}</p>
                          <p className="text-sm text-gray-500">
                            {item.device_type === "kiosk" ? "Kiosk" : "POS"} - {item.status}
                          </p>
                        </div>
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
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
