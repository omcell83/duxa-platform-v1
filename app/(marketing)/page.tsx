"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Cpu, Database, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- DİL VE ÇEVİRİ AYARLARI ---
type LangData = {
  flag: string;
  name: string;
  title: string;
  subtitle: string;
  messages: string[];
  durations: number[]; // Her mesaj için süre (saniye)
  subscribeText: string; // Abone ol butonu metni
  emailPlaceholder: string;
  signingUp: string;
  successMessage: string;
  errorMessage: string;
};

const translations: Record<string, LangData> = {
  en: { 
    flag: "🇺🇸", name: "English", 
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
    flag: "🇹🇷", name: "Türkçe", 
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
    flag: "🇩🇪", name: "Deutsch", 
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
    flag: "🇫🇷", name: "Français", 
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
  lb: { flag: "🇱🇺", name: "Lëtzebuergesch", title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun.", messages: ["Kärmoduler initialiséieren...", "Datebankverbindunge verschlésselen...", "AI Engine synchroniséieren...", "Sécherheetsprotokoller aktivéieren...", "Kiosk Interfaces kompiléieren...", "Hardware Treiber optiméieren...", "Cloud Infrastruktur deployéieren..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Abonnéieren", emailPlaceholder: "Är E-Mail Adress...", signingUp: "Wird agemellt...", successMessage: "Succès! Kontrolléiert Är E-Mail.", errorMessage: "E Fehler ass geschitt. Probéiert w.e.g. nach emol." },
  me: { flag: "🇲🇪", name: "Crnogorski", title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana.", messages: ["Inicijalizacija osnovnih modula...", "Šifriranje veza baze podataka...", "Sinhronizacija AI motora...", "Aktiviranje sigurnosnih protokola...", "Kompajliranje interfejsa kioska...", "Optimizacija hardverskih drajvera...", "Primena cloud infrastrukture..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Pretplatite se", emailPlaceholder: "Vaša e-pošta...", signingUp: "Prijavljivanje...", successMessage: "Uspeh! Proverite svoju e-poštu.", errorMessage: "Došlo je do greške. Molimo pokušajte ponovo." },
  pt: { flag: "🇵🇹", name: "Português", title: "Atualização do sistema", subtitle: "Construindo o futuro da automação.", messages: ["Inicializando módulos principais...", "Criptografando conexões...", "Sincronizando Motor de IA...", "Ativando protocolos de segurança...", "Compilando interfaces de quiosque...", "Otimizando drivers de hardware...", "Implantando infraestrutura cloud..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Inscrever-se", emailPlaceholder: "Seu endereço de e-mail...", signingUp: "Inscrevendo...", successMessage: "Sucesso! Verifique seu e-mail.", errorMessage: "Ocorreu um erro. Por favor, tente novamente." },
  nl: { flag: "🇳🇱", name: "Nederlands", title: "Systeemupgrade bezig", subtitle: "Bouwen aan de toekomst van restaurantautomatisering.", messages: ["Kernmodules initialiseren...", "Databaseverbindingen versleutelen...", "AI Engine synchroniseren...", "Beveiligingsprotocollen activeren...", "Kiosk-interfaces compileren...", "Hardware drivers optimaliseren...", "Cloud infrastructuur implementeren..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Abonneren", emailPlaceholder: "Uw e-mailadres...", signingUp: "Aanmelden...", successMessage: "Succes! Controleer uw e-mail.", errorMessage: "Er is een fout opgetreden. Probeer het opnieuw." },
  ru: { flag: "🇷🇺", name: "Русский", title: "Обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов.", messages: ["Инициализация основных модулей...", "Шифрование соединений...", "Синхронизация ИИ...", "Активация протоколов безопасности...", "Компиляция интерфейсов киоска...", "Оптимизация драйверов оборудования...", "Развертывание облачной инфраструктуры..."], durations: [5, 4.5, 5.5, 4, 6, 5, 5.5], subscribeText: "Подписаться", emailPlaceholder: "Ваш адрес электронной почты...", signingUp: "Регистрация...", successMessage: "Успех! Проверьте свою электронную почту.", errorMessage: "Произошла ошибка. Пожалуйста, попробуйте снова." },
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error">("success");
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
        @media (min-width: 768px) {
          .lang-ring-oval {
            width: calc(100% + 18px) !important;
            height: calc(100% + 14px) !important;
          }
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
        
        {/* LOGO (Akıcı Kalp Atışı Efekti - Renk Geçişli) */}
        <motion.h1 
          className="text-7xl md:text-9xl font-black tracking-tighter relative mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#05594C] via-white to-[#EF7F1A] animate-gradient-x"
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
            <div className="relative bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-full shadow-xl hover:shadow-[0_0_30px_rgba(5,89,76,0.3)] transition-shadow duration-300 overflow-hidden">
              {/* Progress Bar (Tüm Çerçeveyi Kaplanan) */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-[#05594C]/30 via-[#EF7F1A]/40 to-[#05594C]/30"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
              
              {/* Mesaj İçeriği */}
              <div className="relative px-6 py-4 flex items-center gap-4">
                <motion.span 
                  className="w-2 h-2 rounded-full bg-[#EF7F1A] flex-shrink-0 z-10"
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
                    className="flex-1 font-mono text-sm md:text-base tracking-wide z-10 text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                    style={{ 
                      textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,1)'
                    }}
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
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50">
        <div className="relative flex items-center justify-center">
          {/* Aktif Bayrak - Merkez */}
          <motion.button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative text-4xl md:text-5xl z-10 cursor-pointer inline-flex items-center justify-center"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Color Emoji", "Apple Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif' }}
          >
            <span className="inline-block">{t.flag}</span>
            {/* Aktif Bayrak Etrafında Halka - Mobil: Yuvarlak, Masaüstü: Oval */}
            <motion.div
              className="absolute border-2 border-[#EF7F1A] lang-ring-oval"
              style={{ 
                width: 'calc(100% + 16px)', 
                height: 'calc(100% + 16px)', 
                top: '-8px', 
                left: '-8px',
                borderRadius: '9999px', // Mobil: yuvarlak (default)
              }}
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
                        className="absolute text-3xl md:text-4xl cursor-pointer hover:scale-110 transition-transform z-20 inline-flex items-center justify-center"
                        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Color Emoji", "Apple Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif' }}
                      >
                        <span className="relative inline-block">
                          {translations[key].flag}
                          {/* Diğer Bayraklar Etrafında Oval Halka - Mobil: Yuvarlak, Masaüstü: Oval */}
                          <motion.div
                            className="absolute border-2 border-[#EF7F1A] lang-ring-oval"
                            style={{ 
                              width: 'calc(100% + 12px)', 
                              height: 'calc(100% + 12px)', 
                              top: '-6px', 
                              left: '-6px',
                              borderRadius: '9999px', // Mobil: yuvarlak (default)
                            }}
                            initial={{ opacity: 0.4 }}
                            whileHover={{ opacity: 1, scale: 1.1 }}
                          />
                        </span>
                      </motion.button>
                    );
                  })}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- DİL SEÇİMİ ALTI - BEKLEME LİSTESİ FORMU --- */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          formData.append("language", lang); // Mevcut dil'i formData'ya ekle
          const btn = document.getElementById('submitBtn') as HTMLButtonElement;
          if(btn) btn.disabled = true;
          const originalText = btn?.textContent || t.subscribeText;
          if(btn) btn.textContent = t.signingUp;
          
          try {
            const { joinWaitlist } = await import("../actions");
            const result = await joinWaitlist(formData);
            
            if (result.success) {
              if(btn) btn.textContent = "✓";
              setDialogType("success");
              setDialogMessage(result.message || t.successMessage);
              setDialogOpen(true);
              (e.currentTarget as HTMLFormElement).reset();
              setTimeout(() => {
                if(btn) {
                  btn.disabled = false;
                  btn.textContent = originalText;
                }
              }, 2000);
            } else {
              setDialogType("error");
              setDialogMessage(result.message || t.errorMessage);
              setDialogOpen(true);
              if(btn) {
                btn.disabled = false;
                btn.textContent = originalText;
              }
            }
          } catch (error) {
            setDialogType("error");
            setDialogMessage(t.errorMessage);
            setDialogOpen(true);
            if(btn) {
              btn.disabled = false;
              btn.textContent = originalText;
            }
          }
        }} 
        className="flex gap-2">
          <input 
            type="email" 
            name="email" 
            placeholder={t.emailPlaceholder} 
            required
            className="flex-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-full px-5 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#EF7F1A] transition-colors shadow-lg"
          />
          <button 
            id="submitBtn"
            type="submit" 
            className="bg-[#EF7F1A] hover:bg-[#d66e12] text-black font-bold px-6 py-3 rounded-full transition-colors shadow-lg hover:shadow-[#EF7F1A]/50 whitespace-nowrap"
          >
            {t.subscribeText}
          </button>
        </form>
      </div>

      {/* --- MODAL DİALOG --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className={dialogType === "success" ? "text-[#EF7F1A]" : "text-red-500"}>
              {dialogType === "success" ? "✅ " + (t.name === "Türkçe" ? "Başarılı" : "Success") : "❌ " + (t.name === "Türkçe" ? "Hata" : "Error")}
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
        
      {/* --- FOOTER --- */}
      <div className="absolute bottom-6 w-full text-center px-4 z-40">
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
          &copy; 2026 DUXA.PRO &bull; KOTOR / MONTENEGRO &bull; SECURE CLOUD SYSTEM
        </p>
      </div>


    </div>
  );
}