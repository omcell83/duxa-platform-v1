import { getSecuritySettings } from "@/app/actions/system-settings";
import { SecuritySettingsForm } from "@/components/super-admin/settings/security-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SecuritySettingsPage() {
    const settings = await getSecuritySettings();

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
                    <h1 className="text-3xl font-bold text-foreground">Güvenlik Ayarları</h1>
                </div>
                <p className="text-muted-foreground ml-10">
                    Sistem genelindeki güvenlik politikalarını ve erişim kurallarını yapılandırın.
                </p>
            </div>

            {/* Main Form Area */}
            <div className="mx-auto max-w-4xl">
                <SecuritySettingsForm initialSettings={settings} />
            </div>
        </div>
    );
}
