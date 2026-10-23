/**
 * UniversalPricingEngine
 * Production-ready commercial pricing, quotation, and affordability engine.
 * Deterministic order, decimal precision, zero-eval custom strategy support.
 */

import {
  QuoteCalculationRequest,
  QuoteCalculationResult,
  PriceBreakdownItem,
  TierConfig,
  PricingRule,
} from './types';
import { CurrencyManager, defaultCurrencyManager } from '../currency/CurrencyManager';

export class UniversalPricingEngine {
  private currencyManager: CurrencyManager;
  private customStrategies: Map<
    string,
    (rule: PricingRule, qty: number, params: Record<string, any>) => { unitPrice: number; subtotal: number; steps: string[] }
  > = new Map();

  constructor(currencyManager: CurrencyManager = defaultCurrencyManager) {
    this.currencyManager = currencyManager;
    this.registerDefaultCustomStrategies();
  }

  private registerDefaultCustomStrategies() {
    // Strategy: Hourly Service with Rush Fee Multiplier
    this.registerCustomStrategy('hourly_service_with_rush', (rule, qty, params) => {
      const hourlyRate = Number(params.hourlyRate ?? rule.basePrice);
      const isRush = Boolean(params.isRush);
      const rushMultiplier = isRush ? Number(params.rushMultiplier ?? 1.5) : 1.0;
      const unitPrice = this.round(hourlyRate * rushMultiplier);
      const subtotal = this.round(unitPrice * qty);
      const steps = [
        `Base Hourly Rate: ${hourlyRate}`,
        `Rush Multiplier: ${rushMultiplier}x (${isRush ? 'RUSH PRIORITY' : 'Standard Delivery'})`,
        `Effective Rate per Hour: ${unitPrice}`,
        `Subtotal for ${qty} Hours: ${subtotal}`,
      ];
      return { unitPrice, subtotal, steps };
    });

    // Strategy: Tiered License with User Seats
    this.registerCustomStrategy('user_seat_licensing', (rule, qty, params) => {
      const basePlatformFee = Number(params.platformFee ?? rule.basePrice);
      const perSeatCost = Number(params.perSeatCost ?? 12.0);
      const subtotal = this.round(basePlatformFee + perSeatCost * qty);
      const unitPrice = qty > 0 ? this.round(subtotal / qty) : basePlatformFee;
      const steps = [
        `Platform Base License Fee: ${basePlatformFee}`,
        `Per-Seat Rate: ${perSeatCost} × ${qty} seats = ${this.round(perSeatCost * qty)}`,
        `Subtotal: ${subtotal}`,
      ];
      return { unitPrice, subtotal, steps };
    });
  }

  public registerCustomStrategy(
    name: string,
    fn: (rule: PricingRule, qty: number, params: Record<string, any>) => { unitPrice: number; subtotal: number; steps: string[] }
  ) {
    this.customStrategies.set(name, fn);
  }

  public calculate(request: QuoteCalculationRequest): QuoteCalculationResult {
    const {
      productId,
      productName,
      pricingRule,
      quantity,
      selectedOptions = [],
      currency = 'USD',
      discount,
      fees = [],
      taxRules = [],
      spendingBudget,
    } = request;

    const calculationSteps: string[] = [];

    // 1. Input Validation
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error(`Invalid quantity: ${quantity}. Quantity must be a positive integer.`);
    }

    if (pricingRule.minQuantity && quantity < pricingRule.minQuantity) {
      throw new Error(
        `Quantity ${quantity} is below the required minimum of ${pricingRule.minQuantity} units for ${productName}.`
      );
    }

    if (pricingRule.maxQuantity && quantity > pricingRule.maxQuantity) {
      throw new Error(
        `Quantity ${quantity} exceeds the maximum allowable limit of ${pricingRule.maxQuantity} units for ${productName}.`
      );
    }

    if (!this.currencyManager.isSupported(currency)) {
      throw new Error(`Currency ${currency} is not supported by the system.`);
    }

    // 2. Base Currency & Conversion Rate Resolution
    const productBaseCurrency = pricingRule.allowedCurrencies[0] || 'USD';
    let exchangeRate = 1.0;
    if (currency.toUpperCase() !== productBaseCurrency.toUpperCase()) {
      const conversionInfo = this.currencyManager.getExchangeRate(productBaseCurrency, currency);
      if (!conversionInfo) {
        throw new Error(
          `Cannot convert price from ${productBaseCurrency} to requested currency ${currency}. Exchange rate not configured.`
        );
      }
      exchangeRate = conversionInfo.rate;
      calculationSteps.push(
        `Currency conversion applied: 1 ${productBaseCurrency} = ${exchangeRate} ${currency} (Source: ${conversionInfo.source})`
      );
    }

