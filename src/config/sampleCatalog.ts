/**
 * Production-ready sample catalog demonstrating diverse categories:
 * - Software Development & Technical Services
 * - Creative Design & Commissions
 * - Subscriptions & Managed Hosting
 * - Pre-packaged Bundles
 * - Physical Merchandise
 * - Digital Goods & Gaming Assets
 */

import { ProductRecord } from '../database/types';
import { PricingRule, FeeRule, TaxRule, DiscountRule } from '../pricing/types';

export interface SampleProductItem {
  product: ProductRecord;
  pricingRule: PricingRule;
  fees: FeeRule[];
  taxRules: TaxRule[];
}

export const SAMPLE_PRODUCTS: SampleProductItem[] = [
  // 1. Software Development (Fixed / Hourly)
  {
    product: {
      id: 'prod-custom-bot',
      guild_id: 'default-guild',
      name: 'Custom Discord Bot Development',
      description: 'Full-stack custom Discord bot architecture, slash commands, database integration, and CI/CD setup.',
      category: 'Software Development',
      product_type: 'service',
      base_price: 150.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 10,
      is_available: true,
      delivery_info: '3-7 Business Days',
      terms: 'Includes 30 days of complimentary maintenance and bug fixes.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-custom-bot',
      productId: 'prod-custom-bot',
      pricingModel: 'fixed',
      basePrice: 150.0,
      minQuantity: 1,
      maxQuantity: 10,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BRL', 'MXN', 'PEN'],
    },
    fees: [
      { id: 'fee-setup', name: 'Cloud Infrastructure Provisioning', feeType: 'fixed', amount: 15.0 },
    ],
    taxRules: [],
  },

  // 2. Creative Commission (Variable Pricing with add-ons)
  {
    product: {
      id: 'prod-3d-model',
      guild_id: 'default-guild',
      name: '3D Character & Asset Commission',
      description: 'Custom low/high-poly 3D models with texturing, rigging, and animation files ready for Unity/Unreal.',
      category: 'Design & Commissions',
      product_type: 'custom',
      base_price: 75.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 5,
      is_available: true,
      delivery_info: '5-10 Days with WIP Previews',
      terms: '3 rounds of design revisions included.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-3d-model',
      productId: 'prod-3d-model',
      pricingModel: 'variable',
      basePrice: 75.0,
      minQuantity: 1,
      maxQuantity: 5,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      variableConfig: {
        basePrice: 75.0,
        options: [
          { id: 'rigging', name: 'Humanoid Skeletal Rigging', priceModifier: 35.0, modifierType: 'flat', description: 'Fully weight-painted armature' },
          { id: 'commercial', name: 'Full Commercial Resale Rights', priceModifier: 1.5, modifierType: 'multiplier', description: 'Exclusive licensing' },
          { id: 'textures_4k', name: '4K PBR Texture Maps', priceModifier: 20.0, modifierType: 'flat', description: 'Substance Painter maps' },
        ],
      },
    },
    fees: [],
    taxRules: [],
  },

  // 3. Digital Cloud Services (Tiered Pricing for bulk compute/credits)
  {
    product: {
      id: 'prod-cloud-compute',
      guild_id: 'default-guild',
      name: 'Cloud Computing Server Credits',
      description: 'Prepaid dedicated server hours with automated failover and daily automated snapshots.',
      category: 'Digital Goods',
      product_type: 'digital',
      base_price: 20.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 500,
      is_available: true,
      stock_count: 5000,
      delivery_info: 'Instant Automated Provisioning',
      terms: 'Non-expiring compute allocation.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-cloud-compute',
      productId: 'prod-cloud-compute',
      pricingModel: 'tiered',
      basePrice: 20.0,
      minQuantity: 1,
      maxQuantity: 500,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'BRL', 'CAD'],
      tiers: [
        { minQuantity: 1, maxQuantity: 9, unitPrice: 20.0, tierLabel: 'Standard (1-9 Credits)' },
        { minQuantity: 10, maxQuantity: 49, unitPrice: 16.0, tierLabel: 'Volume Discount (10-49 Credits)' },
        { minQuantity: 50, maxQuantity: 199, unitPrice: 13.0, tierLabel: 'Developer Bulk (50-199 Credits)' },
        { minQuantity: 200, unitPrice: 10.0, tierLabel: 'Enterprise Wholesale (200+ Credits)' },
      ],
    },
    fees: [
      { id: 'fee-gateway', name: 'Payment Processing Fee', feeType: 'percentage', amount: 2.9, appliesToSubtotal: true },
    ],
    taxRules: [
      { id: 'tax-vat', name: 'Standard Sales Tax / VAT', ratePercentage: 8.5, applicationOrder: 'after_discount', isTaxableFeeIncluded: true },
    ],
  },

  // 4. Managed Subscription (Monthly Recurring + Setup)
  {
    product: {
      id: 'prod-sub-managed',
      guild_id: 'default-guild',
      name: 'Managed Discord Community Ops',
      description: '24/7 moderation bot supervision, raid protection tuning, webhook feeds, and bi-weekly analytics reports.',
      category: 'Subscriptions',
      product_type: 'subscription',
      base_price: 49.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 3,
      is_available: true,
      delivery_info: 'Immediate Onboarding via Admin Channel',
      terms: 'Cancel anytime. Includes priority Discord staff channel access.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-sub-managed',
      productId: 'prod-sub-managed',
      pricingModel: 'subscription',
      basePrice: 49.0,
      minQuantity: 1,
      maxQuantity: 3,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      subscriptionConfig: {
        recurringPrice: 49.0,
        billingInterval: 'monthly',
        setupFee: 25.0,
        introductoryPrice: 35.0,
        introductoryPeriodCycles: 1,
      },
    },
    fees: [],
    taxRules: [],
  },

  // 5. Pre-configured Bundle (Discord Server Launch Pack)
  {
    product: {
      id: 'prod-bundle-launch',
      guild_id: 'default-guild',
      name: 'Server Launch All-in-One Bundle',
      description: 'Complete server setup pack: custom bot configuration, 5 branded graphic banners, and permissions hierarchy.',
      category: 'Bundles',
      product_type: 'bundle',
      base_price: 119.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 2,
      is_available: true,
      delivery_info: '48 Hour Express Delivery',
      terms: 'Bundle discount applied automatically compared to individual service prices.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-bundle-launch',
      productId: 'prod-bundle-launch',
      pricingModel: 'bundle',
      basePrice: 119.0,
      minQuantity: 1,
      maxQuantity: 2,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      bundleConfig: {
        bundlePrice: 119.0,
        savingsDescription: 'Save $46 compared to booking services individually',
        items: [
          { productId: 'prod-custom-bot', name: 'Bot Setup & Slash Commands', quantity: 1, standardUnitPrice: 85.0 },
          { productId: 'banner-pack', name: '5x Animated Discord Banners', quantity: 1, standardUnitPrice: 50.0 },
          { productId: 'roles-config', name: 'Security & Auto-Role Configuration', quantity: 1, standardUnitPrice: 30.0 },
        ],
      },
    },
    fees: [],
    taxRules: [],
  },

  // 6. Physical Merchandise (Apparel with Shipping & Handling)
  {
    product: {
      id: 'prod-hoodie',
      guild_id: 'default-guild',
      name: 'Embroidered Community Hoodie',
      description: 'Heavyweight organic cotton pullover hoodie with custom embroidered chest crest and sleeve monogram.',
      category: 'Physical Merchandise',
      product_type: 'physical',
      base_price: 54.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 20,
      is_available: true,
      stock_count: 85,
      delivery_info: 'Ships within 3-5 days with global tracking',
      terms: 'Size exchange available within 14 days of receipt.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-hoodie',
      productId: 'prod-hoodie',
      pricingModel: 'fixed',
      basePrice: 54.0,
      minQuantity: 1,
      maxQuantity: 20,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    },
    fees: [
      { id: 'fee-shipping', name: 'Tracked Courier Shipping', feeType: 'fixed', amount: 8.5 },
      { id: 'fee-handling', name: 'Packaging & Warehouse Handling', feeType: 'fixed', amount: 2.0 },
    ],
    taxRules: [
      { id: 'tax-sales', name: 'State / Regional Sales Tax', ratePercentage: 7.0, applicationOrder: 'after_discount', isTaxableFeeIncluded: false },
    ],
  },

  // 7. Gaming Asset / Item Category
  {
    product: {
      id: 'prod-game-skin',
      guild_id: 'default-guild',
      name: 'Legendary Armor Cosmetic Model',
      description: 'Custom animated game armor set with particle emission maps for multi-engine integration.',
      category: 'Gaming Assets',
      product_type: 'digital',
      base_price: 32.0,
      currency: 'USD',
      min_quantity: 1,
      max_quantity: 10,
      is_available: true,
      delivery_info: 'Instant download link upon confirmation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator',
    },
    pricingRule: {
      id: 'rule-game-skin',
      productId: 'prod-game-skin',
      pricingModel: 'fixed',
      basePrice: 32.0,
      minQuantity: 1,
      maxQuantity: 10,
      allowedCurrencies: ['USD', 'EUR', 'GBP', 'BRL', 'CAD', 'MXN', 'PEN'],
    },
    fees: [],
    taxRules: [],
  },
];

export const SAMPLE_DISCOUNTS: DiscountRule[] = [
  {
    id: 'disc-welcome',
    code: 'WELCOME10',
    name: '10% Welcome Discount',
    discountType: 'percentage',
    value: 10.0,
    isActive: true,
  },
  {
    id: 'disc-vip',
    code: 'VIP25',
    name: '$25 Off High-Value Orders',
    discountType: 'fixed',
    value: 25.0,
    minOrderSubtotal: 100.0,
    isActive: true,
  },
  {
    id: 'disc-flash',
    code: 'FLASH15',
    name: '15% Off Flash Promo',
    discountType: 'percentage',
    value: 15.0,
    maxDiscountAmount: 30.0,
    isActive: true,
  },
];
