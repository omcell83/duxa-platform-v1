import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Code, Layout, Settings, Database, Component } from "lucide-react";
import fs from "fs";
import path from "path";

const typeIcons: Record<string, React.ReactNode> = {
  page: <FileText className="h-4 w-4" />,
  layout: <Layout className="h-4 w-4" />,
  route: <Code className="h-4 w-4" />,
  action: <Settings className="h-4 w-4" />,
  utility: <Database className="h-4 w-4" />,
  component: <Component className="h-4 w-4" />,
  type: <Code className="h-4 w-4" />,
  style: <FileText className="h-4 w-4" />,
  schema: <Database className="h-4 w-4" />,
  middleware: <Settings className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  page: "Sayfa",
  layout: "Layout",
  route: "Route",
  action: "Server Action",
  utility: "Utility",
  component: "Bileşen",
  type: "Tip",
  style: "Stil",
  schema: "Şema",
  middleware: "Middleware",
};

export default async function DocumentationFilesPage() {
  let systemMap: any = { files: [], routes: [] };
  try {
    const filePath = path.join(process.cwd(), "docs", "system-map.json");
    const fileContents = fs.readFileSync(filePath, "utf-8");
    systemMap = JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading system-map.json:", error);
  }

  const files = systemMap.files || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dosya Ağacı</h1>
        <p className="text-muted-foreground mt-1">
          Projedeki tüm dosyalar ve açıklamaları
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dosyalar ({files.length})</CardTitle>
          <CardDescription>
            Projedeki tüm dosyaların listesi ve açıklamaları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Dosya Yolu
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Dosya Tipi
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Açıklama
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      Henüz dosya bulunamadı
                    </td>
                  </tr>
                ) : (
                  files.map((file: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-sm text-foreground">
                        {file.path}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {typeIcons[file.type] || <FileText className="h-4 w-4" />}
                          </span>
                          <span className="text-sm text-foreground">
                            {typeLabels[file.type] || file.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {file.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
