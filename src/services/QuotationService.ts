/**
 * QuotationService
 * Core orchestration between database, pricing engine, and presentation layers.
 */

import { AppDatabase, defaultDatabase } from '../database/Database';
import { UniversalPricingEngine, defaultPricingEngine } from '../pricing/UniversalPricingEngine';
import { CurrencyManager, defaultCurrencyManager } from '../currency/CurrencyManager';
import { QuoteCalculationResult } from '../pricing/types';
import { QuotationRecord, ProductRecord } from '../database/types';

export interface GenerateQuoteParams {
  guildId?: string;
  userId: string;
  userTag: string;
  productId: string;
  quantity?: number;
  spendingBudget?: number;
  currency?: string;
  discountCode?: string;
  selectedOptions?: string[];
  saveToDatabase?: boolean;
}

export interface CompareItemResult {
  product: ProductRecord;
  quantity: number;
  unitPrice: number;
  formattedUnitPrice: string;
  subtotal: number;
  formattedSubtotal: string;
  discount: number;
  fees: number;
  tax: number;
  finalTotal: number;
  formattedFinalTotal: string;
  costPerUnit: number;
  formattedCostPerUnit: string;
  isAvailable: boolean;
  notes?: string;
}

export class QuotationService {
  constructor(
    private db: AppDatabase = defaultDatabase,
    private engine: UniversalPricingEngine = defaultPricingEngine,
    private currencyMgr: CurrencyManager = defaultCurrencyManager
  ) {}

  public async generateQuote(params: GenerateQuoteParams): Promise<{
    calculation: QuoteCalculationResult;
    record?: QuotationRecord;
    product: ProductRecord;
    currency: string;
  }> {
    const guildId = params.guildId || 'default-guild';
    const product = this.db.getProductById(params.productId) || this.db.getProductByName(params.productId);

    if (!product) {
      throw new Error(`Product "${params.productId}" was not found in the active catalog.`);
    }

    if (!product.is_available) {
      throw new Error(`Product "${product.name}" is currently unavailable or out of stock.`);
    }

    const pricingRule = this.db.getPricingRuleByProductId(product.id);
    if (!pricingRule) {
      throw new Error(`Pricing configuration is missing for product "${product.name}".`);
    }

    const settings = this.db.getGuildSettings(guildId);
    const targetCurrency = params.currency?.toUpperCase() || product.currency || settings.default_currency || 'USD';

    // Discount validation
    let discount = undefined;
    if (params.discountCode) {
      const discRecord = this.db.getDiscountByCode(guildId, params.discountCode);
      if (!discRecord) {
        throw new Error(`Discount code "${params.discountCode}" is invalid, inactive, or expired.`);
      }
      discount = {
        id: discRecord.id,
        code: discRecord.code,
        name: discRecord.name,
        discountType: discRecord.discount_type,
        value: discRecord.value,
        minOrderSubtotal: discRecord.min_order_subtotal,
        maxDiscountAmount: discRecord.max_discount_amount,
        isActive: discRecord.is_active,
      };
    }

    const fees = this.db.getProductFees(product.id);
    const taxRules = this.db.getProductTaxes(product.id);

    // If quantity is not specified but budget is given, compute affordable quantity
    let qty = params.quantity || 1;
    if (!params.quantity && params.spendingBudget) {
      qty = this.engine.calculateMaximumAffordableQuantity(
        {
          productId: product.id,
          productName: product.name,
          pricingRule,
          quantity: 1,
          currency: targetCurrency,
          discount,
          fees,
          taxRules,
        },
        params.spendingBudget
      );
      if (qty === 0) qty = 1;
    }

    // Execute core pricing engine calculation
    const calculation = this.engine.calculate({
      productId: product.id,
      productName: product.name,
      pricingRule,
      quantity: qty,
      selectedOptions: params.selectedOptions,
      currency: targetCurrency,
      discount,
      fees,
      taxRules,
      spendingBudget: params.spendingBudget,
    });

    // Optionally persist quotation to database with immutable snapshot
    let record: QuotationRecord | undefined = undefined;
    if (params.saveToDatabase !== false) {
      record = this.db.createQuotation(
        {
          guild_id: guildId,
          user_id: params.userId,
          user_tag: params.userTag,
          total_items: 1,
          currency: targetCurrency,
          exchange_rate: calculation.exchangeRate,
          raw_subtotal: calculation.rawSubtotal,
          discount_amount: calculation.discountAmount,
          discount_code: calculation.discountCode,
          total_fees: calculation.totalFees,
          total_tax: calculation.totalTax,
          final_total: calculation.finalTotal,
          status: 'active',
        },
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: qty,
            unitPrice: calculation.unitPrice,
            subtotal: calculation.rawSubtotal,
            options: params.selectedOptions,
          },
        ],
        calculation
      );
    }

    return {
      calculation,
      record,
      product,
      currency: targetCurrency,
    };
  }

  public compareProducts(
    productIds: string[],
    quantities: number[] = [],
    currency: string = 'USD'
  ): {
    items: CompareItemResult[];
    bestValueByUnit: string;
    lowestOverallTotal: string;
  } {
    const results: CompareItemResult[] = [];

    for (let i = 0; i < productIds.length; i++) {
      const pId = productIds[i];
      const qty = quantities[i] || 1;
      const product = this.db.getProductById(pId) || this.db.getProductByName(pId);
      if (!product) continue;

      const rule = this.db.getPricingRuleByProductId(product.id);
      if (!rule) continue;

      const fees = this.db.getProductFees(product.id);
      const taxRules = this.db.getProductTaxes(product.id);

      const calc = this.engine.calculate({
        productId: product.id,
        productName: product.name,
        pricingRule: rule,
        quantity: qty,
        currency,
        fees,
        taxRules,
      });

      results.push({
        product,
        quantity: qty,
        unitPrice: calc.unitPrice,
        formattedUnitPrice: calc.formattedUnitPrice,
        subtotal: calc.rawSubtotal,
        formattedSubtotal: calc.formattedSubtotal,
        discount: calc.discountAmount,
        fees: calc.totalFees,
        tax: calc.totalTax,
        finalTotal: calc.finalTotal,
        formattedFinalTotal: calc.formattedFinalTotal,
        costPerUnit: calc.costPerUnit,
        formattedCostPerUnit: calc.formattedCostPerUnit,
        isAvailable: product.is_available,
        notes: product.delivery_info,
      });
    }

    if (results.length === 0) {
      throw new Error('No valid products selected for comparison.');
    }

    // Determine criteria explicitly (no vague "this is best" claims)
    const sortedByUnit = [...results].sort((a, b) => a.costPerUnit - b.costPerUnit);
    const sortedByTotal = [...results].sort((a, b) => a.finalTotal - b.finalTotal);

    return {
      items: results,
      bestValueByUnit: `${sortedByUnit[0].product.name} (${sortedByUnit[0].formattedCostPerUnit} per unit)`,
      lowestOverallTotal: `${sortedByTotal[0].product.name} (${sortedByTotal[0].formattedFinalTotal} total)`,
    };
  }

  public getQuotationByNumber(quoteNum: string) {
    const record = this.db.getQuotationByNumber(quoteNum);
    if (!record) return null;
    const snapshot = this.db.getQuotationSnapshot(record.id);
    const items = this.db.getQuotationItems(record.id);
    return {
      record,
      snapshot: snapshot ? JSON.parse(snapshot.snapshot_json) : null,
      items,
    };
  }
}

export const defaultQuotationService = new QuotationService();
