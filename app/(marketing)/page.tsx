"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Cpu, Database, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag } from "@/components/Flag";

// --- TİP TANIMLAMALARI ---
type LangData = {
  name: string;
  title: string;
  subtitle: string;
  messages: string[];
  durations: number[];
  subscribeText: string;
  emailPlaceholder: string;
  signingUp: string;
  successMessage: string;
  errorMessage: string;
};

// --- ÇEVİRİLER ---
const translations: Record<string, LangData> = {
  en: { 
    name: "English", 
    title: "System Upgrade in Progress", 
    subtitle: "Building the future of restaurant automation.",
    messages: ["Initializing core modules...", "Encrypting database connections...", "Syncing AI Engine (Gemini)...", "Activating security protocols...", "Compiling Kiosk interfaces...", "Optimizing hardware drivers...", "Deploying cloud infrastructure..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5],
    subscribeText: "Subscribe",
    emailPlaceholder: "Your email address...",
    signingUp: "Signing up...",
    successMessage: "Success! Check your email.",
    errorMessage: "An error occurred. Please try again."
  },
  tr: { 
    name: "Türkçe", 
    title: "Sistem Yapılandırması Sürüyor", 
    subtitle: "Restoran otomasyonunun geleceğini inşa ediyoruz.",
    messages: ["Çekirdek modüller başlatılıyor...", "Veritabanı bağlantıları şifreleniyor...", "Yapay Zeka (Gemini) senkronize ediliyor...", "Güvenlik protokolleri devreye alınıyor...", "Kiosk arayüzleri derleniyor...", "Donanım sürücüleri optimize ediliyor...", "Bulut altyapısı dağıtılıyor..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5],
    subscribeText: "Abone Ol",
    emailPlaceholder: "E-posta adresiniz...",
    signingUp: "Kayıt Yapılıyor...",
    successMessage: "Kaydınız alındı! Mailinizi kontrol edin.",
    errorMessage: "Bir hata oluştu. Lütfen tekrar deneyin."
  },
  de: { 
    name: "Deutsch", 
    title: "Systemaktualisierung läuft", 
    subtitle: "Wir bauen die Zukunft der Restaurantautomatisierung.",
    messages: ["Kernmodule werden initialisiert...", "Datenbankverbindungen verschlüsseln...", "KI-Engine wird synchronisiert...", "Sicherheitsprotokolle aktivieren...", "Kiosk-Schnittstellen kompilieren...", "Hardware-Treiber optimieren...", "Cloud-Infrastruktur bereitstellen..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5],
    subscribeText: "Abonnieren",
    emailPlaceholder: "Ihre E-Mail-Adresse...",
    signingUp: "Wird angemeldet...",
    successMessage: "Erfolg! Überprüfen Sie Ihre E-Mail.",
    errorMessage: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
  },
  fr: { 
    name: "Français", 
    title: "Mise à niveau du système", 
    subtitle: "Nous construisons l'avenir de l'automatisation.",
    messages: ["Initialisation des modules principaux...", "Chiffrement des connexions...", "Synchronisation de l'IA...", "Activation des protocoles de sécurité...", "Compilation des interfaces Kiosk...", "Optimisation des pilotes matériels...", "Déploiement de l'infrastructure cloud..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5],
    subscribeText: "S'abonner",
    emailPlaceholder: "Votre adresse e-mail...",
    signingUp: "Inscription en cours...",
    successMessage: "Succès! Vérifiez votre e-mail.",
    errorMessage: "Une erreur s'est produite. Veuillez réessayer."
  },
  lb: { name: "Lëtzebuergesch", title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun.", messages: ["Kärmoduler initialiséieren...", "Datebankverbindunge verschlésselen...", "AI Engine synchroniséieren...", "Sécherheetsprotokoller aktivéieren...", "Kiosk Interfaces kompiléieren...", "Hardware Treiber optiméieren...", "Cloud Infrastruktur deployéieren..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Abonnéieren", emailPlaceholder: "Är E-Mail Adress...", signingUp: "Wird agemellt...", successMessage: "Succès! Kontrolléiert Är E-Mail.", errorMessage: "E Fehler ass geschitt. Probéiert w.e.g. nach emol." },
  me: { name: "Crnogorski", title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana.", messages: ["Inicijalizacija osnovnih modula...", "Šifriranje veza baze podataka...", "Sinhronizacija AI motora...", "Aktiviranje sigurnosnih protokola...", "Kompajliranje interfejsa kioska...", "Optimizacija hardverskih drajvera...", "Primena cloud infrastrukture..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Pretplatite se", emailPlaceholder: "Vaša e-pošta...", signingUp: "Prijavljivanje...", successMessage: "Uspeh! Proverite svoju e-poštu.", errorMessage: "Došlo je do greške. Molimo pokušajte ponovo." },
  pt: { name: "Português", title: "Atualização do sistema", subtitle: "Construindo o futuro da automação.", messages: ["Inicializando módulos principais...", "Criptografando conexões...", "Sincronizando Motor de IA...", "Ativando protocolos de segurança...", "Compilando interfaces de quiosque...", "Otimizando drivers de hardware...", "Implantando infraestrutura cloud..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Inscrever-se", emailPlaceholder: "Seu endereço de e-mail...", signingUp: "Inscrevendo...", successMessage: "Sucesso! Verifique seu e-mail.", errorMessage: "Ocorreu um erro. Por favor, tente novamente." },
  nl: { name: "Nederlands", title: "Systeemupgrade bezig", subtitle: "Bouwen aan de toekomst van restaurantautomatisering.", messages: ["Kernmodules initialiseren...", "Databaseverbindingen versleutelen...", "AI Engine synchroniseren...", "Beveiligingsprotocollen activeren...", "Kiosk-interfaces compileren...", "Hardware drivers optimaliseren...", "Cloud infrastructuur implementeren..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Abonneren", emailPlaceholder: "Uw e-mailadres...", signingUp: "Aanmelden...", successMessage: "Succes! Controleer uw e-mail.", errorMessage: "Er is een fout opgetreden. Probeer het opnieuw." },
  ru: { name: "Русский", title: "Обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов.", messages: ["Инициализация основных модулей...", "Шифрование соединений...", "Синхронизация ИИ...", "Активация протоколов безопасности...", "Компиляция интерфейсов киоска...", "Оптимизация драйверов оборудования...", "Развертывание облачной инфраструктуры..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Подписаться", emailPlaceholder: "Ваш адрес электронной почты...", signingUp: "Регистрация...", successMessage: "Успех! Проверьте свою электронную почту.", errorMessage: "Произошла ошибка. Пожалуйста, попробуйте снова." },
};

// Bayrak pozisyonları (daire şeklinde)
const getFlagPosition = (index: number, total: number, radius: number = 60) => {
  // 60px yarıçap ile daha sıkı bir daire
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // -90° başlangıç (saat 12 yönü)
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};

export default function ConstructionPage() {
  const [lang, setLang] = useState("en");
  const [msgIndex, setMsgIndex] = useState(0);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error">("success");
  const langKeys = Object.keys(translations);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split("-")[0];
      if (translations[browserLang]) setLang(browserLang);
      else setLang("en");
    }
  }, []);

  useEffect(() => {
    const t = translations[lang];
    if (!t || !t.messages[msgIndex]) return;

    const duration = t.durations[msgIndex] * 1000;
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (100 / (duration / 50));
      });
    }, 50);

    const messageTimeout = setTimeout(() => {
      setMsgIndex((prev) => (prev + 1) % t.messages.length);
      setProgress(0);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(messageTimeout);
    };
  }, [lang, msgIndex]);

  const t = translations[lang];

  return (
    // ANA CONTAINER: h-screen (Sabit yükseklik) ve overflow-hidden (Kaydırma yok)
    <div className="relative h-screen flex flex-col items-center bg-black text-white font-sans selection:bg-[#EF7F1A] selection:text-white overflow-hidden">
      
      {/* --- CSS STYLES --- */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 4s linear infinite;
        }
      `}</style>

      {/* --- ARKA PLAN (SABİT) --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Network Ağı */}
        <svg className="absolute inset-0 w-full h-full opacity-20" style={{ mixBlendMode: 'screen' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#05594C" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#EF7F1A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#05594C" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {[
            { x: 10, y: 20 }, { x: 30, y: 15 }, { x: 50, y: 25 }, { x: 70, y: 18 }, { x: 90, y: 22 },
            { x: 15, y: 50 }, { x: 35, y: 55 }, { x: 55, y: 48 }, { x: 75, y: 52 }, { x: 85, y: 45 },
            { x: 20, y: 80 }, { x: 40, y: 75 }, { x: 60, y: 82 }, { x: 80, y: 78 },
          ].map((node, i) => (
            <g key={i}>
              <circle cx={`${node.x}%`} cy={`${node.y}%`} r="3" fill="#05594C" opacity="0.4">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
              </circle>
              {[ { x: 30, y: 15 }, { x: 50, y: 25 }, { x: 35, y: 55 }, { x: 55, y: 48 } ].slice(0, 2).map((target, j) => {
                if (i < 5) return null;
                return (
                  <line key={j} x1={`${node.x}%`} y1={`${node.y}%`} x2={`${target.x}%`} y2={`${target.y}%`} stroke="url(#lineGradient)" strokeWidth="1" opacity="0.2">
                     <animate attributeName="opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite" begin={`${(i + j) * 0.3}s`} />
                  </line>
                );
              })}
            </g>
          ))}
        </svg>

        {/* Grid ve Blobs */}
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#05594C_1px,transparent_1px),linear-gradient(to_bottom,#05594C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_30%,transparent_100%)]" />
        {[
          { pos: { top: '25%', left: '25%' }, size: 500, color: '#05594C', duration: 20, delay: 0 },
          { pos: { bottom: '25%', right: '25%' }, size: 450, color: '#EF7F1A', duration: 25, delay: 2 },
        ].map((blob, i) => (
          <motion.div
            key={i}
            animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0], opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
            transition={{ duration: blob.duration, repeat: Infinity, ease: "easeInOut", delay: blob.delay }}
            className="absolute rounded-full blur-[160px]"
            style={{ ...blob.pos, width: `${blob.size}px`, height: `${blob.size}px`, backgroundColor: blob.color }}
          />
        ))}

        {/* İkonlar */}
        <div className="absolute inset-0 opacity-10">
          <Code className="absolute top-32 left-32 w-16 h-16 text-[#05594C]" />
          <Cpu className="absolute top-64 right-40 w-14 h-14 text-[#EF7F1A]" />
          <Database className="absolute bottom-48 left-40 w-16 h-16 text-[#05594C]" />
          <Shield className="absolute bottom-32 right-48 w-14 h-14 text-[#EF7F1A]" />
        </div>
      </div>

      {/* --- ORTA BÖLÜM: (FLEX-1 ile ekranın ortasına odaklanır) --- */}
      <div className="z-10 flex flex-1 flex-col items-center justify-center w-full max-w-6xl px-4 gap-8">
        
        {/* LOGO & BAŞLIKLAR */}
        <div className="text-center flex flex-col items-center">
            <motion.h1 
              className="text-7xl md:text-9xl font-black tracking-tighter relative mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#05594C] via-white to-[#EF7F1A] animate-gradient-x"
              animate={{ 
                scale: [1, 1.05, 1],
                filter: ["drop-shadow(0 0 10px rgba(5,89,76,0.3))", "drop-shadow(0 0 30px rgba(5,89,76,0.8))", "drop-shadow(0 0 10px rgba(5,89,76,0.3))"]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              DUXA
            </motion.h1>

            <motion.h2
              key={lang}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-bold mb-2 pb-2 text-transparent bg-clip-text animate-gradient-x bg-gradient-to-r from-[#05594C] via-white to-[#EF7F1A] text-center"
            >
              {t.title}
            </motion.h2>

            <motion.p
              key={lang + "sub"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 text-lg md:text-2xl font-light text-center max-w-3xl"
            >
              {t.subtitle}
            </motion.p>
        </div>

        {/* MESAJ BAR & İKONLAR */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
          <div className="relative w-full">
            <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-full shadow-xl overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-[#05594C]/30 via-[#EF7F1A]/40 to-[#05594C]/30"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
              <div className="relative px-4 py-3 md:px-6 md:py-4 flex items-center gap-4">
                <motion.span 
                  className="w-2 h-2 rounded-full bg-[#EF7F1A] flex-shrink-0 z-10"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={lang + msgIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 font-mono text-xs md:text-base tracking-wide z-10 text-white truncate"
                  >
                    {t.messages[msgIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Yazılım/Donanım Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-8"
          >
            <div className="flex items-center gap-2 text-gray-500 hover:text-[#05594C] transition-colors">
              <Code className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider font-semibold">Software</span>
            </div>
            <div className="w-px h-4 md:h-6 bg-zinc-700" />
            <div className="flex items-center gap-2 text-gray-500 hover:text-[#EF7F1A] transition-colors">
              <Cpu className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider font-semibold">Hardware</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- ALT BÖLÜM: FORM ve BAYRAKLAR (Daha kompakt) --- */}
      <div className="z-20 w-full flex flex-col items-center justify-center pb-6 md:pb-10 gap-6">
        
        {/* FORM (Küçültülmüş ve Compact) */}
        <div className="w-full max-w-sm px-4">
           <form onSubmit={async (e) => {
            e.preventDefault();
            const formElement = e.currentTarget;
            const formData = new FormData(formElement);
            formData.append("language", lang);
            const btn = document.getElementById('submitBtn') as HTMLButtonElement;
            if(btn) btn.disabled = true;
            const originalText = btn?.textContent || t.subscribeText;
            if(btn) btn.textContent = t.signingUp;
            
            try {
              const { joinWaitlist } = await import("../actions");
              const result = await joinWaitlist(formData);
              if (!result) throw new Error("No response");
              
              setDialogType(result.success ? "success" : "error");
              setDialogMessage(result.message || (result.success ? t.successMessage : t.errorMessage));
              setDialogOpen(true);
              if (result.success) {
                if(btn) btn.textContent = "✓";
                if (formElement) formElement.reset();
                setTimeout(() => { if(btn) { btn.disabled = false; btn.textContent = originalText; } }, 2000);
              } else {
                 if(btn) { btn.disabled = false; btn.textContent = originalText; }
              }
            } catch (error) {
              setDialogType("error");
              setDialogMessage(t.errorMessage);
              setDialogOpen(true);
              if(btn) { btn.disabled = false; btn.textContent = originalText; }
            }
          }} 
          className="flex flex-col sm:flex-row gap-2 scale-90 md:scale-100 origin-bottom"
          >
            <input 
              type="email" 
              name="email" 
              placeholder={t.emailPlaceholder} 
              required
              className="flex-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#EF7F1A] transition-colors shadow-lg"
            />
            <button 
              id="submitBtn"
              type="submit" 
              className="bg-[#EF7F1A] hover:bg-[#d66e12] text-black font-bold px-6 py-2 rounded-full transition-colors shadow-lg hover:shadow-[#EF7F1A]/50 text-sm whitespace-nowrap"
            >
              {t.subscribeText}
            </button>
          </form>
        </div>

        {/* BAYRAK & FOOTER GRUBU */}
        <div className="relative flex flex-col items-center gap-4">
          {/* Bayrak Menüsü */}
          <div className="relative flex items-center justify-center" style={{ width: '60px', height: '60px' }}>
            <motion.div className="relative z-[60]">
               <motion.div onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="cursor-pointer relative group">
                  <Flag countryCode={lang} size={40} className="drop-shadow-2xl hover:scale-110 transition-transform" />
                  <motion.div
                    className="absolute border border-[#EF7F1A] rounded-full pointer-events-none"
                    style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', top: '-4px', left: '-4px' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
               </motion.div>
            </motion.div>

            {/* Diğer Bayraklar */}
            <AnimatePresence>
              {isLangMenuOpen && (
                <>
                  {langKeys.filter((key) => key !== lang).map((key, index) => {
                    const otherLangs = langKeys.filter((k) => k !== lang);
                    const totalOtherFlags = otherLangs.length; // 8 bayrak
                    
                    // Radius 60px olarak güncellendi (daha sıkı)
                    const pos = getFlagPosition(index, totalOtherFlags, 60);
                    
                    const angle = (index * 360) / totalOtherFlags;
                    const isClockwise = angle >= 180;
                    
                    return (
                      <motion.div
                        key={key}
                        className="absolute"
                        style={{ 
                          left: '50%', top: '50%', 
                          marginLeft: '-16px', marginTop: '-16px', // 32px Flag için offset
                          zIndex: 55 
                        }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: isClockwise ? -180 : 180 }}
                        animate={{ x: pos.x, y: pos.y, opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: isClockwise ? 180 : -180 }}
                        transition={{ duration: 0.4, delay: index * 0.02, type: "spring" }}
                      >
                        <Flag 
                          countryCode={key} 
                          size={32} 
                          onClick={() => { setLang(key); setIsLangMenuOpen(false); setMsgIndex(0); }}
                          className="cursor-pointer hover:scale-125 transition-transform drop-shadow-xl"
                        />
                      </motion.div>
                    );
                  })}
                </>
              )}
            </AnimatePresence>
          </div>

          <p className="text-zinc-600 text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-center px-4">
            &copy; 2026 DUXA.PRO
          </p>
        </div>
      </div>

      {/* --- MODAL --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white w-[90%] md:w-full max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className={dialogType === "success" ? "text-[#EF7F1A]" : "text-red-500"}>
              {dialogType === "success" ? "✅ " + (t.name === "Türkçe" ? "Başarılı" : "Success") : "❌ " + (t.name === "Türkçe" ? "Hata" : "Error")}
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">{dialogMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}