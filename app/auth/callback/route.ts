import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Eğer URL'de 'next' parametresi varsa oraya, yoksa dashboard'a yönlendir
  const next = searchParams.get("next") ?? "/dashboard";

  // Origin belirleme: Önce çevresel değişkenden al, yoksa request.url'den
  // Bu sayede reverse proxy (Coolify) arkasında çalışırken doğru domain kullanılır
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Başarılı değişim, kullanıcıyı yönlendir
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Hata durumunda login sayfasına hata mesajıyla dön
  return NextResponse.redirect(`${origin}/login?message=auth-code-error`);
}
