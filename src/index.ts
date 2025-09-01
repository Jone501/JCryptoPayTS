import { CryptoApp, CryptoAppTest } from "./CryptoApp";
import { CreateInvoiceBuilder } from "./types/Params";

const mainnet = new CryptoApp("TOKEN");
const testnet = new CryptoAppTest("TOKEN", { period: 1000 }); // Периодичность опросов (по умолчанию раз в 5 секунд)

console.log((await testnet.getMe()).result?.name);

const invoice = (
  await testnet.createInvoice(
    new CreateInvoiceBuilder("USD", 10)
      .accepted_assets(["TON", "USDT", "BTC"]) // Больше никаких separated comma, всё по человечески
      .expires_in(3600000)
      .paid_btn_name("callback")
      .paid_btn_url(new URL("https://example.com")) // Или просто "https://example.com"
  )
).result;

if (invoice) {
  testnet.polling
    .trackInvoice(invoice, 10000) // Создаётся трекер опроса для счёта на 10 секунд (не указано время = бесконечно)
    .onInvoicePaid(
      (inv) => console.log(`Invoice ${inv.invoice_id} paid!`) // Если счёт оплачен
    )
    .onInvoiceExpired(
      (inv) => console.log(`Invoice ${inv.invoice_id} expired!`) // Если счёт просрочен
    )
    .onTrackEnds(
      () => console.log(`Tracker of invoice ${invoice.invoice_id} dies :(`) // Если время жизни трекера вышло
    );
}
testnet.deleteAllInvoices(); // Удаляет все счета
