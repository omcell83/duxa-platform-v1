"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe } from "lucide-react"; // İkon seti

// --- DİL VE ÇEVİRİ AYARLARI ---
type LangData = {
  flag: string;
  name: string;
  title: string;
  subtitle: string;
  messages: string[];
};

const translations: Record<string, LangData> = {
  en: { 
    flag: "🇺🇸", name: "English", 
    title: "System Upgrade in Progress", 
    subtitle: "Building the future of restaurant automation.",
    messages: ["Loading core modules...", "Encrypting database connections...", "Syncing AI Engine (Gemini)...", "Activating security protocols...", "Compiling Kiosk interfaces..."]
  },
  tr: { 
    flag: "🇹🇷", name: "Türkçe", 
    title: "Sistem Yapılandırması Sürüyor", 
    subtitle: "Restoran otomasyonunun geleceğini inşa ediyoruz.",
    messages: ["Çekirdek modüller yükleniyor...", "Veritabanı bağlantıları şifreleniyor...", "Yapay Zeka (Gemini) senkronize ediliyor...", "Güvenlik protokolleri devreye alınıyor...", "Kiosk arayüzleri derleniyor..."]
  },
  de: { 
    flag: "🇩🇪", name: "Deutsch", 
    title: "Systemaktualisierung läuft", 
    subtitle: "Wir bauen die Zukunft der Restaurantautomatisierung.",
    messages: ["Kernmodule werden geladen...", "Datenbankverbindungen verschlüsseln...", "KI-Engine wird synchronisiert...", "Sicherheitsprotokolle aktivieren...", "Kiosk-Schnittstellen kompilieren..."]
  },
  fr: { 
    flag: "🇫🇷", name: "Français", 
    title: "Mise à niveau du système", 
    subtitle: "Nous construisons l'avenir de l'automatisation.",
    messages: ["Chargement des modules principaux...", "Chiffrement des connexions...", "Synchronisation de l'IA...", "Activation des protocoles de sécurité...", "Compilation des interfaces Kiosk..."]
  },
  lb: { flag: "🇱🇺", name: "Lëtzebuergesch", title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun.", messages: ["Kärmoduler lueden...", "Datebankverbindunge verschlésselen...", "AI Engine synchroniséieren...", "Sécherheetsprotokoller aktivéieren...", "Kiosk Interfaces kompiléieren..."] },
  me: { flag: "🇲🇪", name: "Crnogorski", title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana.", messages: ["Učitavanje osnovnih modula...", "Šifriranje veza baze podataka...", "Sinhronizacija AI motora...", "Aktiviranje sigurnosnih protokola...", "Kompajliranje interfejsa kioska..."] },
  pt: { flag: "🇵🇹", name: "Português", title: "Atualização do sistema", subtitle: "Construindo o futuro da automação.", messages: ["Carregando módulos principais...", "Criptografando conexões...", "Sincronizando Motor de IA...", "Ativando protocolos de segurança...", "Compilando interfaces de quiosque..."] },
  nl: { flag: "🇳🇱", name: "Nederlands", title: "Systeemupgrade bezig", subtitle: "Bouwen aan de toekomst van restaurantautomatisering.", messages: ["Kernmodules laden...", "Databaseverbindingen versleutelen...", "AI Engine synchroniseren...", "Beveiligingsprotocollen activeren...", "Kiosk-interfaces compileren..."] },
  ru: { flag: "🇷🇺", name: "Русский", title: "Обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов.", messages: ["Загрузка основных модулей...", "Шифрование соединений...", "Синхронизация ИИ...", "Активация протоколов безопасности...", "Компиляция интерфейсов киоска..."] },
};

export default function ConstructionPage() {
  const [lang, setLang] = useState("en");
  const [msgIndex, setMsgIndex] = useState(0);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Dil Algılama
  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    if (translations[browserLang]) {
      setLang(browserLang);
    }
  }, []);

  // Mesaj Döngüsü (Her 4 saniyede bir değişir)
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % translations[lang].messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [lang]); // Dil değişince döngüyü yenile

  const t = translations[lang];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-[#EF7F1A] selection:text-white">
      
      {/* --- CSS STYLE FOR GRADIENT TEXT ANIMATION --- */}
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

      {/* --- HAREKETLİ ARKA PLAN (GERİ GELDİ) --- */}
      <div className="absolute inset-0 z-0">
        {/* Grid Ağı */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#05594C_1px,transparent_1px),linear-gradient(to_bottom,#05594C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Hareketli Toplar (Blobs) */}
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#05594C] blur-[150px]" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 50, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#EF7F1A] blur-[150px]" 
        />
      </div>

      {/* --- DİL MENÜSÜ (DROPDOWN) --- */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative">
            <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 px-4 py-2 rounded-full hover:border-[#EF7F1A] transition-colors"
            >
                <span className="text-xl">{t.flag}</span>
                <span className="text-sm font-medium uppercase hidden md:inline-block">{lang}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLangMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isLangMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
                    >
                        {Object.keys(translations).map((key) => (
                            <button
                                key={key}
                                onClick={() => { setLang(key); setIsLangMenuOpen(false); setMsgIndex(0); }}
                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-800 text-left transition-colors border-b border-zinc-800 last:border-0"
                            >
                                <span className="text-xl">{translations[key].flag}</span>
                                <span className="text-sm text-gray-300">{translations[key].name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* --- ANA İÇERİK --- */}
      <div className="z-10 flex flex-col items-center text-center px-4 w-full max-w-5xl">
        
        {/* LOGO (Kalp Atışı Efekti) */}
        <motion.div
          animate={{ scale: [1, 1.02, 1], filter: ["drop-shadow(0 0 0px #05594C)", "drop-shadow(0 0 20px #05594C)", "drop-shadow(0 0 0px #05594C)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 relative"
        >
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white">
            DUXA
          </h1>
          <div className="absolute -right-2 -bottom-2 md:-right-6 md:bottom-0 bg-[#EF7F1A] text-black px-2 py-0.5 text-xs md:text-sm font-bold tracking-widest uppercase rounded-sm">
            Platform v1.0
          </div>
        </motion.div>

        {/* Hareketli Renk Geçişli Başlık */}
        <motion.h2
          key={lang}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold mb-4 pb-2 text-transparent bg-clip-text animate-gradient-x bg-gradient-to-r from-[#05594C] via-white to-[#EF7F1A]"
        >
          {t.title}
        </motion.h2>

        <motion.p
          key={lang + "sub"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400 text-lg md:text-2xl mb-12 font-light"
        >
          {t.subtitle}
        </motion.p>

        {/* --- YÜKLEME ÇUBUĞU VE MESAJLAR --- */}
        <div className="w-full max-w-xl space-y-4">
          
          {/* Çubuk */}
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(5,89,76,0.5)]">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EF7F1A] to-transparent w-1/3 blur-sm"
            />
             <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "75%" }}
              transition={{ duration: 10, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#05594C] opacity-50"
            />
          </div>

          {/* Dinamik Mesaj (Çevirili) */}
          <div className="h-8 flex items-center justify-center">
             <AnimatePresence mode="wait">
              <motion.span
                key={lang + msgIndex} // Dil veya mesaj değişince animasyon
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-[#EF7F1A] font-mono text-sm md:text-base tracking-wider"
              >
                 <span className="w-2 h-2 rounded-full bg-[#EF7F1A] animate-pulse" />
                 {t.messages[msgIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* --- FOOTER --- */}
      <div className="absolute bottom-6 w-full text-center px-4">
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
          &copy; 2026 DUXA.PRO &bull; KOTOR / MONTENEGRO &bull; SECURE CLOUD SYSTEM
        </p>
      </div>

    </div>
  );
}