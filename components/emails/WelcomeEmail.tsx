import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Img,
  Hr,
} from "@react-email/components";
import * as React from "react";

// E-posta çevirileri - Tüm diller için
const emailTranslations: Record<
  string,
  {
    subject: string;
    welcomeTitle: string;
    greeting: string;
    thankYou: string;
    emailRegistered: string;
    buildingMessage: string;
    whatsNext: string;
    stayTuned: string;
    companyName: string;
    location: string;
    copyright: string;
    secureSystem: string;
    unsubscribe: string;
    unsubscribeText: string;
    slogan: string;
  }
> = {
  en: {
    subject: "Welcome to Duxa Platform 🚀",
    welcomeTitle: "Welcome to the Future! 🎉",
    greeting: "Hello,",
    thankYou: "Thank you for joining the Duxa Platform waitlist!",
    emailRegistered: "Your email has been successfully registered.",
    buildingMessage:
      "We're building the next generation of restaurant automation technology. You'll be among the first to know when we launch our revolutionary features.",
    whatsNext: "What's Next?",
    stayTuned:
      "Stay tuned! We'll notify you as soon as Duxa Platform is ready for launch.",
    companyName: "Duxa Platform",
    location: "Kotor, Montenegro",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Secure Cloud System",
    unsubscribe: "Unsubscribe",
    unsubscribeText: "Don't want these emails?",
    slogan: "Restaurant Automation Platform",
  },
  tr: {
    subject: "Duxa Platform'a Hoşgeldiniz 🚀",
    welcomeTitle: "Geleceğe Hoşgeldiniz! 🎉",
    greeting: "Merhaba,",
    thankYou: "Duxa Platform bekleme listesine katıldığınız için teşekkür ederiz!",
    emailRegistered: "E-posta adresiniz başarıyla kaydedildi.",
    buildingMessage:
      "Yeni nesil restoran otomasyon teknolojisini inşa ediyoruz. Devrim niteliğindeki özelliklerimizi başlattığımızda ilk bilgilendirilenlerden biri siz olacaksınız.",
    whatsNext: "Sırada Ne Var?",
    stayTuned:
      "Takipte kalın! Duxa Platform lansmana hazır olduğunda sizi bilgilendireceğiz.",
    companyName: "Duxa Platform",
    location: "Kotor, Karadağ",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Güvenli Bulut Sistemi",
    unsubscribe: "Abonelikten Çık",
    unsubscribeText: "Bu e-postaları almak istemiyor musunuz?",
    slogan: "Restoran Otomasyon Platformu",
  },
  de: {
    subject: "Willkommen bei Duxa Platform 🚀",
    welcomeTitle: "Willkommen in der Zukunft! 🎉",
    greeting: "Hallo,",
    thankYou: "Vielen Dank, dass Sie sich der Warteliste der Duxa Platform angeschlossen haben!",
    emailRegistered: "Ihre E-Mail-Adresse wurde erfolgreich registriert.",
    buildingMessage:
      "Wir bauen die nächste Generation der Restaurantautomatisierungstechnologie. Sie werden zu den Ersten gehören, die informiert werden, wenn wir unsere revolutionären Funktionen starten.",
    whatsNext: "Was kommt als Nächstes?",
    stayTuned:
      "Bleiben Sie dran! Wir werden Sie benachrichtigen, sobald die Duxa Platform startbereit ist.",
    companyName: "Duxa Platform",
    location: "Kotor, Montenegro",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Sicheres Cloud-System",
    unsubscribe: "Abmelden",
    unsubscribeText: "Möchten Sie diese E-Mails nicht mehr erhalten?",
    slogan: "Restaurant-Automatisierungsplattform",
  },
  fr: {
    subject: "Bienvenue sur Duxa Platform 🚀",
    welcomeTitle: "Bienvenue dans le futur ! 🎉",
    greeting: "Bonjour,",
    thankYou: "Merci de vous être inscrit sur la liste d'attente de Duxa Platform !",
    emailRegistered: "Votre adresse e-mail a été enregistrée avec succès.",
    buildingMessage:
      "Nous construisons la prochaine génération de technologie d'automatisation des restaurants. Vous serez parmi les premiers informés lorsque nous lancerons nos fonctionnalités révolutionnaires.",
    whatsNext: "Et maintenant ?",
    stayTuned:
      "Restez à l'écoute ! Nous vous informerons dès que Duxa Platform sera prêt à être lancé.",
    companyName: "Duxa Platform",
    location: "Kotor, Monténégro",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Système Cloud Sécurisé",
    unsubscribe: "Se désabonner",
    unsubscribeText: "Vous ne souhaitez plus recevoir ces e-mails ?",
    slogan: "Plateforme d'Automatisation de Restaurants",
  },
  lb: {
    subject: "Wëllkomm bei Duxa Platform 🚀",
    welcomeTitle: "Wëllkomm an der Zukunft! 🎉",
    greeting: "Moien,",
    thankYou: "Merci datt Dir Iech op d'Waardelëscht vun der Duxa Platform ugemellt hutt!",
    emailRegistered: "Är E-Mail Adress gouf erfollegräich registréiert.",
    buildingMessage:
      "Mir bauen déi nächst Generatioun vun der Restaurantautomatiséierungstechnologie. Dir wäert zu deenen Éischte gehéieren, déi informéiert ginn, wa mir eis revolutionär Funktiounen starten.",
    whatsNext: "Wat kënnt als Nächstes?",
    stayTuned:
      "Bleift dran! Mir wäerten Iech benoriichtegen, soubal d'Duxa Platform startbereit ass.",
    companyName: "Duxa Platform",
    location: "Kotor, Montenegro",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Séchert Cloud System",
    unsubscribe: "Ofmellen",
    unsubscribeText: "Wëllt Dir dës E-Maile net méi kréien?",
    slogan: "Restaurant Automatiséierungsplattform",
  },
  me: {
    subject: "Dobrodošli na Duxa Platform 🚀",
    welcomeTitle: "Dobrodošli u budućnost! 🎉",
    greeting: "Zdravo,",
    thankYou: "Hvala što ste se prijavili na listu čekanja Duxa Platform!",
    emailRegistered: "Vaša e-mail adresa je uspješno registrovana.",
    buildingMessage:
      "Gradimo sljedeću generaciju tehnologije za automatizaciju restorana. Bićete među prvima koji će biti obaviješteni kada pokrenemo naše revolucionarne funkcije.",
    whatsNext: "Šta je sljedeće?",
    stayTuned:
      "Budite u toku! Obavijestićemo vas čim Duxa Platform bude spreman za lansiranje.",
    companyName: "Duxa Platform",
    location: "Kotor, Crna Gora",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Siguran Cloud Sistem",
    unsubscribe: "Odjavi se",
    unsubscribeText: "Ne želite više primati ove e-mailove?",
    slogan: "Platforma za Automatizaciju Restorana",
  },
  pt: {
    subject: "Bem-vindo à Duxa Platform 🚀",
    welcomeTitle: "Bem-vindo ao futuro! 🎉",
    greeting: "Olá,",
    thankYou: "Obrigado por se juntar à lista de espera da Duxa Platform!",
    emailRegistered: "Seu endereço de e-mail foi registrado com sucesso.",
    buildingMessage:
      "Estamos construindo a próxima geração de tecnologia de automação de restaurantes. Você estará entre os primeiros a saber quando lançarmos nossos recursos revolucionários.",
    whatsNext: "O que vem a seguir?",
    stayTuned:
      "Fique atento! Notificaremos você assim que a Duxa Platform estiver pronta para o lançamento.",
    companyName: "Duxa Platform",
    location: "Kotor, Montenegro",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Sistema de Nuvem Seguro",
    unsubscribe: "Cancelar inscrição",
    unsubscribeText: "Não deseja mais receber estes e-mails?",
    slogan: "Plataforma de Automação de Restaurantes",
  },
  nl: {
    subject: "Welkom bij Duxa Platform 🚀",
    welcomeTitle: "Welkom in de toekomst! 🎉",
    greeting: "Hallo,",
    thankYou: "Bedankt voor het aanmelden op de wachtlijst van Duxa Platform!",
    emailRegistered: "Uw e-mailadres is succesvol geregistreerd.",
    buildingMessage:
      "We bouwen de volgende generatie restaurantautomatiseringstechnologie. U zult tot de eersten behoren die op de hoogte worden gebracht wanneer we onze revolutionaire functies lanceren.",
    whatsNext: "Wat komt er nu?",
    stayTuned:
      "Blijf op de hoogte! We zullen u op de hoogte stellen zodra Duxa Platform klaar is voor lancering.",
    companyName: "Duxa Platform",
    location: "Kotor, Montenegro",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Veilig Cloud Systeem",
    unsubscribe: "Afmelden",
    unsubscribeText: "Wilt u deze e-mails niet meer ontvangen?",
    slogan: "Restaurantautomatiseringsplatform",
  },
  ru: {
    subject: "Добро пожаловать в Duxa Platform 🚀",
    welcomeTitle: "Добро пожаловать в будущее! 🎉",
    greeting: "Здравствуйте,",
    thankYou: "Спасибо, что присоединились к списку ожидания Duxa Platform!",
    emailRegistered: "Ваш адрес электронной почты успешно зарегистрирован.",
    buildingMessage:
      "Мы создаём следующее поколение технологий автоматизации ресторанов. Вы будете среди первых, кто узнает, когда мы запустим наши революционные функции.",
    whatsNext: "Что дальше?",
    stayTuned:
      "Следите за обновлениями! Мы уведомим вас, как только Duxa Platform будет готов к запуску.",
    companyName: "Duxa Platform",
    location: "Котор, Черногория",
    copyright: "© 2026 DUXA.PRO",
    secureSystem: "Безопасная облачная система",
    unsubscribe: "Отписаться",
    unsubscribeText: "Не хотите получать эти письма?",
    slogan: "Платформа автоматизации ресторанов",
  },
};

