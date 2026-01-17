"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { updateStaffRole, removeStaffAccess, deleteStaff } from "@/app/actions/staff";
import { toast } from "sonner";
import { MoreVertical, Edit, UserX, Trash2, User, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface StaffMember {
  id: string; // Changed from number to string (UUID from profiles.id)
  user_id: string;
  role: "owner" | "manager" | "staff" | "kitchen" | "courier" | "tenant_admin";
  is_active: boolean;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface StaffActionsProps {
  tenantUserId: string; // Deprecated: kept for backwards compatibility, use userId instead
  userId: string; // Profile ID (UUID from profiles.id)
  currentRole: "owner" | "manager" | "staff" | "kitchen" | "courier" | "tenant_admin";
  isCurrentUser: boolean;
  isTenantAdmin: boolean;
  isSuperAdmin: boolean;
  staffMember: StaffMember;
}

const roleLabels: Record<string, string> = {
  owner: "Sahip",
  manager: "Yönetici",
  staff: "Personel",
  kitchen: "Mutfak",
  courier: "Kurye",
};

const roleDescriptions: Record<string, string> = {
  owner: "Tüm yetkilere sahiptir. İşletme ayarlarını yönetebilir, tüm personelleri yönetebilir.",
  manager: "İşletme yönetimi yapabilir, personel ekleyebilir ve siparişleri yönetebilir.",
  staff: "Siparişleri alabilir ve müşteri hizmetleri sağlayabilir.",
  kitchen: "Sadece mutfak siparişlerini görebilir ve hazırlayabilir.",
  courier: "Sadece paket servisi isteyen siparişleri görebilir. Diğer alanlarda yetkisi yoktur.",
};

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  manager: "secondary",
  staff: "outline",
  kitchen: "outline",
  courier: "outline",
};

export function StaffActions({
  tenantUserId, // Deprecated: kept for backwards compatibility
  userId, // Use this instead of tenantUserId
  currentRole,
  isCurrentUser,
  isTenantAdmin,
  isSuperAdmin,
  staffMember,
}: StaffActionsProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  // Get available roles based on user type
  const availableRoles = isTenantAdmin
    ? ["manager", "staff", "kitchen", "courier"]
    : ["owner", "manager", "staff", "kitchen", "courier"];

  const handleRoleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", String(userId)); // Changed from tenantUserId to userId
      formData.append("role", selectedRole);

      const result = await updateStaffRole(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Rol başarıyla güncellendi");
        setRoleDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Rol güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccess = async () => {
    if (
      !confirm(
        "Bu personelin erişimini kaldırmak istediğinize emin misiniz?"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", String(userId)); // Changed from tenantUserId to userId

      const result = await removeStaffAccess(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Erişim başarıyla kaldırıldı");
      }
    } catch (error) {
      console.error("Error removing access:", error);
      toast.error("Erişim kaldırılırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (
      !confirm(
        "Bu personeli kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", String(userId)); // Changed from tenantUserId to userId (profile.id)

      const result = await deleteStaff(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Personel başarıyla silindi");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Personel silinirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const initials = staffMember.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isCurrentUser}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          <DropdownMenuItem
            onClick={() => setDetailDialogOpen(true)}
            disabled={loading}
          >
            <User className="h-4 w-4 mr-2" />
            Kullanıcı Bilgileri
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setRoleDialogOpen(true)}
            disabled={isCurrentUser || loading}
          >
            <Shield className="h-4 w-4 mr-2" />
            Rol Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRemoveAccess}
            disabled={isCurrentUser || loading}
            className="text-destructive"
          >
            <UserX className="h-4 w-4 mr-2" />
            Erişimi Kaldır
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteStaff}
            disabled={isCurrentUser || loading}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Kullanıcıyı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-popover max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Bilgileri</DialogTitle>
            <DialogDescription>
              Personel bilgileri ve yetkileri
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={staffMember.profile?.avatar_url || undefined}
                  alt={staffMember.profile?.full_name || "User"}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">
                  {staffMember.profile?.full_name || "İsimsiz Kullanıcı"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {staffMember.profile?.email || "Email bulunamadı"}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rol</span>
                <Badge variant={roleColors[currentRole] || "outline"}>
                  {roleLabels[currentRole] || currentRole}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {roleDescriptions[currentRole] || "Açıklama bulunamadı"}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Durum</span>
                <Badge variant={staffMember.is_active ? "default" : "secondary"}>
                  {staffMember.is_active ? "Aktif" : "Pasif"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Update Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-popover">
          <DialogHeader>
            <DialogTitle>Rol Düzenle</DialogTitle>
            <DialogDescription>
              Personelin rolünü değiştirin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select
                value={selectedRole}
                onValueChange={(value: any) => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && (
                <p className="text-xs text-muted-foreground mt-2">
                  {roleDescriptions[selectedRole]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button onClick={handleRoleUpdate} disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
