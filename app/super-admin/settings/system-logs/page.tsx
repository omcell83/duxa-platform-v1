import { getSystemLogs } from "@/app/actions/system-logs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, XCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* 
  User Requirements:
  - Critical: Red text
  - Success/Stable: Green text
  - Medium (Warning): Yellow text
  - IP and unauthorized access logging
*/

export default async function SystemLogsPage() {
    const { logs, count } = await getSystemLogs(100);

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case "critical":
                return "text-red-600 font-bold";
            case "error":
                return "text-red-500";
            case "warning":
                return "text-yellow-500";
            case "info":
                return "text-green-500";
            default:
                return "text-muted-foreground";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "critical":
                return <ShieldAlert className="h-4 w-4 text-red-600" />;
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case "info":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Sistem Logları</h1>
                <p className="text-muted-foreground mt-1">
                    Sistem olayları, giriş kayıtları ve güvenlik uyarıları.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Son Kayıtlar</CardTitle>
                    <CardDescription>
                        Toplam {count} kayıt bulundu. Son 100 işlem görüntüleniyor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Tarih</TableHead>
                                    <TableHead className="w-[120px]">Durum</TableHead>
                                    <TableHead className="w-[150px]">Olay Tipi</TableHead>
                                    <TableHead>Mesaj</TableHead>
                                    <TableHead className="w-[120px]">IP Adresi</TableHead>
                                    <TableHead className="w-[150px]">Kullanıcı</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(log.created_at), "d MMMM yyyy HH:mm", {
                                                    locale: tr,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getSeverityIcon(log.severity)}
                                                    <span className={`${getSeverityStyles(log.severity)} capitalize`}>
                                                        {log.severity}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.event_type}</Badge>
                                            </TableCell>
                                            <TableCell className={getSeverityStyles(log.severity)}>
                                                {log.message}
                                                {log.details && Object.keys(log.details).length > 0 && (
                                                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                                                        {JSON.stringify(log.details).slice(0, 50)}
                                                        {JSON.stringify(log.details).length > 50 ? '...' : ''}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.ip_address || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.details?.email || log.user_id?.slice(0, 8) || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            Henüz log kaydı bulunmamaktadır.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
