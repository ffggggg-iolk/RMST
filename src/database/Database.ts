/**
 * Database Layer & Repository Implementations
 * SQLite / PostgreSQL-compatible architecture with snapshot preservation.
 */

import {
  GuildSettingsRecord,
  ProductRecord,
  PricingRuleRecord,
  DiscountRecord,
  QuotationRecord,
  QuotationItemRecord,
  QuotationSnapshotRecord,
  TicketRecord,
  AuditLogRecord,
} from './types';
import { SAMPLE_PRODUCTS, SAMPLE_DISCOUNTS } from '../config/sampleCatalog';
import { PricingRule, FeeRule, TaxRule, QuoteCalculationResult } from '../pricing/types';

export class AppDatabase {
  private guildSettings: Map<string, GuildSettingsRecord> = new Map();
  private products: Map<string, ProductRecord> = new Map();
  private pricingRules: Map<string, PricingRuleRecord> = new Map();
  private productFees: Map<string, FeeRule[]> = new Map();
  private productTaxes: Map<string, TaxRule[]> = new Map();
  private discounts: Map<string, DiscountRecord> = new Map();
  private quotations: Map<string, QuotationRecord> = new Map();
  private quotationItems: Map<string, QuotationItemRecord[]> = new Map();
  private quotationSnapshots: Map<string, QuotationSnapshotRecord> = new Map();
  private tickets: Map<string, TicketRecord> = new Map();
  private auditLogs: AuditLogRecord[] = [];
  private quoteCounter: number = 100;
  private ticketCounter: number = 200;

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Default Guild Settings
    const defaultGuild: GuildSettingsRecord = {
      guild_id: 'default-guild',
      bot_name: 'Universal Quotation System',
      brand_accent_color: '#5865F2',
      default_currency: 'USD',
      ticket_category_id: 'cat-tickets-123',
      ticket_support_channel_id: 'chan-support-general',
      footer_text: 'Universal Quotation System • Estimates based on current configured pricing & terms',
      logo_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.guildSettings.set(defaultGuild.guild_id, defaultGuild);

    // 2. Seed Sample Products and Rules (Clone to avoid shared instance mutation)
    for (const item of SAMPLE_PRODUCTS) {
      this.products.set(item.product.id, { ...item.product });
      this.pricingRules.set(item.pricingRule.id, {
        id: item.pricingRule.id,
        product_id: item.product.id,
        pricing_model: item.pricingRule.pricingModel,
        base_price: item.pricingRule.basePrice,
        tiers_json: item.pricingRule.tiers ? JSON.stringify(item.pricingRule.tiers) : undefined,
        variable_config_json: item.pricingRule.variableConfig
          ? JSON.stringify(item.pricingRule.variableConfig)
          : undefined,
        subscription_config_json: item.pricingRule.subscriptionConfig
          ? JSON.stringify(item.pricingRule.subscriptionConfig)
          : undefined,
        bundle_config_json: item.pricingRule.bundleConfig
          ? JSON.stringify(item.pricingRule.bundleConfig)
          : undefined,
        custom_config_json: item.pricingRule.customConfig
          ? JSON.stringify(item.pricingRule.customConfig)
          : undefined,
        allowed_currencies_json: JSON.stringify(item.pricingRule.allowedCurrencies),
      });

      this.productFees.set(item.product.id, item.fees.map((f) => ({ ...f })));
      this.productTaxes.set(item.product.id, item.taxRules.map((t) => ({ ...t })));
    }

    // 3. Seed Sample Discounts
    for (const d of SAMPLE_DISCOUNTS) {
      this.discounts.set(d.id, {
        id: d.id,
        guild_id: 'default-guild',
        code: d.code,
        name: d.name,
        discount_type: d.discountType,
        value: d.value,
        min_order_subtotal: d.minOrderSubtotal,
        max_discount_amount: d.maxDiscountAmount,
        is_active: d.isActive,
        created_at: new Date().toISOString(),
      });
    }

    // 4. Seed an illustrative initial quote snapshot
    const initQuoteId = 'quote-seed-1';
    const initQuoteNum = 'Q-000100';
    this.quotations.set(initQuoteId, {
      id: initQuoteId,
      quote_number: initQuoteNum,
      guild_id: 'default-guild',
      user_id: 'user-demo-admin',
      user_tag: 'Commander#0001',
      total_items: 1,
      currency: 'USD',
      exchange_rate: 1.0,
      raw_subtotal: 150.0,
      discount_amount: 15.0,
      discount_code: 'WELCOME10',
      total_fees: 15.0,
      total_tax: 0.0,
      final_total: 150.0,
      status: 'active',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });

    this.quotationItems.set(initQuoteId, [
      {
        id: 'item-seed-1',
        quotation_id: initQuoteId,
        product_id: 'prod-custom-bot',
        product_name: 'Custom Discord Bot Development',
        quantity: 1,
        unit_price: 150.0,
        subtotal: 150.0,
      },
    ]);

    this.quotationSnapshots.set(initQuoteId, {
      id: 'snap-seed-1',
      quotation_id: initQuoteId,
      snapshot_json: JSON.stringify({
        productName: 'Custom Discord Bot Development',
        quantity: 1,
        unitPrice: 150.0,
        rawSubtotal: 150.0,
        discountAmount: 15.0,
        totalFees: 15.0,
        totalTax: 0.0,
        finalTotal: 150.0,
        currency: 'USD',
        exchangeRate: 1.0,
        calculationSteps: ['Initial baseline seed quotation record.'],
      }),
      frozen_at: new Date().toISOString(),
    });
  }

