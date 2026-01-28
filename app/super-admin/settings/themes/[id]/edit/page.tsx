import { getThemeById } from "@/app/actions/themes";
import { ThemeEditForm } from "@/components/super-admin/settings/themes/theme-edit-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ThemeEditPage({ params }: PageProps) {
    const { id } = await params;
    const theme = await getThemeById(id);

    if (!theme) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                    <Link href="/super-admin/settings/themes">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Temayı Düzenle</h1>
                </div>
                <p className="text-muted-foreground ml-10">
                    "{theme.name}" temasının özelliklerini ve renklerini özelleştirin.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <ThemeEditForm theme={theme} />
            </div>
        </div>
    );
}
