import { createHash, createHmac } from "crypto";
import { IncomingHttpHeaders } from "http";
import fastify from "fastify";
import express from "express";
import { Invoice, Webhook } from "./types/Types";

export abstract class WebhookHandler {
  private webhookHandler: (webhook: Webhook) => boolean | void = () => {};
  private invoicePaidHandler: (invoice: Invoice) => void = () => {};

  constructor(private readonly token: string) {}

  protected handleWebhook({ body, headers }: { body: any; headers: IncomingHttpHeaders }): boolean {
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

  onWebhook(handler: (webhook: Webhook) => boolean | void): this {
    this.webhookHandler = handler;
    return this;
  }

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

export class FastifyWebhookServer extends WebhookHandler {
  constructor(token: string, port: number = 3000, path: string = "/") {
    super(token);

    const app = fastify();
    app.post(path, async (req) => {
      return this.handleWebhook({
        body: req.body,
        headers: req.headers,
      });
    });
    app.listen({ port: port });
  }
}

export class ExpressWebhookServer extends WebhookHandler {
  constructor(token: string, port: number = 3000, path: string = "/") {
    super(token);

    const app = express();
    app.use(express.json());
    app.post(path, async (req) => {
      return this.handleWebhook({
        body: req.body,
        headers: req.headers,
      });
    });
    app.listen({ port: port });
  }
}
