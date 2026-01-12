"use server";

import { Resend } from "resend";
import { createClient } from '@supabase/supabase-js';

// Resend Key de ortam değişkeninden geliyor
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template helper function
const getEmailHtml = (email: string, lang: string) => {
  const isTr = lang === "tr";
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #05594C 0%, #EF7F1A 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px;">DUXA</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">${isTr ? "Restoran Otomasyon Platformu" : "Restaurant Automation Platform"}</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">${isTr ? "Geleceğe Hoşgeldiniz! 🎉" : "Welcome to the Future! 🎉"}</h2>
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      ${isTr ? "Merhaba," : "Hello,"}
                    </p>
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      ${isTr 
                        ? `Duxa Platform bekleme listesine katıldığınız için teşekkür ederiz! E-posta adresiniz <strong>${email}</strong> başarıyla kaydedildi.`
                        : `Thank you for joining the Duxa Platform waitlist! Your email <strong>${email}</strong> has been successfully registered.`}
                    </p>
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      ${isTr
                        ? "Yeni nesil restoran otomasyon teknolojisini inşa ediyoruz. Devrim niteliğindeki özelliklerimizi başlattığımızda ilk bilgilendirilenlerden biri siz olacaksınız."
                        : "We're building the next generation of restaurant automation technology. You'll be among the first to know when we launch our revolutionary features."}
                    </p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #EF7F1A; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                        <strong>${isTr ? "Sırada Ne Var?" : "What's Next?"}</strong><br>
                        ${isTr 
                          ? "Takipte kalın! Duxa Platform lansmana hazır olduğunda sizi bilgilendireceğiz."
                          : "Stay tuned! We'll notify you as soon as Duxa Platform is ready for launch."}
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Duxa Platform</strong><br>
                      ${isTr ? "Kotor, Karadağ" : "Kotor, Montenegro"}
                    </p>
                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px;">
                      © 2026 DUXA.PRO • ${isTr ? "Güvenli Bulut Sistemi" : "Secure Cloud System"}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

// Mail içerikleri (dile göre)
const emailTemplates: Record<string, {
  subject: string;
  html: (email: string) => string;
}> = {
  en: {
    subject: "Welcome to Duxa Platform 🚀",
    html: (email: string) => getEmailHtml(email, "en")
  },
  tr: {
    subject: "Duxa Platform'a Hoşgeldiniz 🚀",
    html: (email: string) => getEmailHtml(email, "tr")
  },
  de: {
    subject: "Willkommen bei Duxa Platform 🚀",
    html: (email: string) => getEmailHtml(email, "en") // Şimdilik İngilizce
  },
  fr: {
    subject: "Bienvenue sur Duxa Platform 🚀",
    html: (email: string) => getEmailHtml(email, "en") // Şimdilik İngilizce
  },
  lb: { subject: "Wëllkomm bei Duxa Platform 🚀", html: (email: string) => getEmailHtml(email, "en") },
  me: { subject: "Dobrodošli na Duxa Platform 🚀", html: (email: string) => getEmailHtml(email, "en") },
  pt: { subject: "Bem-vindo à Duxa Platform 🚀", html: (email: string) => getEmailHtml(email, "en") },
  nl: { subject: "Welkom bij Duxa Platform 🚀", html: (email: string) => getEmailHtml(email, "en") },
  ru: { subject: "Добро пожаловать в Duxa Platform 🚀", html: (email: string) => getEmailHtml(email, "en") },
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
    const template = emailTemplates[language] || emailTemplates.en;
    
    // Müşteriye mail
    const customerEmailResult = await resend.emails.send({
      from: "Duxa Platform <noreply@duxa.pro>",
      to: email,
      replyTo: "info@duxa.pro",
      subject: template.subject,
      html: template.html(email),
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
