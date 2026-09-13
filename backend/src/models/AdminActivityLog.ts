import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAdminActivityLog extends Document {
  action: string;
  category: "auth" | "system" | "security" | "management";
  adminId?: Types.ObjectId;
  adminName: string;
  adminRole: string;
  ip: string;
  status: "success" | "warning" | "failed";
  details?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AdminActivityLogSchema: Schema = new Schema(
  {
    action: { type: String, required: true },
    category: { type: String, enum: ["auth", "system", "security", "management"], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    adminName: { type: String, required: true },
    adminRole: { type: String, required: true },
    ip: { type: String, required: true },
    status: { type: String, enum: ["success", "warning", "failed"], required: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminActivityLog>("AdminActivityLog", AdminActivityLogSchema);
