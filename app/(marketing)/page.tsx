"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Cpu, Database, Shield } from "lucide-react";

// --- DİL VE ÇEVİRİ AYARLARI ---
type LangData = {
  flag: string;
  name: string;
  title: string;
  subtitle: string;
  messages: string[];
  durations: number[]; // Her mesaj için süre (saniye)
};

const translations: Record<string, LangData> = {
  en: { 
    flag: "🇺🇸", name: "English", 
    title: "System Upgrade in Progress", 
    subtitle: "Building the future of restaurant automation.",
    messages: ["Initializing core modules...", "Encrypting database connections...", "Syncing AI Engine (Gemini)...", "Activating security protocols...", "Compiling Kiosk interfaces...", "Optimizing hardware drivers...", "Deploying cloud infrastructure..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5]
  },
  tr: { 
    flag: "🇹🇷", name: "Türkçe", 
    title: "Sistem Yapılandırması Sürüyor", 
    subtitle: "Restoran otomasyonunun geleceğini inşa ediyoruz.",
    messages: ["Çekirdek modüller başlatılıyor...", "Veritabanı bağlantıları şifreleniyor...", "Yapay Zeka (Gemini) senkronize ediliyor...", "Güvenlik protokolleri devreye alınıyor...", "Kiosk arayüzleri derleniyor...", "Donanım sürücüleri optimize ediliyor...", "Bulut altyapısı dağıtılıyor..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5]
  },
  de: { 
    flag: "🇩🇪", name: "Deutsch", 
    title: "Systemaktualisierung läuft", 
    subtitle: "Wir bauen die Zukunft der Restaurantautomatisierung.",
    messages: ["Kernmodule werden initialisiert...", "Datenbankverbindungen verschlüsseln...", "KI-Engine wird synchronisiert...", "Sicherheitsprotokolle aktivieren...", "Kiosk-Schnittstellen kompilieren...", "Hardware-Treiber optimieren...", "Cloud-Infrastruktur bereitstellen..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5]
  },
  fr: { 
    flag: "🇫🇷", name: "Français", 
    title: "Mise à niveau du système", 
    subtitle: "Nous construisons l'avenir de l'automatisation.",
    messages: ["Initialisation des modules principaux...", "Chiffrement des connexions...", "Synchronisation de l'IA...", "Activation des protocoles de sécurité...", "Compilation des interfaces Kiosk...", "Optimisation des pilotes matériels...", "Déploiement de l'infrastructure cloud..."],
    durations: [5, 4.5, 5.5, 4, 6, 5, 5.5]
  },
  lb: { flag: "🇱🇺", name: "Lëtzebuergesch", title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun.", messages: ["Kärmoduler initialiséieren...", "Datebankverbindunge verschlésselen...", "AI Engine synchroniséieren...", "Sécherheetsprotokoller aktivéieren...", "Kiosk Interfaces kompiléieren...", "Hardware Treiber optiméieren...", "Cloud Infrastruktur deployéieren..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5] },
  me: { flag: "🇲🇪", name: "Crnogorski", title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana.", messages: ["Inicijalizacija osnovnih modula...", "Šifriranje veza baze podataka...", "Sinhronizacija AI motora...", "Aktiviranje sigurnosnih protokola...", "Kompajliranje interfejsa kioska...", "Optimizacija hardverskih drajvera...", "Primena cloud infrastrukture..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5] },
  pt: { flag: "🇵🇹", name: "Português", title: "Atualização do sistema", subtitle: "Construindo o futuro da automação.", messages: ["Inicializando módulos principais...", "Criptografando conexões...", "Sincronizando Motor de IA...", "Ativando protocolos de segurança...", "Compilando interfaces de quiosque...", "Otimizando drivers de hardware...", "Implantando infraestrutura cloud..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5] },
  nl: { flag: "🇳🇱", name: "Nederlands", title: "Systeemupgrade bezig", subtitle: "Bouwen aan de toekomst van restaurantautomatisering.", messages: ["Kernmodules initialiseren...", "Databaseverbindingen versleutelen...", "AI Engine synchroniseren...", "Beveiligingsprotocollen activeren...", "Kiosk-interfaces compileren...", "Hardware drivers optimaliseren...", "Cloud infrastructuur implementeren..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5] },
  ru: { flag: "🇷🇺", name: "Русский", title: "Обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов.", messages: ["Инициализация основных модулей...", "Шифрование соединений...", "Синхронизация ИИ...", "Активация протоколов безопасности...", "Компиляция интерфейсов киоска...", "Оптимизация драйверов оборудования...", "Развертывание облачной инфраструктуры..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5] },
};

// Bayrak pozisyonları (daire şeklinde)
const getFlagPosition = (index: number, total: number, radius: number = 60) => {
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // -90° başlangıç
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
  const langKeys = Object.keys(translations);
  const currentLangIndex = langKeys.indexOf(lang);

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

  // Mesaj Döngüsü - Her mesajın kendi süresi var
  useEffect(() => {
    const t = translations[lang];
    if (!t || !t.messages[msgIndex]) return;

    const duration = t.durations[msgIndex] * 1000; // saniyeyi milisaniyeye çevir
    setProgress(0);

    // Progress bar animasyonu
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (100 / (duration / 50)); // Her 50ms'de bir güncelle
      });
    }, 50);

    // Mesaj değişimi
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-[#EF7F1A] selection:text-white">
      
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

      {/* --- NETWORK AĞI VE ARKA PLAN --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Network Ağı - Bağlantı Çizgileri */}
        <svg className="absolute inset-0 w-full h-full opacity-20" style={{ mixBlendMode: 'screen' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#05594C" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#EF7F1A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#05594C" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Network Nodes ve Connections */}
          {[
            { x: 10, y: 20 },
            { x: 30, y: 15 },
            { x: 50, y: 25 },
            { x: 70, y: 18 },
            { x: 90, y: 22 },
            { x: 15, y: 50 },
            { x: 35, y: 55 },
            { x: 55, y: 48 },
            { x: 75, y: 52 },
            { x: 85, y: 45 },
            { x: 20, y: 80 },
            { x: 40, y: 75 },
            { x: 60, y: 82 },
            { x: 80, y: 78 },
          ].map((node, i) => (
            <g key={i}>
              <circle cx={`${node.x}%`} cy={`${node.y}%`} r="3" fill="#05594C" opacity="0.4">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
              </circle>
              {/* Bağlantı çizgileri */}
              {[
                { x: 30, y: 15 },
                { x: 50, y: 25 },
                { x: 35, y: 55 },
                { x: 55, y: 48 },
              ].slice(0, 2).map((target, j) => {
                if (i < 5) return null;
                return (
                  <line
                    key={j}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    opacity="0.2"
                  >
                    <animate attributeName="opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite" begin={`${(i + j) * 0.3}s`} />
                  </line>
                );
              })}
            </g>
          ))}
        </svg>

        {/* Grid Ağı - Devre Şeması Görünümü */}
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#05594C_1px,transparent_1px),linear-gradient(to_bottom,#05594C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_30%,transparent_100%)]" />
        
        {/* Daha Fazla Kod Parçacıkları */}
        {[
          { text: `function init() {\n  return true;\n}`, pos: { top: '15%', left: '8%' }, delay: 0, color: '#05594C' },
          { text: `async loadData() {\n  await sync();\n}`, pos: { top: '25%', right: '12%' }, delay: 1, color: '#EF7F1A' },
          { text: `<Component>\n  <Data />\n</Component>`, pos: { bottom: '28%', left: '15%' }, delay: 2, color: '#05594C' },
          { text: `const api = {\n  fetch: async () => {}\n}`, pos: { top: '60%', right: '18%' }, delay: 1.5, color: '#EF7F1A' },
          { text: `export default\n  class Engine`, pos: { bottom: '45%', left: '10%' }, delay: 0.5, color: '#05594C' },
        ].map((code, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -25, 0], 
              opacity: [0.15, 0.35, 0.15], 
              rotate: [0, i % 2 === 0 ? 2 : -1.5, 0] 
            }}
            transition={{ 
              duration: 8 + i * 2, 
              repeat: Infinity, 
              ease: "easeInOut", 
              delay: code.delay 
            }}
            className="absolute font-mono text-xs opacity-30"
            style={{ ...code.pos, color: code.color }}
          >
            <pre className="whitespace-pre-wrap">{code.text}</pre>
          </motion.div>
        ))}

        {/* Hareketli Gradient Blobs - Daha Fazla */}
        {[
          { pos: { top: '25%', left: '25%' }, size: 500, color: '#05594C', duration: 20, delay: 0 },
          { pos: { bottom: '25%', right: '25%' }, size: 450, color: '#EF7F1A', duration: 25, delay: 2 },
          { pos: { top: '50%', left: '50%' }, size: 400, color: '#05594C', duration: 18, delay: 1 },
          { pos: { top: '75%', left: '33%' }, size: 350, color: '#EF7F1A', duration: 22, delay: 1.5 },
          { pos: { bottom: '33%', right: '33%' }, size: 380, color: '#05594C', duration: 19, delay: 0.8 },
        ].map((blob, i) => (
          <motion.div
            key={i}
            animate={{ 
              x: [0, 120 + i * 30, -60 - i * 15, 0], 
              y: [0, -70 + i * 20, 45 - i * 10, 0], 
              opacity: [0.2, 0.4, 0.3, 0.2],
              scale: [1, 1.15 + i * 0.05, 0.92 - i * 0.02, 1]
            }}
            transition={{ 
              duration: blob.duration, 
              repeat: Infinity, 
              ease: "easeInOut", 
              delay: blob.delay 
            }}
            className="absolute rounded-full blur-[160px]"
            style={{
              ...blob.pos,
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              backgroundColor: blob.color,
            }}
          />
        ))}

        {/* Teknoloji İkonları - Daha Fazla */}
        <div className="absolute inset-0 opacity-10">
          <Code className="absolute top-32 left-32 w-16 h-16 text-[#05594C]" />
          <Cpu className="absolute top-64 right-40 w-14 h-14 text-[#EF7F1A]" />
          <Database className="absolute bottom-48 left-40 w-16 h-16 text-[#05594C]" />
          <Shield className="absolute bottom-32 right-48 w-14 h-14 text-[#EF7F1A]" />
          <Code className="absolute top-1/2 left-1/4 w-12 h-12 text-[#05594C]" />
          <Cpu className="absolute bottom-1/4 left-2/3 w-12 h-12 text-[#EF7F1A]" />
        </div>
      </div>

      {/* --- ANA İÇERİK --- */}
      <div className="z-10 flex flex-col items-center text-center px-4 w-full max-w-5xl">
        
        {/* LOGO (Akıcı Kalp Atışı Efekti) */}
        <motion.h1 
          className="text-7xl md:text-9xl font-black tracking-tighter text-white relative mb-8"
          animate={{ 
            scale: [1, 1.06, 1],
            filter: [
              "drop-shadow(0 0 10px rgba(5,89,76,0.3))",
              "drop-shadow(0 0 35px rgba(5,89,76,0.9))",
              "drop-shadow(0 0 10px rgba(5,89,76,0.3))"
            ]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            ease: "easeInOut"
          }}
        >
          DUXA
        </motion.h1>

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

        {/* --- GOOGLE ARAMA ÇUBUĞU GİBİ MESAJ KUTUSU --- */}
        <div className="w-full max-w-2xl space-y-6">
          
          {/* Google Arama Çubuğu Tasarımında Mesaj Kutusu */}
          <div className="relative w-full max-w-xl mx-auto">
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-full shadow-xl hover:shadow-[0_0_30px_rgba(5,89,76,0.3)] transition-shadow duration-300 overflow-hidden">
              {/* Progress Bar (Kutu İçinde) */}
              <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#05594C] via-[#EF7F1A] to-[#05594C]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
              
              {/* Mesaj İçeriği */}
              <div className="px-6 py-4 flex items-center gap-4">
                <motion.span 
                  className="w-2 h-2 rounded-full bg-[#EF7F1A] flex-shrink-0"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                
                <AnimatePresence mode="wait">
                  <motion.span
                    key={lang + msgIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 text-gray-300 font-mono text-sm md:text-base tracking-wide"
                  >
                    {t.messages[msgIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Teknoloji Vurgusu - Yazılım & Donanım */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-6 md:gap-8 pt-2"
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

      {/* --- DİL SEÇİMİ - BAYRAKLAR (EN ALTA, ORTADA) --- */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
        <div className="relative flex items-center justify-center">
          {/* Aktif Bayrak - Merkez */}
          <motion.button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative text-4xl z-10 cursor-pointer"
          >
            {t.flag}
            {/* Aktif Bayrak Etrafında Daire */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#EF7F1A]"
              style={{ width: 'calc(100% + 16px)', height: 'calc(100% + 16px)', top: '-8px', left: '-8px' }}
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>

          {/* Diğer Bayraklar - Daire Şeklinde Açılır */}
          <AnimatePresence>
            {isLangMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLangMenuOpen(false)}
                  className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm"
                />
                {langKeys
                  .filter((key) => key !== lang)
                  .map((key, index) => {
                    const totalOtherFlags = langKeys.length - 1;
                    const pos = getFlagPosition(index, totalOtherFlags, 70);
                    return (
                      <motion.button
                        key={key}
                        initial={{ 
                          x: 0, 
                          y: 0, 
                          opacity: 0, 
                          scale: 0 
                        }}
                        animate={{ 
                          x: pos.x, 
                          y: pos.y, 
                          opacity: 1, 
                          scale: 1 
                        }}
                        exit={{ 
                          x: 0, 
                          y: 0, 
                          opacity: 0, 
                          scale: 0 
                        }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index * 0.05,
                          ease: "easeOut"
                        }}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => {
                          setLang(key);
                          setIsLangMenuOpen(false);
                          setMsgIndex(0);
                        }}
                        className="absolute text-3xl cursor-pointer hover:scale-110 transition-transform z-20"
                      >
                        {translations[key].flag}
                      </motion.button>
                    );
                  })}
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


    </div>
  );
}