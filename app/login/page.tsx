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
import { logSystemEvent } from "@/app/actions/system-logs";

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
      // Log unauthorized access redirect
      logSystemEvent({
        event_type: 'unauthorized_access',
        severity: 'warning',
        message: 'Unauthorized access attempt redirect',
        details: { redirect: searchParams.get('redirect') }
      }).catch(e => console.error('Failed to log unauthorized access', e));
    } else if (errorParam === "account_inactive") {
      setError("Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.");
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
        setError(signInError.message || "Giriş başarısız. Email ve şifrenizi kontrol edin.");

        // Log failed login (Only email as requested)
        console.group("DEBUG: Failed Login Log Attempt");
        const logResult = await logSystemEvent({
          event_type: 'login_failed',
          severity: 'warning',
          message: `Giriş başarısız: ${signInError.message}`,
          details: { email } // Only email for failed attempts
        });
        console.log("Log Result:", logResult);
        console.groupEnd();

        if (!logResult || !logResult.success) {
          setError(`Sistem günlüğü hatası: ${logResult?.error || 'Sunucu hatası'}`);
        }

        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Kullanıcı bulunamadı.");
        setLoading(false);
        return;
      }

      // Get user profile to determine role and tenant
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active, tenant_id")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        setError("Kullanıcı profili bulunamadı.");
        setLoading(false);
        return;
      }

      if (!profile.is_active) {
        setError("Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.");
        setLoading(false);
        return;
      }

      // Log successful login (MANDATORY)
      console.group("DEBUG: Success Login Log Attempt");
      const logResult = await logSystemEvent({
        event_type: 'login',
        severity: 'info',
        message: 'Giriş başarılı',
        user_id: data.user.id,
        // Requirement: if tenant_id is missing, use user role
        tenant_id: profile.tenant_id || profile.role,
        details: { role: profile.role, email: email }
      });
      console.log("Log Result:", logResult);
      console.groupEnd();

      if (!logResult || !logResult.success) {
        console.error("Login aborted due to logging failure:", logResult);
        setError(`Sistem güvenlik günlüğü hatası: ${logResult?.error || 'Log yazılamadı'}`);
        setLoading(false);
        await supabase.auth.signOut();
        return;
      }

      // Cookie'lerin set edilmesi için session'ı kontrol et
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("Session not found after login!");
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
        // Tema yükleme hatası kritik değil, devam et
      }

      // SONRA: Redirect path'i belirle
      const redirectPath = searchParams.get("redirect") || "";
      let targetPath = "";

      if (redirectPath && redirectPath.startsWith("/")) {
        // URL parametresinden gelen redirect değerini kullan
        targetPath = redirectPath;
      } else {
        // Role göre varsayılan dashboard'a yönlendir
        // Role string'ini trim ve lowercase yap (güvenlik için)
        const normalizedRole = (profile.role || "").trim().toLowerCase();

        if (normalizedRole === "super_admin") {
          targetPath = "/super-admin/dashboard";
        } else if (normalizedRole === "tenant_admin" || normalizedRole === "user") {
          targetPath = "/dashboard";
        } else {
          targetPath = "/dashboard";
        }
      }

      console.log("Redirecting to:", targetPath);

      // window.location.replace kullan - full page reload yapar ve middleware'in cookie'leri görmesini sağlar
      // replace kullanıyoruz ki geri tuşu ile login sayfasına dönmesin
      window.location.replace(targetPath);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme Toggle - Top Right */}
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
