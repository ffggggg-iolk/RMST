import test from 'node:test';
import assert from 'node:assert/strict';
import { UniversalPricingEngine } from '../pricing/UniversalPricingEngine';
import { CurrencyManager } from '../currency/CurrencyManager';
import { PricingRule, DiscountRule, FeeRule, TaxRule } from '../pricing/types';

test('Model 1: Fixed-Price Calculation', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-fixed',
    productId: 'prod-1',
    pricingModel: 'fixed',
    basePrice: 25.0,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
  };

  const res = engine.calculate({
    productId: 'prod-1',
    productName: 'Custom Digital Service',
    pricingRule: rule,
    quantity: 3,
    currency: 'USD',
  });

  assert.equal(res.unitPrice, 25.0);
  assert.equal(res.rawSubtotal, 75.0);
  assert.equal(res.finalTotal, 75.0);
  assert.equal(res.costPerUnit, 25.0);
});

test('Model 2: Tiered-Price Calculation', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-tiered',
    productId: 'prod-tier',
    pricingModel: 'tiered',
    basePrice: 20.0,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
    tiers: [
      { minQuantity: 1, maxQuantity: 9, unitPrice: 20.0, tierLabel: 'Standard' },
      { minQuantity: 10, maxQuantity: 49, unitPrice: 16.0, tierLabel: 'Bulk Tier 1' },
      { minQuantity: 50, unitPrice: 12.0, tierLabel: 'Wholesale Tier 2' },
    ],
  };

  // Test Tier 1 (quantity 5)
  const res1 = engine.calculate({
    productId: 'prod-tier',
    productName: 'Server Hosting Credits',
    pricingRule: rule,
    quantity: 5,
    currency: 'USD',
  });
  assert.equal(res1.unitPrice, 20.0);
  assert.equal(res1.rawSubtotal, 100.0);

  // Test Tier 2 (quantity 15)
  const res2 = engine.calculate({
    productId: 'prod-tier',
    productName: 'Server Hosting Credits',
    pricingRule: rule,
    quantity: 15,
    currency: 'USD',
  });
  assert.equal(res2.unitPrice, 16.0);
  assert.equal(res2.rawSubtotal, 240.0);

  // Test Tier 3 (quantity 60)
  const res3 = engine.calculate({
    productId: 'prod-tier',
    productName: 'Server Hosting Credits',
    pricingRule: rule,
    quantity: 60,
    currency: 'USD',
  });
  assert.equal(res3.unitPrice, 12.0);
  assert.equal(res3.rawSubtotal, 720.0);
});

test('Model 3: Variable-Price Options and Multipliers', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-var',
    productId: 'prod-var',
    pricingModel: 'variable',
    basePrice: 50.0,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
    variableConfig: {
      basePrice: 50.0,
      options: [
        { id: 'opt-commercial', name: 'Commercial Rights', priceModifier: 25.0, modifierType: 'flat' },
        { id: 'opt-source', name: 'Source Files', priceModifier: 1.2, modifierType: 'multiplier' },
      ],
    },
  };

  const res = engine.calculate({
    productId: 'prod-var',
    productName: '3D Character Model',
    pricingRule: rule,
    quantity: 2,
    selectedOptions: ['opt-commercial', 'opt-source'],
    currency: 'USD',
  });

  // (50 + 25) * 1.2 = 90 unit price * 2 = 180
  assert.equal(res.unitPrice, 90.0);
  assert.equal(res.rawSubtotal, 180.0);
  assert.equal(res.finalTotal, 180.0);
});

test('Model 4 & 5: Percentage and Fixed Discounts with Caps', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-fixed',
    productId: 'prod-disc',
    pricingModel: 'fixed',
    basePrice: 100.0,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
  };

  const pctDiscount: DiscountRule = {
    id: 'disc-pct',
    code: 'SAVE20',
    name: '20% Off Spring Sale',
    discountType: 'percentage',
    value: 20,
    isActive: true,
  };

  const resPct = engine.calculate({
    productId: 'prod-disc',
    productName: 'Software Dev Sprint',
    pricingRule: rule,
    quantity: 2,
    currency: 'USD',
    discount: pctDiscount,
  });

  assert.equal(resPct.rawSubtotal, 200.0);
  assert.equal(resPct.discountAmount, 40.0);
  assert.equal(resPct.netSubtotal, 160.0);

  // Fixed discount larger than subtotal should cap at subtotal (prevent negative total)
  const bigFixedDiscount: DiscountRule = {
    id: 'disc-big',
    code: 'GIANT1000',
    name: '$1000 Off VIP',
    discountType: 'fixed',
    value: 1000,
    isActive: true,
  };

  const resCap = engine.calculate({
    productId: 'prod-disc',
    productName: 'Software Dev Sprint',
    pricingRule: rule,
    quantity: 1,
    currency: 'USD',
    discount: bigFixedDiscount,
  });

  assert.equal(resCap.rawSubtotal, 100.0);
  assert.equal(resCap.discountAmount, 100.0);
  assert.equal(resCap.netSubtotal, 0.0);
  assert.equal(resCap.finalTotal, 0.0);
});

