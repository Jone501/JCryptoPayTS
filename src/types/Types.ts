export interface Error {
  code: number;
  name: string;
  description?: string;
  message?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  result: T;
  error: Error;
}

export interface ResponseList<T> {
  items: T[];
}

const CryptoCurrencies = [
  "DOGS",
  "HMSTR",
  "USDT",
  "ETH",
  "WIF",
  "MY",
  "BNB",
  "TRUMP",
  "SOL",
  "TRX",
  "DOGE",
  "PEPE",
  "BTC",
  "CATI",
  "LTC",
  "MELANIA",
  "GRAM",
  "NOT",
  "MEMHASH",
  "MAJOR",
  "BONK",
  "USDC",
  "TON",
] as const;
export type CryptoCurrency = (typeof CryptoCurrencies)[number];

export type CryptoAsset = CryptoCurrency & ("USDT" | "TON" | "BTC" | "DOGE" | "LTC" | "ETH" | "BNB" | "TRX" | "USDC" | "JET" | "SEND");

export type SwappableAsset = CryptoCurrency & ("USDT" | "TON" | "TRX" | "ETH" | "SOL" | "BTC" | "LTC");

const FiatCurrencies = [
  "GBP",
  "IDR",
  "UAH",
  "ILS",
  "TJS",
  "PLN",
  "RUB",
  "AED",
  "KGS",
  "AMD",
  "BRL",
  "CNY",
  "BYN",
  "INR",
  "TRY",
  "UZS",
  "USD",
  "AZN",
  "EUR",
  "THB",
  "KZT",
  "GEL",
] as const;
export type FiatCurrency = (typeof FiatCurrencies)[number];

/**
 * Проверяет, является ли валюта криптой
 *
 * @param code Буквенный код валюты
 * @returns `true`, если это криптовалюта
 */
export function isCrypto(code: string): code is CryptoCurrency {
  return CryptoCurrencies.includes(code as CryptoCurrency);
}

/**
 * Проверяет, является ли валюта фиатной
 *
 * @param code Буквенный код валюты
 * @returns `true`, если валюта фиатная
 */
export function isFiat(code: string): code is FiatCurrency {
  return FiatCurrencies.includes(code as FiatCurrency);
}

export interface Invoice {
  invoice_id: number;
  hash: string;
  currency_type: "crypto" | "fiat";
  asset?: CryptoAsset;
  fiat?: FiatCurrency;
  amount: number;
  paid_asset?: CryptoAsset;
  paid_amount?: number;
  paid_fiat_rate?: number;
  accepted_assets?: CryptoAsset[];
  fee_asset?: CryptoAsset;
  fee_amount?: number;
  fee_in_usd?: number;
  bot_invoice_url: URL;
  mini_app_invoice_url: URL;
  web_app_invoice_url: URL;
  description?: string;
  status: "active" | "paid" | "expired";
  swap_to?: SwappableAsset;
  is_swapped?: boolean;
  swapped_uid?: string;
  swapped_to?: SwappableAsset;
  swapped_rate?: number;
  swapped_output?: number;
  swapped_usd_amount?: number;
  swapped_usd_rate?: number;
  created_at: Date;
  paid_usd_rate?: number;
  allow_comments: boolean;
  allow_anonymous: boolean;
  expiration_date?: Date;
  paid_at?: Date;
  paid_anonymously?: boolean;
  comment?: string;
  hidden_message?: string;
  payload?: string;
  paid_btn_name?: "viewItem" | "openChannel" | "openBot" | "callback";
  paid_btn_url?: URL;
}

export interface Transfer {
  transfer_id: number;
  spend_id: string;
  user_id: string;
  asset: CryptoAsset;
  amount: number;
  status: "completed";
  completed_at: Date;
  comment?: string;
}

export interface Check {
  check_id: number;
  hash: string;
  asset: CryptoAsset;
  amount: number;
  bot_check_url: URL;
  status: "active" | "activated";
  created_at: Date;
  activated_at?: Date;
}

export interface Balance {
  currency_code: CryptoAsset;
  available: number;
  onhold: number;
}

export interface ExchangeRate {
  is_valid: boolean;
  is_crypto: boolean;
  is_fiat: boolean;
  source: CryptoCurrency;
  target: FiatCurrency;
  rate: number;
}

export interface Currency {
  is_blockchain: boolean;
  is_stablecoin: boolean;
  is_fiat: boolean;
  name: string;
  code: string;
  decimals: number;
  url?: URL;
}

export interface AppInfo {
  app_id: number;
  name: string;
  payment_processing_bot_username: string;
}

export interface AppStats {
  volume: number;
  conversion: number;
  unique_users_count: number;
  created_invoice_count: number;
  paid_invoice_count: number;
  start_at: Date;
  end_at: Date;
}

export interface Webhook {
  update_id: number;
  update_type: "invoice_paid";
  request_date: Date;
  payload: Invoice;
}
