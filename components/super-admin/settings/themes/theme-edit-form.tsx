"use client";

import { useState } from "react";
import { Theme, updateTheme } from "@/app/actions/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Layout } from "lucide-react";

interface ThemeEditFormProps {
    theme: Theme;
}

export function ThemeEditForm({ theme }: ThemeEditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: theme.name,
        description: theme.description || "",
        colors: { ...theme.colors }
    });

    const handleColorChange = (key: keyof typeof theme.colors, value: string) => {
        setFormData(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateTheme(theme.id, {
                name: formData.name,
                description: formData.description,
                colors: formData.colors
            });

            if (result.success) {
                toast.success("Tema başarıyla güncellendi.");
                router.push("/super-admin/settings/themes");
            } else {
                toast.error(`Hata: ${result.error}`);
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Genel Bilgiler</CardTitle>
                            <CardDescription>Temanın adı ve açıklaması.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tema Adı</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Açıklama</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Renk Paleti</CardTitle>
                            <CardDescription>Menü ve Kiosk arayüzünde kullanılacak renkler.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="primary">Ana Renk (Primary)</Label>
                                <div className="flex gap-2 text-center">
                                    <Input
                                        type="color"
                                        id="primary"
                                        value={formData.colors.primary}
                                        onChange={e => handleColorChange("primary", e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={formData.colors.primary}
                                        onChange={e => handleColorChange("primary", e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accent">Vurgu Rengi (Accent)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        id="accent"
                                        value={formData.colors.accent}
                                        onChange={e => handleColorChange("accent", e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={formData.colors.accent}
                                        onChange={e => handleColorChange("accent", e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="background">Arka Plan (Background)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        id="background"
                                        value={formData.colors.background}
                                        onChange={e => handleColorChange("background", e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={formData.colors.background}
                                        onChange={e => handleColorChange("background", e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="text">Yazı Rengi (Text)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        id="text"
                                        value={formData.colors.text}
                                        onChange={e => handleColorChange("text", e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={formData.colors.text}
                                        onChange={e => handleColorChange("text", e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>İptal</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Live Preview Area */}
            <div className="lg:col-span-5">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Canlı Önizleme
                        </CardTitle>
                        <CardDescription>Değişikliklerin Menu/Kiosk üzerindeki etkisi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Browser Window Mockup */}
                        <div className="rounded-lg border border-border shadow-2xl overflow-hidden">
                            <div className="bg-muted h-6 flex items-center px-4 gap-1.5 border-b border-border">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                            </div>
                            <div
                                className="p-6 h-[400px] flex flex-col gap-6"
                                style={{ backgroundColor: formData.colors.background, color: formData.colors.text }}
                            >
                                <header className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: formData.colors.primary }} />
                                        <div className="h-4 w-24 rounded" style={{ backgroundColor: formData.colors.text, opacity: 0.2 }} />
                                    </div>
                                    <div className="h-8 w-8 rounded-full" style={{ backgroundColor: formData.colors.accent, opacity: 0.5 }} />
                                </header>

                                <div className="flex-1 space-y-4">
                                    <div className="h-8 w-[60%] rounded-md" style={{ backgroundColor: formData.colors.primary }} />
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="h-32 rounded-xl" style={{ backgroundColor: formData.colors.text, opacity: 0.05, border: `1px solid ${formData.colors.accent}40` }} />
                                        <div className="h-32 rounded-xl" style={{ backgroundColor: formData.colors.text, opacity: 0.05, border: `1px solid ${formData.colors.accent}40` }} />
                                    </div>
                                    <div className="h-10 w-full rounded-md mt-auto" style={{ backgroundColor: formData.colors.accent }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between gap-4">
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Smartphone className="h-3.5 w-3.5" />
                                Mobil görünüm için duyarlıdır.
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Monitor className="h-3.5 w-3.5" />
                                4K Kiosk desteği mevcuttur.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
