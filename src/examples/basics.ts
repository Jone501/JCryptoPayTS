import { CryptoApp, CryptoAppTest } from "../CryptoApp";
import { CreateCheckBuilder, CreateInvoiceBuilder, TransferBuilder } from "../types/Params";
import { ApiResponse, Check, Invoice, Transfer } from "../types/Types";

const mainnet = new CryptoApp("TOKEN"); // Клиент для работы с основной сетью
const testnet = new CryptoAppTest("TOKEN"); // Клиент для работы с тестовой сетью

// Создание счёта
const invoiceResponse: ApiResponse<Invoice> = await mainnet.createInvoice(
  new CreateInvoiceBuilder("RUB", 1399.99)
    .accepted_assets(["TON", "USDT", "BTC"])
    .paid_btn_url("https://rostics.ru")
    .paid_btn_name("callback")
    .description("Оплата заказа в Rostic's")
    .hidden_message("Приятного аппетита!")
);
if (invoiceResponse.ok) {
  const invoice: Invoice = invoiceResponse.result;
  console.log(`Invoice ${invoice.invoice_id} created!`);
} else {
  console.log(`Error on create invoice: ${invoiceResponse.error}`);
}

// Создание чека
const checkResponse: ApiResponse<Check> = await mainnet.createCheck(new CreateCheckBuilder("BTC", 0.001));
if (checkResponse.ok) {
  const check: Check = checkResponse.result;
  console.log(`Check ${check.check_id} created!`);
} else {
  console.log(`Error on create check: ${checkResponse.error}`);
}

// Инициация перевода
const transferResponse: ApiResponse<Transfer> = await mainnet.transfer(
  new TransferBuilder("USDT", 10, 1671756264, "SPEND_ID").comment("Чтоб до декабря вернул!")
);
if (transferResponse.ok) {
  const transfer: Transfer = transferResponse.result;
  console.log(`Transfer ${transfer.transfer_id} sent!`);
} else {
  console.log(`Error on sending transfer: ${transferResponse.error}`);
}