test('Model 6 & 7: Additional Fees and Tax Calculation Ordering', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-fixed',
    productId: 'prod-tax-fee',
    pricingModel: 'fixed',
    basePrice: 100.0,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
  };

  const discount: DiscountRule = {
    id: 'disc-10',
    code: 'MINUS10',
    name: '$10 Off',
    discountType: 'fixed',
    value: 10,
    isActive: true,
  };

  const fees: FeeRule[] = [
    { id: 'fee-process', name: 'Processing Fee', feeType: 'fixed', amount: 5.0 },
    { id: 'fee-service', name: 'Service Fee', feeType: 'percentage', amount: 5.0, appliesToSubtotal: false }, // 5% of net
  ];

  const taxRules: TaxRule[] = [
    {
      id: 'tax-state',
      name: 'Sales Tax',
      ratePercentage: 10.0,
      applicationOrder: 'after_discount',
      isTaxableFeeIncluded: true,
    },
  ];

  const res = engine.calculate({
    productId: 'prod-tax-fee',
    productName: 'Physical Merchandise Kit',
    pricingRule: rule,
    quantity: 1,
    currency: 'USD',
    discount,
    fees,
    taxRules,
  });

  // Raw Subtotal = $100
  // Discount = $10 -> Net Subtotal = $90
  // Fee 1 = $5.00
  // Fee 2 = 5% of $90 = $4.50 -> Total Fees = $9.50
  // Taxable base = $90 + $9.50 = $99.50 -> Tax (10%) = $9.95
  // Final Total = $90 + $9.50 + $9.95 = $109.45
  assert.equal(res.rawSubtotal, 100.0);
  assert.equal(res.netSubtotal, 90.0);
  assert.equal(res.totalFees, 9.5);
  assert.equal(res.totalTax, 9.95);
  assert.equal(res.finalTotal, 109.45);
});

test('Model 8: Subscriptions with Setup Fee', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-sub',
    productId: 'prod-sub',
    pricingModel: 'subscription',
    basePrice: 49.99,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
    subscriptionConfig: {
      recurringPrice: 49.99,
      billingInterval: 'monthly',
      setupFee: 25.0,
    },
  };

  const res = engine.calculate({
    productId: 'prod-sub',
    productName: 'Premium Server Management',
    pricingRule: rule,
    quantity: 1,
    currency: 'USD',
  });

  assert.equal(res.unitPrice, 49.99);
  assert.equal(res.rawSubtotal, 74.99);
  assert.equal(res.subscriptionDetails?.setupFee, 25.0);
  assert.equal(res.subscriptionDetails?.recurringPrice, 49.99);
  assert.equal(res.subscriptionDetails?.firstPaymentTotal, 74.99);
});

test('Model 9: Bundles and Component Savings', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-bundle',
    productId: 'prod-bundle',
    pricingModel: 'bundle',
    basePrice: 99.0,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
    bundleConfig: {
      bundlePrice: 99.0,
      items: [
        { productId: 'item-1', name: 'Bot Setup', quantity: 1, standardUnitPrice: 60.0 },
        { productId: 'item-2', name: 'Custom Banner', quantity: 1, standardUnitPrice: 40.0 },
        { productId: 'item-3', name: 'Role Config', quantity: 1, standardUnitPrice: 30.0 },
      ],
    },
  };

  const res = engine.calculate({
    productId: 'prod-bundle',
    productName: 'Discord Server Launch Pack',
    pricingRule: rule,
    quantity: 1,
    currency: 'USD',
  });

  // Standard total = 60 + 40 + 30 = 130
  // Bundle price = 99
  // Savings = 31 (23.8%)
  assert.equal(res.rawSubtotal, 99.0);
  assert.equal(res.bundleSavings?.standardTotal, 130.0);
  assert.equal(res.bundleSavings?.bundleSavingsAmount, 31.0);
  assert.equal(res.bundleSavings?.savingsPercentage, 23.8);
});

test('Model 10: Budget-Based Affordability Analysis and Solver', () => {
  const engine = new UniversalPricingEngine();
  const rule: PricingRule = {
    id: 'rule-fixed',
    productId: 'prod-budget',
    pricingModel: 'fixed',
    basePrice: 24.99,
    minQuantity: 1,
    allowedCurrencies: ['USD'],
  };

  const res = engine.calculate({
    productId: 'prod-budget',
    productName: 'Digital Game Asset Pack',
    pricingRule: rule,
    quantity: 4,
    currency: 'USD',
    spendingBudget: 100.0,
  });

  // 24.99 * 4 = 99.96
  // Available: 100.00
  // Affordable: true, Remaining: 0.04, Max Affordable: 4
  assert.equal(res.rawSubtotal, 99.96);
  assert.equal(res.finalTotal, 99.96);
  assert.equal(res.budgetAnalysis?.isAffordable, true);
  assert.equal(res.budgetAnalysis?.remainingBudget, 0.04);
  assert.equal(res.budgetAnalysis?.maximumAffordableQuantity, 4);

  // Test solver directly for large budget
  const maxQty = engine.calculateMaximumAffordableQuantity(
    {
      productId: 'prod-budget',
      productName: 'Digital Game Asset Pack',
      pricingRule: rule,
      quantity: 1,
      currency: 'USD',
    },
    250.0
  );
  // 250 / 24.99 = 10.004 -> exactly 10 units
  assert.equal(maxQty, 10);
});

test('Currency Conversion with Configured Rates', () => {
  const currencyMgr = new CurrencyManager();
  currencyMgr.setRate('USD', 'EUR', 0.90, 'Test FX Provider');
  const engine = new UniversalPricingEngine(currencyMgr);

  const rule: PricingRule = {
    id: 'rule-fixed',
    productId: 'prod-fx',
    pricingModel: 'fixed',
    basePrice: 100.0,
    minQuantity: 1,
    allowedCurrencies: ['USD', 'EUR'],
  };

  const res = engine.calculate({
    productId: 'prod-fx',
    productName: 'Consulting Hour',
    pricingRule: rule,
    quantity: 2,
    currency: 'EUR',
  });

  // 100 USD * 0.90 = 90 EUR unit price
  // Subtotal = 180 EUR
  assert.equal(res.unitPrice, 90.0);
  assert.equal(res.finalTotal, 180.0);
  assert.equal(res.currency, 'EUR');
  assert.equal(res.exchangeRate, 0.9);
});
