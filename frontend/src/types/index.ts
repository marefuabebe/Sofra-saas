// Application & Domain Types for SOFRA

export interface RegistrationRequest {
  id: string;
  restaurant_name: string;
  owner_name: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  restaurant_type: string;
  heard_from?: string;
  notes?: string;
  status: "pending" | "contacted" | "verified" | "rejected";
  contacted_at?: string;
  rejection_reason?: string;
  internal_notes?: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  registration_request_id?: string;
  name: string;
  slug: string;
  owner_name?: string;
  phone: string;
  email: string;
  city?: string;
  address?: string;
  restaurant_type?: string;
  logo_url?: string;
  qr_code_url?: string;
  subscription_plan: "free_trial" | "starter" | "pro" | "enterprise";
  status: "active" | "blocked" | "trial";
  is_active: boolean;
  internal_notes?: string;
  block_reason?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  restaurant_id?: string;
  email: string;
  password_hash: string;
  temp_password: boolean;
  role: "owner" | "staff";
  created_at: string;
}

export interface MenuItem {
  _id?: string;
  id?: string;
  restaurantId: string;
  name: string;
  description?: string;
  basePrice: number;
  category?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  sizes?: { name: string; price: number }[];
  addons?: { name: string; price: number }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  _id?: string;
  id?: string;
  restaurantId: string;
  orderNumber: string;
  orderType: "qr" | "counter" | "phone" | "table";
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  status:
    | "pending"
    | "accepted"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled"
    | "rejected";
  paymentMethod?: string;
  paymentStatus?: string;
  paymentTransactionId?: string;
  customerNotes?: string;
  internalNotes?: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItemId: string;
  name?: string;
  quantity: number;
  basePrice?: number;
  selectedSize?: { name: string; price: number };
  selectedAddons?: { name: string; price: number }[];
  itemTotal?: number;
  specialInstructions?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  created_at: string;
}
