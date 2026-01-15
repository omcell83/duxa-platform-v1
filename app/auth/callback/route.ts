import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Eğer URL'de 'next' parametresi varsa oraya, yoksa dashboard'a yönlendir
  const next = searchParams.get("next") ?? "/dashboard";

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
