"use server";

import { Resend } from "resend";
import { supabase } from "@/lib/supabase"; // Az önce oluşturduğumuz güvenli dosya

// Resend Key de ortam değişkeninden geliyor
const resend = new Resend(process.env.RESEND_API_KEY);

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Geçersiz email adresi." };
  }

  try {
    // --- 1. SUPABASE KAYDI ---
    console.log("Supabase'e bağlanılıyor...");
    
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: email, is_active: true }, { onConflict: "email" });

    if (dbError) {
      console.error("Veritabanı Hatası:", dbError.message);
      return { success: false, message: "Sistem hatası: Veritabanına erişilemedi." };
    }

    // --- 2. MAİL GÖNDERİMİ ---
    await resend.emails.send({
      from: "Duxa Platform <noreply@duxa.pro>",
      to: email,
      replyTo: "info@duxa.pro",
      subject: "Duxa Platform'a Hoşgeldiniz 🚀",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #EF7F1A;">Kaydınız Başarılı!</h1>
          <p>Duxa Platform bekleme listesine eklendiniz.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Kotor, Karadağ.</p>
        </div>
      `,
    });
    
    // Admin bildirimi
    await resend.emails.send({
      from: "Duxa System <noreply@duxa.pro>",
      to: "info@duxa.pro",
      subject: "🔔 Yeni Kayıt",
      html: `<p>Yeni kayıt: <strong>${email}</strong></p>`,
    });

    return { success: true, message: "Kayıt başarılı! Mail kutunuzu kontrol edin." };

  } catch (error: any) {
    console.error("Bilinmeyen Hata:", error);
    return { success: false, message: "Beklenmedik bir hata oluştu." };
  }
}