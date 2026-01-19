"use client";

import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, KeyRound, ShieldAlert, Edit, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { softDeleteUser, setUserPassword, toggleUser2FA, updateUser } from "@/app/actions/user-management";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface UserActionsMenuProps {
    user: {
        id: string;
        full_name: string;
        email: string;
        role: string;
        phone?: string;
        is_2fa_required?: boolean;
    };
}

export function UserActionsMenu({ user }: UserActionsMenuProps) {
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [open2FADialog, setOpen2FADialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password State
    const [newPassword, setNewPassword] = useState("");

    // Edit State (initialized from user)
    // Using a simple form action approach or state managed inputs

    async function handleDelete() {
        if (!confirm("Bu kullanıcıyı pasifize etmek istediğinize emin misiniz?")) return;
        setIsSubmitting(true);
        try {
            await softDeleteUser(user.id);
            toast.success("Kullanıcı silindi (pasifize edildi).");
            setOpenDeleteDialog(false);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handlePasswordChange() {
        setIsSubmitting(true);
        try {
            await setUserPassword(user.id, newPassword);
            toast.success("Parola güncellendi.");
            setOpenPasswordDialog(false);
            setNewPassword("");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    const [is2FAEnabled, setIs2FAEnabled] = useState(user.is_2fa_required || false);

    // Sync state if user prop changes (e.g. after revalidation)
    useEffect(() => {
        setIs2FAEnabled(user.is_2fa_required || false);
    }, [user.is_2fa_required]);

    async function handle2FAToggle(checked: boolean) {
        // Optimistic update
        const previousState = is2FAEnabled;
        setIs2FAEnabled(checked);

        try {
            await toggleUser2FA(user.id, checked);
            toast.success(`2FA zorunluluğu ${checked ? 'açıldı' : 'kapatıldı'}.`);
        } catch (e: any) {
            // Revert on error
            setIs2FAEnabled(previousState);
            toast.error(e.message);
        }
    }

    async function handleEditSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            const result = await updateUser(null, formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message);
                setOpenEditDialog(false);
            }
        } catch (e: any) {
            toast.error("Beklenmeyen hata.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Menüyü aç</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setOpenEditDialog(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenPasswordDialog(true)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Parola Belirle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen2FADialog(true)}>
                        <ShieldAlert className="mr-2 h-4 w-4" /> 2FA Ayarları
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setOpenDeleteDialog(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Sil (Pasifize Et)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Password Dialog */}
            <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Parola Değiştir</DialogTitle>
                        <DialogDescription>{user.full_name} için yeni bir parola belirleyin.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Yeni Parola</Label>
                        <Input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={6}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenPasswordDialog(false)}>İptal</Button>
                        <Button onClick={handlePasswordChange} disabled={isSubmitting || newPassword.length < 6}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Güncelle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kullanıcıyı Sil</DialogTitle>
                        <DialogDescription>
                            {user.full_name} adlı kullanıcıyı silmek (pasifize etmek) istediğinize emin misiniz? Bu işlem geri alınamaz ancak veritabanından tamamen silinmez.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>İptal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2FA Dialog */}
            <Dialog open={open2FADialog} onOpenChange={setOpen2FADialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>2FA Yapılandırması</DialogTitle>
                        <DialogDescription>
                            {user.full_name} için İki Faktörlü Doğrulama ayarlaması.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-between py-4">
                        <div className="space-y-0.5">
                            <Label>2FA Zorunluluğu</Label>
                            <p className="text-sm text-muted-foreground">Kullanıcı girişinde 2FA zorunlu olsun mu?</p>
                        </div>
                        <Switch
                            checked={is2FAEnabled}
                            onCheckedChange={handle2FAToggle}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setOpen2FADialog(false)}>Kapat</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <input type="hidden" name="userId" value={user.id} />
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-fullName" className="text-right">Ad Soyad</Label>
                            <Input id="edit-fullName" name="fullName" defaultValue={user.full_name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">Email</Label>
                            <Input id="edit-email" name="email" type="email" defaultValue={user.email} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">Telefon</Label>
                            <Input id="edit-phone" name="phone" defaultValue={user.phone || ""} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">Rol</Label>
                            <Select name="role" defaultValue={user.role}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="owner">İşletme Sahibi (Owner)</SelectItem>
                                    <SelectItem value="tenant_admin">Yönetici Admin</SelectItem>
                                    <SelectItem value="manager">Müdür / Personel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Güncelle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
