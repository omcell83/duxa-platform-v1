import { SuperAdminSidebar } from "@/components/super-admin/sidebar";
import { SuperAdminHeader } from "@/components/super-admin/header";
import { redirect } from "next/navigation";
import { getUserWithProfile } from "@/lib/supabase-server";
import { getSecuritySettings } from "@/app/actions/system-settings";
import { SessionTimeoutWatcher } from "@/components/auth/session-timeout-watcher";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, securitySettings] = await Promise.all([
    getUserWithProfile(),
    getSecuritySettings()
  ]);

  // Check if user is authenticated
  if (!userData?.user) {
    redirect("/login?error=unauthorized");
  }

  // Check if user is super_admin
  if (userData.profile?.role !== "super_admin") {
    redirect("/login?error=unauthorized");
  }

  // Check if user is active
  if (!userData.profile?.is_active) {
    redirect("/login?error=account_inactive");
  }

  return (
    <div className="min-h-screen bg-background">
      <SessionTimeoutWatcher
        role={userData.profile?.role || "personnel"}
        settings={securitySettings}
      />
      <div className="flex">
        {/* Sidebar */}
        <SuperAdminSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <SuperAdminHeader />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
