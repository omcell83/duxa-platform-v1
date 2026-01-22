"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Download,
    RefreshCw,
    Loader2,
    Search,
    Sparkles,
    FileJson,
    Check,
} from "lucide-react";

interface Language {
    code: string;
    country: string;
    name: string;
}

const LANGUAGES: Language[] = [
    { code: "en", country: "gb", name: "İngilizce" },
    { code: "de", country: "de", name: "Almanca" },
    { code: "fr", country: "fr", name: "Fransızca" },
    { code: "lb", country: "lu", name: "Lüksemburgca" },
    { code: "tr", country: "tr", name: "Türkçe" },
    { code: "me", country: "me", name: "Karadağca" },
    { code: "mt", country: "mt", name: "Maltaca" },
    { code: "ru", country: "ru", name: "Rusça" },
];

interface TranslationData {
    [key: string]: any;
}

export function TranslationEditor() {
    const [sourceData, setSourceData] = useState<TranslationData>({});
    const [translations, setTranslations] = useState<Record<string, TranslationData>>({});
    const [selectedLanguage, setSelectedLanguage] = useState<string>("de");
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Load source file (en.json)
    useEffect(() => {
        loadSourceFile();
    }, []);

    const loadSourceFile = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/i18n/en");
            const data = await response.json();
            setSourceData(data);

            // Initialize empty translations for each language
            const initialTranslations: Record<string, TranslationData> = {};
            LANGUAGES.forEach((lang) => {
                if (lang.code !== "en") {
                    initialTranslations[lang.code] = {};
                }
            });
            setTranslations(initialTranslations);
        } catch (error) {
            console.error("Failed to load source file:", error);
            alert("Hata: Kaynak dosya yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const translateWithAI = async (targetLang: string) => {
        try {
            setIsTranslating(true);

            const response = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceData,
                    targetLanguage: targetLang,
                }),
            });

            if (!response.ok) throw new Error("Translation failed");

            const translatedData = await response.json();

            setTranslations((prev) => ({
                ...prev,
                [targetLang]: translatedData,
            }));

            const langName = LANGUAGES.find((l) => l.code === targetLang)?.name;
            console.log(`Translation completed for ${langName}`);
            alert(`Başarılı: ${langName} çevirisi tamamlandı`);
        } catch (error) {
            console.error("Translation failed:", error);
            alert("Hata: Çeviri başarısız oldu. Lütfen tekrar deneyin.");
        } finally {
            setIsTranslating(false);
        }
    };

    const downloadTranslation = (langCode: string) => {
        const data = translations[langCode];
        if (!data || Object.keys(data).length === 0) {
            alert("Uyarı: İndirilecek çeviri bulunamadı");
            return;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${langCode}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Downloaded ${langCode}.json`);
    };

    const updateTranslation = (langCode: string, key: string, value: string) => {
        setTranslations((prev) => {
            const updated = { ...prev };
            setNestedValue(updated[langCode], key, value);
            return updated;
        });

        setEditedKeys((prev) => new Set(prev).add(`${langCode}.${key}`));
    };

    const flattenObject = (obj: any, prefix = ""): Array<{ key: string; value: any }> => {
        const result: Array<{ key: string; value: any }> = [];

        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                result.push(...flattenObject(obj[key], fullKey));
            } else {
                result.push({ key: fullKey, value: obj[key] });
            }
        }

        return result;
    };

    const filteredKeys = flattenObject(sourceData).filter(
        (item) =>
            item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(item.value).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getNestedValue = (obj: any, path: string): any => {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    };

    const setNestedValue = (obj: any, path: string, value: any): any => {
        const keys = path.split(".");
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
        return obj;
    };

    // Pagination
    const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
    const paginatedKeys = filteredKeys.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI Destekli Çeviri
                    </CardTitle>
                    <CardDescription>
                        Google Translate kullanarak otomatik çeviri (Ücretsiz)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Label htmlFor="target-lang">Hedef Dil</Label>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger id="target-lang">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.filter((l) => l.code !== "en").map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name} ({lang.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                onClick={() => translateWithAI(selectedLanguage)}
                                disabled={isTranslating}
                                className="gap-2"
                            >
                                {isTranslating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Çevriliyor...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        AI ile Çevir
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => downloadTranslation(selectedLanguage)}
                                disabled={
                                    !translations[selectedLanguage] ||
                                    Object.keys(translations[selectedLanguage]).length === 0
                                }
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                İndir
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileJson className="h-4 w-4" />
                        <span>Toplam {flattenObject(sourceData).length} çeviri anahtarı</span>
                    </div>
                </CardContent>
            </Card>

            {/* Translation Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Çeviri Tablosu</CardTitle>
                            <CardDescription>
                                Çevirileri kontrol edin ve düzenleyin
                            </CardDescription>
                        </div>
                        {editedKeys.size > 0 && (
                            <Badge variant="secondary">{editedKeys.size} değişiklik yapıldı</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Anahtar veya değer ara..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Anahtar</TableHead>
                                    <TableHead>Kaynak (İngilizce)</TableHead>
                                    <TableHead>
                                        Çeviri ({LANGUAGES.find((l) => l.code === selectedLanguage)?.name})
                                    </TableHead>
                                    <TableHead className="w-[80px]">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedKeys.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            Sonuç bulunamadı
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedKeys.map((item) => {
                                        const translatedValue = getNestedValue(
                                            translations[selectedLanguage],
                                            item.key
                                        );
                                        const isEdited = editedKeys.has(`${selectedLanguage}.${item.key}`);

                                        return (
                                            <TableRow key={item.key}>
                                                <TableCell className="font-mono text-xs">
                                                    {item.key}
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    <div className="text-sm">{String(item.value)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea
                                                        value={translatedValue || ""}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                            updateTranslation(selectedLanguage, item.key, e.target.value)
                                                        }
                                                        placeholder="Çeviri buraya yazılacak..."
                                                        className="min-h-[60px] text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {isEdited && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Düzenlendi
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Sayfa {currentPage} / {totalPages} ({filteredKeys.length} sonuç)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Önceki
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Sonraki
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Download */}
            <Card>
                <CardHeader>
                    <CardTitle>Toplu İndirme</CardTitle>
                    <CardDescription>Tüm dilleri tek seferde indirin</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {LANGUAGES.filter((l) => l.code !== "en").map((lang) => {
                            const hasTranslation =
                                translations[lang.code] && Object.keys(translations[lang.code]).length > 0;

                            return (
                                <Button
                                    key={lang.code}
                                    variant={hasTranslation ? "default" : "outline"}
                                    onClick={() => downloadTranslation(lang.code)}
                                    disabled={!hasTranslation}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    {lang.code}.json
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
