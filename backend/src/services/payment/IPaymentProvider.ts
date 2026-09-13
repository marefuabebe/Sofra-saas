import { Request } from "express";

export interface PaymentInitParams {
  transactionReference: string;
  amount: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl: string;
}

export interface PaymentInitResponse {
  success: boolean;
  checkoutUrl?: string;
  providerTransactionReference?: string;
  message?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: "COMPLETED" | "FAILED" | "PENDING";
  amount: number;
  currency: string;
  providerTransactionReference?: string;
  message?: string;
}

export interface WebhookParsedData {
  success: boolean;
  transactionReference: string; // The internal SOFRA reference returned back by the provider
  status: "COMPLETED" | "FAILED" | "PENDING";
  amount: number;
  currency: string;
  rawEvent?: any;
}

export interface IPaymentProvider {
  /**
   * Initializes a payment with the provider and returns a checkout URL or token.
   */
  initializePayment(params: PaymentInitParams): Promise<PaymentInitResponse>;

  /**
   * Securely polls the provider to verify the status of a specific transaction.
   */
  verifyTransaction(transactionReference: string): Promise<PaymentVerificationResponse>;

  /**
   * Parses, authenticates, and validates a webhook request from the provider.
   * Throws an error if the signature is invalid.
   */
  handleWebhook(req: Request): Promise<WebhookParsedData>;
}
