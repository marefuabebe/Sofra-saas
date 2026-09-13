import mongoose, { Schema, Document } from "mongoose";

export interface IAdminUser extends Document {
  email: string;
  password_hash: string;
  name?: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String },
    isSuperAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
