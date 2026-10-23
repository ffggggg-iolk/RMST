/**
 * Database Entity Types
 */

import { PricingRule, QuoteCalculationResult } from '../pricing/types';

export interface GuildSettingsRecord {
  guild_id: string;
  bot_name: string;
  brand_accent_color: string;
  default_currency: string;
  ticket_category_id?: string;
  ticket_support_channel_id?: string;
  footer_text: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductRecord {
  id: string;
  guild_id: string;
  name: string;
  description: string;
  category: string;
  product_type: 'digital' | 'physical' | 'service' | 'subscription' | 'bundle' | 'custom';
  base_price: number;
  currency: string;
  min_quantity: number;
  max_quantity?: number;
  is_available: boolean;
  stock_count?: number;
  delivery_info?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface PricingRuleRecord {
  id: string;
  product_id: string;
  pricing_model: string;
  base_price: number;
  tiers_json?: string;
  variable_config_json?: string;
  subscription_config_json?: string;
  bundle_config_json?: string;
  custom_config_json?: string;
  allowed_currencies_json: string;
}

export interface DiscountRecord {
  id: string;
  guild_id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  min_order_subtotal?: number;
  max_discount_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface QuotationRecord {
  id: string;
  quote_number: string;
  guild_id: string;
  user_id: string;
  user_tag: string;
  total_items: number;
  currency: string;
  exchange_rate: number;
  raw_subtotal: number;
  discount_amount: number;
  discount_code?: string;
  total_fees: number;
  total_tax: number;
  final_total: number;
  status: 'active' | 'ordered' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface QuotationItemRecord {
  id: string;
  quotation_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  options_json?: string;
}

export interface QuotationSnapshotRecord {
  id: string;
  quotation_id: string;
  snapshot_json: string; // Complete frozen calculation snapshot
  frozen_at: string;
}

export interface TicketRecord {
  id: string;
  ticket_number: string;
  quotation_id: string;
  guild_id: string;
  user_id: string;
  user_tag: string;
  channel_id: string;
  status: 'open' | 'closed' | 'archived';
  created_at: string;
  closed_at?: string;
  transcript_json?: string;
}

export interface AuditLogRecord {
  id: string;
  guild_id: string;
  user_id: string;
  user_tag: string;
  action: string;
  target_type: string;
  target_id: string;
  details_json: string;
  created_at: string;
}
