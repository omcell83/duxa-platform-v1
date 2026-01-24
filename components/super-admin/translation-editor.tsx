"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Loader2,
    Search,
    Check,
    ChevronsUpDown,
    Download,
    Save
} from "lucide-react";
import { getLanguages, getTranslationFile, saveTranslationFile, type SupportedLanguage } from "@/app/super-admin/settings/translations/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FlattenedItem {
    key: string;
    sourceValue: string;
}

export function TranslationEditor() {
    const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>([]);
    const [selectedLangCodes, setSelectedLangCodes] = useState<string[]>(["tr"]); // Default TR
    const [sourceData, setSourceData] = useState<Record<string, any>>({});
    const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [unsavedChanges, setUnsavedChanges] = useState<Record<string, Set<string>>>({}); // langCode -> Set<keys>

    const itemsPerPage = 50;

    // Load Languages & Source on mount
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                const [langs, source] = await Promise.all([
                    getLanguages(),
                    getTranslationFile('en')
                ]);
                setAvailableLanguages(langs);
                setSourceData(source);

                // Load default TR
                await loadLanguage('tr');
            } catch (error) {
                console.error(error);
                toast.error("Başlangıç verileri yüklenemedi");
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    // Load translation data for a specific language
    const loadLanguage = async (code: string) => {
        if (translations[code]) return; // Already loaded

        try {
            setIsLoading(true);
            const data = await getTranslationFile(code);
            setTranslations(prev => ({
                ...prev,
                [code]: flattenForEdit(data)
            }));
        } catch (error) {
            toast.error(`${code.toUpperCase()} yüklenemedi`);
        } finally {
            setIsLoading(false);
        }
    };

    // Flatten helper: { auth: { title: "X" } } -> { "auth.title": "X" }
    const flattenForEdit = (obj: any, prefix = ""): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(result, flattenForEdit(obj[key], fullKey));
            } else {
                result[fullKey] = String(obj[key]);
            }
        }
        return result;
    };

    // Re-structure helper for saving
    const unflatten = (flat: Record<string, string>): any => {
        const result: any = {};
        for (const key in flat) {
            const keys = key.split('.');
            let current = result;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (i === keys.length - 1) {
                    current[k] = flat[key];
                } else {
                    current[k] = current[k] || {};
                    current = current[k];
                }
            }
        }
        return result;
    };

    // Handle Language Selection
    const toggleLanguage = async (code: string) => {
        if (selectedLangCodes.includes(code)) {
            setSelectedLangCodes(prev => prev.filter(c => c !== code));
        } else {
            if (selectedLangCodes.length >= 3) {
                toast.warning("En fazla 3 dil seçebilirsiniz");
                return;
            }
            await loadLanguage(code);
            setSelectedLangCodes(prev => [...prev, code]);
        }
    };

    // Flatten source once for mapping
    const flatSource = useMemo(() => {
        return Object.entries(flattenForEdit(sourceData)).map(([key, value]) => ({
            key,
            sourceValue: value
        }));
    }, [sourceData]);

    // Update Translation
    const updateTranslation = (langCode: string, key: string, value: string) => {
        setTranslations(prev => ({
            ...prev,
            [langCode]: {
                ...prev[langCode],
                [key]: value
            }
        }));

        setUnsavedChanges(prev => {
            const set = new Set(prev[langCode]);
            set.add(key);
            return {
                ...prev,
                [langCode]: set
            };
        });
    };

    // Save Changes
    const saveLanguage = async (code: string) => {
        const flatData = translations[code];
        const structuredData = unflatten(flatData);

        try {
            await saveTranslationFile(code, structuredData);
            setUnsavedChanges(prev => {
                const next = { ...prev };
                delete next[code];
                return next;
            });
            toast.success(`${code.toUpperCase()} kaydedildi`);
        } catch (e) {
            toast.error("Kaydetme hatası");
        }
    };

    // Filtering
    const filteredItems = useMemo(() => {
        if (!debouncedSearch) return flatSource;

        const lowerQ = debouncedSearch.toLowerCase();
        return flatSource.filter(item => {
            // Check Key & Source
            if (item.key.toLowerCase().includes(lowerQ)) return true;
            if (item.sourceValue.toLowerCase().includes(lowerQ)) return true;

            // Check Selected Languages
            for (const code of selectedLangCodes) {
                const val = translations[code]?.[item.key];
                if (val && val.toLowerCase().includes(lowerQ)) return true;
            }
            return false;
        });
    }, [flatSource, debouncedSearch, selectedLangCodes, translations]);

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Search Trigger (Enter or Blur)
    const handleSearchCommit = (e: any) => {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1);
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <CardTitle>Çeviri Tablosu</CardTitle>
                        <CardDescription>
                            Kaynak (İngilizce) ve seçilen dilleri karşılaştırmalı düzenleyin.
                        </CardDescription>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ara (Enter)..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchCommit(e)}
                                onBlur={handleSearchCommit}
                            />
                        </div>

                        {/* Language Selector */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-[150px] justify-between">
                                    {selectedLangCodes.length > 0
                                        ? `${selectedLangCodes.length} Dil Seçili`
                                        : "Dil Seç"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Dil ara..." />
                                    <CommandList>
                                        <CommandEmpty>Dil bulunamadı.</CommandEmpty>
                                        <CommandGroup>
                                            {availableLanguages.filter(l => l.code !== 'en').map((lang) => (
                                                <CommandItem
                                                    key={lang.code}
                                                    value={lang.name}
                                                    onSelect={() => toggleLanguage(lang.code)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedLangCodes.includes(lang.code) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {lang.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Anahtar</TableHead>
                                <TableHead className="w-[30%]">🇬🇧 İngilizce (Kaynak)</TableHead>
                                {selectedLangCodes.map(code => (
                                    <TableHead key={code} className="min-w-[250px]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span>{availableLanguages.find(l => l.code === code)?.name}</span>
                                                {unsavedChanges[code]?.size > 0 && (
                                                    <Badge variant="secondary" className="text-xs h-5 px-1">
                                                        Değişti
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => saveLanguage(code)}
                                                disabled={!unsavedChanges[code]?.size}
                                                title="Kaydet"
                                            >
                                                <Save className={cn("h-4 w-4", unsavedChanges[code]?.size ? "text-primary" : "text-muted-foreground")} />
                                            </Button>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={2 + selectedLangCodes.length} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2 + selectedLangCodes.length} className="h-24 text-center">
                                        Sonuç bulunamadı
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedItems.map((item) => (
                                    <TableRow key={item.key}>
                                        <TableCell className="font-mono text-xs text-muted-foreground select-all">
                                            {item.key}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {item.sourceValue}
                                        </TableCell>
                                        {selectedLangCodes.map(code => (
                                            <TableCell key={`${code}-${item.key}`} className="p-2">
                                                <Textarea
                                                    className={cn(
                                                        "min-h-[50px] resize-y text-sm",
                                                        unsavedChanges[code]?.has(item.key) && "border-primary bg-primary/5"
                                                    )}
                                                    value={translations[code]?.[item.key] || ""}
                                                    onChange={(e) => updateTranslation(code, item.key, e.target.value)}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Sayfa {currentPage} / {totalPages} ({filteredItems.length} kayıt)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Önceki
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p = i + 1;
                                if (totalPages > 5) {
                                    // Simple logic to keep current page visible
                                    if (currentPage > 3) p = currentPage - 2 + i;
                                    if (p > totalPages) p = totalPages - (4 - i);
                                }
                                return (
                                    <Button
                                        key={p}
                                        variant={currentPage === p ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(p)}
                                    >
                                        {p}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Sonraki
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
