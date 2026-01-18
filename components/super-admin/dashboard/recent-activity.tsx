import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, CreditCard, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

async function getRecentActivity() {
    const supabase = await createClient();

    // Son eklenen işletmeler
    const { data: newTenants } = await supabase
        .from("tenants")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    // Son ödemeler (subscriptions - paid)
    const { data: recentPayments } = await supabase
        .from("subscriptions")
        .select(
            "id, payment_amount, payment_date, tenants(name)"
        )
        .eq("payment_status", "paid")
        .order("payment_date", { ascending: false })
        .limit(5);

    // Verileri birleştirip sıralayalım
    const activities = [
        ...(newTenants?.map((t) => ({
            type: "new_tenant",
            id: t.id,
            title: "Yeni İşletme Kaydı",
            description: `${t.name} sisteme katıldı.`,
            date: t.created_at,
            icon: UserPlus,
            color: "text-blue-500",
        })) || []),
        ...(recentPayments?.map((p) => ({
            type: "payment",
            id: p.id,
            title: "Ödeme Alındı",
            description: `${(p.tenants as any)?.name} - ${new Intl.NumberFormat(
                "tr-TR",
                { style: "currency", currency: "TRY" }
            ).format(p.payment_amount || 0)}`,
            date: p.payment_date, // Note: payment_date might be just Date, created_at is timestamp
            icon: CreditCard,
            color: "text-green-500",
        })) || []),
    ].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
        .slice(0, 10);

    return activities;
}

export async function RecentActivity() {
    const activities = await getRecentActivity();

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Henüz aktivite yok.</p>
                        ) : (
                            activities.map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                                    <div className={`mt-1 bg-muted p-2 rounded-full`}>
                                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {activity.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground/70">
                                            {formatDistanceToNow(new Date(activity.date!), {
                                                addSuffix: true,
                                                locale: tr,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
