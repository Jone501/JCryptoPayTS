import { CryptoAppBase } from "./CryptoApp";
import { Invoice, Error, Check } from "./types/Types";

export interface PollingConfiguration {
  period?: number;
  maxTrackerLifetime?: number;
}

/**
 * Класс, предоставляющий возможность быстрого создания трекеров для таких типов, как `Invoice` и `Check`
 */
export class PollingManager {
  constructor(private readonly client: CryptoAppBase, private readonly config: PollingConfiguration) {}

  /**
   * Создаёт и запускает трекер опроса для счёта
   *
   * @param invoice Счёт, который необходимо отслеживать
   * @param lifetime Время жизни трекера, по истечению которого, опрашивание прекратится
   * @returns Трекер опроса для счёта
   */
  trackInvoice(invoice: Invoice, lifetime?: number): InvoicePollingTracker {
    return new InvoicePollingTracker(this.client, this.config, invoice, lifetime);
  }

  /**
   * Создаёт и запускает трекер опроса для чека
   *
   * @param check Чек, который необходимо отслеживать
   * @param lifetime Время жизни трекера, по истечению которого, опрашивание прекратится
   * @returns Трекер опроса для чека
   */
  trackCheck(check: Check, lifetime?: number): CheckPollingTracker {
    return new CheckPollingTracker(this.client, this.config, check, lifetime);
  }
}

/**
 * Основа для реализации собственных трекеров опросов
 */
export abstract class PollingTracker<T> {
  protected handleTrackerDies: () => void = () => {};
  protected handleError: (error: Error) => boolean | void = () => {};
  private readonly task: NodeJS.Timeout;

  /**
   * Создаёт и запускает трекер опроса для данного объекта
   *
   * @param client Клиент вашего приложения
   * @param config Конфигурация опроса для данного трекера
   * @param obj Объект, который необходимо отслеживать
   * @param lifetime Время жизни трекера, по истечению которого, опрашивание прекратится
   */
  constructor(protected readonly client: CryptoAppBase, private readonly config: PollingConfiguration, obj: T, lifetime?: number) {
    const period: number = this.config.period ? this.config.period : 5000;
    const maxTrackerLifetime: number | undefined = this.config.maxTrackerLifetime;
    var time: number = 0;
    this.task = setInterval(async () => {
      time += period;
      if ((lifetime && time >= lifetime) || (maxTrackerLifetime && time >= maxTrackerLifetime)) {
        this.kill();
        this.handleTrackerDies();
      } else if (await this.test(obj)) {
        this.kill();
      }
    }, period);
  }

  /**
   * Выполняет необходимые запросы и проверки на основе данного объекта
   *
   * @param obj Объект, на основе которого совершаются проверки
   * @returns `true`, если обработку объекта данным трекером необходимо прекратить ({@link onTrackerDies} в таком случае не вызывается)
   */
  protected abstract test(obj: T): Promise<boolean>;

  /**
   * Задаёт обработчик смерти (истечения времени жизни) данного трекера
   *
   * @param handler Обработчик смерти трекера
   */
  onTrackerDies(handler: () => void): this {
    this.handleTrackerDies = handler;
    return this;
  }
  /**
   * Задаёт обработчик ошибок API, возникающих при отправке запросов
   *
   * Обработчик может возвращать `boolean` или `void`.
   * Если возвращает `true`, дальнейшая обработка объекта прекращается.
   * В противном случае трекер должен продолжить свою работу
   *
   * @param handler Обработчик ошибки API
   */
  onError(handler: (error: Error) => boolean | void): this {
    this.handleError = handler;
    return this;
  }
  /**
   * Принудительно останавливает работу трекера. {@link onTrackerDies} при этом не вызывается
   */
  kill() {
    clearInterval(this.task);
  }

