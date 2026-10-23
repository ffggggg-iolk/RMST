import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  ShieldAlert,
  Server,
  Key,
  HardDrive,
  Cpu,
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('123456789012345678');

  // Discord permissions bit integer:
  // View Channels (1024), Send Messages (2048), Embed Links (16384), Attach Files (32768), Read History (65536), Manage Channels (16)
  // Total = 117824
  const generatedInviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId || 'YOUR_CLIENT_ID'}&scope=bot%20applications.commands&permissions=117824`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 bg-[#1e1f22] text-gray-200 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Discord Bot Deployment & Architecture Guide
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Complete technical documentation for provisioning, bot tokens, slash commands, and database disaster recovery.
          </p>
        </div>

        {/* SECTION 1: BOT INVITE BUILDER */}
        <div className="bg-[#2b2d31] border border-[#383a40] p-5 rounded-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">OAuth2 Bot Invite Link Generator</h3>
          </div>
          <p className="text-xs text-gray-300">
            Enter your Discord Client ID from the Discord Developer Portal to generate an instant invite link with exact required permissions (`Send Messages`, `Embed Links`, `Manage Channels` for tickets, `Slash Commands`).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Your Application Client ID (e.g. 134289012938102)"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1 bg-[#1e1f22] border border-[#383a40] rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
            <button
              onClick={() => copyToClipboard(generatedInviteUrl, 'invite')}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              {copiedKey === 'invite' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>Copy Invite URL</span>
            </button>
          </div>

          <div className="bg-[#1e1f22] p-2.5 rounded font-mono text-[11px] text-gray-400 truncate border border-[#383a40]">
            {generatedInviteUrl}
          </div>
        </div>

        {/* SECTION 2: DISCORD DEVELOPER PORTAL SETUP */}
        <div className="bg-[#2b2d31] border border-[#383a40] p-5 rounded-xl space-y-3">
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Discord Developer Portal Setup (4 Steps)</h3>
          </div>

          <ol className="list-decimal list-inside text-xs text-gray-300 space-y-2">
            <li>
              Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Discord Developer Portal</a> and create a <strong>New Application</strong>.
            </li>
            <li>
              Under the <strong>Bot</strong> tab, click <strong>Reset Token</strong> to generate your bot token. Enable the <strong>Server Members Intent</strong> and <strong>Message Content Intent</strong> toggles.
            </li>
            <li>
              Under the <strong>OAuth2</strong> tab, copy your <strong>Client ID</strong> and paste it into the generator above.
            </li>
            <li>
              Put the token into your `.env` file as `DISCORD_BOT_TOKEN="your_token"` and run slash command deployment.
            </li>
          </ol>
        </div>

        {/* SECTION 3: SLASH COMMANDS DEPLOYMENT */}
        <div className="bg-[#2b2d31] border border-[#383a40] p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Slash Command Registration & Execution</h3>
            </div>
            <button
              onClick={() => copyToClipboard('npx tsx src/scripts/deploy-commands.ts', 'cmd')}
              className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
            >
              {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Command</span>
            </button>
          </div>

          <p className="text-xs text-gray-300">
            Publish all slash commands (`/quote`, `/calculate`, `/compare`, `/product`, `/budget`, `/history`, `/help`, `/admin`) to Discord's API:
          </p>

          <pre className="bg-[#1e1f22] p-3 rounded text-xs font-mono text-emerald-400 border border-[#383a40]">
            # Register slash commands via Discord REST API v10
npx tsx src/scripts/deploy-commands.ts

# Start the full-time Discord Gateway Client
npx tsx src/scripts/run-bot.ts
          </pre>
        </div>

        {/* SECTION 4: DATABASE PERSISTENCE & DISASTER RECOVERY */}
        <div className="bg-[#2b2d31] border border-[#383a40] p-5 rounded-xl space-y-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Database Backup & Disaster Recovery</h3>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Every quotation captures an immutable JSON snapshot. Future edits to catalog base prices, tax rules, or currency rates never rewrite past quotations. To ensure data safety across reboots:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#1e1f22] p-3 rounded border border-[#383a40] space-y-1">
              <div className="font-bold text-white">SQLite Automated Hot-Backup</div>
              <pre className="text-gray-400 font-mono text-[11px] overflow-x-auto">
                {`sqlite3 ./data/quotations.db ".backup ./backups/quote-$(date +%s).db"`}
              </pre>
            </div>

            <div className="bg-[#1e1f22] p-3 rounded border border-[#383a40] space-y-1">
              <div className="font-bold text-white">PostgreSQL Enterprise Dump</div>
              <pre className="text-gray-400 font-mono text-[11px] overflow-x-auto">
                {`pg_dump -U postgres -d quotations > ./backups/dump_$(date +%F).sql`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
