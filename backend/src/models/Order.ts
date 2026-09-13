import mongoose, { Schema, Document, Types } from "mongoose";
import Counter from "./Counter";
import crypto from "crypto";

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  basePrice: number;
  selectedSize?: { name: string; price: number };
  selectedAddons?: { name: string; price: number }[];
  itemTotal: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  restaurantId: Types.ObjectId;
  orderNumber: string;
  trackingToken: string;
  orderType: "qr" | "counter" | "phone" | "table";
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status:
    | "pending"
    | "accepted"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled"
    | "rejected";
  paymentMethod?: string;
  paymentStatus: "pending" | "paid" | "failed";
  paymentTransactionId?: string;
  customerNotes?: string;
  internalNotes?: string;
  acceptedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  basePrice: { type: Number, required: true, min: 0 },
  selectedSize: {
    name: { type: String },
    price: { type: Number, min: 0 },
  },
  selectedAddons: [
    {
      name: { type: String },
      price: { type: Number, min: 0 },
    },
  ],
  itemTotal: { type: Number, required: true, min: 0 },
  specialInstructions: { type: String },
});

const OrderSchema: Schema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    orderNumber: { type: String }, // Set by pre-save hook — unique per restaurant
    trackingToken: { type: String, unique: true, sparse: true, index: true }, // Secure random token for public tracking
    orderType: {
      type: String,
      enum: ["qr", "counter", "phone", "table"],
      required: true,
    },
    tableNumber: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
      required: true,
    },
    paymentMethod: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentTransactionId: { type: String },
    customerNotes: { type: String },
    internalNotes: { type: String },
    acceptedAt: { type: Date },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true }); // Unique per restaurant
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });

// Pre-save hook to generate order number and tracking token
OrderSchema.pre<IOrder>("save", async function () {
  if (this.isNew) {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");

    const counterId = `${this.restaurantId}_${dateStr}`;
    
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.orderNumber = `${dateStr}-${counter.seq.toString().padStart(3, "0")}`;
    
    // Generate secure random tracking token if not present
    if (!this.trackingToken) {
      this.trackingToken = crypto.randomBytes(32).toString('hex');
    }
  }
});

export default mongoose.model<IOrder>("Order", OrderSchema);
