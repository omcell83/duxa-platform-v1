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
} from "@/components/ui/dropdown-menu";
import { updateStaffRole, removeStaffAccess } from "@/app/actions/staff";
import { toast } from "sonner";
import { MoreVertical, Edit, UserX } from "lucide-react";

interface StaffActionsProps {
  tenantUserId: number;
  currentRole: "owner" | "manager" | "staff" | "kitchen" | "courier";
  isCurrentUser: boolean;
}

const roleLabels: Record<string, string> = {
  owner: "Sahip",
  manager: "Yönetici",
  staff: "Personel",
  kitchen: "Mutfak",
  courier: "Kurye",
};

export function StaffActions({
  tenantUserId,
  currentRole,
  isCurrentUser,
}: StaffActionsProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  const handleRoleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("tenantUserId", tenantUserId.toString());
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
      formData.append("tenantUserId", tenantUserId.toString());

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
            onClick={() => setRoleDialogOpen(true)}
            disabled={isCurrentUser || loading}
          >
            <Edit className="h-4 w-4 mr-2" />
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
        </DropdownMenuContent>
      </DropdownMenu>

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
                  <SelectItem value="owner">Sahip</SelectItem>
                  <SelectItem value="manager">Yönetici</SelectItem>
                  <SelectItem value="staff">Personel</SelectItem>
                  <SelectItem value="kitchen">Mutfak</SelectItem>
                  <SelectItem value="courier">Kurye</SelectItem>
                </SelectContent>
              </Select>
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
