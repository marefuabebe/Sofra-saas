import mongoose from "mongoose";
import RegistrationRequest from "../models/RegistrationRequest";
import Restaurant from "../models/Restaurant";
import Subscription from "../models/Subscription";
import User from "../models/User";
import bcrypt from "bcrypt";

// Utility to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// Utility to generate a random temp password
const generateTempPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createRestaurantAccountService = async (
  requestId: string,
  data: { email: string; subscriptionPlan: string; internalNotes?: string }
) => {
  const useTransactions = process.env.MONGODB_TRANSACTIONS === "true";
  let session = null;

  if (useTransactions) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const request = session 
      ? await RegistrationRequest.findById(requestId).session(session)
      : await RegistrationRequest.findById(requestId);
      
    if (!request) throw new Error("Registration request not found");
    if (request.status !== "pending" && request.status !== "contacted") {
      throw new Error("Request has already been processed");
    }

    let slug = generateSlug(request.restaurantName);
    // Ensure slug is unique
    let slugExists = session
      ? await Restaurant.findOne({ slug }).session(session)
      : await Restaurant.findOne({ slug });
      
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(request.restaurantName)}-${counter}`;
      slugExists = session
        ? await Restaurant.findOne({ slug }).session(session)
        : await Restaurant.findOne({ slug });
      counter++;
    }

    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const newRestaurant = new Restaurant({
      registrationRequestId: request._id,
      name: request.restaurantName,
      slug,
      ownerName: request.ownerName,
      phone: request.phone,
      email: data.email,
      city: request.city,
      address: request.address,
      restaurantType: request.restaurantType,
      subscriptionPlan: data.subscriptionPlan,
      status: "inactive",
      verificationStatus: "DOCUMENTS_REQUIRED",
      isActive: false,
    });

    const savedRestaurant = session
      ? await newRestaurant.save({ session })
      : await newRestaurant.save();

    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago, making it explicitly expired until they pay
    const newSubscription = new Subscription({
      restaurantId: savedRestaurant._id,
      plan: data.subscriptionPlan || "pro",
      status: "EXPIRED",
      billingCycle: "MONTHLY",
      currentPeriodStart: past,
      currentPeriodEnd: past,
      cancelAtPeriodEnd: false
    });
    
    if (session) {
      await newSubscription.save({ session });
    } else {
      await newSubscription.save();
    }

    const newUser = new User({
      restaurantId: savedRestaurant._id,
      email: data.email,
      password_hash,
      tempPassword: true,
      role: "owner",
      isActive: true,
    });

    if (session) {
      await newUser.save({ session });
    } else {
      await newUser.save();
    }

    request.status = "verified";
    request.contactedAt = new Date();
    if (data.internalNotes) request.internalNotes = data.internalNotes;
    
    if (session) {
      await request.save({ session });
      await session.commitTransaction();
      session.endSession();
    } else {
      await request.save();
    }

    return {
      success: true,
      restaurant: savedRestaurant,
      credentials: { email: data.email, password: tempPassword },
    };
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};
