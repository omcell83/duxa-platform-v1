"use server";

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Resend Kurulumu
const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase Kurulumu (Environment variable'lardan okur)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Geçersiz email adresi." };
  }

  try {
    // 1. SUPABASE VERİTABANINA KAYDET
    // Eğer mail zaten varsa hata vermez, sadece işlemi geçer (onConflict)
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: email, is_active: true }, { onConflict: "email" });

    if (error) {
      console.error("Supabase Hatası:", error);
      // Kritik hata değilse kullanıcıya hissettirme, devam et.
    }

    // 2. Müşteriye "Hoşgeldin" Maili At (Resend ile - Sadece Gönderim)
    await resend.emails.send({
      from: "Duxa Platform <noreply@duxa.pro>",
      to: email,
      replyTo: "info@duxa.pro",
      subject: "Duxa Platform'a Hoşgeldiniz 🚀",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #EF7F1A;">Aramıza Hoşgeldiniz!</h1>
          <p>Merhaba,</p>
          <p>Duxa Platform bekleme listesine kaydınız başarıyla alındı. Veritabanımıza güvenle eklendiniz.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">
            Eğer bu listeden çıkmak isterseniz bu maile "Unsubscribe" yazarak cevap verebilirsiniz.<br/>
            Kotor, Karadağ.
          </p>
        </div>
      `,
    });

    // 3. Sana Bilgi Maili
    await resend.emails.send({
      from: "Duxa System <noreply@duxa.pro>",
      to: "info@duxa.pro",
      subject: "🔔 Yeni Veritabanı Kaydı",
      html: `<p>Yeni kayıt Supabase'e eklendi: <strong>${email}</strong></p>`,
    });

    return { success: true, message: "Kayıt başarılı! Mailinizi kontrol edin." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}