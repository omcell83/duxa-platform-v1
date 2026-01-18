import {
  AppWindow,
  CreditCard,
  Plus,
  Settings,
  Users,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActions() {
  const actions = [
    {
      title: "İşletme Ekle",
      icon: Plus,
      href: "/super-admin/tenants/new",
      variant: "default",
    },
    {
      title: "İşletmeler",
      icon: AppWindow,
      href: "/super-admin/tenants",
      variant: "outline",
    },
    {
      title: "Envanter",
      icon: Package,
      href: "/super-admin/inventory",
      variant: "outline",
    },
    {
      title: "Ayarlar",
      icon: Settings,
      href: "/super-admin/settings",
      variant: "outline",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hızlı İşlemler</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className="w-full">
            <Button
              variant={action.variant as "default" | "outline"}
              className="w-full justify-start h-auto py-4 px-4"
            >
              <action.icon className="mr-2 h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.title}</span>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