  // --- Guild Settings ---
  public getGuildSettings(guildId: string): GuildSettingsRecord {
    if (!this.guildSettings.has(guildId)) {
      const newSettings: GuildSettingsRecord = {
        guild_id: guildId,
        bot_name: 'Universal Quotation System',
        brand_accent_color: '#5865F2',
        default_currency: 'USD',
        footer_text: 'Universal Quotation System • Estimates based on configured catalog rates',
        logo_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.guildSettings.set(guildId, newSettings);
      return newSettings;
    }
    return this.guildSettings.get(guildId)!;
  }

  public updateGuildSettings(guildId: string, updates: Partial<GuildSettingsRecord>): GuildSettingsRecord {
    const current = this.getGuildSettings(guildId);
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.guildSettings.set(guildId, updated);
    return updated;
  }

  // --- Products & Pricing Rules ---
  public getAllProducts(guildId?: string): ProductRecord[] {
    const list = Array.from(this.products.values());
    if (!guildId || guildId === 'default-guild') return list;
    return list.filter((p) => p.guild_id === guildId || p.guild_id === 'default-guild');
  }

  public getProductById(id: string): ProductRecord | null {
    return this.products.get(id) || null;
  }

  public getProductByName(name: string): ProductRecord | null {
    const lower = name.toLowerCase().trim();
    for (const p of this.products.values()) {
      if (p.name.toLowerCase() === lower || p.name.toLowerCase().includes(lower)) {
        return p;
      }
    }
    return null;
  }

  public getPricingRuleByProductId(productId: string): PricingRule | null {
    for (const r of this.pricingRules.values()) {
      if (r.product_id === productId) {
        return {
          id: r.id,
          productId: r.product_id,
          pricingModel: r.pricing_model as any,
          basePrice: r.base_price,
          tiers: r.tiers_json ? JSON.parse(r.tiers_json) : undefined,
          variableConfig: r.variable_config_json ? JSON.parse(r.variable_config_json) : undefined,
          subscriptionConfig: r.subscription_config_json ? JSON.parse(r.subscription_config_json) : undefined,
          bundleConfig: r.bundle_config_json ? JSON.parse(r.bundle_config_json) : undefined,
          customConfig: r.custom_config_json ? JSON.parse(r.custom_config_json) : undefined,
          minQuantity: 1,
          allowedCurrencies: r.allowed_currencies_json ? JSON.parse(r.allowed_currencies_json) : ['USD'],
        };
      }
    }
    return null;
  }

  public getProductFees(productId: string): FeeRule[] {
    return this.productFees.get(productId) || [];
  }

  public getProductTaxes(productId: string): TaxRule[] {
    return this.productTaxes.get(productId) || [];
  }

  public saveProduct(
    product: ProductRecord,
    pricingRule: PricingRule,
    fees: FeeRule[] = [],
    taxes: TaxRule[] = []
  ): void {
    this.products.set(product.id, product);
    this.pricingRules.set(pricingRule.id, {
      id: pricingRule.id,
      product_id: product.id,
      pricing_model: pricingRule.pricingModel,
      base_price: pricingRule.basePrice,
      tiers_json: pricingRule.tiers ? JSON.stringify(pricingRule.tiers) : undefined,
      variable_config_json: pricingRule.variableConfig ? JSON.stringify(pricingRule.variableConfig) : undefined,
      subscription_config_json: pricingRule.subscriptionConfig
        ? JSON.stringify(pricingRule.subscriptionConfig)
        : undefined,
      bundle_config_json: pricingRule.bundleConfig ? JSON.stringify(pricingRule.bundleConfig) : undefined,
      custom_config_json: pricingRule.customConfig ? JSON.stringify(pricingRule.customConfig) : undefined,
      allowed_currencies_json: JSON.stringify(pricingRule.allowedCurrencies),
    });
    this.productFees.set(product.id, fees);
    this.productTaxes.set(product.id, taxes);
  }

  public deleteProduct(id: string): boolean {
    const deleted = this.products.delete(id);
    for (const [rId, rule] of this.pricingRules.entries()) {
      if (rule.product_id === id) {
        this.pricingRules.delete(rId);
      }
    }
    this.productFees.delete(id);
    this.productTaxes.delete(id);
    return deleted;
  }

  // --- Discounts ---
  public getDiscountByCode(guildId: string, code: string): DiscountRecord | null {
    const upperCode = code.toUpperCase().trim();
    for (const d of this.discounts.values()) {
      if (d.code.toUpperCase() === upperCode && d.is_active) {
        return d;
      }
    }
    return null;
  }

  public getAllDiscounts(guildId?: string): DiscountRecord[] {
    return Array.from(this.discounts.values());
  }

  public saveDiscount(discount: DiscountRecord): void {
    this.discounts.set(discount.id, discount);
  }

  public deleteDiscount(id: string): boolean {
    return this.discounts.delete(id);
  }

  // --- Quotations & Snapshots ---
  public createQuotation(
    quoteData: Omit<QuotationRecord, 'id' | 'quote_number' | 'created_at' | 'expires_at'>,
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number; options?: any }>,
    snapshot: QuoteCalculationResult
  ): QuotationRecord {
    this.quoteCounter += 1;
    const quoteNumber = `Q-${String(this.quoteCounter).padStart(6, '0')}`;
    const id = `quote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 86400000).toISOString(); // 14-day validity

    const record: QuotationRecord = {
      ...quoteData,
      id,
      quote_number: quoteNumber,
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };

    this.quotations.set(id, record);

    // Save line items
    const itemRecords: QuotationItemRecord[] = items.map((it, idx) => ({
      id: `${id}-item-${idx}`,
      quotation_id: id,
      product_id: it.productId,
      product_name: it.productName,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      subtotal: it.subtotal,
      options_json: it.options ? JSON.stringify(it.options) : undefined,
    }));
    this.quotationItems.set(id, itemRecords);

    // Freeze snapshot permanently
    this.quotationSnapshots.set(id, {
      id: `snap-${id}`,
      quotation_id: id,
      snapshot_json: JSON.stringify(snapshot),
      frozen_at: now.toISOString(),
    });

    return record;
  }

  public getQuotationByNumber(quoteNumber: string): QuotationRecord | null {
    const formatted = quoteNumber.toUpperCase().trim();
    for (const q of this.quotations.values()) {
      if (q.quote_number.toUpperCase() === formatted) {
        return q;
      }
    }
    return null;
  }

  public getQuotationById(id: string): QuotationRecord | null {
    return this.quotations.get(id) || null;
  }

  public getQuotationSnapshot(quotationId: string): QuotationSnapshotRecord | null {
    return this.quotationSnapshots.get(quotationId) || null;
  }

  public getQuotationItems(quotationId: string): QuotationItemRecord[] {
    return this.quotationItems.get(quotationId) || [];
  }

  public getUserQuotations(userId: string, limit: number = 10): QuotationRecord[] {
    return Array.from(this.quotations.values())
      .filter((q) => q.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public getAllQuotations(limit: number = 50): QuotationRecord[] {
    return Array.from(this.quotations.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // --- Tickets ---
  public createTicket(quotationId: string, guildId: string, userId: string, userTag: string, channelId: string): TicketRecord {
    this.ticketCounter += 1;
    const ticketNumber = `TICK-${this.ticketCounter}`;
    const id = `ticket-${Date.now()}`;
    const record: TicketRecord = {
      id,
      ticket_number: ticketNumber,
      quotation_id: quotationId,
      guild_id: guildId,
      user_id: userId,
      user_tag: userTag,
      channel_id: channelId,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    this.tickets.set(id, record);
    return record;
  }

  public getTicketsByQuoteId(quoteId: string): TicketRecord[] {
    return Array.from(this.tickets.values()).filter((t) => t.quotation_id === quoteId);
  }

  public getAllTickets(): TicketRecord[] {
    return Array.from(this.tickets.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- Audit Logs ---
  public addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'created_at'>): void {
    this.auditLogs.unshift({
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    });
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(guildId?: string, limit: number = 25): AuditLogRecord[] {
    if (!guildId || guildId === 'default-guild') return this.auditLogs.slice(0, limit);
    return this.auditLogs.filter((l) => l.guild_id === guildId).slice(0, limit);
  }
}

export const defaultDatabase = new AppDatabase();
