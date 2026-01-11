"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code, Cpu, Database, Shield } from "lucide-react";

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
    messages: ["Initializing core modules...", "Encrypting database connections...", "Syncing AI Engine (Gemini)...", "Activating security protocols...", "Compiling Kiosk interfaces...", "Optimizing hardware drivers...", "Deploying cloud infrastructure..."]
  },
  tr: { 
    flag: "🇹🇷", name: "Türkçe", 
    title: "Sistem Yapılandırması Sürüyor", 
    subtitle: "Restoran otomasyonunun geleceğini inşa ediyoruz.",
    messages: ["Çekirdek modüller başlatılıyor...", "Veritabanı bağlantıları şifreleniyor...", "Yapay Zeka (Gemini) senkronize ediliyor...", "Güvenlik protokolleri devreye alınıyor...", "Kiosk arayüzleri derleniyor...", "Donanım sürücüleri optimize ediliyor...", "Bulut altyapısı dağıtılıyor..."]
  },
  de: { 
    flag: "🇩🇪", name: "Deutsch", 
    title: "Systemaktualisierung läuft", 
    subtitle: "Wir bauen die Zukunft der Restaurantautomatisierung.",
    messages: ["Kernmodule werden initialisiert...", "Datenbankverbindungen verschlüsseln...", "KI-Engine wird synchronisiert...", "Sicherheitsprotokolle aktivieren...", "Kiosk-Schnittstellen kompilieren...", "Hardware-Treiber optimieren...", "Cloud-Infrastruktur bereitstellen..."]
  },
  fr: { 
    flag: "🇫🇷", name: "Français", 
    title: "Mise à niveau du système", 
    subtitle: "Nous construisons l'avenir de l'automatisation.",
    messages: ["Initialisation des modules principaux...", "Chiffrement des connexions...", "Synchronisation de l'IA...", "Activation des protocoles de sécurité...", "Compilation des interfaces Kiosk...", "Optimisation des pilotes matériels...", "Déploiement de l'infrastructure cloud..."]
  },
  lb: { flag: "🇱🇺", name: "Lëtzebuergesch", title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun.", messages: ["Kärmoduler initialiséieren...", "Datebankverbindunge verschlésselen...", "AI Engine synchroniséieren...", "Sécherheetsprotokoller aktivéieren...", "Kiosk Interfaces kompiléieren...", "Hardware Treiber optiméieren...", "Cloud Infrastruktur deployéieren..."] },
  me: { flag: "🇲🇪", name: "Crnogorski", title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana.", messages: ["Inicijalizacija osnovnih modula...", "Šifriranje veza baze podataka...", "Sinhronizacija AI motora...", "Aktiviranje sigurnosnih protokola...", "Kompajliranje interfejsa kioska...", "Optimizacija hardverskih drajvera...", "Primena cloud infrastrukture..."] },
  pt: { flag: "🇵🇹", name: "Português", title: "Atualização do sistema", subtitle: "Construindo o futuro da automação.", messages: ["Inicializando módulos principais...", "Criptografando conexões...", "Sincronizando Motor de IA...", "Ativando protocolos de segurança...", "Compilando interfaces de quiosque...", "Otimizando drivers de hardware...", "Implantando infraestrutura cloud..."] },
  nl: { flag: "🇳🇱", name: "Nederlands", title: "Systeemupgrade bezig", subtitle: "Bouwen aan de toekomst van restaurantautomatisering.", messages: ["Kernmodules initialiseren...", "Databaseverbindingen versleutelen...", "AI Engine synchroniseren...", "Beveiligingsprotocollen activeren...", "Kiosk-interfaces compileren...", "Hardware drivers optimaliseren...", "Cloud infrastructuur implementeren..."] },
  ru: { flag: "🇷🇺", name: "Русский", title: "Обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов.", messages: ["Инициализация основных модулей...", "Шифрование соединений...", "Синхронизация ИИ...", "Активация протоколов безопасности...", "Компиляция интерфейсов киоска...", "Оптимизация драйверов оборудования...", "Развертывание облачной инфраструктуры..."] },
};

export default function ConstructionPage() {
  const [lang, setLang] = useState("en");
  const [msgIndex, setMsgIndex] = useState(0);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Dil Algılama - Tarayıcı diline göre otomatik, desteklenmiyorsa İngilizce
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split("-")[0];
      if (translations[browserLang]) {
        setLang(browserLang);
      } else {
        setLang("en"); // Desteklenmiyorsa İngilizce
      }
    }
  }, []);

  // Mesaj Döngüsü - Daha akıcı, yükleme aşaması gibi
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % translations[lang].messages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [lang]);

  const t = translations[lang];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-[#EF7F1A] selection:text-white">
      
      {/* --- CSS STYLES --- */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          10%, 30% { transform: scale(1.05); }
          20%, 40% { transform: scale(1.02); }
          50% { transform: scale(1); }
        }
        @keyframes codeFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(2deg); opacity: 0.5; }
        }
        @keyframes circuitPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 4s linear infinite;
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* --- YAZILIM/DONANIM TEMALI ARKA PLAN --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Grid Ağı - Devre Şeması Görünümü */}
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#05594C_1px,transparent_1px),linear-gradient(to_bottom,#05594C_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" />
        
        {/* Kod Parçacıkları - Floating Code Snippets */}
        <motion.div
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.4, 0.2], rotate: [0, 2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 text-[#05594C] font-mono text-xs opacity-30"
        >
          <pre className="whitespace-pre-wrap">{`function init() {\n  return true;\n}`}</pre>
        </motion.div>
        <motion.div
          animate={{ y: [0, 25, 0], opacity: [0.15, 0.35, 0.15], rotate: [0, -1.5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-16 text-[#EF7F1A] font-mono text-xs opacity-30"
        >
          <pre className="whitespace-pre-wrap">{`async loadData() {\n  await sync();\n}`}</pre>
        </motion.div>
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1], rotate: [0, 1, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-20 text-[#05594C] font-mono text-xs opacity-30"
        >
          <pre className="whitespace-pre-wrap">{`<Component>\n  <Data />\n</Component>`}</pre>
        </motion.div>

        {/* Hareketli Gradient Blobs */}
        <motion.div 
          animate={{ 
            x: [0, 150, -50, 0], 
            y: [0, -80, 50, 0], 
            opacity: [0.25, 0.45, 0.35, 0.25],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-[#05594C] blur-[180px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -120, 80, 0], 
            y: [0, 70, -40, 0], 
            opacity: [0.2, 0.4, 0.3, 0.2],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 h-[450px] w-[450px] rounded-full bg-[#EF7F1A] blur-[180px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, 100, -60, 0], 
            y: [0, 60, -30, 0], 
            opacity: [0.15, 0.3, 0.25, 0.15],
            scale: [1, 1.15, 0.92, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-1/2 h-[400px] w-[400px] rounded-full bg-[#05594C] blur-[160px]" 
        />

        {/* Teknoloji İkonları - Subtle Background */}
        <div className="absolute inset-0 opacity-10">
          <Code className="absolute top-32 left-32 w-16 h-16 text-[#05594C]" />
          <Cpu className="absolute top-64 right-40 w-14 h-14 text-[#EF7F1A]" />
          <Database className="absolute bottom-48 left-40 w-16 h-16 text-[#05594C]" />
          <Shield className="absolute bottom-32 right-48 w-14 h-14 text-[#EF7F1A]" />
        </div>
      </div>

      {/* --- ANA İÇERİK --- */}
      <div className="z-10 flex flex-col items-center text-center px-4 w-full max-w-5xl">
        
        {/* LOGO (Düzeltilmiş Kalp Atışı Efekti) */}
        <motion.div
          animate={{ 
            scale: [1, 1.08, 1.03, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.2, 0.4, 1]
          }}
          className="mb-8 relative"
        >
          <motion.h1 
            className="text-7xl md:text-9xl font-black tracking-tighter text-white relative"
            animate={{
              filter: [
                "drop-shadow(0 0 0px rgba(5,89,76,0))",
                "drop-shadow(0 0 30px rgba(5,89,76,0.8))",
                "drop-shadow(0 0 15px rgba(5,89,76,0.4))",
                "drop-shadow(0 0 0px rgba(5,89,76,0))"
              ]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.2, 0.4, 1]
            }}
          >
            DUXA
          </motion.h1>
          <motion.div 
            className="absolute -right-2 -bottom-2 md:-right-6 md:bottom-0 bg-[#EF7F1A] text-black px-2 py-0.5 text-xs md:text-sm font-bold tracking-widest uppercase rounded-sm"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Platform v1.0
          </motion.div>
        </motion.div>

        {/* Hareketli Renk Geçişli Başlık */}
        <motion.h2
          key={lang}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-bold mb-4 pb-2 text-transparent bg-clip-text animate-gradient-x bg-gradient-to-r from-[#05594C] via-white to-[#EF7F1A]"
        >
          {t.title}
        </motion.h2>

        <motion.p
          key={lang + "sub"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-400 text-lg md:text-2xl mb-12 font-light"
        >
          {t.subtitle}
        </motion.p>

        {/* --- YÜKLEME ÇUBUĞU VE MESAJLAR --- */}
        <div className="w-full max-w-2xl space-y-6">
          
          {/* Gelişmiş Yükleme Çubuğu */}
          <div className="h-3 w-full bg-zinc-900/80 backdrop-blur-sm rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(5,89,76,0.4)] border border-zinc-800/50">
            {/* Ana Progress Bar */}
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "78%" }}
              transition={{ duration: 12, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 bg-gradient-to-r from-[#05594C] via-[#0a7a6a] to-[#05594C]"
            />
            {/* Shimmer Effect */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 blur-sm"
            />
          </div>

          {/* Dinamik Mesaj - Akıcı Geçişler */}
          <div className="h-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={lang + msgIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex items-center gap-3 text-[#EF7F1A] font-mono text-sm md:text-base tracking-wider"
              >
                <motion.span 
                  className="w-2.5 h-2.5 rounded-full bg-[#EF7F1A]"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span>{t.messages[msgIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Teknoloji Vurgusu - Yazılım & Donanım */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-6 md:gap-8 pt-4"
          >
            <div className="flex items-center gap-2 text-gray-500 hover:text-[#05594C] transition-colors">
              <Code className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">Software</span>
            </div>
            <div className="w-px h-6 bg-zinc-700" />
            <div className="flex items-center gap-2 text-gray-500 hover:text-[#EF7F1A] transition-colors">
              <Cpu className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">Hardware</span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* --- DİL SEÇİM MENÜSÜ (EN ALTA, ORTADA, ŞIK TASARIM) --- */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
        <div className="relative">
          <motion.button 
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 px-5 py-2.5 rounded-full hover:border-[#EF7F1A] hover:bg-zinc-800/90 transition-all duration-300 shadow-lg hover:shadow-[#EF7F1A]/20 hover:shadow-xl"
          >
            <Globe className="w-4 h-4 text-[#EF7F1A]" />
            <span className="text-lg">{t.flag}</span>
            <span className="text-sm font-medium text-gray-300 hidden sm:inline-block">{t.name}</span>
            <motion.span
              animate={{ rotate: isLangMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {isLangMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLangMenuOpen(false)}
                  className="fixed inset-0 -z-10"
                />
                {/* Menu */}
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {Object.keys(translations).map((key) => (
                      <motion.button
                        key={key}
                        whileHover={{ backgroundColor: "rgba(239, 127, 26, 0.1)", x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setLang(key); setIsLangMenuOpen(false); setMsgIndex(0); }}
                        className={`flex items-center gap-3 w-full px-5 py-3.5 text-left transition-colors border-b border-zinc-800/50 last:border-0 ${
                          lang === key ? 'bg-[#EF7F1A]/10 text-[#EF7F1A]' : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl">{translations[key].flag}</span>
                        <span className="text-sm font-medium flex-1">{translations[key].name}</span>
                        {lang === key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-[#EF7F1A]"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="absolute bottom-6 w-full text-center px-4 z-40">
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
          &copy; 2026 DUXA.PRO &bull; KOTOR / MONTENEGRO &bull; SECURE CLOUD SYSTEM
        </p>
      </div>

      {/* Custom Scrollbar Style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 127, 26, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 127, 26, 0.7);
        }
      `}</style>

    </div>
  );
}