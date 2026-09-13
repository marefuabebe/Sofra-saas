import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  restaurantId: Types.ObjectId;
  email: string;
  password_hash: string;
  tempPassword: boolean;
  role: "owner" | "staff";
  isActive: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    tempPassword: { type: Boolean, default: true },
    role: { type: String, enum: ["owner", "staff"], default: "owner", required: true },
    isActive: { type: Boolean, default: true, required: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
