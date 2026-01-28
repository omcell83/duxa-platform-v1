"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUserTheme } from "@/app/actions/user-settings";
import { useTheme } from "next-themes";
import Link from "next/link";
import { logLoginFailure, logLoginSuccess, logLoginBlocked } from "@/app/actions/logging";
import { incrementFailedAttempts, resetFailedAttempts } from "@/app/actions/user-management";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in URL params
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Bu sayfaya erişim yetkiniz yok.");
    } else if (errorParam === "account_inactive") {
      setError("Hesabınız aktif değil. Lütfen sistem yöneticisi ile iletişime geçin.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check if it's a ban error
        const isBanned = signInError.message?.toLowerCase().includes("banned") ||
          signInError.message?.toLowerCase().includes("blocked");

        // Track failed attempt
        const lockResult = await incrementFailedAttempts(email);

        // Log failure (non-blocking)
        try {
          if (isBanned || lockResult.isLocked) {
            await logLoginBlocked(email);
          } else {
            await logLoginFailure(email);
          }
        } catch (logErr) {
          console.error("Logging failed:", logErr);
        }

        if (isBanned || lockResult.isLocked) {
          setError("Hesabınız aktif değil. Lütfen sistem yöneticisi ile iletişime geçin.");
        } else {
          setError(signInError.message || "Giriş başarısız. Email ve şifrenizi kontrol edin.");
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        await incrementFailedAttempts(email);
        try {
          await logLoginFailure(email);
        } catch (logErr) {
          console.error("Logging failed:", logErr);
        }
        setError("Kullanıcı bulunamadı.");
        setLoading(false);
        return;
      }

      // Successful login - Reset attempts
      await resetFailedAttempts(data.user.id);

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active, tenant_id")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        try {
          await logLoginFailure(email);
        } catch (logErr) {
          console.error("Logging failed:", logErr);
        }
        setError("Kullanıcı profili bulunamadı.");
        setLoading(false);
        return;
      }

      if (!profile.is_active) {
        // Log blocked attempt (Using Server Action for better user_id tracking)
        try {
          await logLoginBlocked(email, data.user.id, profile.tenant_id);
        } catch (logErr) {
          console.error("Logging failed:", logErr);
        }

        setError("Hesabınız aktif değil. Lütfen sistem yöneticisi ile iletişime geçin.");
        setLoading(false);
        return;
      }

      // Log success (Using API instead of Server Action to avoid Auth/Cookie conflicts)
      const logResponse = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "LOGIN_SUCCESS",
          severity: "SUCCESS",
          message: `Başarılı giriş: ${profile.role}`,
          user_id: data.user.id,
          tenant_id: profile.tenant_id,
          metadata: { role: profile.role }
        }),
      });

      const logResult = await logResponse.json();

      if (!logResult.success) {
        console.error("Login log failed:", logResult.error);
        setError(`Sistem logu kaydedilemedi! İlerleyemezsiniz. Hata: ${logResult.error}`);
        setLoading(false);
        return;
      }

      console.log("Log saved successfully via API, proceeding...");

      // Cookie'lerin set edilmesi için session'ı kontrol et
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError("Oturum oluşturulamadı. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      // Cookie'lerin set edilmesi için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 300));

      // Kullanıcının tema tercihini yükle ve uygula
      try {
        const dbTheme = await getUserTheme();
        if (dbTheme) {
          setTheme(dbTheme);
        }
      } catch (themeError) {
        console.error("Error loading user theme:", themeError);
      }

      // Redirect path'i belirle
      const redirectPath = searchParams.get("redirect") || "";
      let targetPath = "";

      if (redirectPath && redirectPath.startsWith("/")) {
        targetPath = redirectPath;
      } else {
        const normalizedRole = (profile.role || "").trim().toLowerCase();
        if (normalizedRole === "super_admin") {
          targetPath = "/super-admin/dashboard";
        } else {
          targetPath = "/dashboard";
        }
      }

      window.location.replace(targetPath);
    } catch (err: any) {
      console.error("Login exception:", err);
      // Attempt to log the crash too
      logLoginFailure(email).catch(() => { });
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-lg">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Duxa Platform</CardTitle>
          <CardDescription>Hesabınıza giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Link
                  href="/login/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Şifremi Unuttum
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-lg">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Duxa Platform</CardTitle>
            <CardDescription>Yükleniyor...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
