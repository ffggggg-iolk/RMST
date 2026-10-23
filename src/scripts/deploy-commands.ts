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

async function deploy() {
  if (!TOKEN || !CLIENT_ID) {
    console.error('❌ Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in environment.');
    console.log('Please set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in your .env file.');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commandsJson = slashCommands.map((cmd) => cmd.toJSON());

  try {
    console.log(`⏳ Started refreshing ${commandsJson.length} application (/) commands...`);

    let data: any;
    if (GUILD_ID) {
      console.log(`🎯 Registering guild commands to Guild ID: ${GUILD_ID}`);
      data = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commandsJson }
      );
    } else {
      console.log('🌐 Registering global application commands...');
      data = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commandsJson }
      );
    }

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands!`);
  } catch (error) {
    console.error('❌ Error deploying application commands:', error);
    process.exit(1);
  }
}

if (process.argv[1]?.includes('deploy-commands')) {
  deploy();
}

export { deploy };
