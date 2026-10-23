/**
 * Slash Command Registration Script for Discord REST API
 * Deploys all slash commands to Discord Developer Portal
 * Usage: npx tsx src/scripts/deploy-commands.ts
 */

import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { slashCommands } from '../bot/commands/definitions';

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // Optional: guild-specific deployment for instant updates

async function deploy(): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    console.warn('⚠️ Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID. Slash commands could not be automatically registered.');
    console.log('ℹ️ Ensure DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID are set in your hosting environment variables.');
    return false;
  }

  const rest = new REST({ version: '10' }).setToken(token);
  const commandsJson = slashCommands.map((cmd) => cmd.toJSON());

  try {
    console.log(`⏳ Synchronizing ${commandsJson.length} slash commands with Discord API...`);

    let data: any;
    if (guildId && guildId.trim() !== '') {
      console.log(`🎯 Registering commands immediately to Server (Guild ID): ${guildId}`);
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsJson }
      );
    } else {
      console.log('🌐 Registering global application commands...');
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsJson }
      );
    }

    console.log(`✅ Successfully deployed ${data.length} slash commands to Discord!`);
    return true;
  } catch (error) {
    console.error('❌ Error deploying application commands:', error);
    return false;
  }
}

if (process.argv[1]?.includes('deploy-commands')) {
  deploy().then((success) => {
    if (!success) process.exit(1);
  });
}

export { deploy };
