"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { QrCode, Loader2, CheckCircle2 } from "lucide-react";

export default function TwoFactorSetupPage() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState("");
    const [factorId, setFactorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const startEnrollment = async () => {
        setEnrollLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            });

            if (error) throw error;

            setFactorId(data.id);
            setQrCode(data.totp.qr_code);
            setSecret(data.totp.secret);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setEnrollLoading(false);
        }
    };

    const verifyEnrollment = async () => {
        if (!factorId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: verifyCode,
            });

            if (error) throw error;

            toast.success("2FA başarıyla kuruldu!");
            // Redirect based on user role would be ideal, but for now dashboard is safe
            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            toast.error(`Doğrulama hatası: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>İki Faktörlü Doğrulama (2FA) Kurulumu</CardTitle>
                    <CardDescription>
                        Hesabınız için 2FA zorunlu tutulmuştur. Devam etmek için lütfen kurulumu tamamlayın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!qrCode ? (
                        <div className="text-center py-6">
                            <Button onClick={startEnrollment} disabled={enrollLoading}>
                                {enrollLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kurulumu Başlat
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className="flex justify-center">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Authenticator uygulamanızla QR kodunu tarayın ve üretilen kodu aşağıya girin.
                            </p>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="000 000"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
                {qrCode && (
                    <CardFooter>
                        <Button className="w-full" onClick={verifyEnrollment} disabled={loading || verifyCode.length !== 6}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Doğrula ve Tamamla
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
