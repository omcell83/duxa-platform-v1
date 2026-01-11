"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// --- DİL VE ÇEVİRİ AYARLARI ---
const translations: Record<string, { title: string; subtitle: string; status: string }> = {
  en: { title: "System Upgrade in Progress", subtitle: "We are building the future of restaurant automation.", status: "Status: Developing Core Modules" },
  tr: { title: "Sistem Yapılandırması Sürüyor", subtitle: "Restoran otomasyonunun geleceğini inşa ediyoruz.", status: "Durum: Çekirdek Modüller Kodlanıyor" },
  de: { title: "Systemaktualisierung läuft", subtitle: "Wir bauen die Zukunft der Restaurantautomatisierung.", status: "Status: Entwicklung der Kernmodule" },
  fr: { title: "Mise à niveau du système", subtitle: "Nous construisons l'avenir de l'automatisation des restaurants.", status: "Statut : Développement des modules principaux" },
  lb: { title: "Systemaktualiséierung amgaang", subtitle: "Mir bauen d'Zukunft vun der Restaurantautomatioun.", status: "Status: Entwécklung vu Kärmoduler" }, // Lüksemburgca
  me: { title: "Nadogradnja sistema u toku", subtitle: "Gradimo budućnost automatizacije restorana.", status: "Status: Razvoj osnovnih modula" }, // Karadağca (Montenegrin/Serbian)
  pt: { title: "Atualização do sistema em andamento", subtitle: "Estamos construindo o futuro da automação de restaurantes.", status: "Status: Desenvolvendo Módulos Principais" },
  nl: { title: "Systeemupgrade bezig", subtitle: "We bouwen aan de toekomst van restaurantautomatisering.", status: "Status: Kernmodules in ontwikkeling" }, // Felemenkçe
  ru: { title: "Идет обновление системы", subtitle: "Мы строим будущее автоматизации ресторанов.", status: "Статус: Разработка основных модулей" },
};

export default function ConstructionPage() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // Tarayıcı dilini algıla (Örn: 'tr-TR' -> 'tr')
    const browserLang = navigator.language.split("-")[0];
    if (translations[browserLang]) {
      setLang(browserLang);
    }
  }, []);

  const t = translations[lang];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-[#EF7F1A] selection:text-white">
      
      {/* --- ARKA PLAN EFEKTLERİ (CYBER GRID) --- */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05594C_1px,transparent_1px),linear-gradient(to_bottom,#05594C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      
      {/* Hareketli Işık Topları */}
      <motion.div 
        animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[#05594C] blur-[128px]" 
      />
      <motion.div 
        animate={{ x: [0, -100, 0], y: [0, 50, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[#EF7F1A] blur-[128px]" 
      />

      {/* --- ANA İÇERİK --- */}
      <div className="z-10 flex flex-col items-center text-center px-4">
        
        {/* Logo / Marka */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">
            DUXA
          </h1>
          <span className="text-[#EF7F1A] text-sm tracking-[0.5em] font-bold uppercase">Platform</span>
        </motion.div>

        {/* Dinamik Başlık */}
        <motion.h2
          key={lang} // Dil değişince animasyon tekrar etsin
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#05594C] to-[#EF7F1A] bg-clip-text text-transparent"
        >
          {t.title}
        </motion.h2>

        <motion.p
          key={lang + "_sub"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-xl text-lg mb-10"
        >
          {t.subtitle}
        </motion.p>

        {/* Teknik Durum Göstergesi */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 px-6 py-3 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF7F1A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EF7F1A]"></span>
          </span>
          <span className="text-sm font-mono text-gray-300">
            {t.status}
          </span>
        </motion.div>
        
        {/* Dil Seçici (Manuel Değişim İçin) */}
        <div className="mt-12 flex gap-4 text-xs text-gray-600 font-mono uppercase">
          {Object.keys(translations).map((l) => (
            <button 
              key={l} 
              onClick={() => setLang(l)}
              className={`hover:text-white transition-colors ${lang === l ? "text-[#EF7F1A]" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}