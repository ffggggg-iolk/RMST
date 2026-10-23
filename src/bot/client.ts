/**
 * Discord Bot Interaction Handler & Client Architecture
 * Supports both real Discord.js Gateway connection and live Discord UI simulation.
 */

import { defaultDatabase, AppDatabase } from '../database/Database';
import { defaultQuotationService, QuotationService } from '../services/QuotationService';
import { QuotationEmbedBuilder, DiscordMessagePayload } from './embeds/quotationEmbed';
import { defaultCurrencyManager, CurrencyManager } from '../currency/CurrencyManager';

export interface CommandInteractionContext {
  commandName: string;
  subcommandGroup?: string;
  subcommand?: string;
  options: Record<string, any>;
  guildId: string;
  userId: string;
  userTag: string;
  channelId: string;
}

export class BotInteractionDispatcher {
  constructor(
    private db: AppDatabase = defaultDatabase,
    private quoteService: QuotationService = defaultQuotationService,
    private currencyMgr: CurrencyManager = defaultCurrencyManager
  ) {}

  /**
   * Main command router
   */
  public async handleCommand(ctx: CommandInteractionContext): Promise<DiscordMessagePayload> {
    const settings = this.db.getGuildSettings(ctx.guildId);

    switch (ctx.commandName) {
      // 1. /quote
      case 'quote': {
        const productName = String(ctx.options.product || '');
        const quantity = ctx.options.quantity ? Number(ctx.options.quantity) : 1;
        const budget = ctx.options.budget ? Number(ctx.options.budget) : undefined;
        const currency = ctx.options.currency ? String(ctx.options.currency).toUpperCase() : settings.default_currency;
        const discountCode = ctx.options.discount_code ? String(ctx.options.discount_code) : undefined;
        const showDetails = ctx.options.details !== false;

        const res = await this.quoteService.generateQuote({
          guildId: ctx.guildId,
          userId: ctx.userId,
          userTag: ctx.userTag,
          productId: productName,
          quantity,
          spendingBudget: budget,
          currency,
          discountCode,
          saveToDatabase: true,
        });

        return QuotationEmbedBuilder.buildQuoteEmbed(
          res.calculation,
          res.product,
          settings,
          res.record?.quote_number,
          showDetails
        );
      }

      // 2. /calculate
      case 'calculate': {
        const budget = Number(ctx.options.budget || 100);
        const currency = ctx.options.currency ? String(ctx.options.currency).toUpperCase() : settings.default_currency;
        const productName = ctx.options.product ? String(ctx.options.product) : undefined;

        let targetProduct = productName
          ? this.db.getProductById(productName) || this.db.getProductByName(productName)
          : null;

        if (!targetProduct) {
          // If no product selected, pick the first available catalog product and prompt choice
          const all = this.db.getAllProducts(ctx.guildId).filter((p) => p.is_available);
          targetProduct = all[0];
        }

        if (!targetProduct) {
          return {
            embeds: [
              {
                title: '❌ No Available Products',
                description: 'There are currently no active products in the store catalog to calculate affordability.',
                color: 0xed4245,
                fields: [],
              },
            ],
            components: [],
          };
        }

        const res = await this.quoteService.generateQuote({
          guildId: ctx.guildId,
          userId: ctx.userId,
          userTag: ctx.userTag,
          productId: targetProduct.id,
          spendingBudget: budget,
          currency,
          saveToDatabase: false,
        });

        return QuotationEmbedBuilder.buildCalculateEmbed(res.calculation, targetProduct, settings, budget);
      }

      // 3. /compare
      case 'compare': {
        const prodA = String(ctx.options.product_a || '');
        const prodB = String(ctx.options.product_b || '');
        const qtyA = ctx.options.quantity_a ? Number(ctx.options.quantity_a) : 1;
        const qtyB = ctx.options.quantity_b ? Number(ctx.options.quantity_b) : 1;
        const currency = ctx.options.currency ? String(ctx.options.currency).toUpperCase() : settings.default_currency;

        const comparison = this.quoteService.compareProducts([prodA, prodB], [qtyA, qtyB], currency);
        return QuotationEmbedBuilder.buildCompareEmbed(comparison, settings, currency);
      }

      // 4. /product
      case 'product': {
        const nameOrId = String(ctx.options.product || '');
        const product = this.db.getProductById(nameOrId) || this.db.getProductByName(nameOrId);
        if (!product) {
          throw new Error(`Product "${nameOrId}" was not found in the catalog.`);
        }
        const rule = this.db.getPricingRuleByProductId(product.id);
        return QuotationEmbedBuilder.buildProductEmbed(product, rule, settings);
      }

      // 5. /budget (Multi-item cart builder)
      case 'budget': {
        const limit = ctx.options.spending_limit ? Number(ctx.options.spending_limit) : undefined;
        const currency = ctx.options.currency ? String(ctx.options.currency).toUpperCase() : settings.default_currency;
        const products = this.db.getAllProducts(ctx.guildId);

        return {
          embeds: [
            {
              title: `🧺 Interactive Budget Cart Builder — ${settings.bot_name}`,
              description: `Select products from the catalog to build a bundled quotation. Target Spending Limit: **${limit ? `${currency} ${limit.toFixed(2)}` : 'None specified'}**.`,
              color: QuotationEmbedBuilder.hexToInt(settings.brand_accent_color),
              fields: [
                {
                  name: '🛒 Current Cart Items',
                  value: '*Your cart is currently empty. Use the product selector below to add items.*',
                  inline: false,
                },
                {
                  name: '💡 How to use',
                  value: '1. Select an item from the dropdown below\n2. Adjust quantity\n3. Click **Generate Quotation** to lock in pricing.',
                  inline: false,
                },
              ],
            },
          ],
          components: [
            {
              type: 'action_row',
              components: [
                {
                  customId: 'budget_select_product',
                  placeholder: '➕ Select a product to add to cart...',
                  options: products.slice(0, 10).map((p) => ({
                    label: p.name,
                    value: p.id,
                    description: `${p.currency} ${p.base_price.toFixed(2)} • ${p.category}`,
                    emoji: '📦',
                  })),
                },
              ],
            },
          ],
        };
      }

      // 6. /history
      case 'history': {
        const quoteId = ctx.options.quote_id ? String(ctx.options.quote_id).trim() : undefined;

        if (quoteId) {
          const quote = this.quoteService.getQuotationByNumber(quoteId);
          if (!quote) {
            throw new Error(`No quotation found matching ID "${quoteId}".`);
          }
          const product = this.db.getProductById(quote.items[0]?.product_id || '') || {
            name: quote.items[0]?.product_name || 'Multi-Item Order',
            category: 'Quotation Order',
            is_available: true,
          } as any;

          return QuotationEmbedBuilder.buildQuoteEmbed(
            quote.snapshot,
            product,
            settings,
            quote.record.quote_number,
            true
          );
        }

        const userQuotes = this.db.getUserQuotations(ctx.userId, 5);
        const fields = userQuotes.map((q) => ({
          name: `🧾 ${q.quote_number} • ${q.currency} ${q.final_total.toFixed(2)}`,
          value: `Status: **${q.status.toUpperCase()}** | Created: ${new Date(q.created_at).toLocaleDateString()} | Items: ${q.total_items}`,
          inline: false,
        }));

        return {
          embeds: [
            {
              title: `📜 Quotation History — ${ctx.userTag}`,
              description: `Viewing recent quotations and frozen price records for your account.`,
              color: QuotationEmbedBuilder.hexToInt(settings.brand_accent_color),
              fields: fields.length > 0 ? fields : [{ name: 'No Quotations', value: 'You have not generated any quotations yet. Use `/quote` to create one!' }],
              footer: { text: settings.footer_text },
            },
          ],
          components: [],
        };
      }

      // 7. /help
      case 'help': {
        return QuotationEmbedBuilder.buildHelpEmbed(settings);
      }

      // 8. /admin
      case 'admin': {
        return this.handleAdminCommand(ctx, settings);
      }

      default:
        throw new Error(`Unknown command /${ctx.commandName}`);
    }
  }

