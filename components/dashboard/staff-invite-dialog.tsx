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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteStaff } from "@/app/actions/staff";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface StaffInviteDialogProps {
  children?: React.ReactNode;
}

export function StaffInviteDialog({ children }: StaffInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "staff" as "owner" | "manager" | "staff" | "kitchen" | "courier",
    fullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("email", formData.email);
      form.append("role", formData.role);
      form.append("fullName", formData.fullName);

      const result = await inviteStaff(form);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Personel başarıyla davet edildi");
        setOpen(false);
        setFormData({ email: "", role: "staff", fullName: "" });
      }
    } catch (error) {
      console.error("Error inviting staff:", error);
      toast.error("Personel davet edilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Yeni Personel Davet Et
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-popover">
        <DialogHeader>
          <DialogTitle>Yeni Personel Davet Et</DialogTitle>
          <DialogDescription>
            Sisteme kayıtlı bir kullanıcıyı işletmenize personel olarak ekleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ad Soyad"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Rol seçin" />
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
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Davet ediliyor..." : "Davet Et"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
