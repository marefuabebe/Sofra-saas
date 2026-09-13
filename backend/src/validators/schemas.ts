import { z } from "zod";

// Auth
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

// Registration
export const registerSchema = z.object({
  body: z.object({
    restaurantName: z.string().min(2),
    ownerName: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email(),
    city: z.string().optional(),
    restaurantType: z.string().optional(),
    address: z.string().optional(),
    password: z.string().min(6).optional(),
    heardFrom: z.string().optional(),
    notes: z.string().optional(),
    otp: z.string().length(6).optional(),
    isGoogleSignup: z.boolean().optional(),
  }),
});

// Admin Approval
export const approveRequestSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  }),
  body: z.object({
    email: z.string().email(),
    subscriptionPlan: z.enum(["free_trial", "starter", "pro", "enterprise"]),
    internalNotes: z.string().optional(),
  }),
});

// Menu Item
export const menuItemSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    basePrice: z.number().min(0).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
    imageUrl: z.string().optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    prepTimeMinutes: z.number().min(0).optional(),
    displayOrder: z.number().optional(),
    sizes: z.array(
      z.object({
        name: z.string(),
        price: z.number().min(0),
      })
    ).optional(),
    addons: z.array(
      z.object({
        name: z.string(),
        price: z.number().min(0),
      })
    ).optional(),
    dietary: z.array(z.string()).optional(),
  }),
});

// Order Creation
export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    orderType: z.enum(["qr", "counter", "phone", "table"]),
    tableNumber: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerNotes: z.string().optional(),
    items: z.array(
      z.object({
        menuItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
        quantity: z.number().min(1),
        selectedSize: z.object({
          name: z.string(),
        }).optional(),
        selectedAddons: z.array(
          z.object({
            name: z.string(),
          })
        ).optional(),
        specialInstructions: z.string().optional(),
      })
    ).min(1),
  }),
});

// Order Status Update
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  }),
  body: z.object({
    status: z.enum(["pending", "accepted", "preparing", "ready", "completed", "cancelled", "rejected"]),
    paymentData: z.object({
      paymentMethod: z.string().optional(),
      transactionId: z.string().optional(),
    }).optional(),
  }),
});
