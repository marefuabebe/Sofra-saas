import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubscription extends Document {
  restaurantId: Types.ObjectId;
  plan: "free_trial" | "starter" | "pro" | "enterprise";
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  billingCycle: "MONTHLY" | "ANNUALLY";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  gracePeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, unique: true },
    plan: {
      type: String,
      enum: ["free_trial", "starter", "pro", "enterprise"],
      required: true,
    },
    status: {
      type: String,
      enum: ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"],
      default: "TRIAL",
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "ANNUALLY"],
      default: "MONTHLY",
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date }, // Important for grace periods and trial ends
    gracePeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
