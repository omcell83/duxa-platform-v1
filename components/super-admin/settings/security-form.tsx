"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SecuritySettings, updateSecuritySettings } from "@/app/actions/system-settings";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const securityFormSchema = z.object({
    min_password_length: z.coerce.number().min(6, "En az 6 karakter olmalıdır").max(32, "En fazla 32 karakter olabilir"),
    require_special_char: z.boolean(),
    require_number: z.boolean(),
    require_uppercase: z.boolean(),
    max_login_attempts: z.coerce.number().min(3, "En az 3 deneme").max(10, "En fazla 10 deneme"),
    session_timeouts: z.object({
        super_admin: z.coerce.number().min(5).max(1440),
        owner: z.coerce.number().min(5).max(1440),
        tenant_admin: z.coerce.number().min(5).max(1440),
        manager: z.coerce.number().min(5).max(1440),
        personnel: z.coerce.number().min(5).max(1440),
    }),
    two_factor_enforced: z.boolean(),
});

type SecurityFormValues = z.infer<typeof securityFormSchema>;

interface SecuritySettingsFormProps {
    initialSettings: SecuritySettings;
}

export function SecuritySettingsForm({ initialSettings }: SecuritySettingsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<SecurityFormValues>({
        resolver: zodResolver(securityFormSchema) as any,
        defaultValues: initialSettings,
    });

    async function onSubmit(data: SecurityFormValues) {
        setIsSubmitting(true);
        try {
            const result = await updateSecuritySettings(data as any);

            if (result.success) {
                toast.success("Güvenlik ayarları başarıyla güncellendi.");
                router.refresh();
            } else {
                toast.error(`Hata: ${result.error}`);
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Password Policy Section */}
                <Card className="border-border/50 shadow-md overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            <CardTitle>Parola Politikası</CardTitle>
                        </div>
                        <CardDescription>
                            Kullanıcı parolaları için zorunlu gereksinimleri belirleyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <FormField
                            control={form.control}
                            name="min_password_length"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Minimum Parola Uzunluğu</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} className="max-w-[200px]" />
                                    </FormControl>
                                    <FormDescription>
                                        Kullanıcıların belirleyebileceği en kısa parola uzunluğu.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="require_uppercase"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Büyük Harf Zorunluluğu</FormLabel>
                                            <FormDescription className="text-xs">
                                                En az bir büyük harf (A-Z)
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="require_number"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Rakam Zorunluluğu</FormLabel>
                                            <FormDescription className="text-xs">
                                                En az bir rakam (0-9)
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="require_special_char"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Özel Karakter Zorunluluğu</FormLabel>
                                            <FormDescription className="text-xs">
                                                En az bir özel karakter (!@#$%)
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Access Control Section */}
                <Card className="border-border/50 shadow-md overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle>Erişim ve Oturum Kontrolü</CardTitle>
                        </div>
                        <CardDescription>
                            Brute-force koruması ve rol bazlı oturum süreleri.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <FormField
                            control={form.control}
                            name="max_login_attempts"
                            render={({ field }) => (
                                <FormItem className="bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldAlert className="h-4 w-4 text-destructive" />
                                        <FormLabel className="text-destructive font-bold">Maksimum Hatalı Giriş Sayısı</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Input type="number" {...field} className="max-w-[200px]" />
                                    </FormControl>
                                    <FormDescription className="text-destructive/80">
                                        BU SINIRI AŞAN HESAPLAR OTOMATİK OLARAK PASİFE ALINIR.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                Rol Bazlı Oturum Zaman Aşımları (Dakika)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="session_timeouts.super_admin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Süper Admin</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="session_timeouts.owner"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-muted-foreground">İşletme Sahibi</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="session_timeouts.tenant_admin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Yönetici Admin</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="session_timeouts.manager"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Müdür</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="session_timeouts.personnel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Personel</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                        {isSubmitting ? "Kaydediliyor..." : "Ayarları Kaydet"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
