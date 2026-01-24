"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Trash2, FolderInput, Download, Loader2 } from "lucide-react";
import {
    getLanguages,
    getSyncStatus,
    syncLanguageToDb,
    removeLanguageFromDb,
    updateLanguageSettings,
    getTranslationFile,
    type SupportedLanguage,
    type SyncStatus
} from "@/app/super-admin/settings/translations/actions";
import { toast } from "sonner";

interface LanguageManagerProps {
    onLanguageSelect?: (code: string) => void;
}

export function LanguageManager({ onLanguageSelect }: LanguageManagerProps) {
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({ missingInDb: [], missingInFile: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [langs, sync] = await Promise.all([
                getLanguages(),
                getSyncStatus()
            ]);
            setLanguages(langs);
            setSyncStatus(sync);
        } catch (error) {
            console.error(error);
            toast.error("Dil ayarları yüklenirken hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleToggle = async (id: string, field: keyof SupportedLanguage, currentValue: boolean) => {
        // Optimistic update
        setLanguages(prev => prev.map(l => l.id === id ? { ...l, [field]: !currentValue } : l));

        try {
            await updateLanguageSettings(id, { [field]: !currentValue });
            toast.success("Ayar güncellendi");
        } catch (error) {
            // Revert
            setLanguages(prev => prev.map(l => l.id === id ? { ...l, [field]: currentValue } : l));
            toast.error("Güncelleme başarısız");
        }
    };

    const handleSyncToDb = async (code: string) => {
        try {
            await syncLanguageToDb(code);
            toast.success(`${code.toUpperCase()} veritabanına eklendi`);
            loadData();
        } catch (error) {
            toast.error("Ekleme başarısız");
        }
    };

    const handleRemoveFromDb = async (code: string) => {
        if (!confirm(`${code.toUpperCase()} veritabanından silinecek. Emin misiniz?`)) return;
        try {
            await removeLanguageFromDb(code);
            toast.success(`${code.toUpperCase()} veritabanından silindi`);
            loadData();
        } catch (error) {
            toast.error("Silme başarısız");
        }
    };

    const handleDownload = async (code: string) => {
        try {
            setDownloading(code);
            const data = await getTranslationFile(code);

            // Create and trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${code}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${code}.json indirildi`);
        } catch (error) {
            toast.error("İndirme hatası");
        } finally {
            setDownloading(null);
        }
    };

    const hasSyncIssues = syncStatus.missingInDb.length > 0 || syncStatus.missingInFile.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Dil Ayarları</h2>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {/* Sync Alerts */}
            {hasSyncIssues && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Senkronizasyon Sorunları</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                        {syncStatus.missingInDb.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span>Klasörde var ama DB'de yok:</span>
                                {syncStatus.missingInDb.map(code => (
                                    <Button
                                        key={code}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSyncToDb(code)}
                                        className="h-6 text-xs bg-background"
                                    >
                                        <FolderInput className="mr-1 h-3 w-3" />
                                        {code.toUpperCase()} Ekle
                                    </Button>
                                ))}
                            </div>
                        )}
                        {syncStatus.missingInFile.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span>DB'de var ama klasörde yok:</span>
                                {syncStatus.missingInFile.map(code => (
                                    <Button
                                        key={code}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemoveFromDb(code)}
                                        className="h-6 text-xs bg-background"
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        {code.toUpperCase()} Sil?
                                    </Button>
                                ))}
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {languages.map((lang) => (
                    <Card key={lang.id} className="overflow-hidden flex flex-col">
                        <CardContent className="p-0 flex flex-col h-full">
                            {/* Top: Language Name Button */}
                            <button
                                onClick={() => onLanguageSelect?.(lang.code)}
                                className="w-full bg-primary/10 hover:bg-primary/20 transition-colors p-4 flex flex-col items-center justify-center border-b border-border cursor-pointer group"
                            >
                                <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {lang.name}
                                </span>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                    {lang.code.toUpperCase()}
                                </Badge>
                            </button>

                            {/* Middle: Toggles */}
                            <div className="p-4 flex justify-between items-center gap-2 flex-1">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-medium">Admin</span>
                                    <Switch
                                        checked={lang.show_in_admin}
                                        onCheckedChange={(c) => handleToggle(lang.id, 'show_in_admin', lang.show_in_admin)}
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-medium">Pazarlama</span>
                                    <Switch
                                        checked={lang.show_in_marketing}
                                        onCheckedChange={(c) => handleToggle(lang.id, 'show_in_marketing', lang.show_in_marketing)}
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-medium">Menü</span>
                                    <Switch
                                        checked={lang.show_in_online_menu}
                                        onCheckedChange={(c) => handleToggle(lang.id, 'show_in_online_menu', lang.show_in_online_menu)}
                                    />
                                </div>
                            </div>

                            {/* Bottom: Download Button */}
                            <div className="p-3 border-t bg-muted/30">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-xs gap-2"
                                    onClick={() => handleDownload(lang.code)}
                                    disabled={downloading === lang.code}
                                >
                                    {downloading === lang.code ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Download className="h-3 w-3" />
                                    )}
                                    {lang.code}.json İndir
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* No Results */}
                {languages.length === 0 && !isLoading && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        Kayıtlı dil bulunamadı. Lütfen i18n klasörünü kontrol edin.
                    </div>
                )}
            </div>
        </div>
    );
}
