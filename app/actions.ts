"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Geçersiz email adresi." };
  }

  try {
    // 1. Sana bilgi maili atar (Yeni kayıt var!)
    await resend.emails.send({
      from: "Duxa System <noreply@duxa.pro>",
      to: "info@duxa.pro", // Cloudflare üzerinden senin Gmail'ine düşecek
      replyto: email, // Yanıtla dersen müşteriye gider
      subject: "🔔 Yeni Bekleme Listesi Kaydı",
      html: `<p>Yeni bir potansiyel müşteri kayıt oldu:</p><p><strong>Email:</strong> ${email}</p>`,
    });

    // 2. Müşteriye "Hoşgeldin" maili atar
    await resend.emails.send({
      from: "Duxa Platform <noreply@duxa.pro>",
      to: email,
      replyto: "info@duxa.pro", // Müşteri yanıtla derse sana gelir
      subject: "Duxa Platform'a Hoşgeldiniz 🚀",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #EF7F1A;">Aramıza Hoşgeldiniz!</h1>
          <p>Merhaba,</p>
          <p>Duxa Platform'un bekleme listesine kaydınız başarıyla alındı. Restoran teknolojilerinde devrim yaratacak modüllerimiz hazır olduğunda <strong>ilk sizin haberiniz olacak.</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Kotor, Karadağ ofisimizden sevgilerle.<br/>Duxa Team</p>
        </div>
      `,
    });

    return { success: true, message: "Kayıt başarılı! Mail kutunuzu kontrol edin." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}