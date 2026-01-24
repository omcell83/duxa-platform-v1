"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Trash2, FolderInput } from "lucide-react";
import {
    getLanguages,
    getSyncStatus,
    syncLanguageToDb,
    removeLanguageFromDb,
    updateLanguageSettings,
    type SupportedLanguage,
    type SyncStatus
} from "@/app/super-admin/settings/translations/actions";
import { toast } from "sonner";

export function LanguageManager() {
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({ missingInDb: [], missingInFile: [] });
    const [isLoading, setIsLoading] = useState(true);

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

    const hasSyncIssues = syncStatus.missingInDb.length > 0 || syncStatus.missingInFile.length > 0;

    return (
        <div className="space-y-6">
            {/* Sync Alerts */}
            {hasSyncIssues && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Senkronizasyon Sorunları</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                        {syncStatus.missingInDb.length > 0 && (
                            <div className="flex items-center gap-2">
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
                            <div className="flex items-center gap-2">
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Dil Ayarları</CardTitle>
                            <CardDescription>Aktif diller ve görüntülenme ayarları</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Dil</TableHead>
                                <TableHead className="text-center">Admin Panel</TableHead>
                                <TableHead className="text-center">Pazarlama</TableHead>
                                <TableHead className="text-center">Online Menü</TableHead>
                                <TableHead className="text-center">İndirme İzni</TableHead>
                                <TableHead className="text-center">Durum</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languages.map((lang) => (
                                <TableRow key={lang.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{lang.name}</span>
                                            <span className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={lang.show_in_admin}
                                                onCheckedChange={(c) => handleToggle(lang.id, 'show_in_admin', lang.show_in_admin)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={lang.show_in_marketing}
                                                onCheckedChange={(c) => handleToggle(lang.id, 'show_in_marketing', lang.show_in_marketing)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={lang.show_in_online_menu}
                                                onCheckedChange={(c) => handleToggle(lang.id, 'show_in_online_menu', lang.show_in_online_menu)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={lang.allow_download}
                                                onCheckedChange={(c) => handleToggle(lang.id, 'allow_download', lang.allow_download)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={lang.is_active ? "default" : "secondary"}>
                                            {lang.is_active ? "Aktif" : "Pasif"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {languages.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Kayıtlı dil bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
