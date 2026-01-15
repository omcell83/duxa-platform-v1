"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect, Suspense } from "react";

function TenantsSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Debounced URL update (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      router.push(`/super-admin/tenants?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="İşletme adı, yasal isim, telefon veya email ile ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}

export function TenantsSearch() {
  return (
    <Suspense fallback={
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="İşletme adı, yasal isim, telefon veya email ile ara..."
          disabled
          className="pl-10 pr-20"
        />
        <Button
          variant="outline"
          size="sm"
          disabled
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          Ara
        </Button>
      </div>
    }>
      <TenantsSearchForm />
    </Suspense>
  );
}
