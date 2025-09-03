import { CryptoApp } from "./CryptoApp";
import { Invoice, Error, Check } from "./types/Types";

export interface PollingConfiguration {
  period?: number;
  maxTrackerLifetime?: number;
}

export class PollingManager {
  constructor(private readonly client: CryptoApp, private readonly config: PollingConfiguration) {}

  trackInvoice(invoice: Invoice, lifetime?: number): InvoicePollingTracker {
    return new InvoicePollingTracker(this.client, this.config, invoice, lifetime);
  }

  trackCheck(check: Check, lifetime?: number): CheckPollingTracker {
    return new CheckPollingTracker(this.client, this.config, check, lifetime);
  }
}

export abstract class PollingTracker<T> {
  protected handleTrackerDies: () => void = () => {};
  protected handleError: (error: Error) => boolean | void = () => {};
  private readonly task: NodeJS.Timeout;

  constructor(protected readonly client: CryptoApp, private readonly config: PollingConfiguration, obj: T, lifetime?: number) {
    const period: number = this.config.period ? this.config.period : 5000;
    const maxTrackerLifetime: number | undefined = this.config.maxTrackerLifetime;
    var time: number = 0;
    this.task = setInterval(async () => {
      time += period;
      if ((lifetime && time >= lifetime) || (maxTrackerLifetime && time >= maxTrackerLifetime)) {
        this.kill();
      } else if (await this.test(obj)) {
        clearInterval(this.task);
      }
    }, period);
  }

  protected abstract test(obj: T): Promise<boolean>;

  onTrackerDies(handler: () => void): this {
    this.handleTrackerDies = handler;
    return this;
  }
  onError(handler: (error: Error) => boolean | void): this {
    this.handleError = handler;
    return this;
  }
  kill() {
    this.handleTrackerDies();
    clearInterval(this.task);
  }

  protected error(error: Error): boolean {
    const result = this.handleError(error);
    if (typeof result == "boolean") return result;
    return false;
  }
}

export class InvoicePollingTracker extends PollingTracker<Invoice> {
  protected handleInvoicePaid: (invoice: Invoice) => void = () => {};
  protected handleInvoiceExpired: (invoice: Invoice) => void = () => {};
  protected handleInvoiceDeleted: () => void = () => {};

  constructor(client: CryptoApp, config: PollingConfiguration, invoice: Invoice, lifetime?: number) {
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

  onInvoicePaid(handler: (invoice: Invoice) => void): this {
    this.handleInvoicePaid = handler;
    return this;
  }
  onInvoiceExpired(handler: (invoice: Invoice) => void): this {
    this.handleInvoiceExpired = handler;
    return this;
  }
  onInvoiceDeleted(handler: () => void): this {
    this.handleInvoiceDeleted = handler;
    return this;
  }
}

export class CheckPollingTracker extends PollingTracker<Check> {
  protected handleCheckActivated: (check: Check) => void = () => {};
  protected handleCheckDeleted: () => void = () => {};

  constructor(client: CryptoApp, config: PollingConfiguration, check: Check, lifetime?: number) {
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

  onCheckActivated(handler: (check: Check) => void): this {
    this.handleCheckActivated = handler;
    return this;
  }
  onCheckDeleted(handler: () => void): this {
    this.handleCheckDeleted = handler;
    return this;
  }
}
