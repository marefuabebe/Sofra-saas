import mongoose, { Schema, Document } from "mongoose";

export interface IRegistrationRequest extends Document {
  restaurantName: string;
  ownerName: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  restaurantType: string;
  heardFrom?: string;
  notes?: string;
  status: "pending" | "contacted" | "verified" | "rejected";
  contactedAt?: Date;
  rejectionReason?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationRequestSchema: Schema = new Schema(
  {
    restaurantName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    city: { type: String, required: true },
    address: { type: String },
    restaurantType: { type: String, required: true },
    heardFrom: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "contacted", "verified", "rejected"],
      default: "pending",
      required: true,
    },
    contactedAt: { type: Date },
    rejectionReason: { type: String },
    internalNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IRegistrationRequest>(
  "RegistrationRequest",
  RegistrationRequestSchema
);
