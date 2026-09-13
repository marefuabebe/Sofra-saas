import mongoose, { Document, Schema } from "mongoose";

export interface ISystemSettings extends Document {
  platformName: string;
  platformEmail: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  rowsPerPage: string;
  maintenance: boolean;
  maintenanceNotice?: string;
  commissionRate: number;
  taxRate?: number;
  payoutThreshold?: number;
  requireKycBeforeLive?: boolean;
  autoSlugRestaurants?: boolean;
  sessionTimeoutHours?: number;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    platformName: { type: String, default: "SOFRA" },
    platformEmail: { type: String, default: "support@sofra.com" },
    timezone: { type: String, default: "(GMT+03:00) East Africa Time (Ethiopia)" },
    dateFormat: { type: String, default: "DD MMM, YYYY" },
    currency: { type: String, default: "ETB (Br)" },
    rowsPerPage: { type: String, default: "10" },
    maintenance: { type: Boolean, default: false },
    maintenanceNotice: { type: String, default: "System upgrade in progress. Normal operations will resume shortly." },
    commissionRate: { type: Number, default: 5 },
    taxRate: { type: Number, default: 15 },
    payoutThreshold: { type: Number, default: 1000 },
    requireKycBeforeLive: { type: Boolean, default: true },
    autoSlugRestaurants: { type: Boolean, default: true },
    sessionTimeoutHours: { type: Number, default: 24 },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model<ISystemSettings>("SystemSettings", systemSettingsSchema);