    // 3. Compute Subtotal & Unit Price based on Model
    let baseUnitPrice = pricingRule.basePrice;
    let rawSubtotal = 0;
    let subscriptionDetails: QuoteCalculationResult['subscriptionDetails'];
    let bundleSavings: QuoteCalculationResult['bundleSavings'];

    switch (pricingRule.pricingModel) {
      // Model 1: Fixed Price
      case 'fixed': {
        baseUnitPrice = pricingRule.basePrice;
        rawSubtotal = this.round(baseUnitPrice * quantity);
        calculationSteps.push(
          `[Model: Fixed] Unit Price: ${baseUnitPrice} × Quantity: ${quantity} = Subtotal: ${rawSubtotal}`
        );
        break;
      }

      // Model 2: Tiered Pricing
      case 'tiered': {
        const tier = this.resolveTier(pricingRule.tiers || [], quantity);
        if (tier) {
          baseUnitPrice = tier.unitPrice;
          rawSubtotal = this.round(baseUnitPrice * quantity);
          calculationSteps.push(
            `[Model: Tiered] Matched Tier (${tier.minQuantity}${tier.maxQuantity ? '-' + tier.maxQuantity : '+'}) @ ${baseUnitPrice} × ${quantity} = Subtotal: ${rawSubtotal}`
          );
        } else {
          baseUnitPrice = pricingRule.basePrice;
          rawSubtotal = this.round(baseUnitPrice * quantity);
          calculationSteps.push(
            `[Model: Tiered] Default fallback @ ${baseUnitPrice} × ${quantity} = Subtotal: ${rawSubtotal}`
          );
        }
        break;
      }

      // Model 3: Variable Pricing
      case 'variable': {
        let currentPrice = pricingRule.basePrice;
        calculationSteps.push(`[Model: Variable] Base Starting Price: ${currentPrice}`);

        if (pricingRule.variableConfig?.options) {
          for (const optId of selectedOptions) {
            const opt = pricingRule.variableConfig.options.find((o) => o.id === optId);
            if (opt) {
              if (opt.modifierType === 'flat') {
                currentPrice += opt.priceModifier;
                calculationSteps.push(`Option added: "${opt.name}" (+${opt.priceModifier} flat)`);
              } else if (opt.modifierType === 'multiplier') {
                currentPrice = this.round(currentPrice * opt.priceModifier);
                calculationSteps.push(`Option multiplier applied: "${opt.name}" (×${opt.priceModifier})`);
              }
            }
          }
        }
        baseUnitPrice = currentPrice;
        rawSubtotal = this.round(baseUnitPrice * quantity);
        calculationSteps.push(`Variable Unit Price: ${baseUnitPrice} × Quantity: ${quantity} = Subtotal: ${rawSubtotal}`);
        break;
      }

      // Model 8: Subscription
      case 'subscription': {
        const sub = pricingRule.subscriptionConfig || {
          recurringPrice: pricingRule.basePrice,
          billingInterval: 'monthly',
          setupFee: 0,
        };
        const setupFee = sub.setupFee || 0;
        baseUnitPrice = sub.recurringPrice;
        const recurringSubtotal = this.round(baseUnitPrice * quantity);
        rawSubtotal = this.round(recurringSubtotal + setupFee);

        subscriptionDetails = {
          recurringPrice: sub.recurringPrice,
          billingInterval: sub.billingInterval,
          setupFee: setupFee,
          firstPaymentTotal: rawSubtotal,
          subsequentPaymentTotal: recurringSubtotal,
        };

        calculationSteps.push(
          `[Model: Subscription] Recurring: ${sub.recurringPrice}/${sub.billingInterval} × ${quantity} + Setup Fee: ${setupFee} = Initial Subtotal: ${rawSubtotal}`
        );
        break;
      }

      // Model 9: Bundle
      case 'bundle': {
        const bundle = pricingRule.bundleConfig;
        if (bundle) {
          baseUnitPrice = bundle.bundlePrice;
          rawSubtotal = this.round(baseUnitPrice * quantity);
          const standardSingleSum = bundle.items.reduce(
            (acc, it) => acc + it.standardUnitPrice * it.quantity,
            0
          );
          const standardTotal = this.round(standardSingleSum * quantity);
          const bundleSavingsAmount = Math.max(0, this.round(standardTotal - rawSubtotal));
          const savingsPercentage = standardTotal > 0 ? this.round((bundleSavingsAmount / standardTotal) * 100, 1) : 0;

          bundleSavings = {
            standardTotal,
            bundleSavingsAmount,
            savingsPercentage,
          };
          calculationSteps.push(
            `[Model: Bundle] Bundle Price: ${baseUnitPrice} × ${quantity} = Subtotal: ${rawSubtotal} (Standard Individual Value: ${standardTotal}, Savings: ${bundleSavingsAmount} [${savingsPercentage}%])`
          );
        } else {
          baseUnitPrice = pricingRule.basePrice;
          rawSubtotal = this.round(baseUnitPrice * quantity);
        }
        break;
      }

      // Model 11: Custom Pricing Strategy
      case 'custom': {
        const custom = pricingRule.customConfig;
        if (!custom || !this.customStrategies.has(custom.strategyName)) {
          throw new Error(
            `Custom pricing strategy "${custom?.strategyName}" is not registered or supported by UniversalPricingEngine.`
          );
        }
        const strategyFn = this.customStrategies.get(custom.strategyName)!;
        const res = strategyFn(pricingRule, quantity, custom.parameters || {});
        baseUnitPrice = res.unitPrice;
        rawSubtotal = res.subtotal;
        calculationSteps.push(`[Model: Custom - ${custom.strategyName}]`);
        calculationSteps.push(...res.steps);
        break;
      }

      default: {
        baseUnitPrice = pricingRule.basePrice;
        rawSubtotal = this.round(baseUnitPrice * quantity);
        calculationSteps.push(`Default pricing: ${baseUnitPrice} × ${quantity} = ${rawSubtotal}`);
      }
    }

