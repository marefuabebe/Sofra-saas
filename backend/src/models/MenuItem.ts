import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMenuItem extends Document {
  restaurantId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sizes?: { name: string; price: number }[];
  addons?: { name: string; price: number }[];
  tags?: string[];
  prepTimeMinutes?: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory" },
    name: { type: String, required: true },
    description: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sizes: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    tags: [{ type: String }],
    prepTimeMinutes: { type: Number },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

export default mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
