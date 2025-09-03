import { createHash, createHmac } from "crypto";
import { IncomingHttpHeaders } from "http";
import fastify, { FastifyInstance } from "fastify";
import { Invoice, Webhook } from "./types/Types";

/**
 * Абстрактная основа обработчика вебхуков
 */
export abstract class WebhookHandler {
  private webhookHandler: (webhook: Webhook) => boolean | void = () => {};
  private invoicePaidHandler: (invoice: Invoice) => void = () => {};

  /**
   * @param token Токен приложения
   */
  constructor(private readonly token: string) {}

  /**
   * Обрабатывает запрос, содержащий вебхук
   *
   * @param body Тело запроса
   * @param headers Заголовки запроса
   * @returns `true`, если вебхук был полностью обработан
   */
  protected handleWebhook(body: any, headers: IncomingHttpHeaders): boolean {
    if (!this.checkSignature({ body: body, headers: headers })) return false;
    if (!this.isWebhook(body)) return false;
    if (!this.processWebhook(body)) return false;
    if (body.update_type == "invoice_paid") this.invoicePaidHandler(body.payload);
    return true;
  }

  private processWebhook(webhook: Webhook): boolean {
    const result = this.webhookHandler(webhook);
    if (typeof result == "boolean") return result;
    return true;
  }

  private isWebhook(obj: any): obj is Webhook {
    return typeof obj == "object" && obj != null && "update_id" in obj && "update_type" in obj && "request_date" in obj && "payload" in obj;
  }

  /**
   * Задаёт предварительный обработчик всех поступающих вебхуков
   *
   * Обработчик может возвращать `boolean` или `void`.
   * Если возвращает `false`, дальнейшая обработка вебхуков отменяется.
   * В противном случае вебхук обрабатывается дальше
   *
   * @param handler Обработчик вебхуков
   */
  onWebhook(handler: (webhook: Webhook) => boolean | void): this {
    this.webhookHandler = handler;
    return this;
  }

  /**
   * Задаёт обработчик счетов из вебхуков
   *
   * Обрабатываются только вебхуки, прошедшие фильтрацию обработчиком {@link onWebhook}
   *
   * @param handler Обработчик счетов
   */
  onInvoicePaid(handler: (invoice: Invoice) => void): this {
    this.invoicePaidHandler = handler;
    return this;
  }

  private checkSignature({ body, headers }: { body: any; headers: IncomingHttpHeaders }): boolean {
    const secret = createHash("sha256").update(this.token).digest();
    const checkString = JSON.stringify(body);
    const hmac = createHmac("sha256", secret).update(checkString).digest("hex");
    return hmac == headers["crypto-pay-api-signature"];
  }
}

/**
 * Сервер для получения и обработки вебхуков
 */
export class WebhookServer extends WebhookHandler {
  private readonly app: FastifyInstance;

  /**
   * Создаёт и запускает сервер для обработки вебхуков
   *
   * @param token Токен приложения
   * @param port Порт сервера
   * @param path Путь для принятия вебхуков
   */
  constructor(token: string, port: number = 3000, path: string = "/") {
    super(token);

    this.app = fastify();
    this.app.post(path, async (req) => {
      return this.handleWebhook(req.body, req.headers);
    });
    this.app.listen({ port: port });
  }

  /**
   * Отключает сервер
   */
  close() {
    this.app.close();
  }
}
