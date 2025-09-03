import { CryptoApp } from "../CryptoApp";
import { WebhookServer as WebhookServer } from "../Webhooks";

const client = new CryptoApp("TOKEN");

// Обработчик поступающих вебхуков
const webhookHandler = new WebhookServer(client.token)
  .onWebhook((webhook) => console.log(`[Webhook] Webhook received: ${webhook.update_id}`))
  .onInvoicePaid((invoice) => console.log(`[Webhook] Invoice ${invoice.invoice_id} paid`));

// Обработчик поступающих вебхуков (с фильтрацией)
const filteredWebhookHandler = new WebhookServer(client.token, 5555, "/webhooks") // Можно указать порт и путь для прослушивания
  .onWebhook((webhook) => webhook.request_date.getFullYear() == 2025) // Обрабатываются только вебхуки за 2025 год
  .onInvoicePaid((invoice) => console.log(`[Webhook] Invoice ${invoice.invoice_id} paid in 2025`));
