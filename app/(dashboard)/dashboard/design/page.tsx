"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTenantTheme } from "@/app/actions/tenant-settings";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  {
    id: "theme-1",
    name: "Klasik",
    description: "Geleneksel ve sade tasarım",
    color: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
  },
  {
    id: "theme-2",
    name: "Modern",
    description: "Çağdaş ve şık görünüm",
    color: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
  },
  {
    id: "theme-3",
    name: "Canlı",
    description: "Enerjik ve renkli tasarım",
    color: "bg-gradient-to-br from-pink-50 to-purple-100 dark:from-pink-950 dark:to-purple-900",
  },
  {
    id: "theme-4",
    name: "Minimal",
    description: "Sade ve minimal görünüm",
    color: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900",
  },
];

export default function DesignPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCurrentTheme() {
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

          if (settings.theme_id) {
            setSelectedTheme(settings.theme_id);
          }
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentTheme();
  }, []);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleSave = async () => {
    if (!selectedTheme) {
      toast.error("Lütfen bir tema seçin");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("themeId", selectedTheme);

      const result = await updateTenantTheme(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tema başarıyla güncellendi");
      }
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Tema kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            Yükleniyor...
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">Tema Seçimi</h1>
            <p className="text-muted-foreground mt-2">
              Menünüz için bir tema seçin. Seçtiğiniz tema kiosk ekranında görünecektir.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedTheme}
            className="gap-2"
          >
            {saving ? "Kaydediliyor..." : "Temayı Uygula"}
          </Button>
        </div>

        {/* Theme Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {themes.map((theme) => {
            const isSelected = selectedTheme === theme.id;

            return (
              <Card
                key={theme.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <CardContent className="p-6">
                  {/* Theme Preview */}
                  <div
                    className={cn(
                      "h-48 rounded-lg mb-4 flex items-center justify-center",
                      theme.color
                    )}
                  >
                    <Palette className="h-12 w-12 text-muted-foreground opacity-50" />
                  </div>

                  {/* Theme Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        {theme.name}
                      </h3>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        {selectedTheme && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">
                  {themes.find((t) => t.id === selectedTheme)?.name}
                </strong>{" "}
                teması seçildi. Değişiklikleri kaydetmek için "Temayı Uygula" butonuna tıklayın.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
