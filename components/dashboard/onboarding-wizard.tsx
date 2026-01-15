"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface OnboardingSteps {
  businessInfo: boolean;
  firstCategory: boolean;
  firstProduct: boolean;
  menuTheme: boolean;
  workingHours: boolean;
}

interface TenantData {
  id: string;
  created_at: string;
  onboarding_completed: boolean;
  onboarding_steps: OnboardingSteps | null;
}

export function OnboardingWizard() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingSteps>({
    businessInfo: false,
    firstCategory: false,
    firstProduct: false,
    menuTheme: false,
    workingHours: false,
  });

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        // Get user profile with tenant_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", session.user.id)
          .single();

        if (!profile?.tenant_id) {
          setLoading(false);
          return;
        }

        // Get tenant data
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("id, created_at, onboarding_completed, onboarding_steps")
          .eq("id", profile.tenant_id)
          .single();

        if (!tenantData) {
          setLoading(false);
          return;
        }

        setTenant(tenantData);

        // Parse onboarding steps
        const parsedSteps: OnboardingSteps = tenantData.onboarding_steps
          ? (typeof tenantData.onboarding_steps === "string"
              ? JSON.parse(tenantData.onboarding_steps)
              : tenantData.onboarding_steps)
          : {
              businessInfo: false,
              firstCategory: false,
              firstProduct: false,
              menuTheme: false,
              workingHours: false,
            };

        setSteps(parsedSteps);

        // Check if should show wizard:
        // 1. Not completed
        // 2. Created within last 30 days
        // 3. Not dismissed
        if (!tenantData.onboarding_completed) {
          const createdAt = new Date(tenantData.created_at);
          const now = new Date();
          const daysSinceCreation = Math.floor(
            (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceCreation <= 30) {
            const dismissedKey = `onboarding_dismissed_${tenantData.id}`;
            const dismissed = localStorage.getItem(dismissedKey) === "true";
            setIsDismissed(dismissed);
            setIsVisible(!dismissed);
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setLoading(false);
      }
    }

    checkOnboarding();
  }, []);

  const handleDismiss = () => {
    if (tenant) {
      const dismissedKey = `onboarding_dismissed_${tenant.id}`;
      localStorage.setItem(dismissedKey, "true");
      setIsDismissed(true);
      setIsVisible(false);
    }
  };

  // Calculate progress percentage
  const completedSteps = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const progress = (completedSteps / totalSteps) * 100;

  if (loading || !isVisible || !tenant) {
    return null;
  }

  const stepItems = [
    {
      key: "businessInfo" as const,
      title: "İşletme Bilgilerini Tamamla",
      href: "/dashboard/settings",
      completed: steps.businessInfo,
    },
    {
      key: "firstCategory" as const,
      title: "İlk Kategorini Ekle",
      href: "/dashboard/menu?tab=categories",
      completed: steps.firstCategory,
    },
    {
      key: "firstProduct" as const,
      title: "İlk Ürününü Ekle",
      href: "/dashboard/menu?tab=products",
      completed: steps.firstProduct,
    },
    {
      key: "menuTheme" as const,
      title: "Menü Temasını Seç",
      href: "/dashboard/design",
      completed: steps.menuTheme,
    },
    {
      key: "workingHours" as const,
      title: "Çalışma Saatlerini Gir",
      href: "/dashboard/settings",
      completed: steps.workingHours,
    },
  ];

  return (
    <Card className="mb-6 border-primary/20 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-foreground">
              Hoş Geldiniz! Kurulum Sihirbazı
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              İşletmenizi hızlıca kurmak için aşağıdaki adımları tamamlayın.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">İlerleme</span>
            <span className="font-medium text-foreground">
              {completedSteps}/{totalSteps} Tamamlandı
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {stepItems.map((item, index) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors",
                item.completed
                  ? "opacity-60"
                  : "hover:bg-muted hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2",
                  item.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground bg-background"
                )}
              >
                {item.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "flex-1 font-medium",
                  item.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {item.title}
              </span>
              {!item.completed && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>

        {/* Action Button */}
        {completedSteps < totalSteps && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="text-muted-foreground"
            >
              Daha Sonra
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
