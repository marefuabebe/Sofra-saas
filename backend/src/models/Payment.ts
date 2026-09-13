import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  amount: number;
  currency: string;
  provider: "CASH" | "CHAPA" | "TELEBIRR" | "STRIPE";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionReference: string; // Internal SOFRA secure reference
  providerTransactionReference?: string; // External provider reference
  providerMetadata?: any; // Raw webhook or response data
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB", required: true },
    provider: {
      type: String,
      enum: ["CASH", "CHAPA", "TELEBIRR", "STRIPE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true, // Securely generated SOFRA ID (e.g. crypto.randomUUID or cryptographically secure string)
    },
    providerTransactionReference: {
      type: String,
      // IMPORTANT: DO NOT CREATE A GLOBAL UNIQUE INDEX THAT ENFORCES UNIQUE NULLS.
      // We use a sparse unique index here. It will only enforce uniqueness if the field actually exists.
      sparse: true,
      unique: true, 
    },
    providerMetadata: { type: Schema.Types.Mixed },
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);
