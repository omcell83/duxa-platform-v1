import { ChevronLeft, Palette, Edit3, CheckCircle2, Monitor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getThemes } from "@/app/actions/themes";

export default async function ThemeSettingsPage() {
    const themes = await getThemes();

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
                    Kiosk ve Dijital Menüler için görünüm seçeneklerini yönetin. Admin paneli bu ayarlardan etkilenmez.
                </p>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {themes.map((theme) => (
                    <Card key={theme.id} className="overflow-hidden group hover:border-primary/50 transition-all shadow-sm flex flex-col">
                        <div className="aspect-[4/3] relative overflow-hidden bg-muted border-b border-border/50">
                            {/* Theme Colors Indicators - Mini Preview */}
                            <div className="absolute inset-0 p-4 flex flex-col gap-2">
                                <div className="h-2 w-full rounded-sm opacity-20" style={{ backgroundColor: theme.colors.primary }} />
                                <div className="h-8 w-full rounded-md shadow-sm border border-black/5" style={{ backgroundColor: theme.colors.background }} />
                                <div className="flex gap-1">
                                    <div className="h-4 w-4 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.accent }} />
                                    <div className="h-4 w-4 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.primary }} />
                                </div>
                            </div>

                            {/* System Tag */}
                            {theme.is_system && (
                                <div className="absolute top-2 right-2 bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-primary/20">
                                    Sistem
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px]">
                                <Monitor className="h-6 w-6 text-primary" />
                            </div>
                        </div>

                        <CardHeader className="p-3 space-y-1">
                            <CardTitle className="text-sm font-bold truncate">{theme.name}</CardTitle>
                            <CardDescription className="text-[10px] line-clamp-1">
                                {theme.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-3 pt-0 mt-auto">
                            <Link href={`/super-admin/settings/themes/${theme.id}/edit`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-[10px] h-8 gap-1.5"
                                >
                                    <Edit3 className="h-3 w-3" />
                                    Temayı Düzenle
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {/* Add New Theme Placeholder Card */}
                <Card className="border-dashed flex items-center justify-center p-4 hover:bg-muted/50 transition-colors cursor-not-allowed opacity-50">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="p-2 bg-muted rounded-full">
                            <Palette className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">Yeni Tema Ekle<br />(Yakında)</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
