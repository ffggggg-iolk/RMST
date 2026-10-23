import test from 'node:test';
import assert from 'node:assert/strict';
import { AppDatabase } from '../database/Database';
import { QuotationService } from '../services/QuotationService';
import { UniversalPricingEngine } from '../pricing/UniversalPricingEngine';
import { CurrencyManager } from '../currency/CurrencyManager';

test('Availability Check: Rejects quote for unavailable or disabled product', async () => {
  const db = new AppDatabase();
  const service = new QuotationService(db);

  // Mark product unavailable
  const product = db.getProductById('prod-custom-bot');
  assert.ok(product);
  product.is_available = false;

  await assert.rejects(
    async () => {
      await service.generateQuote({
        userId: 'u1',
        userTag: 'test#0001',
        productId: 'prod-custom-bot',
        quantity: 1,
      });
    },
    {
      message: /currently unavailable or out of stock/,
    }
  );
});

test('Snapshot Immutability: Price modifications do NOT affect previously generated quote snapshots', async () => {
  const db = new AppDatabase();
  const service = new QuotationService(db);

  // Generate initial quote
  const quoteResult = await service.generateQuote({
    userId: 'u2',
    userTag: 'trader#1234',
    productId: 'prod-custom-bot',
    quantity: 2,
    saveToDatabase: true,
  });

  const quoteId = quoteResult.record?.id;
  assert.ok(quoteId);
  const initialFinalTotal = quoteResult.record?.final_total;
  assert.ok(initialFinalTotal);

  // Now, administrative price change happens on the live product
  const product = db.getProductById('prod-custom-bot')!;
  const originalPrice = product.base_price;
  product.base_price = 999.0;

  // Retrieve stored quote and frozen snapshot
  const retrieved = service.getQuotationByNumber(quoteResult.record!.quote_number);
  assert.ok(retrieved);
  assert.equal(retrieved.record.final_total, initialFinalTotal);
  assert.equal(retrieved.snapshot.finalTotal, initialFinalTotal);
  assert.notEqual(retrieved.snapshot.unitPrice, 999.0);
  assert.equal(retrieved.snapshot.quantity, 2);
});

test('Multi-Product Comparison with Objective Criteria', () => {
  const db = new AppDatabase();
  const service = new QuotationService(db);

  const comp = service.compareProducts(
    ['prod-custom-bot', 'prod-3d-model'],
    [1, 1],
    'USD'
  );

  assert.equal(comp.items.length, 2);
  assert.ok(comp.bestValueByUnit.length > 0);
  assert.ok(comp.lowestOverallTotal.length > 0);
});

test('Ticket creation correctly references Quote ID', () => {
  const db = new AppDatabase();
  const ticket = db.createTicket(
    'Q-000100',
    'default-guild',
    'user-123',
    'buyer#0001',
    'channel-tickets'
  );

  assert.equal(ticket.quotation_id, 'Q-000100');
  assert.equal(ticket.status, 'open');
  assert.ok(ticket.ticket_number.startsWith('TICK-'));
});
