import React, { useState } from 'react';
import {
  Sliders,
  DollarSign,
  TrendingDown,
  Percent,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Calculator,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { defaultPricingEngine } from '../../pricing/UniversalPricingEngine';
import { defaultCurrencyManager } from '../../currency/CurrencyManager';
import { defaultDatabase } from '../../database/Database';
import { PricingRule } from '../../pricing/types';

export const PricingSandbox: React.FC = () => {
  const products = defaultDatabase.getAllProducts();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod-custom-bot');
  const [quantity, setQuantity] = useState<number>(3);
  const [currency, setCurrency] = useState<string>('USD');
  const [discountCode, setDiscountCode] = useState<string>('WELCOME10');
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(undefined);
  const [includeServiceFee, setIncludeServiceFee] = useState<boolean>(true);
  const [includeTax, setIncludeTax] = useState<boolean>(true);

  // Selected variable options
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['rigging']);

  const currentProduct = defaultDatabase.getProductById(selectedProductId) || products[0];
  const currentRule = defaultDatabase.getPricingRuleByProductId(currentProduct.id);

  // Build calculation request
  let result: any = null;
  let calculationError: string | null = null;

  try {
    if (currentRule) {
      const fees = includeServiceFee ? defaultDatabase.getProductFees(currentProduct.id) : [];
      const taxes = includeTax ? defaultDatabase.getProductTaxes(currentProduct.id) : [];
      const disc = discountCode ? defaultDatabase.getDiscountByCode('default-guild', discountCode) : null;

      result = defaultPricingEngine.calculate({
        productId: currentProduct.id,
        productName: currentProduct.name,
        pricingRule: currentRule,
        quantity: Math.max(1, quantity),
        selectedOptions,
        currency,
        fees,
        taxRules: taxes,
        spendingBudget: budgetLimit,
        discount: disc
          ? {
              id: disc.id,
              code: disc.code,
              name: disc.name,
              discountType: disc.discount_type,
              value: disc.value,
              minOrderSubtotal: disc.min_order_subtotal,
              maxDiscountAmount: disc.max_discount_amount,
              isActive: disc.is_active,
            }
          : undefined,
      });
    }
  } catch (err: any) {
    calculationError = err.message;
  }

  return (
    <div className="flex-1 bg-[#1e1f22] text-gray-200 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Universal Pricing Engine Laboratory
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Test and audit financial calculations across all 11 models with deterministic ordering, precision rounding, and complete step tracing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-[#2b2d31] border border-[#383a40] p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-[#383a40] pb-2">Calculation Parameters</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Catalog Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                >
                  {products.map((p) => {
                    const r = defaultDatabase.getPricingRuleByProductId(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} — [{r?.pricingModel.toUpperCase()}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (CA$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="MXN">MXN (MX$)</option>
                    <option value="PEN">PEN (S/.)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Discount Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10, VIP25"
                    className="flex-1 bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white font-mono"
                  />
                  <button
                    onClick={() => setDiscountCode('')}
                    className="px-2.5 py-1.5 bg-[#1e1f22] hover:bg-[#383a40] rounded text-gray-400 hover:text-white border border-[#383a40]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Spending Budget Limit (Affordability Solver)</label>
                <input
                  type="number"
                  placeholder="Leave empty or specify target e.g. 150"
                  value={budgetLimit || ''}
                  onChange={(e) => setBudgetLimit(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                />
              </div>

              {/* Variable options if model is variable */}
              {currentRule?.pricingModel === 'variable' && currentRule.variableConfig?.options && (
                <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#383a40] space-y-2">
                  <div className="font-semibold text-gray-300">Configurable Add-on Options:</div>
                  {currentRule.variableConfig.options.map((opt) => (
                    <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(opt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOptions([...selectedOptions, opt.id]);
                          } else {
                            setSelectedOptions(selectedOptions.filter((id) => id !== opt.id));
                          }
                        }}
                        className="rounded border-gray-600 text-indigo-600 focus:ring-0"
                      />
                      <span>
                        {opt.name} ({opt.modifierType === 'flat' ? `+$${opt.priceModifier}` : `×${opt.priceModifier}`})
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Fee and Tax Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2 bg-[#1e1f22] p-2.5 rounded border border-[#383a40] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeServiceFee}
                    onChange={(e) => setIncludeServiceFee(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Include Fees</span>
                </label>
                <label className="flex items-center space-x-2 bg-[#1e1f22] p-2.5 rounded border border-[#383a40] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Include Taxes</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-4">
            {calculationError ? (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-xs">
                <div className="font-bold text-sm mb-1">Calculation Error</div>
                <div>{calculationError}</div>
              </div>
            ) : result ? (
              <div className="bg-[#2b2d31] border border-[#383a40] p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#383a40] pb-3">
                  <div>
                    <span className="text-[10px] bg-[#1e1f22] text-indigo-300 px-2 py-0.5 rounded uppercase font-mono border border-[#383a40]">
                      Model: {result.pricingModel}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{result.productName}</h3>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-gray-400">Final Estimated Total</div>
                    <div className="text-2xl font-extrabold text-white font-mono">{result.formattedFinalTotal}</div>
                  </div>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#383a40]/60">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Unit Price</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{result.formattedUnitPrice}</div>
                  </div>

                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#383a40]/60">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Subtotal</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{result.formattedSubtotal}</div>
                  </div>

                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#383a40]/60">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Discounts</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      -{result.formattedDiscount}
                    </div>
                  </div>

                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#383a40]/60">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Fees + Tax</div>
                    <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                      +{currency} {(result.totalFees + result.totalTax).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Affordability Budget Analysis if set */}
                {result.budgetAnalysis && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4" />
                      Affordability Budget Analysis
                    </div>
                    <div className="text-gray-200">
                      Target Budget: <strong>{currency} {result.budgetAnalysis.availableBudget.toFixed(2)}</strong> •
                      Fits in budget: <strong>{result.budgetAnalysis.isAffordable ? 'YES' : 'NO'}</strong> •
                      Remaining Balance: <strong>{currency} {result.budgetAnalysis.remainingBudget.toFixed(2)}</strong> •
                      Maximum Affordable Quantity: <strong>{result.budgetAnalysis.maximumAffordableQuantity} units</strong>
                    </div>
                  </div>
                )}

                {/* Audit Trace Steps */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    Step-by-Step Calculation Formula Trace
                  </div>

                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#383a40] space-y-1 font-mono text-[11px] text-gray-300 max-h-56 overflow-y-auto">
                    {result.calculationSteps.map((step: string, sIdx: number) => (
                      <div key={sIdx} className="flex items-start space-x-2">
                        <span className="text-gray-600 select-none">{sIdx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
