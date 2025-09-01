import { CryptoApp, CryptoAppTest } from "./CryptoApp";
import { CreateInvoiceBuilder } from "./types/Params";
import { FastifyWebhookServer } from "./Webhooks";

const mainnet = new CryptoApp("TOKEN");
const testnet = new CryptoAppTest("TOKEN", { period: 3000 }); // Периодичность опросов (по умолчанию раз в 5 секунд)

const invoice = (
  await testnet.createInvoice(
    new CreateInvoiceBuilder("USD", 10)
      .accepted_assets(["TON", "USDT", "BTC"]) // Больше никаких separated comma, всё по человечески
      .paid_btn_name("callback")
      .paid_btn_url(new URL("https://example.com")) // Или просто "https://example.com"
  )
).result;
console.log(invoice.mini_app_invoice_url.href);

if (invoice) {
  testnet.polling
    .trackInvoice(invoice) // Создаётся трекер опроса для счёта на 10 секунд (не указано время = бесконечно)
    .onInvoicePaid(
      (inv) => console.log(`[Polling] Invoice ${inv.invoice_id} paid!`) // Если счёт оплачен
    )
    .onInvoiceExpired(
      (inv) => console.log(`[Polling] Invoice ${inv.invoice_id} expired!`) // Если счёт просрочен
    )
    .onTrackEnds(
      () => console.log(`[Polling] Tracker of invoice ${invoice.invoice_id} dies :(`) // Если время жизни трекера вышло
    );
}

const webhookHandler = new FastifyWebhookServer(testnet.token).onInvoicePaid((inv) => {
  console.log(`[Webhook] Invoice ${inv.invoice_id} paid!`);
});