  /**
   * Вспомогательный метод для вызова обработчика ошибок API
   *
   * @param error ошибка API, полученная при запросе
   * @returns `true`, если обработчик ошибки вернул `true` и трекер должен остановиться. В противном случае `false`
   */
  protected error(error: Error): boolean {
    const result = this.handleError(error);
    if (typeof result == "boolean") return result;
    return false;
  }
}

/**
 * Трекер опроса для счетов
 */
export class InvoicePollingTracker extends PollingTracker<Invoice> {
  protected handleInvoicePaid: (invoice: Invoice) => void = () => {};
  protected handleInvoiceExpired: (invoice: Invoice) => void = () => {};
  protected handleInvoiceDeleted: () => void = () => {};

  /**
   * Создаёт и запускает трекер опроса для счёта
   *
   * @param client Клиент вашего приложения
   * @param config Конфигурация опроса для данного трекера
   * @param invoice Счёт, который необходимо отслеживать
   * @param lifetime Время жизни трекера, по истечению которого, опрашивание прекратится
   */
  constructor(client: CryptoAppBase, config: PollingConfiguration, invoice: Invoice, lifetime?: number) {
    super(client, config, invoice, lifetime);
  }

  protected async test(obj: Invoice): Promise<boolean> {
    const response = await this.client.getInvoice(obj.invoice_id);
    if (response.ok) {
      const invoice = response.result;
      if (invoice == null) {
        this.handleInvoiceDeleted();
        return true;
      } else if (invoice.status == "paid") {
        this.handleInvoicePaid(invoice);
        return true;
      } else if (invoice.status == "expired") {
        this.handleInvoiceExpired(invoice);
        return true;
      }
    } else return this.error(response.error);
    return false;
  }

  /**
   * Задаёт обработчик оплаты счёта
   *
   * @param handler Обработчик оплаты счёта
   */
  onInvoicePaid(handler: (invoice: Invoice) => void): this {
    this.handleInvoicePaid = handler;
    return this;
  }
  /**
   * Задаёт обработчик истечения срока счёта
   *
   * @param handler Обработчик истечения срока счёта
   */
  onInvoiceExpired(handler: (invoice: Invoice) => void): this {
    this.handleInvoiceExpired = handler;
    return this;
  }
  /**
   * Задаёт обработчик удаления счёта
   *
   * @param handler Обработчик удаления счёта
   */
  onInvoiceDeleted(handler: () => void): this {
    this.handleInvoiceDeleted = handler;
    return this;
  }
}

/**
 * Трекер опроса для чеков
 */
export class CheckPollingTracker extends PollingTracker<Check> {
  protected handleCheckActivated: (check: Check) => void = () => {};
  protected handleCheckDeleted: () => void = () => {};

  /**
   * Создаёт и запускает трекер опроса для чека
   *
   * @param client Клиент вашего приложения
   * @param config Конфигурация опроса для данного трекера
   * @param check Чек, который необходимо отслеживать
   * @param lifetime Время жизни трекера, по истечению которого, опрашивание прекратится
   */
  constructor(client: CryptoAppBase, config: PollingConfiguration, check: Check, lifetime?: number) {
    super(client, config, check, lifetime);
  }

  protected async test(obj: Check): Promise<boolean> {
    const response = await this.client.getCheck(obj.check_id);
    if (response.ok) {
      const check = response.result;
      if (check == null) {
        this.handleCheckDeleted();
        return true;
      } else if (check.status == "activated") {
        this.handleCheckActivated(check);
        return true;
      }
    } else return this.error(response.error);
    return false;
  }

  /**
   * Задаёт обработчик активации чека
   *
   * @param handler Обработчик активации чека
   */
  onCheckActivated(handler: (check: Check) => void): this {
    this.handleCheckActivated = handler;
    return this;
  }
  /**
   * Задаёт обработчик удаления чека
   *
   * @param handler Обработчик удаления чека
   */
  onCheckDeleted(handler: () => void): this {
    this.handleCheckDeleted = handler;
    return this;
  }
}
