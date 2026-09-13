import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVerificationDocument extends Document {
  restaurantId: Types.ObjectId;
  documentType: "BUSINESS_LICENSE" | "FOOD_SERVICE_LICENSE" | "OWNER_ID" | "BUSINESS_REGISTRATION" | "OTHER";
  fileUrl: string;
  originalName: string;
  mimeType: string;
  status: "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  adminComment?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationDocumentSchema: Schema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    documentType: {
      type: String,
      enum: ["BUSINESS_LICENSE", "FOOD_SERVICE_LICENSE", "OWNER_ID", "BUSINESS_REGISTRATION", "OTHER"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ["UPLOADED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CHANGES_REQUESTED"],
      default: "UPLOADED",
      required: true,
    },
    adminComment: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IVerificationDocument>("VerificationDocument", VerificationDocumentSchema);
