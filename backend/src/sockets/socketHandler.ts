import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import cookieParse from "cookie";

let ioInstance: SocketServer | null = null;

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized!");
  }
  return ioInstance;
};

export const initSockets = (httpServer: HttpServer) => {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/+$/, ""))
    : ["http://localhost:5173"];

  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV !== "production") return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });

  ioInstance = io;

  // ─── Socket Authentication Middleware ───────────────────────────────────────
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) {
        // Allow anonymous customer connections instead of throwing
        (socket as any).user = { role: "customer", id: "anonymous", restaurantId: null };
        return next();
      }

      const cookies = cookieParse.parse(cookieHeader);
      const token = cookies["token"];

      if (!token) {
        // Allow anonymous customer connections
        (socket as any).user = { role: "customer", id: "anonymous", restaurantId: null };
        return next();
      }

      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return next(new Error("Authentication error: Server misconfiguration"));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: string;
        restaurantId?: string;
      };

      // Store verified user on socket
      (socket as any).user = {
        id: decoded.id,
        role: decoded.role,
        restaurantId: decoded.restaurantId || null,
      };

      return next();
    } catch (err) {
      // If token is invalid, fallback to anonymous rather than strict reject, 
      // because they might just be a customer with an expired old token.
      (socket as any).user = { role: "customer", id: "anonymous", restaurantId: null };
      return next();
    }
  });

  // ─── Connection Handler ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const user = (socket as any).user as {
      id: string;
      role: string;
      restaurantId: string | null;
    };

    if (user.role === "admin") {
      socket.join("admin_room");
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Socket] Admin ${user.id} joined admin_room`);
      }
    } else if (user.restaurantId) {
      const tenantRoom = `tenant_${user.restaurantId}`;
      socket.join(tenantRoom);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Socket] Restaurant user joined ${tenantRoom}`);
      }
    } else if (user.role === "customer") {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Socket] Public customer connected`);
      }
    } else {
      socket.disconnect(true);
      return;
    }

    // Secure order tracking handler (Available to all roles for testing)
    socket.on("join_order_room", async (data: { orderId: string, trackingToken: string }, callback) => {
      try {
        if (!data || !data.orderId || !data.trackingToken) {
          if (callback) callback({ success: false, message: "Missing tracking credentials" });
          return;
        }
        
        // Verify against MongoDB securely (dynamic import to avoid circular dependencies if any)
        const Order = (await import("../models/Order")).default;
        const order = await Order.findOne({ 
          _id: data.orderId, 
          trackingToken: data.trackingToken 
        }).select('_id status');
        
        if (!order) {
          if (callback) callback({ success: false, message: "Invalid tracking token" });
          return;
        }
        
        const orderRoom = `order_${data.orderId}`;
        socket.join(orderRoom);
        
        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket] Client successfully joined ${orderRoom}`);
        }
        
        if (callback) callback({ success: true, status: order.status });
      } catch (error) {
        if (callback) callback({ success: false, message: "Server error" });
      }
    });

    // Public restaurant profile room for real-time sync (Available to all roles)
    socket.on("join_restaurant_room", (restaurantId: string) => {
      if (restaurantId) {
        const publicRoom = `public_restaurant_${restaurantId}`;
        socket.join(publicRoom);
        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket] Client joined ${publicRoom}`);
        }
      }
    });

    socket.on("disconnect", () => {
      // Rooms are left automatically on disconnect
    });
  });

  return io;
};
