"use server";

import * as React from "react";
import { Resend } from "resend";
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import { WelcomeEmail, getWelcomeEmailSubject } from '@/components/emails/WelcomeEmail';

// Resend Key de ortam değişkeninden geliyor
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template helper function - Using React Email Component
const getEmailHtml = async (email: string, lang: string) => {
  const unsubscribeUrl = `https://duxa.pro/unsubscribe?email=${encodeURIComponent(email)}&lang=${lang}`;
  const html = await render(
    React.createElement(WelcomeEmail, {
      email,
      language: lang,
      unsubscribeUrl,
    })
  );
  return html;
};

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;
  const language = (formData.get("language") as string) || "en";

  if (!email || !email.includes("@")) {
    return { success: false, message: "Geçersiz email adresi." };
  }

  // Supabase işlemi
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Ortam değişkenleri eksik!");
      return { success: false, message: "Sistem hatası: Yapılandırma eksik." };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase'e bağlanılıyor... Email:", email, "Language:", language);
    
    // Upsert işlemi (language ile birlikte)
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, is_active: true, language }, { onConflict: "email" });

    if (dbError) {
      console.error("Veritabanı Hatası:", dbError.message);
      return { success: false, message: `Sistem hatası: ${dbError.message}` };
    }
    
    console.log("✅ Veritabanı işlemi başarılı");

  } catch (error: any) {
    console.error("Veritabanı Hatası (catch):", error);
    return { success: false, message: "Veritabanı bağlantı hatası." };
  }

  // Mail gönderimi (ayrı try-catch)
  try {
    // E-posta HTML'ini oluştur
    const emailHtml = await getEmailHtml(email, language);
    const emailSubject = getWelcomeEmailSubject(language);
    
    // Müşteriye mail
    const customerEmailResult = await resend.emails.send({
      from: "Duxa Platform <noreply@duxa.pro>",
      to: email,
      replyTo: "info@duxa.pro",
      subject: emailSubject,
      html: emailHtml,
    });
    
    if (customerEmailResult.error) {
      console.error("Müşteri Mail Hatası:", customerEmailResult.error);
      // Mail gönderilemedi ama DB kaydı başarılı - kullanıcıyı bilgilendir
      return { success: true, message: "Kayıt başarılı! (Mail gönderiminde sorun olabilir, lütfen tekrar deneyin.)" };
    }
    
    console.log("✅ Müşteriye mail gönderildi, ID:", customerEmailResult.data?.id);

    // Admin bildirimi (hata olsa bile devam et)
    try {
      const adminEmailResult = await resend.emails.send({
        from: "Duxa System <noreply@duxa.pro>",
        to: "info@duxa.pro",
        subject: `🔔 Yeni Kayıt (${language.toUpperCase()})`,
        html: `<p>Yeni kayıt: <strong>${email}</strong><br>Dil: <strong>${language}</strong></p>`,
      });
      
      if (adminEmailResult.error) {
        console.error("Admin Mail Hatası (kritik değil):", adminEmailResult.error);
      } else {
        console.log("✅ Admin'e bildirim gönderildi, ID:", adminEmailResult.data?.id);
      }
    } catch (adminError: any) {
      console.error("Admin Mail Exception (kritik değil):", adminError);
      // Admin mail'i gönderilemedi ama müşteri mail'i gönderildi - yine de başarılı say
    }

    return { success: true, message: "Kayıt başarılı! Mail kutunuzu kontrol edin." };

  } catch (error: any) {
    console.error("Mail Gönderim Hatası (Exception):", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Exception fırlatıldı ama DB kaydı başarılı - kullanıcıyı bilgilendir
    return { success: true, message: "Kayıt başarılı! (Mail gönderiminde sorun olabilir, lütfen tekrar deneyin.)" };
  }
}
