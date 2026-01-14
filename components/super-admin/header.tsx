"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell } from "lucide-react";
import { useState, useEffect } from "react";

interface UserProfile {
  email: string;
  full_name?: string | null;
  role: string;
}

export function SuperAdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - can be used for breadcrumbs or title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Süper Admin Paneli
          </h1>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-3">
          {/* Notifications (optional) */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Bildirimler"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {/* Notification badge can be added here */}
          </button>

          {/* User info */}
          {!loading && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-full">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
