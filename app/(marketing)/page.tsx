"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- DİL VE ÇEVİRİ AYARLARI ---
const translations: Record<string, { flag: string; title: string; subtitle: string }> = {
  en: { flag: "🇺🇸", title: "System Upgrade in Progress", subtitle: "Building the future of restaurant automation." },
  tr: { flag: "🇹🇷", title: "Sistem Yapılandırması Sürüyor", subtitle: "Restoran otomasyonunun geleceğini inşa ediyoruz." },
  de: { flag: "🇩🇪", title: "Systemaktualisierung läuft", subtitle: "Wir bauen die Zukunft der Restaurantautomatisierung." },
  fr: { flag: "🇫🇷", title: "Mise à niveau du système", subtitle: "Nous construisons l'avenir de l'automatisation." },
  lb: { flag: "🇱🇺", title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun." },
  me: { flag: "🇲🇪", title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana." },
  pt: { flag: "🇵🇹", title: "Atualização do sistema", subtitle: "Construindo o futuro da automação." },
  nl: { flag: "🇳🇱", title: "Systeemupgrade bezig", subtitle: "Bouwen aan de toekomst van restaurantautomatisering." },
  ru: { flag: "🇷🇺", title: "Обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов." },
};

// --- DİNAMİK YÜKLEME MESAJLARI (Cyber Console Style) ---
const loadingMessages = [
  "Çekirdek modüller yükleniyor...",
  "Veritabanı bağlantıları şifreleniyor...",
  "AI Motoru (Gemini) senkronize ediliyor...",
  "Güvenlik duvarı protokolleri aktif...",
  "Kiosk arayüzleri derleniyor...",
  "Bulut sunucu yanıt veriyor...",
  "DUXA Platform v1 başlatılıyor..."
];

export default function ConstructionPage() {
  const [lang, setLang] = useState("en");
  const [msgIndex, setMsgIndex] = useState(0);

  // Dil Algılama
  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    if (translations[browserLang]) {
      setLang(browserLang);
    }
  }, []);

  // Mesaj Döngüsü (Her 3 saniyede bir değişir)
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const t = translations[lang];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-[#EF7F1A] selection:text-white">
      
      {/* --- ARKA PLAN EFEKTLERİ (GÜÇLENDİRİLMİŞ) --- */}
      {/* Grid Ağı */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05594C_1px,transparent_1px),linear-gradient(to_bottom,#05594C_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Hareketli Arka Plan Işıkları */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#05594C]/20 via-transparent to-transparent pointer-events-none"
      />

      {/* --- ANA İÇERİK --- */}
      <div className="z-10 flex flex-col items-center text-center px-4 w-full max-w-4xl">
        
        {/* LOGO (Kalp Atışı Efekti) */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 0 0px #05594C)", "drop-shadow(0 0 15px #05594C)", "drop-shadow(0 0 0px #05594C)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6 relative"
        >
          {/* Duvarın arkasındaki glow */}
          <div className="absolute inset-0 bg-[#05594C] blur-[40px] opacity-30 rounded-full" />
          
          <h1 className="relative text-7xl md:text-9xl font-black tracking-tighter text-white">
            DUXA
          </h1>
          <motion.div 
             animate={{ opacity: [0.5, 1, 0.5] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute -right-4 -bottom-2 text-[#EF7F1A] text-sm md:text-xl tracking-[0.4em] font-bold uppercase"
          >
            PLATFORM
          </motion.div>
        </motion.div>

        {/* Ana Başlık (Maskeleme sorunu için 'pb-2' eklendi) */}
        <motion.h2
          key={lang}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-[#05594C] via-white to-[#EF7F1A] bg-clip-text text-transparent drop-shadow-sm"
        >
          {t.title}
        </motion.h2>

        <motion.p
          key={lang + "sub"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400 text-lg md:text-xl mb-12"
        >
          {t.subtitle}
        </motion.p>

        {/* --- YÜKLEME ALANI (LOADING BAR & TEXT) --- */}
        <div className="w-full max-w-md space-y-3">
          {/* Yükleme Çubuğu */}
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EF7F1A] to-transparent w-1/2"
            />
            <div className="absolute inset-0 bg-[#05594C]/30" />
          </div>

          {/* Değişen Teknik Mesajlar */}
          <div className="h-8 flex items-center justify-center">
             <AnimatePresence mode="wait">
              <motion.span
                key={msgIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[#EF7F1A] font-mono text-sm tracking-wider"
              >
                {">"} {loadingMessages[msgIndex]} <span className="animate-pulse">_</span>
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Dil Seçici (Bayraklar) */}
        <div className="mt-16 flex flex-wrap justify-center gap-4">
          {Object.keys(translations).map((l) => (
            <button 
              key={l} 
              onClick={() => setLang(l)}
              className={`text-2xl hover:scale-125 transition-transform grayscale hover:grayscale-0 ${lang === l ? "grayscale-0 scale-110" : "opacity-50"}`}
              title={l.toUpperCase()}
            >
              {translations[l].flag}
            </button>
          ))}
        </div>

      </div>

      {/* --- FOOTER --- */}
      <div className="absolute bottom-4 w-full text-center">
        <p className="text-gray-600 text-xs font-mono">
          &copy; 2025 DUXA.PRO &bull; Secure System Architecture &bull; Kotor, Montenegro
        </p>
      </div>

    </div>
  );
}