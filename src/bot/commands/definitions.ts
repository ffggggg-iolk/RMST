/**
 * Slash Command Definitions for Discord.js v14
 * Full parameter typing, autocomplete compatibility, and subcommand groups.
 */

import { SlashCommandBuilder } from 'discord.js';

export const slashCommands = [
  // COMMAND A: /quote
  new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Calculate an accurate price quotation for a catalog product or service')
    .addStringOption((opt) =>
      opt
        .setName('product')
        .setDescription('Select or enter the catalog product name')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('quantity')
        .setDescription('Number of units or requested quantity')
        .setRequired(false)
        .setMinValue(1)
    )
    .addNumberOption((opt) =>
      opt
        .setName('budget')
        .setDescription('Optional maximum spending budget')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((opt) =>
      opt
        .setName('currency')
        .setDescription('Desired target currency (e.g. USD, EUR, GBP, BRL)')
        .setRequired(false)
        .addChoices(
          { name: 'USD - US Dollar ($)', value: 'USD' },
          { name: 'EUR - Euro (€)', value: 'EUR' },
          { name: 'GBP - British Pound (£)', value: 'GBP' },
          { name: 'CAD - Canadian Dollar (CA$)', value: 'CAD' },
          { name: 'AUD - Australian Dollar (A$)', value: 'AUD' },
          { name: 'BRL - Brazilian Real (R$)', value: 'BRL' },
          { name: 'MXN - Mexican Peso (MX$)', value: 'MXN' },
          { name: 'PEN - Peruvian Sol (S/.)', value: 'PEN' },
          { name: 'JPY - Japanese Yen (¥)', value: 'JPY' }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName('discount_code')
        .setDescription('Optional promotional coupon or discount code')
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName('details')
        .setDescription('Display complete fee, tax, and calculation breakdown')
        .setRequired(false)
    ),

  // COMMAND B: /calculate
  new SlashCommandBuilder()
    .setName('calculate')
    .setDescription('Determine maximum affordable quantities and line-item totals for your spending budget')
    .addNumberOption((opt) =>
      opt
        .setName('budget')
        .setDescription('Your available spending budget')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption((opt) =>
      opt
        .setName('currency')
        .setDescription('Currency of your spending budget')
        .setRequired(false)
        .addChoices(
          { name: 'USD ($)', value: 'USD' },
          { name: 'EUR (€)', value: 'EUR' },
          { name: 'GBP (£)', value: 'GBP' },
          { name: 'CAD (CA$)', value: 'CAD' },
          { name: 'BRL (R$)', value: 'BRL' }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName('product')
        .setDescription('Specific product to evaluate affordability for')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  // COMMAND C: /compare
  new SlashCommandBuilder()
    .setName('compare')
    .setDescription('Compare multiple catalog products or quantity tiers side-by-side')
    .addStringOption((opt) =>
      opt
        .setName('product_a')
        .setDescription('First product to compare')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('product_b')
        .setDescription('Second product to compare')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('quantity_a')
        .setDescription('Quantity for first product (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('quantity_b')
        .setDescription('Quantity for second product (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((opt) =>
      opt
        .setName('currency')
        .setDescription('Comparison currency (default: USD)')
        .setRequired(false)
    ),

  // COMMAND D: /product
  new SlashCommandBuilder()
    .setName('product')
    .setDescription('View detailed catalog specs, pricing tiers, and delivery terms')
    .addStringOption((opt) =>
      opt
        .setName('product')
        .setDescription('Product name or identifier')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  // COMMAND E: /budget
  new SlashCommandBuilder()
    .setName('budget')
    .setDescription('Open the interactive multi-item quotation builder and budget planner')
    .addNumberOption((opt) =>
      opt
        .setName('spending_limit')
        .setDescription('Optional overall spending limit target')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((opt) =>
      opt
        .setName('currency')
        .setDescription('Budget currency (default: USD)')
        .setRequired(false)
    ),

  // COMMAND F: /history
  new SlashCommandBuilder()
    .setName('history')
    .setDescription('Browse saved quotation records and frozen calculation snapshots')
    .addStringOption((opt) =>
      opt
        .setName('quote_id')
        .setDescription('Specific Quote ID to inspect (e.g. Q-000100)')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('status')
        .setDescription('Filter by quotation status')
        .setRequired(false)
        .addChoices(
          { name: 'Active', value: 'active' },
          { name: 'Ordered', value: 'ordered' },
          { name: 'Expired', value: 'expired' }
        )
    ),

  // COMMAND G: /help
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show complete command reference, examples, and how to use the bot'),

  // COMMAND H: /admin
  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Administrative management commands for server staff')
    // admin product
    .addSubcommandGroup((grp) =>
      grp
        .setName('product')
        .setDescription('Catalog product administration')
        .addSubcommand((sub) =>
          sub
            .setName('list')
            .setDescription('List all catalog products and statuses')
        )
        .addSubcommand((sub) =>
          sub
            .setName('availability')
            .setDescription('Toggle in-stock or availability status for a product')
            .addStringOption((opt) => opt.setName('product_id').setDescription('Product ID').setRequired(true))
            .addBooleanOption((opt) => opt.setName('available').setDescription('Is available').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('delete')
            .setDescription('Remove a product from the active catalog')
            .addStringOption((opt) => opt.setName('product_id').setDescription('Product ID').setRequired(true))
        )
    )
    // admin discount
    .addSubcommandGroup((grp) =>
      grp
        .setName('discount')
        .setDescription('Manage promotional codes and coupons')
        .addSubcommand((sub) =>
          sub
            .setName('create')
            .setDescription('Create a new coupon code')
            .addStringOption((opt) => opt.setName('code').setDescription('Coupon code (e.g. SAVE20)').setRequired(true))
            .addStringOption((opt) =>
              opt
                .setName('type')
                .setDescription('Discount type')
                .setRequired(true)
                .addChoices({ name: 'Percentage (%)', value: 'percentage' }, { name: 'Fixed Amount ($)', value: 'fixed' })
            )
            .addNumberOption((opt) => opt.setName('value').setDescription('Discount value').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('list')
            .setDescription('List all active and inactive discount codes')
        )
    )
    // admin currency
    .addSubcommandGroup((grp) =>
      grp
        .setName('currency')
        .setDescription('Manage exchange rates and currency rules')
        .addSubcommand((sub) =>
          sub
            .setName('set_rate')
            .setDescription('Set exchange rate relative to USD')
            .addStringOption((opt) => opt.setName('currency').setDescription('Target currency code (e.g. EUR)').setRequired(true))
            .addNumberOption((opt) => opt.setName('rate').setDescription('Exchange rate (e.g. 0.92)').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('rates')
            .setDescription('Display all current exchange rates and timestamps')
        )
    )
    // admin settings
    .addSubcommand((sub) =>
      sub
        .setName('settings')
        .setDescription('Configure store branding, footer, and ticket channel')
        .addStringOption((opt) => opt.setName('bot_name').setDescription('Store or bot name').setRequired(false))
        .addStringOption((opt) => opt.setName('accent_color').setDescription('Hex color (e.g. #5865F2)').setRequired(false))
        .addStringOption((opt) => opt.setName('ticket_channel').setDescription('Support ticket channel ID').setRequired(false))
    )
    // admin statistics
    .addSubcommand((sub) =>
      sub
        .setName('statistics')
        .setDescription('View quotation volume, top requested products, and total estimates')
    )
    // admin audit-log
    .addSubcommand((sub) =>
      sub
        .setName('audit_log')
        .setDescription('View server administration audit log records')
    ),
];