    // Apply currency exchange rate if non-base currency
    if (exchangeRate !== 1.0) {
      baseUnitPrice = this.round(baseUnitPrice * exchangeRate);
      rawSubtotal = this.round(rawSubtotal * exchangeRate);
      calculationSteps.push(
        `Converted to ${currency}: Unit Price: ${baseUnitPrice}, Subtotal: ${rawSubtotal}`
      );
    }

    // 4. Model 4 & 5: Discounts (Percentage or Fixed)
    let discountAmount = 0;
    let discountCode = undefined;

    if (discount && discount.isActive) {
      discountCode = discount.code;
      if (discount.minOrderSubtotal && rawSubtotal < discount.minOrderSubtotal * exchangeRate) {
        calculationSteps.push(
          `Discount code "${discount.code}" rejected: subtotal ${rawSubtotal} is below minimum requirement of ${discount.minOrderSubtotal * exchangeRate} ${currency}`
        );
      } else {
        if (discount.discountType === 'percentage') {
          const rawDiscount = (rawSubtotal * discount.value) / 100;
          let calculated = this.round(rawDiscount);
          if (discount.maxDiscountAmount) {
            const convertedMax = discount.maxDiscountAmount * exchangeRate;
            if (calculated > convertedMax) {
              calculated = this.round(convertedMax);
              calculationSteps.push(
                `Discount capped at maximum limit of ${convertedMax} ${currency}`
              );
            }
          }
          discountAmount = Math.min(rawSubtotal, calculated);
          calculationSteps.push(
            `[Discount: Percentage] Code: "${discount.code}" (${discount.value}%) deducted: ${discountAmount}`
          );
        } else if (discount.discountType === 'fixed') {
          const convertedFixed = discount.value * exchangeRate;
          discountAmount = Math.min(rawSubtotal, this.round(convertedFixed));
          calculationSteps.push(
            `[Discount: Fixed] Code: "${discount.code}" deducted: ${discountAmount}`
          );
        }
      }
    }

    const netSubtotal = this.round(Math.max(0, rawSubtotal - discountAmount));
    calculationSteps.push(`Net Subtotal: ${rawSubtotal} - ${discountAmount} = ${netSubtotal}`);

    // 5. Model 6: Additional Fees (Service, shipping, processing)
    const feeItems: PriceBreakdownItem[] = [];
    let totalFees = 0;

    for (const fee of fees) {
      let feeVal = 0;
      if (fee.feeType === 'percentage') {
        const baseForFee = fee.appliesToSubtotal ? rawSubtotal : netSubtotal;
        feeVal = this.round((baseForFee * fee.amount) / 100);
      } else {
        feeVal = this.round(fee.amount * exchangeRate);
      }

      totalFees += feeVal;
      feeItems.push({
        label: fee.name,
        amount: feeVal,
        formatted: this.currencyManager.format(feeVal, currency),
        detail: fee.feeType === 'percentage' ? `${fee.amount}%` : 'Fixed charge',
      });
      calculationSteps.push(`Fee applied: "${fee.name}": +${feeVal}`);
    }
    totalFees = this.round(totalFees);

    // 6. Model 7: Taxes (applied according to order rules)
    const taxItems: PriceBreakdownItem[] = [];
    let totalTax = 0;

