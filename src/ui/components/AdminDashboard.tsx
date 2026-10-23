import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Tag,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Search,
} from 'lucide-react';
import { defaultDatabase } from '../../database/Database';
import { defaultCurrencyManager } from '../../currency/CurrencyManager';
import { ProductRecord, DiscountRecord, QuotationRecord } from '../../database/types';
import { PricingModel } from '../../pricing/types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'discounts' | 'currency' | 'quotes' | 'audit'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Digital Goods');
  const [newProdPrice, setNewProdPrice] = useState(29.99);
  const [newProdModel, setNewProdModel] = useState<PricingModel>('fixed');
  const [newProdDelivery, setNewProdDelivery] = useState('Instant Automated Delivery');

  // New discount form state
  const [newDiscCode, setNewDiscCode] = useState('');
  const [newDiscType, setNewDiscType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscVal, setNewDiscVal] = useState(15);
  const [showAddDiscModal, setShowAddDiscModal] = useState(false);

  // Currency edit state
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState<number>(1.0);

  // Trigger state refresh
  const [refreshKey, setRefreshKey] = useState(0);

  const products = defaultDatabase.getAllProducts();
  const discounts = defaultDatabase.getAllDiscounts();
  const quotations = defaultDatabase.getAllQuotations();
  const auditLogs = defaultDatabase.getAuditLogs();
  const currencies = defaultCurrencyManager.getSupportedCurrencies();

  const handleToggleAvailability = (product: ProductRecord) => {
    product.is_available = !product.is_available;
    product.updated_at = new Date().toISOString();
    defaultDatabase.addAuditLog({
      guild_id: 'default-guild',
      user_id: 'admin-web',
      user_tag: 'AdminConsole#0001',
      action: `Toggle availability for ${product.name} -> ${product.is_available ? 'Available' : 'Unavailable'}`,
      target_type: 'product',
      target_id: product.id,
      details_json: JSON.stringify({ is_available: product.is_available }),
    });
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      defaultDatabase.deleteProduct(id);
      defaultDatabase.addAuditLog({
        guild_id: 'default-guild',
        user_id: 'admin-web',
        user_tag: 'AdminConsole#0001',
        action: `Deleted product ${name}`,
        target_type: 'product',
        target_id: id,
        details_json: '{}',
      });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const id = `prod-${Date.now()}`;
    const product: ProductRecord = {
      id,
      guild_id: 'default-guild',
      name: newProdName,
      description: newProdDesc || 'Configured commercial catalog item.',
      category: newProdCategory,
      product_type: newProdModel === 'subscription' ? 'subscription' : 'service',
      base_price: Number(newProdPrice),
      currency: 'USD',
      min_quantity: 1,
      is_available: true,
      delivery_info: newProdDelivery,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'AdminConsole#0001',
    };

    defaultDatabase.saveProduct(
      product,
      {
        id: `rule-${id}`,
        productId: id,
        pricingModel: newProdModel,
        basePrice: Number(newProdPrice),
        minQuantity: 1,
        allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'BRL'],
        tiers: newProdModel === 'tiered' ? [
          { minQuantity: 1, maxQuantity: 9, unitPrice: Number(newProdPrice) },
          { minQuantity: 10, unitPrice: Math.round(Number(newProdPrice) * 0.8) },
        ] : undefined,
      },
      [],
      []
    );

    defaultDatabase.addAuditLog({
      guild_id: 'default-guild',
      user_id: 'admin-web',
      user_tag: 'AdminConsole#0001',
      action: `Created new product ${newProdName} (${newProdModel})`,
      target_type: 'product',
      target_id: id,
      details_json: JSON.stringify(product),
    });

    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdDesc('');
    setRefreshKey((k) => k + 1);
  };

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscCode.trim()) return;

    const code = newDiscCode.toUpperCase().trim();
    defaultDatabase.saveDiscount({
      id: `disc-${Date.now()}`,
      guild_id: 'default-guild',
      code,
      name: `${code} Promo`,
      discount_type: newDiscType,
      value: Number(newDiscVal),
      is_active: true,
      created_at: new Date().toISOString(),
    });

    defaultDatabase.addAuditLog({
      guild_id: 'default-guild',
      user_id: 'admin-web',
      user_tag: 'AdminConsole#0001',
      action: `Created discount code ${code}`,
      target_type: 'discount',
      target_id: code,
      details_json: JSON.stringify({ type: newDiscType, value: newDiscVal }),
    });

    setShowAddDiscModal(false);
    setNewDiscCode('');
    setRefreshKey((k) => k + 1);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#1e1f22] text-gray-200 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2b2d31] pb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Store Administration & Catalog Center</h2>
            <p className="text-xs text-gray-400 mt-1">
              Configure products, volume pricing tiers, promotional codes, and live currency rates for Discord server members.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-[#2b2d31] border border-[#383a40] px-3.5 py-1.5 rounded-lg flex items-center space-x-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">{products.length} Products</span>
            </div>
            <div className="bg-[#2b2d31] border border-[#383a40] px-3.5 py-1.5 rounded-lg flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">{quotations.length} Quotations</span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex space-x-2 border-b border-[#2b2d31] pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'catalog' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            Product Catalog
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'discounts' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            Discount Coupons
          </button>
          <button
            onClick={() => setActiveTab('currency')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'currency' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            Exchange Rates
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'quotes' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            Quotations & Snapshots
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'audit' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            Audit Trail
          </button>
        </div>

        {/* TAB 1: PRODUCT CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-[#383a40] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
                />
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-[#2b2d31] border border-[#383a40] rounded-xl overflow-hidden shadow">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#232428] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#383a40]">
                  <tr>
                    <th className="py-3 px-4">Product Name & Category</th>
                    <th className="py-3 px-4">Pricing Model</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4">Fulfillment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#383a40]/60">
                  {filteredProducts.map((p) => {
                    const rule = defaultDatabase.getPricingRuleByProductId(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-[#313338] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white text-sm">{p.name}</div>
                          <div className="text-[11px] text-gray-400">{p.category}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-[#1e1f22] text-indigo-300 px-2 py-0.5 rounded font-mono uppercase text-[10px] border border-[#383a40]">
                            {rule?.pricingModel || 'fixed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-white">
                          {p.currency} {p.base_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAvailability(p)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              p.is_available
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {p.is_available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{p.is_available ? 'In Stock' : 'Out of Stock'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-gray-300 truncate max-w-xs">{p.delivery_info || 'Standard'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#1e1f22] rounded transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DISCOUNTS */}
        {activeTab === 'discounts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Promotional Coupon Codes</h3>
                <p className="text-xs text-gray-400">Coupon codes users can pass into `/quote discount_code:...`</p>
              </div>
              <button
                onClick={() => setShowAddDiscModal(true)}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {discounts.map((d) => (
                <div key={d.id} className="bg-[#2b2d31] border border-[#383a40] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400 text-sm">{d.code}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        d.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {d.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {d.discount_type === 'percentage' ? `${d.value}% OFF` : `$${d.value.toFixed(2)} OFF`}
                  </div>
                  <div className="text-xs text-gray-400">{d.name}</div>
                  {d.max_discount_amount && (
                    <div className="text-[11px] text-gray-400">Cap limit: ${d.max_discount_amount}</div>
                  )}
                  {d.min_order_subtotal && (
                    <div className="text-[11px] text-gray-400">Min Order: ${d.min_order_subtotal}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EXCHANGE RATES */}
        {activeTab === 'currency' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Configured Exchange Rates (Anchor: 1 USD)</h3>
              <p className="text-xs text-gray-400">
                Live rates used for multi-currency `/quote` calculations. Every quote permanently records the rate used.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currencies.map((c) => {
                const rateInfo = defaultCurrencyManager.getExchangeRate('USD', c.code);
                const isEditing = editingCurrency === c.code;

                return (
                  <div key={c.code} className="bg-[#2b2d31] border border-[#383a40] p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {c.name} ({c.code})
                      </span>
                      <span className="text-gray-400 font-mono text-sm">{c.symbol}</span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="number"
                          step="0.01"
                          value={newRateValue}
                          onChange={(e) => setNewRateValue(parseFloat(e.target.value) || 1)}
                          className="w-24 bg-[#1e1f22] border border-[#383a40] rounded px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => {
                            defaultCurrencyManager.setRate('USD', c.code, newRateValue, 'Admin Dashboard Edit');
                            setEditingCurrency(null);
                            setRefreshKey((k) => k + 1);
                          }}
                          className="bg-[#5865f2] text-white px-2 py-1 rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCurrency(null)}
                          className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between pt-1">
                        <div className="font-mono text-lg font-bold text-emerald-400">
                          1 USD = {rateInfo?.rate ?? 1.0} {c.code}
                        </div>
                        {c.code !== 'USD' && (
                          <button
                            onClick={() => {
                              setEditingCurrency(c.code);
                              setNewRateValue(rateInfo?.rate ?? 1.0);
                            }}
                            className="text-xs text-indigo-400 hover:underline"
                          >
                            Edit Rate
                          </button>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-gray-500 pt-1 border-t border-[#383a40]">
                      Updated: {rateInfo?.lastUpdated ? new Date(rateInfo.lastUpdated).toLocaleDateString() : 'Baseline'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: QUOTATIONS & SNAPSHOTS */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Quotation Snapshots Explorer</h3>
              <p className="text-xs text-gray-400">
                Every quote preserves an exact immutable snapshot. Click "View Frozen Snapshot" to inspect the JSON state.
              </p>
            </div>

            <div className="bg-[#2b2d31] border border-[#383a40] rounded-xl overflow-hidden shadow">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#232428] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#383a40]">
                  <tr>
                    <th className="py-3 px-4">Quote Number</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">Final Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#383a40]/60">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-[#313338] transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{q.quote_number}</td>
                      <td className="py-3 px-4">{q.user_tag}</td>
                      <td className="py-3 px-4 font-mono">
                        {q.currency} {q.raw_subtotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {q.currency} {q.final_total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-[#1e1f22] text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold uppercase border border-[#383a40]">
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{new Date(q.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const snap = defaultDatabase.getQuotationSnapshot(q.id);
                            setSelectedSnapshot(snap ? JSON.parse(snap.snapshot_json) : null);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e1f22] hover:bg-[#383a40] text-gray-200 rounded text-[11px] border border-[#383a40] transition"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Administrative Audit Trail</h3>
              <p className="text-xs text-gray-400">Immutable chronological log of privileged operations and commands.</p>
            </div>

            <div className="bg-[#2b2d31] border border-[#383a40] rounded-xl p-4 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-xs text-gray-400">No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs border-b border-[#383a40] pb-2 last:border-0">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="font-semibold text-white">{log.user_tag}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="font-mono text-indigo-300 mt-0.5">{log.action}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Inspector Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2b2d31] border border-[#383a40] rounded-xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#383a40] pb-3">
              <h4 className="font-bold text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Frozen Quotation Snapshot (Immutable)
              </h4>
              <button onClick={() => setSelectedSnapshot(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              This snapshot was permanently serialized at the time of quotation generation. Any future changes to catalog base prices, taxes, or exchange rates will NEVER alter these values.
            </p>

            <pre className="bg-[#1e1f22] p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 border border-[#383a40]">
              {JSON.stringify(selectedSnapshot, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] rounded text-xs font-semibold text-white"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="bg-[#2b2d31] border border-[#383a40] rounded-xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#383a40] pb-3">
              <h4 className="font-bold text-base">Add New Catalog Product</h4>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dedicated Game Server VPS"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Design & Commissions">Design & Commissions</option>
                  <option value="Digital Goods">Digital Goods</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Bundles">Bundles</option>
                  <option value="Physical Merchandise">Physical Merchandise</option>
                  <option value="Gaming Assets">Gaming Assets</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Base Starting Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Pricing Model</label>
                  <select
                    value={newProdModel}
                    onChange={(e) => setNewProdModel(e.target.value as any)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    <option value="fixed">Fixed Price (Unit × Qty)</option>
                    <option value="tiered">Tiered Volume Pricing</option>
                    <option value="variable">Variable with Add-ons</option>
                    <option value="subscription">Subscription Recurring</option>
                    <option value="bundle">Pre-packaged Bundle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Fulfillment & Delivery Details</label>
                <input
                  type="text"
                  value={newProdDelivery}
                  onChange={(e) => setNewProdDelivery(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Comprehensive description of product specifications..."
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] rounded text-xs font-semibold text-white"
              >
                Add to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Discount Modal */}
      {showAddDiscModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDiscount}
            className="bg-[#2b2d31] border border-[#383a40] rounded-xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#383a40] pb-3">
              <h4 className="font-bold text-base">Create Discount Coupon</h4>
              <button
                type="button"
                onClick={() => setShowAddDiscModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={newDiscCode}
                  onChange={(e) => setNewDiscCode(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Discount Type</label>
                  <select
                    value={newDiscType}
                    onChange={(e) => setNewDiscType(e.target.value as any)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Dollar ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newDiscVal}
                    onChange={(e) => setNewDiscVal(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddDiscModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] rounded text-xs font-semibold text-white"
              >
                Activate Coupon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
