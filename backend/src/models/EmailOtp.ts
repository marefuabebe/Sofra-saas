import mongoose, { Schema, Document } from "mongoose";

export interface IEmailOtp extends Document {
  email: string;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailOtpSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "0s" }, // MongoDB TTL: auto-deletes document when current time passes expiresAt
    },
  },
  { timestamps: true }
);

export default mongoose.model<IEmailOtp>("EmailOtp", EmailOtpSchema);
