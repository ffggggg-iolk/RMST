/**
 * Root Entry Point for Bot-Hosting.net and Container Hosts
 * Launches the Discord Gateway Bot using tsx runtime
 */

import { spawn } from 'child_process';

console.log('🚀 Starting Universal Quotation Discord Bot on Hosting Environment...');

const botProcess = spawn('npx', ['tsx', 'src/scripts/run-bot.ts'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

botProcess.on('error', (err) => {
  console.error('Failed to start bot process:', err);
  process.exit(1);
});

botProcess.on('exit', (code) => {
  console.log(`Bot process exited with code ${code}`);
  process.exit(code || 0);
});
