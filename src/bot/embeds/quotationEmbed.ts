/**
 * Discord Embed Builders
 * Designed for Discord.js v14 and cross-compatible with Discord simulators
 */

import { QuoteCalculationResult } from '../../pricing/types';
import { ProductRecord, QuotationRecord, GuildSettingsRecord } from '../../database/types';
import { CompareItemResult } from '../../services/QuotationService';

export interface DiscordEmbedPayload {
  title: string;
  description?: string;
  color: number;
  author?: { name: string; icon_url?: string };
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export interface DiscordButtonPayload {
  customId: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
  emoji?: string;
  disabled?: boolean;
}

export interface DiscordSelectMenuPayload {
  customId: string;
  placeholder: string;
  options: Array<{
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
  }>;
}

export interface DiscordMessagePayload {
  content?: string;
  embeds: DiscordEmbedPayload[];
  components: Array<{
    type: 'action_row';
    components: (DiscordButtonPayload | DiscordSelectMenuPayload)[];
  }>;
}

export class QuotationEmbedBuilder {
  /**
   * Convert hex color string e.g. '#5865F2' to Discord integer color
   */
  public static hexToInt(hex: string): number {
    return parseInt(hex.replace('#', ''), 16) || 0x5865f2;
  }

  /**
   * Command A: /quote response embed
   */
  public static buildQuoteEmbed(
    calc: QuoteCalculationResult,
    product: ProductRecord,
    settings: GuildSettingsRecord,
    quoteNumber?: string,
    showDetails: boolean = true
  ): DiscordMessagePayload {
    const embedColor = this.hexToInt(settings.brand_accent_color);

    const fields: DiscordEmbedPayload['fields'] = [
      { name: '📦 Product', value: `**${product.name}**\n*${product.category}*`, inline: true },
      { name: '🔢 Quantity', value: `${calc.quantity} ${calc.quantity === 1 ? 'unit' : 'units'}`, inline: true },
      { name: '💵 Unit Price', value: `\`${calc.formattedUnitPrice}\``, inline: true },
    ];

    // Detailed breakdown box
    let breakdownText = `**Subtotal:** \`${calc.formattedSubtotal}\`\n`;
    if (calc.discountAmount > 0) {
      breakdownText += `**Discount** (${calc.discountCode || 'Applied'}): \`-${calc.formattedDiscount}\`\n`;
      breakdownText += `**Net Subtotal:** \`${calc.formattedNetSubtotal}\`\n`;
    }

    if (calc.feeItems.length > 0) {
      const feeLines = calc.feeItems.map((f) => `• ${f.label}: \`${f.formatted}\``).join('\n');
      breakdownText += `**Additional Fees:** \`${calc.formattedTotalFees}\`\n${feeLines}\n`;
    }

    if (calc.taxItems.length > 0) {
      const taxLines = calc.taxItems.map((t) => `• ${t.label}: \`${t.formatted}\``).join('\n');
      breakdownText += `**Tax:** \`${calc.formattedTotalTax}\`\n${taxLines}\n`;
    }

    fields.push({
      name: '━━━━━━━━━━━━━━━━ Price Breakdown ━━━━━━━━━━━━━━━━',
      value: breakdownText,
      inline: false,
    });

    // Final total and metadata
    fields.push({
      name: '💰 Estimated Total',
      value: `### ${calc.formattedFinalTotal}`,
      inline: true,
    });

    fields.push({
      name: '⚡ Availability',
      value: product.is_available ? '🟢 In Stock / Ready' : '🔴 Unavailable',
      inline: true,
    });

    if (quoteNumber) {
      fields.push({
        name: '🧾 Quote ID',
        value: `\`${quoteNumber}\``,
        inline: true,
      });
    }

    // Subscription details if applicable
    if (calc.subscriptionDetails) {
      fields.push({
        name: '🔄 Subscription Plan',
        value: `Billing: **${calc.formattedUnitPrice} / ${calc.subscriptionDetails.billingInterval}**\nSetup Fee: \`${calc.subscriptionDetails.setupFee}\`\nInitial Payment: \`${calc.formattedFinalTotal}\``,
        inline: false,
      });
    }

    // Bundle details if applicable
    if (calc.bundleSavings) {
      fields.push({
        name: '🎁 Bundle Discount Savings',
        value: `Standard Individual Price: \`${calc.currency} ${calc.bundleSavings.standardTotal}\`\nTotal Savings: **\`${calc.currency} ${calc.bundleSavings.bundleSavingsAmount}\` (${calc.bundleSavings.savingsPercentage}% Off)**`,
        inline: false,
      });
    }

    // Delivery & Terms
    if (product.delivery_info) {
      fields.push({
        name: '🚚 Estimated Delivery',
        value: product.delivery_info,
        inline: true,
      });
    }

    fields.push({
      name: '📌 How to Proceed',
      value: `To purchase or request a custom order for this quotation, click **Create Purchase Ticket** below or provide Quote ID \`${quoteNumber || 'Q-PENDING'}\` to server staff.`,
      inline: false,
    });

    const embed: DiscordEmbedPayload = {
      title: `🛒 Price Quotation — ${settings.bot_name}`,
      description: `Official cost estimate generated for **${product.name}**. Valid for 14 calendar days from generation date.`,
      color: embedColor,
      fields,
      footer: { text: settings.footer_text },
      timestamp: new Date().toISOString(),
    };

    const components: DiscordMessagePayload['components'] = [
      {
        type: 'action_row',
        components: [
          {
            customId: `ticket_create_${quoteNumber || 'new'}`,
            label: 'Create Purchase Ticket',
            style: 'primary',
            emoji: '🎫',
          },
          {
            customId: `quote_copy_${quoteNumber || 'new'}`,
            label: 'Copy Quote ID',
            style: 'secondary',
            emoji: '📋',
          },
          {
            customId: `product_info_${product.id}`,
            label: 'Product Details',
            style: 'secondary',
            emoji: 'ℹ️',
          },
        ],
      },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Command B: /calculate Budget Calculator embed
   */
  public static buildCalculateEmbed(
    calc: QuoteCalculationResult,
    product: ProductRecord,
    settings: GuildSettingsRecord,
    budget: number
  ): DiscordMessagePayload {
    const embedColor = this.hexToInt(settings.brand_accent_color);
    const analysis = calc.budgetAnalysis;

    const fields: DiscordEmbedPayload['fields'] = [
      { name: '💵 Available Budget', value: `\`${calc.currency} ${budget.toFixed(2)}\``, inline: true },
      { name: '📦 Selected Product', value: `**${product.name}**`, inline: true },
      { name: '🏷️ Unit Price', value: `\`${calc.formattedUnitPrice}\``, inline: true },
      {
        name: '🔢 Maximum Affordable Quantity',
        value: `**${analysis?.maximumAffordableQuantity ?? calc.quantity} units**`,
        inline: true,
      },
      { name: '🧾 Calculated Subtotal', value: `\`${calc.formattedSubtotal}\``, inline: true },
      {
        name: '🪙 Remaining Budget Balance',
        value: `\`${calc.currency} ${(analysis?.remainingBudget ?? 0).toFixed(2)}\``,
        inline: true,
      },
    ];

    if (calc.totalFees > 0 || calc.totalTax > 0) {
      fields.push({
        name: '⚖️ Surcharges Included in Calculation',
        value: `Additional Fees: \`${calc.formattedTotalFees}\` • Tax: \`${calc.formattedTotalTax}\``,
        inline: false,
      });
    }

    const embed: DiscordEmbedPayload = {
      title: `🧮 Budget Affordability Calculator — ${settings.bot_name}`,
      description: `Analysis computed considering all configured taxes, fees, and quantity rules. The calculated maximum affordable quantity does not exceed your spending limit.`,
      color: embedColor,
      fields,
      footer: { text: settings.footer_text },
      timestamp: new Date().toISOString(),
    };

    const components: DiscordMessagePayload['components'] = [
      {
        type: 'action_row',
        components: [
          {
            customId: `quote_run_${product.id}_${analysis?.maximumAffordableQuantity || 1}`,
            label: `Get Quotation for ${analysis?.maximumAffordableQuantity || 1} units`,
            style: 'primary',
            emoji: '🛒',
          },
          {
            customId: 'change_budget_product',
            label: 'Choose Different Product',
            style: 'secondary',
            emoji: '🔄',
          },
        ],
      },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Command C: /compare Multi-Product Comparison embed
   */
  public static buildCompareEmbed(
    comparison: { items: CompareItemResult[]; bestValueByUnit: string; lowestOverallTotal: string },
    settings: GuildSettingsRecord,
    currency: string
  ): DiscordMessagePayload {
    const embedColor = this.hexToInt(settings.brand_accent_color);

    const fields: DiscordEmbedPayload['fields'] = comparison.items.map((item, idx) => ({
      name: `${idx + 1}. ${item.product.name} (Qty: ${item.quantity})`,
      value: `• Unit Price: \`${item.formattedUnitPrice}\`\n• Subtotal: \`${item.formattedSubtotal}\`\n• Fees + Tax: \`${currency} ${(item.fees + item.tax).toFixed(2)}\`\n• **Final Total: \`${item.formattedFinalTotal}\`**\n• Cost per unit: \`${item.formattedCostPerUnit}\`\n• Availability: ${item.isAvailable ? '🟢 Available' : '🔴 Out of Stock'}`,
      inline: false,
    }));

    fields.push({
      name: '📊 Objective Criteria Comparison',
      value: `🏆 **Lowest Cost Per Unit:** ${comparison.bestValueByUnit}\n💵 **Lowest Overall Total:** ${comparison.lowestOverallTotal}`,
      inline: false,
    });

    const embed: DiscordEmbedPayload = {
      title: `⚖️ Product & Service Comparison — ${settings.bot_name}`,
      description: `Direct comparison between ${comparison.items.length} catalog options in **${currency}**.`,
      color: embedColor,
      fields,
      footer: { text: settings.footer_text },
      timestamp: new Date().toISOString(),
    };

    return { embeds: [embed], components: [] };
  }

  /**
   * Command D: /product Details embed
   */
  public static buildProductEmbed(
    product: ProductRecord,
    rule: any,
    settings: GuildSettingsRecord
  ): DiscordMessagePayload {
    const embedColor = this.hexToInt(settings.brand_accent_color);

    const fields: DiscordEmbedPayload['fields'] = [
      { name: '📂 Category', value: product.category, inline: true },
      { name: '🔖 Product Type', value: product.product_type.toUpperCase(), inline: true },
      { name: '💵 Starting Price', value: `\`${product.currency} ${product.base_price.toFixed(2)}\``, inline: true },
      { name: '⚙️ Pricing Model', value: `**${rule.pricingModel.toUpperCase()}**`, inline: true },
      { name: '🔢 Quantity Limits', value: `Min: ${product.min_quantity} | Max: ${product.max_quantity || 'Unlimited'}`, inline: true },
      { name: '⚡ Stock Status', value: product.is_available ? '🟢 In Stock' : '🔴 Unavailable', inline: true },
    ];

    if (product.delivery_info) {
      fields.push({ name: '🚚 Delivery & Fulfillment', value: product.delivery_info, inline: false });
    }

    if (product.terms) {
      fields.push({ name: '📜 Terms & Conditions', value: product.terms, inline: false });
    }

    if (rule.tiers && rule.tiers.length > 0) {
      const tierSummary = rule.tiers
        .map((t: any) => `• ${t.minQuantity}${t.maxQuantity ? ` - ${t.maxQuantity}` : '+'} units: \`$${t.unitPrice.toFixed(2)}\` each (${t.tierLabel || 'Tier'})`)
        .join('\n');
      fields.push({ name: '📊 Volume Pricing Tiers', value: tierSummary, inline: false });
    }

    if (rule.variableConfig?.options) {
      const opts = rule.variableConfig.options
        .map((o: any) => `• **${o.name}**: ${o.modifierType === 'flat' ? `+$${o.priceModifier}` : `×${o.priceModifier} multiplier`}`)
        .join('\n');
      fields.push({ name: '✨ Configurable Options', value: opts, inline: false });
    }

    const embed: DiscordEmbedPayload = {
      title: `📦 ${product.name} — Product Specification`,
      description: product.description,
      color: embedColor,
      fields,
      footer: { text: `Last Updated: ${new Date(product.updated_at).toLocaleDateString()} by ${product.updated_by}` },
      timestamp: new Date().toISOString(),
    };

    const components: DiscordMessagePayload['components'] = [
      {
        type: 'action_row',
        components: [
          {
            customId: `quote_run_${product.id}_1`,
            label: 'Instant Quote (1 unit)',
            style: 'primary',
            emoji: '🛒',
          },
          {
            customId: `budget_add_${product.id}`,
            label: 'Add to Budget Cart',
            style: 'secondary',
            emoji: '➕',
          },
        ],
      },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Command G: /help Embed
   */
  public static buildHelpEmbed(settings: GuildSettingsRecord): DiscordMessagePayload {
    const embedColor = this.hexToInt(settings.brand_accent_color);

    const embed: DiscordEmbedPayload = {
      title: `📖 Universal Quotation System — Command Guide`,
      description: `Welcome to **${settings.bot_name}**! Use slash commands below to calculate prices, plan spending budgets, compare services, and request purchases.`,
      color: embedColor,
      fields: [
        {
          name: '🛒 `/quote [product] [quantity] [budget] [currency] [discount_code] [details]`',
          value: 'Calculate the exact expected price for a product or service with complete line-item breakdown and a unique Quote ID.',
        },
        {
          name: '🧮 `/calculate [budget] [currency] [product]`',
          value: 'Determine the maximum affordable quantity of items that fit into your spending limit after fees, discounts, and taxes.',
        },
        {
          name: '⚖️ `/compare [products] [quantities] [currency]`',
          value: 'Compare multiple products or services side-by-side on unit cost, total price, and delivery timelines.',
        },
        {
          name: '📦 `/product [product]`',
          value: 'View detailed catalog specifications, pricing models, volume tiers, and custom add-on options.',
        },
        {
          name: '🧺 `/budget`',
          value: 'Interactive multi-product quote builder. Add items, adjust quantities, apply promo codes, and generate a bundled quotation.',
        },
        {
          name: '📜 `/history [user] [quote_id] [status]`',
          value: 'Access previous quotations and view frozen price snapshots.',
        },
        {
          name: '🛡️ `/admin [product|pricing|discount|currency|settings|audit-log]`',
          value: 'Staff administration suite for managing catalog items, pricing rules, coupons, exchange rates, and branding.',
        },
      ],
      footer: { text: settings.footer_text },
      timestamp: new Date().toISOString(),
    };

    const components: DiscordMessagePayload['components'] = [
      {
        type: 'action_row',
        components: [
          { customId: 'help_quick_quote', label: 'Try /quote', style: 'primary', emoji: '🛒' },
          { customId: 'help_quick_calc', label: 'Try /calculate', style: 'secondary', emoji: '🧮' },
          { customId: 'help_quick_catalog', label: 'Browse Catalog', style: 'secondary', emoji: '📦' },
        ],
      },
    ];

    return { embeds: [embed], components };
  }
}
