import React from 'react';
import { AppSection } from '../services/types';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

const LOGO_URL = "https://costumbrestintay.es/media/logo.png";

export const Layout: React.FC<LayoutProps> = ({ children, activeSection, onSectionChange }) => {
  const tabs = [
    { id: AppSection.CHAT, label: 'Asistente', icon: '✨' },
    { id: AppSection.LIVE, label: 'En Vivo', icon: '🎙️' },
    { id: AppSection.HISTORIA, label: 'Historia', icon: '📜' },
    { id: AppSection.GALERIA, label: 'Galería', icon: '🎨' },
    { id: AppSection.MAPAS, label: 'Rutas', icon: '📍' },
  ];

  return (
    <div className="flex flex-col h-screen bg-emerald-50 overflow-hidden">
      {/* Header with Logo */}
      <header className="bg-emerald-800 text-white shadow-lg pt-4 pb-2 px-4 flex items-center justify-between border-b-2 border-emerald-900/30 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full p-1 shadow-inner overflow-hidden flex items-center justify-center">
            <img 
              src={LOGO_URL} 
              alt="Logo Costumbres Tintay" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Tintay&background=ffffff&color=059669" }}
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-serif leading-none">Costumbres Tintay</h1>
            <p className="text-[10px] text-emerald-200 uppercase tracking-tighter font-bold opacity-80">Asistente Cultural</p>
          </div>
        </div>
        <div className="hidden md:block">
           <a href="https://wa.me/51974448544" target="_blank" className="bg-emerald-700/50 hover:bg-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/30 transition-all">
             WhatsApp: +51 974 448 544
           </a>
        </div>
      </header>

      {/* Top Tabs Navigation (Mobile Friendly) */}
      <nav className="bg-white border-b border-emerald-100 shadow-sm z-40">
        <div className="max-w-screen-xl mx-auto flex overflow-x-auto hide-scrollbar scroll-smooth px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={`flex-none px-6 py-4 flex flex-col items-center justify-center space-y-1 transition-all relative min-w-[100px] ${
                activeSection === tab.id 
                  ? 'text-emerald-700 font-bold' 
                  : 'text-gray-400 hover:text-emerald-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[11px] uppercase tracking-wider whitespace-nowrap">{tab.label}</span>
              {activeSection === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-emerald-50 py-1.5 px-4 text-center">
        <p className="text-[9px] text-emerald-900/40 uppercase tracking-[0.2em] font-bold">
          Tintay • Aymaraes • Apurímac • Perú
        </p>
      </footer>
    </div>
  );
};