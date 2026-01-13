"use server";

import * as React from "react";
import { Resend } from "resend";
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import { WelcomeEmail, getWelcomeEmailSubject } from '@/components/emails/WelcomeEmail';

// Resend Key de ortam değişkeninden geliyor
const resend = new Resend(process.env.RESEND_API_KEY);

// Hata mesajları çevirileri
const errorMessages: Record<string, {
  invalidEmail: string;
  systemError: string;
  configMissing: string;
  dbConnectionError: string;
  mailErrorPartial: string;
  successWithMailCheck: string;
  successWithMailError: string;
}> = {
  en: {
    invalidEmail: "Invalid email address.",
    systemError: "System error:",
    configMissing: "Configuration missing.",
    dbConnectionError: "Database connection error.",
    mailErrorPartial: "Registration successful! (There may be an issue with email sending, please try again.)",
    successWithMailCheck: "Registration successful! Check your email.",
    successWithMailError: "Registration successful! (There may be an issue with email sending, please try again.)",
  },
  tr: {
    invalidEmail: "Geçersiz email adresi.",
    systemError: "Sistem hatası:",
    configMissing: "Yapılandırma eksik.",
    dbConnectionError: "Veritabanı bağlantı hatası.",
    mailErrorPartial: "Kayıt başarılı! (Mail gönderiminde sorun olabilir, lütfen tekrar deneyin.)",
    successWithMailCheck: "Kayıt başarılı! Mail kutunuzu kontrol edin.",
    successWithMailError: "Kayıt başarılı! (Mail gönderiminde sorun olabilir, lütfen tekrar deneyin.)",
  },
  de: {
    invalidEmail: "Ungültige E-Mail-Adresse.",
    systemError: "Systemfehler:",
    configMissing: "Konfiguration fehlt.",
    dbConnectionError: "Datenbankverbindungsfehler.",
    mailErrorPartial: "Registrierung erfolgreich! (Es könnte ein Problem beim Versenden der E-Mail geben, bitte versuchen Sie es erneut.)",
    successWithMailCheck: "Registrierung erfolgreich! Überprüfen Sie Ihre E-Mail.",
    successWithMailError: "Registrierung erfolgreich! (Es könnte ein Problem beim Versenden der E-Mail geben, bitte versuchen Sie es erneut.)",
  },
  fr: {
    invalidEmail: "Adresse e-mail invalide.",
    systemError: "Erreur système:",
    configMissing: "Configuration manquante.",
    dbConnectionError: "Erreur de connexion à la base de données.",
    mailErrorPartial: "Inscription réussie! (Il peut y avoir un problème avec l'envoi de l'e-mail, veuillez réessayer.)",
    successWithMailCheck: "Inscription réussie! Vérifiez votre e-mail.",
    successWithMailError: "Inscription réussie! (Il peut y avoir un problème avec l'envoi de l'e-mail, veuillez réessayer.)",
  },
  lb: {
    invalidEmail: "Ongülteg E-Mail Adress.",
    systemError: "System Fehler:",
    configMissing: "Konfiguratioun feelt.",
    dbConnectionError: "Datebankverbindungs Fehler.",
    mailErrorPartial: "Registréierung erfollegräich! (Et kéint e Problem beim Verschécken vun der E-Mail ginn, probéiert w.e.g. nach emol.)",
    successWithMailCheck: "Registréierung erfollegräich! Kontrolléiert Är E-Mail.",
    successWithMailError: "Registréierung erfollegräich! (Et kéint e Problem beim Verschécken vun der E-Mail ginn, probéiert w.e.g. nach emol.)",
  },
  me: {
    invalidEmail: "Nevažeća e-mail adresa.",
    systemError: "Sistemska greška:",
    configMissing: "Konfiguracija nedostaje.",
    dbConnectionError: "Greška u vezi sa bazom podataka.",
    mailErrorPartial: "Registracija uspješna! (Možda postoji problem sa slanjem e-pošte, molimo pokušajte ponovo.)",
    successWithMailCheck: "Registracija uspješna! Proverite svoju e-poštu.",
    successWithMailError: "Registracija uspješna! (Možda postoji problem sa slanjem e-pošte, molimo pokušajte ponovo.)",
  },
  pt: {
    invalidEmail: "Endereço de e-mail inválido.",
    systemError: "Erro do sistema:",
    configMissing: "Configuração ausente.",
    dbConnectionError: "Erro de conexão com o banco de dados.",
    mailErrorPartial: "Inscrição bem-sucedida! (Pode haver um problema com o envio do e-mail, por favor, tente novamente.)",
    successWithMailCheck: "Inscrição bem-sucedida! Verifique seu e-mail.",
    successWithMailError: "Inscrição bem-sucedida! (Pode haver um problema com o envio do e-mail, por favor, tente novamente.)",
  },
  nl: {
    invalidEmail: "Ongeldig e-mailadres.",
    systemError: "Systeemfout:",
    configMissing: "Configuratie ontbreekt.",
    dbConnectionError: "Databaseverbindingsfout.",
    mailErrorPartial: "Registratie succesvol! (Er kan een probleem zijn met het verzenden van de e-mail, probeer het opnieuw.)",
    successWithMailCheck: "Registratie succesvol! Controleer uw e-mail.",
    successWithMailError: "Registratie succesvol! (Er kan een probleem zijn met het verzenden van de e-mail, probeer het opnieuw.)",
  },
  ru: {
    invalidEmail: "Неверный адрес электронной почты.",
    systemError: "Системная ошибка:",
    configMissing: "Отсутствует конфигурация.",
    dbConnectionError: "Ошибка подключения к базе данных.",
    mailErrorPartial: "Регистрация успешна! (Возможна проблема с отправкой электронной почты, пожалуйста, попробуйте снова.)",
    successWithMailCheck: "Регистрация успешна! Проверьте свою электронную почту.",
    successWithMailError: "Регистрация успешна! (Возможна проблема с отправкой электронной почты, пожалуйста, попробуйте снова.)",
  },
};

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
  const t = errorMessages[language] || errorMessages.en;

  if (!email || !email.includes("@")) {
    return { success: false, message: t.invalidEmail };
  }

  // Supabase işlemi
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Ortam değişkenleri eksik!");
      return { success: false, message: `${t.systemError} ${t.configMissing}` };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase'e bağlanılıyor... Email:", email, "Language:", language);
    
    // Upsert işlemi (language ile birlikte)
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, is_active: true, language }, { onConflict: "email" });

    if (dbError) {
      console.error("Veritabanı Hatası:", dbError.message);
      return { success: false, message: `${t.systemError} ${dbError.message}` };
    }
    
    console.log("✅ Veritabanı işlemi başarılı");

  } catch (error: any) {
    console.error("Veritabanı Hatası (catch):", error);
    return { success: false, message: t.dbConnectionError };
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
      return { success: true, message: t.mailErrorPartial };
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

    return { success: true, message: t.successWithMailCheck };

  } catch (error: any) {
    console.error("Mail Gönderim Hatası (Exception):", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Exception fırlatıldı ama DB kaydı başarılı - kullanıcıyı bilgilendir
    return { success: true, message: t.successWithMailError };
  }
}
