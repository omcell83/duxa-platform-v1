"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { updateUserTheme, getUserTheme } from "@/app/actions/user-settings";
import { createClient } from "@/lib/supabase-browser";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Hydration kontrolü - Server/Client uyuşmazlığını önler
  useEffect(() => {
    setMounted(true);
  }, []);

  // Kullanıcı giriş yaptığında veritabanından tema tercihini yükle
  useEffect(() => {
    async function syncThemeFromDB() {
      if (!mounted) return;

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Sadece giriş yapmış kullanıcılar için tema senkronizasyonu yap
        if (session?.user) {
          const dbTheme = await getUserTheme();
          if (dbTheme && dbTheme !== theme) {
            setTheme(dbTheme);
          }
        }
      } catch (error) {
        console.error("Error syncing theme from DB:", error);
      }
    }

    syncThemeFromDB();
  }, [mounted, theme, setTheme]);

  // Tema değiştiğinde veritabanına kaydet
  const handleThemeChange = async (newTheme: string) => {
    setIsUpdating(true);
    try {
      // Önce yerel görünümü değiştir
      setTheme(newTheme);

      // Sonra veritabanına kaydet
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Sadece giriş yapmış kullanıcılar için veritabanına kaydet
      if (session?.user) {
        await updateUserTheme(newTheme);
      }
    } catch (error) {
      console.error("Error updating theme:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Hydration tamamlanana kadar loading göster
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        disabled
        aria-label="Tema değiştir"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  // Aktif tema gösterimi
  const currentTheme = resolvedTheme || theme || "system";

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Button
        variant={currentTheme === "light" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleThemeChange("light")}
        disabled={isUpdating}
        className="h-8 w-8 p-0"
        aria-label="Açık tema"
        title="Açık tema"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTheme === "dark" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleThemeChange("dark")}
        disabled={isUpdating}
        className="h-8 w-8 p-0"
        aria-label="Koyu tema"
        title="Koyu tema"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTheme === "system" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleThemeChange("system")}
        disabled={isUpdating}
        className="h-8 w-8 p-0"
        aria-label="Sistem teması"
        title="Sistem teması"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}