interface WelcomeEmailProps {
  email: string;
  language?: string;
  unsubscribeUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  email,
  language = "en",
  unsubscribeUrl = "https://duxa.pro/unsubscribe",
}) => {
  const t = emailTranslations[language] || emailTranslations.en;

  return (
    <Html lang={language}>
      <Head />
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#000000" }}>
        {/* Outer Table - Full Width Background */}
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            backgroundColor: "#000000",
            padding: "40px 20px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <tr>
            <td align="center">
              {/* Main Container Table - 600px width */}
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Header Section - Dark Background with Orange Accent */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#000000",
                      padding: "40px 30px",
                      textAlign: "center",
                      borderTop: "4px solid #EF7F1A",
                    }}
                  >
                    {/* DUXA Logo/Text */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center">
                          <Text
                            style={{
                              margin: "0 0 10px 0",
                              color: "#FFFFFF",
                              fontSize: "36px",
                              fontWeight: "900",
                              letterSpacing: "-1px",
                              fontFamily:
                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                            }}
                          >
                            DUXA
                          </Text>
                          <Text
                            style={{
                              margin: "0",
                              color: "#EF7F1A",
                              fontSize: "14px",
                              fontWeight: "400",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            {t.slogan}
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Main Content Section */}
                <tr>
                  <td style={{ padding: "40px 30px", backgroundColor: "#1a1a1a" }}>
                    {/* Welcome Title */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td>
                          <Text
                            style={{
                              margin: "0 0 20px 0",
                              color: "#FFFFFF",
                              fontSize: "28px",
                              fontWeight: "700",
                              lineHeight: "1.3",
                            }}
                          >
                            {t.welcomeTitle}
                          </Text>
                        </td>
                      </tr>
                    </table>

                    {/* Greeting */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td>
                          <Text
                            style={{
                              margin: "0 0 20px 0",
                              color: "#CCCCCC",
                              fontSize: "16px",
                              lineHeight: "1.6",
                            }}
                          >
                            {t.greeting}
                          </Text>
                        </td>
                      </tr>
                    </table>

                    {/* Thank You Message */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td>
                          <Text
                            style={{
                              margin: "0 0 15px 0",
                              color: "#CCCCCC",
                              fontSize: "16px",
                              lineHeight: "1.6",
                            }}
                          >
                            {t.thankYou}
                          </Text>
                          <Text
                            style={{
                              margin: "0 0 20px 0",
                              color: "#CCCCCC",
                              fontSize: "16px",
                              lineHeight: "1.6",
                            }}
                          >
                            {t.emailRegistered}
                          </Text>
                        </td>
                      </tr>
                    </table>

                    {/* Building Message */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td>
                          <Text
                            style={{
                              margin: "0 0 30px 0",
                              color: "#CCCCCC",
                              fontSize: "16px",
                              lineHeight: "1.6",
                            }}
                          >
                            {t.buildingMessage}
                          </Text>
                        </td>
                      </tr>
                    </table>

                    {/* Highlight Box - What's Next */}
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={{
                        backgroundColor: "#2a2a2a",
                        borderLeft: "4px solid #EF7F1A",
                        borderRadius: "4px",
                      }}
                    >
                      <tr>
                        <td style={{ padding: "20px" }}>
                          <table width="100%" cellPadding="0" cellSpacing="0">
                            <tr>
                              <td>
                                <Text
                                  style={{
                                    margin: "0 0 10px 0",
                                    color: "#EF7F1A",
                                    fontSize: "16px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {t.whatsNext}
                                </Text>
                                <Text
                                  style={{
                                    margin: "0",
                                    color: "#CCCCCC",
                                    fontSize: "15px",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  {t.stayTuned}
                                </Text>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer Section */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#000000",
                      padding: "30px",
                      textAlign: "center",
                      borderTop: "1px solid #333333",
                    }}
                  >
                    {/* Company Info */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center">
                          <Text
                            style={{
                              margin: "0 0 5px 0",
                              color: "#FFFFFF",
                              fontSize: "16px",
                              fontWeight: "600",
                            }}
                          >
                            {t.companyName}
                          </Text>
                          <Text
                            style={{
                              margin: "0 0 20px 0",
                              color: "#999999",
                              fontSize: "14px",
                            }}
                          >
                            {t.location}
                          </Text>
                        </td>
                      </tr>
                    </table>

                    {/* Copyright */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center">
                          <Text
                            style={{
                              margin: "0 0 5px 0",
                              color: "#666666",
                              fontSize: "12px",
                            }}
                          >
                            {t.copyright} • {t.secureSystem}
                          </Text>
                        </td>
                      </tr>
                    </table>

                    {/* Unsubscribe Link */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center" style={{ paddingTop: "20px" }}>
                          <Text
                            style={{
                              margin: "0 0 5px 0",
                              color: "#666666",
                              fontSize: "12px",
                            }}
                          >
                            {t.unsubscribeText}
                          </Text>
                          <Link
                            href={unsubscribeUrl}
                            style={{
                              color: "#EF7F1A",
                              fontSize: "12px",
                              textDecoration: "underline",
                            }}
                          >
                            {t.unsubscribe}
                          </Link>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  );
};

// Export subject function
export const getWelcomeEmailSubject = (language: string = "en"): string => {
  const t = emailTranslations[language] || emailTranslations.en;
  return t.subject;
};
