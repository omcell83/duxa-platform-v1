import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import fs from "fs";
import path from "path";

export default async function DocumentationRoutesPage() {
  let systemMap: any = { files: [], routes: [] };
  try {
    const filePath = path.join(process.cwd(), "docs", "system-map.json");
    const fileContents = fs.readFileSync(filePath, "utf-8");
    systemMap = JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading system-map.json:", error);
  }

  const routes = systemMap.routes || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Site Haritası</h1>
        <p className="text-muted-foreground mt-1">
          Uygulamadaki tüm route'lar ve açıklamaları
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route'lar ({routes.length})</CardTitle>
          <CardDescription>
            Uygulamadaki tüm sayfalar ve URL'leri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Henüz route bulunamadı
              </div>
            ) : (
              routes.map((route: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={route.url.replace("https://duxa.pro", "") || "#"}
                      className="flex items-center gap-2 text-sm font-mono text-primary hover:underline break-all"
                      target={route.url.startsWith("http") ? "_blank" : undefined}
                    >
                      {route.url}
                      {route.url.startsWith("http") && (
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      )}
                    </Link>
                  </div>
                  <div className="flex-shrink-0 text-sm text-muted-foreground max-w-md">
                    {route.description}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
