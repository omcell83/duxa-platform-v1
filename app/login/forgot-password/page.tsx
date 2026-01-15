"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { resetPasswordForEmail } from "@/app/actions/auth";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await resetPasswordForEmail(email);

      // Always show success message (security: prevents email enumeration)
      // The server action always returns success: true
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      // Even on error, show success to prevent email enumeration
      setSuccess(true);
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
          <CardTitle className="text-2xl font-bold">Şifremi Unuttum</CardTitle>
          <CardDescription>
            Email adresinize şifre sıfırlama bağlantısı göndereceğiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-md flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    İstek alındı
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama talimatları gönderilmiştir.
                  </p>
                </div>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Giriş Sayfasına Dön
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full" type="button">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Giriş Sayfasına Dön
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
