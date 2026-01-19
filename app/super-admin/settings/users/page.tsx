import { getUsers } from "@/app/actions/user-management";
import { UserList } from "@/components/super-admin/users/user-list";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function UsersPage() {
    // Fetch users (only roles: super_admin, owner, tenant_admin, manager)
    // and active users only.
    const users = await getUsers();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                    <Link href="/super-admin/settings">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Personel / Kullanıcı Yönetimi</h1>
                </div>
                <p className="text-muted-foreground ml-10">
                    Sistemdeki yetkili kullanıcıları ve personelleri yönetin.
                </p>
            </div>

            {/* List */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
                <UserList initialUsers={users} />
            </div>
        </div>
    );
}