  private handleAdminCommand(ctx: CommandInteractionContext, settings: any): DiscordMessagePayload {
    const embedColor = QuotationEmbedBuilder.hexToInt(settings.brand_accent_color);
    const subGrp = ctx.subcommandGroup;
    const sub = ctx.subcommand;

    // Log admin action to audit log
    this.db.addAuditLog({
      guild_id: ctx.guildId,
      user_id: ctx.userId,
      user_tag: ctx.userTag,
      action: `/admin ${subGrp || ''} ${sub || ''}`.trim(),
      target_type: 'command',
      target_id: sub || 'admin',
      details_json: JSON.stringify(ctx.options),
    });

    if (subGrp === 'product') {
      if (sub === 'list') {
        const products = this.db.getAllProducts(ctx.guildId);
        const fields = products.map((p) => ({
          name: `${p.is_available ? '🟢' : '🔴'} ${p.name} (\`${p.id}\`)`,
          value: `**Price:** ${p.currency} ${p.base_price.toFixed(2)} | **Type:** ${p.product_type} | **Category:** ${p.category}`,
          inline: false,
        }));
        return {
          embeds: [
            {
              title: `🛡️ Administrator Catalog Listing (${products.length} Products)`,
              description: 'Active products registered in the Universal Quotation engine.',
              color: embedColor,
              fields,
            },
          ],
          components: [],
        };
      }

      if (sub === 'availability') {
        const pId = String(ctx.options.product_id);
        const avail = Boolean(ctx.options.available);
        const p = this.db.getProductById(pId);
        if (!p) throw new Error(`Product ${pId} not found.`);
        p.is_available = avail;
        p.updated_at = new Date().toISOString();
        p.updated_by = ctx.userTag;
        return {
          embeds: [
            {
              title: `✅ Product Availability Updated`,
              description: `Product **${p.name}** is now **${avail ? 'Available (🟢 In Stock)' : 'Unavailable (🔴 Out of Stock)'}**.`,
              color: avail ? 0x57f287 : 0xed4245,
              fields: [],
            },
          ],
          components: [],
        };
      }

      if (sub === 'delete') {
        const pId = String(ctx.options.product_id);
        const deleted = this.db.deleteProduct(pId);
        return {
          embeds: [
            {
              title: deleted ? `🗑️ Product Deleted` : `❌ Product Not Found`,
              description: deleted
                ? `Product \`${pId}\` and all associated pricing rules have been purged.`
                : `No product found matching ID \`${pId}\`.`,
              color: deleted ? 0x57f287 : 0xed4245,
              fields: [],
            },
          ],
          components: [],
        };
      }
    }

    if (subGrp === 'discount') {
      if (sub === 'create') {
        const code = String(ctx.options.code).toUpperCase().trim();
        const type = ctx.options.type as 'percentage' | 'fixed';
        const value = Number(ctx.options.value);
        this.db.saveDiscount({
          id: `disc-${Date.now()}`,
          guild_id: ctx.guildId,
          code,
          name: `Promo Code ${code}`,
          discount_type: type,
          value,
          is_active: true,
          created_at: new Date().toISOString(),
        });
        return {
          embeds: [
            {
              title: `🎉 Coupon Created: ${code}`,
              description: `Discount code **${code}** successfully activated with value: **${type === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`}**.`,
              color: 0x57f287,
              fields: [],
            },
          ],
          components: [],
        };
      }

      if (sub === 'list') {
        const discounts = this.db.getAllDiscounts(ctx.guildId);
        return {
          embeds: [
            {
              title: `🎟️ Configured Discount Coupons`,
              description: discounts
                .map((d) => `• **${d.code}**: ${d.discount_type === 'percentage' ? `${d.value}% Off` : `$${d.value} Off`} (${d.is_active ? 'Active' : 'Disabled'})`)
                .join('\n'),
              color: embedColor,
              fields: [],
            },
          ],
          components: [],
        };
      }
    }

    if (subGrp === 'currency') {
      if (sub === 'set_rate') {
        const curr = String(ctx.options.currency).toUpperCase();
        const rate = Number(ctx.options.rate);
        this.currencyMgr.setRate('USD', curr, rate, `Staff Update by ${ctx.userTag}`);
        return {
          embeds: [
            {
              title: `💱 Exchange Rate Updated`,
              description: `1 USD is now configured as **${rate} ${curr}**.`,
              color: 0x57f287,
              fields: [],
            },
          ],
          components: [],
        };
      }

      if (sub === 'rates') {
        const currencies = this.currencyMgr.getSupportedCurrencies();
        const lines = currencies.map((c) => {
          const rateInfo = this.currencyMgr.getExchangeRate('USD', c.code);
          return `• **${c.code}** (${c.symbol}): \`${rateInfo?.rate ?? 1.0}\` *(Source: ${rateInfo?.source || 'N/A'})*`;
        });
        return {
          embeds: [
            {
              title: `💱 Active Currency Rates (Baseline: 1 USD)`,
              description: lines.join('\n'),
              color: embedColor,
              fields: [],
            },
          ],
          components: [],
        };
      }
    }

    if (sub === 'statistics') {
      const allQuotes = this.db.getAllQuotations(100);
      const totalVolume = allQuotes.reduce((acc, q) => acc + q.final_total, 0);
      const activeTickets = this.db.getAllTickets().filter((t) => t.status === 'open').length;

      return {
        embeds: [
          {
            title: `📊 Store Performance & Quotation Analytics`,
            description: `Live commercial metrics for **${settings.bot_name}**.`,
            color: embedColor,
            fields: [
              { name: '🧾 Total Quotations Generated', value: `${allQuotes.length}`, inline: true },
              { name: '💰 Total Quoted Volume (USD Est.)', value: `$${totalVolume.toFixed(2)}`, inline: true },
              { name: '🎫 Active Support Tickets', value: `${activeTickets}`, inline: true },
            ],
          },
        ],
        components: [],
      };
    }

    if (sub === 'audit_log') {
      const logs = this.db.getAuditLogs(ctx.guildId, 10);
      return {
        embeds: [
          {
            title: `🛡️ Server Administration Audit Log`,
            description: logs
              .map((l) => `\`${new Date(l.created_at).toLocaleTimeString()}\` **${l.user_tag}**: ${l.action}`)
              .join('\n'),
            color: embedColor,
            fields: [],
          },
        ],
        components: [],
      };
    }

    return {
      embeds: [
        {
          title: `🛡️ Administration Command Executed`,
          description: `Action completed successfully.`,
          color: embedColor,
          fields: [],
        },
      ],
      components: [],
    };
  }
}

export const defaultInteractionDispatcher = new BotInteractionDispatcher();
