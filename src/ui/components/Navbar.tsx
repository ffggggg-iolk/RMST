import React from 'react';
import { Bot, Sliders, ShieldCheck, BookOpen, Terminal, Sparkles } from 'lucide-react';

export type ActiveTab = 'simulator' | 'dashboard' | 'sandbox' | 'docs';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  botName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, botName }) => {
  return (
    <header className="bg-[#1e1f22] border-b border-[#2b2d31] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 select-none shadow-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center shadow-lg shadow-[#5865f2]/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base leading-tight tracking-wide">{botName}</h1>
            <span className="bg-[#5865f2] text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider">
              BOT
            </span>
          </div>
          <p className="text-xs text-gray-400">Commercial Quotation, Pricing Engine & Store Administration</p>
        </div>
      </div>

      <nav className="flex items-center bg-[#2b2d31] p-1 rounded-lg border border-[#383a40]">
        <button
          onClick={() => onSelectTab('simulator')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'simulator'
              ? 'bg-[#5865f2] text-white shadow'
              : 'text-gray-300 hover:text-white hover:bg-[#35373c]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Discord Simulator</span>
        </button>

        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#5865f2] text-white shadow'
              : 'text-gray-300 hover:text-white hover:bg-[#35373c]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Store Admin</span>
        </button>

        <button
          onClick={() => onSelectTab('sandbox')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'sandbox'
              ? 'bg-[#5865f2] text-white shadow'
              : 'text-gray-300 hover:text-white hover:bg-[#35373c]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Pricing Engine Lab</span>
        </button>

        <button
          onClick={() => onSelectTab('docs')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'docs'
              ? 'bg-[#5865f2] text-white shadow'
              : 'text-gray-300 hover:text-white hover:bg-[#35373c]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Bot Deployment Docs</span>
        </button>
      </nav>
    </header>
  );
};
