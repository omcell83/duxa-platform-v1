import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Force dynamic rendering - prevent caching for auth callback
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  
  // Origin belirleme (Prod ve Local uyumlu)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://duxa.pro";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // HEMEN ARDINDAN: URL parametresindeki type değerini kontrol et
      // Eğer type === 'recovery' ise, başka hiçbir şeye bakmaksızın (next parametresini ezerek)
      // şifre yenileme sayfasına yönlendir
      if (type === "recovery") {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocal = origin.includes("localhost");
        
        if (isLocal) {
          return NextResponse.redirect(`${origin}/login/update-password`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/login/update-password`);
        } else {
          return NextResponse.redirect(`${origin}/login/update-password`);
        }
      }

      // Diğer durumlarda normal next yönlendirmesini yap
      const next = searchParams.get("next") ?? "/dashboard";
      const forwardedHost = request.headers.get("x-forwarded-host");
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
