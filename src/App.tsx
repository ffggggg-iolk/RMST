/**
 * Universal Quotation Discord Bot - Web Studio & Simulator
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, ActiveTab } from './ui/components/Navbar';
import { DiscordSimulator } from './ui/components/DiscordSimulator';
import { AdminDashboard } from './ui/components/AdminDashboard';
import { PricingSandbox } from './ui/components/PricingSandbox';
import { DocumentationView } from './ui/components/DocumentationView';
import { defaultDatabase } from './database/Database';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const settings = defaultDatabase.getGuildSettings('default-guild');

  return (
    <div className="min-h-screen bg-[#1e1f22] flex flex-col font-sans selection:bg-[#5865f2] selection:text-white">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        botName={settings.bot_name}
      />

      <main className="flex-1 flex flex-col min-h-0">
        {activeTab === 'simulator' && <DiscordSimulator />}
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'sandbox' && <PricingSandbox />}
        {activeTab === 'docs' && <DocumentationView />}
      </main>
    </div>
  );
}
