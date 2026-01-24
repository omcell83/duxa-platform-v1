"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { LanguageManager } from "@/components/super-admin/language-manager";
import { TranslationEditor } from "@/components/super-admin/translation-editor";

export default function TranslationsPage() {
    // Shared state for selected languages in the editor
    const [selectedLangCodes, setSelectedLangCodes] = useState<string[]>(["tr"]);

    const handleLanguageSelect = (code: string) => {
        if (!selectedLangCodes.includes(code)) {
            // Add to selection if not present
            // Limit to 3 is handled in Editor usually, but we can enforce here too if we want
            if (selectedLangCodes.length < 3) {
                setSelectedLangCodes(prev => [...prev, code]);
            } else {
                // If full, maybe replace the last one or just warn?
                // For better UX, let's just add it and let the editor handle display or limiting
                // Actually user said "max 3 dil", so let's shift if full
                setSelectedLangCodes(prev => [...prev.slice(1), code]);
            }
        }
    };

    return (
        <div className="space-y-8 container mx-auto py-6">
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
                        Sistem dillerini ve çevirilerini yönetin.
                    </p>
                </div>
            </div>

            {/* Language Settings & Sync */}
            <section>
                <LanguageManager onLanguageSelect={handleLanguageSelect} />
            </section>

            {/* Editor */}
            <section>
                <TranslationEditor
                    externalSelectedCodes={selectedLangCodes}
                    onSelectionChange={setSelectedLangCodes}
                />
            </section>
        </div>
    );
}
