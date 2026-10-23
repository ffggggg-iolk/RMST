import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  Sparkles,
  Ticket,
  Copy,
  Info,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Check,
  Bot,
  User,
  PlusCircle,
  HelpCircle,
  Calculator,
  ArrowRightLeft,
  Package,
} from 'lucide-react';
import { defaultInteractionDispatcher } from '../../bot/client';
import { defaultDatabase } from '../../database/Database';
import { DiscordMessagePayload } from '../../bot/embeds/quotationEmbed';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  userTag: string;
  avatarColor: string;
  timestamp: string;
  commandExecuted?: string;
  content?: string;
  payload?: DiscordMessagePayload;
}

export const DiscordSimulator: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState<'quotes' | 'bot-commands' | 'tickets-support'>('quotes');
  const [inputValue, setInputValue] = useState('');
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [selectedCommandModal, setSelectedCommandModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Command parameter states for modal
  const [quoteProduct, setQuoteProduct] = useState('prod-custom-bot');
  const [quoteQty, setQuoteQty] = useState(2);
  const [quoteCurrency, setQuoteCurrency] = useState('USD');
  const [quoteDiscount, setQuoteDiscount] = useState('WELCOME10');
  const [quoteBudget, setQuoteBudget] = useState<number | undefined>(undefined);

  // Calculate modal
  const [calcBudget, setCalcBudget] = useState(100);
  const [calcCurrency, setCalcCurrency] = useState('USD');
  const [calcProduct, setCalcProduct] = useState('prod-cloud-compute');

  // Compare modal
  const [compProdA, setCompProdA] = useState('prod-custom-bot');
  const [compProdB, setCompProdB] = useState('prod-bundle-launch');

  const products = defaultDatabase.getAllProducts();
  const settings = defaultDatabase.getGuildSettings('default-guild');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      userTag: `${settings.bot_name}#0001`,
      avatarColor: 'bg-[#5865f2]',
      timestamp: 'Today at 10:00 AM',
      content: '👋 Welcome to the official Universal Quotation channel! Try typing `/quote`, `/calculate`, `/compare`, `/product`, or click any of the quick-action chips below to simulate live bot slash commands.',
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeSlashCommand = async (
    cmdName: string,
    options: Record<string, any>,
    subcommandGroup?: string,
    subcommand?: string
  ) => {
    const userMsgId = `usr-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;
    const nowStr = 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format display string
    const optsStr = Object.entries(options)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
    const displayCmd = `/${cmdName}${subcommandGroup ? ' ' + subcommandGroup : ''}${subcommand ? ' ' + subcommand : ''} ${optsStr}`.trim();

    // Append user message
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        userTag: 'BuyerCommander#1337',
        avatarColor: 'bg-emerald-600',
        timestamp: nowStr,
        commandExecuted: displayCmd,
      },
    ];

    try {
      const responsePayload = await defaultInteractionDispatcher.handleCommand({
        commandName: cmdName,
        subcommandGroup,
        subcommand,
        options,
        guildId: 'default-guild',
        userId: 'user-demo-buyer',
        userTag: 'BuyerCommander#1337',
        channelId: currentChannel,
      });

      newMessages.push({
        id: botMsgId,
        sender: 'bot',
        userTag: `${settings.bot_name}#0001`,
        avatarColor: 'bg-[#5865f2]',
        timestamp: nowStr,
        payload: responsePayload,
      });
    } catch (err: any) {
      newMessages.push({
        id: botMsgId,
        sender: 'bot',
        userTag: `${settings.bot_name}#0001`,
        avatarColor: 'bg-[#5865f2]',
        timestamp: nowStr,
        payload: {
          embeds: [
            {
              title: '❌ Quotation Error',
              description: err.message || 'An error occurred during quotation calculation.',
              color: 0xed4245,
              fields: [],
            },
          ],
          components: [],
        },
      });
    }

    setMessages(newMessages);
    setSelectedCommandModal(null);
    setInputValue('');
  };

  const handleButtonClick = async (customId: string) => {
    if (customId.startsWith('ticket_create_')) {
      const quoteNum = customId.replace('ticket_create_', '');
      const ticket = defaultDatabase.createTicket(
        quoteNum,
        'default-guild',
        'user-demo-buyer',
        'BuyerCommander#1337',
        `chan-${quoteNum}`
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          userTag: 'Discord System',
          avatarColor: 'bg-purple-600',
          timestamp: 'Just now',
          content: `🎫 **Ticket #${ticket.ticket_number} Created Successfully!**\nDedicated private purchase channel \`#ticket-${ticket.ticket_number.toLowerCase()}\` has been linked to Quote ID **\`${quoteNum}\`**. Store staff has been assigned.`,
        },
      ]);
      setCurrentChannel('tickets-support');
    } else if (customId.startsWith('quote_copy_')) {
      const quoteId = customId.replace('quote_copy_', '');
      navigator.clipboard?.writeText(quoteId);
      setCopiedId(quoteId);
      setTimeout(() => setCopiedId(null), 2500);
    } else if (customId.startsWith('product_info_')) {
      const pId = customId.replace('product_info_', '');
      await executeSlashCommand('product', { product: pId });
    } else if (customId.startsWith('quote_run_')) {
      const parts = customId.replace('quote_run_', '').split('_');
      const pId = parts[0];
      const qty = parseInt(parts[1], 10) || 1;
      await executeSlashCommand('quote', { product: pId, quantity: qty });
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-[#313338] text-[#dbdee1] overflow-hidden select-none">
      {/* Discord Left Channel Sidebar */}
      <div className="w-64 bg-[#2b2d31] flex flex-col border-r border-[#1f2023] shrink-0">
        <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between shadow-sm">
          <span className="font-bold text-white text-sm truncate flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Universal Marketplace
          </span>
          <span className="text-[10px] bg-[#1e1f22] text-gray-400 px-1.5 py-0.5 rounded border border-[#383a40]">
            Discord v14
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          <div>
            <div className="px-2 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Text Channels
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setCurrentChannel('quotes')}
                className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors ${
                  currentChannel === 'quotes'
                    ? 'bg-[#35373c] text-white font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]/50'
                }`}
              >
                <Hash className="w-4 h-4 mr-2 text-gray-400" />
                <span>quotes</span>
              </button>

              <button
                onClick={() => setCurrentChannel('bot-commands')}
                className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors ${
                  currentChannel === 'bot-commands'
                    ? 'bg-[#35373c] text-white font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]/50'
                }`}
              >
                <Hash className="w-4 h-4 mr-2 text-gray-400" />
                <span>bot-commands</span>
              </button>

              <button
                onClick={() => setCurrentChannel('tickets-support')}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                  currentChannel === 'tickets-support'
                    ? 'bg-[#35373c] text-white font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]/50'
                }`}
              >
                <div className="flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-gray-400" />
                  <span>tickets-support</span>
                </div>
                <span className="bg-[#5865f2] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {defaultDatabase.getAllTickets().length}
                </span>
              </button>
            </div>
          </div>

          <div>
            <div className="px-2 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Quick Slash Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCommandModal('quote')}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-[#1e1f22] hover:bg-[#35373c] text-indigo-300 flex items-center justify-between border border-[#383a40]/60 transition"
              >
                <span className="font-mono font-medium">/quote</span>
                <span className="text-[10px] text-gray-400">Estimate Price</span>
              </button>
              <button
                onClick={() => setSelectedCommandModal('calculate')}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-[#1e1f22] hover:bg-[#35373c] text-amber-300 flex items-center justify-between border border-[#383a40]/60 transition"
              >
                <span className="font-mono font-medium">/calculate</span>
                <span className="text-[10px] text-gray-400">Budget Solver</span>
              </button>
              <button
                onClick={() => setSelectedCommandModal('compare')}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-[#1e1f22] hover:bg-[#35373c] text-emerald-300 flex items-center justify-between border border-[#383a40]/60 transition"
              >
                <span className="font-mono font-medium">/compare</span>
                <span className="text-[10px] text-gray-400">Side-by-side</span>
              </button>
              <button
                onClick={() => executeSlashCommand('help', {})}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-[#1e1f22] hover:bg-[#35373c] text-cyan-300 flex items-center justify-between border border-[#383a40]/60 transition"
              >
                <span className="font-mono font-medium">/help</span>
                <span className="text-[10px] text-gray-400">User Manual</span>
              </button>
              <button
                onClick={() => executeSlashCommand('history', {})}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-[#1e1f22] hover:bg-[#35373c] text-fuchsia-300 flex items-center justify-between border border-[#383a40]/60 transition"
              >
                <span className="font-mono font-medium">/history</span>
                <span className="text-[10px] text-gray-400">Saved Quotes</span>
              </button>
            </div>
          </div>
        </div>

        {/* User bar */}
        <div className="h-14 bg-[#232428] px-3 flex items-center justify-between border-t border-[#1f2023]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-emerald-400/30">
              BC
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-white">BuyerCommander</div>
              <div className="text-[10px] text-gray-400">Online • Testing Bot</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#313338] min-w-0 relative">
        {/* Channel Header */}
        <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between shadow-sm bg-[#313338]">
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-white text-sm">{currentChannel}</span>
            <span className="text-xs text-gray-400 border-l border-gray-600 pl-2">
              Official Discord channel for commercial quotations, price estimates, and ticket creation
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMessages([])}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white bg-[#2b2d31] hover:bg-[#35373c] rounded border border-[#383a40] transition"
              title="Clear Chat Stream"
            >
              Clear Screen
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex space-x-3 group hover:bg-[#2e3035] -mx-4 px-4 py-1.5 rounded transition">
              <div
                className={`w-10 h-10 rounded-full ${msg.avatarColor} flex items-center justify-center shrink-0 text-white font-bold text-sm shadow`}
              >
                {msg.sender === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-sm">{msg.userTag}</span>
                  {msg.sender === 'bot' && (
                    <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                      BOT
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">{msg.timestamp}</span>
                </div>

                {msg.commandExecuted && (
                  <div className="text-xs text-indigo-300 font-mono mt-0.5 bg-[#2b2d31] inline-block px-2 py-0.5 rounded border border-[#383a40]">
                    {msg.commandExecuted}
                  </div>
                )}

                {msg.content && <p className="text-sm text-gray-200 mt-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                {/* Render Discord Embeds */}
                {msg.payload?.embeds?.map((emb, eIdx) => (
                  <div
                    key={eIdx}
                    className="mt-2.5 rounded-r border-l-4 bg-[#2b2d31] p-4 max-w-2xl shadow-lg border border-[#1f2023]"
                    style={{ borderLeftColor: `#${emb.color.toString(16).padStart(6, '0')}` }}
                  >
                    <div className="font-bold text-white text-base mb-1">{emb.title}</div>
                    {emb.description && (
                      <p className="text-xs text-gray-300 mb-3 whitespace-pre-wrap">{emb.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
                      {emb.fields.map((f, fIdx) => (
                        <div
                          key={fIdx}
                          className={`${f.inline ? 'col-span-1' : 'col-span-1 md:col-span-2'} bg-[#1e1f22]/60 p-2.5 rounded border border-[#383a40]/40`}
                        >
                          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                            {f.name}
                          </div>
                          <div className="text-xs text-gray-200 mt-0.5 whitespace-pre-wrap font-sans">
                            {f.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {emb.footer && (
                      <div className="text-[10px] text-gray-400 mt-2 border-t border-[#383a40] pt-1.5 flex items-center justify-between">
                        <span>{emb.footer.text}</span>
                        {emb.timestamp && <span>{new Date(emb.timestamp).toLocaleTimeString()}</span>}
                      </div>
                    )}
                  </div>
                ))}

                {/* Render Embed Action Row Components (Buttons & Dropdowns) */}
                {msg.payload?.components?.map((row, rIdx) => (
                  <div key={rIdx} className="flex flex-wrap gap-2 mt-2.5 max-w-2xl">
                    {row.components.map((c: any, cIdx) => {
                      if (c.customId?.startsWith('ticket_create_')) {
                        return (
                          <button
                            key={cIdx}
                            onClick={() => handleButtonClick(c.customId)}
                            className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium px-3.5 py-1.5 rounded flex items-center space-x-1.5 shadow transition active:scale-95"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{c.label}</span>
                          </button>
                        );
                      }
                      if (c.customId?.startsWith('quote_copy_')) {
                        return (
                          <button
                            key={cIdx}
                            onClick={() => handleButtonClick(c.customId)}
                            className="bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-medium px-3 py-1.5 rounded flex items-center space-x-1.5 shadow transition active:scale-95"
                          >
                            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId ? 'Copied!' : c.label}</span>
                          </button>
                        );
                      }
                      return (
                        <button
                          key={cIdx}
                          onClick={() => handleButtonClick(c.customId)}
                          className="bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-medium px-3 py-1.5 rounded flex items-center space-x-1.5 shadow transition active:scale-95"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Command Autocomplete */}
        <div className="p-4 bg-[#313338] relative">
          {/* Slash Autocomplete Popup */}
          {showCommandMenu && (
            <div className="absolute bottom-16 left-4 right-4 bg-[#2b2d31] border border-[#1f2023] rounded-lg shadow-2xl p-2 z-30 max-h-64 overflow-y-auto">
              <div className="text-[11px] font-bold text-gray-400 uppercase px-2 py-1 tracking-wider">
                Matching Application Commands
              </div>
              <div className="space-y-1">
                {[
                  { name: 'quote', desc: 'Calculate accurate price quotation for a product or service' },
                  { name: 'calculate', desc: 'Find maximum affordable units for a spending budget' },
                  { name: 'compare', desc: 'Compare products side-by-side on unit cost and final total' },
                  { name: 'product', desc: 'Show catalog specifications and pricing tiers' },
                  { name: 'budget', desc: 'Open interactive multi-item quote cart builder' },
                  { name: 'history', desc: 'Browse saved quotation records and frozen snapshots' },
                  { name: 'help', desc: 'Open command documentation guide' },
                  { name: 'admin statistics', desc: 'View store analytics and quoted sales volume' },
                ].map((cmd) => (
                  <button
                    key={cmd.name}
                    onClick={() => {
                      setShowCommandMenu(false);
                      if (cmd.name.startsWith('admin')) {
                        executeSlashCommand('admin', {}, undefined, 'statistics');
                      } else {
                        setSelectedCommandModal(cmd.name);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-[#35373c] flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-indigo-400">/{cmd.name}</span>
                      <span className="text-gray-300">{cmd.desc}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#5865f2] border border-[#2b2d31]">
            <button
              onClick={() => setShowCommandMenu(!showCommandMenu)}
              className="text-gray-400 hover:text-white mr-3 transition"
              title="Slash Commands Menu"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder={`Message #${currentChannel} (Type '/' for Slash Commands or click quick actions)...`}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.startsWith('/')) {
                  setShowCommandMenu(true);
                } else {
                  setShowCommandMenu(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  if (inputValue.trim() === '/help') {
                    executeSlashCommand('help', {});
                  } else if (inputValue.trim() === '/history') {
                    executeSlashCommand('history', {});
                  } else if (inputValue.trim() === '/budget') {
                    executeSlashCommand('budget', {});
                  } else if (inputValue.trim().startsWith('/quote')) {
                    setSelectedCommandModal('quote');
                  } else if (inputValue.trim().startsWith('/calc')) {
                    setSelectedCommandModal('calculate');
                  } else if (inputValue.trim().startsWith('/comp')) {
                    setSelectedCommandModal('compare');
                  } else {
                    // Regular message
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `msg-${Date.now()}`,
                        sender: 'user',
                        userTag: 'BuyerCommander#1337',
                        avatarColor: 'bg-emerald-600',
                        timestamp: 'Just now',
                        content: inputValue,
                      },
                    ]);
                    setInputValue('');
                  }
                }
              }}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => {
                if (inputValue.trim()) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `msg-${Date.now()}`,
                      sender: 'user',
                      userTag: 'BuyerCommander#1337',
                      avatarColor: 'bg-emerald-600',
                      timestamp: 'Just now',
                      content: inputValue,
                    },
                  ]);
                  setInputValue('');
                }
              }}
              className="text-gray-400 hover:text-white transition ml-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Slash Command Modal Dialog */}
      {selectedCommandModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#313338] border border-[#1f2023] rounded-xl shadow-2xl max-w-lg w-full p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#383a40] pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-indigo-400 text-lg">/{selectedCommandModal}</span>
                <span className="text-xs text-gray-400">Configure Command Options</span>
              </div>
              <button
                onClick={() => setSelectedCommandModal(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form for /quote */}
            {selectedCommandModal === 'quote' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Product</label>
                  <select
                    value={quoteProduct}
                    onChange={(e) => setQuoteProduct(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currency} {p.base_price.toFixed(2)} • {p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quoteQty}
                      onChange={(e) => setQuoteQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Target Currency</label>
                    <select
                      value={quoteCurrency}
                      onChange={(e) => setQuoteCurrency(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (CA$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="BRL">BRL (R$)</option>
                      <option value="MXN">MXN (MX$)</option>
                      <option value="PEN">PEN (S/.)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Discount Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={quoteDiscount}
                      onChange={(e) => setQuoteDiscount(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Spending Budget (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 200"
                      value={quoteBudget || ''}
                      onChange={(e) => setQuoteBudget(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedCommandModal(null)}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      executeSlashCommand('quote', {
                        product: quoteProduct,
                        quantity: quoteQty,
                        currency: quoteCurrency,
                        discount_code: quoteDiscount || undefined,
                        budget: quoteBudget,
                        details: true,
                      });
                    }}
                    className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium flex items-center space-x-1.5 shadow"
                  >
                    <span>Run /quote</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Form for /calculate */}
            {selectedCommandModal === 'calculate' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Product to Afford</label>
                  <select
                    value={calcProduct}
                    onChange={(e) => setCalcProduct(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currency} {p.base_price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Available Budget</label>
                    <input
                      type="number"
                      min={1}
                      value={calcBudget}
                      onChange={(e) => setCalcBudget(parseFloat(e.target.value) || 10)}
                      className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Currency</label>
                    <select
                      value={calcCurrency}
                      onChange={(e) => setCalcCurrency(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="BRL">BRL (R$)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedCommandModal(null)}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      executeSlashCommand('calculate', {
                        budget: calcBudget,
                        currency: calcCurrency,
                        product: calcProduct,
                      });
                    }}
                    className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium shadow"
                  >
                    <span>Run /calculate</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Form for /compare */}
            {selectedCommandModal === 'compare' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Product A</label>
                  <select
                    value={compProdA}
                    onChange={(e) => setCompProdA(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currency} {p.base_price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Product B</label>
                  <select
                    value={compProdB}
                    onChange={(e) => setCompProdB(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currency} {p.base_price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedCommandModal(null)}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      executeSlashCommand('compare', {
                        product_a: compProdA,
                        product_b: compProdB,
                        quantity_a: 1,
                        quantity_b: 1,
                        currency: 'USD',
                      });
                    }}
                    className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium shadow"
                  >
                    <span>Run /compare</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
