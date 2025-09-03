import { CryptoApp } from "../CryptoApp";
import { CheckPollingTracker, InvoicePollingTracker, PollingConfiguration } from "../Polling";
import { CreateCheckBuilder, CreateInvoiceBuilder } from "../types/Params";
import { Check, Invoice } from "../types/Types";

// Конфигурация опросов
const pollingConfig: PollingConfiguration = {
  period: 3000, // Периодичность опросов в миллисекундах (по умолчанию 5000)
  maxTrackerLifetime: 360000, // Максимальное время жизни каждого трекера опросов (по умолчанию бесконечность)
};

const client = new CryptoApp("TOKEN", pollingConfig);

const invoice: Invoice = (await client.createInvoice(new CreateInvoiceBuilder("TON", 100))).result;
const invoiceTracker: InvoicePollingTracker = client.polling
  .trackInvoice(invoice) // Запускаем трекер для опросов данного счёта и задаём обработчики
  .onError((error) => console.log(`[Polling] Error on getting invoice ${invoice.invoice_id}: ${error.name}`))
  .onTrackerDies(() => console.log(`[Polling] Tracker of invoice ${invoice.invoice_id} died`))
  .onInvoicePaid((invoice) => console.log(`[Polling] Invoice ${invoice.invoice_id} paid`))
  .onInvoiceExpired((invoice) => console.log(`[Polling] Invoice ${invoice.invoice_id} expired`))
  .onInvoiceDeleted(() => console.log(`[Polling] Invoice ${invoice.invoice_id} deleted`));

const check: Check = (await client.createCheck(new CreateCheckBuilder("TON", 100))).result;
const checkTracker: CheckPollingTracker = client.polling
  .trackCheck(check, 60000) // Запускаем трекер, продолжительность жизни которого - 1 минута, для опросов данного чека и задаём обработчики
  .onError((error) => console.log(`[Polling] Error on getting check ${check.check_id}: ${error.name}`))
  .onTrackerDies(() => console.log(`[Polling] Tracker of check ${check.check_id} died`))
  .onCheckActivated((check) => console.log(`[Polling] Check ${check.check_id} activated`))
  .onCheckDeleted(() => console.log(`[Polling] Check ${check.check_id} deleted`));
