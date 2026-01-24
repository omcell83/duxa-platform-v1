"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { LanguageManager } from "@/components/super-admin/language-manager";
import { TranslationEditor } from "@/components/super-admin/translation-editor";

export default function TranslationsPage() {
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
                <LanguageManager />
            </section>

            {/* Editor */}
            <section>
                <TranslationEditor />
            </section>
        </div>
    );
}
