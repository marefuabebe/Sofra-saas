import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMenuCategory extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuCategorySchema: Schema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: "🍽️" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuCategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export default mongoose.model<IMenuCategory>("MenuCategory", MenuCategorySchema);
