/**
 * Universal Pricing Engine - Types and Definitions
 * General-purpose quotation and pricing system for Discord
 */

export type PricingModel =
  | 'fixed'
  | 'tiered'
  | 'variable'
  | 'subscription'
  | 'bundle'
  | 'custom';

export type DiscountType = 'percentage' | 'fixed';

export type FeeType = 'percentage' | 'fixed';

export type TaxApplicationOrder = 'before_discount' | 'after_discount';

export type BillingInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface TierConfig {
  minQuantity: number;
  maxQuantity?: number; // undefined means infinity
  unitPrice: number;
  tierLabel?: string;
}

export interface VariableOption {
  id: string;
  name: string;
  priceModifier: number; // additional cost or multiplier
  modifierType: 'flat' | 'multiplier';
  description?: string;
}

export interface VariablePricingConfig {
  basePrice: number;
  options: VariableOption[];
}

export interface SubscriptionConfig {
  recurringPrice: number;
  billingInterval: BillingInterval;
  setupFee?: number;
  introductoryPrice?: number;
  introductoryPeriodCycles?: number;
}

export interface BundleItemConfig {
  productId: string;
  name: string;
  quantity: number;
  standardUnitPrice: number;
}

export interface BundleConfig {
  bundlePrice: number;
  items: BundleItemConfig[];
  savingsDescription?: string;
}

export interface CustomPricingConfig {
  strategyName: string;
  baseRate: number;
  parameters: Record<string, number | string>;
}

export interface PricingRule {
  id: string;
  productId: string;
  pricingModel: PricingModel;
  basePrice: number;
  tiers?: TierConfig[];
  variableConfig?: VariablePricingConfig;
  subscriptionConfig?: SubscriptionConfig;
  bundleConfig?: BundleConfig;
  customConfig?: CustomPricingConfig;
  minQuantity: number;
  maxQuantity?: number;
  allowedCurrencies: string[];
}

export interface FeeRule {
  id: string;
  name: string;
  feeType: FeeType;
  amount: number; // e.g. 2.50 for fixed, 3.5 for 3.5%
  isOptional?: boolean;
  appliesToSubtotal?: boolean;
}

export interface TaxRule {
  id: string;
  name: string;
  ratePercentage: number; // e.g. 8.25 for 8.25%
  applicationOrder: TaxApplicationOrder;
  isTaxableFeeIncluded: boolean;
  jurisdiction?: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  value: number; // e.g. 10 for 10% or $10.00
  minOrderSubtotal?: number;
  maxDiscountAmount?: number; // cap for percentage discounts
  applicableProductIds?: string[];
  expiresAt?: string;
  isActive: boolean;
}

export interface QuoteCalculationRequest {
  productId: string;
  productName: string;
  pricingRule: PricingRule;
  quantity: number;
  selectedOptions?: string[]; // IDs of variable options
  currency: string;
  exchangeRate?: number; // Exchange rate relative to base currency (1.0 = base)
  discount?: DiscountRule;
  fees?: FeeRule[];
  taxRules?: TaxRule[];
  spendingBudget?: number;
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
  formatted: string;
  detail?: string;
}

export interface QuoteCalculationResult {
  productId: string;
  productName: string;
  pricingModel: PricingModel;
  currency: string;
  exchangeRate: number;
  quantity: number;
  unitPrice: number;
  formattedUnitPrice: string;
  rawSubtotal: number;
  formattedSubtotal: string;
  discountAmount: number;
  formattedDiscount: string;
  discountCode?: string;
  netSubtotal: number;
  formattedNetSubtotal: string;
  totalFees: number;
  formattedTotalFees: string;
  feeItems: PriceBreakdownItem[];
  totalTax: number;
  formattedTotalTax: string;
  taxItems: PriceBreakdownItem[];
  finalTotal: number;
  formattedFinalTotal: string;
  costPerUnit: number;
  formattedCostPerUnit: string;
  subscriptionDetails?: {
    recurringPrice: number;
    billingInterval: BillingInterval;
    setupFee: number;
    firstPaymentTotal: number;
    subsequentPaymentTotal: number;
  };
  bundleSavings?: {
    standardTotal: number;
    bundleSavingsAmount: number;
    savingsPercentage: number;
  };
  budgetAnalysis?: {
    availableBudget: number;
    isAffordable: boolean;
    remainingBudget: number;
    maximumAffordableQuantity: number;
  };
  calculationSteps: string[];
}
