"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Download, Upload, Check, X, RefreshCw, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { TranslationEditor } from "@/components/super-admin/translation-editor";

export default function TranslationsPage() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/super-admin/settings">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Çeviri Yönetimi</h1>
                    <p className="text-muted-foreground mt-1">
                        Platform dillerini yönetin ve AI destekli çeviriler yapın
                    </p>
                </div>
            </div>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        Desteklenen Diller
                    </CardTitle>
                    <CardDescription>
                        Kaynak dosya: <code className="bg-muted px-2 py-1 rounded">i18n/en.json</code>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { code: "en", country: "gb", name: "İngilizce" },
                            { code: "de", country: "de", name: "Almanca" },
                            { code: "fr", country: "fr", name: "Fransızca" },
                            { code: "lb", country: "lu", name: "Lüksemburgca" },
                            { code: "tr", country: "tr", name: "Türkçe" },
                            { code: "me", country: "me", name: "Karadağca" },
                            { code: "mt", country: "mt", name: "Maltaca" },
                            { code: "ru", country: "ru", name: "Rusça" },
                        ].map((lang) => (
                            <div
                                key={lang.code}
                                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                            >
                                <div className="text-2xl">
                                    {lang.country === "gb" ? "🇬🇧" :
                                        lang.country === "de" ? "🇩🇪" :
                                            lang.country === "fr" ? "🇫🇷" :
                                                lang.country === "lu" ? "🇱🇺" :
                                                    lang.country === "tr" ? "🇹🇷" :
                                                        lang.country === "me" ? "🇲🇪" :
                                                            lang.country === "mt" ? "🇲🇹" :
                                                                lang.country === "ru" ? "🇷🇺" : "🌐"}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{lang.name}</div>
                                    <div className="text-xs text-muted-foreground">{lang.code}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Translation Editor */}
            <TranslationEditor />
        </div>
    );
}
