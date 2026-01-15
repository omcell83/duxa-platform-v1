import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffInviteDialog } from "@/components/dashboard/staff-invite-dialog";
import { StaffActions } from "@/components/dashboard/staff-actions";
import { UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StaffMember {
  id: number;
  user_id: string;
  role: "owner" | "manager" | "staff" | "kitchen" | "courier";
  is_active: boolean;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

const roleLabels: Record<string, string> = {
  owner: "Sahip",
  manager: "Yönetici",
  staff: "Personel",
  kitchen: "Mutfak",
  courier: "Kurye",
};

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  manager: "secondary",
  staff: "outline",
  kitchen: "outline",
  courier: "outline",
};

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?redirect=/dashboard/settings/staff");
  }

  // Get tenant_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", session.user.id)
    .single();

  if (!profile?.tenant_id) {
    return (
      <div className="bg-background min-h-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            Tenant bilgisi bulunamadı
          </div>
        </div>
      </div>
    );
  }

  // Check if user is tenant_admin
  const userRole = (profile.role || "").trim().toLowerCase();
  const isAdmin = userRole === "tenant_admin";

  // Get staff members (tenant_users joined with profiles)
  const { data: tenantUsers } = await supabase
    .from("tenant_users")
    .select("id, user_id, role, is_active")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  // Get user IDs
  const userIds = tenantUsers?.map((tu) => tu.user_id) || [];

  // Get profiles for these users
  let profilesMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, any>);
    }
  }

  // Combine data
  const staffMembers: StaffMember[] =
    tenantUsers?.map((tu) => ({
      id: tu.id,
      user_id: tu.user_id,
      role: tu.role as StaffMember["role"],
      is_active: tu.is_active,
      profile: profilesMap[tu.user_id] || null,
    })) || [];

  return (
    <div className="bg-background min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Personel Yönetimi</h1>
            <p className="text-muted-foreground mt-2">
              İşletmenizdeki personelleri yönetin ve yeni personel davet edin
            </p>
          </div>
          {isAdmin && <StaffInviteDialog />}
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Personel Listesi</CardTitle>
            <CardDescription>
              İşletmenizdeki tüm personeller
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staffMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Personel bulunamadı
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Henüz hiç personel eklenmemiş
                </p>
                {isAdmin && (
                  <StaffInviteDialog>
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      İlk Personeli Davet Et
                    </Button>
                  </StaffInviteDialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Durum</TableHead>
                    {isAdmin && <TableHead className="text-right">İşlemler</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((member) => {
                    const isCurrentUser = member.user_id === session.user.id;
                    const initials = member.profile?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?";

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={member.profile?.avatar_url || undefined}
                                alt={member.profile?.full_name || "User"}
                              />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.profile?.full_name || "İsimsiz Kullanıcı"}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Siz)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.profile?.email || "Email bulunamadı"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleColors[member.role] || "outline"}>
                            {roleLabels[member.role] || member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.is_active ? "default" : "secondary"}
                          >
                            {member.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <StaffActions
                              tenantUserId={member.id}
                              currentRole={member.role}
                              isCurrentUser={isCurrentUser}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
