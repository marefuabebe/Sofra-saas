import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubscriptionPayment extends Document {
  subscriptionId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  amount: number;
  currency: string;
  provider: "CHAPA" | "TELEBIRR" | "STRIPE" | "BANK_TRANSFER"; // Includes manual methods
  status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED" | "CANCELLED";
  transactionReference: string; // Internal SOFRA secure reference
  providerTransactionReference?: string; // External provider reference
  providerMetadata?: any;
  targetPlan?: string; // e.g. starter, pro, enterprise
  targetBillingCycle?: string; // MONTHLY, ANNUALLY
  failureReason?: string;
  invoicePeriodStart?: Date;
  invoicePeriodEnd?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPaymentSchema: Schema = new Schema(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB", required: true },
    provider: {
      type: String,
      enum: ["CHAPA", "TELEBIRR", "STRIPE", "BANK_TRANSFER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "EXPIRED", "CANCELLED"],
      default: "PENDING",
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true, 
    },
    providerTransactionReference: {
      type: String,
      sparse: true,
      unique: true, 
    },
    providerMetadata: { type: Schema.Types.Mixed },
    targetPlan: { type: String },
    targetBillingCycle: { type: String },
    failureReason: { type: String },
    invoicePeriodStart: { type: Date },
    invoicePeriodEnd: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriptionPayment>("SubscriptionPayment", SubscriptionPaymentSchema);
