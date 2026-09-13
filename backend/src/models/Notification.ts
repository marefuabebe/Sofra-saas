import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  recipientType: "ADMIN" | "RESTAURANT" | "CUSTOMER";
  recipientId: string; // admin user id, restaurant id, or order id
  restaurantId?: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  entityType?: "ORDER" | "VERIFICATION" | "RESTAURANT" | "GENERAL";
  entityId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientType: {
      type: String,
      enum: ["ADMIN", "RESTAURANT", "CUSTOMER"],
      required: true,
    },
    recipientId: { type: String, required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["ORDER", "VERIFICATION", "RESTAURANT", "GENERAL"],
    },
    entityId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for fast querying by recipient
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
