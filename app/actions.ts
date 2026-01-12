"use server";

import { Resend } from "resend";
import { createClient } from '@supabase/supabase-js';

// Resend Key de ortam değişkeninden geliyor
const resend = new Resend(process.env.RESEND_API_KEY);

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Geçersiz email adresi." };
  }

  try {
    // --- 1. SUPABASE KAYDI ---
    // createClient'i fonksiyon içinde oluştur (build-time baking'i önlemek için)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Ortam değişkenleri eksik!");
      console.log("SUPABASE_URL (ilk 5 karakter):", supabaseUrl ? supabaseUrl.substring(0, 5) : "YOK");
      return { success: false, message: "Sistem hatası: Yapılandırma eksik." };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase'e bağlanılıyor...");
    console.log("SUPABASE_URL (ilk 5 karakter):", supabaseUrl.substring(0, 5));
    console.log("Email:", email);
    
    // Upsert işlemi
    const { data, error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: email, is_active: true }, { onConflict: "email" })
      .select();

    if (dbError) {
      console.error("=== VERİTABANI HATASI ===");
      console.error("Hata Mesajı:", dbError.message);
      console.error("Hata Kodu:", dbError.code || "N/A");
      console.error("Hata Detayı:", dbError.details || "N/A");
      console.error("Hata Hint:", dbError.hint || "N/A");
      
      // RLS hatası kontrolü
      if (dbError.message?.includes("new row violates row-level security") || 
          dbError.message?.includes("RLS") ||
          dbError.code === "42501") {
        console.error("SORUN: RLS (Row Level Security) politikası eksik veya yanlış!");
        console.error("ÇÖZÜM: SUPABASE_RLS_COMPLETE.sql dosyasındaki SQL komutlarını Supabase SQL Editor'da çalıştırın.");
        return { 
          success: false, 
          message: "RLS Politikası Hatası: Lütfen Supabase SQL Editor'da RLS politikalarını kontrol edin." 
        };
      }
      
      return { success: false, message: `Sistem hatası: ${dbError.message}` };
    }
    
    console.log("✅ Veritabanı işlemi başarılı:", data);

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