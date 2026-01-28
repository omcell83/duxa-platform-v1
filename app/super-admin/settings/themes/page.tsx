"use client";

import { ChevronLeft, Palette, CheckCircle2, Monitor, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { THEME_REGISTRY, ThemeDefinition } from "@/lib/themes/registry";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ThemeSettingsPage() {
    const [activeThemeId, setActiveThemeId] = useState("duxa-dark");
    const [loadingThemeId, setLoadingThemeId] = useState<string | null>(null);

    const handleApplyTheme = (themeId: string) => {
        setLoadingThemeId(themeId);
        // Simulate theme switching delay
        setTimeout(() => {
            setActiveThemeId(themeId);
            setLoadingThemeId(null);
            toast.success("Tema başarıyla uygulandı!");
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                    <Link href="/super-admin/settings">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Tema Ayarları</h1>
                </div>
                <p className="text-muted-foreground ml-10">
                    Sistem genelindeki görünümü ve renk paletini yönetin. Seçilen tema tüm platformda geçerli olacaktır.
                </p>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 pt-4">
                {THEME_REGISTRY.map((theme) => {
                    const isActive = activeThemeId === theme.id;
                    const isLoading = loadingThemeId === theme.id;

                    return (
                        <Card
                            key={theme.id}
                            className={cn(
                                "overflow-hidden group transition-all duration-300 border-2 overflow-hidden shadow-lg",
                                isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                            )}
                        >
                            {/* Theme Preview Image Area */}
                            <div className="aspect-[16/9] relative overflow-hidden bg-muted group-hover:scale-[1.02] transition-transform duration-500">
                                {/* Theme Preview Decoration */}
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`
                                    }}
                                />

                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                    <Palette className="h-16 w-16 text-muted-foreground/20 mb-4 group-hover:rotate-12 transition-transform duration-500" />
                                    <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-2xl max-w-[80%]">
                                        <div className="flex gap-2 mb-2 justify-center">
                                            <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.colors.primary }} />
                                            <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.colors.accent }} />
                                            <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.colors.background }} />
                                        </div>
                                        <p className="text-xs font-medium text-foreground opacity-60">Tema Renk Paleti</p>
                                    </div>
                                </div>

                                {/* Active Badge */}
                                {isActive && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/20 animate-in zoom-in-50 duration-300">
                                            <CheckCircle2 className="h-4 w-4" />
                                            VARSAYILAN TEMA
                                        </div>
                                    </div>
                                )}

                                {/* Device Mockup Overlay */}
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded-md"><Monitor className="h-3 w-3 text-white" /></div>
                                    <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded-md"><Tablet className="h-3 w-3 text-white" /></div>
                                    <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded-md"><Smartphone className="h-3 w-3 text-white" /></div>
                                </div>
                            </div>

                            <CardHeader className="relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-bold">{theme.name}</CardTitle>
                                        <CardDescription className="mt-2 text-base leading-relaxed">
                                            {theme.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <Button
                                    size="lg"
                                    variant={isActive ? "secondary" : "default"}
                                    className={cn(
                                        "w-full font-bold",
                                        isActive && "bg-muted cursor-not-allowed"
                                    )}
                                    onClick={() => handleApplyTheme(theme.id)}
                                    disabled={isActive || isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Uygulanıyor...
                                        </div>
                                    ) : (
                                        isActive ? "Sistem Teması Aktif" : "Bu Temayı Seç"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="bg-muted/50 p-6 rounded-xl border border-border mt-8">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Tema Özelleştirme Notu
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Yukarıdaki temalar sistem genelindeki CSS değişkenlerini (`--primary`, `--background`, `--accent` vb.) otomatik olarak günceller.
                    Yeni bir tema eklemek için `lib/themes/registry.ts` dosyasına yeni bir tanım ekleyebilir ve önizleme görselini `public/themes/previews/` altına yükleyebilirsiniz.
                </p>
            </div>
        </div>
    );
}
