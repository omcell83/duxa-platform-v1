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
      setError("Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Import logging actions dynamically to avoid bundling issues if any, 
    // though static import is fine for server actions.
    const { logLoginFailure, logLoginSuccess } = await import("@/app/actions/logging");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        await logLoginFailure(email);
        setError(signInError.message || "Giriş başarısız. Email ve şifrenizi kontrol edin.");
        setLoading(false);
        return;
      }

      if (!data.user) {
        await logLoginFailure(email);
        setError("Kullanıcı bulunamadı.");
        setLoading(false);
        return;
      }

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        // If user logged in but no profile, it's a critical data integrity issue or uninitialized user
        await logLoginFailure(email);
        setError("Kullanıcı profili bulunamadı.");
        setLoading(false);
        return;
      }

      if (!profile.is_active) {
        // Log as failed login due to inactive account
        await logLoginFailure(email);
        setError("Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.");
        setLoading(false);
        return;
      }

      // Log success
      await logLoginSuccess(data.user.id, profile.role);

      // Debug: Role değerini kontrol et
      console.log("Login successful - User role:", profile.role);
      console.log("Profile data:", profile);

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
      console.error("Login exception:", err);
      // Try catch logging separately to avoid recursive errors
      try {
        const { logLoginFailure } = await import("@/app/actions/logging");
        await logLoginFailure(email);
      } catch (logErr) {
        // fail silently
      }

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
