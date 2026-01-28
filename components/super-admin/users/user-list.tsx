"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserCircle, Shield, Briefcase, UserCog, User } from "lucide-react";
import { AddUserModal } from "./add-user-modal";
import { UserActionsMenu } from "./user-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Switch } from "@/components/ui/switch";
import { toggleUserStatus } from "@/app/actions/user-management";
import { toast } from "sonner";

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone?: string;
    is_active: boolean;
    is_2fa_required?: boolean;
    created_at: string;
    avatar_url?: string;
}

interface UserListProps {
    initialUsers: any[];
}

export function UserList({ initialUsers }: UserListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setLoadingMap(prev => ({ ...prev, [userId]: true }));
        try {
            const nextStatus = !currentStatus;
            const result = await toggleUserStatus(userId, nextStatus);
            if (result.success) {
                toast.success(nextStatus ? "Kullanıcı aktif edildi." : "Kullanıcı pasif edildi.");
                // Update local state for immediate feedback
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: nextStatus } : u));
            } else {
                toast.error("İşlem başarısız oldu.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoadingMap(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Simple robust search
    const filteredUsers = users.filter((user) =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "super_admin":
                return <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200"><Shield className="w-3 h-3 mr-1" /> Super Admin</Badge>;
            case "owner":
                return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200"><Briefcase className="w-3 h-3 mr-1" /> Owner</Badge>;
            case "tenant_admin":
                return <Badge className="bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 border-indigo-200"><UserCog className="w-3 h-3 mr-1" /> Yön. Admin</Badge>;
            case "manager":
                return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200"><User className="w-3 h-3 mr-1" /> Müdür</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="İsim veya email ara..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <AddUserModal />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kullanıcı</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="hidden md:table-cell">İletişim</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>2FA</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Sonuç bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className={user.is_active ? "" : "opacity-60 bg-muted/30"}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.avatar_url || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {user.full_name?.charAt(0).toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{user.full_name}</span>
                                                <span className="text-xs text-muted-foreground md:hidden">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                        <div className="flex flex-col">
                                            <span>{user.email}</span>
                                            {user.phone && <span className="text-xs">{user.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={user.is_active}
                                                onCheckedChange={() => handleToggleStatus(user.id, user.is_active)}
                                                disabled={loadingMap[user.id]}
                                            />
                                            <span className="text-xs min-w-[40px]">
                                                {user.is_active ? "Aktif" : "Pasif"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_2fa_required ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 h-5">Aktif</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 h-5">Pasif</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <UserActionsMenu user={user} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
