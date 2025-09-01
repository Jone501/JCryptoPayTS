import { CryptoAsset, FiatCurrency, isCrypto, SwappableAsset } from "./Types";

interface CreateInvoiceParams {
  currency_type?: "crypto" | "fiat";
  asset?: CryptoAsset;
  fiat?: FiatCurrency;
  accepted_assets?: string;
  amount: number;
  description?: string;
  hidden_message?: string;
  paid_btn_name?: "viewItem" | "openChannel" | "openBot" | "callback";
  paid_btn_url?: URL;
  swap_to?: SwappableAsset;
  payload?: string;
  allow_comments?: boolean;
  allow_anonymous?: boolean;
  expires_in?: number;
}

interface CreateCheckParams {
  asset: CryptoAsset;
  amount: number;
  pin_to_user_id?: number;
  pin_to_username?: string;
}

interface TransferParams {
  user_id: number;
  asset: CryptoAsset;
  amount: number;
  spend_id: string;
  comment?: string;
  disable_send_notification?: boolean;
}

interface GetInvoicesParams {
  asset?: CryptoAsset;
  fiat?: FiatCurrency;
  invoice_ids?: string;
  status?: "active" | "paid";
  offset?: number;
  count?: number;
}

interface GetTransfersParams {
  asset?: CryptoAsset;
  transfer_ids?: string;
  spend_id?: string;
  offset?: number;
  count?: number;
}

interface GetChecksParams {
  asset?: CryptoAsset;
  check_ids?: string;
  status?: "active" | "activated";
  offset?: number;
  count?: number;
}

interface GetStatsParams {
  start_at?: Date;
  end_at?: Date;
}

export class CreateInvoiceBuilder {
  private readonly params: CreateInvoiceParams;

  constructor(currency: CryptoAsset | FiatCurrency, amount: number) {
    this.params = {
      amount: amount,
    };
    if (isCrypto(currency)) {
      this.params.currency_type = "crypto";
      this.params.asset = currency;
    } else {
      this.params.currency_type = "fiat";
      this.params.fiat = currency;
    }
  }

  accepted_assets(accepted_assets: CryptoAsset[]): this {
    this.params.accepted_assets = accepted_assets.join(",");
    return this;
  }
  description(description: string): this {
    this.params.description = description;
    return this;
  }
  hidden_message(hidden_message: string): this {
    this.params.hidden_message = hidden_message;
    return this;
  }
  paid_btn_name(paid_btn_name: "viewItem" | "openChannel" | "openBot" | "callback"): this {
    this.params.paid_btn_name = paid_btn_name;
    return this;
  }
  paid_btn_url(paid_btn_url: URL | string): this {
    this.params.paid_btn_url = paid_btn_url instanceof URL ? paid_btn_url : new URL(paid_btn_url);
    return this;
  }
  swap_to(swap_to: SwappableAsset): this {
    this.params.swap_to = swap_to;
    return this;
  }
  payload(payload: string): this {
    this.params.payload = payload;
    return this;
  }
  allow_comments(allow_comments: boolean): this {
    this.params.allow_comments = allow_comments;
    return this;
  }
  allow_anonymous(allow_anonymous: boolean): this {
    this.params.allow_anonymous = allow_anonymous;
    return this;
  }
  expires_in(expires_in: number): this {
    this.params.expires_in = expires_in;
    return this;
  }

  build(): CreateInvoiceParams {
    return this.params;
  }
}

export class CreateCheckBuilder {
  private readonly params: CreateCheckParams;

  constructor(asset: CryptoAsset, amount: number) {
    this.params = {
      asset: asset,
      amount: amount,
    };
  }

  pin_to_user_id(pin_to_user_id: number): this {
    this.params.pin_to_user_id = pin_to_user_id;
    return this;
  }
  pin_to_username(pin_to_username: string): this {
    this.params.pin_to_username = pin_to_username;
    return this;
  }

  build(): CreateCheckParams {
    return this.params;
  }
}

export class TransferBuilder {
  private readonly params: TransferParams;

  constructor(asset: CryptoAsset, amount: number, user_id: number, spend_id: string) {
    this.params = {
      asset: asset,
      amount: amount,
      user_id: user_id,
      spend_id: spend_id,
    };
  }

  comment(comment: string): this {
    this.params.comment = comment;
    return this;
  }
  disable_send_notification(disable_send_notification: boolean): this {
    this.params.disable_send_notification = disable_send_notification;
    return this;
  }

  build(): TransferParams {
    return this.params;
  }
}

export class GetInvoicesBuilder {
  private readonly params: GetInvoicesParams = {};

  asset(asset: CryptoAsset): this {
    this.params.asset = asset;
    return this;
  }
  fiat(fiat: FiatCurrency): this {
    this.params.fiat = fiat;
    return this;
  }
  invoice_ids(invoice_ids: number[]): this {
    this.params.invoice_ids = invoice_ids.join(",");
    return this;
  }
  status(status: "active" | "paid"): this {
    this.params.status = status;
    return this;
  }
  offset(offset: number): this {
    this.params.offset = offset;
    return this;
  }
  count(count: number): this {
    this.params.count = count;
    return this;
  }

  build(): GetInvoicesParams {
    return this.params;
  }
}

export class GetTransfersBuilder {
  private readonly params: GetTransfersParams = {};

  asset(asset: CryptoAsset): this {
    this.params.asset = asset;
    return this;
  }
  transfer_ids(transfer_ids: number[]): this {
    this.params.transfer_ids = transfer_ids.join(",");
    return this;
  }
  spend_id(spend_id: string): this {
    this.params.spend_id = spend_id;
    return this;
  }
  offset(offset: number): this {
    this.params.offset = offset;
    return this;
  }
  count(count: number): this {
    this.params.count = count;
    return this;
  }

  build(): GetTransfersParams {
    return this.params;
  }
}

export class GetChecksBuilder {
  private readonly params: GetChecksParams = {};

  asset(asset: CryptoAsset): this {
    this.params.asset = asset;
    return this;
  }
  check_ids(check_ids: number[]): this {
    this.params.check_ids = check_ids.join(",");
    return this;
  }
  status(status: "active" | "activated"): this {
    this.params.status = status;
    return this;
  }
  offset(offset: number): this {
    this.params.offset = offset;
    return this;
  }
  count(count: number): this {
    this.params.count = count;
    return this;
  }

  build(): GetChecksParams {
    return this.params;
  }
}

export class GetStatsBuilder {
  private readonly params: GetStatsParams = {};

  start_at(start_at: Date): this {
    this.params.start_at = start_at;
    return this;
  }
  end_at(end_at: Date): this {
    this.params.end_at = end_at;
    return this;
  }

  build(): GetStatsParams {
    return this.params;
  }
}
