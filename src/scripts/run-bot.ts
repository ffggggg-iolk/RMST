/**
 * Live Discord Gateway Bot Runner
 * Connects directly to Discord Gateway when DISCORD_BOT_TOKEN is configured.
 * Usage: npx tsx src/scripts/run-bot.ts
 */

import {
  Client,
  GatewayIntentBits,
  Events,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { defaultInteractionDispatcher } from '../bot/client';
import { defaultDatabase } from '../database/Database';

import { deploy } from './deploy-commands';

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

export async function startDiscordBot() {
  if (!TOKEN) {
    console.log('ℹ️ DISCORD_BOT_TOKEN not provided. Bot gateway mode is idle. Web UI Simulator is fully active!');
    return null;
  }

  // Automatically sync slash commands on startup if CLIENT_ID is provided
  if (CLIENT_ID) {
    console.log('🚀 Synchronizing application commands on bot launch...');
    try {
      await deploy();
    } catch (e) {
      console.warn('Command synchronization warning:', e);
    }
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`🤖 Universal Quotation Bot is ONLINE as ${c.user.tag}!`);
    console.log(`Ready in ${c.guilds.cache.size} servers.`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const cmdInteraction = interaction as ChatInputCommandInteraction;
        const options: Record<string, any> = {};

        // Extract options
        for (const opt of cmdInteraction.options.data) {
          if (opt.value !== undefined) {
            options[opt.name] = opt.value;
          }
        }

        const subGrp = cmdInteraction.options.getSubcommandGroup(false) || undefined;
        const sub = cmdInteraction.options.getSubcommand(false) || undefined;

        await cmdInteraction.deferReply();

        const payload = await defaultInteractionDispatcher.handleCommand({
          commandName: cmdInteraction.commandName,
          subcommandGroup: subGrp,
          subcommand: sub,
          options,
          guildId: cmdInteraction.guildId || 'default-guild',
          userId: cmdInteraction.user.id,
          userTag: cmdInteraction.user.tag,
          channelId: cmdInteraction.channelId,
        });

        await cmdInteraction.editReply({
          embeds: payload.embeds as any,
          components: payload.components as any,
        });
      } else if (interaction.isButton()) {
        const btn = interaction as ButtonInteraction;
        const customId = btn.customId;

        if (customId.startsWith('ticket_create_')) {
          const quoteId = customId.replace('ticket_create_', '');
          await btn.deferReply({ ephemeral: true });

          // Create ticket in database
          const ticket = defaultDatabase.createTicket(
            quoteId,
            btn.guildId || 'default-guild',
            btn.user.id,
            btn.user.tag,
            btn.channelId
          );

          await btn.editReply({
            content: `🎫 **Ticket Created:** \`${ticket.ticket_number}\`! Your purchase ticket has been linked to Quote ID \`${quoteId}\`. Server administrators have been notified.`,
          });
        } else if (customId.startsWith('quote_copy_')) {
          const qId = customId.replace('quote_copy_', '');
          await btn.reply({
            content: `📋 **Quote ID Copied:** \`${qId}\`\nShare this identifier with staff or in a support ticket.`,
            ephemeral: true,
          });
        }
      }
    } catch (err: any) {
      console.error('Error handling interaction:', err);
      const errMsg = `❌ **Quotation Error:** ${err.message || 'An unexpected calculation error occurred.'}`;
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: errMsg });
        } else {
          await interaction.reply({ content: errMsg, ephemeral: true });
        }
      }
    }
  });

  client.login(TOKEN).catch((err) => {
    console.error('Failed to log in to Discord Gateway:', err.message);
  });

  return client;
}

if (process.argv[1]?.includes('run-bot')) {
  startDiscordBot();
}
