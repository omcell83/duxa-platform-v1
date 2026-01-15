"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface UserProfile {
  email: string;
  full_name?: string | null;
  role: string;
}

export function DashboardHeader() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, role")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        setLoggingOut(false);
        return;
      }

      // Wait a bit for cookies to clear
      await new Promise(resolve => setTimeout(resolve, 200));

      // Redirect to login page with full page reload
      // This ensures middleware sees the cleared session
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - can be used for breadcrumbs or title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            Yönetici Paneli
          </h1>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications (optional) */}
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors relative"
            aria-label="Bildirimler"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {/* Notification badge can be added here */}
          </button>

          {/* User info */}
          {!loading && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-muted rounded-full">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name || "Kullanıcı"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{loggingOut ? "Çıkış yapılıyor..." : "Çıkış"}</span>
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
