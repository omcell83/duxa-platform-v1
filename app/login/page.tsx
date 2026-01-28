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
import { useTheme } from "next-themes";
import Link from "next/link";
import { logLoginFailure, logLoginBlocked } from "@/app/actions/logging";
import { incrementFailedAttempts } from "@/app/actions/user-management";
import { handlePostLoginTasks } from "@/app/actions/auth-events";

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
      console.log("[LOGIN] Starting sign-in process for:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.warn("[LOGIN] Sign-in error:", signInError.message);
        // Check if it's a ban error
        const isBanned = signInError.message?.toLowerCase().includes("banned") ||
          signInError.message?.toLowerCase().includes("blocked");

        // Track failed attempt (Server Action)
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
        console.error("[LOGIN] No user data returned after successful sign-in");
        setError("Kullanıcı bulunamadı.");
        setLoading(false);
        return;
      }

      // Successful Auth - Now get profile
      console.log("[LOGIN] Auth success, fetching profile...");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active, tenant_id")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        console.error("[LOGIN] Profile fetch error:", profileError);
        setError("Kullanıcı profili bulunamadı.");
        setLoading(false);
        return;
      }

      if (!profile.is_active) {
        console.warn("[LOGIN] Account inactive:", email);
        setError("Hesabınız aktif değil. Lütfen sistem yöneticisi ile iletişime geçin.");
        setLoading(false);
        return;
      }
      // 1. Successful login - Consolidate post-login tasks (Log & Reset)
      console.log("[LOGIN] Authentication successful, running post-login tasks...");

      // Explicitly cast tenant_id to number | null to avoid BigInt serialization issues in Server Actions
      const tenantIdNum = profile.tenant_id ? Number(profile.tenant_id) : null;

      const postLoginResult = await handlePostLoginTasks(data.user.id, profile.role, tenantIdNum);

      if (!postLoginResult || !postLoginResult.success) {
        console.error("[LOGIN] Post-login tasks failed:", postLoginResult?.error);
        await supabase.auth.signOut(); // Security: sign out if log failed
        setError(postLoginResult?.error || "Sistem güvenliği nedeniyle giriş engellendi.");
        setLoading(false);
        return;
      }

      // Short delay for cookie propagation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirect determination
      const redirectPath = searchParams.get("redirect") || "";
      const normalizedRole = (profile.role || "").trim().toLowerCase();
      let targetPath = "";

      if (redirectPath && redirectPath.startsWith("/")) {
        targetPath = redirectPath;
      } else {
        targetPath = normalizedRole === "super_admin" ? "/super-admin/dashboard" : "/dashboard";
      }

      console.log("[LOGIN] Final success, redirecting to:", targetPath);
      window.location.href = targetPath;

    } catch (err: any) {
      console.error("[LOGIN] Uncaught exception:", err);
      setError(err.message || "Beklenmeyen bir hata oluştu.");
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