    for (const tax of taxRules) {
      // Determine taxable base
      let taxableBase = tax.applicationOrder === 'before_discount' ? rawSubtotal : netSubtotal;
      if (tax.isTaxableFeeIncluded) {
        taxableBase += totalFees;
      }

      const taxAmount = this.round((taxableBase * tax.ratePercentage) / 100);
      totalTax += taxAmount;
      taxItems.push({
        label: tax.name,
        amount: taxAmount,
        formatted: this.currencyManager.format(taxAmount, currency),
        detail: `${tax.ratePercentage}% (${tax.applicationOrder === 'before_discount' ? 'pre-discount' : 'post-discount'})`,
      });
      calculationSteps.push(
        `Tax applied: "${tax.name}" (${tax.ratePercentage}% on base ${taxableBase}): +${taxAmount}`
      );
    }
    totalTax = this.round(totalTax);

    // 7. Final Total Calculation
    const finalTotal = this.round(Math.max(0, netSubtotal + totalFees + totalTax));
    const costPerUnit = quantity > 0 ? this.round(finalTotal / quantity) : finalTotal;

    calculationSteps.push(
      `Final Total: Net Subtotal (${netSubtotal}) + Fees (${totalFees}) + Tax (${totalTax}) = ${finalTotal} ${currency}`
    );

    // 8. Model 10: Budget-Based Affordability Analysis
    let budgetAnalysis: QuoteCalculationResult['budgetAnalysis'] = undefined;
    if (spendingBudget !== undefined) {
      const isAffordable = finalTotal <= spendingBudget;
      const remainingBudget = this.round(spendingBudget - finalTotal);
      const maxQty = this.calculateMaximumAffordableQuantity(
        request,
        spendingBudget
      );

      budgetAnalysis = {
        availableBudget: spendingBudget,
        isAffordable,
        remainingBudget,
        maximumAffordableQuantity: maxQty,
      };
      calculationSteps.push(
        `Budget check: Available ${spendingBudget} ${currency} | Affordable: ${isAffordable} | Remaining: ${remainingBudget} | Max units affordable: ${maxQty}`
      );
    }

    return {
      productId,
      productName,
      pricingModel: pricingRule.pricingModel,
      currency,
      exchangeRate,
      quantity,
      unitPrice: baseUnitPrice,
      formattedUnitPrice: this.currencyManager.format(baseUnitPrice, currency),
      rawSubtotal,
      formattedSubtotal: this.currencyManager.format(rawSubtotal, currency),
      discountAmount,
      formattedDiscount: this.currencyManager.format(discountAmount, currency),
      discountCode,
      netSubtotal,
      formattedNetSubtotal: this.currencyManager.format(netSubtotal, currency),
      totalFees,
      formattedTotalFees: this.currencyManager.format(totalFees, currency),
      feeItems,
      totalTax,
      formattedTotalTax: this.currencyManager.format(totalTax, currency),
      taxItems,
      finalTotal,
      formattedFinalTotal: this.currencyManager.format(finalTotal, currency),
      costPerUnit,
      formattedCostPerUnit: this.currencyManager.format(costPerUnit, currency),
      subscriptionDetails,
      bundleSavings,
      budgetAnalysis,
      calculationSteps,
    };
  }

  /**
   * Helper: Match tiered pricing config for a given quantity
   */
  private resolveTier(tiers: TierConfig[], quantity: number): TierConfig | null {
    if (!tiers || tiers.length === 0) return null;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    for (const t of sorted) {
      if (quantity >= t.minQuantity) {
        if (t.maxQuantity === undefined || quantity <= t.maxQuantity) {
          return t;
        }
      }
    }
    return null;
  }

  /**
   * Model 10: Maximum affordable quantity solver
   * Performs monotonic binary / stepwise search to find the highest valid quantity <= spendingBudget
   */
  public calculateMaximumAffordableQuantity(
    baseRequest: QuoteCalculationRequest,
    spendingBudget: number
  ): number {
    if (spendingBudget <= 0) return 0;

    let low = 0;
    let high = 10000;
    if (baseRequest.pricingRule.maxQuantity) {
      high = baseRequest.pricingRule.maxQuantity;
    }

    let bestAffordableQty = 0;

    // Fast binary search
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mid === 0) {
        low = mid + 1;
        continue;
      }

      try {
        const testReq: QuoteCalculationRequest = {
          ...baseRequest,
          quantity: mid,
          spendingBudget: undefined, // Avoid recursive budget analysis
        };
        const res = this.calculate(testReq);
        if (res.finalTotal <= spendingBudget) {
          bestAffordableQty = mid;
          low = mid + 1; // Try larger quantity
        } else {
          high = mid - 1; // Exceeded budget
        }
      } catch {
        // If minQuantity or bounds error occurs, adjust search window
        if (baseRequest.pricingRule.minQuantity && mid < baseRequest.pricingRule.minQuantity) {
          low = baseRequest.pricingRule.minQuantity;
        } else {
          high = mid - 1;
        }
      }
    }

    return bestAffordableQty;
  }

  private round(val: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
  }
}

export const defaultPricingEngine = new UniversalPricingEngine();
