import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Shield, User, Building } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function SystemLogsPage() {
    const supabase = await createClient();

    // Fetch logs with user and tenant info using relations
    const { data: logs, error } = await supabase
        .from("system_logs")
        .select(`
            *,
            profiles(full_name),
            tenants(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching logs:", error);
    }

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Kritik</Badge>;
            case "WARNING":
                return <Badge variant="outline" className="text-yellow-500 border-yellow-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Uyarı</Badge>;
            case "SUCCESS":
                return <Badge variant="outline" className="text-green-500 border-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Başarılı</Badge>;
            case "INFO":
            default:
                return <Badge variant="secondary" className="flex items-center gap-1"><Info className="w-3 h-3" /> Bilgi</Badge>;
        }
    };

    const getRowClass = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return "bg-destructive/5 hover:bg-destructive/10";
            case "SUCCESS":
                return "hover:bg-green-500/5";
            case "WARNING":
                return "hover:bg-yellow-500/5";
            default:
                return "hover:bg-muted/50";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    Sistem Logları
                </h1>
                <p className="text-muted-foreground mt-1">
                    Sistem aktiviteleri, giriş kayıtları ve güvenlik olayları.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Son 100 Log Kaydı</CardTitle>
                    <CardDescription>
                        Tüm kritik değişiklikler ve erişim logları burada listelenir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Tarih</TableHead>
                                    <TableHead className="w-[100px]">Seviye</TableHead>
                                    <TableHead className="w-[150px]">Olay Tipi</TableHead>
                                    <TableHead className="w-[200px]">Mesaj</TableHead>
                                    <TableHead className="w-[180px]">Kullanıcı</TableHead>
                                    <TableHead className="w-[180px]">İşletme</TableHead>
                                    <TableHead className="w-[120px]">IP Adresi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs && logs.length > 0 ? (
                                    logs.map((log: any) => (
                                        <TableRow key={log.id} className={getRowClass(log.severity)}>
                                            <TableCell className="font-mono text-xs">
                                                {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: tr })}
                                            </TableCell>
                                            <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                                            <TableCell className="font-medium text-xs font-mono">{log.event_type}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm" title={log.message}>
                                                {log.message}
                                                {log.metadata?.email_attempt && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Email: {log.metadata.email_attempt}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {log.profiles?.full_name ? (
                                                        <div className="flex items-center gap-1.5 font-medium text-sm">
                                                            <User className="w-3.5 h-3.5 text-primary" />
                                                            {log.profiles.full_name}
                                                        </div>
                                                    ) : log.user_id ? (
                                                        <div className="text-[10px] font-mono text-muted-foreground">
                                                            ID: {log.user_id.substring(0, 8)}...
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Anonim</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {log.tenants?.name ? (
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <Building className="w-3.5 h-3.5 text-blue-500" />
                                                            {log.tenants.name}
                                                        </div>
                                                    ) : log.tenant_id ? (
                                                        <div className="text-[10px] font-mono text-muted-foreground">
                                                            ID: {log.tenant_id}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {log.ip_address || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Henüz log kaydı bulunmuyor.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
