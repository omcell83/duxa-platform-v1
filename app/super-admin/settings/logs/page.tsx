import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Shield, User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function SystemLogsPage() {
    const supabase = await createClient();

    // Fetch logs with user info if possible (need to join or fetch separately, supabase join syntax is complex with auth schema)
    // Since user_id references auth.users, we can't easily join in standard query unless we have a view or using rpc.
    // However, we might have profiles table. Let's assume we fetch logs and then maybe map users or just show ID.
    // Ideally, system_logs should have a view or we just show the raw log for now.
    // Let's select * from system_logs.

    const { data: logs, error } = await supabase
        .from("system_logs")
        .select("*")
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
                                    <TableHead className="w-[120px]">Seviye</TableHead>
                                    <TableHead className="w-[200px]">Olay Tipi</TableHead>
                                    <TableHead>Mesaj</TableHead>
                                    <TableHead className="w-[150px]">Kullanıcı / IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className={getRowClass(log.severity)}>
                                            <TableCell className="font-mono text-sm">
                                                {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: tr })}
                                            </TableCell>
                                            <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                                            <TableCell className="font-medium text-xs font-mono">{log.event_type}</TableCell>
                                            <TableCell className="max-w-[400px] truncate" title={log.message}>
                                                {log.message}
                                                {log.metadata?.email_attempt && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Email: {log.metadata.email_attempt}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {log.user_id && (
                                                        <div className="flex items-center gap-1 text-primary">
                                                            <User className="w-3 h-3" />
                                                            <span title={log.user_id} className="truncate w-24">{log.user_id.substring(0, 8)}...</span>
                                                        </div>
                                                    )}
                                                    {log.ip_address && (
                                                        <span className="font-mono text-muted-foreground">{log.ip_address}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
