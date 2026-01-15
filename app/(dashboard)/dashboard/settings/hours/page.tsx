"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusinessHours } from "@/app/actions/tenant-settings";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const days = [
  { key: "monday" as const, label: "Pazartesi" },
  { key: "tuesday" as const, label: "Salı" },
  { key: "wednesday" as const, label: "Çarşamba" },
  { key: "thursday" as const, label: "Perşembe" },
  { key: "friday" as const, label: "Cuma" },
  { key: "saturday" as const, label: "Cumartesi" },
  { key: "sunday" as const, label: "Pazar" },
];

const defaultHours: BusinessHours = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
  saturday: { isOpen: true, openTime: "10:00", closeTime: "23:00" },
  sunday: { isOpen: false, openTime: "10:00", closeTime: "22:00" },
};

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours>(defaultHours);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBusinessHours() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        // Get tenant_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", session.user.id)
          .single();

        if (!profile?.tenant_id) {
          setLoading(false);
          return;
        }

        // Get tenant settings
        const { data: tenant } = await supabase
          .from("tenants")
          .select("settings")
          .eq("id", profile.tenant_id)
          .single();

        if (tenant?.settings) {
          const settings = typeof tenant.settings === "string"
            ? JSON.parse(tenant.settings)
            : tenant.settings;

          if (settings.business_hours) {
            // Merge with defaults to ensure all days are present
            setHours({
              ...defaultHours,
              ...settings.business_hours,
            });
          }
        }
      } catch (error) {
        console.error("Error loading business hours:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBusinessHours();
  }, []);

  const handleDayToggle = (day: keyof BusinessHours) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
      },
    }));
  };

  const handleTimeChange = (
    day: keyof BusinessHours,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();

      // Add all days to form data
      for (const day of days) {
        const dayHours = hours[day.key];
        formData.append(`${day.key}.isOpen`, dayHours.isOpen.toString());
        if (dayHours.isOpen) {
          formData.append(`${day.key}.openTime`, dayHours.openTime);
          formData.append(`${day.key}.closeTime`, dayHours.closeTime);
        }
      }

      const result = await updateBusinessHours(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Çalışma saatleri başarıyla güncellendi");
      }
    } catch (error) {
      console.error("Error saving business hours:", error);
      toast.error("Çalışma saatleri kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            Yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Çalışma Saatleri
            </h1>
            <p className="text-muted-foreground mt-2">
              İşletmenizin haftalık çalışma saatlerini ayarlayın
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>

        {/* Days List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Haftalık Çalışma Saatleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {days.map((day) => {
                const dayHours = hours[day.key];

                return (
                  <div
                    key={day.key}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label
                          htmlFor={`${day.key}-toggle`}
                          className="font-medium text-foreground cursor-pointer"
                        >
                          {day.label}
                        </Label>
                      </div>

                      <Switch
                        id={`${day.key}-toggle`}
                        checked={dayHours.isOpen}
                        onCheckedChange={() => handleDayToggle(day.key)}
                      />

                      {dayHours.isOpen && (
                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`${day.key}-open`}
                              className="text-sm text-muted-foreground"
                            >
                              Açılış:
                            </Label>
                            <Input
                              id={`${day.key}-open`}
                              type="time"
                              value={dayHours.openTime}
                              onChange={(e) =>
                                handleTimeChange(day.key, "openTime", e.target.value)
                              }
                              className="w-32"
                            />
                          </div>

                          <span className="text-muted-foreground">-</span>

                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`${day.key}-close`}
                              className="text-sm text-muted-foreground"
                            >
                              Kapanış:
                            </Label>
                            <Input
                              id={`${day.key}-close`}
                              type="time"
                              value={dayHours.closeTime}
                              onChange={(e) =>
                                handleTimeChange(day.key, "closeTime", e.target.value)
                              }
                              className="w-32"
                            />
                          </div>
                        </div>
                      )}

                      {!dayHours.isOpen && (
                        <span className="text-sm text-muted-foreground ml-4">
                          Kapalı
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Çalışma saatleri müşterilerinize kiosk ekranında gösterilecektir. 
              Kapalı günlerde sipariş alınmayacaktır.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
