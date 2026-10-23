/**
 * Currency Definitions, Formats, and Exchange Rate Management
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPlacement: 'prefix' | 'suffix';
  spacing: boolean;
}

export interface ExchangeRateEntry {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: string;
  source: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, symbolPlacement: 'prefix', spacing: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, symbolPlacement: 'prefix', spacing: false },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, symbolPlacement: 'prefix', spacing: false },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2, symbolPlacement: 'prefix', spacing: false },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, symbolPlacement: 'prefix', spacing: false },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, symbolPlacement: 'prefix', spacing: true },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimals: 2, symbolPlacement: 'prefix', spacing: false },
  PEN: { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', decimals: 2, symbolPlacement: 'prefix', spacing: true },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, symbolPlacement: 'prefix', spacing: false },
};

export class CurrencyManager {
  private rates: Map<string, ExchangeRateEntry> = new Map();
  private baseCurrency: string = 'USD';

  constructor() {
    this.initDefaultRates();
  }

  private initDefaultRates() {
    // Standard baseline market rates anchored on USD (Base 1.0)
    const baselineRates: Record<string, number> = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.52,
      BRL: 5.15,
      MXN: 16.85,
      PEN: 3.74,
      JPY: 154.5,
    };

    const now = new Date().toISOString();
    for (const [code, rate] of Object.entries(baselineRates)) {
      this.rates.set(`USD_${code}`, {
        fromCurrency: 'USD',
        toCurrency: code,
        rate,
        lastUpdated: now,
        source: 'Central Bank Reference & Commercial Index',
      });
      // Inverse rate
      this.rates.set(`${code}_USD`, {
        fromCurrency: code,
        toCurrency: 'USD',
        rate: 1 / rate,
        lastUpdated: now,
        source: 'Central Bank Reference & Commercial Index',
      });
    }
  }

  public getSupportedCurrencies(): CurrencyConfig[] {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  public isSupported(code: string): boolean {
    return Boolean(SUPPORTED_CURRENCIES[code.toUpperCase()]);
  }

  public getCurrencyConfig(code: string): CurrencyConfig {
    const upper = code.toUpperCase();
    if (!SUPPORTED_CURRENCIES[upper]) {
      return {
        code: upper,
        symbol: upper,
        name: upper,
        decimals: 2,
        symbolPlacement: 'suffix',
        spacing: true,
      };
    }
    return SUPPORTED_CURRENCIES[upper];
  }

  public getExchangeRate(from: string, to: string): ExchangeRateEntry | null {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    if (fromUpper === toUpper) {
      return {
        fromCurrency: fromUpper,
        toCurrency: toUpper,
        rate: 1.0,
        lastUpdated: new Date().toISOString(),
        source: 'Identical Currency Parity (1:1)',
      };
    }

    const directKey = `${fromUpper}_${toUpper}`;
    if (this.rates.has(directKey)) {
      return this.rates.get(directKey)!;
    }

    // Cross-rate via USD
    const fromToUsd = this.rates.get(`${fromUpper}_USD`);
    const usdToTarget = this.rates.get(`USD_${toUpper}`);
    if (fromToUsd && usdToTarget) {
      const crossRate = fromToUsd.rate * usdToTarget.rate;
      return {
        fromCurrency: fromUpper,
        toCurrency: toUpper,
        rate: crossRate,
        lastUpdated: new Date().toISOString(),
        source: 'Calculated Cross-Rate via USD Baseline',
      };
    }

    return null;
  }

  public setRate(from: string, to: string, rate: number, source: string = 'Administrator Configured'): void {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    const now = new Date().toISOString();

    this.rates.set(`${fromUpper}_${toUpper}`, {
      fromCurrency: fromUpper,
      toCurrency: toUpper,
      rate,
      lastUpdated: now,
      source,
    });

    if (rate > 0) {
      this.rates.set(`${toUpper}_${fromUpper}`, {
        fromCurrency: toUpper,
        toCurrency: fromUpper,
        rate: 1 / rate,
        lastUpdated: now,
        source: `${source} (Inverse)`,
      });
    }
  }

  public convert(amount: number, from: string, to: string): { convertedAmount: number; rate: number; timestamp: string; source: string } {
    const entry = this.getExchangeRate(from, to);
    if (!entry) {
      throw new Error(`Currency conversion from ${from} to ${to} is currently unavailable. No valid exchange rate configured.`);
    }

    const cfg = this.getCurrencyConfig(to);
    const converted = this.round(amount * entry.rate, cfg.decimals);

    return {
      convertedAmount: converted,
      rate: entry.rate,
      timestamp: entry.lastUpdated,
      source: entry.source,
    };
  }

  public format(amount: number, currencyCode: string): string {
    const cfg = this.getCurrencyConfig(currencyCode);
    const rounded = this.round(amount, cfg.decimals);
    const numPart = rounded.toLocaleString('en-US', {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });

    if (cfg.symbolPlacement === 'prefix') {
      return `${cfg.symbol}${cfg.spacing ? ' ' : ''}${numPart} ${cfg.code}`;
    } else {
      return `${numPart} ${cfg.symbol} ${cfg.code}`;
    }
  }

  public round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}

export const defaultCurrencyManager = new CurrencyManager();
