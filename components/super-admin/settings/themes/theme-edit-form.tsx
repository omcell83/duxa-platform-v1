"use client";

import { useState, useMemo } from "react";
import { Theme, updateTheme } from "@/app/actions/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Layout, Palette, Type, Box, Layers, Info, Trash2, Check, AlertCircle, TriangleAlert, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeEditFormProps {
    theme: Theme;
}

const FONTS = [
    { name: "Geist (Sistem)", value: "Geist, sans-serif" },
    { name: "Inter", value: "'Inter', sans-serif" },
    { name: "Roboto", value: "'Roboto', sans-serif" },
    { name: "Montserrat", value: "'Montserrat', sans-serif" },
    { name: "Playfair Display (Premium)", value: "'Playfair Display', serif" },
    { name: "Outfit", value: "'Outfit', sans-serif" },
    { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" }
];

export function ThemeEditForm({ theme }: ThemeEditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial state setup with fallbacks for existing data
    const [formData, setFormData] = useState<Theme>({
        ...theme,
        colors: {
            ...theme.colors,
            secondary_text: theme.colors?.secondary_text || "#6b7280",
            border: theme.colors?.border || "#e5e7eb",
            card_background: theme.colors?.card_background || "#ffffff",
            success: theme.colors?.success || "#10b981",
            warning: theme.colors?.warning || "#f59e0b",
            error: theme.colors?.error || "#ef4444",
        },
        typography: {
            ...theme.typography,
            font_family: theme.typography?.font_family || "Geist, sans-serif",
            base_font_size: theme.typography?.base_font_size || 16,
            heading_font_size: theme.typography?.heading_font_size || 24,
            secondary_font_size: theme.typography?.secondary_font_size || 14,
            font_weight_bold: theme.typography?.font_weight_bold || 700,
            font_weight_medium: theme.typography?.font_weight_medium || 500,
        },
        layout: {
            ...theme.layout,
            border_radius: theme.layout?.border_radius || 8,
            card_padding: theme.layout?.card_padding || 16,
            container_gap: theme.layout?.container_gap || 24,
            kiosk_header_height: theme.layout?.kiosk_header_height || 80,
        },
        components: {
            ...theme.components,
            button_style: theme.components?.button_style || 'rounded',
            card_shadow: theme.components?.card_shadow || 'md',
            show_icons: theme.components?.show_icons !== undefined ? theme.components.show_icons : true,
            category_scroll: theme.components?.category_scroll || 'horizontal',
        }
    });

    const handleUpdate = (section: string, key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev as any)[section],
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
                colors: formData.colors,
                typography: formData.typography,
                layout: formData.layout,
                components: formData.components
            });

            if (result.success) {
                toast.success("Tema başarıyla güncellendi.");
                router.refresh();
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
            <div className="lg:col-span-7 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid grid-cols-5 w-full h-12">
                            <TabsTrigger value="general" className="gap-2"><Info className="h-4 w-4" /> Genel</TabsTrigger>
                            <TabsTrigger value="colors" className="gap-2"><Palette className="h-4 w-4" /> Renkler</TabsTrigger>
                            <TabsTrigger value="typography" className="gap-2"><Type className="h-4 w-4" /> Yazı</TabsTrigger>
                            <TabsTrigger value="layout" className="gap-2"><Box className="h-4 w-4" /> Yerleşim</TabsTrigger>
                            <TabsTrigger value="components" className="gap-2"><Layers className="h-4 w-4" /> Bileşen</TabsTrigger>
                        </TabsList>

                        {/* GENERAL TAB */}
                        <TabsContent value="general" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Genel Bilgiler</CardTitle>
                                    <CardDescription>Tema kimliği ve temel bilgiler.</CardDescription>
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
                                            value={formData.description || ""}
                                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* COLORS TAB */}
                        <TabsContent value="colors" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Temel Renkler</CardTitle>
                                    <CardDescription>Arayüzün ana tonları.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <ColorInput label="Ana (Primary)" value={formData.colors.primary} onChange={val => handleUpdate('colors', 'primary', val)} />
                                    <ColorInput label="Vurgu (Accent)" value={formData.colors.accent} onChange={val => handleUpdate('colors', 'accent', val)} />
                                    <ColorInput label="Arka Plan" value={formData.colors.background} onChange={val => handleUpdate('colors', 'background', val)} />
                                    <ColorInput label="Kart Arka Plan" value={formData.colors.card_background} onChange={val => handleUpdate('colors', 'card_background', val)} />
                                    <ColorInput label="Yazı Rengi" value={formData.colors.text} onChange={val => handleUpdate('colors', 'text', val)} />
                                    <ColorInput label="İkincil Yazı" value={formData.colors.secondary_text} onChange={val => handleUpdate('colors', 'secondary_text', val)} />
                                    <ColorInput label="Kenarlık (Border)" value={formData.colors.border} onChange={val => handleUpdate('colors', 'border', val)} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Durum Renkleri</CardTitle>
                                    <CardDescription>Uyarı ve bilgilendirme renkleri.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4">
                                    <ColorInput label="Başarı" value={formData.colors.success} onChange={val => handleUpdate('colors', 'success', val)} />
                                    <ColorInput label="Uyarı" value={formData.colors.warning} onChange={val => handleUpdate('colors', 'warning', val)} />
                                    <ColorInput label="Hata" value={formData.colors.error} onChange={val => handleUpdate('colors', 'error', val)} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TYPOGRAPHY TAB */}
                        <TabsContent value="typography" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tipografi Ayarları</CardTitle>
                                    <CardDescription>Yazı tipleri ve boyutları (Kiosk/Menü).</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Yazı Tipi (Font Family)</Label>
                                        <Select
                                            value={formData.typography.font_family}
                                            onValueChange={val => handleUpdate('typography', 'font_family', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FONTS.map(font => (
                                                    <SelectItem key={font.value} value={font.value}>{font.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <NumberInput label="Ana Yazı Boyutu (px)" value={formData.typography.base_font_size} onChange={val => handleUpdate('typography', 'base_font_size', val)} />
                                        <NumberInput label="Başlık Boyutu (px)" value={formData.typography.heading_font_size} onChange={val => handleUpdate('typography', 'heading_font_size', val)} />
                                        <NumberInput label="İkincil Yazı Boyutu (px)" value={formData.typography.secondary_font_size} onChange={val => handleUpdate('typography', 'secondary_font_size', val)} />
                                        <div className="space-y-2">
                                            <Label>Kalın Yazı Ağırlığı</Label>
                                            <Select
                                                value={formData.typography.font_weight_bold.toString()}
                                                onValueChange={val => handleUpdate('typography', 'font_weight_bold', parseInt(val))}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="600">600 - Semi Bold</SelectItem>
                                                    <SelectItem value="700">700 - Bold</SelectItem>
                                                    <SelectItem value="800">800 - Extra Bold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* LAYOUT TAB */}
                        <TabsContent value="layout" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Yerleşim ve Boşluklar</CardTitle>
                                    <CardDescription>Kenar yumuşatma ve boşluk ayarları.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-6">
                                    <NumberInput label="Kenar Yuvarlama (Radius - px)" value={formData.layout.border_radius} onChange={val => handleUpdate('layout', 'border_radius', val)} />
                                    <NumberInput label="Kart İç Boşluk (Padding - px)" value={formData.layout.card_padding} onChange={val => handleUpdate('layout', 'card_padding', val)} />
                                    <NumberInput label="Bileşen Arası Mesafe (Gap - px)" value={formData.layout.container_gap} onChange={val => handleUpdate('layout', 'container_gap', val)} />
                                    <NumberInput label="Header Yüksekliği (px)" value={formData.layout.kiosk_header_height} onChange={val => handleUpdate('layout', 'kiosk_header_height', val)} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* COMPONENTS TAB */}
                        <TabsContent value="components" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bileşen Stilleri</CardTitle>
                                    <CardDescription>Buton ve kart görünüm detayları.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Buton Stili</Label>
                                            <Select
                                                value={formData.components.button_style}
                                                onValueChange={val => handleUpdate('components', 'button_style', val)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flat">Düz (Flat)</SelectItem>
                                                    <SelectItem value="rounded">Yuvarlak (Rounded)</SelectItem>
                                                    <SelectItem value="glass">Cam (Glassmorphism)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gölge Efekti</Label>
                                            <Select
                                                value={formData.components.card_shadow}
                                                onValueChange={val => handleUpdate('components', 'card_shadow', val)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Yok</SelectItem>
                                                    <SelectItem value="sm">Hafif (Small)</SelectItem>
                                                    <SelectItem value="md">Orta (Medium)</SelectItem>
                                                    <SelectItem value="lg">Belirgin (Large)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label>Simgeleri Göster</Label>
                                            <p className="text-xs text-muted-foreground">Kategori ve ürünlerde ikon kullanımı.</p>
                                        </div>
                                        <Switch
                                            checked={formData.components.show_icons}
                                            onCheckedChange={val => handleUpdate('components', 'show_icons', val)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Kategori Kaydırma Yönü</Label>
                                        <Tabs
                                            value={formData.components.category_scroll}
                                            onValueChange={val => handleUpdate('components', 'category_scroll', val as any)}
                                        >
                                            <TabsList className="w-full">
                                                <TabsTrigger value="horizontal" className="flex-1">Yatay (Horizontal)</TabsTrigger>
                                                <TabsTrigger value="vertical" className="flex-1">Dikey (Vertical)</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                        <Button type="submit" disabled={isLoading} className="min-w-[150px]">
                            {isLoading ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* PREVIEW AREA */}
            <div className="lg:col-span-5 relative">
                <div className="sticky top-6 space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Monitor className="h-4 w-4" /> Canlı Kiosk/Menü Önizleme
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Device Mockup */}
                            <div className="rounded-2xl border-8 border-black shadow-2xl overflow-hidden aspect-[9/16] max-h-[700px] mx-auto bg-white transition-all duration-300">
                                <div
                                    className="h-full w-full flex flex-col overflow-hidden"
                                    style={{
                                        backgroundColor: formData.colors.background,
                                        color: formData.colors.text,
                                        fontFamily: formData.typography.font_family
                                    }}
                                >
                                    {/* Kiosk Header */}
                                    <header
                                        className="px-6 flex items-center justify-between shadow-sm z-10"
                                        style={{
                                            height: `${formData.layout.kiosk_header_height}px`,
                                            backgroundColor: formData.colors.card_background,
                                            borderBottom: `1px solid ${formData.colors.border}`
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: formData.colors.primary }}>
                                                <Palette className="h-6 w-6" style={{ color: formData.colors.background }} />
                                            </div>
                                            <span
                                                className="uppercase"
                                                style={{
                                                    fontSize: `${formData.typography.base_font_size}px`,
                                                    fontWeight: formData.typography.font_weight_bold
                                                }}
                                            >
                                                DUXA CAFE
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: formData.colors.border }}>
                                                <Languages className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </header>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                        {/* Categories */}
                                        <div
                                            className={cn(
                                                "flex gap-3 overflow-x-auto pb-2 scrollbar-hide",
                                                formData.components.category_scroll === 'vertical' && "flex-col overflow-x-hidden"
                                            )}
                                        >
                                            {["Burgerler", "Pizzalar", "İçecekler", "Tatlılar"].map((cat, i) => (
                                                <div
                                                    key={cat}
                                                    className="px-4 py-2 shrink-0 border transition-all text-center flex items-center gap-2"
                                                    style={{
                                                        borderRadius: `${formData.layout.border_radius}px`,
                                                        backgroundColor: i === 0 ? formData.colors.primary : formData.colors.card_background,
                                                        color: i === 0 ? formData.colors.background : formData.colors.text,
                                                        borderColor: i === 0 ? formData.colors.primary : formData.colors.border,
                                                        fontSize: `${formData.typography.secondary_font_size}px`,
                                                        fontWeight: formData.typography.font_weight_medium,
                                                        boxShadow: formData.components.card_shadow !== 'none' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                                    }}
                                                >
                                                    {formData.components.show_icons && <Layout className="h-3 w-3" />}
                                                    {cat}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Product Items */}
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { name: "Double Cheese Burger", price: "280 ₺", desc: "Özel sos, cheddar, turşu." },
                                                { name: "Margerita Pizza", price: "320 ₺", desc: "Mozzarella, taze fesleğen." }
                                            ].map((prod) => (
                                                <div
                                                    key={prod.name}
                                                    className="p-4 border shadow-sm flex gap-4 items-center"
                                                    style={{
                                                        borderRadius: `${formData.layout.border_radius}px`,
                                                        backgroundColor: formData.colors.card_background,
                                                        borderColor: formData.colors.border,
                                                        boxShadow: getShadow(formData.components.card_shadow)
                                                    }}
                                                >
                                                    <div className="w-20 h-20 bg-muted rounded-lg shrink-0 flex items-center justify-center">
                                                        <Box className="h-8 w-8 text-muted-foreground/30" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 style={{ fontSize: `${formData.typography.base_font_size}px`, fontWeight: formData.typography.font_weight_bold }}>{prod.name}</h3>
                                                        <p style={{ color: formData.colors.secondary_text, fontSize: `${formData.typography.secondary_font_size}px` }}>{prod.desc}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span style={{ color: formData.colors.primary, fontWeight: formData.typography.font_weight_bold }}>{prod.price}</span>
                                                            <div
                                                                className="px-3 py-1 text-white text-[10px] font-bold"
                                                                style={{
                                                                    backgroundColor: formData.colors.primary,
                                                                    borderRadius: formData.components.button_style === 'rounded' ? '99px' : `${formData.layout.border_radius}px`
                                                                }}
                                                            >
                                                                EKLE +
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Status Indicators Example */}
                                        <div className="space-y-3 pt-6">
                                            <div className="p-3 flex items-center gap-3 text-xs font-medium" style={{ backgroundColor: `${formData.colors.success}15`, color: formData.colors.success, borderRadius: '8px' }}>
                                                <Check className="h-4 w-4" /> Siparişiniz hazırlandı.
                                            </div>
                                            <div className="p-3 flex items-center gap-3 text-xs font-medium" style={{ backgroundColor: `${formData.colors.warning}15`, color: formData.colors.warning, borderRadius: '8px' }}>
                                                <TriangleAlert className="h-4 w-4" /> Stok azalıyor.
                                            </div>
                                            <div className="p-3 flex items-center gap-3 text-xs font-medium" style={{ backgroundColor: `${formData.colors.error}15`, color: formData.colors.error, borderRadius: '8px' }}>
                                                <AlertCircle className="h-4 w-4" /> Bir hata oluştu!
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="p-4 bg-transparent border-t" style={{ borderColor: formData.colors.border }}>
                                        <button
                                            className="w-full py-4 font-bold text-center flex items-center justify-center gap-2 shadow-lg"
                                            style={{
                                                backgroundColor: formData.colors.primary,
                                                color: formData.colors.background,
                                                fontSize: `${formData.typography.base_font_size}px`,
                                                borderRadius: formData.components.button_style === 'rounded' ? '99px' : `${formData.layout.border_radius}px`,
                                                filter: formData.components.button_style === 'glass' ? 'backdrop-blur(10px) saturate(150%)' : 'none',
                                                opacity: formData.components.button_style === 'glass' ? 0.8 : 1
                                            }}
                                        >
                                            SİPARİŞİ TAMAMLA (600 ₺)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner code
function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
            <div className="flex gap-2 items-center">
                <Input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-10 h-10 p-1 cursor-pointer"
                />
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 font-mono text-xs uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
}

function NumberInput({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input
                type="number"
                value={value}
                onChange={e => onChange(parseInt(e.target.value) || 0)}
            />
        </div>
    );
}

function getShadow(level: string) {
    switch (level) {
        case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        default: return 'none';
    }
}
