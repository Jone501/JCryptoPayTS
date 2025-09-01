import axios, { AxiosInstance } from "axios";
import { PollingConfiguration, PollingManager } from "./Polling";
import { ApiResponse, AppInfo, AppStats, CryptoAsset, Balance, Check, Currency, ExchangeRate, Invoice, ResponseList, Transfer } from "./types/Types";
import { CreateCheckBuilder, CreateInvoiceBuilder, GetChecksBuilder, GetInvoicesBuilder, GetStatsBuilder, GetTransfersBuilder, TransferBuilder } from "./types/Params";

abstract class CryptoAppBase {
  private readonly axiosClient: AxiosInstance = axios.create({
    baseURL: `https://${this.url}`,
    headers: {
      "Crypto-Pay-API-Token": this.token,
    },
    transformResponse: (data) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
      const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

      return JSON.parse(data, (key: string, value: any) => {
        if (typeof value == "string") {
          if (dateRegex.test(value)) return new Date(value);
          if (urlRegex.test(value)) return new URL(value);
        }
        return value;
      });
    },
  });
  public readonly polling: PollingManager;

  protected constructor(public readonly token: string, private readonly url: string, polling: PollingConfiguration = {}) {
    this.polling = new PollingManager(this, polling);
  }

  private async request<T>(method: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.axiosClient.post<T>(method, JSON.stringify(params), {
      validateStatus: () => true,
      url: method,
      headers: {
        "Content-Type": params && "application/json",
      },
    });
    return response.data as ApiResponse<T>;
  }

  async getMe(): Promise<ApiResponse<AppInfo>> {
    return await this.request("getMe");
  }

  async createInvoice(builder: CreateInvoiceBuilder): Promise<ApiResponse<Invoice>> {
    return await this.request("createInvoice", builder.build());
  }

  async deleteInvoice(id: number): Promise<ApiResponse<boolean>> {
    return await this.request("deleteInvoice", { invoice_id: id });
  }

  async createCheck(builder: CreateCheckBuilder): Promise<ApiResponse<Check>> {
    return await this.request("createCheck", builder.build());
  }

  async deleteCheck(id: number): Promise<ApiResponse<boolean>> {
    return await this.request("deleteCheck", { check_id: id });
  }

  async transfer(builder: TransferBuilder): Promise<ApiResponse<Transfer>> {
    return await this.request("transfer", builder.build());
  }

  async getInvoices(builder?: GetInvoicesBuilder): Promise<ApiResponse<ResponseList<Invoice>>> {
    return await this.request("getInvoices", builder?.build());
  }

  async getTransfers(builder?: GetTransfersBuilder): Promise<ApiResponse<ResponseList<Transfer>>> {
    return await this.request("getTransfers", builder?.build());
  }

  async getChecks(builder?: GetChecksBuilder): Promise<ApiResponse<ResponseList<Check>>> {
    return await this.request("getChecks", builder?.build());
  }

  async getBalance(): Promise<ApiResponse<Balance[]>> {
    return await this.request("getBalance");
  }

  async getExchangeRates(): Promise<ApiResponse<ExchangeRate[]>> {
    return await this.request("getExchangeRates");
  }

  async getCurrencies(): Promise<ApiResponse<Currency[]>> {
    return await this.request("getCurrencies");
  }

  async getStats(builder?: GetStatsBuilder): Promise<ApiResponse<AppStats>> {
    return await this.request("getStats", builder?.build());
  }

  async deleteInvoices(ids: number[]) {
    ids.forEach((id) => this.deleteInvoice(id));
  }

  async deleteAllInvoices() {
    const ids = (await this.getInvoices(new GetInvoicesBuilder().count(1000))).result?.items?.map((x) => x.invoice_id);
    if (ids) this.deleteInvoices(ids);
  }

  async deleteChecks(ids: number[]) {
    ids.forEach((id) => this.deleteCheck(id));
  }

  async deleteAllChecks() {
    const ids = (await this.getChecks(new GetChecksBuilder().count(1000))).result?.items?.map((x) => x.check_id);
    if (ids) this.deleteChecks(ids);
  }

  async getInvoice(id: number): Promise<ApiResponse<Invoice | null>> {
    const response = await this.getInvoices(new GetInvoicesBuilder().invoice_ids([id]));
    const value = response.result?.items[0];
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  async getTransfer(id: number): Promise<ApiResponse<Transfer | null>> {
    const response = await this.getTransfers(new GetTransfersBuilder().transfer_ids([id]));
    const value = response.result?.items[0];
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  async getCheck(id: number): Promise<ApiResponse<Check | null>> {
    const response = await this.getChecks(new GetChecksBuilder().check_ids([id]));
    const value = response.result?.items[0];
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  async getAssetBalance(asset: CryptoAsset): Promise<ApiResponse<Balance | null>> {
    const response = await this.getBalance();
    const value = response.result?.find((x) => x.currency_code == asset);
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  async getCurrency(code: string): Promise<ApiResponse<Currency | null>> {
    const response = await this.getCurrencies();
    const value = response.result?.find((x) => x.code == code);
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }
}

export class CryptoApp extends CryptoAppBase {
  constructor(token: string, polling?: PollingConfiguration) {
    super(token, "pay.crypt.bot/api/", polling);
  }
}

export class CryptoAppTest extends CryptoAppBase {
  constructor(token: string, polling?: PollingConfiguration) {
    super(token, "testnet-pay.crypt.bot/api/", polling);
  }
}
