import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Origin'i request'ten alma, env'den alacağız.
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Origin belirleme (Prod ve Local uyumlu)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://duxa.pro";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Başarılıysa, yönlendirilecek adresi oluştur
      const forwardedHost = request.headers.get("x-forwarded-host"); // Load balancer arkası için
      const isLocal = origin.includes("localhost");
      
      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      // HATA LOGU (Coolify Loglarında görünecek)
      console.error("Auth Callback Error:", error.message);
      console.error("Auth Callback Error Details:", JSON.stringify(error, null, 2));
    }
  }

  // Hata varsa login sayfasına yönlendir
  return NextResponse.redirect(`${origin}/login?message=auth-code-error`);
}
