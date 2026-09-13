import { Request } from "express";
import crypto from "crypto";
import axios from "axios";
import { IPaymentProvider, PaymentInitParams, PaymentInitResponse, PaymentVerificationResponse, WebhookParsedData } from "../IPaymentProvider";

export class ChapaProvider implements IPaymentProvider {
  private secretKey: string;
  private webhookSecret: string;
  private baseUrl = "https://api.chapa.co/v1";

  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY || "CHASECK_TEST_placeholder";
    this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || "webhook_placeholder";
  }

  public async initializePayment(params: PaymentInitParams): Promise<PaymentInitResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: params.amount,
          currency: params.currency,
          email: params.customerEmail || "customer@sofra.com",
          first_name: params.customerName || "Customer",
          last_name: "Sofra",
          phone_number: params.customerPhone,
          tx_ref: params.transactionReference,
          callback_url: params.returnUrl,
          return_url: params.returnUrl,
          customization: {
            title: "SOFRA Payment",
            description: "Payment for your order",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        return {
          success: true,
          checkoutUrl: response.data.data.checkout_url,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to initialize Chapa transaction",
      };
    } catch (error: any) {
      console.error("Chapa Initialize Error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to communicate with Chapa API",
      };
    }
  }

  public async verifyTransaction(transactionReference: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${transactionReference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const data = response.data.data;
      
      let status: "COMPLETED" | "FAILED" | "PENDING" = "PENDING";
      if (data.status === "success") status = "COMPLETED";
      if (data.status === "failed") status = "FAILED";

      return {
        success: response.data.status === "success",
        status,
        amount: parseFloat(data.amount),
        currency: data.currency,
        providerTransactionReference: data.reference,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Chapa Verify Error:", error.response?.data || error.message);
      return {
        success: false,
        status: "FAILED",
        amount: 0,
        currency: "ETB",
        message: error.response?.data?.message || "Failed to verify transaction",
      };
    }
  }

  public async handleWebhook(req: Request): Promise<WebhookParsedData> {
    const hash = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["chapa-signature"]) {
      throw new Error("Invalid Chapa webhook signature");
    }

    const event = req.body;

    let status: "COMPLETED" | "FAILED" | "PENDING" = "PENDING";
    if (event.status === "success") status = "COMPLETED";
    else if (event.status === "failed") status = "FAILED";

    return {
      success: true,
      transactionReference: event.tx_ref,
      status,
      amount: parseFloat(event.amount),
      currency: event.currency,
      rawEvent: event,
    };
  }
}
