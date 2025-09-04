import axios, { AxiosInstance } from "axios";
import { PollingConfiguration, PollingManager } from "./Polling";
import { ApiResponse, AppInfo, AppStats, CryptoAsset, Balance, Check, Currency, ExchangeRate, Invoice, ResponseList, Transfer } from "./types/Types";
import {
  CreateCheckBuilder,
  CreateInvoiceBuilder,
  GetChecksBuilder,
  GetInvoicesBuilder,
  GetStatsBuilder,
  GetTransfersBuilder,
  TransferBuilder,
} from "./types/Params";

export abstract class CryptoAppBase {
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
      headers: {
        "Content-Type": params && "application/json",
      },
    });
    return response.data as ApiResponse<T>;
  }

  /**
   * Запрашивает основную информацию о приложении
   *
   * @returns Основная информация о приложении
   */
  async getMe(): Promise<ApiResponse<AppInfo>> {
    return await this.request("getMe");
  }

  /**
   * Создаёт счёт
   *
   * @param builder Билдер параметров
   * @returns Созданный счёт
   */
  async createInvoice(builder: CreateInvoiceBuilder): Promise<ApiResponse<Invoice>> {
    return await this.request("createInvoice", builder.build());
  }

  /**
   * Удаляет счёт
   *
   * @param id ID счёта, который необходимо удалить
   * @returns `true`, если счёт успешно удалён
   */
  async deleteInvoice(id: number): Promise<ApiResponse<boolean>> {
    return await this.request("deleteInvoice", { invoice_id: id });
  }

  /**
   * Создаёт чек
   *
   * @param builder Билдер параметров
   * @returns Созданный чек
   */
  async createCheck(builder: CreateCheckBuilder): Promise<ApiResponse<Check>> {
    return await this.request("createCheck", builder.build());
  }

  /**
   * Удаляет чек
   *
   * @param id ID чека, который необходимо удалить
   * @returns `true`, если чек успешно удалён
   */
  async deleteCheck(id: number): Promise<ApiResponse<boolean>> {
    return await this.request("deleteCheck", { check_id: id });
  }

  /**
   * Инициирует перевод
   *
   * @param builder Билдер параметров
   * @returns Совершённый перевод
   */
  async transfer(builder: TransferBuilder): Promise<ApiResponse<Transfer>> {
    return await this.request("transfer", builder.build());
  }

  /**
   * Запрашивает список счетов, соответствующих переданным параметрам
   *
   * @param builder Билдер параметров
   * @returns Список счетов
   */
  async getInvoices(builder?: GetInvoicesBuilder): Promise<ApiResponse<ResponseList<Invoice>>> {
    return await this.request("getInvoices", builder?.build());
  }

  /**
   * Запрашивает список переводов, соответствующих переданным параметрам
   *
   * @param builder Билдер параметров
   * @returns Список переводов
   */
  async getTransfers(builder?: GetTransfersBuilder): Promise<ApiResponse<ResponseList<Transfer>>> {
    return await this.request("getTransfers", builder?.build());
  }

  /**
   * Запрашивает список чеков, соответствующих переданным параметрам
   *
   * @param builder Билдер параметров
   * @returns Список чеков
   */
  async getChecks(builder?: GetChecksBuilder): Promise<ApiResponse<ResponseList<Check>>> {
    return await this.request("getChecks", builder?.build());
  }

  /**
   * Запрашивает список балансов вашего приложения
   *
   * @returns Список балансов вашего приложения
   */
  async getBalance(): Promise<ApiResponse<Balance[]>> {
    return await this.request("getBalance");
  }

  /**
   * Запрашивает список актуальных курсов валют
   *
   * @returns Список актуальных курсов валют
   */
  async getExchangeRates(): Promise<ApiResponse<ExchangeRate[]>> {
    return await this.request("getExchangeRates");
  }

  /**
   * Запрашивает список актуальных валют
   *
   * @returns Список актуальных валют
   */
  async getCurrencies(): Promise<ApiResponse<Currency[]>> {
    return await this.request("getCurrencies");
  }

  /**
   * Запрашивает статистику вашего приложения
   *
   * @param builder Билдер параметров
   * @returns Статистику вашего приложения
   */
  async getStats(builder?: GetStatsBuilder): Promise<ApiResponse<AppStats>> {
    return await this.request("getStats", builder?.build());
  }

  /**
   * Удаляет счета с указанными ID
   *
   * @param ids Список ID счетов, которые необходимо удалить
   */
  async deleteInvoices(ids: number[]) {
    ids.forEach((id) => this.deleteInvoice(id));
  }

  /**
   * Удаляет ВСЕ счета!
   */
  async deleteAllInvoices() {
    const ids = (await this.getInvoices(new GetInvoicesBuilder().count(1000))).result?.items?.map((x) => x.invoice_id);
    if (ids) this.deleteInvoices(ids);
  }

  /**
   * Удаляет чеки с указанными ID
   *
   * @param ids Список ID счетов, которые необходимо удалить
   */
  async deleteChecks(ids: number[]) {
    ids.forEach((id) => this.deleteCheck(id));
  }

  /**
   * Удаляет ВСЕ чеки!
   */
  async deleteAllChecks() {
    const ids = (await this.getChecks(new GetChecksBuilder().count(1000))).result?.items?.map((x) => x.check_id);
    if (ids) this.deleteChecks(ids);
  }

  /**
   * Запрашивает счёт с данным ID
   *
   * @param id ID счета
   * @returns Полученный счёт или `null`, если счёт с данным ID не найден
   */
  async getInvoice(id: number): Promise<ApiResponse<Invoice | null>> {
    const response = await this.getInvoices(new GetInvoicesBuilder().invoice_ids([id]));
    const value = response.result?.items[0];
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  /**
   * Запрашивает перевод с данным ID
   *
   * @param id ID перевода
   * @returns Полученный перевод или `null`, если перевод с данным ID не найден
   */
  async getTransfer(id: number): Promise<ApiResponse<Transfer | null>> {
    const response = await this.getTransfers(new GetTransfersBuilder().transfer_ids([id]));
    const value = response.result?.items[0];
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  /**
   * Запрашивает чек с данным ID
   *
   * @param id ID чека
   * @returns Полученный чек или `null`, если чек с данным ID не найден
   */
  async getCheck(id: number): Promise<ApiResponse<Check | null>> {
    const response = await this.getChecks(new GetChecksBuilder().check_ids([id]));
    const value = response.result?.items[0];
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  /**
   * Запрашивает баланс вашего приложения, соответствующий данному активу
   *
   * @param asset Актив, баланс которого необходимо получить
   * @returns Баланс вашего приложения, соответствующий данному активу, или `null`, если баланс, соответствующий данному активу, не найден
   */
  async getAssetBalance(asset: CryptoAsset): Promise<ApiResponse<Balance | null>> {
    const response = await this.getBalance();
    const value = response.result?.find((x) => x.currency_code == asset);
    return {
      ok: response.ok,
      result: response.ok && value ? value : null,
      error: response.error,
    };
  }

  /**
   * Запрашивает информацию о валюте, соответствующей данному буквенному коду
   *
   * @param code Буквенный код валюты
   * @returns Информация о валюте или `null`, если валюта с данным буквенным кодом не найдена
   */
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

/**
 * Клиент для работы с основной сетью CryptoPay
 */
export class CryptoApp extends CryptoAppBase {
  /**
   * Создаёт клиент для работы с основной сетью CryptoPay
   *
   * @param token Токен вашего приложения
   * @param polling Конфигурация опросов
   */
  constructor(token: string, polling?: PollingConfiguration) {
    super(token, "pay.crypt.bot/api/", polling);
  }
}

/**
 * Клиент для работы с тестовой сетью CryptoPay
 */
export class CryptoAppTest extends CryptoAppBase {
  /**
   * Создаёт клиент для работы с тестовой сетью CryptoPay
   *
   * @param token Токен вашего приложения
   * @param polling Конфигурация опросов
   */
  constructor(token: string, polling?: PollingConfiguration) {
    super(token, "testnet-pay.crypt.bot/api/", polling);
  }
}
