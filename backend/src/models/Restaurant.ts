import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRestaurant extends Document {
  registrationRequestId?: Types.ObjectId;
  name: string;
  slug: string;
  ownerName?: string;
  phone: string;
  email: string;
  city?: string;
  address?: string;
  description?: string;
  restaurantType?: string;
  logoUrl?: string;
  coverUrl?: string;
  qrCodeUrl?: string;
  aboutUs?: {
    text: string;
    imageUrl?: string;
  };
  culinaryTeam?: Array<{
    name: string;
    role: string;
    imageUrl?: string;
  }>;
  businessHours?: {
    monday: { isOpen: boolean; openTime: string; closeTime: string };
    tuesday: { isOpen: boolean; openTime: string; closeTime: string };
    wednesday: { isOpen: boolean; openTime: string; closeTime: string };
    thursday: { isOpen: boolean; openTime: string; closeTime: string };
    friday: { isOpen: boolean; openTime: string; closeTime: string };
    saturday: { isOpen: boolean; openTime: string; closeTime: string };
    sunday: { isOpen: boolean; openTime: string; closeTime: string };
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
    website?: string;
    googleMaps?: string;
  };
  theme?: {
    brandColor: string;
    layoutStyle: "list" | "grid";
  };
  taxRate?: number;
  acceptedPaymentMethods?: string[];
  subscriptionPlan: "free_trial" | "starter" | "pro" | "enterprise";
  status: "active" | "blocked" | "trial" | "inactive";
  verificationStatus: "DOCUMENTS_REQUIRED" | "PENDING_VERIFICATION" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  isActive: boolean;
  internalNotes?: string;
  blockReason?: string;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema: Schema = new Schema(
  {
    registrationRequestId: { type: Schema.Types.ObjectId, ref: "RegistrationRequest" },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerName: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String },
    address: { type: String },
    description: { type: String },
    restaurantType: { type: String },
    logoUrl: { type: String },
    coverUrl: { type: String },
    qrCodeUrl: { type: String },
    aboutUs: {
      type: {
        text: { type: String, default: "" },
        imageUrl: { type: String }
      }
    },
    culinaryTeam: [{
      name: { type: String, required: true },
      role: { type: String, required: true },
      imageUrl: { type: String },
      bio: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String }
    }],
    businessHours: {
      type: {
        monday: { isOpen: Boolean, openTime: String, closeTime: String },
        tuesday: { isOpen: Boolean, openTime: String, closeTime: String },
        wednesday: { isOpen: Boolean, openTime: String, closeTime: String },
        thursday: { isOpen: Boolean, openTime: String, closeTime: String },
        friday: { isOpen: Boolean, openTime: String, closeTime: String },
        saturday: { isOpen: Boolean, openTime: String, closeTime: String },
        sunday: { isOpen: Boolean, openTime: String, closeTime: String },
      },
      default: {
        monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        friday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        saturday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        sunday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
      }
    },
    socialLinks: {
      type: {
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String },
        linkedin: { type: String },
        tiktok: { type: String },
        telegram: { type: String },
        website: { type: String },
        googleMaps: { type: String },
      }
    },
    theme: {
      type: {
        brandColor: { type: String, default: "#ff6b00" },
        layoutStyle: { type: String, enum: ["list", "grid"], default: "list" }
      },
      default: { brandColor: "#ff6b00", layoutStyle: "list" }
    },
    taxRate: { type: Number, default: 0 },
    acceptedPaymentMethods: { type: [String], default: ["cash"] },
    subscriptionPlan: {
      type: String,
      enum: ["free_trial", "starter", "pro", "enterprise"],
      default: "free_trial",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "trial", "inactive"],
      default: "inactive",
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["DOCUMENTS_REQUIRED", "PENDING_VERIFICATION", "UNDER_REVIEW", "APPROVED", "REJECTED", "CHANGES_REQUESTED"],
      default: "DOCUMENTS_REQUIRED",
      required: true,
    },
    isActive: { type: Boolean, default: false, required: true },
    internalNotes: { type: String },
    blockReason: { type: String },
    trialEndsAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);
